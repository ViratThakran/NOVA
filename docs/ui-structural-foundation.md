# NOVA — UI Structural Foundation

**Phase 10E deliverable.** This document is the primary input for Claude Design's future visual-implementation phase. It describes NOVA's current information architecture, route inventory, component structure, data dependencies, and interaction patterns as they exist today — after the product's functional foundation (Phases 1–10D.1) was completed, and after this phase's structural (non-visual) corrections.

This document does **not** define a visual language. No colors, typography, spacing scale, or animation system are specified here. Those belong entirely to the next phase.

---

## 1. Product Overview

NOVA is a technology company platform connecting four things in one ecosystem:

- **Education**: structured learning programs and courses (7 programs, 45 courses)
- **Work experience**: internship programs (1/3/6-month structured tracks) and individual internship postings, both platform-owned and company-posted
- **AI-executed services**: a 64-service, 8-category catalog of work NOVA's internal AI workforce performs for students and companies
- **Operations**: an internal admin platform managing all of the above, including a dedicated AI Operations console

NOVA is positioned publicly as a **technology company** — spanning AI, software, automation, cloud, data, cybersecurity, digital transformation, and technology education — not as "an AI platform." The AI workforce is a real, internal execution capability. External users see its outcomes (a delivered service, a built website) and its honest automation-level disclosure ("AI-executed" / "AI-executed, approval required"), never its internal mechanics.

## 2. User Types

| Type | Identity source | Primary surface |
|---|---|---|
| **Public Visitor** | Anonymous | Marketing site (`/`, `/programs`, `/courses`, `/internship-programs`, `/internships`, `/services`, `/companies`, `/about`, `/contact`) |
| **Student** | `user_roles.role = 'student'` (default for every signup) | `/student/*` |
| **Company** | `company_members` row (owner/admin/member) — independent of `user_roles` | `/company/*` |
| **Admin** | `user_roles.role IN ('admin', 'super_admin')` | `/admin/*` |

A single authenticated identity can combine roles (e.g., an admin who is also a company member); `getDashboardPathForRoles()` and `requireCompanyAccess()` together resolve which experience a login lands on, with admin taking priority (see §15).

## 3. Public Sitemap

```
/ (Home)
├── /programs
│   └── /programs/[slug]
├── /courses
│   └── /courses/[id]
├── /internship-programs
│   └── /internship-programs/[slug]
├── /internships
│   └── /internships/[id]
├── /services
│   └── /services/[slug]
├── /companies
├── /about
├── /contact
├── /platform (stub — homepage covers this content)
├── /get-started (redirects to /auth/register)
└── AUTH: /login, /auth/register, /auth/forgot-password, /auth/reset-password, /auth/callback
```

## 4. Student Sitemap

```
/student (redirects to /student/dashboard)
├── /student/dashboard
├── /student/onboarding
├── /student/profile
├── /student/programs
├── /student/internships
│   └── /student/internships/[id]
├── /student/applications
│   └── /student/applications/[id]
├── /student/enrollments
│   └── /student/enrollments/[id]
├── /student/services              (discovery — browse catalog)
├── /student/services/requests     (My Requests — track own requests)  ← new this phase
│   (detail: /student/services/[id])
├── /student/notifications
├── /student/learning   (stub)
├── /student/projects   (stub)
├── /student/portfolio  (stub)
└── /student/settings   (stub)
```

## 5. Company Sitemap

```
/company/new                       (onboarding — create a company)
/company (redirects from company-less visits to /company/new; alias root of the dashboard)
├── /company/profile
├── /company/members
├── /company/internships
│   ├── /company/internships/new
│   └── /company/internships/[id]
├── /company/applications
│   └── /company/applications/[id]
├── /company/services              (discovery)
└── /company/services/requests     (My Requests)  ← new this phase
    (detail: /company/services/[id])
```

## 6. Admin Sitemap

