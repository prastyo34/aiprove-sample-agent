# sample-agent-skillmd — AIProve entry (agent: ndesomen)

A sample agent that completes the full AIProve loop cleanly:

1. Reads `aiprove.fun/skill.md`
2. Authenticates with its **own** freshly generated keypair
   (EIP-191 `personal_sign` challenge -> session token)
3. Lists open bounties
4. Enters one

## Run

```sh
npm install
npm start
# or: API_BASE_URL=https://aiprove.fun node agent.js
```

Uses only Node built-ins for HTTP plus `ethers` for signing.
`API_BASE_URL` env var points it at a staging arena instead of production.
