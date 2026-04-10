# LuxWeb Design Skill

A modular design system AND production workflow for Claude Code. Turns AI-assisted builds from "one-shot generic output" into a disciplined 7-phase pipeline with mandatory creative direction, structured content planning, asset sourcing, and polished delivery.

## Files

```
luxweb-skill/
├── LUXWEB.md        # Master rules — design constitution, philosophy, dials, anti-slop, gates
├── WORKFLOW.md      # The 7-phase production pipeline (start here for new projects)
├── ARCHETYPES.md    # 8 design archetypes × 3 variations = 24 creative directions (marketing)
├── APP.md           # 21 layout options across dashboards, settings, auth, data displays (admin/CRM/CMS)
├── STACK.md         # Project setup — deps, directory structure, base files, CSS pitfalls
├── MOTION.md        # Animation — GSAP, Framer Motion, Lenis, scroll choreography
├── COMPONENTS.md    # Marketing UI patterns — nav, hero, cards, CTA, footer, states
├── 3D.md            # WebGL — React Three Fiber, shaders, particles (optional)
└── README.md        # This file
```

## How It Works

When you ask Claude Code to build anything new, it follows the 7 phases from `WORKFLOW.md`:

1. **Brief** — 3 quick questions to understand what you're building
2. **Archetype Gate** — Present 8 archetypes, wait for selection, present 3 variations, wait for selection. Mandatory.
3. **Content Inventory** — Claude Code drafts every section, every piece of copy, every image needed. You review.
4. **Asset Sourcing** — Claude Code generates a batch of Higgsfield-ready image prompts from the archetype template. You generate in Higgsfield, drop files into `public/images/` with the matching filenames, Claude Code optimizes.
5. **Build** — Scaffolds the project, applies the archetype spec, builds sections one at a time. Pauses after the hero for your review. **If the project includes app surfaces (dashboards, admin, settings, auth), Claude Code runs the App Layout Selection Gate from APP.md before building them.**
6. **Polish** — Runs the 40-point anti-slop audit, performance check, accessibility check, responsive testing across 6 widths.
7. **Deploy** — Vercel push, env vars, domain, post-deploy verification checklist.

Each phase has clear ownership (Claude Code / You / Shared) and natural checkpoints where you can course-correct without rebuilding.

## The Two Mandatory Gates

The most important features of this skill are two gates that prevent generic output:

### Gate 1: Archetype Selection (Marketing)
Claude Code cannot start building marketing surfaces until you've picked an archetype + variation. This forces creative range — no more defaults, no more house style repeating across projects. Defined in `LUXWEB.md` and `ARCHETYPES.md`.

### Gate 2: App Layout Selection (Admin/Dashboard)
Claude Code cannot start building dashboards, admin panels, settings pages, or auth flows until you've picked a structural layout for each surface. This solves the "every dashboard ends up as sidebar + 3 stat cards + 2-column grid" problem. Defined in `APP.md`.

Together, these gates structurally prevent the two ways AI-built sites become generic: same visual treatment OR same structural skeleton. With both gates active, every project starts from a distinct creative AND structural direction.

## Usage

## Setup

### Option 1: Project Root (Per Project)

Copy the skill files into your project root. Claude Code reads them when you reference them:

```
my-project/
├── .luxweb/
│   ├── LUXWEB.md
│   ├── STACK.md
│   ├── MOTION.md
│   ├── COMPONENTS.md
│   └── 3D.md
└── ...
```

Then tell Claude Code:

```
Read .luxweb/LUXWEB.md and follow it as the design system. 
Read .luxweb/STACK.md for project setup.
```

### Option 2: CLAUDE.md Auto-Read

Add a `CLAUDE.md` in the project root that references the skill:

```markdown
# Project Instructions

Read and follow `.luxweb/LUXWEB.md` on every task. 
Read `.luxweb/STACK.md` when setting up or scaffolding.
Read `.luxweb/MOTION.md` when building animations.
Read `.luxweb/COMPONENTS.md` when building UI sections.
Read `.luxweb/3D.md` only if this project uses 3D/WebGL.
```

### Option 3: Global Claude Code Instructions

If you want these rules on ALL projects, add LUXWEB.md to your global Claude Code settings / project instructions.

## Usage

### Starting a New Project

```
Build a new project following the LuxWeb skill files.

Settings:
- DESIGN_VARIANCE: 7
- MOTION_INTENSITY: 8
- VISUAL_DENSITY: 3
- DARK_MODE: 1

Font: Syne + General Sans
Accent: #FF4D00
```

### Quick Overrides

```
"Make it more spacious"         → Lowers VISUAL_DENSITY
"Add more animation"            → Raises MOTION_INTENSITY
"Keep it clean and centered"    → Lowers DESIGN_VARIANCE
"Add 3D elements to the hero"   → Claude reads 3D.md
"Apple-style product page"      → VARIANCE 3, centered, alternating dark/light
"Agency portfolio showcase"     → VARIANCE 8, MOTION 9, asymmetric layouts
```

## Which Files to Read When

| Task | Files Needed |
|------|-------------|
| New project from scratch | LUXWEB.md + STACK.md + MOTION.md + COMPONENTS.md |
| Adding animation to existing page | LUXWEB.md + MOTION.md |
| Building a specific section | LUXWEB.md + COMPONENTS.md |
| Adding 3D to a project | LUXWEB.md + 3D.md |
| Design audit / fixing slop | LUXWEB.md (anti-slop checklist) |
| Quick component (button, card) | LUXWEB.md + COMPONENTS.md |
