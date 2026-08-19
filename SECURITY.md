# Security Policy

## Supported Versions
At this time, only the `main` branch (latest release) is actively supported with security updates.

| Version | Supported   | Notes                       |
| ------- | ----------- | --------------------------- |
| v1.0.x  | Supported   | Active Edge ML Heuristics   |
| < v1.0  | Unsupported | Legacy prototypes           |

## Threat Model & Guarantees
TrustOS operates on a strict **Zero-Trust, Zero-Transmission** architecture.

- **No Cloud Computation:** All heuristic evaluation (DOM parsing, Shannon entropy calculation, Levenshtein distance checks, keyword tokenization, and Wasm inference) executes 100% locally within the browser memory.
- **No Data Exfiltration:** The extension does not collect, store, log, or transmit browsing history, entered credentials, or page DOM structures to any external server.
- **Edge Security Isolation:** By keeping the security perimeter directly on the client, TrustOS eliminates exposure to Man-in-the-Middle (MitM) telemetry sniffing, database leaks, or third-party cloud outages.
- **Encapsulated Shadow DOM:** Warning intervention overlays are rendered inside isolated Shadow DOM boundaries to prevent hostile page scripts from altering, bypassing, or inspecting the security shield.

## Reporting a Vulnerability
We take the security of TrustOS seriously. If you discover a vulnerability or security flaw:

1. Please do NOT open a public GitHub issue.
2. Submit a detailed report including steps to reproduce, browser version, and affected module.
3. Our maintainers will review the report and provide a response within 48 hours.
4. Coordinated public disclosure will occur once a remediation patch has been deployed.
