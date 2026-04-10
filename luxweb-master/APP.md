# LuxWeb Module: App Chrome (Admin, Dashboards, CRM, CMS, Auth)

> **Read when**: Building any non-marketing surface. Login, signup, dashboards, admin panels, CRMs, CMSs, settings, user profiles, data tables, form-heavy pages. This file exists because archetype + colors alone are not enough — the LAYOUT itself has to be chosen intentionally, or every admin ends up looking like every other shadcn starter.

---

## The Core Problem This File Solves

A Botanical Fresh marketing site can feel completely distinct from a Dark Terminal marketing site — different fonts, different colors, different motion, different hero treatment. But when you build the admin panels for both, they both end up as:

```
┌──────┬─────────────────────────────┐
│ Side │  Top bar                    │
│ bar  ├─────────────────────────────┤
│      │  [stat] [stat] [stat]       │
│      │  ┌────────┬────────┐        │
│      │  │ card   │ card   │        │
│      │  └────────┴────────┘        │
│      │  table or list              │
└──────┴─────────────────────────────┘
```

Same skeleton. Same rhythm. Same structure. The archetype just repaints the walls.

**The fix:** force a structural layout decision BEFORE building, the same way we force an archetype decision. Multiple distinct layouts per surface, with the generic default explicitly called out and banned as a "default pick."

---

## The Core Principle

Marketing surfaces **sell**. App surfaces **work**. A user spends 30 seconds on a landing page and 30 hours a month in an admin panel. That difference dictates everything.

**What carries from the marketing archetype:**
- Fonts (display + body)
- Accent color, dark/light commitment, neutral scale
- Voice in microcopy (luxury = restrained, organic = warm, tech = precise)
- Border radius discipline

**What shifts in app chrome:**
- `DESIGN_VARIANCE` — shifts based on which app layout is picked, NOT dropped uniformly
- `MOTION_INTENSITY` drops to 2–4 — motion becomes functional (150–200ms transitions, skeleton pulses, drawer slides). Cinematic scroll stuff disappears.
- `VISUAL_DENSITY` rises to 6–9 — density is the point

**What doesn't disappear — it moves:**

Creativity in app chrome lives in specific places. Claude Code must hit at least 4 of these 8 per project or the admin will feel generic:

1. **Page titles rendered in the display font at real size** (36–56px). A dashboard titled "Contacts" in Fraunces at 48px feels designed. The same word in 18px Inter feels like a shadcn starter.
2. **The sidebar is a brand moment.** Warm cream with forest-green nav for Botanical Fresh. Dark terminal with mono labels for Tech Utilitarian. This is where the archetype actually lives in the admin.
3. **Empty states are the biggest single creative opportunity.** Custom illustration or oversized display-font statement with archetype voice. Never just "No records found."
4. **Iconography choice.** Lucide is the default and looks identical across every AI-generated admin. Pick Phosphor, Tabler, or Iconoir and commit to one stroke weight for the whole project.
5. **Color in data visualization.** Default Recharts palette is a tell. Custom palette derived from the archetype's colors is not.
6. **One decorative moment per page.** A gradient mesh behind the page header. An oversized stat in the display font. A custom divider treatment. A hand-drawn accent. ONE per page, so it lands.
7. **Microcopy voice.** "Something went wrong" vs. "Server took a nap. Try again?" — voice is free personality.
8. **Functional motion.** Skeleton loaders pulsing in the archetype's accent. Drawer slide timings that feel tactile. Dropdown reveals with subtle spring. Nothing cinematic, but nothing default either.

---

## 🚨 MANDATORY: App Layout Selection Gate

**Before building any non-marketing surface, Claude Code MUST execute this protocol.**

### When this gate applies:
- Building a dashboard, admin panel, CRM, CMS, or any app interior
- Building auth pages (login, signup, forgot password, etc.)
- Building a settings page, profile page, or any form-heavy internal surface
- Building data display surfaces (tables, lists, record views)

### When this gate does NOT apply:
- Adding a single component to an already-built app
- Bug fixes or refactors in existing admin code
- User has explicitly named a layout in their prompt

### The Protocol

**Step 1.** For each surface being built (dashboard, settings, auth, etc.), present the full layout options from this file.

**Step 2.** Present them with ASCII diagrams AND real-world reference sites so the user can visualize.

**Step 3. STOP AND WAIT** for the user to pick a layout for each surface.

