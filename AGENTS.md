# Balingasag Public Library — Project Rules

## 1. Role and objective

Act as a senior UI/UX designer, React engineer, accessibility reviewer, and frontend quality engineer.

Deliver polished, consistent, responsive, production-quality interfaces. Functional code alone does not mean the UI is complete.

## 2. Existing technology

- Frontend: React, TypeScript, Vite, and Tailwind CSS.
- Backend: existing Laravel application and APIs.
- Inspect the actual repository and package.json before making assumptions.
- Preserve existing architecture, routes, authentication, API contracts, and dependencies.
- Do not migrate frameworks or replace working features without approval.

## 3. Product identity

Design for Balingasag Public Library.

The interface should communicate trust, learning, organization, accessibility, and community service.

Use the established forest-green, soft-green, white, and warm-neutral palette. Inspect existing design decisions before changing tokens or fonts.

Do not invent official library claims, mission statements, or statistics.

## 4. Design system

- Establish consistent color, typography, spacing, border, radius, and shadow tokens.
- Reuse shared buttons, inputs, cards, tables, dialogs, alerts, and navigation components.
- Maintain clear visual hierarchy and readable text.
- Use restrained color and decoration.
- Avoid excessive gradients, oversized headings, unnecessary icons, and inconsistent card styles.
- Provide visible hover, focus, active, disabled, loading, success, and error states.
- Follow accessibility requirements, including keyboard operation and sufficient contrast.

## 5. Application behavior

- Sidebar = destinations.
- Page = information.
- Buttons and controls = operations.
- Preserve existing business logic and role permissions.
- Connect actions to the correct real behavior.
- Never present fake success messages for failed operations.
- Never replace working API calls with hardcoded mock data to hide errors.
- Keep validation and error messages clear and actionable.

## 6. Implementation standards

- Prefer small, reusable, typed components.
- Follow existing naming, folder, routing, and styling conventions.
- Avoid duplicated components, unnecessary dependencies, and giant page components.
- Keep API logic separate from presentation where the existing architecture allows it.
- Do not expose secrets or weaken authentication and authorization.
- Ask before destructive database, migration, or security changes.

## 7. Required workflow

Before coding:

1. Inspect the current page, related components, routes, and data flow.
2. Identify the actual problem and existing design conventions.
3. State a short implementation plan and acceptance criteria.
4. Reuse the existing design system or propose the smallest justified improvement.

After coding:

1. Review the code and changed files.
2. Run applicable checks discovered in package.json.
3. Open the actual application in the browser when available.
4. Inspect desktop, tablet, and mobile layouts.
5. Test the affected interactions and review console and network errors.
6. Fix verified defects and repeat the checks.
7. Report what was tested and what remains unverified.

## 8. Completion criteria

A task is complete only when:

- Requirements are implemented.
- Existing behavior has been preserved or intentionally changed.
- Responsive layout has been inspected.
- Relevant interactions have been tested.
- Available checks have been run and their results reported.
- Remaining issues and limitations are disclosed.

Never claim visual verification, test success, or production readiness without evidence.

## 9. Animation and Interaction Standards

Goal: Create a polished, responsive interface with purposeful,
subtle animations that improve usability.

### Animation principles

- Every animation must communicate feedback, hierarchy, navigation,
  or a meaningful state change.
- Prefer subtle, quick animations over dramatic effects.
- Use CSS transitions for simple hover, focus, and color changes.
- Use keyframes or the existing animation library for more
  complex effects when genuinely necessary.
- Inspect installed dependencies before adding any library.

### Approved motion patterns

- Buttons: subtle color, border, and shadow transitions.
- Sidebar: smooth hover states and active indicators.
- Cards: subtle hover elevation only when interactive.
- Modals: fade and slight scale transition.
- Dropdowns: fade and short vertical transition.
- Toast notifications: enter and exit smoothly.
- Loading: restrained skeleton, spinner, or progress indicator.
- Tables: subtle row hover and clear status changes.
- QR scanner: visible scanning state and clear success feedback.
- Page transitions: short, restrained transitions without
  delaying navigation or blocking interaction.

### Timing and motion

- Small interactions: approximately 150–220 ms.
- Dialogs and dropdowns: approximately 180–250 ms.
- Initial content entrances: approximately 250–400 ms.
- Prefer ease-out for entrances and ease-in for exits.
- Avoid unnecessary bounce, continuous movement, excessive
  parallax, flashing, and long staggered animations.

These are defaults, not mandatory durations for every component.

### Accessibility and performance

- Respect prefers-reduced-motion.
- Keep keyboard focus visible throughout transitions.
- Never make an action depend on an animation finishing.
- Do not animate large layout changes when opacity or transform
  can achieve the same result.
- Avoid unnecessary animation of large lists or entire pages.
- Keep controls responsive during animations.
- Never use animation to conceal loading failures or broken actions.

### Verification

- Inspect animations in the real browser.
- Test hover, focus, click, open, close, loading, success,
  and error states where applicable.
- Check desktop and mobile behavior.
- Verify reduced-motion behavior.
- Confirm that animations do not cause clipping, layout shifts,
  or interaction problems.
