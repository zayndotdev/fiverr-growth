import { config } from '../config/index.js';
import { fiverrScraperService } from './fiverrScraper.service.js';
import { logger } from '../utils/logger.js';

const GEMINI_API_KEY = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export interface RadioOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'ai' | 'web' | 'backend' | 'mobile' | 'speed' | 'quality' | 'enterprise' | 'code';
  recommended?: boolean;
}

export interface InterrogationQuestion {
  step: number;
  totalSteps: number;
  questionId: string;
  headline: string;
  subtext: string;
  options: RadioOption[];
  allowCustomInput?: boolean;
}

export interface GigPackageTier {
  name: string;
  title: string;
  description: string;
  deliveryDays: number;
  revisions: number | string;
  priceUsd: number;
  features: { name: string; included: boolean }[];
}

export interface GigBlueprint {
  overview: {
    title: string;
    category: string;
    subCategory: string;
    serviceType: string;
    searchTags: string[];
    metadata: {
      programmingLanguages: string[];
      frameworks: string[];
      deploymentPlatforms: string[];
    };
  };
  pricing: {
    basic: GigPackageTier;
    standard: GigPackageTier;
    premium: GigPackageTier;
  };
  description: {
    fullText: string;
    charCount: number;
    hook: string;
    deliverables: string[];
    whyHireMe: string[];
    process?: string[];
    callToAction: string;
    tone?: string;
  };
  faqs: { question: string; answer: string }[];
  buyerRequirements: { question: string; type: 'free_text' | 'attachment'; mandatory: boolean }[];
  thumbnailSpecs: {
    recommendedWidth: number;
    recommendedHeight: number;
    aspectRatio: string;
    headline: string;
    subHook: string;
    themeStyle: 'dark_glassmorphic' | 'emerald_pro' | 'cyber_slate' | 'midnight_amber';
    visualSubject?: 'robot' | 'dashboard' | 'neural_core' | 'mobile_app' | 'flux_art';
    artworkPrompt?: string;
    artworkDataUri?: string;
    techBadges: string[];
    trustBadges: string[];
  };
  marketResearch: {
    analyzedCompetitorCount: number;
    topTags: string[];
    medianStartingPrice: number;
    nicheOpportunityScore: number;
  };
}

export class GigStudioService {
  /**
   * Generates initial interrogation question with smart radio cards based on seller's profile
   */
  public getInitialQuestion(sellerProfile?: any, sellerSkills: string[] = []): InterrogationQuestion {
    const hasAI = sellerSkills.some((s) => /ai|agent|chatbot|gpt|langchain/i.test(s));
    const hasWeb = sellerSkills.some((s) => /react|next|frontend|fullstack|web/i.test(s));

    logger.agentLog(
      'AGENT_GIG_STUDIO',
      'Gig Studio Architect',
      'INFO',
      `Starting gig interrogation for ${sellerProfile?.displayName || 'seller'} (Skills: ${sellerSkills.slice(0, 3).join(', ') || 'General'})`
    );

    return {
      step: 1,
      totalSteps: 4,
      questionId: 'service_domain',
      headline: 'What exact high-ticket service do you want to offer?',
      subtext: 'Select the primary micro-niche for your gig. Laser-targeted gigs rank 4x faster on Fiverr.',
      options: [
        {
          id: 'ai_chatbots',
          title: 'Custom AI Agents & Voice Chatbots',
          subtitle: 'OpenAI, LangChain, VAPI, customer support automation, and custom knowledge base bots.',
          iconType: 'ai',
          recommended: hasAI,
        },
        {
          id: 'fullstack_nextjs',
          title: 'Full Stack Next.js & React Web Apps',
          subtitle: 'SaaS MVPs, modern business portals, responsive dashboards, and Stripe payment integration.',
          iconType: 'web',
          recommended: !hasAI && hasWeb,
        },
        {
          id: 'python_fastapi',
          title: 'Python Backend APIs & Web Scrapers',
          subtitle: 'High-throughput FastAPI microservices, database automation, and real-time scrapers.',
          iconType: 'backend',
        },
        {
          id: 'figma_to_code',
          title: 'Figma to Clean Next.js / Tailwind Code',
          subtitle: 'Pixel-perfect, 100% responsive frontend implementation from buyer designs.',
          iconType: 'code',
        },
        {
          id: 'crossplatform_mobile',
          title: 'Cross-Platform Mobile Apps (Flutter)',
          subtitle: 'Production iOS and Android applications with Firebase backends.',
          iconType: 'mobile',
        },
      ],
      allowCustomInput: true,
    };
  }