**Step 4.** Confirm the layout + archetype combination back, then build.

**Step 5.** NEVER default to "Classic Shell" dashboard or "Centered Card" settings unless the user explicitly picks them. These are the generic defaults Claude Code produces on autopilot — making them opt-in is the entire point of this gate.

---

# DASHBOARD LAYOUTS

Six distinct structural approaches. Pick ONE per project. None are universally "better" — each fits different use cases.

## Option A: CLASSIC SHELL ⚠️

```
┌──────┬─────────────────────────────┐
│      │  Top bar                    │
│ Side ├─────────────────────────────┤
│ bar  │  [stat] [stat] [stat]       │
│      │  ┌────────┬────────┐        │
│      │  │ card   │ card   │        │
│      │  └────────┴────────┘        │
│      │  table or list              │
└──────┴─────────────────────────────┘
```

**This is the default shadcn layout and exists in this file ONLY so Claude Code can name it and avoid picking it by default.**

- **Pick this ONLY when:** The user explicitly asks for "a standard admin layout," or the product is an ultra-traditional enterprise tool where familiarity is more valuable than distinctiveness.
- **Reference:** Basically every shadcn template, every generic SaaS admin, every AI-generated dashboard.
- **Default ban:** If the user hasn't specifically requested it, skip this option.

## Option B: BENTO GRID

```
┌──────┬─────────────────────────────┐
│      │  ┌───────┐┌────┐┌─────┐     │
│ Side │  │       ││    ││     │     │
│ bar  │  │ BIG   ││med ││ med │     │
│      │  │ stat  │└────┘└─────┘     │
│      │  │       │┌──────────┐      │
│      │  └───────┘│ wide     │      │
│      │  ┌────┐┌─┐│ card     │      │
│      │  │ sq ││s│└──────────┘      │
│      │  └────┘└─┘                  │
└──────┴─────────────────────────────┘
```

Asymmetric grid where cards have varied sizes. Some span 2 columns wide, some span 2 rows tall, small square stats sit next to wide activity feeds. Creates visual rhythm and lets the most important metric dominate.

- **Pick this when:** One or two metrics matter way more than the rest. You want the dashboard to feel modern and product-y. Primary users are founders, execs, or product managers scanning KPIs.
- **Tech:** CSS Grid with explicit `grid-template-areas` or `col-span-*` / `row-span-*` utilities. Never flexbox — flex can't do this cleanly.
- **Reference sites:** Apple Watch product page, Linear dashboard, Framer dashboard, Arc browser new-tab page, Vercel dashboard.
- **Archetype fit:** Works with all 8 archetypes. Particularly strong for Tech Utilitarian, Maximalist Playful, Soft Consumer.

## Option C: MAGAZINE EDITORIAL

```
┌──────┬─────────────────────────────┐
│      │  ━━━━━━━━━━━━━━━━━━━━━━     │
│ Side │  THIS WEEK                  │
│ bar  │  Welcome back, Kevin        │
│      │  ━━━━━━━━━━━━━━━━━━━━━━     │
│      │                             │
│      │  ┌──────────────┐           │
│      │  │  $48,200     │  This     │
│      │  │  ↑ 12%       │  week     │
│      │  │  (huge)      │  summary  │
│      │  └──────────────┘  text     │
│      │                             │
│      │  ── Activity ──             │
│      │  feed list                  │
└──────┴─────────────────────────────┘
```

Designed like a magazine spread. Big editorial headline ("Welcome back, Kevin" in display font at 48–64px), one massive featured metric, supporting copy in a serif body column, then activity feed below in newspaper-column style. Generous whitespace. Uses dividers and typography hierarchy instead of card containers.

- **Pick this when:** The archetype is Editorial, Luxury Minimal, or Organic Natural. When the dashboard is less about raw data density and more about narrative/status.
- **Tech:** Column grids with typography doing the heavy lifting. Minimal cards, maximal type.
- **Reference sites:** The Browser Company's Arc, Are.na profile pages, Ghost editor dashboard.
- **Archetype fit:** Editorial Refined, Luxury Minimal, Organic Natural. Avoid for Tech Utilitarian (too decorative) and Brutalist (too refined).

## Option D: FOCUS MODE

