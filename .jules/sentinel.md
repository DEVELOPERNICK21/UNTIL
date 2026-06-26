## 2025-03-24 - [Input Length Limits Enforcement]
**Vulnerability:** Missing input length limits on user-controlled TextInput components across multiple screens (Countdowns, Monthly Goals, Goal Detail, Custom Counters, Settings, Hour Calculation).
**Learning:** User input was directly stored in MMKV and used in UI without length validation. This could lead to local Denial of Service (DoS) through UI performance degradation or excessive storage consumption if very large strings were entered.
**Prevention:** Always enforce `maxLength` on `TextInput` components for user-controllable fields, especially those persisted in local storage or state management, to ensure predictable resource usage.
