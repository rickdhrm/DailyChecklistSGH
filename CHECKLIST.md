# SGH Daily Facility Checklist Platform — Implementation Checklist & Roadmap

**System Name:** Antigravity  
**Database:** NeonDB (Serverless PostgreSQL 16+)  
**Framework:** Next.js 16 (App Router + Turbopack) + TypeScript + Tailwind CSS  
**Architecture:** Enterprise RBAC, Serverless Dynamic Hierarchical Forms, High-Speed Mobile Selector (No Barcode/Camera/Photos)

---

### [x] Phase 1: Project Scaffolding & Core Architecture
- [x] Initialized Next.js 16 with TypeScript (Strict mode) and ES Modules (`type: module`).
- [x] Configured Tailwind CSS with facility engineering color tokens and high-contrast dark theme.
- [x] Installed core dependencies: `pg`, `@types/pg`, `bcryptjs`, `dotenv`, `lucide-react`, `xlsx`, `jspdf`, `jspdf-autotable`, `zod`.
- [x] Established domain TypeScript contracts in `src/types/index.ts` (`User`, `Location`, `FormTemplate`, `FormSubmission`, `HousekeepingLog`).
- [x] Configured NeonDB connection pooler with global persistence in `src/lib/db.ts`.

---

### [x] Phase 2: Design System & Adaptive Shell
- [x] Official **SGH TOWER** brand identity and 3D isometric metallic monogram emblem integrated into [`public/logo.png`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/public/logo.png).
- [x] **Executive Luxury Light** design system defined in [`src/app/globals.css`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/globals.css):
  - Canvas: Warm Alabaster (`#F8F9FB`)
  - Elevated Cards: Pure White (`#FFFFFF`) with subtle shadow and warm borders
  - Typography: High-contrast Deep Slate (`#0F172A` / `#1E293B`)
  - Accents: Metallic Champagne Gold (`#C5A543`, `#DFC665`, `#EBD88A`)
- [x] Responsive layout with adaptive navigation in [`src/components/layout/Navbar.tsx`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/components/layout/Navbar.tsx):
  - Light backdrop with subtle borders, SGH TOWER serif wordmark, and logo.
  - Active navigation pills with soft amber/gold badges and borders.
  - Role indicators (`ADMIN`, `SPV`, `TECHNICIAN`) and quick sign-out.
- [x] Root layout configured with mobile viewport constraints and theme styling in [`src/app/layout.tsx`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/layout.tsx).

---

### [x] Phase 3: Auth & Technician Management (Admin / SPV)
- [x] Enterprise RBAC authentication and session cookies in [`src/lib/auth.ts`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/lib/auth.ts).
- [x] Secure SGH Tower login portal in [`src/app/login/page.tsx`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/login/page.tsx):
  - Prominent SGH Tower gold monogram with luxury top accent line.
  - Clean credentials form (one-click role selectors removed for enhanced security).
  - Password visibility toggle (Eye / EyeOff icon) to preview password before submitting.
  - Gold gradient CTA button with focus rings.
- [x] Technician provisioning interface at [`src/app/admin/users/page.tsx`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/admin/users/page.tsx):
  - Enforced enterprise constraint: *Technicians must be registered directly by an Admin*.
  - Full name, username, employee code, email, temporary password, and role assignment.