```
┌──────┬─────────────────────────────┐
│      │                             │
│ Side │      ┌─────────────┐        │
│ bar  │      │             │        │
│      │      │             │        │
│      │      │  ONE primary│        │
│      │      │  thing      │        │
│      │      │             │        │
│      │      └─────────────┘        │
│      │                             │
│      │   [minor] [minor] [minor]   │
│      │                             │
└──────┴─────────────────────────────┘
```

One primary thing dominates the page — the current in-progress project, the main chart, the active record, the next action. Everything else is reduced to small supporting elements at the edges. Minimalist chrome.

- **Pick this when:** The dashboard is for doing ONE thing at a time (writing, designing, processing a queue, reviewing submissions). Users enter the dashboard with a clear intent.
- **Tech:** Standard flex/grid, but with one element dominating 60–70% of the viewport.
- **Reference sites:** Notion editor workspace, Ghost editor, Hemingway, Superhuman.
- **Archetype fit:** Works with all archetypes. Strongest for Editorial and Soft Consumer.

## Option E: COMMAND CENTER

```
┌────────────────────────────────────┐
│ Top bar (no sidebar)               │
├────────────────────────────────────┤
│                                    │
│  metric ── metric ── metric ── ... │
│                                    │
│  ── Section 1 ────────────────     │
│  Dense data, rows with dividers    │
│                                    │
│  ── Section 2 ────────────────     │
│  More data, no cards, monospace    │
│                                    │
│  [command palette overlay: Cmd+K]  │
└────────────────────────────────────┘
```

No sidebar. Top bar with command palette (Cmd+K) as the primary navigation. Ultra-dense, divider-separated sections, no card containers. Monospace for numbers. Feels like a terminal or a pro tool.

- **Pick this when:** Users are power users, developers, analysts, traders. Density matters more than hand-holding. Product includes enough surface area that a command palette makes sense.
- **Tech:** `cmdk` library (by paco coursey) for the palette. Dividers via `border-b` and `divide-y`. No `<Card>` components.
- **Reference sites:** Linear, Retool, Bloomberg Terminal, Raycast, Warp terminal.
- **Archetype fit:** Tech Utilitarian is the perfect match. Also works for Brutalist Raw and dark Editorial.

## Option F: SPLIT CANVAS (Master/Detail)

```
┌──────┬─────────────┬──────────────┐
│      │             │              │
│ Side │ List of     │ Detail view  │
│ bar  │ items       │ of selected  │
│      │ (250px)     │ item         │
│      │             │              │
│      │ item        │ (fills the   │
│      │ item        │  remaining   │
│      │ item        │  space)      │
│      │ item        │              │
│      │             │              │
└──────┴─────────────┴──────────────┘
```

Three columns: sidebar nav, scrollable list of records, detail pane. Clicking a list item updates the detail pane without a page reload. Great for content-heavy tools.

- **Pick this when:** The primary user action is "browse a list and view/edit one record at a time." Inboxes, CMS editors, message tools, queue processors.
- **Tech:** Resizable panes via `react-resizable-panels`. URL state via search params so deep-linking works.
- **Reference sites:** Superhuman, Apple Mail, Things 3, Notion database detail views, Linear issue view.
- **Archetype fit:** All archetypes. Strongest for Tech Utilitarian, Editorial, Soft Consumer.

---

# SETTINGS LAYOUTS

Five distinct approaches. The centered-form-card default is explicitly banned.

## Option A: CENTERED CARD ⚠️

```
┌────────────────────────────────────┐
│                                    │
│         ┌──────────────┐           │
│         │   Settings   │           │
│         │   [form]     │           │
│         │   [form]     │           │
│         │   [Save]     │           │
│         └──────────────┘           │
│                                    │
└────────────────────────────────────┘
```

**BANNED AS DEFAULT.** This is what ByteBoundless and every other shadcn app ships by default. It's in this file only so Claude Code can name it and skip it.

- **Pick this ONLY when:** The user explicitly requests it.

## Option B: SPLIT NAVIGATION

```
┌──────┬─────────────────────────────┐
│      │ Settings (display font, big)│
│ Side ├──────┬──────────────────────┤
│ bar  │      │                      │
│      │ Nav: │  Section content     │
│      │      │                      │
│      │ Prof │  field                │
│      │ Bill │  field                │
│      │ Team │  field                │
│      │ API  │                      │
│      │ ...  │  [Save]              │
│      │      │                      │
└──────┴──────┴──────────────────────┘
```

