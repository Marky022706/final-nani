---
name: ui-quality
description: Audits, designs, implements, and visually verifies React and Tailwind interfaces. Use when improving dashboards, forms, tables, modals, navigation, responsive layouts, or overall UI quality.
---

# UI Quality Improvement Skill

## Objective

Improve the real browser-rendered interface, not just the source code.

## Phase 1: Inspect

1. Read the project rules and inspect the relevant files.
2. Identify the page's purpose, primary users, main actions, and information hierarchy.
3. Inspect existing shared components and design tokens.
4. Run the existing application using its documented commands.
5. Capture the current page before changing it.
6. Record the most important visual and functional defects.

Do not redesign unrelated pages.

## Phase 2: Plan

Write a short plan covering:

- Current problems and their evidence.
- Proposed layout and hierarchy.
- Components to reuse or improve.
- Responsive behavior.
- Functional behavior that must remain unchanged.
- Acceptance criteria.

## Phase 3: Implement

1. Reuse existing design tokens and shared components.
2. Improve alignment, spacing, typography, density, contrast, and consistency.
3. Use semantic HTML and accessible labels.
4. Implement proper loading, empty, error, disabled, and success states where applicable.
5. Keep responsive behavior intentional.
6. Preserve routing, authentication, API contracts, and permissions.
7. Avoid unrelated refactors and new dependencies.

## Phase 4: Verify in the browser

Use available browser tools to inspect the actual running page.

Test these viewport sizes:

- Desktop: 1440 x 900.
- Tablet: 768 x 1024.
- Mobile: 390 x 844.

At each applicable size:

- Capture a screenshot.
- Check alignment, spacing, typography, and content density.
- Check clipping, horizontal overflow, and overlapping elements.
- Check navigation, dialogs, forms, and table actions.
- Check hover and keyboard-focus states.
- Inspect browser console and failed network requests.
- Wait for the page and asynchronous content to finish rendering.

Use test accounts and safe sample data. Do not perform destructive actions against production data.

## Phase 5: Critique and fix

Compare the result against the acceptance criteria and original screenshot.

Prioritize:

1. Broken or inaccessible functionality.
2. Overflow, clipping, and layout defects.
3. Weak hierarchy and inconsistent spacing.
4. Inconsistent components and typography.
5. Decorative refinements.

Fix the highest-impact issues first, then repeat the relevant browser checks.

Do not repeatedly redesign a page without identifying a specific defect.

## Phase 6: Report

Report:

- Files changed.
- Problems found and corrected.
- Viewports and interactions actually tested.
- Build, lint, and test results.
- Remaining issues.
- Any checks that could not be performed.

Never describe an uninspected screenshot or unexecuted test as verified.

## Phase 7: Motion and Interaction Polish

After the page layout and functionality are correct:

1. Identify interactive elements that need visual feedback.
2. Choose the simplest suitable animation for each interaction.
3. Prefer existing CSS utilities and shared components.
4. Use the project's installed animation library only when useful.
5. Standardize durations, easing, and motion behavior.
6. Support prefers-reduced-motion.
7. Inspect animations in the running browser.
8. Test rapid clicks, repeated open/close actions, keyboard
   navigation, and mobile behavior.
9. Verify that animations never block essential operations.

Do not add animations simply to make a page look busy.

A successful animation must be purposeful, consistent,
accessible, and smooth in the actual application.