- [x] Backend user management APIs in [`src/app/api/users/route.ts`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/api/users/route.ts) and [`src/app/api/auth/`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/app/api/auth/).
- [x] NeonDB connection pool hardening in [`src/lib/db.ts`](file:///Users/rickydharmawan/Documents/GitHub/Daily%20Checklist/src/lib/db.ts) (20s cold-start timeout and idle error listener).

---

### [x] Phase 4: Dynamic Form Engine (Standard & Custom Hierarchical)
- [x] Schema-driven JSON specification supporting two form paradigms:
  - **Standard Forms**: Flat sequence of questions (Google Forms style).
  - **Custom Forms**: 4-tier tree:
    - `Heading Section` (Collapsible parent)
    - `Subheading` (Optional benchmark parent with fixed reference values)
    - `Children` (Equipment component nodes)
    - `Fields` (Numeric gauge readings with unit/min/max alerts, status toggles `NORMAL`/`ABNORMAL`, text notes)
- [x] Visual dynamic form builder and editor at `src/app/admin/forms/page.tsx`.
- [x] Pre-seeded all 8 operational checklist templates in NeonDB:
  1. `CHK-POMPA` — Checklist Pompa (Custom)
  2. `CHK-LIFT` — Checklist Operasional Lift (Custom)
  3. `CHK-MCFA` — Checklist Operasional MCFA & Annunciator (Custom)
  4. `CHK-ACCESS` — Checklist Komputer Access Card (Standard)
  5. `CHK-PAGING` — Checklist Panel Paging Evakuasi (Standard)
  6. `CHK-ITM-DAIKIN` — Checklist Panel ITM Daikin (Custom)
  7. `CHK-GAS` — Checklist Gas (Custom — Exactly Replicating Official Form FR-LO-005 Rev. 00 with 7 Sections, 61 Checkpoints, Temuan, Tindakan Koreksi, Status Options, and 4-Party Sign-Off Matrix)
  8. `CHK-PLN` — Checklist Meteran Listrik Gardu PLN (Custom)

---

### [x] Phase 5: Technician Field Experience & Dynamic Submissions
- [x] Completely eliminated barcode scanning, camera prompts, and photo upload requirements.
- [x] High-speed field selector on homepage (`src/app/page.tsx`) with category filters and real-time search.
- [x] Dynamic form runner at `src/app/checklist/[id]/page.tsx`:
  - Location selector dropdown.
  - Collapsible headings with expand/collapse states.
  - Automatic out-of-benchmark visual warning highlights.
  - Auto-flagging of submissions (`FLAGGED_ABNORMAL` vs `SUBMITTED`).
- [x] Submission history log at `src/app/history/page.tsx`:
  - View previous inspection readings.
  - Inline revision editor with mandatory *Reason for Change* tracking recorded into `form_submission_audits`.

---

### [x] Phase 6: Submissions Hub, Filtering & Export Engine
- [x] Central data monitoring console at `src/app/admin/submissions/page.tsx`:
  - Multi-criteria live filter: **Location**, **Checklist Type**, **Date/Time From & To**, **Status**.
  - Dynamic JSON inspection modal for all field readings.
- [x] Document Export Engine:
  - **Excel Export** (`/api/export/excel`): Generates `.xlsx` workbooks.
  - **PDF Export** (`/api/export/pdf`): Generates formal SGH compliance certificates with timestamp and supervisor stamp.

---

### [x] Phase 7: Data Housekeeping & End-of-Month Routine
- [x] Month-end archival console at `src/app/admin/housekeeping/page.tsx`.
- [x] Automated / manual month-end data archival pipeline in `src/app/api/housekeeping/route.ts`:
  - Archives historical submissions for the selected month to keep active query partitions lean.
  - Maintains immutable audit trail in `housekeeping_logs`.

---

### [x] Phase 8: Department Hierarchy & Multi-Tier RBAC Scoping
- [x] Department entity schema and migration (`departments`, `department_forms`, `department_id` on users).
- [x] Department management console at `src/app/admin/departments/page.tsx`:
  - Create and enable/disable departments.
  - Assign staff users and checklist forms to departments with real-time KPI metrics.
- [x] Staff provisioning with strict role boundaries at `src/app/admin/users/page.tsx`:
  - Admin registers SPVs and Technicians across any department.
  - SPV only registers Technicians in their own department.
  - SPV only sees users belonging to their department.
  - SPV can only reset passwords for Technicians in their department; Admin can reset all.
- [x] Department-scoped checklist access:
  - Technicians and SPVs can only see and execute checklist forms designated for their department.
  - Admin has full cross-department access.
- [x] Form Builder streamlined:
  - Template code and category input fields removed (auto-generated code, default category).
  - Fixed child node creation under subheadings in custom hierarchical forms.

---

### [x] Phase 9: Tri-State Status Toggles & Unconstrained Number Inputs
- [x] **Status Toggle Divided into 3 Distinct Versions**:
  1. **OK and NOT OK**:
     - Green (`emerald`) for `OK`.
     - Rose/Red (`rose`) for `NOT OK` (flags abnormal).
  2. **ON and OFF**:
     - Green (`emerald`) for `ON`.
     - Slate Dark (`slate-200 / slate-800`) for `OFF`.
  3. **OPEN and CLOSE**:
     - Modern Blue (`blue-50 / blue-800`) for `OPEN`.
     - Slate Dark (`slate-200 / slate-800`) for `CLOSE`.
- [x] **Form Builder Integration**:
  - Both Standard and Custom Hierarchical form builders provide dedicated dropdown selections:
    - *Toggle: OK / NOT OK*
    - *Toggle: ON / OFF*
    - *Toggle: OPEN / CLOSE*
    - *Number (No limitation)*
    - *Text*
  - Real-time preview badges display the exact toggle state options directly in the form builder.
- [x] **No Limitation on All Number Input Fields**:
  - Completely removed `min_val` and `max_val` constraints and validation bounds.
  - Technicians can enter any numeric reading (positive, negative, decimal, high values) without any blocking warnings or "Reading outside benchmark range!" error banners.
  - Clean styling preserved without arbitrary red error borders.

---

### [x] Phase 10: Multi-Role Dashboard Specifications
- [x] **Super Admin Dashboard (`ADMIN`)**:
  - Displays daily submitted forms from **all departments** with live reporting metrics and department pills.
  - Interactive multi-criteria filter (Scope: Today / All History, Department filter, Status filter, Search).
  - Clicking any card opens the luxury **Submission Detail Modal** (`SubmissionDetailModal`) showing full recorded checkpoint values, status toggles, gas findings, and technician observations.
  - Secondary tab to access the Checklist Launcher to run or inspect any form directly.
- [x] **Department Supervisor Dashboard (`SPV`)**:
  - Displays daily submitted forms exclusively from **their own department**.
  - Shows department KPI metrics (Today's submissions, Abnormal warnings in division, Active technicians).
  - Clicking any card opens the **Submission Detail Modal** to review readings and equipment health.
  - Secondary tab to view and run checklists designated for their department.
- [x] **Technician Dashboard (`TECHNICIAN`)**:
  - **Quick option for the forms**: High-speed, touch-optimized cards for all forms designated to their department.
  - One-tap "Start Inspection $\rightarrow$" action leading directly to the checklist form runner.
  - Real-time search and category filter.
  - Personal "My Recorded Inspections Today" feed to review completed tasks.

---

### [x] Phase 11: Official SGH Tower Daily Logsheet Pompa-Pompa Gedung
- [x] **Database Template Migration**:
  - Deleted all old existing templates, clearing foreign keys (`assets.default_template_id`), old `department_forms`, and prior submissions.
  - Seeded the single new official form template:
    - **Code:** `SGH-LOG-POMPA`
    - **Title:** `DAILY LOGSHEET POMPA-POMPA GEDUNG`
    - **Category:** `Mechanical & Plumbing`
    - **Owner:** `PT. MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER`
  - Assigned `SGH-LOG-POMPA` to all active facility departments in `department_forms`.
- [x] **Exact Matrix Table Implementation (`PumpLogsheetTable.tsx`)**:
  - Exact 2-tier table header:
    - `DESCRIPTION` (freeze-left sticky column)
    - `ARUS STANDBY (A)`: `R`, `S`, `T`
    - `VOLT-STANDBY (V)`: `R`, `S`, `T`
    - `SWITCH POSITION`: `MANUAL`, `AUTO`, `OFF`
    - `PRESURE (Bar)`: `SUCTION`, `DISCHARGE`
    - `BODY TEMP (°C)`
    - `GATE VALVE`: `OPEN`, `CLOSE`
  - Complete 27 equipment items with tailored row layouts:
    1. `JOCKEY PUMP` (standard)
    2. `ELECTRIC FIRE PUMP` (standard)
    3. `DIESEL FIRE PUMP` (standard)
    4. `BATTERY ACCU` (single Volt input cell with label)
    5. `AMPER ACCU` (single Ampere input cell with label)
    6. `CHARGER ACCU` (electrical parameters & switch)
    7. `ROOM EXHAUST FAN` (electrical parameters & switch)
    8. `TRANSFER PUMP 1` (standard)
    9. `TRANSFER PUMP 2` (standard)
    10. `TEKANAN AIR BERSIH RUANG POMPA` (single Bar pressure input)
    11. `RECYCLE PUMP 1` (standard)
    12. `POMPA STP 1` (standard)
    13. `POMPA STP 2` (standard)
    14. `BOILER STP` (standard)
    15. `EXHAUST STP 1` (standard)
    16. `EXHAUST STP 2` (standard)
    17. `SWP 1` (standard)
    18. `SWP 2` (standard)
    19. `SWP 3` (standard)
    20. `SWP 4` (standard)
    21. `SWP 5` (standard)
    22. `BOOSTER PUMP 1 ( ROOF)` (standard)
    23. `BOOSTER PUMP 2 (ROOF)` (standard)
    24. `KAPASITAS AIR GROUND TANK (%)` (percentage reading)
    25. `KAPASITAS AIR ROOF TANK ( %)` (percentage reading)
    26. `POSISI WLC GROUND TANK` (switch toggle: MANUAL / AUTO / OFF)
    27. `TEKANAN AIR PEMADAM DI ROOF` (single Bar pressure input)
  - Unconstrained numeric inputs with `step="any"` and no arbitrary min/max limits.
- [x] **Official Top & Bottom Sections**:
  - **Header**: SGH TOWER, DAILY LOGSHEET POMPA-POMPA GEDUNG, Room Temperature input (`°C`), Tanggal (Date picker), Jam Periksa (Time picker).
  - **Kondisi Ruang Pompa**: Toggleable pills `[✓] BERSIH` vs `[⚠️] BERDEBU` + `Keterangan` observations input.
  - **4-Party Verification Sign-off Matrix**:
    - Dicek Oleh: Teknisi 1 (Name), Teknisi 2 (Name)
    - Diperiksa Oleh: SPV Engineering (Name)
    - Mengetahui: Building Manager (Name)
  - **Legal Ownership Notice**: `DOKUMEN INI MILIK PT.MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER`.
- [x] **Full Platform Integration**:
  - Checklist entry runner at `/checklist/[id]`.
  - Luxury Executive Modal in Super Admin and SPV dashboards (`SubmissionDetailModal`).
  - History & Audit trail inspection at `/history`.



