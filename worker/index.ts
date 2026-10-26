import { Keypair, nativeToScVal } from "@stellar/stellar-sdk";
import { timingSafeEqual } from "node:crypto";
import {
  address,
  u64,
  u256,
  bytes,
  vec,
  claim,
  proofScVal,
  fieldHash,
  ledgerTime,
  read,
  submit,
  ChainRejection,
} from "./chain";

type Role = "buyer" | "seller" | "issuer" | "judge";
type Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
};
type Receipt = {
  label: string;
  hash?: string;
  ledger?: number;
  explorer?: string;
  outcome?: string;
  phase?: string;
};
type Bundle = {
  keys: Record<"admin" | "financial" | "property" | "buyer" | "seller", string>;
  set: {
    root: string;
    credentials: Record<string, string>[];
    paths: { pathElements: string[]; pathIndices: number[] }[];
  };
  buyerGate: string;
  dealGate: string;
  rootExpires: number;
  registration: Receipt;
};
type State = {
  id: string;
  csrf: string;
  role: Role;
  dealId: string;
  recipientHash: string;
  validUntil: number;
  financialPolicy: boolean;
  propertyPolicy: boolean;
  qualified: boolean;
  proof?: Proof;
  signals?: string[];
  createdAt: number;
};
type Status = {
  buyer_valid: boolean;
  property_valid: boolean;
  buyer_consent: boolean;
  seller_consent: boolean;
  unlocked: boolean;
};
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const json = (value: unknown, status = 200, extra: HeadersInit = {}) =>
  new Response(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...extra,
      },
    },
  );
const empty: Status = {
  buyer_valid: false,
  property_valid: false,
  buyer_consent: false,
  seller_consent: false,
  unlocked: false,
};
const roles: Role[] = ["buyer", "seller", "issuer", "judge"];
const key = (b: Bundle, role: keyof Bundle["keys"]) =>
  Keypair.fromSecret(b.keys[role]);
const hash = async (value: string) => {
  const data = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(data), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
};
const now = () => Math.floor(Date.now() / 1000);
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new HttpError(415, "Use a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) return {};
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 16384) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    joined.set(c, offset);
    offset += c.length;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(joined));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
      throw Error();
    return parsed;
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}
async function load(request: Request, env: Env) {
  const token = request.headers
    .get("Cookie")
    ?.match(/(?:^|;\s*)dp_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) throw new HttpError(401, "Start a private demo session first.");
  const tokenHash = await hash(token);
  const row = await env.DB.prepare(
    "SELECT state FROM sessions WHERE token_hash=? AND expires_at>?",
  )
    .bind(tokenHash, now())
    .first<{ state: string }>();
  if (!row)
    throw new HttpError(401, "Your demo session expired. Start a new session.");
  return { tokenHash, state: JSON.parse(row.state) as State };
}
const save = (env: Env, tokenHash: string, state: State) =>
  env.DB.prepare("UPDATE sessions SET state=? WHERE token_hash=?")
    .bind(JSON.stringify(state), tokenHash)
    .run();
