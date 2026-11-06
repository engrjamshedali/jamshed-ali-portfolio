# Jamshed Ali — Premium Cinematic Portfolio Architecture & Documentation

## 1. Project Overview
This project is the high-performance, dark-editorial personal portfolio of **Jamshed Ali** — Computer Systems Engineering Student at Sukkur IBA University (CSE-V), Full-Stack Developer, AI & Cybersecurity Researcher, and Founder/CEO of **AuraNix Technologies** (`auranix.tech`).

Transformed from the cinematic RENANDO portfolio specification, this application preserves the original visual language, oversized typography, smooth scroll-driven parallax, magnetic cursor physics, and responsive interactivity while authentically representing Jamshed's verified academic, technical, research, entrepreneurial, and literary identity.

---

## 2. Technology Stack
- **Framework & Runtime:** React 19 (`react` & `react-dom` 19.2.0)
- **Motion Engine:** Framer Motion 12 (`framer-motion` ^12.23.0)
- **Icons:** Lucide React (`lucide-react` ^0.468.0)
- **Bundler:** esbuild (`esbuild` ^0.25.0) targeting ES2020
- **Styling:** Vanilla CSS with custom design tokens, dark editorial variables, and fluid clamp scales
- **Deployment:** Pure static distribution (`index.html` + `Asset/dist/` bundle)

---

## 3. Directory Structure
```
c:/Users/HT COMPUTERS/Desktop/Jamshed Ali Portfolio/
├── index.html                   # Production HTML entrypoint with metadata and Google Fonts
├── package.json                 # Dependency manifests and npm script definitions
├── context.md                   # Complete architectural, design, and status documentation
├── scripts/
│   ├── build.mjs                # Production esbuild script producing app.js and app.css
│   ├── check.mjs                # Fast bundle and syntax verification script
│   ├── test-runner.mjs          # Chrome CDP automated testing and verification suite
│   ├── verify-clean-portfolio.mjs # Dedicated verification asserting absence of all collaboration elements
│   ├── gen-assets.mjs           # Asset and vector generator for technical stacks and brand rails
│   └── find-overflow.mjs        # Viewport overflow regression scanner
├── src/
│   ├── app.jsx                  # Main application component and section hierarchy
│   ├── styles.css               # Core design system, typography, breakpoints, and component styles
│   ├── components/
│   │   ├── AnimatedTimeline.jsx # Scroll-illuminated milestone timeline
│   │   ├── MotionTypography.jsx # Editorial text reveal and keyword cycler
│   │   ├── ProjectCardMotion.jsx# 3D perspective tilt and spotlight card glare
│   │   └── TechEcosystem.jsx    # Interactive skills cluster and node telemetry inspector
│   └── data/
│       ├── projects.json        # 15+ verified engineering, research, and technical projects
│       └── brands.json          # 12 tech ecosystem, university, and community brand entities
├── Asset/
│   ├── cv/
│   │   └── Jamshed_Ali_Resume.pdf  # Verified resume of Jamshed Ali
│   ├── img/
│   │   ├── jamshed-portrait.png # Studio cutout portrait (1024x1536)
│   │   ├── auranix-logo.png     # Official AuraNix Technologies emblem
│   │   ├── auranix-logo.svg     # Scalable vector logo
│   │   ├── siba-logo.png        # Sukkur IBA University emblem
│   │   ├── auraword.png         # AuraWord intelligent processing screenshot
│   │   ├── shikarpur-sweets.png # E-commerce web system screenshot
│   │   ├── favicon.svg          # Modern dark-mode vector favicon
│   │   ├── screenshot-1440.png  # Verified 1440px desktop viewport render
│   │   ├── screenshot-768.png   # Verified 768px tablet viewport render
│   │   └── screenshot-390.png   # Verified 390px mobile viewport render
│   ├── svg/                     # Clean vector icons (VS Code, Python, C++, React, Node, Git, etc.)
│   │   └── brand/               # Brand strip vector badges (SIBA, AuraNix, WP Connect, etc.)
│   └── dist/
│       ├── app.js               # Minified production React + Framer Motion bundle
│       ├── app.js.map           # Source map
│       ├── app.css              # Minified bundled stylesheet
│       └── app.css.map          # Source map
```

---