```
/admin (redirects to /admin/dashboard)
├── /admin/dashboard
├── /admin/students
├── /admin/companies
├── /admin/programs
│   ├── /admin/programs/new
│   └── /admin/programs/[id]
├── /admin/courses
│   ├── /admin/courses/new
│   └── /admin/courses/[id]
├── /admin/internships
│   ├── /admin/internships/new
│   └── /admin/internships/[id]
├── /admin/services
│   ├── /admin/services/new
│   └── /admin/services/[id]
├── /admin/services/requests
│   └── /admin/services/requests/[id]
├── /admin/applications
│   └── /admin/applications/[id]
├── /admin/enrollments
├── /admin/audit-logs
├── /admin/contact
├── /admin/ai-operations
├── /admin/notifications  (stub)
└── /admin/settings       (stub)
```

## 7. Route Inventory

### PUBLIC

| Route | Purpose | Data source | Primary CTA | Nav entry |
|---|---|---|---|---|
| `/` | Company introduction, ecosystem overview | Static marketing copy | "Explore NOVA" / "Work with NOVA" | Logo |
| `/programs` | Program catalog discovery | `programs` (published), `program_skills.skills` | Card → detail | "Programs" |
| `/programs/[slug]` | Program detail | `programs`, `program_skills.skills`, `courses` | "Get started" | via card |
| `/courses` | Course catalog, grouped by program | `courses` (published, cascades from program published state), `course_skills.skills` | Card → detail | "Courses" |
| `/courses/[id]` | Course detail | `courses`, `programs`, `course_skills.skills` | "Get started" | via card |
| `/internship-programs` | 1/3/6-month structured track discovery | `internship_programs` (published), `internships` | Card → detail | via `/internships` contextual link (no primary nav entry — see §17) |
| `/internship-programs/[slug]` | Track detail + its real postings | `internship_programs`, `internships`, `programs` | "Apply" (per posting) | via card |
| `/internships` | Individual open-posting discovery + search | `internships` (status=open), `companies` | Card → detail | "Internships" |
| `/internships/[id]` | Posting detail, auth-state-aware CTA | `internships`, `internship_programs`, `companies`, `applications` (student-scoped) | Apply / Sign in / View application | via card |
| `/services` | 8-category, 64-service catalog | `service_categories`, `services` (published) | Card → detail | "Services" |
| `/services/[slug]` | Service detail | `services`, `service_categories` | "Request this service" (role-aware) | via card |
| `/companies` | "For companies" entry point | Static copy + generic CTA | "Create a company account" / "Sign in" | "Companies" |
| `/about` | Company narrative | Static stub | link to `/#about` | "About" |
| `/contact` | Contact form | `contact_submissions` (insert-only) | "Send message" | "Contact" |
| `/platform` | Redundant stub | Static | link to `/` | none |
| `/get-started` | Signup entry redirect | — | redirects to `/auth/register` | header CTA |

### AUTH

| Route | Purpose |
|---|---|
| `/login` | Sign in; honors `?next=` |
| `/auth/register` | Sign up (always creates `role='student'` — no role choice) |
| `/auth/forgot-password`, `/auth/reset-password` | Password recovery |
| `/auth/callback` | Supabase auth redirect target |

### STUDENT (all under `requireRole("student")` at the layout level; each data-sensitive page independently re-verifies)