A second sidebar nav appears ONLY on the settings page, listing setting sections. Content on the right updates as the user clicks sections. No scroll-through-a-giant-form.

- **Pick this when:** Settings are extensive (8+ sections). Most SaaS admin products fit here.
- **Tech:** URL-driven tab state (`/settings/profile`, `/settings/billing`). Each section is its own route.
- **Reference sites:** Linear settings, Vercel settings, Stripe Dashboard settings, GitHub settings.
- **Archetype fit:** All.

## Option C: INLINE EDITABLE PROFILE

```
┌──────┬─────────────────────────────┐
│      │                             │
│ Side │  Kevin Bandison             │
│ bar  │  Lead generation & web dev  │
│      │  (both click to edit)       │
│      │                             │
│      │  ── Profile ──              │
│      │  Full name: Kevin Bandison  │
│      │  Email: kevin@luxweb.dev    │
│      │  (click any value to edit)  │
│      │                             │
└──────┴─────────────────────────────┘
```

The settings page LOOKS LIKE a profile view, not a form. Every value is clickable — click it to turn it into an input field, press Enter to save. No "Save" button. Feels like Notion.

- **Pick this when:** The product has a personality (consumer app, creative tool, CMS). Users who will edit settings frequently. Settings feel like "managing your profile" not "configuring the system."
- **Tech:** Inline state transitions with Framer Motion layout animations. Optimistic UI updates.
- **Reference sites:** Notion user settings, Linear profile, Readwise settings.
- **Archetype fit:** Editorial Refined, Soft Consumer, Luxury Minimal, Organic Natural.

## Option D: COMMAND PALETTE DRIVEN

No traditional settings page at all. Users open the command palette (Cmd+K), type "change theme" or "update email" or "enable 2FA," and a slide-over drawer appears with just that one setting. Once saved, it disappears.

- **Pick this when:** The product is already power-user oriented with a command palette. Settings are accessed rarely. Product values keyboard-first navigation.
- **Tech:** `cmdk` library, slide-over drawers via `vaul` or custom Framer Motion.
- **Reference sites:** Linear, Raycast.
- **Archetype fit:** Tech Utilitarian, Brutalist Raw.

## Option E: TABBED HORIZONTAL

```
┌──────┬─────────────────────────────┐
│      │  Settings                   │
│ Side │  ───────                    │
│ bar  │  [Profile] Billing Team API │
│      │  ──────────────────────     │
│      │                             │
│      │  Section content fills      │
│      │  width, organized in a grid │
│      │  for density                │
│      │                             │
└──────┴─────────────────────────────┘
```

Tabs across the top of the settings page. Each tab reveals a grid of fields below — NOT a single column. Uses the full width.

- **Pick this when:** Settings are moderate (3–6 sections). Each section has 4–12 fields. Want density without the hidden-behind-nav feel of split navigation.
- **Tech:** Radix Tabs or shadcn Tabs, URL-synced.
- **Reference sites:** Figma settings, Vercel project settings.
- **Archetype fit:** All. Particularly Tech Utilitarian and Maximalist Playful.

---

# AUTH LAYOUTS

Five distinct approaches. The plain centered form on gray background is banned as default.

## Option A: CENTERED CLASSIC ⚠️

A single-column form centered on a flat background. This is the boring default.

**Pick this ONLY when:** The user explicitly asks for simplicity, OR the project is an internal tool where auth is a formality. Still needs: archetype fonts, archetype accent on the submit button, custom microcopy. Never ship generic "Sign in to your account."

## Option B: SPLIT SCREEN

```
┌─────────────────┬──────────────────┐
│                 │                  │
│   Brand visual  │   Form           │
│   - full image  │   (centered)     │
│   - gradient    │                  │
│   - 3D scene    │   Email          │
│   - video loop  │   Password       │
│   - testimonial │   [Sign in]      │
│   - big quote   │                  │
│                 │                  │
└─────────────────┴──────────────────┘
```

Two columns. Left side is brand/visual (full-bleed image, gradient mesh, 3D scene, video loop, or big editorial quote). Right side is the form, vertically centered.

- **Pick this when:** Consumer products, marketing-adjacent apps, anything where the first impression matters. Default-best auth layout.
- **Tech:** CSS Grid `grid-cols-[1fr_1fr]` or `grid-cols-[1.2fr_1fr]` for asymmetry. Left side hidden on mobile.
- **Reference sites:** Linear login, Vercel login, Arc browser login, Notion login, Framer login.
- **Archetype fit:** All.

