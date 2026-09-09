# FiverrGrowth — Known Issues & Technical Debt

> Discovered during comprehensive codebase audit on 2026-09-10.  
> Each issue is tagged with severity and must be resolved before production deployment.

---

## 🔴 Critical Issues (Blocks Core Functionality)

### 1. No Onboarding Gating or Navigation Guards
**File:** `frontend/src/App.tsx`  
**Problem:** Navigation is managed via `useState('strategist')` with no route protection. Any user (guest, unauthenticated, or un-onboarded) can freely switch to Gigs, Briefs, Research, or Saved tabs.  
**Impact:** Users can access tools that require seller context without completing onboarding, resulting in ungrounded/generic outputs.  
**Fix:** Implement React Router with `ProtectedRoute` and `OnboardingGuard` components.

### 2. No URL-Based Routing
**File:** `frontend/src/App.tsx`  
**Problem:** The entire SPA uses `useState` tab switching. No `react-router-dom`, no URL paths, no browser history support.  
**Impact:** Browser back/forward buttons don't work. Deep-linking is impossible. Page refresh always resets to the strategist tab.  
**Fix:** Install `react-router-dom` v7 and implement proper URL routing.

### 3. Data Shape Desync — Blueprint Disappears on Refresh
**Files:** `frontend/src/context/AuthContext.tsx`, `backend/src/controllers/strategist.controller.ts`, `backend/src/db/store.ts`  
**Problem:** Frontend saves context as `{ profile: {...}, strategy: {...} }`, but backend stores it as `{ fullName, primarySkills, marketStrategy: {...} }`. On refresh, `GET /strategist/context/:userId` returns the raw DB shape, causing `userContext.profile` and `userContext.strategy` to be `undefined`.  
**Impact:** Every page reload loses the user's completed onboarding state and market blueprint.  
**Fix:** Normalize the data shape — backend must transform stored data into the shape the frontend expects, or both must agree on a single canonical schema.

### 4. Broken API Endpoints in MarketResearchView
**File:** `frontend/src/components/modules/MarketResearchView.tsx`  
**Problem:**
- Line 12: Calls `GET /api/v1/research/live?niche=...` → **Does not exist** (correct: `GET /api/v1/market/intelligence`)
- Line 32: Calls `POST /api/v1/research/analyze` → **Does not exist** (correct: `POST /api/v1/research/niche`)  
**Impact:** Market Research tab is completely non-functional. Both requests return 404.  
**Fix:** Update frontend API calls to match actual backend routes.

### 5. Payload Mismatch in BuyerBriefView
**File:** `frontend/src/components/modules/BuyerBriefView.tsx`  
**Problem:** Frontend sends `{ timeline_urgency, freelancer_skills }` but backend Zod schema expects `{ urgency, user_skills }`. The `freelancer_skills` field is sent as a string, but backend expects `string[]`.  
**Impact:** Urgency and skills are silently dropped; proposals use hardcoded generic fallbacks.  
**Fix:** Align frontend payload keys and types with backend Zod schema.

---

## 🟡 Major Issues (Degrades Experience)

### 6. Missing Python AI Microservice Endpoints
**Files:** `backend/src/services/strategist.service.ts`, `ai_orchestration/app/main.py`  
**Problem:** Backend attempts to call `POST /api/ai/strategist/interview` and `POST /api/ai/strategist/synthesize-strategy` on the Python service, but these endpoints don't exist.  
**Impact:** The entire strategist interview and synthesis always falls back to Node.js hardcoded mock responses. The AI layer is never actually used for onboarding.  
**Fix:** Either implement the Python endpoints or move AI logic to direct Gemini API calls from Node.js.

### 7. Orphaned Components
**Files:**
- `frontend/src/components/dashboard/SellerCockpit.tsx` — Fully built dashboard component, never imported or rendered anywhere.
- `frontend/src/components/3d/HeroScene.tsx` — Three.js canvas, never mounted.  
**Impact:** Dead code increases bundle size and confusion.  
**Fix:** Either integrate `SellerCockpit` into the dashboard layout or remove both orphaned components.

### 8. File-Based Database Concurrency Risk
**File:** `backend/src/db/store.ts`  
**Problem:** Uses synchronous `fs.writeFileSync` on every write. `store.json` is 276KB / 6,655 lines. Multiple concurrent requests will block the event loop or corrupt the file.  
**Impact:** Data corruption under load; performance degradation.  
**Fix:** Migrate to MongoDB or at minimum add async writes with a write queue/lock.

### 9. Hardcoded JWT Secret
**File:** `backend/src/services/auth.service.ts`  
**Problem:** JWT secret defaults to `"fiverr_growth_super_secure_jwt_secret_2026"` inline. Not loaded from `.env`.  
**Impact:** Security vulnerability — secret is committed to source code.  
**Fix:** Move to `.env` variable `JWT_SECRET` with a cryptographically random value.

---

## 🟢 Minor Issues (Cleanup)

### 10. No Settings Page
**Impact:** Users cannot manage their account, change password, view linked profile, or redo onboarding.  
**Fix:** Build a dedicated `/settings` page with Account and Onboarding tabs.

### 11. Onboarding Steps 2 & 3 Are Incorrect
**Current:** Step 2 = AI chat interview, Step 3 = Market blueprint with recommended niches.  
**Required:** Step 2 = ICP identification (automated from profile data), Step 3 = Confirmation summary.  
**Fix:** Replace current Steps 2 and 3 with the new ICP and Confirmation flows.

### 12. `SellerCockpit` Still Uses Dark Theme
**File:** `frontend/src/components/dashboard/SellerCockpit.tsx`  
**Status:** Fixed in latest session — converted to Fiverr light design tokens.

### 13. No Loading/Error States for External API Calls
**Impact:** When Google Suggest, Jobicy, or Remotive APIs fail, the UI shows no feedback.  
**Fix:** Add proper loading spinners, error banners, and retry mechanisms.