| Route | Purpose | Data source | Primary CTA |
|---|---|---|---|
| `/student/dashboard` | Overview | `profiles`, `student_profiles`, `enrollments`, `notifications` | context-dependent |
| `/student/onboarding` | First-time profile completion (school/degree/skills/resume) | `student_profiles`, Storage | "Complete onboarding" |
| `/student/profile` | Edit profile, replace resume | `student_profiles` | "Save changes" |
| `/student/programs` | Enrolled/available programs from the student's own seat | `programs`, `enrollments` | "View program" |
| `/student/internships` | Discovery (authenticated) | `internships` | "Apply" |
| `/student/internships/[id]` | Detail + apply form | `internships`, `applications` | "Submit application" |
| `/student/applications` | Own applications list | `applications` | View detail |
| `/student/applications/[id]` | Application status | `applications`, `internships` | — |
| `/student/enrollments` | Own enrollments | `enrollments` | View detail |
| `/student/enrollments/[id]` | Enrollment detail | `enrollments`, `internships` | — |
| `/student/services` | **Discovery only** (as of this phase) | `services` (published) | "Request" per card |
| `/student/services/requests` | **My Requests** (as of this phase) | `service_requests` (own) | "Cancel" (pending only) |
| `/student/services/[id]` | Request detail, customer-safe status/deliverables | `service_requests`, `ai_artifacts` (via safe label map) | "Cancel" (pending only) |
| `/student/notifications` | Notification list + read state | `notifications` | Mark read |
| `/student/learning`, `/student/projects`, `/student/portfolio` | Honest empty-state stubs — no backing feature exists yet | — | none |
| `/student/settings` | Empty-state stub | — | none |

### COMPANY (all under `getAuthenticatedUser()` at the layout level; each data-sensitive page independently calls `requireCompanyAccess()`)

| Route | Purpose | Data source | Primary CTA |
|---|---|---|---|
| `/company/new` | Onboarding — create a company | `create_company()` RPC | "Create company" |
| `/company` | Dashboard overview | `companies`, `internships`, `company_members`, `applications` | context-dependent |
| `/company/profile` | Edit company name/description | `companies` | "Save changes" |
| `/company/members` | Manage membership | `company_members` | "Add member" |
| `/company/internships` | Company-owned postings | `internships` (company_id scoped) | "New internship" |
| `/company/internships/new`, `/[id]` | Create/edit a posting | `internships` | "Create" / "Save" |
| `/company/applications` | Applicants to the company's postings | `applications` | Review |
| `/company/applications/[id]` | Applicant detail, accept/reject | `applications` | Accept / Reject |
| `/company/services` | **Discovery only** (as of this phase) | `services` (published) | "Request" per card |
| `/company/services/requests` | **My Requests** (as of this phase) | `service_requests` (company_id scoped) | "Cancel" |
| `/company/services/[id]` | Request detail, customer-safe | `service_requests`, `ai_artifacts` (safe label map) | "Cancel" |

### ADMIN (all under `requireRole("admin")` at the layout level)

| Route | Purpose | Data source | Primary CTA |
|---|---|---|---|
| `/admin/dashboard` | KPI overview | counts across most tables | — |
| `/admin/students` | Student directory | `profiles`, `student_profiles` | View |
| `/admin/companies` | Company directory | `companies`, `company_members` | View |
| `/admin/programs`, `/new`, `/[id]` | Full program CRUD | `programs`, `program_skills` | Create / Save / Publish |
| `/admin/courses`, `/new`, `/[id]` | Full course CRUD | `courses`, `course_skills` | Create / Save / Publish |
| `/admin/internships`, `/new`, `/[id]` | Full internship CRUD | `internships` | Create / Save / Status |
| `/admin/services`, `/new`, `/[id]` | Full service CRUD | `services` | Create / Save / Publish / Delete |
| `/admin/services/requests`, `/[id]` | Request triage + AI-workflow trigger | `service_requests`, `ai_tasks` via `lib/ai-engine` | Accept / Plan with AI / Approve |
| `/admin/applications`, `/[id]` | Application oversight, platform-admin review | `applications` | Accept / Reject |
| `/admin/enrollments` | Enrollment oversight | `enrollments` | — |
| `/admin/audit-logs` | Immutable action log | `audit_logs` | — |
| `/admin/contact` | Contact submission triage | `contact_submissions` | Mark reviewed |
| `/admin/ai-operations` | Internal AI workforce console | `ai_tasks`, `agent_runs`, `ai_approvals`, `ai_artifacts` via `getOperationsOverview()` | Approve / Reject |
| `/admin/notifications`, `/admin/settings` | Empty-state stubs | — | none |

No routes were invented beyond the two `My Requests` pages added this phase — every other purpose in the spec is already served by an existing route.