## Option C: FULL-BLEED BACKGROUND

Full-bleed hero image, video, or 3D scene covers the entire viewport. The form sits as a frosted-glass (`backdrop-blur`) card floating over the middle or lower-right of the screen.

- **Pick this when:** Strong brand imagery exists. The product is visual/creative (design tools, photo apps, entertainment, games). Retro-Futuristic, Maximalist, or Editorial Photo-Forward archetypes.
- **Tech:** `position: fixed inset-0` background layer. Form with `backdrop-blur-xl` and semi-transparent background.
- **Reference sites:** Diablo IV account page, Spotify login, most game launcher logins.
- **Archetype fit:** Retro-Futuristic, Maximalist Playful, Editorial Documentary Photo-Forward.

## Option D: ASYMMETRIC EDITORIAL

```
┌────────────────────────────────────┐
│                                    │
│   BIG BRAND                        │
│   STATEMENT                        │
│   spans half the                   │
│   viewport                         │
│                           ┌──────┐ │
│   tagline copy            │ Form │ │
│   supporting the          │      │ │
│   statement               └──────┘ │
│                                    │
└────────────────────────────────────┘
```

A massive editorial headline dominates the left and top of the viewport ("Join the archive" in Fraunces at 96px). The form is pushed to the lower-right corner as a small, focused moment.

- **Pick this when:** Editorial archetype, luxury brand, content/publication products. Want auth to feel like opening a book.
- **Tech:** Grid with explicit placement. Form in a grid cell with `col-start` and `row-start`.
- **Reference sites:** Dirt newsletter signup, Are.na login, The New Yorker subscribe.
- **Archetype fit:** Editorial Refined, Luxury Minimal, Organic Natural.

## Option E: MULTI-STEP CARD

A card that progresses through stages with animation. Step 1: email only. Step 2: password. Step 3: name / profile. Each step animates in with a horizontal slide. The card resizes smoothly as content changes using Framer Motion's `layout` prop.

- **Pick this when:** Signup flow. Want to reduce perceived form length. Onboarding-heavy products.
- **Tech:** Framer Motion `AnimatePresence` + `motion.div` with `layout` prop.
- **Reference sites:** Stripe signup, Hinge signup, Calendly signup.
- **Archetype fit:** Soft Consumer, Tech Utilitarian.

---

# DATA DISPLAY PATTERNS

How records are shown. Pick ONE per data type in the product.

## Option A: Traditional Table

Rows and columns with borders and zebra-free striping. Dense, scannable, sortable. Best for: transactional data, numerical comparisons, bulk operations. Row height 44–52px. Header uppercase 11px. Numbers right-aligned with `tabular-nums`. Hover shifts background subtly, never borders.

## Option B: Card List

Each record is a horizontal card spanning full width. More visual breathing room, room for avatars/images/metadata. Best for: user lists, CRM contacts, content items, rich records.

```
┌────────────────────────────────────┐
│ ◉ Name          meta    status   › │
│   Sub info      meta    status     │
├────────────────────────────────────┤
│ ◉ Name          meta    status   › │
│   Sub info      meta    status     │
└────────────────────────────────────┘
```

## Option C: Card Grid

Records as cards in a responsive grid (2–4 columns). Best for: visual content (products, templates, designs, portfolios), media-heavy records.

## Option D: Master/Detail

List column on the left (narrow, 280–320px), detail column on the right. See Dashboard Option F for the pattern.

## Option E: Dense List (Linear-style)

No cards, no borders between rows except subtle dividers. Row is a single line with flex-layout metadata. Ultra-dense. Best for: tasks, issues, logs, developer tools.

```
  Status  Title              Assignee   Date
  ───────────────────────────────────────────
  ● Open  Fix auth bug       Kevin      2d
  ● Done  Ship skill v2      Kevin      1w
  ○ Todo  Refactor db        Kevin      —
```

---

# CRM / CMS Specific Patterns

For projects that need specialized views beyond dashboards:

- **Pipeline / Kanban view** — columns as stages, cards drag between them. React-DnD or `@dnd-kit`.
- **Calendar view** — FullCalendar or custom with date-fns.
- **Map view** — for location-based data, use Mapbox GL or MapLibre.
- **Timeline view** — vertical chronological for activity/audit logs.
- **Tree view** — hierarchical data, category editors, nested pages.

