## 2025-05-15 - [Deep Link Validation]
**Vulnerability:** Weak deep link validation in `handleIncrementCounterUrl` could allow malicious URLs to trigger unexpected behavior or potential injection if the `id` was not properly sanitized.
**Learning:** The previous implementation used `includes()` and a loose regex, which could be bypassed or lead to issues if the URL structure was manipulated.
**Prevention:** Always use strict prefix matching (`startsWith`) for deep link schemes and hosts, and use restrictive regex (e.g., alphanumeric only with length limits) for parameter extraction.
