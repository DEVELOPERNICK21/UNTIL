# UI implementation prompt

Use this prompt when you have a UI design (image/mockup) and want to implement it in the app. **Copy the block below, paste it in chat, then attach or paste your image.**

---

Implement the UI from the image I'm providing so it matches the design as closely as possible.

**Constraints (do not break these):**

1. **Stack:** React Native only. Use existing components and patterns from this codebase.

2. **Theme & design system:** Use only from `src/theme` — `Colors`, `Typography`, `Spacing`, `Radius`, `getFontFamilyForWeight`, `Weight`. Use `getProgressColor(progress)` from `src/theme/progressColor.ts` for any progress colors. Do not introduce new color/spacing/typography constants unless the design clearly requires something not in the theme.

3. **UI components:** Prefer and reuse from `src/ui` (e.g. `Text`, `Card`, `ScreenGradient`, `ProgressLine`, `CircularProgress`, `FAB`, `ProgressBar`, `BarChart`, `PieChart`, `DotsGrid`, `TimeStatement`). If you need something new, add it in `src/ui` and export from `src/ui/index.ts`, then use it in the screen.

4. **Surfaces / screens:** Put new screens in `src/surfaces/app/` (e.g. `XxxScreen.tsx`) and export from `src/surfaces/app/index.ts`. Only use `di` (use cases) and `hooks` for data; do **not** import `core`, `persistence`, `domain/repository`, or `infrastructure` from surfaces (except existing, minimal use of `infrastructure` for widget sync if the screen already does that). If the image is a change to an existing screen, edit that screen only and keep its current data flow (hooks/use cases).

5. **Navigation:** If the design is a new screen, add it to `RootNavigator.tsx` and to `RootStackParamList` with the correct params. Do not remove or rename existing screens or routes.

6. **Assets:** If the image shows custom fonts or images, use existing assets under `src/assets` where possible; if new assets are needed, say what's required and where they should go (e.g. `src/assets/images/`, `src/assets/fonts/`) and add them in a way consistent with `src/assets/images/index.tsx` and the app's asset loading.

7. **No collateral damage:** Do not refactor or change unrelated screens, hooks, use cases, or theme files. Only add or edit what's needed to implement this UI. Preserve existing props, state, and behavior of components you touch.

**Output:** Implement the UI so it matches the image. Prefer StyleSheet in the same file. If something in the design can't be done with the current theme or components, note it and implement the closest possible version without breaking the rules above.

---

*File: `docs/UI_IMPLEMENTATION_PROMPT.md` — copy the paragraph above (from "Implement the UI" through "...rules above.") and paste in chat, then add your image.*