## 8. Page-by-Page Section Hierarchy

This section states, per page, the section structure **as it exists today** (verified by direct code audit, not assumption) — the skeleton Claude Design should treat as fixed content slots.

**Home (`/`)** — `HeroSection` → `WhatIsNovaSection` → `EcosystemSection` (3 generic pillar cards: Students/Companies/Technology) → `HowItWorksSection` (6-step journey) → `CtaSection` → `SiteFooter`. **Gap**: no dedicated sections for technology/services overview, the programs/learning ecosystem, internship opportunities, technology capability/expertise, selected outcomes, or "why NOVA" — see §17.

**`/programs`** — intro header → unfiltered grid of published program cards (category/difficulty/duration badges, skill chips) → click-through only (no page-level CTA, no filter control).

**`/programs/[slug]`** — hero (category/difficulty/duration badges + title) → "About this program" → "How it's structured" (overview) → "Prerequisites" → career outcomes → skills → courses in this program → "Ready to start?" CTA → related programs (same category).

**`/courses`** — intro → courses grouped under each program's own section heading, "View program" link per group → course cards.

**`/courses/[id]`** — badges (level/duration) → title/description → "Overview" → "Prerequisites" → "What you'll learn" (learning outcomes) → "Skills covered" → sidebar: parent program card, "More in this program" related courses → "Ready to start?" CTA.

**`/internship-programs`** — intro → cards per track showing open-opportunity count, duration.

**`/internship-programs/[slug]`** — hero → "About this internship program" → skills → "Open internship opportunities" (1/3/6-month cards) → "Ready to apply?" CTA → parent learning-program link.

**`/internships`** — intro → contextual link to `/internship-programs` → search form → cards (duration + company badges as of this phase, title, description, posted date).

**`/internships/[id]`** — duration + company badges (company badge as of this phase) → title/posted-date → "Description" → "Requirements" → "Eligibility" → sidebar: parent internship-program card, auth-state CTA card (anonymous / authenticated-non-student / student-not-applied / student-already-applied, the last two both new this phase).

**`/services`** — intro → **already grouped by category** (confirmed: `servicesByCategory` keyed by `category_id`, one `<section>` per category with its own heading and card grid) — this is the load-bearing structural fact for Claude Design's later featured/expandable-category treatment; no data-model change is needed to support it.

**`/services/[slug]`** — hero (category badge, automation-level badge) → "What NOVA delivers" → Capabilities → "What you get" (deliverables) → Technologies → "How it works" (process, numbered) → "Typical fit" (industries) → FAQs → role-aware request CTA → "Other services" (related, same category).

**`/companies`** — intro → single `EmptyState` block with CTA. **Gap**: no capabilities, service-categories, or "how engagement works" sections — see §17.

**`/about`** — intro sentence + one `EmptyState` ("coming soon"). **Gap**: entirely unbuilt beyond the stub — see §17.

**`/contact`** — intro → form (name/email/company-optional/message) → success/error state. **Gap**: no static contact-info block, no reason/type-of-inquiry field — see §17 and §18.

**`/student/dashboard`** — welcome header → profile snapshot → enrollment summary → notification summary. **Gap**: no service-requests summary, no recommended-opportunities section, no explicit progress/next-actions section — see §17.

**`/student/services`** (post-fix) — intro + "My requests" link → catalog grid only.
**`/student/services/requests`** (new) — intro + "Browse services" link → request list, cancel action.
**`/student/services/[id]`** — title → status → "What you asked for" → delivery notes → **Deliverables (customer-safe labels, fixed this phase)** → cancel action (pending only).

**`/company` (dashboard)** — header → single stats card (role, members, internships, applications by status). No activity feed or service-request summary.

**`/company/services`**, **`/company/services/requests`**, **`/company/services/[id]`** — same structure as the student equivalents, company-scoped.

**`/company/new`** — currently rendered inside the full `DashboardShell`/`COMPANY_NAV_ITEMS` sidebar, not a standalone onboarding layout. Flagged, not changed — see §18.

