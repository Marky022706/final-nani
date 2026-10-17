# Balingasag Public Library — Page Patterns & Templates

**Document Version:** 1.0.0  
**Status:** Approved Reference Guide  
**Companion File:** [`design-system.md`](file:///c:/laragon/www/final-nani/docs/ui/design-system.md)  

---

## 1. Standard Page Layout Anatomy

Every authenticated interior view adheres to a consistent 4-zone vertical structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Page Header (Title + Breadcrumbs context + High-priority actions)   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Filter & Utility Toolbar (Search + Status/Type selects + View mode) │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Primary Data View (Table / Card Grid / Real-time Operational Desk)  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Pagination & Summary Bar (Showing X of Y items + Page controls)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Page Patterns

### Pattern A: Data Table & Management View (Catalog, Members, Circulation)

**Used in:** `BookList.tsx`, `MemberList.tsx`, `CirculationView.tsx`, `AuditLogsView.tsx`

1. **Page Header:**
   - Left: Page Title (20px, Bold, `#1B2420`), Subtitle (13px, `#4A5550` or `#6B7770`).
   - Right: Single primary action button (e.g. `+ Add Book`, `+ Register Member`, `+ Issue Loan`).
2. **Toolbar Card:**
   - Enclosed in a white card with `padding: 16px`, `border: 1px solid var(--color-border-main)`.
   - Search bar on left with `flex: 1 1 280px` and leading `Search` icon (16px).
   - Filter dropdowns on right with matching height (38px), uniform borders, and distinct active indicators.
3. **Data Table:**
   - Wrapped in `.table-container` with responsive horizontal scrolling on narrow screens.
   - Distinct sticky or contrast header row (`background: var(--color-surface-subtle)`).
   - Columns:
     - Identification: Monospace font badge (`JetBrains Mono`, bold, subtle tinted border).
     - Primary Entity: Name or Title (Semi-bold, 13.5px).
     - Metadata: Categories, Dates, or Accession info (Regular, 12.5px, `#4A5550`).
     - Status: Semantic pill badge (`Active`, `Borrowed`, `Available`, `Overdue`).
     - Actions: Right-aligned button cluster with consistent icon sizes (15px–16px) and tooltips.
4. **Empty State:**
   - If no items match: Centered card, `padding: 48px 24px`, neutral illustration/icon, clear text ("No members found matching your search criteria"), and a "Clear Filters" or "+ Add Item" recovery action.

---

### Pattern B: Operational Desk & Scanner Views (Attendance, Live Check-In)

**Used in:** `AttendanceView.tsx`, `ScanQrModal.tsx`, `CirculationScannerModal.tsx`

1. **Real-Time Counter / KPI Banner:**
   - Prominent indicator for current library status (e.g., "Currently Inside Library: 14 patrons").
   - Forest green badge or pulsing live indicator dot.
2. **Dual-Input Entry:**
   - Quick QR / Barcode Scanner input with autofocus for optical barcode guns.
   - Fallback manual patron search field for cardless residents.
3. **Live Transaction Log:**
   - Instant optimistic feedback showing newly timed-in or returned books at the top of the list.

---

### Pattern C: Multi-Step & Creation Modals

**Used in:** `CreateMemberModal.tsx`, `AddBookModal.tsx`, `AdminManagementView.tsx`

1. **Backdrop & Focus Trap:**
   - Modal backdrop with smooth fade-in and backdrop blur (`rgba(20, 50, 35, 0.6)`).
   - Pressing `Escape` or clicking backdrop safely prompts or closes (unless async request is in progress).
2. **Ordered Logical Grouping:**
   - Maximum 4–6 fields visible per step or section.
   - Explicit step indicators when exceeding 6 fields:
     - *Step 1: Role & Identity*
     - *Step 2: Contact & Demographics*
     - *Step 3: Security & Credentials*
3. **Async Feedback State Machine:**
   - **Idle:** Clean form with clear field requirements and inline validation.
   - **Loading:** Centered rotating `Loader2` spinner, animated track, descriptive status message ("Creating account... Provisioning credentials"). Form inputs disabled to prevent double submissions.
   - **Success:** Green checkmark celebration badge (`CheckCircle2`), summary card of credentials (with copy password capability), and direct "Create Another" or "Done" triggers.

---

## 3. Responsive Adaptations

| Screen Size | Breakpoint | Header Behavior | Toolbar Behavior | Table Behavior |
|---|---|---|---|---|
| **Desktop** | ≥ 1024px | Title + Actions inline | Single row, search flexes | Full multi-column table |
| **Tablet** | 768px – 1023px | Title on top, action right | Search full width, filters wrap | Table horizontally scrollable |
| **Mobile** | ≤ 767px | Stacked column, full-width button | Full-width search, stacked dropdowns | Card layout or scrollable table |

---

## 4. Recommended Reference Page for First Polish

### Recommended: **Manage Members (`src/components/members/MemberList.tsx`)**

**Rationale for selecting `MemberList.tsx` as the first reference page:**
1. **Complete Lifecycle Coverage:** It contains all core design patterns:
   - Data table with sorting, badges, monospace codes, and row actions.
   - Search & multi-parameter filter toolbar.
   - Complex creation wizard (`CreateMemberModal.tsx`).
   - Digital card preview with QR barcode generator (`LibraryCardModal.tsx`).
   - Destructive confirmation modals (account suspension and deletion).
2. **High Daily Staff Usage:** Used continuously by Head Librarian and Volunteer staff for patron registration, card issuance, and status checks.
3. **Current Inconsistencies to Address:**
   - Multiple raw inline styles (`style={{ ... }}`) rather than reusable tokens.
   - Action buttons in the table lack consistent padding and visual hierarchy.
   - Search bar container mixes arbitrary pixel paddings (16px, 12px, 10px).
   - Once standardized, `MemberList.tsx` serves as the exact code template for `BookList.tsx`, `CirculationView.tsx`, and `AttendanceView.tsx`.
