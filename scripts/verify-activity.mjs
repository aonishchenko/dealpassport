import assert from "node:assert/strict";
const base = process.env.DEMO_URL ?? "http://127.0.0.1:8973";
let cookie = "",
  csrf = "";
async function request(path, input, expected = 200, headers = {}) {
  const res = await fetch(base + "/api/" + path, {
    method: input === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(input === undefined
        ? {}
        : {
            "Content-Type": "application/json",
            Origin: base,
            "X-Demo-CSRF": csrf,
          }),
      ...headers,
    },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }),
  });
  const data = await res.json();
  assert.equal(res.status, expected, `${path}: ${JSON.stringify(data)}`);
  if (res.headers.get("Set-Cookie"))
    cookie = res.headers.get("Set-Cookie").split(";")[0];
  return data;
}
await request("activity", undefined, 401);
const session = await request("session", {}, 201);
csrf = session.csrf;
assert.ok(session.sessionExpires > session.ledgerTime);
assert.equal(session.propertyExpires, session.sessionExpires);
await request("circuit-result", { scenario: "underfunded" }, 403, {
  "X-Demo-CSRF": "wrong",
});
await request("circuit-result", { scenario: "valid" }, 400);
await request(
  "circuit-result",
  { scenario: "underfunded", witness: "must-not-store" },
  400,
);
await request("circuit-result", { scenario: "underfunded" });
let history = await request("activity");
const rejection = history.activity.find((x) => x.outcome === "rejected");
assert.equal(rejection.source, "browser");
assert.ok(rejection.label.includes("No proof or transaction was created."));
assert.equal(rejection.hash, undefined);
assert.equal((await request("status")).events.length, 0);
const preparing = request("prepare", {});
await new Promise((resolve) => setTimeout(resolve, 2000));
history = await request("activity");
assert.ok(
  history.activity.some(
    (x) => x.outcome === "running" && x.source === "testnet",
  ),
  "Testnet progress must be readable while request is pending",
);
const ready = await preparing;
assert.equal(ready.prepared, true);
history = await request("activity");
assert.equal(
  history.activity.filter((x) => x.outcome === "success" && x.hash).length,
  2,
);
assert.ok(
  history.activity.some((x) => x.id === rejection.id),
  "Circuit rejection persists after setup and reload",
);
assert.ok(!JSON.stringify(history).includes("must-not-store"));
await request("activity", undefined, 401, { Cookie: "" });
console.log(
  JSON.stringify(
    {
      verified: true,
      sessionId: session.sessionId,
      checks: [
        "session authentication",
        "CSRF",
        "allowlisted safe event fields",
        "browser provenance",
        "persistent negative result without transaction receipt",
        "live pending Testnet phases",
        "two real confirmed policy transactions",
        "session expiry fields",
        "unauthenticated history denied",
      ],
      transactions: history.activity
        .filter((x) => x.outcome === "success" && x.hash)
        .map((x) => x.hash),
    },
    null,
    2,
  ),
);