**`/admin/ai-operations`** — "Needs your attention" → "Pending approvals" → "Running tasks" → "Failed tasks" → "Recently completed" → "Recent agent runs" → "Recent artifacts." Full internal detail (agent names, task IDs, retry counts) — correct for this audience.

**`/admin/programs`** and **`/admin/courses`** — list (status-filter tabs only, no text search — see §17) → create → edit form → publish/unpublish control → skills manager (checkbox grid grouped by skill category) → (programs only) related-courses card with "Add course" shortcut.

## 9. Component Architecture

Existing, audited, reused (no duplicates created):

**Layout/shell**: `PublicPageShell`, `DashboardShell` (shared by student/company/admin, parameterized by `roleLabel`/`navItems`), `SiteHeader`, `SiteFooter`, `MobileNav`.

**Page-level**: `PageHeader` (title+description, used on every page), `EmptyState` (title/description/action — the universal empty-state), `ErrorState` (universal error display), `Container`.

**Content primitives**: `Card`/`CardHeader`/`CardContent`/`CardTitle`/`CardDescription`, `Badge` (6 variants: default/primary/success/warning/error/info), `Avatar`, `Separator`, `Skeleton` (+ `PageSkeleton` for loading.tsx files).

**Forms**: `Input`, `Textarea`, `Select`, `Label`, `Button` (5 variants incl. `loading` state), `Modal` (used for destructive-action confirmation across internship/program/course status changes).

**Feedback**: `Toast`, inline `role="alert"` error text on every `useActionState` form (established, consistent pattern — not a component but a convention).

**Marketing-specific**: `HeroSection`, `WhatIsNovaSection`, `EcosystemSection`, `HowItWorksSection`, `CtaSection`, `ComingSoonPage` (the stub pattern used by `/about`, `/platform`, `/student/learning` etc.), **`Reveal`** — an existing IntersectionObserver-based fade/translate-in-view component, fully `motion-safe:`-gated for `prefers-reduced-motion`. This is the one motion primitive that already exists and is the natural seed for Claude Design's later scroll-storytelling system (see §14).

