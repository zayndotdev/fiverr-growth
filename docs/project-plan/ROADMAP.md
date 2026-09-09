# FiverrGrowth — Development Roadmap

> Step-by-step execution plan. Each milestone builds on the previous one.  
> Current status markers: ⬜ Not started | 🔨 In progress | ✅ Complete

---

## Milestone 1: Foundation & Auth Hardening ⬜
**Goal:** Solid auth, proper routing, and navigation guards.

| # | Task | Priority |
|---|------|----------|
| 1.1 | Install `react-router-dom` v7 and set up URL-based routing | 🔴 Critical |
| 1.2 | Create `ProtectedRoute` wrapper (redirects unauthenticated users to `/` with auth modal) | 🔴 Critical |
| 1.3 | Create `OnboardingGuard` wrapper (redirects un-onboarded users to `/onboarding`) | 🔴 Critical |
| 1.4 | Move auth from modal-only to proper login/register pages at `/auth/login` and `/auth/register` (keep modal as alternative) | 🟡 Major |
| 1.5 | Fix JWT secret — move to `.env` with proper random secret | 🔴 Critical |
| 1.6 | Add `onboardingCompleted`, `onboardingSkipped`, `onboardingStep` fields to User schema | 🔴 Critical |
| 1.7 | Fix data shape desync between frontend context and backend storage | 🔴 Critical |

---

## Milestone 2: Onboarding Flow Rebuild ⬜
**Goal:** Production-grade 3-step onboarding (Profile → ICPs → Confirmation).

| # | Task | Priority |
|---|------|----------|
| 2.1 | Build `/onboarding` layout with step indicator and navigation | 🔴 Critical |
| 2.2 | **Step 1 — Profile Ingestion:** Refactor existing `OnboardingStep1.tsx` into the new onboarding flow (keep scraping logic, update UI to match new design) | 🔴 Critical |
| 2.3 | **Step 2 — ICP Identification:** Build new `OnboardingStep2.tsx` — AI-generated ICPs from scraped profile data | 🔴 Critical |
| 2.4 | Build ICP generation backend: `POST /api/v1/onboarding/generate-icps` | 🔴 Critical |
| 2.5 | Build ICP generation prompt template for Gemini API (structured JSON output) | 🔴 Critical |
| 2.6 | Build ICP card UI components (visual cards showing each persona) | 🟡 Major |
| 2.7 | Allow user to edit/regenerate individual ICPs | 🟡 Major |
| 2.8 | **Step 3 — Confirmation Summary:** Build `OnboardingStep3.tsx` — summary view with "Confirm & Complete" | 🔴 Critical |
| 2.9 | Implement "Skip Onboarding" flow (sets `onboardingSkipped: true`, shows persistent banner) | 🟡 Major |
| 2.10 | Save ICP profiles to database on confirmation | 🔴 Critical |
| 2.11 | Remove old Step 2 (AI chat interview) and Step 3 (market blueprint) | 🟢 Cleanup |

---

## Milestone 3: Settings Page ⬜
**Goal:** User account management and onboarding control.

| # | Task | Priority |
|---|------|----------|
| 3.1 | Create `/settings` page with tab layout | 🟡 Major |
| 3.2 | **Account tab:** Display/edit username, email; change password; sign out | 🟡 Major |
| 3.3 | **Fiverr Profile tab:** View linked profile, re-scrape, disconnect | 🟡 Major |
| 3.4 | **Onboarding tab:** Show status (completed/skipped/in-progress), "Redo Onboarding" button | 🟡 Major |
| 3.5 | Add Settings link to Navbar profile dropdown | 🟢 Minor |
| 3.6 | Build backend endpoints: `PUT /api/v1/user/profile`, `PUT /api/v1/user/password`, `DELETE /api/v1/user/account` | 🟡 Major |

---

## Milestone 4: Fix Existing Module Bugs ⬜
**Goal:** Make all existing tabs functional with correct API calls.

| # | Task | Priority |
|---|------|----------|
| 4.1 | Fix `MarketResearchView.tsx` — correct API endpoints (`/market/intelligence` and `/research/niche`) | 🔴 Critical |
| 4.2 | Fix `BuyerBriefView.tsx` — align payload keys (`urgency`, `user_skills` as array) | 🔴 Critical |
| 4.3 | Integrate `SellerCockpit.tsx` into the dashboard layout or remove it | 🟡 Major |
| 4.4 | Remove orphaned `HeroScene.tsx` (3D component) | 🟢 Cleanup |
| 4.5 | Add proper loading/error states to all external API calls | 🟡 Major |

---

## Milestone 5: Data & Infrastructure ⬜
**Goal:** Production-ready data layer.

| # | Task | Priority |
|---|------|----------|
| 5.1 | Migrate from file-based `store.json` to MongoDB with Mongoose | 🟡 Major |
| 5.2 | Add async write operations (replace `writeFileSync`) | 🔴 Critical (if keeping JSON store) |
| 5.3 | Add proper error handling and validation across all controllers | 🟡 Major |
| 5.4 | Implement rate limiting on scraper endpoints | 🟡 Major |

---

## Milestone 6: Polish & Production Readiness ⬜
**Goal:** Ship-quality product.

| # | Task | Priority |
|---|------|----------|
| 6.1 | Persistent onboarding banner for skipped users | 🟢 Minor |
| 6.2 | Toast notification system for success/error feedback | 🟢 Minor |
| 6.3 | Mobile responsive audit across all pages | 🟡 Major |
| 6.4 | SEO meta tags and proper page titles per route | 🟢 Minor |
| 6.5 | Performance optimization (code splitting, lazy loading) | 🟢 Minor |

---

## Execution Order

```
Milestone 1 (Foundation)  →  Milestone 2 (Onboarding)  →  Milestone 3 (Settings)
                                                          ↓
                                              Milestone 4 (Bug Fixes)
                                                          ↓
                                              Milestone 5 (Data Layer)
                                                          ↓
                                              Milestone 6 (Polish)
```

**Current Focus: Milestone 1 → Milestone 2**