  /**
   * Evaluates previous answers and returns the next contextual question
   */
  public getNextQuestion(currentStep: number, previousAnswers: Record<string, string>): InterrogationQuestion | null {
    if (currentStep === 1) {
      // Step 2: Tech Arsenal & Tools
      const domain = previousAnswers.service_domain || 'fullstack';
      let options: RadioOption[] = [];

      if (domain === 'ai_chatbots' || /ai|chatbot|agent/i.test(domain)) {
        options = [
          {
            id: 'openai_langchain',
            title: 'OpenAI + LangChain + Vector DB (Pinecone/Chroma)',
            subtitle: 'Autonomous agents, custom RAG over client documents, and semantic search.',
            iconType: 'ai',
            recommended: true,
          },
          {
            id: 'vapi_voice_automation',
            title: 'Voice AI & Inbound Call Agents (VAPI / Retell)',
            subtitle: '24/7 AI receptionist answering phone calls and booking appointments.',
            iconType: 'ai',
          },
          {
            id: 'python_fastapi_bot',
            title: 'FastAPI Backend + Custom Webhook Integration',
            subtitle: 'WhatsApp, Telegram, and Discord custom business bot automation.',
            iconType: 'backend',
          },
          {
            id: 'full_ai_saas',
            title: 'Full AI Web Platform (Next.js + AI SDK + Stripe)',
            subtitle: 'Complete AI wrapper SaaS product with user accounts and billing.',
            iconType: 'web',
          },
        ];
      } else {
        options = [
          {
            id: 'nextjs_tailwind_ts',
            title: 'Next.js 14/15 + Tailwind CSS + TypeScript',
            subtitle: 'Modern, blazing fast, SEO-optimized React architecture.',
            iconType: 'web',
            recommended: true,
          },
          {
            id: 'fullstack_mern_postgres',
            title: 'Full Stack Node.js / Express + PostgreSQL / MongoDB',
            subtitle: 'Scalable REST APIs, relational database architecture, and authentication.',
            iconType: 'backend',
          },
          {
            id: 'python_fastapi_react',
            title: 'Python FastAPI Backend + Modern React Frontend',
            subtitle: 'High performance data processing with clean interactive UI.',
            iconType: 'code',
          },
          {
            id: 'flutter_firebase',
            title: 'Flutter + Firebase Cloud Services',
            subtitle: 'Cross-platform native compilation with real-time sync.',
            iconType: 'mobile',
          },
        ];
      }

      return {
        step: 2,
        totalSteps: 4,
        questionId: 'tech_arsenal',
        headline: 'What is your core technical stack for this gig?',
        subtext: 'Buyers look for specific framework names to verify senior competence.',
        options,
        allowCustomInput: true,
      };
    }

    if (currentStep === 2) {
      // Step 3: Turnaround & Delivery Velocity
      return {
        step: 3,
        totalSteps: 4,
        questionId: 'delivery_velocity',
        headline: 'What is your turnaround speed for the Starter package?',
        subtext: 'Speed is the #1 reason clients hire a new seller with zero reviews over busy Top Rated sellers.',
        options: [
          {
            id: 'speed_24h',
            title: '⚡ Lightning 24-Hour Delivery (Recommended for 0 Reviews)',
            subtitle: 'Fast turnaround gets 3x more clicks from urgent buyers with immediate deadlines.',
            iconType: 'speed',
            recommended: true,
          },
          {
            id: 'speed_48h',
            title: '🚀 48-Hour Rapid Delivery',
            subtitle: 'Solid balance of thorough code review, setup, and fast turnaround.',
            iconType: 'quality',
          },
          {
            id: 'speed_3_days',
            title: '🎯 3 Days Standard Delivery',
            subtitle: 'Best for multi-page applications or complex database pipelines.',
            iconType: 'enterprise',
          },
        ],
        allowCustomInput: false,
      };
    }

    if (currentStep === 3) {
      // Step 4: Key Deliverables & Client Handover
      return {
        step: 4,
        totalSteps: 4,
        questionId: 'client_handover',
        headline: 'What high-value deliverables will you guarantee the client?',
        subtext: 'Packaging deliverables properly allows you to charge $95-$250+ instead of $20 commodity rates.',
        options: [
          {
            id: 'full_code_video_demo',
            title: 'Full Clean Source Code + Loom Video Walkthrough Demo',
            subtitle: 'Explaining how the code works removes buyer anxiety and almost guarantees a 5-star review.',
            iconType: 'quality',
            recommended: true,
          },
          {
            id: 'live_cloud_deployment',
            title: 'Live Cloud Deployment on Vercel / AWS + GitHub Repo',
            subtitle: 'Zero setup friction for non-technical buyers. Ready to use immediately.',
            iconType: 'enterprise',
          },
          {
            id: 'post_delivery_support',
            title: 'Setup Assistance + 14 Days Post-Delivery Warranty Support',
            subtitle: 'Positions you as a premium agency partner, supporting higher package pricing.',
            iconType: 'code',
          },
        ],
        allowCustomInput: true,
      };
    }

    return null;
  }