## 4. Main Components
1. **`Header`**: Fixed header with `JAMSHED ALI®` wordmark, intersection-observed navigation anchors, responsive mobile toggle menu, and a `Motion on/off` toggle persisted in `localStorage` (`jamshed-motion`).
2. **`Hero`**: Layered composition featuring oversized `PORTFOLIO` lettering, cut-out studio portrait of Jamshed Ali, handwriting tagline (*"Building ideas into reality."*), academic role, verified statistics (CSE-V, 15+ projects, 01 AuraNix venture), and CV download action.
3. **`Portfolio`**: Project gallery with dynamic category filtering (*All, Research, Web Development, AI & ML, Cybersecurity, Networking, WordPress, Writing, Creative Experiments*), live text search, and modal exploration.
4. **`BrandStrip`**: Auto-scrolling horizontal brand rail showcasing Sukkur IBA University, AuraNix Technologies, CSE Society, WordPress Campus Connect, Cisco, Python, React, and Git. Supports mouse drag, keyboard pause, and grid expand mode.
5. **`Recognition`**: Editorial showcase featuring the laurel total counter (`06★ KEY MILESTONES`) and list of verified contributions (Agentic AI framework, AuraNix venture, WordPress Campus Connect, Dastan e Hasrat poetry book, and CSE Society lead).
6. **`Breakdown`**: Interactive before/after slider comparing raw network topology / security models (`TOPOLOGY WIREFRAME`) against the final live production interface (`PRODUCTION DASHBOARD`).
7. **`AuraNixSection`**: Dedicated venture spotlight highlighting `auranix.tech`, its 3 technology pillars (Autonomous AI, Scalable Web Engineering, Hardened Cybersecurity), and executive philosophy.
8. **`About`**: Academic background (Sukkur IBA University), technical toolkit tags, software icons, interactive 5-stage engineering process tracker, and signature quote panel (*"Code is poetry, and every coder is a poet."*).
9. **`Journey`**: Interactive accordion timeline tracking verified career and academic milestones, paired with a milestone modal launcher.
10. **`Contact`**: Multimodal contact hub with verified direct links (Email, LinkedIn, GitHub, WhatsApp, Sukkur base), feature highlight reel card, and a functional collaboration brief form formatting drafts for WhatsApp.
11. **`ProjectDialog`**: Accessible modal supporting live website links, multi-angle system architecture views, iframe previews, focus trapping, and `Escape` key dismissal.

---

## 5. Design System
- **Background Ground:** `#090909` (Obsidian Film Ground with fractal SVG noise grain)
- **Panels & Cards:** `#101010` / `#131010`
- **Text Ink:** `#f2efeb` (Warm Off-White)
- **Muted Text:** `#a09c9a` / `#b9b5b2`
- **Accents:** Crimson Red `--red: #ef4151` and Dark Crimson `--red-dark: #ca2032`
- **Separators & Borders:** Dark Charcoal `--line: #292323` / `#33262a`
- **Typography:**
  - Headings & Wordmarks: `Anton` (Ultra-condensed display)
  - Body & UI: `Manrope` (Clean, geometric, accessible sans-serif)
  - Accents & Quotes: `Caveat` (Handwritten touch)

---

## 6. Animation Architecture
- **Global Easing:** `cubic-bezier(0.22, 1, 0.36, 1)`
- **Scroll Parallax:** Scroll-linked transforms on hero title (`y 0 -> 180`), portrait (`y 0 -> 85`, `scale 1 -> 1.08`), and copy (`y 0 -> -55`).
- **Scroll Reveals:** Staggered `y 32 -> 0` with opacity fade upon viewport intersection.
- **Magnetic Buttons:** Spring physics (`stiffness: 220, damping: 20`) following mouse pointers on desktop.
- **Reading Progress:** Top-fixed progress indicator linked to window scroll via `useSpring`.
- **Accessibility:** Instant reduction of transitions and animations when `prefers-reduced-motion` is active or when the user toggles `Motion off` in the header.

---

## 7. Data Structure
- `src/data/projects.json`: Array of project objects containing `type` (`website`, `render`, `image`, `youtube`), `title`, `description`, `media`, `role`, `year`, `category`, `image`, and optional `renders` stages.
- `src/data/brands.json`: Array of partner/technology entities with `file` (SVG relative to `Asset/svg/brand/`) and `name`.

---

