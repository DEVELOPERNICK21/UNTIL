# Sentinel's Journal - Critical Security Learnings

## 2025-05-22 - Hardened Deep Link Validation
**Vulnerability:** Loose validation in deep link handlers using `.includes()` allowed potential action injection or unintentional triggers if malicious keywords were present in other parts of a URL.
**Learning:** React Native `Linking` handlers are often implemented with minimal checks. Substring matching is insufficient for security-sensitive actions.
**Prevention:** Always enforce strict scheme (`until://`) and host validation. Use anchored regular expressions for parameters with explicit character sets (e.g., `[a-z0-9]`) and length limits to mitigate injection and DoS risks.