  /**
   * Researches Page-1 competitors and synthesizes a complete 6-step Fiverr Gig Blueprint
   */
  public async synthesizeGigStudio(
    answers: Record<string, string>,
    sellerProfile: any,
    sellerSkills: string[] = []
  ): Promise<GigBlueprint> {
    // 1. Live market research on Page-1 competitors
    const query = answers.service_domain || answers.tech_arsenal || 'AI Chatbot Automation';
    let competitorTags: string[] = [];
    let medianPrice = 75;
    let competitorCount = 0;

    logger.agentLog(
      'AGENT_GIG_STUDIO',
      'Gig Studio Architect',
      'INFO',
      `Scanning live market for: "${query}"`
    );

    try {
      const searchResults = await fiverrScraperService.searchCompetitorGigs(query, { minReviews: 3, limit: 8 });
      competitorCount = searchResults.length;
      if (searchResults.length > 0) {
        // Collect tags & prices
        const allPrices = searchResults.map((c) => c.startingPrice).filter((p) => p > 0);
        if (allPrices.length > 0) {
          allPrices.sort((a, b) => a - b);
          medianPrice = allPrices[Math.floor(allPrices.length / 2)];
        }
      }
      logger.agentLog(
        'AGENT_COMPETITOR',
        'Competitor Radar Agent',
        'SUCCESS',
        `Analyzed ${competitorCount} Page-1 competitors (Median benchmark: $${medianPrice})`
      );
    } catch (err) {
      logger.agentLog('AGENT_COMPETITOR', 'Competitor Radar Agent', 'WARN', 'Live scraping fallback triggered', err);
    }

    // 2. Call Gemini 2.0 Flash to synthesize the full 6-step gig
    let blueprint: GigBlueprint | null = null;
    if (GEMINI_API_KEY) {
      try {
        blueprint = await this.synthesizeWithGemini(answers, sellerProfile, sellerSkills, medianPrice, competitorCount);
        if (blueprint) {
          logger.agentLog(
            'AGENT_GIG_STUDIO',
            'Gemini 2.0 Flash',
            'SUCCESS',
            `Synthesized full 6-step blueprint: "${blueprint.overview.title}" ($${blueprint.pricing.basic.priceUsd} - $${blueprint.pricing.premium.priceUsd})`
          );
        }
      } catch (err) {
        logger.agentLog('AGENT_GIG_STUDIO', 'Gemini 2.0 Flash', 'WARN', 'Gemini synthesis fallback triggered', err);
      }
    }

    if (!blueprint) {
      blueprint = this.generateFallbackBlueprint(answers, sellerProfile, sellerSkills, medianPrice, competitorCount);
      logger.agentLog(
        'AGENT_GIG_STUDIO',
        'Heuristic Synthesizer',
        'INFO',
        `Generated heuristic blueprint: "${blueprint.overview.title}"`
      );
    }

    return blueprint;
  }