## 8. Build Commands
```bash
# Install dependencies
npm install

# Production build (outputs Asset/dist/app.js & Asset/dist/app.css)
npm run build

# Run automated browser test runner & capture responsive screenshots
node scripts/test-runner.mjs

# Serve the static website locally on port 4173
npx serve . -l 4173
```

---

## 9. Verification & Audit Results
- **Production Build:** Passes with zero warnings/errors (`Asset/dist/app.js`: 418 KB, `Asset/dist/app.css`: 47 KB).
- **Responsive Viewports:**
  - 1600px Desktop: No overflow (PASS)
  - 1440px Desktop: No overflow (PASS)
  - 1100px Laptop: No overflow (PASS)
  - 768px Tablet: No overflow (PASS)
  - 600px Mobile: No overflow (PASS)
  - 390px Mobile: No overflow, heading & stats clear, touch targets >= 44px (PASS)
  - 320px Small Mobile: No overflow, scrollWidth exactly 320px (PASS)
- **Motion Toggle:** Tested and verified (`on` -> `off` -> `on`).
- **Interactive Modals:** Tested opening, title inspection, and closing via `Escape` key.
- **Category Filter & Search:** Tested dynamic filtering and keyword search with immediate card count updates.
- **Clean Identity:** 0 occurrences of Renando, DuingZ, or Indramayu in source files.

---

## 10. Completed Changes
1. Audited the full workspace and extracted authentic assets from Jamshed Ali's local repositories and AuraNix archives.
2. Set up React 19 + Framer Motion 12 + esbuild static bundling pipeline.
3. Prepared and preloaded the official transparent cutout portrait `jamshed-portrait.png` (1024x1536).
4. Linked verified resume `Jamshed_Ali_Resume.pdf` in both Hero and Journey sections.
5. Replaced all legacy content with Jamshed Ali's verified profile: Sukkur IBA University, Department of Computer Systems Engineering (CSE-V), Sukkur, Pakistan.
6. Featured the Agentic AI for Autonomous Cyber-Defense research framework as a primary highlight.
7. Integrated Dastan e Hasrat (داستانِ حسرت) literary poetry publication in Writing category and Journey milestones.
8. Authored dedicated AuraNix Technologies section (`auranix.tech`) featuring core technology pillars and executive philosophy.
9. Implemented interactive architecture before/after breakdown slider for the Zenith cybersecurity suite.
10. Built a real working project inquiry brief form formatting messages for WhatsApp.
11. Created responsive vector SVGs for developer tools (VS Code, Python, C++, React, Node.js, Git, WordPress, Cisco).
12. **Complete Removal of the Simulated Collaboration System**:
    - Removed all fake collaborator cursors, multiple AuraNix-shaped pointers, and cursor swarm trailing particles.
    - Removed cursor convergence animation and the `AuraNixConvergenceEmblem` component.
    - Removed all simulated collaborator wandering logic, presence indicators, avatars, and labels (Jamshed [Architect], AuraNix-AI [Agent], Elena [Design], Kaelen [SecOps]).
    - Removed the floating `ActivityDock` widget and all simulated live building status and development activity messages.
    - Removed all `CanvasFrameBadge` design tool frame markers (`CANVAS #00`, `FRAME #01` through `FRAME #08`) from every section.
    - Removed `collab-inspect-pill` ("AuraNix Inspect") badges from project cards.
    - Restored the native, clean, responsive browser cursor experience across the entire website with zero interfering overlays or pointer hijacking.
    - Preserved all premium portfolio animations: smooth page transitions, scroll parallax, text and character reveals, role keyword cycling, 3D project card perspective tilt, spotlight card glare, interactive tech ecosystem node inspector, and scroll-illuminated milestone timeline beam.
    - Cleaned all dead components, stylesheets, and obsolete test files.
13. Verified 100% across all automated test suites (`test-runner.mjs` and `verify-clean-portfolio.mjs`) across 7 viewports (1600px down to 320px) with ZERO console errors.

---

## 11. Verification Suites
- `node scripts/test-runner.mjs`: Tests section IDs, headings, viewports, motion toggle, category filters, modal dialog, and accordion.
- `node scripts/verify-clean-portfolio.mjs`: Rigorous automated CDP verification asserting 100% absence of all collaboration elements, normal cursor styles, full page scroll, preserved animations, and zero console errors.

