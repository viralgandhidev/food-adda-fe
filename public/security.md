**Security at FOODADDA.IN**

**Last Updated:** [01-09-2025]

We take the security of your data and transactions seriously. This page summarizes our controls and commitments.

## Infrastructure & Network

- **Hosting**: Production workloads run on hardened infrastructure with regular OS patching.
- **Network security**: TLS (HTTPS) enforced for all traffic; HSTS enabled. Firewalls restrict inbound access to required ports only.
- **DDoS & rate limiting**: Automated protections and throttling guard against abusive patterns.

## Data Protection

- **Encryption in transit**: All client–server communication is protected with TLS 1.2+.
- **Encryption at rest**: Databases and object storage use provider-managed encryption.
- **Backups**: Regular automated backups with integrity checks and point‑in‑time recovery windows.

## Application Security

- **Secure development**: Static analysis and dependency scanning during CI to reduce known vulnerabilities.
- **Input validation**: Server‑side validation and parameterized queries to mitigate injection risks.
- **Secrets management**: API keys and credentials stored outside source control using environment secret stores.
- **Session security**: HttpOnly, SameSite cookies (where applicable) and token expiration/rotation policies.

## Access Control & Monitoring

- **Least privilege**: Role‑based access, scoped API keys, and just‑in‑time elevation where required.
- **Audit trails**: Critical actions are logged and retained for security investigations.
- **Monitoring**: Continuous health and security monitoring with alerting on anomalies.

## Payment Security

Payments are processed through compliant third‑party providers. Card data is never stored on FOODADDA.IN servers.

## Responsible Disclosure

If you believe you’ve found a security issue, please email us at **security@foodadda.in** with details. We investigate all reports and appreciate coordinated disclosure.

## Your Part

- Use a strong, unique password and enable device security.
- Keep your browser and OS up to date.
- Never share one‑time codes or passwords with anyone.

For questions about our security practices, contact **security@foodadda.in**.
