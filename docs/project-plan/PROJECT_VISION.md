# FiverrGrowth — Project Vision & Architecture

> **Purpose**: This document is the single source of truth for what this project is, how it works, and where it's going. Every feature, screen, and API must align with this document.

---

## 1. What Is FiverrGrowth?

FiverrGrowth is an **AI-powered growth engine for Fiverr freelancers**. It ingests a seller's real Fiverr profile, identifies their ideal customer profiles (ICPs), and then provides tools to generate optimized gigs, match with live buyer briefs, and conduct market research — all grounded in the seller's actual data.

### Core Philosophy
- **Data-first**: Every recommendation is grounded in the seller's real scraped Fiverr data (skills, gigs, pricing, reviews), not generic templates.
- **Onboarding is the foundation**: The onboarding process builds the user's "identity context" — without it, every downstream tool (gig generator, brief matcher, market research) operates blind.
- **Production-grade**: Clean auth, proper routing, navigation guards, settings, and a polished Fiverr-native visual design.

---

## 2. Complete User Journey (Step-by-Step)

### Phase 1: Authentication
```
User visits site → Sees landing/home page → Clicks "Sign In / Join"
  ├── Register: username + email + password → Account created → JWT issued
  └── Login: email + password → JWT issued
```

### Phase 2: Onboarding (Mandatory for New Users)
After signup, the user is immediately redirected to the onboarding flow. They **cannot access any other page** (dashboard, gigs, briefs, research, settings) until onboarding is completed **or** explicitly skipped.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW (3 Steps)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Fiverr Profile Ingestion                               │
│  ─────────────────────────────────                              │
│  • User enters their Fiverr username or profile URL             │
│  • System scrapes their complete Fiverr profile in real-time:   │
│    - Display name, avatar, tagline, bio, country                │
│    - Seller level, rating, review count                         │
│    - All published gigs with 3-tier pricing                     │
│    - Skills, languages, education, certifications               │
│    - Recent buyer reviews                                       │
│  • Shows scraped data on-screen for user to verify              │
│  • User confirms → data saved to DB → advances to Step 2       │
│                                                                 │
│  STEP 2: ICP (Ideal Customer Profile) Identification            │
│  ──────────────────────────────────────────────────              │
│  • System analyzes the scraped profile data using AI to         │
│    generate 2-4 distinct Ideal Customer Profiles:               │
│    - Target industries & verticals                              │
│    - Company sizes (solo → enterprise)                          │
│    - Buyer job titles & roles                                   │
│    - Pain points & buying triggers                              │
│    - Budget ranges (derived from gig pricing tiers)             │
│    - Communication & collaboration preferences                  │
│    - Anti-ICP criteria (who to avoid)                           │
│  • ICPs are displayed as visual cards on the UI                 │
│  • User can review, edit, or regenerate ICPs                    │
│  • User confirms → ICPs saved to DB → advances to Step 3       │
│                                                                 │
│  STEP 3: Profile & ICP Confirmation Summary                     │
│  ──────────────────────────────────────────                     │
│  • Full summary view showing:                                   │
│    - Scraped Fiverr profile overview                            │
│    - All generated ICPs with key attributes                     │
│    - Recommended market positioning                             │
│  • User reviews everything and clicks "Confirm & Complete"      │
│  • Onboarding marked complete in DB                             │
│  • User is redirected to the main dashboard                     │
│                                                                 │
│  [Skip Onboarding] button available on every step               │
│  • Marks onboarding as "skipped" (not "completed")              │
│  • User can access all pages but with limited context           │
│  • Onboarding can be resumed from Settings at any time          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Main Application (Post-Onboarding)
Once onboarding is completed (or skipped), the user has access to:

| Tab | Purpose | Data Dependency |
|-----|---------|-----------------|
| **Dashboard** | Overview of seller readiness, KPIs, growth pipeline | Onboarding profile + ICPs |
| **Gig Studio** | Generate optimized 5-tag SEO gig packages | Grounded in seller's skills, ICPs, and pricing |
| **Buyer Briefs** | Match with live remote client job postings | Filtered by seller's skills and ICP industries |
| **Market Research** | Real-time niche analysis with Google Suggest, GitHub, job boards | Targeted to seller's niches and ICP verticals |
| **Saved** | Library of saved gigs and proposals | Persistent storage |
| **Settings** | Account management + onboarding re-do | Always accessible |

### Phase 4: Settings Page
Accessible from the profile dropdown or a dedicated nav item:

| Settings Tab | Contents |
|-------------|----------|
| **Account** | Username, email, password change, account deletion |
| **Fiverr Profile** | View/update linked Fiverr profile, re-scrape, disconnect |
| **Onboarding** | View current onboarding status, restart/redo onboarding flow |
| **Preferences** | (Future) Notification settings, default currency, timezone |

---

## 3. Onboarding Gating Rules

These are **hard rules** that must be enforced at both the frontend (route guards) and backend (middleware) levels:

1. **New user after signup** → Immediately redirected to `/onboarding`
2. **User with `onboardingCompleted: false` AND `onboardingSkipped: false`** → Redirected to `/onboarding` on every page load
3. **User who clicked "Skip"** → `onboardingSkipped: true` → Can access all pages, but sees a persistent banner: "Complete your onboarding for personalized recommendations"
4. **User who completed onboarding** → `onboardingCompleted: true` → Full access, no banners
5. **Settings > Onboarding > "Redo Onboarding"** → Resets `onboardingCompleted` to false, redirects to `/onboarding` Step 1

---

## 4. ICP Generation: How It Works

### Input Data (from Step 1 scrape)
- Seller's gig titles, descriptions, pricing tiers (Basic/Standard/Premium)
- Seller's skills list (e.g., React, Node.js, AI, Flutter)
- Seller's Fiverr category/subcategory
- Seller's tagline and bio description
- Seller's buyer reviews (what clients said, their countries)
- Seller's pricing range (floor to ceiling)
- Seller level, Pro status, agency status

### ICP Generation Pipeline
```
Scraped Profile Data
       │
       ▼
[1. Data Preprocessing]
  • Filter reviews (keep substantive ones > 15 words)
  • Extract price metrics (floor, median, ceiling)
  • Map skills to industry verticals via keyword ontology
       │
       ▼
[2. AI Generation (Gemini / Groq)]
  • Structured prompt with seller data injected
  • Chain-of-thought reasoning: Skills → Industries → Company Sizes → Roles → Pain Points
  • Output: JSON array of 2-4 ICP objects
       │
       ▼
[3. Post-Validation]
  • Budget min >= seller's lowest tier price
  • 2-4 distinct personas returned
  • No hallucinated enterprise budgets for budget sellers
       │
       ▼
[4. Persist to DB + Return to UI]
```