Every CRM/CMS should include AT LEAST 2 view options for the same data (e.g., "Table" and "Kanban" toggles in the top-right).

---

# Reusable Modern Patterns

These are utility patterns used across any app layout above. Use them liberally. Each pattern includes the implementation approach that was proven in ByteBoundless.

## Command Palette (Cmd+K)

Keyboard-first navigation overlay. Triggered globally, fuzzy-searchable, lists navigation destinations and actions.

**Implementation:**
- Use the `cmdk` library (by paco coursey).
- Register a global `keydown` listener for `Cmd+K` / `Ctrl+K`.
- Render as a fixed overlay with backdrop blur.
- Group items by category: Navigation, Actions.
- Style selected items with `data-[selected=true]:bg-accent/10`.
- Include keyboard hints in the footer: `↑↓` navigate, `↵` select, `esc` close.
- Include theme toggle and sign-out as actions.
- Every app with 5+ routes MUST have one.

```tsx
// Structure
<Command>
  <Command.Input placeholder="Search pages, actions..." />
  <Command.List>
    <Command.Group heading="Navigation">
      <Command.Item onSelect={() => router.push("/dashboard")}>Dashboard</Command.Item>
    </Command.Group>
    <Command.Group heading="Actions">
      <Command.Item>Toggle dark mode</Command.Item>
    </Command.Group>
  </Command.List>
</Command>
```

## User Avatar Menu

Replaces standalone logout/settings icons. Shows user identity at a glance.

**Implementation:**
- Circle with user initials (derived from full name, fallback to email first 2 chars).
- Background: accent color. Text: white.
- Click opens a dropdown with: email + plan badge, Settings link, Guide/Help link, Sign Out.
- Include a `Cmd+K` hint at the bottom of the dropdown.
- Dropdown positioned absolute right, z-50.
- Close on outside click via mousedown listener on document.

## Toast Notifications

Use `sonner` for all transient feedback. Never use inline success messages that auto-dismiss.

**Implementation:**
- Install `sonner`, add `<Toaster>` to root layout.
- Style with CSS variables to match the design system:
  ```tsx
  <Toaster
    position="top-right"
    toastOptions={{
      style: {
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        fontSize: "13px",
      },
    }}
  />
  ```
- Use `toast.success("Saved")` for confirmations.
- Use `toast.error("Failed")` for non-blocking errors.
- Keep critical form errors inline (user needs to see them to fix the form).
- Never use `alert()`.

## Skeleton Loaders

ALWAYS match the layout shape of the final content. Never use spinning circles.

**Implementation:**
- Create a `Bone` component: `animate-pulse rounded-lg bg-[var(--color-bg-secondary)]`.
- Create page-specific skeletons that mirror the exact grid/card layout of the loaded state.
- Export from a shared `skeletons.tsx` file.
- Use instead of `<Loader2 className="animate-spin">` everywhere.
- Minimum display time: 300ms to avoid flash.

```tsx
function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[var(--color-bg-secondary)]", className)} />;
}

// Dashboard skeleton mirrors the bento grid
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Bone className="col-span-2 row-span-2 h-52 rounded-2xl" />
      <Bone className="h-24 rounded-2xl" />
      <Bone className="h-24 rounded-2xl" />
    </div>
  );
}
```

## Slide-Over Drawer

Side panel that slides in from the right for secondary content. Use `vaul` or custom Framer Motion. Prefer over modals for anything more complex than a confirmation.

## Floating Action Button

Single primary action fixed at bottom-right on mobile. Hidden on desktop (desktop has the action in the header).

```tsx
<Link
  href="/search/new"
  className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg"
>
  <Plus className="w-6 h-6" />
</Link>
```

## Sticky Section Headers

Headers that stick to the top of the content area as the user scrolls. Use `sticky top-24` (accounting for nav height). Very effective in settings pages with split navigation.

## Help Tooltips

Small info icons that show explanatory text on hover/click. Use `<span>` elements (not `<div>`) so they can nest inside `<p>` tags without hydration errors.

**Implementation:**
- Hover + click to toggle. Click-outside to dismiss.
- Dark background tooltip with white text, `z-50`.
- Position variants: top, bottom, left, right.
- Keep text under 2 sentences.

