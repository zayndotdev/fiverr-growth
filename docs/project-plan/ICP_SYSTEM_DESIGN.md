# FiverrGrowth — ICP (Ideal Customer Profile) System Design

> Technical specification for the automated ICP generation system.  
> This is the core intelligence layer that powers Step 2 of onboarding.

---

## 1. What Is an ICP for a Fiverr Freelancer?

An Ideal Customer Profile (ICP) defines the **specific buyer archetype** that maximizes a freelancer's:
- **Effective Hourly Rate (EHR)** — high-margin gigs with minimal revision overhead
- **Client Satisfaction** — 5-star reviews, zero disputes, rapid sign-offs
- **Lifetime Value (LTV)** — repeat business, retainers, referrals
- **Operational Efficiency** — clear requirements, async communication, low management overhead

Unlike B2B SaaS ICPs (which target accounts/organizations), a freelancer's ICP targets **individual buyers + their project scenarios**.

---

## 2. ICP Attributes

Each ICP persona contains these dimensions:

### 2.1 Firmographics (Who is the company?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Industries | Business verticals that naturally hire for this skill set | FinTech, E-Commerce, HealthTech, EdTech |
| Company Size | Organizational scale | solo (1), seed (2-10), SMB (11-50), mid-market (51-200), enterprise (200+) |
| Business Model | How they make money | B2B SaaS, D2C E-commerce, Digital Agency, Marketplace |
| Geography | Where they operate/hire from | US, UK, CA, AU, EU |

### 2.2 Buyer Persona (Who is the person?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Job Titles | Typical roles that purchase this service | Founder, CTO, Head of Product, Agency Owner |
| Seniority | Decision-making level | C-Level, VP/Director, Manager, Solo Owner |
| Technical Literacy | How much they understand the work | Non-technical, Semi-technical, Highly technical |
| Decision Authority | Can they approve the purchase alone? | Sole decision maker, Budget holder, Committee |

### 2.3 Project Fit (What do they need?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Service Categories | Types of work they hire for | Mobile MVP, API Integration, Landing Page |
| Typical Deliverables | What they expect to receive | Working React Native app, Figma-to-code conversion |
| Budget Range | How much they typically spend | min: $500, max: $2500, median: $1200 |
| Pricing Model | How they prefer to pay | Fixed price, Milestone-based, Monthly retainer |

### 2.4 Pain Points & Triggers (Why are they hiring now?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Acute Pain Points | Urgent problems driving the purchase | "No in-house dev team", "Previous freelancer disappeared" |
| Buying Triggers | Events that created urgency | "Just raised seed funding", "App Store rejection" |
| Desired Outcomes | What success looks like | "Working MVP on TestFlight in 3 weeks" |

### 2.5 Collaboration Preferences (How do they work?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Communication Style | How they prefer to interact | Async/autonomous, High-touch/collaborative |
| Preferred Channels | Tools they use | Fiverr Chat, Loom, Figma, Slack |
| Update Cadence | How often they want progress reports | Daily, Bi-weekly, Milestone-only |

### 2.6 Anti-ICP (Who to avoid?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Red Flag Phrases | Things bad clients say | "Build me Uber for $50", "Do a free test first" |
| Disqualifying Factors | Hard no-go criteria | "Budget under $100 for full-stack build" |

### 2.7 Targeting Signals (How to find/attract them?)
| Attribute | Description | Example Values |
|-----------|-------------|---------------|
| Search Keywords | What they search on Fiverr | "react native mvp", "ai chatbot developer" |
| Client Review Keywords | What satisfied clients say | "fast delivery", "understood startup requirements" |
| Pitch Hook | One-sentence value proposition | "I build investor-ready MVPs in 14 days" |

---

## 3. Deriving ICPs from Scraped Profile Data

### 3.1 Industry Derivation (Skills → Verticals)
Map the seller's skills to industry verticals using a keyword ontology:

```typescript
const SKILL_TO_INDUSTRY_MAP: Record<string, string[]> = {
  // E-Commerce & D2C
  'shopify': ['E-Commerce', 'D2C Retail'],
  'woocommerce': ['E-Commerce', 'D2C Retail'],
  'stripe': ['E-Commerce', 'FinTech', 'SaaS'],
  'klaviyo': ['E-Commerce', 'D2C Marketing'],
  
  // AI & SaaS
  'langchain': ['AI Startups', 'B2B SaaS', 'Enterprise AI'],
  'openai': ['AI Startups', 'B2B SaaS'],
  'python': ['AI Startups', 'Data Engineering', 'Automation'],
  'fastapi': ['B2B SaaS', 'API-First Startups'],
  
  // Mobile
  'flutter': ['Mobile Startups', 'Consumer Apps', 'HealthTech'],
  'react native': ['Mobile Startups', 'Consumer Apps'],
  
  // Web
  'react': ['B2B SaaS', 'E-Commerce', 'Digital Agency'],
  'nextjs': ['B2B SaaS', 'E-Commerce', 'Content Platforms'],
  'nodejs': ['B2B SaaS', 'API-First Startups'],
  
  // Web3
  'solidity': ['Web3', 'DeFi', 'FinTech'],
  'web3': ['Web3', 'DeFi', 'Crypto'],
};
```

### 3.2 Company Size Derivation (Pricing → Scale)

| Seller's Premium Tier Price | Inferred Company Size |
|----------------------------|----------------------|
| < $100 | Solo / Hobbyist |
| $100 – $500 | Bootstrapped Startup / Local Business |
| $500 – $2,000 | Funded Seed/Series A / Established SMB |
| $2,000 – $5,000+ | Mid-Market / Enterprise / Agency |

### 3.3 Budget Range Derivation