### ICP Data Structure (per profile)
Each ICP contains:
- **Persona Name** (e.g., "The Funded SaaS Founder")
- **Priority** (primary / secondary / tertiary)
- **Target Industries** (e.g., FinTech, E-Commerce, HealthTech)
- **Company Sizes** (solo, seed, SMB, mid-market, enterprise)
- **Buyer Roles** (Founder, CTO, Agency Owner, Marketing Manager)
- **Technical Literacy** (non-technical / semi-technical / highly-technical)
- **Pain Points & Triggers** (why they're hiring now)
- **Budget Range** (min / max / median, derived from pricing tiers)
- **Communication Preferences** (async vs high-touch, tools used)
- **Anti-ICP Criteria** (red flags, disqualifying factors)
- **Targeting Signals** (search keywords, pitch hooks)

---

## 5. Technical Architecture

### Frontend Stack
- React 19 + TypeScript
- Tailwind CSS v4
- React Router v7 (URL-based routing with guards)
- GSAP (page transition animations)
- Lucide React (icons)

### Backend Stack
- Node.js + Express + TypeScript
- JWT authentication (bcryptjs + jsonwebtoken)
- Zod validation
- File-based JSON store (→ MongoDB migration planned)
- Real-time external APIs: Google Suggest, Jobicy, Remotive, GitHub Search

### AI Layer
- Google Gemini API (primary LLM for ICP generation and strategy synthesis)
- Groq API (fast inference fallback)
- Structured JSON output with schema enforcement

### Visual Design System
- Fiverr's authentic light design language
- Canvas: `#f7f7f7` | Cards: `#ffffff` | Borders: `#dadbdd`
- Primary green: `#1dbf73` | Dark text: `#222325` | Muted: `#74767e`
- Typography: Macan, Helvetica Neue, Arial, sans-serif

---

## 6. URL Structure (React Router)

| Path | Component | Auth Required | Onboarding Required |
|------|-----------|---------------|---------------------|
| `/` | Landing / Dashboard | No (landing) / Yes (dashboard) | No (landing) / Depends (dashboard) |
| `/onboarding` | OnboardingFlow | Yes | N/A (this IS onboarding) |
| `/onboarding/step/1` | Step1 - Profile Ingestion | Yes | N/A |
| `/onboarding/step/2` | Step2 - ICP Identification | Yes | N/A |
| `/onboarding/step/3` | Step3 - Confirmation | Yes | N/A |
| `/dashboard` | Main Dashboard | Yes | Yes (or skipped) |
| `/gigs` | Gig Studio | Yes | Yes (or skipped) |
| `/briefs` | Buyer Briefs | Yes | Yes (or skipped) |
| `/research` | Market Research | Yes | Yes (or skipped) |
| `/saved` | Saved Library | Yes | Yes (or skipped) |
| `/settings` | Settings Page | Yes | No |
| `/settings/account` | Account Tab | Yes | No |
| `/settings/onboarding` | Onboarding Tab | Yes | No |

---

## 7. Database Schema (Target State)

### User Collection
```typescript
{
  id: string,
  email: string,
  username: string,
  passwordHash: string,
  avatarUrl?: string,
  createdAt: string,
  updatedAt: string,
  // Onboarding state
  onboardingCompleted: boolean,   // true when all 3 steps confirmed
  onboardingSkipped: boolean,     // true when user clicked "Skip"
  onboardingStep: number,         // 1, 2, or 3 (current progress)
  // Linked Fiverr profile (from Step 1)
  fiverrUsername?: string,
  fiverrProfile?: ScrapedFiverrProfile,
  // Generated ICPs (from Step 2)
  icpProfiles?: IcpProfile[],
  icpGeneratedAt?: string,
  // Derived context (skills, niches, positioning)
  skills?: string[],
  targetNiches?: string[],
  marketPositioning?: string,
}
```

### ICP Profile (embedded in User)
```typescript
{
  icpId: string,
  personaName: string,
  priority: 'primary' | 'secondary' | 'tertiary',
  confidenceScore: number,
  targetFirmographics: {
    industries: string[],
    companySizes: string[],
    targetGeographies: string[],
  },
  buyerPersona: {
    jobTitles: string[],
    seniorityLevel: string,
    technicalLiteracy: string,
  },
  projectFit: {
    budgetRange: { min: number, max: number, currency: string },
    typicalDeliverables: string[],
  },
  painPointsAndTriggers: {
    acutePainPoints: string[],
    buyingTriggerEvents: string[],
  },
  collaborationPreferences: {
    communicationStyle: string,
    preferredChannels: string[],
  },
  antiIcpCriteria: {
    redFlagPhrases: string[],
    disqualifyingFactors: string[],
  },
  targetingSignals: {
    searchKeywords: string[],
    recommendedPitchHook: string,
  },
}
```