## Keyboard Shortcuts

Every app surface should have at least: `Cmd+K` (palette), `Esc` (close modal/drawer). Power-user products add:
- `n` — new record / new search
- `f` — toggle filters
- `/` — focus search input
- `?` — show shortcuts help overlay

## Dark Mode

Support system preference + manual toggle. Persist to localStorage.

**Implementation:**
- Define dark palette as CSS overrides in `html.dark { }` block.
- Use a `useTheme` hook with: `theme` (light/dark/system), `setTheme`, `mounted`, `isDark`.
- Only render theme-dependent icons after `mounted` is true (prevents hydration mismatch).
- Add `suppressHydrationWarning` to `<html>`.
- Toggle button in both desktop nav and mobile menu.
- Dark palette shifts: backgrounds to near-black, text to near-white, accent to brighter variant for contrast.

---

# Archetype → App Chrome Translation

Quick reference for how each marketing archetype maps to admin surfaces:

**Editorial Refined** → Magazine Editorial or Focus Mode dashboard. Split Navigation settings. Asymmetric Editorial auth. Cards replaced with typography hierarchy. Display font for page titles stays huge.

**Luxury Minimal** → Focus Mode or Bento Grid dashboard. Inline Editable settings. Split Screen auth with minimal visual. Massive whitespace even in admin. Slow, deliberate motion.

**Tech Utilitarian** → Command Center or Bento Grid dashboard. Command Palette Driven or Tabbed settings. Split Screen or Centered Classic auth. Dense Linear-style lists. Mono fonts in metadata. Full keyboard shortcuts.

**Organic Natural** → Magazine Editorial or Split Canvas dashboard. Inline Editable settings. Asymmetric Editorial or Split Screen auth. Warm sidebar backgrounds. Hand-drawn accent elements possible. Card List for records.

**Brutalist Raw** → Command Center dashboard. Command Palette Driven settings. Centered Classic auth (brutalist embraces utility). Dense lists. The single neon accent stays. Mono type throughout.

**Retro-Futuristic** → Bento Grid dashboard with CRT-scanline effects allowed. Split Navigation settings. Full-Bleed Background auth with looping video. This is where the marketing archetype can bleed into the admin the most.

**Soft Consumer** → Focus Mode or Split Canvas dashboard. Inline Editable settings. Multi-Step Card auth. Card List for records. Gentle spring motion on drawers. Rounded corners everywhere.

**Maximalist Playful** → Bento Grid dashboard. Tabbed Horizontal settings. Split Screen auth with bold visual. Card Grid for records with bold colors. The archetype's color palette extends into data viz.

---

# Anti-Patterns (Banned in App Chrome)

Beyond the LUXWEB.md anti-slop list, these are specific to app surfaces:

1. **Classic Shell dashboard by default** — must be explicitly chosen
2. **Centered Card settings page by default** — must be explicitly chosen
3. **Default shadcn `<Card>` wrapping everything** — use dividers, typography, and spacing instead when possible
4. **Lucide icons at default weight without committing to a single stroke width**
5. **Default Recharts colors** — always override with archetype-derived palette
6. **Generic "No data" empty states** — always custom with voice and illustration or big type
7. **Spinning circle loaders** — skeleton only
8. **Modals for anything more than confirmations** — use slide-over drawers
9. **Breadcrumbs that start with "Home"** — start with the current section
10. **Sidebar nav items at different heights from each other** — tight consistent rhythm
11. **Form labels above AND placeholders saying the same thing** — pick one
12. **Auth pages without the archetype's display font used somewhere**
13. **Dashboards without at least ONE oversized display-font moment** (big stat, page title, section header)
14. **Settings pages that require scrolling through all sections in one column**
15. **Tables without hover states, sort indicators, or selection behavior defined**
16. **Missing `Cmd+K` command palette when app has 5+ routes**
17. **Generic page titles ("Dashboard", "Settings") in body font at 18px** — must be display font at 32–56px
18. **Using `h-screen` on any app surface** — breaks on iOS. Always `min-h-[100dvh]`.
19. **Data viz with default chart library colors**
20. **Dropdowns without keyboard navigation**

---

*When in doubt: look at Linear, Vercel, Notion, Arc, and Superhuman. Those five products have solved distinctive admin UI better than anyone. If your build looks like the shadcn starter and not like one of those — go back and pick a different layout option.*
