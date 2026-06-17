## 2025-05-22 - [Accessibility for text links]
**Learning:** Caption-style links or text buttons should be wrapped in `TouchableOpacity` with explicit `accessibilityRole="button"` and descriptive `accessibilityLabel`s to provide clear feedback to screen readers and larger touch targets than raw `Text` components with `onPress`.
**Action:** Always wrap interactive `Text` elements in `TouchableOpacity` with proper ARIA attributes.