  /**
   * Uses Gemini 2.0 Flash with structured JSON output
   */
  private async synthesizeWithGemini(
    answers: Record<string, string>,
    sellerProfile: any,
    sellerSkills: string[],
    medianStartingPrice: number,
    competitorCount: number
  ): Promise<GigBlueprint | null> {
    const prompt = `You are the world's #1 Fiverr Pro Gig Copywriter & Conversion Rate Optimization Specialist.

TASK: Create a complete, production-grade, high-converting 6-step Fiverr Gig Blueprint designed to win high-ticket clients for a new freelancer.

SELLER CONTEXT:
- Name: ${sellerProfile?.displayName || 'Freelance Specialist'}
- Target Niche: "${answers.service_domain || 'Full Stack AI Development'}"
- Tech Arsenal: "${answers.tech_arsenal || 'React, Next.js, Python, OpenAI'}"
- Delivery Velocity: "${answers.delivery_velocity || '24-48 Hours'}"
- Deliverables Focus: "${answers.client_handover || 'Full Source Code + Loom Video Walkthrough'}"
- Market Price Benchmark: $${medianStartingPrice}

FIVERR 2026 COMMERCIAL CONVERSION RULES (MANDATORY):
1. GIG TITLE: Must start with "I will " and be under 65 characters (sweet spot 45-60). Pack with high-intent keywords (e.g. "I will build custom AI agents, chatbots, and Nextjs web apps").
2. 5 SEARCH TAGS: Exactly 5 tags. Max 20 chars per tag. Only letters, numbers, and spaces. High volume buyer search terms.
3. 3-TIER PACKAGES:
   - Basic: Starter entry anchor ($35-$50 for new seller). High-value micro-deliverable.
   - Standard: Most popular tier ($95-$150). Production implementation.
   - Premium: Complete scalable architecture ($250-$450+). Enterprise-grade deployment.
4. 5-PART AGENCY GIG DESCRIPTION (STRICT REQUIREMENT: MUST BE UNDER 1,200 CHARACTERS TOTAL):
   - Part 1: [Hook] Pattern-interrupt opening addressing client pain points (e.g. "Tired of freelancers who disappear, write spaghetti code, or hallucinate project timelines?").
   - Part 2: [Deliverables Matrix] 4 bulleted deliverables highlighting production architecture, clean APIs, and speed.
   - Part 3: [Why Hire Me] 3 killer differentiators: 100% source code ownership, personal Loom video walkthrough demo, and rapid turnaround.
   - Part 4: [4-Step Process] 4 clear milestones: 1. Scope & Architecture -> 2. Rapid Prototype -> 3. Stress Testing -> 4. Handover & Deployment.
   - Part 5: [CTA] High-converting call to action inviting the buyer to message before ordering.
5. FAQs: 5 practical FAQs handling client objections (code ownership, revisions, API keys, hosting, custom requests).
6. BUYER REQUIREMENTS: 3 clear questions buyer must answer before order starts.
7. THUMBNAIL SPECS: 1280x769 split-layout thumbnail visual specifications.

Return a valid JSON object matching this schema:
{
  "overview": {
    "title": "I will ...",
    "category": "Programming & Tech",
    "subCategory": "Software Development",
    "serviceType": "Web Applications / AI Development",
    "searchTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "metadata": {
      "programmingLanguages": ["TypeScript", "Python"],
      "frameworks": ["Next.js", "React", "FastAPI"],
      "deploymentPlatforms": ["Vercel", "AWS"]
    }
  },
  "pricing": {
    "basic": {
      "name": "Starter Package",
      "title": "Core Setup & Architecture",
      "description": "Short description under 100 chars",
      "deliveryDays": 1,
      "revisions": 3,
      "priceUsd": 45,
      "features": [{ "name": "Source Code", "included": true }, { "name": "Responsive Design", "included": true }]
    },
    "standard": {
      "name": "Standard Production",
      "title": "Full Feature Implementation",
      "description": "Short description under 100 chars",
      "deliveryDays": 2,
      "revisions": 5,
      "priceUsd": 120,
      "features": [{ "name": "Source Code", "included": true }, { "name": "Database Integration", "included": true }, { "name": "Loom Video Walkthrough", "included": true }]
    },
    "premium": {
      "name": "Enterprise Architecture",
      "title": "Complete Scalable Deployment",
      "description": "Short description under 100 chars",
      "deliveryDays": 4,
      "revisions": -1,
      "priceUsd": 280,
      "features": [{ "name": "Source Code", "included": true }, { "name": "Cloud Deployment", "included": true }, { "name": "Priority Support", "included": true }]
    }
  },
  "description": {
    "fullText": "Full formatted markdown text under 1200 characters...",
    "charCount": 1100,
    "hook": "Tired of freelancers who write spaghetti code or disappear after delivery? Get commercial-grade software built right.",
    "deliverables": [
      "Custom, modular architecture built for speed and enterprise scale",
      "Robust REST & WebSocket API integrations with error resiliency",
      "Clean, maintainable code following modern industry standards",
      "Fully responsive mobile and desktop user interfaces"
    ],
    "whyHireMe": [
      "100% Source Code Ownership & Transfer upon delivery",
      "Recorded Loom Video Demo explaining installation and usage",
      "Rapid turnaround with daily transparent status updates"
    ],
    "process": [
      "1. Discovery & Architecture Blueprint",
      "2. Rapid Prototyping & Core Logic",
      "3. Rigorous Testing & QA Verification",
      "4. Complete Handover & Video Walkthrough"
    ],
    "callToAction": "Have specific project requirements? Click 'Contact Seller' now with your project brief for a free technical consultation.",
    "tone": "roi_closer"
  },
  "faqs": [
    { "question": "Do I own the full source code?", "answer": "Yes, 100%. You receive complete, unencrypted source code ownership." },
    { "question": "What if I need revisions?", "answer": "Revisions are included in every tier to guarantee you get exactly what you need." },
    { "question": "Can you work with my existing code or Figma?", "answer": "Absolutely. Send me your repository or design file and I will review it." }
  ],
  "buyerRequirements": [
    { "question": "Please describe your project scope and attach any wireframes or documentation.", "type": "free_text", "mandatory": true },
    { "question": "Do you already have required API keys or hosting accounts?", "type": "free_text", "mandatory": false }
  ],
  "thumbnailSpecs": {
    "recommendedWidth": 1280,
    "recommendedHeight": 769,
    "aspectRatio": "16:9",
    "headline": "CUSTOM AI AGENTS & APPS",
    "subHook": "Enterprise Architecture • 24H Delivery",
    "themeStyle": "dark_glassmorphic",
    "visualSubject": "robot",
    "artworkPrompt": "3D futuristic AI robotic assistant floating with glowing holographic circuits and glass container",
    "techBadges": ["OpenAI", "Next.js", "Python", "React"],
    "trustBadges": ["⚡ 24H Turnaround", "100% Code Ownership", "Loom Video Demo"]
  }
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = (await res.json()) as any;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);

    return {
      ...parsed,
      marketResearch: {
        analyzedCompetitorCount: competitorCount,
        topTags: parsed.overview?.searchTags || [],
        medianStartingPrice: medianStartingPrice,
        nicheOpportunityScore: 94,
      },
    };
  }

  /**
   * Resilient Heuristic Fallback Engine
   */
  private generateFallbackBlueprint(
    answers: Record<string, string>,
    sellerProfile: any,
    sellerSkills: string[],
    medianPrice: number,
    competitorCount: number
  ): GigBlueprint {
    const isAI = /ai|chatbot|agent/i.test(answers.service_domain || '');
    const title = isAI
      ? 'I will build custom AI agents, chatbots, and automation systems'
      : 'I will build your custom full stack web application in Next.js';

    const tags = isAI
      ? ['ai chatbot', 'ai agent', 'chatgpt', 'openai', 'automation']
      : ['web application', 'nextjs developer', 'react website', 'full stack', 'custom website'];

    const headline = isAI ? 'CUSTOM AI AGENTS & CHATBOTS' : 'FULL STACK WEB APPLICATIONS';

    const descText = `Are you looking for a modern, high-performing software solution built cleanly without technical debt?

Tired of freelancers who disappear or write unmaintainable code? I build production-ready software with complete transparency and rapid delivery.

WHAT I DELIVER:
✔ Custom, modular architecture built for speed and enterprise scale
✔ Fully responsive interfaces on all mobile, tablet, and desktop viewports
✔ Clean, documented code with zero proprietary vendor lock-in
✔ Direct database integration and robust API error handling

WHY WORK WITH ME:
★ Complete Source Code Handover (100% client ownership)
★ Recorded Loom Video Walkthrough demo with delivery
★ 24H rapid turnaround and clear milestone communication

4-STEP WORKING PROCESS:
1. Scope & Architecture Alignment
2. Rapid Prototype & Core Development
3. Rigorous QA & Device Verification
4. Full Handover & Video Walkthrough

Have specific requirements? Click 'Contact Seller' now with your project brief for a free technical consultation!`;

    return {
      overview: {
        title,
        category: 'Programming & Tech',
        subCategory: isAI ? 'AI Services' : 'Software Development',
        serviceType: isAI ? 'AI Chatbot Development' : 'Web Applications',
        searchTags: tags,
        metadata: {
          programmingLanguages: ['TypeScript', 'JavaScript', 'Python'],
          frameworks: isAI ? ['OpenAI', 'LangChain', 'FastAPI'] : ['Next.js', 'React', 'Tailwind CSS'],
          deploymentPlatforms: ['Vercel', 'AWS', 'Firebase'],
        },
      },
      pricing: {
        basic: {
          name: 'Starter Package',
          title: 'Core Feature Setup',
          description: 'Single modular feature with responsive design and clean commented code.',
          deliveryDays: 1,
          revisions: 3,
          priceUsd: 45,
          features: [
            { name: 'Functional Implementation', included: true },
            { name: 'Source Code Handover', included: true },
            { name: 'Responsive Layout', included: true },
            { name: 'Database Setup', included: false },
          ],
        },
        standard: {
          name: 'Standard Package',
          title: 'Full Production Build',
          description: 'Multi-component application with database integration, auth, and API setup.',
          deliveryDays: 2,
          revisions: 5,
          priceUsd: 120,
          features: [
            { name: 'Functional Implementation', included: true },
            { name: 'Source Code Handover', included: true },
            { name: 'Responsive Layout', included: true },
            { name: 'Database Setup', included: true },
            { name: 'Loom Video Walkthrough', included: true },
          ],
        },
        premium: {
          name: 'Enterprise Package',
          title: 'Complete Production Deployment',
          description: 'End-to-end scalable architecture, cloud deployment, and priority warranty support.',
          deliveryDays: 4,
          revisions: -1,
          priceUsd: 280,
          features: [
            { name: 'Functional Implementation', included: true },
            { name: 'Source Code Handover', included: true },
            { name: 'Responsive Layout', included: true },
            { name: 'Database Setup', included: true },
            { name: 'Loom Video Walkthrough', included: true },
            { name: 'Cloud Deployment Assistance', included: true },
          ],
        },
      },
      description: {
        fullText: descText,
        charCount: descText.length,
        hook: 'Are you looking for a modern, high-performing software solution built cleanly without technical debt? Get commercial-grade software built right.',
        deliverables: [
          'Custom, modular architecture built for speed and enterprise scale',
          'Fully responsive on all mobile, tablet, and desktop viewports',
          'Clean, documented code with zero proprietary lock-in',
          'Robust database and API error handling',
        ],
        whyHireMe: [
          'Complete Source Code Handover (100% ownership)',
          'Recorded Loom Video Demo with delivery',
          'Fast turnaround and clear communication',
        ],
        process: [
          '1. Scope & Architecture Alignment',
          '2. Rapid Prototype & Core Development',
          '3. Rigorous QA & Verification',
          '4. Full Handover & Video Walkthrough',
        ],
        callToAction: 'Click \'Contact Seller\' now with your project brief for a free technical consultation.',
        tone: 'roi_closer',
      },
      faqs: [
        {
          question: 'Do I own the source code after delivery?',
          answer: 'Yes, 100%. You receive full, unencrypted source code ownership with clear documentation.',
        },
        {
          question: 'What if I need changes or revisions after delivery?',
          answer: 'Every package includes revisions. I will make sure you are 100% satisfied before order completion.',
        },
        {
          question: 'Can you work with my existing codebase or design?',
          answer: 'Yes! Send me your Figma link or GitHub repo and I will review it before we start.',
        },
        {
          question: 'How do we communicate during development?',
          answer: 'All communications stay on Fiverr chat. I provide regular status updates and milestone demos.',
        },
      ],
      buyerRequirements: [
        {
          question: 'Please describe your project goal and attach any wireframes, Figma links, or API documentation.',
          type: 'free_text',
          mandatory: true,
        },
        {
          question: 'Do you already have hosting accounts (e.g. Vercel, AWS, Firebase) or should I guide you on setup?',
          type: 'free_text',
          mandatory: false,
        },
      ],
      thumbnailSpecs: {
        recommendedWidth: 1280,
        recommendedHeight: 769,
        aspectRatio: '16:9',
        headline,
        subHook: 'Production Ready • Fast Turnaround',
        themeStyle: 'dark_glassmorphic',
        visualSubject: isAI ? 'robot' : 'dashboard',
        artworkPrompt: isAI
          ? 'futuristic 3D robotic AI agent assistant floating in glass container with glowing neon circuits'
          : 'isometric 3D glassmorphic software SaaS dashboard mockup floating with glowing analytics charts and code window',
        techBadges: isAI ? ['OpenAI', 'Next.js', 'Python', 'FastAPI'] : ['Next.js', 'React', 'Tailwind', 'TypeScript'],
        trustBadges: ['⚡ 24H Turnaround', '100% Code Ownership', 'Loom Video Demo'],
      },
      marketResearch: {
        analyzedCompetitorCount: competitorCount,
        topTags: tags,
        medianStartingPrice: medianPrice,
        nicheOpportunityScore: 92,
      },
    };
  }

  /**
   * Generates photorealistic, high-CTR 3D AI artwork for the gig thumbnail (1280x769)
   * via the Flux engine and returns base64 dataUri for zero-CORS canvas drawing.
   */
  public async generateGigArtwork(
    promptText: string,
    style: string = '3d_robot'
  ): Promise<{ dataUri: string; prompt: string }> {
    let subjectDetail = 'futuristic 3D robotic AI agent assistant floating with glowing neon holographic circuits in glass chamber';
    if (style === 'saas_dashboard' || style === 'dashboard') {
      subjectDetail = 'isometric 3D modern glassmorphic SaaS dashboard floating with glowing analytics charts, metrics, and sleek code IDE window';
    } else if (style === 'neural_core') {
      subjectDetail = 'cyberpunk 3D neural brain network core emitting glowing emerald synapses, particles, and floating holographic data';
    } else if (style === 'mobile_app') {
      subjectDetail = 'floating 3D smartphone mockup showing modern dark-mode chat and AI assistant UI with vibrant glowing glass widgets';
    } else if (promptText && promptText.trim().length > 3) {
      subjectDetail = promptText.trim();
    }

    const fullPrompt = `Ultra detailed photorealistic 3D render, ${subjectDetail}, cinematic studio lighting, Octane render 8k, Unreal Engine 5, sleek minimalist dark backdrop with glowing emerald and cyan accents, high conversion commercial tech visual`;

    logger.agentLog(
      'AGENT_GIG_STUDIO',
      'AI Media Generator',
      'INFO',
      `Generating 3D Flux artwork for gig: "${fullPrompt.slice(0, 80)}..."`
    );

    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1280&height=769&model=flux&nologo=true&enhance=true`;

    const response = await fetch(fluxUrl);
    if (!response.ok) {
      throw new Error(`Artwork generation failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    return {
      dataUri,
      prompt: fullPrompt,
    };
  }

  /**
   * Regenerates high-converting gig description using the 5-part agency copy framework
   * with custom selected tone.
   */
  public async regenerateDescription(
    title: string,
    serviceDomain: string,
    techStack: string,
    tone: 'enterprise' | 'rapid_mvp' | 'roi_closer' = 'roi_closer'
  ): Promise<{
    fullText: string;
    charCount: number;
    hook: string;
    deliverables: string[];
    whyHireMe: string[];
    process: string[];
    callToAction: string;
    tone: string;
  }> {
    let toneInstruction = 'Direct High-Converting ROI Closer - Bold, urgent, focused on client profitability, speed, and conversion.';
    if (tone === 'enterprise') {
      toneInstruction = 'Technical Enterprise Architect - Deeply technical, focused on compliance, modularity, zero technical debt, and scalability.';
    } else if (tone === 'rapid_mvp') {
      toneInstruction = 'Rapid Startup MVP Builder - Blazing speed, working prototype in 24 hours, lean code, immediate market readiness.';
    }

    const prompt = `You are a world-class Direct-Response Copywriter for Fiverr Gigs.
Write a high-converting gig description strictly under 1,200 characters using the 5-Part Agency Copy Framework.

TONE: ${toneInstruction}
GIG TITLE: ${title}
SERVICE NICHE: ${serviceDomain}
TECH ARSENAL: ${techStack}

FRAMEWORK RULES (CRITICAL: TOTAL CHARACTERS MUST BE UNDER 1,200):
1. HOOK (2-3 lines): Pattern-interrupt addressing common client frustrations with bad freelancers.
2. DELIVERABLES MATRIX: 4 bullet points with checkmarks (✔) detailing concrete technical deliverables.
3. WHY HIRE ME: 3 bullet points with stars (★) detailing 100% source code ownership, Loom video walkthrough demo, and rapid turnaround.
4. 4-STEP PROCESS: 4 numbered steps (1. Scope Alignment -> 2. Rapid Prototyping -> 3. QA Testing -> 4. Handover & Walkthrough).
5. CALL TO ACTION: Direct instruction to message before ordering for a technical consultation.

Return valid JSON with this exact structure:
{
  "hook": "...",
  "deliverables": ["...", "...", "...", "..."],
  "whyHireMe": ["...", "...", "..."],
  "process": ["1. ...", "2. ...", "3. ...", "4. ..."],
  "callToAction": "...",
  "fullText": "...",
  "charCount": 1050,
  "tone": "${tone}"
}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.35,
            },
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            ...parsed,
            charCount: parsed.fullText?.length || 1000,
            tone,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini description regeneration fallback:', err);
    }

    // Heuristic Fallback
    const fallbackHook = tone === 'enterprise'
      ? 'Seeking enterprise-grade architecture engineered cleanly from day one without technical debt?'
      : tone === 'rapid_mvp'
      ? 'Need a working, launch-ready MVP delivered in days without cutting corners on code quality?'
      : 'Tired of freelancers who disappear, miss deadlines, or deliver spaghetti code?';

    const fallbackDeliverables = [
      'Production-ready modular code with zero proprietary lock-in',
      'Robust API error boundaries and database optimization',
      'Modern, pixel-perfect responsive user interface',
      'Comprehensive environment and deployment configurations',
    ];

    const fallbackWhy = [
      '100% Source Code Ownership transferred upon delivery',
      'Recorded Loom Video Walkthrough explaining system architecture',
      'Rapid turnaround with clear daily progress tracking',
    ];

    const fallbackProcess = [
      '1. Scope & Architecture Alignment',
      '2. Core Logic & Rapid Development',
      '3. Multi-Device QA & Stress Testing',
      '4. Complete Handover & Video Walkthrough',
    ];

    const fallbackCta = 'Have custom requirements? Click \'Contact Seller\' now with your project brief for a free technical consultation.';

    const fullText = `${fallbackHook}

WHAT I DELIVER:
${fallbackDeliverables.map((d) => `✔ ${d}`).join('\n')}

WHY HIRE ME:
${fallbackWhy.map((w) => `★ ${w}`).join('\n')}

4-STEP PROCESS:
${fallbackProcess.join('\n')}

${fallbackCta}`;

    return {
      hook: fallbackHook,
      deliverables: fallbackDeliverables,
      whyHireMe: fallbackWhy,
      process: fallbackProcess,
      callToAction: fallbackCta,
      fullText,
      charCount: fullText.length,
      tone,
    };
  }
}
export const gigStudioService = new GigStudioService();
