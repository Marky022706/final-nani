# Balingasag Public Library — Design System Standard

**Document Version:** 1.0.0  
**Status:** Approved Reference Standard  
**Target:** React, TypeScript, Tailwind CSS v4, and Vanilla CSS Architecture  

---

## 1. Product Identity & Brand Direction

The Balingasag Municipal Public Library interface communicates:
- **Trust & Municipal Authority:** Dignified, clean, and organized public service.
- **Warmth & Accessibility:** Welcoming community learning environment for students, educators, and citizens.
- **Clarity & Efficiency:** High information density without cognitive clutter, allowing library staff and patrons to rapidly find books, process circulation loans, and record QR attendance.

### Core Color Palette: Forest Green, Soft Green, White & Warm Neutrals
The palette balances deep botanical forest green with crisp whites, gentle sage-tinted accents, and warm off-white neutrals.

---

## 2. Design Tokens

### 2.1 Color Tokens

```css
:root {
  /* --- Brand Forest Greens --- */
  --color-forest-dark: #14532d;      /* Sidebar gradient end, pressed states */
  --color-forest-deep: #166534;      /* Primary brand forest green, sidebar header */
  --color-forest-main: #174d32;      /* Primary CTA fill, modal headers, brand logo tint */
  --color-forest-hover: #13422b;     /* Primary CTA hover */
  --color-forest-muted: #2d6a4f;     /* Secondary brand emphasis */

  /* --- Soft Greens (Tint & Accents) --- */
  --color-green-soft-bg: #f0fdf4;    /* Light alert background, secondary button hover */
  --color-green-tint: #dcfce7;       /* Badges, active pill backgrounds, available shelf tag */
  --color-green-border: #bbf7d0;     /* Border for soft green badges and alert containers */
  --color-green-accent: #16a34a;     /* Success indicators, checkmarks, live dot status */

  /* --- Warm Neutrals & Surfaces --- */
  --color-surface-page: #f9faf8;     /* Warm neutral page canvas background */
  --color-surface-card: #ffffff;     /* Crisp white container surface */
  --color-surface-subtle: #f4f5f1;   /* Subtle table stripe, code background, input bg */
  --color-surface-muted: #eaece5;    /* Muted element dividers, disabled states */

  /* --- Neutral Borders --- */
  --color-border-subtle: #f1f3ee;    /* Inner row dividers */
  --color-border-main: #e2e5df;      /* Standard card and input border */
  --color-border-strong: #cbd0c7;    /* Focus border, dropdown divider */

  /* --- Typography Neutrals --- */
  --color-text-primary: #1b2420;     /* Deep slate-charcoal with a warm undertone */
  --color-text-secondary: #4a5550;   /* Readable descriptive body and table cell text */
  --color-text-muted: #6b7770;       /* Timestamps, helper text, input labels */
  --color-text-subtle: #9ba59f;      /* Placeholders, disabled icons */

  /* --- Semantic Feedback Status --- */
  --color-success: #166534;
  --color-success-bg: #dcfce7;
  --color-success-border: #bbf7d0;

  --color-warning: #b45309;
  --color-warning-bg: #fef3c7;
  --color-warning-border: #fde68a;

  --color-danger: #dc2626;
  --color-danger-bg: #fee2e2;
  --color-danger-border: #fecaca;

  --color-info: #0369a1;
  --color-info-bg: #e0f2fe;
  --color-info-border: #bae6fd;
}
```

### 2.2 Typography Tokens

