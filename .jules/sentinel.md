## 2025-05-15 - Prevent Sensitive Data Leakage in GET Requests
**Vulnerability:** `LicenseVerificationServiceAdapter.ts` was transmitting `licenseKey` and `deviceId` via GET query parameters in the `verify` method.
**Learning:** Sensitive data like license keys or unique device identifiers should never be sent in GET query parameters as they can be leaked in server logs, browser history, or proxy caches.
**Prevention:** Always use POST requests with a JSON body for transmitting sensitive information to the backend, even for "read-only" verification checks.
