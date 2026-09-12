import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const DB_FILE = path.join(DATA_DIR, "store.json");

import { ScrapedFiverrProfile } from "../services/fiverrScraper.service.js";

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fiverr_profile_url?: string;
  fiverrProfile?: ScrapedFiverrProfile;
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  onboardingStep: number;
  icpProfiles?: any[];
  icpGeneratedAt?: string;
  createdAt: string;
}

export interface UserContext {
  userId: string;
  fullName: string;
  fiverrUrl: string;
  icpProfiles?: any[];
  experienceYears: string;
  primarySkills: string[];
  secondarySkills: string[];
  targetNiches: string[];
  fiverrProfile?: ScrapedFiverrProfile;
  onboardingStep?: number;
  marketStrategy: {
    recommendedNiches: {
      nicheTitle: string;
      opportunityScore: number;
      competitionDensity: string;
      avgTicketPriceUSD: number;
      whyThisWins: string;
    }[];
    marketHiringRateInsight: string;
    strategicPositioningAdvice: string;
  };
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface BuyerBrief {
  id: string;
  fiverrBriefId?: string;
  userId?: string;
  clientTitle: string;
  description: string;
  budget: string;
  currency?: string;
  urgencyDays?: number;
  urgencyText?: string;
  skills: string[];
  clientCountry?: string;
  source: 'fiverr_extension' | 'live_feed' | 'manual';
  status: 'new' | 'reviewed' | 'applied' | 'dismissed';
  matchScore?: number;
  matchedGigId?: string | number;
  matchedGigTitle?: string;
  appliedProposal?: {
    pitchText: string;
    targetGigId?: string | number;
    targetGigTitle?: string;
    offeredPrice: number;
    deliveryDays: number;
    appliedAt: string;
    safetyGapSeconds?: number;
  };
  createdAt: string;
}

export interface CompetitorReport {
  id: string;
  userId: string;
  competitorUsername: string;
  competitorProfile: ScrapedFiverrProfile;
  metricsComparison: {
    userPriceFloor: number;
    userPriceCeiling: number;
    competitorPriceFloor: number;
    competitorPriceCeiling: number;
    userRating: number;
    competitorRating: number;
    userReviewsCount: number;
    competitorReviewsCount: number;
    userOrdersInQueue: number;
    competitorOrdersInQueue: number;
    estimatedRevenueGapMultiplier: number;
    missingHighVolumeTags: string[];
    commonSkills: string[];
    uniqueCompetitorSkills: string[];
  };
  gapAnalysis: {
    executiveSummary: string;
    whyCompetitorMakesMore: {
      pricingStrategy: string;
      packagingLeverage: string;
      positioningAndHooks: string;
    };
    deliverablesComparison: {
      userStrengths: string[];
      competitorStrengths: string[];
      criticalMissingFeatures: string[];
    };
    seoAndSearchGap: {
      tagsAnalysis: string;
      rankingAngles: string[];
    };
    actionableWinPlan: {
      stepNumber: number;
      title: string;
      category: 'title' | 'pricing' | 'packages' | 'positioning';
      action: string;
      expectedImpact: string;
    }[];
    recommendedPricing: {
      basic: number;
      standard: number;
      premium: number;
      rationale: string;
    };
  };
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  userContexts: Record<string, UserContext>;
  gigs: any[];
  briefs: any[];
  researchHistory: any[];
  competitorReports?: Record<string, CompetitorReport[]>;
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        this.data = {
          users: raw.users || [],
          userContexts: raw.userContexts || {},
          gigs: raw.gigs || [],
          briefs: raw.briefs || [],
          researchHistory: raw.researchHistory || [],
          competitorReports: raw.competitorReports || {}
        };
      } catch {
        this.data = { users: [], userContexts: {}, gigs: [], briefs: [], researchHistory: [], competitorReports: {} };
      }
    } else {
      this.data = { users: [], userContexts: {}, gigs: [], briefs: [], researchHistory: [], competitorReports: {} };
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
  }

  // --- User Auth Store ---
  public createUser(user: Omit<User, "id" | "createdAt" | "onboardingCompleted" | "onboardingSkipped" | "onboardingStep">): User {
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newUser: User = {
      id,
      ...user,
      onboardingCompleted: false,
      onboardingSkipped: false,
      onboardingStep: 1,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateOnboardingStatus(userId: string, step: number, completed: boolean, skipped: boolean): User | undefined {
    const user = this.findUserById(userId);
    if (user) {
      user.onboardingStep = step;
      user.onboardingCompleted = completed;
      user.onboardingSkipped = skipped;
      this.save();
    }
    return user;
  }

  public saveIcpProfiles(userId: string, profiles: any[]): User | undefined {
    const user = this.findUserById(userId);
    if (user) {
      user.icpProfiles = profiles;
      user.icpGeneratedAt = new Date().toISOString();
      this.save();
      
      // Also update user context
      const context = this.getUserContext(userId);
      if (context) {
        context.icpProfiles = profiles;
        this.save();
      }
    }
    return user;
  }

  public getIcpProfiles(userId: string): any[] | undefined {
    const user = this.findUserById(userId);
    return user?.icpProfiles;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findFiverrProfileByUsername(username: string): ScrapedFiverrProfile | undefined {
    const clean = (username || "").trim().toLowerCase().replace(/^@+/, "");
    if (!clean) return undefined;

    // 1. Search in userContexts
    for (const ctx of Object.values(this.data.userContexts || {})) {
      if (ctx?.fiverrProfile?.username?.toLowerCase() === clean) {
        return ctx.fiverrProfile;
      }
    }

    // 2. Search in users
    for (const u of this.data.users || []) {
      if (u?.fiverrProfile?.username?.toLowerCase() === clean) {
        return u.fiverrProfile;
      }
    }

    // 3. Search in competitorReports
    if (Array.isArray(this.data.competitorReports)) {
      for (const rep of this.data.competitorReports) {
        if (rep?.competitorProfile?.username?.toLowerCase() === clean) {
          return rep.competitorProfile;
        }
      }
    }

    return undefined;
  }

  public getAllSavedFiverrProfiles(): ScrapedFiverrProfile[] {
    const profilesMap = new Map<string, ScrapedFiverrProfile>();
    for (const ctx of Object.values(this.data.userContexts || {})) {
      if (ctx?.fiverrProfile?.username) {
        profilesMap.set(ctx.fiverrProfile.username.toLowerCase(), ctx.fiverrProfile);
      }
    }
    for (const u of this.data.users || []) {
      if (u?.fiverrProfile?.username) {
        profilesMap.set(u.fiverrProfile.username.toLowerCase(), u.fiverrProfile);
      }
    }
    if (Array.isArray(this.data.competitorReports)) {
      for (const rep of this.data.competitorReports) {
        if (rep?.competitorProfile?.username) {
          profilesMap.set(rep.competitorProfile.username.toLowerCase(), rep.competitorProfile);
        }
      }
    }
    return Array.from(profilesMap.values());
  }

  // --- User Context & Onboarding Store ---
  public getUserContext(userId: string): UserContext | null {
    return this.data.userContexts[userId] || null;
  }

  public saveUserContext(userId: string, context: Partial<UserContext>): UserContext {
    const existing = this.data.userContexts[userId] || {
      userId,
      fullName: "",
      fiverrUrl: "",
      experienceYears: "",
      primarySkills: [],
      secondarySkills: [],
      targetNiches: [],
      marketStrategy: {
        recommendedNiches: [],
        marketHiringRateInsight: "",
        strategicPositioningAdvice: ""
      },
      onboardingCompleted: false,
      updatedAt: new Date().toISOString()
    };

    const updated: UserContext = {
      ...existing,
      ...context,
      userId,
      updatedAt: new Date().toISOString()
    };

    this.data.userContexts[userId] = updated;
    this.save();
    return updated;
  }

  public saveFiverrProfile(userId: string, profile: ScrapedFiverrProfile): UserContext {
    // 1. Link to user record
    const user = this.findUserById(userId);
    if (user) {
      user.fiverr_profile_url = profile.profileUrl;
      user.fiverrProfile = profile;
    }

    // 2. Populate primary skills and target niches from scraped data
    const primarySkills = profile.skills.map((s) => s.name).filter(Boolean);
    const targetNiches = profile.gigs.map((g) => g.title).filter(Boolean);

    const updated = this.saveUserContext(userId, {
      fullName: profile.displayName || user?.username || "Freelancer",
      fiverrUrl: profile.profileUrl,
      primarySkills: primarySkills.length > 0 ? primarySkills : ["Full-Stack Development", "AI Solutions"],
      targetNiches: targetNiches.length > 0 ? targetNiches : ["Web Development", "AI Automation"],
      fiverrProfile: profile,
      onboardingStep: 2,
    });

    this.save();
    return updated;
  }

  // --- Gigs Store ---
  public saveGig(gig: any) {
    const item = { id: `gig_${Date.now()}`, ...gig, createdAt: new Date().toISOString() };
    this.data.gigs.unshift(item);
    this.save();
    return item;
  }

  public getGigs(userId?: string) {
    if (userId) {
      return this.data.gigs.filter(g => g.userId === userId);
    }
    return this.data.gigs;
  }

  // --- Briefs Store ---
  public saveBrief(brief: any): BuyerBrief {
    const item: BuyerBrief = {
      id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      clientTitle: brief.clientTitle || brief.title || 'Client Project Brief',
      description: brief.description || '',
      budget: brief.budget || 'Flexible',
      currency: brief.currency || 'USD',
      urgencyDays: brief.urgencyDays || 2,
      urgencyText: brief.urgencyText || '48 Hours',
      skills: Array.isArray(brief.skills) ? brief.skills : [],
      clientCountry: brief.clientCountry || 'United States',
      source: brief.source || 'manual',
      status: brief.status || 'new',
      matchScore: brief.matchScore,
      matchedGigId: brief.matchedGigId,
      matchedGigTitle: brief.matchedGigTitle,
      appliedProposal: brief.appliedProposal,
      userId: brief.userId || 'anonymous',
      createdAt: new Date().toISOString(),
      ...brief,
    };
    this.data.briefs.unshift(item);
    this.save();
    return item;
  }

  public syncBriefs(userId: string | undefined, incomingBriefs: any[]): BuyerBrief[] {
    if (!Array.isArray(this.data.briefs)) {
      this.data.briefs = [];
    }

    const updatedList: BuyerBrief[] = [];

    for (const b of incomingBriefs) {
      const briefId = b.fiverrBriefId || b.id;
      const existingIdx = this.data.briefs.findIndex(
        (existing: BuyerBrief) =>
          (briefId && (existing.fiverrBriefId === briefId || existing.id === briefId)) ||
          (b.clientTitle && existing.clientTitle?.toLowerCase().trim() === b.clientTitle?.toLowerCase().trim())
      );

      if (existingIdx !== -1) {
        const existing = this.data.briefs[existingIdx];
        const merged: BuyerBrief = {
          ...existing,
          ...b,
          userId: userId || existing.userId || 'anonymous',
          status: existing.status === 'applied' ? 'applied' : (b.status || existing.status || 'new'),
          appliedProposal: existing.appliedProposal || b.appliedProposal,
        };
        this.data.briefs[existingIdx] = merged;
        updatedList.push(merged);
      } else {
        const newBrief: BuyerBrief = {
          id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fiverrBriefId: briefId || undefined,
          userId: userId || 'anonymous',
          clientTitle: b.clientTitle || b.title || 'Client Brief',
          description: b.description || '',
          budget: b.budget || 'Flexible',
          currency: b.currency || 'USD',
          urgencyDays: b.urgencyDays || 2,
          urgencyText: b.urgencyText || '48 Hours',
          skills: Array.isArray(b.skills) ? b.skills : [],
          clientCountry: b.clientCountry || 'United States',
          source: b.source || 'fiverr_extension',
          status: 'new',
          matchScore: b.matchScore,
          matchedGigId: b.matchedGigId,
          matchedGigTitle: b.matchedGigTitle,
          createdAt: new Date().toISOString(),
        };
        this.data.briefs.unshift(newBrief);
        updatedList.push(newBrief);
      }
    }

    this.save();
    return updatedList;
  }

  public updateBriefApplication(
    briefId: string,
    application: {
      pitchText: string;
      targetGigId?: string | number;
      targetGigTitle?: string;
      offeredPrice: number;
      deliveryDays: number;
      safetyGapSeconds?: number;
    }
  ): BuyerBrief | null {
    const brief = this.data.briefs.find((b: BuyerBrief) => b.id === briefId || b.fiverrBriefId === briefId);
    if (!brief) return null;

    brief.status = 'applied';
    brief.appliedProposal = {
      ...application,
      appliedAt: new Date().toISOString(),
    };
    this.save();
    return brief;
  }

  public getBriefs(userId?: string): BuyerBrief[] {
    if (userId) {
      return this.data.briefs.filter((b: BuyerBrief) => b.userId === userId || b.userId === 'anonymous');
    }
    return this.data.briefs;
  }

  // --- Research Store ---
  public saveResearch(research: any) {
    const item = { id: `res_${Date.now()}`, ...research, createdAt: new Date().toISOString() };
    this.data.researchHistory.unshift(item);
    this.save();
    return item;
  }

  public getResearchHistory(userId?: string) {
    if (userId) {
      return this.data.researchHistory.filter(r => r.userId === userId);
    }
    return this.data.researchHistory;
  }

  // --- Competitor Reports Store ---
  public saveCompetitorReport(userId: string, report: Omit<CompetitorReport, "id" | "createdAt">): CompetitorReport {
    if (!this.data.competitorReports) {
      this.data.competitorReports = {};
    }
    if (!this.data.competitorReports[userId]) {
      this.data.competitorReports[userId] = [];
    }

    const item: CompetitorReport = {
      id: `crep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...report
    };

    this.data.competitorReports[userId].unshift(item);
    this.save();
    return item;
  }

  public getCompetitorReports(userId: string): CompetitorReport[] {
    if (!this.data.competitorReports) {
      this.data.competitorReports = {};
    }
    return this.data.competitorReports[userId] || [];
  }

  public deleteCompetitorReport(userId: string, reportId: string): boolean {
    if (!this.data.competitorReports || !this.data.competitorReports[userId]) {
      return false;
    }
    const beforeCount = this.data.competitorReports[userId].length;
    this.data.competitorReports[userId] = this.data.competitorReports[userId].filter(r => r.id !== reportId);
    this.save();
    return this.data.competitorReports[userId].length < beforeCount;
  }
}

export const db = new Store();