**Admin-specific**: `StatusControl` pattern (program/course/internship — a `Select` + confirm `Modal` + `useActionState` form, repeated identically three times; a genuine candidate for consolidation into one generic `<StatusControl>` if Claude Design's pass touches these), `SkillsManager` pattern (identical structure for programs and courses — same consolidation candidate).

**No new structural components were created this phase.** The audit found the existing inventory sufficient for every page's current needs; the one new file, `src/lib/deliverable-labels.ts`, is a data-mapping utility, not a UI component.

## 10. Data Dependencies

Every page is backed by real tables — no fabricated arrays exist anywhere in the codebase (confirmed by both this phase's audit and the Phase 10D content audit). Primary tables per experience:

- **Catalog**: `programs`, `courses`, `skills`, `program_skills`, `course_skills`
- **Internships**: `internship_programs`, `internships`, `applications`, `enrollments`
- **Services**: `service_categories`, `services`, `service_requests`
- **Identity**: `profiles`, `user_roles`, `student_profiles`, `companies`, `company_members`
- **Communication**: `notifications`, `contact_submissions`, `audit_logs`
- **AI workforce (admin-only reads)**: `agent_definitions`, `ai_capabilities`, `ai_tasks`, `agent_runs`, `ai_approvals`, `ai_artifacts` — read exclusively through `getOperationsOverview()` in `src/lib/ai-engine/engine.ts`, never queried directly by any page.

Every empty state observed (no applications, no requests, no courses in a draft program) is a genuine zero-row result, never a placeholder.

## 11. CTA Map

| Page | Primary CTA | Varies by |
|---|---|---|
| Home | "Explore NOVA" / "Work with NOVA" | — |
| Program/Course detail | "Get started" | auth state (routes to `/get-started` regardless — no deeper auth branching yet) |
| Internship detail | Apply / Sign in / View application | anonymous / authenticated-non-student / student-not-applied / **student-already-applied (new this phase)** |
| Service detail | "Request this service" | role: student → own account, company → on behalf of company, other-authenticated → generic message, anonymous → sign in |
| `/companies` | "Create a company account" / "Sign in" | auth state |
| Contact | "Send message" | — |
| Student/Company services (discovery) | "Request" per card | — |
| Student/Company My Requests | "Cancel" | only when `status = 'pending'`, and (company) only for owner/admin roles |
| Admin content pages | Create / Save / Publish-Unpublish / Approve-Reject | role: admin only, enforced at RLS |

## 12. Interaction Map

- **Filters**: text search exists on `/internships` (title `ilike`) and `/admin/*` list status tabs (draft/published/archived). Programs/Courses/Internship-Programs public lists have no filter control (see §17).
- **Tabs**: status-filter tabs on all admin list pages and `/internships` duration labels (not literal tabs, but the same role).
- **Modals**: destructive/state-changing confirmations only — internship/program/course status changes, service delete.
- **Forms**: every mutation goes through a `useActionState`-bound Server Action with inline `role="alert"` error text and a `loading` submit state — one consistent pattern across all ~30 forms in the app.
- **Confirmation actions**: accept/reject application, accept/reject service request, approve/reject AI deployment, publish/unpublish content, delete service — all gated behind an explicit confirm step.
- **Loading states**: `loading.tsx` + `PageSkeleton` exist for internship/service/course-request detail routes.
- **Success states**: redirect-on-success (create flows) or inline success message (`useActionState` status === "success") — contact form, company creation.
- **Error states**: universal `ErrorState` component for query failures; inline `role="alert"` for form validation/mutation failures.
- **Empty states**: universal `EmptyState` component, used consistently across every list/collection page.

## 13. Responsive Structure

- `DashboardShell`'s sidebar is a true responsive component already: a vertical sidebar on `md:` and above, a horizontally scrollable strip below it — one markup tree, no separate mobile variant.
- `MobileNav` (public site) is a `<dialog>`-based drawer, `hidden ... open:flex`-gated, verified working in Phase 9/10D browser checks.
- Card grids use `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`-style responsive breakpoints throughout — cards stack to one column below `sm:`.
- No page currently requires horizontal scroll for its primary content; the one horizontally-scrollable element by design is the dashboard nav strip on mobile.
- Forms are single-column at all breakpoints already (no responsive form-layout gap found).
- **Not yet structurally accounted for**: no page has an explicit "tablet" breakpoint distinct from mobile/desktop — everything currently jumps from a single mobile-first layout straight to a `sm:`/`lg:` grid. This is an open item for Claude Design, not a bug.

## 14. Motion Opportunities (annotated, not implemented)

Per Part 11's explicit instruction, no motion system was built this phase. `Reveal` (§9) already exists as the one motion primitive and is `prefers-reduced-motion`-safe by construction. Structural opportunities identified and left as **comments in source** where a future pass would hook in:

- **Hero** (`HeroSection`) → headline reveal
- **Programs/Courses/Internships/Services lists** → card/row staggered reveal (natural fit for `Reveal`'s existing `delay` prop)
- **Services** → category accordion/expand transition (the category-grouped structure in §8 already supports this without a data change)
- **Service detail "How it works"** → sticky process-step progression
- **Course detail "What you'll learn"** → progressive list reveal
- **Internships list** → filter-transition on search
- **Student/Company dashboards** → data-entrance animation
- **AI Operations** → live status-transition animation for task/approval state changes

Two source files were annotated directly this phase as concrete examples of this pattern: `src/app/student/services/requests/page.tsx` and `src/app/company/services/requests/page.tsx`, each carrying a `MOTION OPPORTUNITY` comment above their list-render block.

## 15. Customer vs Internal AI Visibility Rules

This is the single most important architectural boundary in the product and was actively enforced (not just documented) this phase.

**Customer-facing status vocabulary** (student, company): `pending → accepted → in_progress → delivered / completed`, plus `rejected` / `cancelled`. This is the literal `service_requests.status` CHECK-constraint enum — nothing is renamed or reinterpreted, it is already customer-safe.

**Customer-facing deliverables**: as of this phase, rendered exclusively through `customerDeliverableLabel()` in `src/lib/deliverable-labels.ts`, which maps the AI Engine's internal `ai_artifacts.type` values (`research_report`, `website_source`, `qa_report`, `content_draft`, `deployment_record`) to plain deliverable names ("Research & discovery," "Website files," "Quality check," "Content," "Deployment"). **Fixed this phase**: both `/student/services/[id]` and `/company/services/[id]` previously rendered the raw `artifact.type` and the AI-Engine-authored `artifact.title` directly (e.g., a customer could see the literal string "qa report" or a title like "QA report: passed") — a genuine violation of the customer/internal boundary. Neither page renders `artifact.title` or the raw `type` anymore.

**Internal-only status vocabulary** (admin, via `/admin/ai-operations` and `/admin/services/requests/[id]`): `PM → Research → Development → QA → Approval → Deployment → Delivery`, with real agent names (Research Agent, Developer Agent, QA Agent, AI Project Manager), task IDs, retry counts, and artifact titles. This is intentional and correct for this audience.

**Enforcement mechanism**: `src/lib/ai-engine/` remains imported from exactly two files in the entire codebase — `src/app/admin/actions.ts` and `src/app/admin/ai-operations/page.tsx` — confirmed unchanged this phase (`grep` boundary check, §19). No public/student/company page has ever imported it.

## 16. Design Constraints

What Claude Design must treat as fixed:

- The RLS/Server-Action/RPC architecture (`UI → Server Action → AI Engine (admin-only) → Database/RPC`).
- The `DashboardShell` role-parameterization pattern (one shell, three role configs) — a redesign should evolve this shell, not fork it three ways.
- The customer/internal AI-visibility boundary (§15) — this is a security-adjacent content rule, not a stylistic choice.
- The published/draft/archived content lifecycle for programs/courses/services/internships — every public list and detail query already filters on this; a redesign must not accidentally query unpublished content into a "featured" section.
- The two-policy anon/authenticated RLS split (§19) — irrelevant to a frontend redesign but stated here so no one is tempted to "simplify" it from the UI side.

## 17. Known UX Issues

Confirmed by direct code audit this phase, not opinion:

1. **Home page structural gaps** — missing dedicated sections for technology/services overview, the programs/learning ecosystem, internship opportunities, technology capability/expertise, selected outcomes/capabilities, and "why NOVA." Currently: hero → what-is-NOVA → 3 generic pillar cards → how-it-works → CTA → footer, entirely static copy with zero real catalog data surfaced on the homepage.
2. **`/companies` is a near-stub** — intro sentence + one `EmptyState`, no capabilities/categories/how-it-works content.
3. **`/about` is a full stub** — "coming soon" empty state only.
4. **Contact page has no static contact-info block** and no reason/type-of-inquiry field.
5. **Student dashboard has no service-requests summary, no recommended-opportunities section, no explicit next-actions section.**
6. **No discovery/filter UI on `/programs`, `/courses`, or `/internship-programs`** (only `/internships` has a search box).
7. **No text search on `/admin/programs` or `/admin/courses` list pages** (status-filter tabs only).
8. **`/company/new` renders inside the full company dashboard shell/nav**, not a dedicated onboarding layout — functional, not visually wrong, but noted per this phase's explicit instruction not to fix it yet.
9. **`StatusControl` and `SkillsManager` are duplicated three ways** (programs/courses, and StatusControl also for internships) rather than a single generic component — a consolidation opportunity, not a bug.

## 18. Open Design Decisions

Decisions this phase deliberately did not make, left for Claude Design or a future content phase:

1. **Should `/company/new` become a standalone onboarding layout** (no dashboard chrome), or should the dashboard shell itself grow a "first-run" mode? Both are legitimate; this phase intentionally left the shell untouched per the explicit "do not redesign it yet" instruction.
2. **Should the homepage's missing sections be filled with real catalog data now, or does that belong to a dedicated content/copy pass before visual design?** This phase treated new marketing copy as outside "structural, not visual" scope and did not author it — see §17.1. Building the section *skeletons* with real data queries (not fabricated copy) is a reasonable next increment before Claude Design starts.
3. **Contact form's "reason/type of inquiry" field** would need either a new nullable column on `contact_submissions` (small, additive migration) or folding the reason into the existing `message` field client-side. Not decided; not implemented.
4. **Static contact-info block** (address/phone) was deliberately not added — NOVA has no real physical-presence data recorded anywhere in the system, and inventing one would violate the project's standing anti-fabrication discipline (see the Phase 10 content-integrity audits). If NOVA gains real contact details, this becomes a one-line addition.
5. **Whether `/internship-programs` deserves a primary public-nav entry** — it's currently reachable only via a contextual link from `/internships`. Flagged in the Phase 10D audit, not yet resolved.
6. **Consolidating `StatusControl`/`SkillsManager`** into single generic components (§17.9) — worth doing during a redesign pass that's already touching those files, not worth a standalone refactor.

---

## CLAUDE DESIGN HANDOFF

### What is already fixed (do not change)

- **Functionality**: every user flow described in this document — application submission, service requests, program/course/internship CRUD, company onboarding, AI workflow execution — is real, tested, and working.
- **Routing**: the full route tree in §7. No route should be renamed or removed; new routes for a redesign should extend this tree, not replace it.
- **Data**: every page's query shape and the tables it reads (§10). A redesign changes *how* data is presented, never *which* data exists or how it's fetched (Server Component data-fetching stays server-side).
- **Permissions**: RLS policies, `requireRole()`/`requireCompanyAccess()` gates, and the admin/company/student boundary.
- **Workflows**: the service-request lifecycle, the application/enrollment lifecycle, the AI Engine's plan→research→dev→QA→approval→deploy→delivery pipeline.
- **Business logic**: every Server Action's validation and authorization logic in `src/app/*/actions.ts`.

### What Claude Design CAN change

- Colors, typography, spacing, visual hierarchy, composition, imagery, animation, transitions.
- Visual components — as long as they consume the same data shape and call the same Server Actions.
- Responsive visual treatment — breakpoints, layout composition, card/grid arrangements.
- The homepage's missing sections' *visual* execution, once their data-backed skeleton exists (§18.2).
- Consolidating `StatusControl`/`SkillsManager` into shared components (§17.9), as a byproduct of restyling them.
- The `/company/new` onboarding experience's visual treatment (§18.1) — restructuring the layout itself, not the underlying auth/creation logic.

### What Claude Design MUST NOT break

- Routes (§7) — URLs are load-bearing (bookmarks, nav config, tests).
- Data relationships and RLS (§16, §19).
- Authentication and authorization flows (`getAuthenticatedUser()`, `requireRole()`, `requireCompanyAccess()`).
- Server Actions and RPC call shapes (`FormData` field names must match what each action's Zod schema expects).
- AI Engine isolation (§15) — no public/student/company file may ever import from `src/lib/ai-engine/`.
- The customer/internal AI-visibility boundary (§15) — a redesign must keep using `customerDeliverableLabel()` and the plain status enum, never reach into `ai_tasks`/`agent_runs`/`ai_approvals` from a non-admin page.

---

## 19. Security Audit (this phase)

- `git diff --check`: clean.
- Secret scan: clean.
- AI Engine import boundary re-verified: exactly `src/app/admin/actions.ts` and `src/app/admin/ai-operations/page.tsx` import from `src/lib/ai-engine/` — unchanged from Phase 10D.1.
- No RLS policy, Server Action authorization check, or role gate was modified this phase. All fixes were either presentation-layer (deliverable labels) or additive read queries (company field, already-applied check) scoped to the caller's own rows via existing RLS.
- No new database migration was required for any fix in this phase.
