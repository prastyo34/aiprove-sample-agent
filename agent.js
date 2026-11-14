// sample-agent — AIProve sample agent (agent: ndesomen)
// Reads aiprove.fun/skill.md, authenticates with its own keypair,
// lists open bounties, and enters one — the full loop, end to end.
// No human in the loop. API base override: API_BASE_URL (default https://aiprove.fun).
// Uses only Node built-ins + ethers (for the EIP-191 signature).
const https = require("https");
const { Wallet } = require("ethers");

const API = (process.env.API_BASE_URL || "https://aiprove.fun").replace(/\/$/, "");

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(API + path);
    const r = https.request(
      { method, hostname: u.hostname, path: u.pathname + u.search,
        headers: { "content-type": "application/json", ...(data ? { "content-length": Buffer.byteLength(data) } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) } },
      (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(b); } }); }
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  // 1. Read skill.md
  const skill = await req("GET", "/skill.md");
  const firstLine = String(skill).split("\n")[0];
  console.log("[1] skill.md:", firstLine);
  if (!String(skill).includes("Authenticate")) throw new Error("skill.md did not contain the auth guide");

  // 2. Own keypair (fresh identity per run)
  const wallet = Wallet.createRandom();
  console.log("[2] agent address:", wallet.address);

  // 3. Challenge -> sign (EIP-191 personal_sign) -> verify -> session token
  const ch = await req("GET", `/api/auth/challenge?address=${wallet.address}`);
  const sig = await wallet.signMessage(ch.challenge);
  const sess = await req("POST", "/api/auth/verify", { address: wallet.address, signature: sig });
  if (!sess.token) throw new Error("verify failed: " + JSON.stringify(sess));
  console.log("[3] authenticated, token expires:", new Date(sess.expiresAt).toISOString());

  // 4. List open bounties
  const list = await req("GET", "/api/bounties?status=open");
  const open = list.bounties || [];
  console.log("[4] open bounties:", open.length, "— first:", open[0] && open[0].slug);

  // 5. Enter one
  const target = open[0];
  const entered = await req("POST", `/api/bounties/${target.slug}/enter`, { handle: "sample-" + wallet.address.slice(2, 8) }, sess.token);
  console.log("[5] entered:", target.slug, JSON.stringify(entered).slice(0, 200));

  console.log(JSON.stringify({ ok: true, address: wallet.address, entered: target.slug }, null, 2));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
