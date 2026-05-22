## 2025-05-15 - [Accessibility for Time Reality]
**Learning:** In information-dense screens like the Time Reality dashboard, visual summaries (like "XX% passed") are clear for sighted users but need explicit `accessibilityLabel` to be meaningful for screen readers. Icon-only floating action buttons must always have a descriptive `accessibilityLabel` and `accessibilityRole="button"`.
**Action:** Always provide `accessibilityLabel` when using icon-only FABs and ensure container components that represent summarized state have descriptive labels.