```
Budget Floor     = Price(Basic Tier)
Budget Sweet Spot = Price(Standard Tier) to Price(Premium Tier)
Budget Ceiling    = Price(Premium Tier) × 2.0
```

If seller has Pro badge: apply 2.5× multiplier to all ranges.

### 3.4 Review Signal Extraction

| Review Pattern | Inferred Signal |
|---------------|----------------|
| "He explained everything patiently" | Non-technical buyer, high-touch communication |
| "My client loved the work" | Agency reseller / white-label subcontractor |
| "Delivered before our sprint deadline" | In-house engineering team, technical buyer |
| "Our previous developer disappeared" | Reliability is the #1 pain point |
| "Helped launch my business idea" | Non-technical founder, solo entrepreneur |

---

## 4. AI Prompt Template for ICP Generation

```markdown
You are a Principal B2B Market Strategist specializing in freelance marketplace 
business models (Fiverr, Upwork).

Analyze the provided Fiverr seller profile data and generate 2 to 4 distinct, 
actionable Ideal Customer Profiles (ICPs).

### RULES:
1. GROUNDING: Every ICP must be derived from verifiable signals in the seller's 
   skills, pricing tiers, gig descriptions, and client reviews. Do NOT hallucinate 
   enterprise budgets if the seller only offers $25 bug fixes.
2. DIVERSITY: Generate distinct personas (e.g., Primary: Core Volume Buyer; 
   Secondary: High-Margin Retainer Buyer; Tertiary: White-Label Agency).
3. ANTI-ICP: Define who this seller should REJECT.
4. BUDGET VALIDATION: ICP budget min must be >= seller's lowest tier price.

### SELLER DATA:
- Username: {{username}}
- Tagline: "{{tagline}}"
- Bio: "{{description}}"
- Skills: {{skills}}
- Seller Level: {{sellerLevel}} | Pro: {{isPro}} | Agency: {{isAgency}}
- Rating: {{rating}} ({{reviewCount}} reviews)
- Country: {{country}}

### GIGS:
{{#each gigs}}
Gig: "{{title}}"
  Basic: ${{packages.basic.price}} ({{packages.basic.deliveryDays}} days)
  Standard: ${{packages.standard.price}} ({{packages.standard.deliveryDays}} days)  
  Premium: ${{packages.premium.price}} ({{packages.premium.deliveryDays}} days)
  Description: "{{description}}"
  Tags: {{tags}}
{{/each}}

### CLIENT REVIEWS (Sample):
{{#each reviews}}
- [{{rating}}★ | {{country}}] "{{comment}}"
{{/each}}

### OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "icpProfiles": [
    {
      "icpId": "icp_1",
      "personaName": "The [Descriptive Title]",
      "priority": "primary|secondary|tertiary",
      "confidenceScore": 0.0-1.0,
      "targetFirmographics": {
        "industries": ["..."],
        "companySizes": ["solo_1"|"seed_2_10"|"smb_11_50"|"midmarket_51_200"|"enterprise_200_plus"],
        "targetGeographies": ["US", "UK", ...]
      },
      "buyerPersona": {
        "jobTitles": ["..."],
        "seniorityLevel": "C-Level|VP_Director|Manager|Owner_Solo",
        "technicalLiteracy": "non_technical|semi_technical|highly_technical"
      },
      "projectFit": {
        "typicalDeliverables": ["..."],
        "budgetRange": { "min": N, "max": N, "currency": "USD" },
        "preferredPricingModel": "fixed_price|milestone_based|monthly_retainer"
      },
      "painPointsAndTriggers": {
        "acutePainPoints": ["..."],
        "buyingTriggerEvents": ["..."],
        "desiredOutcomes": ["..."]
      },
      "collaborationPreferences": {
        "communicationStyle": "asynchronous_autonomous|high_touch_collaborative",
        "preferredChannels": ["Fiverr Chat", "Loom", ...],
        "updateCadence": "daily|bi_weekly|milestone_only"
      },
      "antiIcpCriteria": {
        "redFlagPhrases": ["..."],
        "disqualifyingFactors": ["..."]
      },
      "targetingSignals": {
        "searchKeywords": ["..."],
        "recommendedPitchHook": "..."
      }
    }
  ]
}
```

---

## 5. Post-Validation Rules

After AI generates ICPs, apply these deterministic checks:

1. **Budget Floor Check**: `icp.budgetRange.min >= seller.lowestBasicPrice`
2. **Persona Count**: Must have 2-4 distinct ICPs
3. **Priority Uniqueness**: Only one `primary`, max one `secondary`
4. **Confidence Score Range**: Must be between 0.0 and 1.0
5. **No Empty Arrays**: All array fields must have at least 1 element
6. **Geography Validation**: Only ISO 3166-1 alpha-2 country codes
7. **Hallucination Guard**: If seller's max price < $500, reject any ICP with budget max > $5,000

---

## 6. API Endpoint Design

### Generate ICPs
```
POST /api/v1/onboarding/generate-icps
Authorization: Bearer <token>

Request Body:
{
  "userId": "usr_xxx",
  "fiverrProfile": { ... }  // Full scraped profile object
}

Response:
{
  "success": true,
  "data": {
    "icpProfiles": [ ... ],  // 2-4 ICP objects
    "generatedAt": "2026-09-10T...",
    "modelVersion": "gemini-2.0-flash"
  }
}
```

### Save/Confirm ICPs
```
POST /api/v1/onboarding/confirm-icps
Authorization: Bearer <token>

Request Body:
{
  "userId": "usr_xxx",
  "icpProfiles": [ ... ]  // Potentially user-edited ICPs
}

Response:
{
  "success": true,
  "message": "ICPs saved and onboarding step 2 completed"
}
```
