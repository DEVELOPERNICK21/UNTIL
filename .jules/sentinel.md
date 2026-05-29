## 2025-05-14 - [Security Enhancement] Input Validation & Deep Link Hardening
**Vulnerability:** Loose deep link parsing and lack of input length limits.
**Learning:** The application used simple string inclusion checks for deep link processing, which could be bypassed or spoofed. Additionally, user inputs lacked length constraints, posing a risk of local storage bloat or UI/process instability.
**Prevention:** Use strict prefix/scheme validation for deep links and regex-based parameter validation. Always enforce `maxLength` on `TextInput` components to limit the footprint of untrusted data.
