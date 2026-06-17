# Code-signing & notarization

Unsigned installers trigger OS warnings on first launch (macOS Gatekeeper, Windows SmartScreen).
Signing removes those warnings and makes the app trustworthy for startup schools and new founders.

**The wiring is already done.** The release workflow (`.github/workflows/release.yml`) signs
automatically **once you add the certificate secrets** below — until then it keeps building unsigned
(no change to today's pipeline). After adding the secrets, the next `git tag vX.Y.Z` produces signed
installers.

> Cost reality: signing certificates are **paid and identity-verified** (Apple $99/yr; Windows from
> ~$10/mo). That part is yours to acquire — there's no free path to a trusted signature.

---

## macOS (Apple Developer ID + notarization)

**Prerequisite:** an [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/yr).

1. **Create a "Developer ID Application" certificate** in Apple Developer → Certificates, or via Xcode
   → Settings → Accounts → Manage Certificates → `+` → Developer ID Application. Install it in your
   login Keychain.
2. **Export it** as a `.p12` (Keychain Access → right-click the cert → Export → set a password).
3. **Base64-encode** it for the secret:
   ```bash
   base64 -i certificate.p12 | pbcopy   # macOS — now in your clipboard
   ```
4. **Create an app-specific password** for notarization at <https://appleid.apple.com> → Sign-In &
   Security → App-Specific Passwords.
5. **Find your Team ID** at <https://developer.apple.com/account> → Membership.

### GitHub secrets to add
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `APPLE_CERTIFICATE` | the base64 string from step 3 |
| `APPLE_CERTIFICATE_PASSWORD` | the `.p12` export password |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | your Apple ID email |
| `APPLE_PASSWORD` | the app-specific password from step 4 |
| `APPLE_TEAM_ID` | your 10-char Team ID |

That's it — the workflow already references these. Tag a release and the `.dmg`/`.app` come out
signed **and notarized**.

---

## Windows (Authenticode)

Pick one:

### Option A — Azure Trusted Signing (recommended: cheapest, modern)
~$10/month, no hardware token. Set up a Trusted Signing account in Azure, then add the
`tauri-apps/tauri-action` Azure signing inputs (Azure tenant/client/secret + endpoint + cert profile)
as repo secrets. See <https://v2.tauri.app/distribute/sign/windows/> → "Azure Code Signing".

### Option B — Traditional OV/EV certificate from a CA
Buy an OV (software) or EV (hardware-token) Authenticode cert from DigiCert / Sectigo / SSL.com,
then in `src-tauri/tauri.conf.json` set:
```jsonc
"bundle": {
  "windows": {
    "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```
and import the cert on the Windows runner before the build step. (EV certs live on a hardware token,
which complicates CI — Azure Trusted Signing avoids this.)

> Windows signing config is intentionally **left out of the repo** so the unsigned build keeps working.
> Add it only once you have a cert.

---

## Linux

`.AppImage` / `.deb` don't surface a "publisher" warning, so signing is optional. If you want
checksums/GPG signatures for the release assets, that can be added to the workflow later.

---

## Verifying

After a signed release:
- **macOS:** `spctl -a -vvv /Applications/CoreBrimTech\ OS.app` → "accepted, source=Notarized Developer ID".
- **Windows:** right-click the `.exe` → Properties → Digital Signatures tab shows your publisher.