- **UI / Headings / Body Typeface:** `Plus Jakarta Sans`, `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace / Machine Codes:** `JetBrains Mono`, `ui-monospace, SFMono-Regular, monospace`

| Token | Size | Line Height | Weight | Tracking | Primary Usage |
|---|---|---|---|---|---|
| `text-display` | 24px (1.5rem) | 1.2 | 700 (Bold) | -0.02em | Hero headers, public landing titles |
| `text-page-title` | 20px (1.25rem) | 1.25 | 700 (Bold) | -0.015em | Top of internal page views (`.page-title`) |
| `text-section-title` | 16px (1.0rem) | 1.3 | 600 (Semi-bold) | -0.01em | Card header titles, modal titles |
| `text-body` | 14px (0.875rem) | 1.5 | 400 / 500 | 0 | Standard table cells, form values, paragraphs |
| `text-body-sm` | 13px (0.8125rem) | 1.45 | 400 / 500 | 0 | Secondary descriptions, subheadings |
| `text-caption` | 12px (0.75rem) | 1.4 | 500 (Medium) | 0.01em | Form labels, input helpers, timestamps |
| `text-badge` | 11.5px (0.72rem) | 1.2 | 600 / 700 | 0.03em | Status pills, role tags |
| `text-mono-code` | 12.5px (0.78rem) | 1.3 | 600 (Medium) | 0.02em | Member ID (`BPL-2026-0001`), accession barcodes |

### 2.3 Spatial Spacing (Strict 4pt / 8pt Scale)

All margins, paddings, gap utilities, and component heights must align to the spatial grid:

| Token | Pixels | Usage |
|---|---|---|
| `space-1` | 4px | Micro padding, tag gaps, inline icon margins |
| `space-2` | 8px | Button inline gaps, icon-to-label spacing, compact cell padding |
| `space-3` | 12px | Modal header gap, input internal vertical padding, toolbar gaps |
| `space-4` | 16px | Standard card padding, form group gap, table header padding |
| `space-5` | 20px | Major container margins, page layout row gaps |
| `space-6` | 24px | Large card padding, dashboard widget grid gap |
| `space-8` | 32px | Section vertical spacing, modal backdrop inset spacing |
| `space-12` | 48px | Empty state padding, loading animation container padding |

### 2.4 Elevation & Border Radius

```css
:root {
  /* Corner Radii */
  --radius-xs: 4px;   /* Mono tags, compact badges */
  --radius-sm: 6px;   /* Form inputs, select dropdowns */
  --radius-md: 8px;   /* Standard buttons, table action triggers */
  --radius-lg: 12px;  /* Standard cards, nested containers */
  --radius-xl: 16px;  /* Modals, flyouts, main navigation cards */
  --radius-full: 9999px; /* Status pills, avatars, circular badges */

  /* Shadows (Neutral Charcoal with soft diffusion) */
  --shadow-subtle: 0 1px 2px 0 rgba(27, 36, 32, 0.04);
  --shadow-card: 0 1px 3px 0 rgba(27, 36, 32, 0.06), 0 1px 2px -1px rgba(27, 36, 32, 0.04);
  --shadow-elevated: 0 4px 6px -1px rgba(27, 36, 32, 0.07), 0 2px 4px -2px rgba(27, 36, 32, 0.05);
  --shadow-modal: 0 20px 25px -5px rgba(27, 36, 32, 0.15), 0 8px 10px -6px rgba(27, 36, 32, 0.08);
}
```

---

## 3. Core Component Standards

### 3.1 Buttons (`.btn`)
Every button must have a clear visual role:
1. **Primary Button (`.btn-primary`):** Solid forest green background (`#174D32`), white text, 600 weight. Use exactly once per primary action per section/modal.
2. **Secondary Button (`.btn-secondary`):** White background, border `1px solid var(--color-border-main)` or `1px solid var(--color-forest-deep)`, dark text with green hover.
3. **Danger Button (`.btn-danger`):** Red solid `#dc2626` or outlined `#dc2626` for irreversible actions (e.g. permanent deletion).
4. **Ghost / Tertiary Button (`.btn-ghost`):** Transparent background, text colored with hover tint.
5. **Icon Action Trigger (`.btn-icon`):** 32×32px or 36×36px square with centered icon, subtle border hover.

### 3.2 Form Controls
- **Label:** `font-size: 12px`, `font-weight: 600`, color `var(--color-text-secondary)`, sitting 6px above field. Required asterisk `*` in red (`#dc2626`).
- **Input & Select:** Height 38px–40px, font size 13.5px–14px, background `#ffffff`, border `1px solid var(--color-border-main)`, border-radius 6px.
- **Focus Ring:** `:focus-visible` with `outline: 2px solid var(--color-forest-deep); outline-offset: 1px`.
- **Validation Messages:** Red `#dc2626` with icon and clear explanation of correction required.

### 3.3 Tables
- **Container:** Wrapped in `.table-container` with overflow-x protection.
- **Header (`<thead>`):** Subtle background `var(--color-surface-subtle)`, uppercase tracking, font size 11.5px, weight 600, text `var(--color-text-muted)`.
- **Row (`<tr>`):** Height minimum 48px, bottom border `1px solid var(--color-border-subtle)`, hover background `rgba(240, 253, 244, 0.4)`.
- **Empty State:** Centered card with descriptive text, icon, and direct action trigger.

### 3.4 Modals & Dialogs
- **Backdrop:** Fixed inset 0, `background: rgba(20, 50, 35, 0.6)`, `backdrop-filter: blur(4px)`.
- **Dialog:** Centered, border-radius 16px, background `#ffffff`, shadow `--shadow-modal`.
- **Header:** Title + subtitle + clear `X` escape hatch.
- **Footer:** Right-aligned actions with Cancel (secondary) on left, Submit (primary) on right.

### 3.5 Feedback & Notification States
- **Loading:** Rotating `Loader2` spinner (`.spinner-icon`) in brand forest green, with human-readable operational message.
- **Success:** Solid green checkmark badge (`#16a34a`), explicit confirmation heading, and relevant credentials/summary card.
- **Empty States:** Clear icon, non-technical explanation, and recovery action button.

---

## 4. Accessibility & Responsive Principles (WCAG 2.1 AA)

1. **Color Contrast:** All body text maintains ≥ 4.5:1 against surfaces. Large text and buttons maintain ≥ 3.0:1.
2. **Keyboard Operation:** Full Tab navigation supported with visible focus rings. Modal traps focus and closes via `Escape`.
3. **No Sole Color Cues:** Status pills always combine text + color + icon where appropriate.
4. **Breakpoints:**
   - Mobile: 320px–480px (Single column, full width actions, 16px padding).
   - Tablet: 481px–768px (2-column grids, collapsible toolbars, 20px padding).
   - Desktop: 769px–1279px (Standard multi-column grid, persistent sidebar).
   - Wide Desktop: 1280px+ (Max container constraint 1280px–1440px).
