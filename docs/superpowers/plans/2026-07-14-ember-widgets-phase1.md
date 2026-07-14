# Ember Widgets Phase 1 — Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-07-14-ember-widgets-phase1-design.md`

**Goal:** Static Ember on Day (ring center) + Daily Tasks (corner) + empty states; unify Day glance (no seconds); document color SSOT.

**Architecture:** Draw Ember into Android day/tasks bitmaps; SwiftUI `EmberGlyph` on iOS. Mood from day progress bands matching `Ember.tsx`.

**Tech Stack:** Kotlin Canvas RemoteViews, SwiftUI WidgetKit

---

### Task 1: Android Ember bitmap + Day ring center
### Task 2: Android Tasks corner ImageView
### Task 3: Android Day time strings without seconds
### Task 4: iOS EmberGlyph + Day/Tasks/empty
### Task 5: docs/WIDGETS.md token note
