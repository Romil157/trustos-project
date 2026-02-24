# Security Policy

## Supported Versions
At this time, only the `main` branch (latest release) is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.x.x  | :white_check_mark: |
| < v1.0  | :x:                |

## Threat Model & Guarantees
AI Shield operates on a **Zero-Trust, Zero-Transmission** architecture.
- **No Cloud Computation:** All heuristic evaluation (DOM parsing, keyword matching) happens entirely locally within the browser engine.
- **No Data Exfiltration:** The extension does not collect, log, or transmit browsing history, inputted passwords, or page DOM structures to any external server. 
- **Edge Security:** By shifting the security boundary to the edge, we eliminate the risk of Man-in-the-Middle (MitM) telemetry sniffing or central database breaches compromising user habits.

## Reporting a Vulnerability
We take the security of AI Shield seriously. If you discover a vulnerability, please do NOT open a public issue. 
