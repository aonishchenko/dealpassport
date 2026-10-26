import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UnlockKeyhole,
  X,
} from "lucide-react";

type Role = "buyer" | "seller" | "issuer" | "judge";
type Receipt = {
  label: string;
  hash?: string;
  ledger?: number;
  explorer?: string;
  outcome?: string;
  phase?: string;
};
type State = {
  sessionId: string;
  csrf: string;
  role: Role;
  dealId: string;
  prepared: boolean;
  qualified: boolean;
  status: {
    buyer_valid: boolean;
    property_valid: boolean;
    buyer_consent: boolean;
    seller_consent: boolean;
    unlocked: boolean;
  };
  ledgerTime: number;
  epoch: number;
  proofExpires?: number;
  rootExpires: number;
  contracts: { buyer: string; deal: string };
  accounts: { buyer: string; seller: string };
  root: string;
  registration: Receipt;
  events: Receipt[];
};
type Dossier = {
  title: string;
  address: string;
  seller: string;
  document: string;
  summary: string;
  scope: string;
  property: {
    type: string;
    area: string;
    bedrooms: number;
    askingPrice: string;
  };
};
type ProverResult = {
  ok: boolean;
  proof: unknown;
  publicSignals: string[];
  milliseconds: number;
};
const routes: Record<Role, string> = {
  buyer: "/buyer/passport",
  seller: "/seller/passport",
  issuer: "/issuers",
  judge: "/judge",
};
const names: Record<Role, string> = {
  buyer: "Buyer passport",
  seller: "Property passport",
  issuer: "Issuer console",
  judge: "Judge demo",
};
const short = (s: string) => s.slice(0, 7) + "…" + s.slice(-6);
const formatTime = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
async function api<T>(
  path: string,
  input?: unknown,
  csrf?: string,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: input !== undefined ? "POST" : "GET",
    headers:
      input !== undefined
        ? { "Content-Type": "application/json", "X-Demo-CSRF": csrf ?? "" }
        : {},
    ...(input !== undefined ? { body: JSON.stringify(input) } : {}),
  });
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw Error(value.error ?? "The demo is unavailable. Try again.");
  return value;
}
export default function App() {
  const [state, setState] = useState<State | null>(null),
    [path, setPath] = useState(location.pathname),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scenario, setScenario] = useState("valid"),
    [checks, setChecks] = useState<string[]>([]),
    [proofMs, setProofMs] = useState<number>(),
    [dossier, setDossier] = useState<Dossier | null>(null),
    [clock, setClock] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const role: Role =
    path === "/judge"
      ? "judge"
      : path === "/issuers"
        ? "issuer"
        : path.startsWith("/seller")
          ? "seller"
          : "buyer";
  const home = path === "/";
  const room = path.endsWith("/room");
  useEffect(() => {
    const pop = () => {
      setPath(location.pathname);
      setDossier(null);
    };
    addEventListener("popstate", pop);
    api<State>("status")
      .then(setState)
      .catch(() => {})
      .finally(() => setLoading(false));
    const timer = setInterval(() => setClock((x) => x + 1), 1000);
    return () => {
      removeEventListener("popstate", pop);
      clearInterval(timer);
    };
  }, []);
  // Refresh chain state in the background; private dossier content is cleared as
  // soon as a passport expires or a fresh read loses an authorization condition.
  useEffect(() => {
    if (!state || busy || home || state.role === role) return;
    api<State>("persona", { role }, state.csrf)
      .then(setState)
      .catch(() => {});
  }, [path, state?.sessionId, busy]);
  useEffect(() => {
    if (!state) return;
    const timer = setInterval(() => {
      if (busy) return;
      api<State>("status")
        .then((s) => {
          setState(s);
          if (!s.status.unlocked) setDossier(null);
        })
        .catch(() => {
          setDossier(null);
        });
    }, 12000);
    return () => clearInterval(timer);
  }, [state?.sessionId, busy]);
  const expires = state?.proofExpires
    ? Math.ceil(state.proofExpires - Date.now() / 1000)
    : 0;
  useEffect(() => {
    if (state?.qualified && expires <= 0) setDossier(null);
  }, [clock, state?.qualified, expires]);
  const buyerValid = Boolean(state?.status.buyer_valid && expires > 0);
  const unlocked = Boolean(state?.status.unlocked && buyerValid);
  async function task(label: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The operation failed. Try again.",
      );
    } finally {
      setBusy("");
    }
  }
  function move(next: string) {
    history.pushState({}, "", next);
    setPath(next);
    setDossier(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function changeRole(next: Role) {
    await task("Switching demo persona…", async () => {
      if (stateRef.current) {
        const s = await api<State>(
          "persona",
          { role: next },
          stateRef.current.csrf,
        );
        setState(s);
      }
      move(routes[next]);
    });
  }
  async function start(next: Role = "buyer") {
    await task("Creating your private demo session…", async () => {
      let s = await api<State>("session", {});
      setState(s);
      setDossier(null);
      setChecks([]);
      setProofMs(undefined);
      setBusy("Creating the deal policies on Stellar Testnet…");
      s = await api<State>("prepare", {}, s.csrf);
      if (next !== "buyer")
        s = await api<State>("persona", { role: next }, s.csrf);
      setState(s);
      move(routes[next]);
      setNotice(
        "Your unique demo deal is ready. Start with the seller’s authority or the buyer’s proof.",
      );
    });
  }
  async function mutate(endpoint: string, input: unknown, label: string) {
    await task(label, async () => {
      const s = await api<State>(endpoint, input, stateRef.current?.csrf);
      setState(s);
      setDossier(null);
    });
  }
  async function prove(testScenario = scenario) {
    await task(
      testScenario === "valid"
        ? "Preparing your private credential…"
        : "Checking the negative credential…",
      async () => {
        let current = stateRef.current;
        if (!current) throw Error("Start a demo session first.");
        if (current.role !== "buyer" && current.role !== "judge") {
          current = await api<State>(
            "persona",
            { role: "buyer" },
            current.csrf,
          );
          setState(current);
        }
        let credential = await api<{
          witness: Record<string, unknown>;
          secondsRemaining: number;
        }>("credential", { scenario: testScenario }, current.csrf);
        while (testScenario === "valid" && credential.secondsRemaining < 45) {
          setBusy("Waiting for a fresh proof window…");
          await new Promise((r) => setTimeout(r, 5000));
          credential = await api(
            "credential",
            { scenario: testScenario },
            current.csrf,
          );
        }
        setBusy("Generating the Groth16 proof privately in your browser…");
        const result = await new Promise<ProverResult>((resolve, reject) => {
          const worker = new Worker(
            new URL("./prover.worker.ts", import.meta.url),
            { type: "module" },
          );
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(
              Error(
                "Proof generation took too long. Try again on a desktop browser.",
              ),
            );
          }, 90000);
          worker.onmessage = (e) => {
            clearTimeout(timeout);
            worker.terminate();
            resolve(e.data);
          };
          worker.onerror = () => {
            clearTimeout(timeout);
            worker.terminate();
            reject(
              Error(
                "The browser prover could not start. Refresh and try again.",
              ),
            );
          };
          worker.postMessage(credential.witness);
        });
        if (!result.ok) {
          if (testScenario === "valid")
            throw Error(
              "The credential could not produce a proof. Start a new demo session.",
            );
          const label = `${testScenario === "underfunded" ? "Underfunded" : "Expired"} credential rejected by the circuit`;
          setChecks((c) => [label, ...c]);
          setNotice(label + ". No proof or transaction was created.");
          return;
        }
        if (testScenario !== "valid")
          throw Error("The negative credential unexpectedly produced a proof.");
        setProofMs(result.milliseconds);
        setBusy("Verifying your proof on Stellar Testnet…");
        if (current.role !== "buyer")
          current = await api<State>(
            "persona",
            { role: "buyer" },
            current.csrf,
          );
        const verified = await api<State>(
          "qualify",
          { proof: result.proof, publicSignals: result.publicSignals },
          current.csrf,
        );
        setState(verified);
        setNotice(
          "Your proof is verified. The seller sees that you meet €750,000, never your exact balance.",
        );
      },
    );
  }
  async function attack(which: string) {
    await task("Testing the live contract policy…", async () => {
      const result = await api<State & { label: string; phase: string }>(
        "attack",
        { scenario: which },
        stateRef.current?.csrf,
      );
      setState(result);
      setNotice(
        `${result.label} during ${result.phase}. ${result.phase === "simulation" ? "No rejected transaction was submitted." : ""}`,
      );
    });
  }
  async function openRoom() {
    await task("Rechecking both passports and consents onchain…", async () => {
      if (stateRef.current?.role !== "buyer") {
        const s = await api<State>(
          "persona",
          { role: "buyer" },
          stateRef.current?.csrf,
        );
        setState(s);
      }
      const doc = await api<Dossier>("dossier");
      move("/deal/sample/room");
      setDossier(doc);
    });
  }
  const block = Boolean(busy) || !state?.prepared;
  const conditions = [
    {
      label: "Buyer meets €750,000",
      detail: "Issuer-backed private balance proof",
      valid: buyerValid,
    },
    {
      label: "Seller may market this property",
      detail: "Authorized synthetic reviewer",
      valid: state?.status.property_valid,
    },
    {
      label: "Buyer consents to disclosure",
      detail: "Authenticated buyer account",
      valid: state?.status.buyer_consent,
    },
    {
      label: "Seller consents to disclosure",
      detail: "Authenticated seller account",
      valid: state?.status.seller_consent,
    },
  ];
  const NavLink = ({
    to,
    children,
  }: {
    to: Role;
    children: React.ReactNode;
  }) => (
    <a
      href={routes[to]}
      aria-current={role === to && !home ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        void changeRole(to);
      }}
    >
      {children}
    </a>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            move("/");
          }}
          aria-label="Deal Passport home"
        >
          <Fingerprint aria-hidden="true" />
          <span>Deal Passport</span>
        </a>
        <nav aria-label="Main navigation">
          <NavLink to="buyer">The deal</NavLink>
          <NavLink to="issuer">Issuers</NavLink>
          <NavLink to="judge">Judge demo</NavLink>
        </nav>
        <span className="network">
          <span />
          Stellar Testnet
        </span>
      </header>
      <main id="main" className="page">
        {home ? (
          <section className="welcome">
            <div className="welcome-copy">
              <h1>
                A private deal.
                <br />A qualified introduction.
              </h1>
              <p>
                A seller needs to know you can buy. You need to know they can
                sell. Prove both before either side shares what matters.
              </p>
              <div className="actions">
                <button
                  className="primary"
                  onClick={() => void start("buyer")}
                  disabled={Boolean(busy) || loading}
                >
                  Try the private deal <ArrowRight size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => void start("judge")}
                  disabled={Boolean(busy) || loading}
                >
                  Explore as a judge <ArrowUpRight size={16} />
                </button>
              </div>
              <p className="fine-print">
                A working demo with synthetic credentials and real proof
                verification on Stellar Testnet.
              </p>
            </div>
            <div className="intro-preview">
              <div className="preview-top">
                <span>Private introduction</span>
                <LockKeyhole size={20} />
              </div>
              <h2>Lisbon courtyard residence</h2>
              <p className="preview-price">
                €750,000 <span>qualification threshold</span>
              </p>
              <div className="preview-line">
                <span>Buyer’s exact balance</span>
                <span className="redacted">Private</span>
              </div>
              <div className="preview-line">
                <span>Property identity & documents</span>
                <span className="redacted">Private</span>
              </div>
              <div className="preview-bottom">
                <ShieldCheck size={20} />
                <p>
                  Mutual proof first.
                  <br />
                  Disclosure by mutual consent.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="deal-heading">
              <div>
                <h1>
                  {room
                    ? "Your private deal room"
                    : "A qualified introduction."}
                </h1>
                <p>
                  Lisbon courtyard residence <span className="inline-rule" />{" "}
                  Synthetic off-market deal
                </p>
              </div>
              <div className="deal-price">
                €750,000<span>Buyer qualification threshold</span>
              </div>
            </div>
            <div className="demo-note">
              <ShieldCheck size={17} />
              <p>
                Demo mode. Both issuers, all credentials and this property are
                synthetic. Onchain verification and access checks are real.
              </p>
            </div>
            {!state ? (
              <section className="start-prompt">
                <h2>Two passports. One private deal.</h2>
                <p>
                  Start a private session to create your deal policies on
                  Testnet. You can switch between all four demo personas.
                </p>
                <button
                  className="primary"
                  disabled={Boolean(busy) || loading}
                  onClick={() => void start(role)}
                >
                  Start {role === "judge" ? "judge" : "demo"} session{" "}
                  <ArrowRight size={16} />
                </button>
              </section>
            ) : (
              <div className="workspace">
                <section className="work-main" aria-label="Passport workspace">
                  <div className="persona-bar">
                    <span>View as</span>
                    <div className="persona-tabs" aria-label="Demo persona">
                      {(["buyer", "seller", "issuer", "judge"] as Role[]).map(
                        (r) => (
                          <button
                            key={r}
                            aria-pressed={role === r && !room}
                            disabled={Boolean(busy)}
                            onClick={() => void changeRole(r)}
                          >
                            {r === "issuer"
                              ? "Issuer"
                              : r === "judge"
                                ? "Judge"
                                : r === "buyer"
                                  ? "Buyer"
                                  : "Seller"}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  {room && dossier ? (
                    <article className="dossier">
                      <div className="passport-heading">
                        <UnlockKeyhole size={24} />
                        <span className="status-label success">
                          Disclosed to qualified buyer
                        </span>
                      </div>
                      <h2>{dossier.title}</h2>
                      <p className="dossier-address">{dossier.address}</p>
                      <dl className="facts">
                        <div>
                          <dt>Property</dt>
                          <dd>{dossier.property.type}</dd>
                        </div>
                        <div>
                          <dt>Area</dt>
                          <dd>{dossier.property.area}</dd>
                        </div>
                        <div>
                          <dt>Rooms</dt>
                          <dd>{dossier.property.bedrooms} bedrooms</dd>
                        </div>
                        <div>
                          <dt>Asking price</dt>
                          <dd>{dossier.property.askingPrice}</dd>
                        </div>
                      </dl>
                      <div className="document">
                        <FileText size={28} />
                        <div>
                          <h3>{dossier.document}</h3>
                          <p>{dossier.summary}</p>
                          <p>{dossier.scope}</p>
                        </div>
                      </div>
                      <p className="fine-print">
                        Synthetic identity: {dossier.seller}. Withdrawal locks
                        future access; information already viewed cannot be
                        erased from a recipient’s memory or device.
                      </p>
                      <button
                        className="secondary"
                        disabled={Boolean(busy)}
                        onClick={() =>
                          void mutate(
                            "consent",
                            { accepted: false },
                            "Withdrawing buyer disclosure consent…",
                          )
                        }
                      >
                        Withdraw buyer consent
                      </button>
                    </article>
                  ) : room ? (
                    <div className="passport">
                      <LockKeyhole size={28} />
                      <h2>The room is locked.</h2>
                      <p>
                        A fresh onchain check must confirm both valid passports
                        and both consents before the server returns any dossier
                        content.
                      </p>
                      <button
                        className="secondary"
                        disabled={!unlocked || Boolean(busy)}
                        onClick={() => void openRoom()}
                      >
                        Recheck and open room <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : role === "buyer" ? (
                    <article className="passport">
                      <div className="passport-heading">
                        <Fingerprint size={26} />
                        <span
                          className={
                            "status-label " + (buyerValid ? "success" : "")
                          }
                        >
                          {buyerValid
                            ? "Qualified onchain"
                            : "Private buyer credential"}
                        </span>
                      </div>
                      <h2>
                        Your qualification.
                        <br />
                        Your balance stays yours.
                      </h2>
                      <p>
                        Prove you meet this deal’s €750,000 threshold using a
                        credential from the synthetic financial issuer. The
                        proof is generated in your browser.
                      </p>
                      <label className="field-label" htmlFor="scenario">
                        Synthetic buyer credential
                      </label>
                      <div className="select-wrap">
                        <select
                          id="scenario"
                          value={scenario}
                          onChange={(e) => setScenario(e.target.value)}
                          disabled={Boolean(busy)}
                        >
                          <option value="valid">
                            Eligible buyer · €900,000 · current
                          </option>
                          <option value="underfunded">
                            Underfunded buyer · €400,000
                          </option>
                          <option value="expired">
                            Expired credential · €900,000
                          </option>
                        </select>
                        <ChevronDown size={17} />
                      </div>
                      <p className="field-help">
                        Only this buyer view receives the synthetic private
                        witness. No bank statement, holder secret or exact
                        balance goes onchain.
                      </p>
                      <div className="actions">
                        <button
                          className="primary"
                          disabled={
                            block ||
                            (buyerValid && scenario === "valid") ||
                            Boolean(state.qualified && scenario === "valid")
                          }
                          onClick={() => void prove()}
                        >
                          {buyerValid && scenario === "valid" ? (
                            <>
                              <Check size={17} />
                              Proof verified
                            </>
                          ) : scenario === "valid" ? (
                            <>
                              Prove eligibility <ArrowRight size={17} />
                            </>
                          ) : (
                            <>
                              Test credential <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                        {buyerValid && (
                          <span className="expiry">
                            <Clock size={15} />
                            Valid for {formatTime(expires)}
                          </span>
                        )}
                      </div>
                      {state.qualified && !buyerValid && (
                        <p className="warning">
                          This proof window has expired. Start a fresh demo deal
                          to qualify again.
                        </p>
                      )}
                      {proofMs !== undefined && (
                        <p className="fine-print">
                          Proof generated in {(proofMs / 1000).toFixed(1)}{" "}
                          seconds on this device. Verification receipt below.
                        </p>
                      )}
                      <div className="consent-section">
                        <h3>Consent to the introduction</h3>
                        <p>
                          Allow this qualified seller to proceed with the
                          private introduction. The dossier becomes available to
                          you only when the seller also consents.
                        </p>
                        <button
                          className="secondary"
                          disabled={
                            block ||
                            (!state.status.buyer_consent &&
                              (!buyerValid || !state.status.property_valid))
                          }
                          onClick={() =>
                            void mutate(
                              "consent",
                              { accepted: !state.status.buyer_consent },
                              "Confirming buyer consent on Testnet…",
                            )
                          }
                        >
                          {state.status.buyer_consent
                            ? "Withdraw buyer consent"
                            : "Give buyer consent"}
                          {state.status.buyer_consent ? (
                            <X size={15} />
                          ) : (
                            <ArrowRight size={16} />
                          )}
                        </button>
                      </div>
                    </article>
                  ) : role === "seller" ? (
                    <article className="passport">
                      <div className="passport-heading">
                        <KeyRound size={26} />
                        <span
                          className={
                            "status-label " +
                            (state.status.property_valid ? "success" : "")
                          }
                        >
                          {state.status.property_valid
                            ? "Authority attested"
                            : "Property credential required"}
                        </span>
                      </div>
                      <h2>
                        Prove your authority.
                        <br />
                        Keep the property private.
                      </h2>
                      <p>
                        The preapproved synthetic property reviewer attests your
                        authority to market this specific property. The address
                        and source evidence stay offchain.
                      </p>
                      <dl className="claim-list">
                        <div>
                          <dt>Required claim</dt>
                          <dd>AUTHORIZED_TO_MARKET</dd>
                        </div>
                        <div>
                          <dt>Issuer</dt>
                          <dd>Synthetic property-document reviewer</dd>
                        </div>
                        <div>
                          <dt>Scope</dt>
                          <dd>Marketing authority for this deal only</dd>
                        </div>
                      </dl>
                      <p className="field-help">
                        This claim does not assert ownership, title, planning
                        permission or legal due diligence.
                      </p>
                      <button
                        className="primary"
                        disabled={block || state.status.property_valid}
                        onClick={() =>
                          void mutate(
                            "property",
                            {},
                            "Recording the authorized reviewer’s attestation…",
                          )
                        }
                      >
                        {state.status.property_valid ? (
                          <>
                            <Check size={17} />
                            Authority attested
                          </>
                        ) : (
                          <>
                            Verify marketing authority <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                      <div className="consent-section">
                        <h3>Consent to disclose the dossier</h3>
                        <p>
                          Share the synthetic property address and authority
                          document with this qualified buyer. The buyer’s exact
                          balance remains private.
                        </p>
                        <button
                          className="secondary"
                          disabled={
                            block ||
                            (!state.status.seller_consent &&
                              (!buyerValid || !state.status.property_valid))
                          }
                          onClick={() =>
                            void mutate(
                              "consent",
                              { accepted: !state.status.seller_consent },
                              "Confirming seller consent on Testnet…",
                            )
                          }
                        >
                          {state.status.seller_consent
                            ? "Withdraw seller consent"
                            : "Give seller consent"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </article>
                  ) : role === "issuer" ? (
                    <article className="passport">
                      <div className="passport-heading">
                        <ShieldCheck size={26} />
                        <span className="status-label">
                          Two preapproved synthetic issuers
                        </span>
                      </div>
                      <h2>
                        Attestation has
                        <br />
                        an accountable source.
                      </h2>
                      <p>
                        Only the configured issuer accounts can publish
                        credentials. The demo service signs with disposable
                        Testnet accounts; real institution onboarding is future
                        work.
                      </p>
                      <div className="issuer-section">
                        <h3>Synthetic financial issuer</h3>
                        <p>
                          A Poseidon Merkle root authenticates the eligible
                          balance and credential expiry. The holder proves
                          membership without revealing the credential.
                        </p>
                        <a
                          className="receipt-link"
                          href={state.registration.explorer}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View issuer-root publication{" "}
                          <ExternalLink size={14} />
                        </a>
                        <p className="technical-value">
                          Root {short(state.root)}
                        </p>
                      </div>
                      <div className="issuer-section">
                        <h3>Synthetic property reviewer</h3>
                        <p>
                          Issue or revoke the deal-specific marketing-authority
                          claim. Revocation locks subsequent dossier requests.
                        </p>
                        <div className="actions">
                          <button
                            className="primary"
                            disabled={block || state.status.property_valid}
                            onClick={() =>
                              void mutate(
                                "property",
                                {},
                                "Issuing property marketing authority…",
                              )
                            }
                          >
                            Attest authority <ArrowRight size={16} />
                          </button>
                          <button
                            className="secondary"
                            disabled={block || !state.status.property_valid}
                            onClick={() =>
                              void mutate(
                                "revoke",
                                {},
                                "Revoking the property attestation…",
                              )
                            }
                          >
                            Revoke authority
                          </button>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <article className="passport judge">
                      <div className="passport-heading">
                        <ShieldCheck size={26} />
                        <span className="status-label">
                          Live verification scenarios
                        </span>
                      </div>
                      <h2>
                        Try the deal.
                        <br />
                        Then try to break it.
                      </h2>
                      <p>
                        The positive path uses a real Groth16 proof and Testnet
                        transactions. Negative cases below test the circuit or
                        contract directly; rejected simulations are labeled as
                        simulations.
                      </p>
                      <ol className="demo-steps">
                        <li>
                          <strong>Verify the seller</strong>
                          <button
                            className="text-button"
                            disabled={Boolean(busy)}
                            onClick={() => void changeRole("seller")}
                          >
                            Open property passport <ArrowUpRight size={15} />
                          </button>
                        </li>
                        <li>
                          <strong>Prove the buyer</strong>
                          <button
                            className="text-button"
                            disabled={Boolean(busy)}
                            onClick={() => void changeRole("buyer")}
                          >
                            Open buyer passport <ArrowUpRight size={15} />
                          </button>
                        </li>
                        <li>
                          <strong>Consent as both parties</strong>
                          <span>
                            Use the buyer and seller tabs, then open the room.
                          </span>
                        </li>
                      </ol>
                      <h3>Negative tests</h3>
                      <div className="test-row">
                        <div>
                          <strong>Underfunded buyer</strong>
                          <p>€400k cannot satisfy the €750k threshold.</p>
                        </div>
                        <button
                          className="secondary"
                          disabled={block}
                          onClick={() => void prove("underfunded")}
                        >
                          Run test
                        </button>
                      </div>
                      <div className="test-row">
                        <div>
                          <strong>Expired credential</strong>
                          <p>
                            Membership alone does not make an expired credential
                            valid.
                          </p>
                        </div>
                        <button
                          className="secondary"
                          disabled={block}
                          onClick={() => void prove("expired")}
                        >
                          Run test
                        </button>
                      </div>
                      <div className="test-row">
                        <div>
                          <strong>Forged property issuer</strong>
                          <p>
                            A buyer cannot impersonate the authorized reviewer.
                          </p>
                        </div>
                        <button
                          className="secondary"
                          disabled={block}
                          onClick={() => void attack("forged")}
                        >
                          Run test
                        </button>
                      </div>
                      <div className="test-row">
                        <div>
                          <strong>Replayed buyer proof</strong>
                          <p>
                            A used holder/deal nullifier cannot qualify twice.
                          </p>
                        </div>
                        <button
                          className="secondary"
                          disabled={block || !state.qualified}
                          onClick={() => void attack("replay")}
                        >
                          Run test
                        </button>
                      </div>
                      {checks.length > 0 && (
                        <ul className="local-checks">
                          {checks.map((c, i) => (
                            <li key={i}>
                              <Check size={16} />
                              {c}
                              <span>Browser circuit</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  )}
                </section>
                <aside
                  className="room-panel"
                  aria-label="Deal room requirements"
                >
                  <div className="room-panel-title">
                    {unlocked ? (
                      <UnlockKeyhole size={21} />
                    ) : (
                      <LockKeyhole size={21} />
                    )}
                    <h2>
                      {unlocked
                        ? "Ready to disclose"
                        : "A private room, by consent."}
                    </h2>
                  </div>
                  <p>
                    Both passports must be current. Both parties choose when to
                    share.
                  </p>
                  <ol className="requirements">
                    {conditions.map((c, i) => (
                      <li key={c.label} className={c.valid ? "satisfied" : ""}>
                        <span className="requirement-icon">
                          {c.valid ? <Check size={14} /> : <span>{i + 1}</span>}
                        </span>
                        <div>
                          <strong>{c.label}</strong>
                          <small>{c.detail}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <button
                    className="primary room-button"
                    disabled={!unlocked || Boolean(busy)}
                    onClick={() => void openRoom()}
                  >
                    {unlocked ? "Open private dossier" : "Dossier is locked"}
                    {unlocked ? (
                      <ArrowRight size={16} />
                    ) : (
                      <LockKeyhole size={16} />
                    )}
                  </button>
                  <p className="fine-print">
                    The server rechecks Stellar before every disclosure. A
                    direct link cannot bypass the policy.
                  </p>
                  <div className="private-fields">
                    <span>{room && dossier ? "Disclosed in this room" : "Until disclosure"}</span>
                    <div>
                      <span>Property address</span>
                      {room && dossier ? <span>Disclosed</span> : <LockKeyhole size={13} />}
                    </div>
                    <div>
                      <span>Seller identity</span>
                      {room && dossier ? <span>Disclosed</span> : <LockKeyhole size={13} />}
                    </div>
                    <div>
                      <span>Authority document</span>
                      {room && dossier ? <span>Disclosed</span> : <LockKeyhole size={13} />}
                    </div>
                    <div>
                      <span>Buyer’s exact balance</span>
                      <span>Always private</span>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
        {(busy || error || notice) && (
          <div
            className={"feedback " + (error ? "error" : "")}
            role={error ? "alert" : "status"}
            aria-live="polite"
          >
            {busy ? (
              <>
                <span className="working-dot" />
                <div>
                  <strong>{busy}</strong>
                  <p>Keep this page open while the operation completes.</p>
                </div>
              </>
            ) : error ? (
              <>
                <X size={18} />
                <p>{error}</p>
              </>
            ) : (
              <>
                <Check size={18} />
                <p>{notice}</p>
              </>
            )}
            {!busy && (
              <button
                className="dismiss-feedback"
                aria-label="Dismiss notification"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {state && (
          <section className="evidence" aria-label="Onchain evidence">
            <div className="section-heading">
              <h2>Proof you can inspect.</h2>
              <button
                className="text-button"
                disabled={Boolean(busy)}
                onClick={() =>
                  void task("Refreshing the onchain state…", async () => {
                    const s = await api<State>("status");
                    setState(s);
                    if (!s.status.unlocked) setDossier(null);
                  })
                }
              >
                <RefreshCw size={14} />
                Refresh state
              </button>
            </div>
            <p>
              Successful actions link to public Stellar Testnet receipts.
              Private credentials and dossier fields stay offchain.
            </p>
            {state.events.length === 0 ? (
              <p className="empty-evidence">
                Prepare your deal to create its first public receipts.
              </p>
            ) : (
              <div className="receipt-list">
                {state.events.map((r, i) => (
                  <div className="receipt" key={r.hash ?? `${r.label}-${i}`}>
                    <span
                      className={
                        "receipt-mark " +
                        (r.outcome === "rejected" ? "rejected" : "")
                      }
                    >
                      {r.outcome === "rejected" ? (
                        <ShieldCheck size={17} />
                      ) : (
                        <Check size={17} />
                      )}
                    </span>
                    <div>
                      <strong>{r.label}</strong>
                      <span>
                        {r.hash
                          ? `Ledger ${r.ledger ?? "receipt"} · ${short(r.hash)}`
                          : `Rejected during ${r.phase} · no transaction submitted`}
                      </span>
                    </div>
                    {r.explorer && (
                      <a
                        href={r.explorer}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View receipt: ${r.label}`}
                      >
                        View receipt <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            <details className="technical">
              <summary>Contracts & privacy model</summary>
              <dl>
                <div>
                  <dt>Buyer eligibility gate</dt>
                  <dd>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://stellar.expert/explorer/testnet/contract/${state.contracts.buyer}`}
                    >
                      {state.contracts.buyer}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Mutual deal gate</dt>
                  <dd>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://stellar.expert/explorer/testnet/contract/${state.contracts.deal}`}
                    >
                      {state.contracts.deal}
                    </a>
                  </dd>
                </div>
              </dl>
              <p>
                BN254 Groth16; issuer-root membership; holder/deal nullifier;
                five-minute proof windows; account-bound verification. The demo
                service signs for disposable, publicly linkable Testnet
                personas. Switching personas is a demonstration feature, not
                production identity authentication. The setup and educational
                verifier are unaudited.
              </p>
            </details>
            <div className="session-footer">
              <span>
                Private session {state.sessionId.slice(0, 8)} · 20-minute
                lifetime
              </span>
              <button
                className="text-button"
                disabled={Boolean(busy)}
                onClick={() => void start(role)}
              >
                Start a fresh demo <RefreshCw size={14} />
              </button>
            </div>
          </section>
        )}
        {home && (
          <section className="how">
            <h2>
              Trust enough to take
              <br />
              the next step.
            </h2>
            <div>
              <div>
                <h3>Private buyer proof</h3>
                <p>
                  A real zero-knowledge proof confirms the threshold. The exact
                  eligible balance stays with the buyer.
                </p>
              </div>
              <div>
                <h3>Specific seller authority</h3>
                <p>
                  An authenticated reviewer attests the right to market this
                  property. Evidence stays private.
                </p>
              </div>
              <div>
                <h3>Mutual disclosure</h3>
                <p>
                  Both sides consent. The server checks the current onchain
                  policy before sharing a synthetic dossier.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>
          Deal Passport <span className="footer-separator">/</span> EasyAI ·
          HackMeridian 2026
        </span>
        <div>
          <span>Synthetic data. Real Testnet verification.</span>
          <a
            href="https://github.com/aonishchenko/dealpassport"
            target="_blank"
            rel="noreferrer"
          >
            Source code <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </>
  );
}
