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

interface DatabaseSchema {
  users: User[];
  userContexts: Record<string, UserContext>;
  gigs: any[];
  briefs: any[];
  researchHistory: any[];
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
          researchHistory: raw.researchHistory || []
        };
      } catch {
        this.data = { users: [], userContexts: {}, gigs: [], briefs: [], researchHistory: [] };
      }
    } else {
      this.data = { users: [], userContexts: {}, gigs: [], briefs: [], researchHistory: [] };
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
  public saveBrief(brief: any) {
    const item = { id: `brief_${Date.now()}`, ...brief, createdAt: new Date().toISOString() };
    this.data.briefs.unshift(item);
    this.save();
    return item;
  }

  public getBriefs(userId?: string) {
    if (userId) {
      return this.data.briefs.filter(b => b.userId === userId);
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
}

export const db = new Store();