async function event(env: Env, state: State, receipt: Receipt) {
  await env.DB.prepare(
    "INSERT INTO events(session_id,label,payload,created_at) VALUES(?,?,?,?)",
  )
    .bind(state.id, receipt.label, JSON.stringify(receipt), now())
    .run();
  return receipt;
}
type Activity = {
  label: string;
  outcome: "running" | "success" | "rejected" | "failed";
  source: "server" | "testnet" | "browser";
  hash?: string;
};
async function activity(env: Env, state: State, item: Activity) {
  const createdAt = Date.now();
  await env.DB.prepare(
    "INSERT INTO activity(session_id,payload,created_at) VALUES(?,?,?)",
  )
    .bind(state.id, JSON.stringify(item), createdAt)
    .run();
}
async function activities(env: Env, state: State) {
  const rows = await env.DB.prepare(
    "SELECT id,payload,created_at FROM activity WHERE session_id=? ORDER BY id DESC LIMIT 100",
  )
    .bind(state.id)
    .all<{ id: number; payload: string; created_at: number }>();
  return rows.results.map((row) => ({
    ...(JSON.parse(row.payload) as Activity),
    id: row.id,
    createdAt: row.created_at,
  }));
}
async function chainStatus(state: State, b: Bundle): Promise<Status> {
  if (!state.propertyPolicy) return { ...empty };
  return (await read(key(b, "admin"), b.dealGate, "status", [
    u256(state.dealId),
    address(key(b, "buyer").publicKey()),
  ])) as Status;
}
async function snapshot(env: Env, state: State, b: Bundle) {
  const [status, time, events] = await Promise.all([
    chainStatus(state, b),
    ledgerTime(),
    env.DB.prepare(
      "SELECT payload FROM events WHERE session_id=? ORDER BY id DESC",
    )
      .bind(state.id)
      .all<{ payload: string }>(),
  ]);
  return {
    sessionId: state.id,
    sessionExpires: state.validUntil,
    propertyExpires: state.validUntil,
    csrf: state.csrf,
    role: state.role,
    dealId: state.dealId,
    prepared: state.financialPolicy && state.propertyPolicy,
    qualified: state.qualified,
    status,
    ledgerTime: time,
    epoch: Math.floor(time / 300),
    proofExpires: state.signals
      ? Math.min(
          (Number(state.signals[5]) + 1) * 300 - 1,
          state.validUntil,
          b.rootExpires,
        )
      : undefined,
    rootExpires: b.rootExpires,
    contracts: { buyer: b.buyerGate, deal: b.dealGate },
    accounts: {
      buyer: key(b, "buyer").publicKey(),
      seller: key(b, "seller").publicKey(),
    },
    root: b.set.root,
    registration: b.registration,
    events: events.results.map((e) => JSON.parse(e.payload) as Receipt),
  };
}
async function locked<T>(env: Env, action: () => Promise<T>) {
  const owner = crypto.randomUUID();
  const result = await env.DB.prepare(
    "INSERT INTO locks(name,owner,expires_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at WHERE locks.expires_at<?",
  )
    .bind("testnet-signers", owner, now() + 100, now())
    .run();
  if (result.meta.changes !== 1)
    throw new HttpError(
      409,
      "Another Testnet operation is confirming. Try again in a few seconds.",
    );
  try {
    return await action();
  } finally {
    await env.DB.prepare("DELETE FROM locks WHERE name=? AND owner=?")
      .bind("testnet-signers", owner)
      .run();
  }
}
async function api(request: Request, env: Env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method !== "GET" && request.method !== "POST")
    throw new HttpError(405, "Method not supported.");
  if (request.method === "POST" && request.headers.get("Origin") !== url.origin)
    throw new HttpError(403, "This request must come from the demo website.");
  const b = JSON.parse(env.DEMO_BUNDLE) as Bundle;
  if (path === "/api/health")
    return json({ ok: true, network: "Stellar Testnet", synthetic: true });
  if (path === "/api/session" && request.method === "POST") {
    await body(request);
    const ipHash = await hash(
      request.headers.get("CF-Connecting-IP") ?? "local",
    );
    const rate = await env.DB.prepare(
      "INSERT INTO locks(name,owner,expires_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at WHERE locks.expires_at<?",
    )
      .bind(`session-rate:${ipHash}`, crypto.randomUUID(), now() + 15, now())
      .run();
    if (rate.meta.changes !== 1)
      throw new HttpError(
        429,
        "Please wait 15 seconds before starting another session.",
      );
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM sessions WHERE expires_at>?",
    )
      .bind(now())
      .first<{ total: number }>();
    if ((count?.total ?? 0) > 100)
      throw new HttpError(
        429,
        "The shared demo is busy. Please try again later.",
      );
    const time = await ledgerTime();
    if (time >= b.rootExpires)
      throw new HttpError(
        503,
        "The synthetic issuer batch has expired. A new batch must be published.",
      );
    const token =
      crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", "");
    const id = crypto.randomUUID();
    const state: State = {
      id,
      csrf: crypto.randomUUID(),
      role: "buyer",
      dealId: await fieldHash(id),
      recipientHash: await fieldHash(key(b, "buyer").publicKey()),
      validUntil: Math.min(time + 1200, b.rootExpires),
      financialPolicy: false,
      propertyPolicy: false,
      qualified: false,
      createdAt: now(),
    };
    await env.DB.batch([
      env.DB.prepare("DELETE FROM activity WHERE created_at<?").bind(
        Date.now() - 86400000,
      ),
      env.DB.prepare("DELETE FROM events WHERE created_at<?").bind(
        now() - 86400,
      ),
      env.DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(
        now() - 86400,
      ),
      env.DB.prepare("DELETE FROM locks WHERE expires_at<?").bind(now() - 120),
      env.DB.prepare(
        "INSERT INTO sessions(token_hash,state,expires_at) VALUES(?,?,?)",
      ).bind(await hash(token), JSON.stringify(state), state.validUntil),
    ]);
    await activity(env, state, {
      label: "Private demo session created · deal expires in up to 20 minutes",
      outcome: "success",
      source: "server",
    });
    return json(await snapshot(env, state, b), 201, {
      "Set-Cookie": `dp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1200${url.protocol === "https:" ? "; Secure" : ""}`,
    });
  }
  const { tokenHash, state } = await load(request, env);
  if (path === "/api/activity" && request.method === "GET")
    return json({ activity: await activities(env, state) });
  if (path === "/api/status" && request.method === "GET")
    return json(await snapshot(env, state, b));
  if (path === "/api/dossier" && request.method === "GET") {
    if (state.role !== "buyer")
      throw new HttpError(
        403,
        "The disclosed dossier is available to the qualified buyer persona.",
      );
    if (!(await chainStatus(state, b)).unlocked)
      throw new HttpError(
        403,
        "The room is locked. Both valid passports and both consents are required.",
      );
    return json({
      synthetic: true,
      title: "Casa do Pátio — synthetic dossier",
      address: "Rua do Exemplo 24, Lisbon — fictional address",
      seller: "Demo seller S-017 — fictional identity",
      document: "DP-017 / Marketing authority",
      summary:
        "Synthetic reviewer confirms that demo seller S-017 is authorized to market this fictional property. This document is a demonstration artifact, not legal evidence.",
      scope:
        "AUTHORIZED_TO_MARKET. No ownership, title, planning approval, valuation or legal due diligence is asserted.",
      property: {
        type: "Courtyard residence",
        area: "186 m² (illustrative)",
        bedrooms: 3,
        askingPrice: "€750,000 (illustrative)",
      },
      disclosedAt: new Date().toISOString(),
    });
  }
  if (request.method !== "POST")
    throw new HttpError(404, "API route not found.");
  const csrf = request.headers.get("X-Demo-CSRF") ?? "";
  if (
    !/^[a-f0-9-]{36}$/.test(csrf) ||
    !timingSafeEqual(Buffer.from(csrf), Buffer.from(state.csrf))
  )
    throw new HttpError(403, "Refresh the page before trying again.");
  const input = await body(request);
  if (path === "/api/circuit-result") {
    if (state.role !== "buyer" && state.role !== "judge")
      throw new HttpError(
        403,
        "Switch to buyer or judge mode to report a circuit check.",
      );
    if (
      (input.scenario !== "underfunded" && input.scenario !== "expired") ||
      Object.keys(input).some((k) => k !== "scenario")
    )
      throw new HttpError(400, "Choose a supported negative circuit check.");
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM activity WHERE session_id=? AND created_at>?",
    )
      .bind(state.id, Date.now() - 60000)
      .first<{ total: number }>();
    if ((count?.total ?? 0) >= 100)
      throw new HttpError(
        429,
        "Too many operation reports. Please wait a minute.",
      );
    await activity(env, state, {
      label: `${input.scenario === "underfunded" ? "Underfunded" : "Expired"} credential rejected by the circuit. No proof or transaction was created.`,
      outcome: "rejected",
      source: "browser",
    });
    return json({ activity: await activities(env, state) });
  }
  return locked(env, async () => {
    // Reload under the mutation lock so concurrent tabs cannot overwrite state.
    const latest = await load(request, env);
    const s = latest.state;
    const invoke = async (
      role: keyof Bundle["keys"],
      contract: string,
      fn: string,
      args: Parameters<typeof submit>[3],
      label: string,
    ) => {
      try {
        const receipt = await submit(
          key(b, role),
          contract,
          fn,
          args,
          async (phase, hash) => {
            await activity(env, s, {
              label: `${label} · ${phase}`,
              outcome: "running",
              source: "testnet",
              ...(hash ? { hash } : {}),
            });
          },
        );
        await activity(env, s, {
          label,
          outcome: "success",
          source: "testnet",
          hash: receipt.hash,
        });
        return await event(env, s, { label, ...receipt });
      } catch (error) {
        await activity(env, s, {
          label: `${label} · ${error instanceof ChainRejection ? `Rejected during ${error.phase}` : "Could not confirm; check any submitted transaction before retrying"}`,
          outcome: error instanceof ChainRejection ? "rejected" : "failed",
          source: "testnet",
          ...(error instanceof ChainRejection && error.hash
            ? { hash: error.hash }
            : {}),
        });
        throw error;
      }
    };
    if (path === "/api/persona") {
      if (!roles.includes(input.role as Role))
        throw new HttpError(400, "Choose a demo persona.");
      s.role = input.role as Role;
    } else if (path === "/api/prepare") {
      if (!s.financialPolicy) {
        await invoke(
          "admin",
          b.buyerGate,
          "create_deal",
          [u256(s.dealId), u64(75000000), u64(s.validUntil)],
          "€750k buyer policy created",
        );
        s.financialPolicy = true;
        await save(env, tokenHash, s);
      }
      if (!s.propertyPolicy) {
        const commitment = new Uint8Array(32);
        crypto.getRandomValues(commitment);
        await invoke(
          "admin",
          b.dealGate,
          "create_deal",
          [
            u256(s.dealId),
            address(key(b, "seller").publicKey()),
            bytes(Buffer.from(commitment)),
            claim(),
            u64(s.validUntil),
          ],
          "Private property policy created",
        );
        s.propertyPolicy = true;
        await save(env, tokenHash, s);
      }
    } else {
      if (!s.financialPolicy || !s.propertyPolicy)
        throw new HttpError(409, "Prepare this deal before continuing.");
      if (path === "/api/credential") {
        if (s.role !== "buyer" && s.role !== "judge")
          throw new HttpError(
            403,
            "Switch to the buyer persona to use the private synthetic credential.",
          );
        const index =
          input.scenario === "underfunded"
            ? 1
            : input.scenario === "expired"
              ? 2
              : 0;
        const time = await ledgerTime();
        return json({
          witness: {
            ...b.set.credentials[index],
            ...b.set.paths[index],
            issuerRoot: b.set.root,
            dealIdHash: s.dealId,
            recipientHash: s.recipientHash,
            requiredThresholdCents: "75000000",
            currentEpoch: String(Math.floor(time / 300)),
            proofVersion: 1,
          },
          epoch: Math.floor(time / 300),
          secondsRemaining: 300 - (time % 300),
          synthetic: true,
        });
      } else if (path === "/api/qualify") {
        if (s.role !== "buyer")
          throw new HttpError(
            403,
            "Only the buyer persona can submit its proof.",
          );
        const signals = input.publicSignals;
        if (
          !Array.isArray(signals) ||
          signals.length !== 8 ||
          !signals.every((x) => typeof x === "string" && /^\d{1,78}$/.test(x))
        )
          throw new HttpError(400, "Invalid proof statement.");
        const epoch = Math.floor((await ledgerTime()) / 300);
        if (
          signals[2] !== b.set.root ||
          signals[3] !== s.dealId ||
          signals[4] !== "75000000" ||
          signals[5] !== String(epoch) ||
          signals[6] !== "1" ||
          signals[7] !== s.recipientHash
        )
          throw new HttpError(
            409,
            "This proof no longer matches the current deal and time window. Generate it again.",
          );
        const proof = input.proof as Proof;
        if (!proof || proof.protocol !== "groth16" || proof.curve !== "bn128")
          throw new HttpError(400, "Invalid Groth16 proof.");
        await invoke(
          "buyer",
          b.buyerGate,
          "qualify",
          [
            address(key(b, "buyer").publicKey()),
            proofScVal(proof),
            vec(signals.map(u256)),
          ],
          "Buyer proof verified on Stellar",
        );
        s.proof = proof;
        s.signals = signals;
        s.qualified = true;
      } else if (path === "/api/property") {
        if (s.role !== "seller" && s.role !== "issuer")
          throw new HttpError(403, "Switch to the seller or issuer persona.");
        await invoke(
          "property",
          b.dealGate,
          "attest",
          [u256(s.dealId), claim(), u64(s.validUntil)],
          "Synthetic reviewer attests marketing authority",
        );
      } else if (path === "/api/consent") {
        if (s.role !== "buyer" && s.role !== "seller")
          throw new HttpError(
            403,
            "Choose the buyer or seller persona to consent.",
          );
        const who = key(b, s.role).publicKey();
        await invoke(
          s.role,
          b.dealGate,
          "consent",
          [
            u256(s.dealId),
            address(key(b, "buyer").publicKey()),
            address(who),
            nativeToScVal(input.accepted === true),
          ],
          `${s.role} ${input.accepted === true ? "consented to disclosure" : "withdrew consent"}`,
        );
      } else if (path === "/api/revoke") {
        if (s.role !== "issuer")
          throw new HttpError(403, "Switch to the issuer persona.");
        await invoke(
          "property",
          b.dealGate,
          "revoke_property",
          [u256(s.dealId)],
          "Property authority revoked",
        );
      } else if (path === "/api/attack") {
        if (s.role !== "judge")
          throw new HttpError(403, "Switch to judge mode to run an attack.");
        const replay = input.scenario === "replay";
        if (replay && (!s.proof || !s.signals))
          throw new HttpError(409, "First submit a valid buyer proof.");
        try {
          if (replay)
            await submit(key(b, "buyer"), b.buyerGate, "qualify", [
              address(key(b, "buyer").publicKey()),
              proofScVal(s.proof!),
              vec(s.signals!.map(u256)),
            ]);
          else
            await submit(key(b, "buyer"), b.dealGate, "attest", [
              u256(s.dealId),
              claim(),
              u64(s.validUntil),
            ]);
          throw Error("The negative test unexpectedly succeeded.");
        } catch (error) {
          if (!(error instanceof ChainRejection)) throw error;
          const contractCode = error.detail.match(/Contract, #(\d+)/)?.[1];
          const label = replay
            ? "Replayed proof rejected"
            : "Forged property issuer rejected";
          await activity(env, s, {
            label: `${label} during ${error.phase}${error.hash ? "" : " · No transaction submitted"}`,
            outcome: "rejected",
            source: "testnet",
            ...(error.hash ? { hash: error.hash } : {}),
          });
          await event(env, s, {
            label,
            outcome: "rejected",
            phase: error.phase,
            ...(error.hash
              ? {
                  hash: error.hash,
                  explorer: `https://stellar.expert/explorer/testnet/tx/${error.hash}`,
                }
              : {}),
          });
          return json({
            rejected: true,
            label,
            phase: error.phase,
            contractCode,
            ...(await snapshot(env, s, b)),
          });
        }
      } else throw new HttpError(404, "API route not found.");
    }
    await save(env, tokenHash, s);
    return json(await snapshot(env, s, b));
  });
}
export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith("/api/"))
      return env.ASSETS.fetch(request);
    try {
      return await api(request, env);
    } catch (error) {
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      if (error instanceof ChainRejection)
        return json(
          {
            error:
              "The onchain policy rejected this action. Refresh the status and check both passports.",
            phase: error.phase,
          },
          422,
        );
      console.error(
        JSON.stringify({
          event: "api_failure",
          path: new URL(request.url).pathname,
          errorType: error instanceof Error ? error.name : "Unknown",
        }),
      );
      return json(
        {
          error:
            error instanceof Error && error.message.startsWith("Testnet")
              ? error.message
              : "The demo could not complete this operation. Refresh and try again.",
        },
        503,
      );
    }
  },
} satisfies ExportedHandler<Env>;
