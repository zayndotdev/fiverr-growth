import https from "https";

export interface FiverrLanguage {
  language: string;
  code?: string;
  level: string;
}

export interface FiverrSkill {
  name: string;
  level: string;
  verified: boolean;
}

export interface FiverrEducation {
  degree: string;
  school: string;
  degreeTitle?: string;
  toYear?: number;
  countryCode?: string;
}

export interface FiverrCertification {
  name: string;
  from: string;
  year?: number;
}

export interface FiverrGigPackageFeature {
  label: string;
  included: boolean;
  value?: any;
}

export interface FiverrGigPackage {
  id?: number | string;
  title: string;
  description: string;
  price: number | string;
  durationDays?: number;
  revisions?: number | string;
  features?: FiverrGigPackageFeature[];
}

export interface FiverrGigFAQ {
  question: string;
  answer: string;
}

export interface FiverrGig {
  id: string | number;
  title: string;
  slug?: string;
  url?: string;
  imageUrl?: string;
  gallery?: string[];
  startingPrice: string | number;
  rating?: number;
  reviewCount?: number;
  ordersInQueue?: number;
  category?: string;
  subCategory?: string;
  nestedCategory?: string;
  description?: string;
  descriptionHtml?: string;
  faqs?: FiverrGigFAQ[];
  tags?: string[];
  packages?: FiverrGigPackage[];
  metadata?: Array<{ type: string; value: string[] }>;
  aiSummary?: string[];
}

export interface FiverrReview {
  id?: string;
  reviewer: string;
  reviewerCountry?: string;
  reviewerCountryCode?: string;
  rating: number;
  comment: string;
  createdAt: string;
  workSample?: string;
  orderDuration?: string;
  priceRange?: string;
  sellerResponse?: string;
}

export interface ScrapedFiverrProfile {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  profileCoverUrl?: string;
  isAgency?: boolean;
  tagline: string;
  description: string;
  country: string;
  countryCode: string;
  memberSince: string;
  joinedAtTimestamp?: number;
  responseTimeHours: number;
  responseTimeText: string;
  lastDeliveryText: string;
  sellerLevel: string;
  isPro: boolean;
  isVerified: boolean;
  isHighlyResponsive: boolean;
  rating: number;
  reviewCount: number;
  languages: FiverrLanguage[];
  skills: FiverrSkill[];
  education: FiverrEducation[];
  certifications: FiverrCertification[];
  gigs: FiverrGig[];
  recentReviews: FiverrReview[];
  scrapedAt: string;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "English",
  ur: "Urdu",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ar: "Arabic",
  bn: "Bengali",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  id: "Indonesian",
};

const PROFICIENCY_LEVEL_MAP: Record<string, string> = {
  BASIC: "Basic",
  CONVERSATIONAL: "Conversational",
  FLUENT: "Fluent",
  NATIVE_OR_BILINGUAL: "Native / Bilingual",
  PRO: "Professional",
};

const TECH_NAME_MAP: Record<string, string> = {
  next_js: "Next.js",
  react_js: "React.js",
  react: "React",
  node_js: "Node.js",
  express_js: "Express.js",
  fastapi: "FastAPI",
  nestjs: "NestJS",
  tailwind_css: "Tailwind CSS",
  bootstrap: "Bootstrap",
  jquery: "jQuery",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  php: "PHP",
  chatgpt: "ChatGPT",
  gemini: "Google Gemini",
  langchain: "LangChain",
  claude: "Claude AI",
  cursor: "Cursor IDE",
  replit: "Replit",
  lovable: "Lovable.dev",
  databases: "Databases & SQL",
  performance: "Web Performance Optimization",
  security: "API & Web Security",
  design: "UI/UX & Responsive Design",
  testing_procedures: "Automated Testing",
};

export function normalizeFiverrUsername(input: string): string {
  let clean = (input || "").trim().replace(/['"]/g, "");
  clean = clean.split("?")[0].split("#")[0];

  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?fiverr\.com\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }

  clean = clean.replace(/^@+/, "");
  const match = clean.match(/^[a-zA-Z0-9_-]+/);
  return match ? match[0].toLowerCase() : clean.toLowerCase();
}

function formatMemberSince(timestampSeconds?: number, isoDateStr?: string): string {
  try {
    if (timestampSeconds && timestampSeconds > 0) {
      const date = new Date(timestampSeconds * 1000);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    if (isoDateStr) {
      const date = new Date(isoDateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      }
    }
  } catch {}
  return "Recent";
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Recently";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return diffHours <= 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    }
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "Recently";
  }
}

export class FiverrScraperService {
  /**
   * Fetches raw HTML from Fiverr with realistic browser headers and custom timeout
   */
  private async fetchHtml(path: string, timeoutMs: number = 10000): Promise<{ status: number; html: string }> {
    return new Promise((resolve) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const options = {
        hostname: "www.fiverr.com",
        path: cleanPath,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 200, html: body });
        });
      });

      req.on("error", () => {
        resolve({ status: 500, html: "" });
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve({ status: 408, html: "" });
      });

      req.end();
    });
  }

  /**
   * Enriches any gig candidate by fetching its full individual SSR page and parsing deep details
   */
  private async enrichGig(cleanUsername: string, gigSlug: string, initialGig: Partial<FiverrGig> = {}): Promise<FiverrGig> {
    const gigUrl = gigSlug ? `https://www.fiverr.com/${cleanUsername}/${gigSlug}` : `https://www.fiverr.com/${cleanUsername}`;

    let title = initialGig.title || "";
    if (!title && gigSlug) {
      title = gigSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (!title) title = "Custom Professional Service";

    let imageUrl = initialGig.imageUrl || "";
    let gallery: string[] = initialGig.gallery || (imageUrl ? [imageUrl] : []);
    let startingPrice = initialGig.startingPrice || "$50";
    let rating = initialGig.rating ?? 5.0;
    let reviewCount = initialGig.reviewCount ?? 0;
    let ordersInQueue = initialGig.ordersInQueue ?? 0;
    let category = initialGig.category || "Programming & Tech";
    let subCategory = initialGig.subCategory || "Custom Development";
    let nestedCategory = initialGig.nestedCategory;
    let description = initialGig.description || "";
    let descriptionHtml = initialGig.descriptionHtml || "";
    let faqs: FiverrGigFAQ[] = initialGig.faqs || [];
    let tags: string[] = initialGig.tags || [];
    let packages: FiverrGigPackage[] = initialGig.packages || [];
    let metadata: Array<{ type: string; value: string[] }> = initialGig.metadata ? [...initialGig.metadata] : [];
    let aiSummary: string[] = initialGig.aiSummary || [];

    if (gigSlug) {
      try {
        const gigPageRes = await this.fetchHtml(`/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(gigSlug)}`, 5000);
        if (gigPageRes.status === 200 && gigPageRes.html) {
          const pageMatch = gigPageRes.html.match(
            /<script type="application\/json" id="perseus-initial-props">([\s\S]*?)<\/script>/
          );
          if (pageMatch) {
            const pageData = JSON.parse(pageMatch[1]);

            // Title
            if (pageData.overview?.gig?.title) {
              title = pageData.overview.gig.title;
            }

            // Description
            const descHtml = pageData.description?.content || "";
            if (descHtml) {
              descriptionHtml = descHtml;
              description = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            }

            // FAQs
            const rawFaqs = pageData.faq?.questionsAndAnswers || pageData.faq?.faqList || [];
            if (Array.isArray(rawFaqs) && rawFaqs.length > 0) {
              faqs = rawFaqs
                .map((f: any) => ({
                  question: f.question || f.q || "",
                  answer: f.answer || f.a || "",
                }))
                .filter((f: FiverrGigFAQ) => f.question && f.answer);
            }

            // Gallery
            const rawSlides = pageData.gallery?.slides || [];
            if (Array.isArray(rawSlides) && rawSlides.length > 0) {
              gallery = rawSlides
                .map((s: any) => s.slide?.media?.original || s.slide?.src || s.slide?.media?.medium)
                .filter(Boolean);
              if (gallery.length > 0 && !imageUrl) {
                imageUrl = gallery[0];
              }
            }

            // Packages with detailed features checklist
            const rawPackages = pageData.packages?.packageList || [];
            if (Array.isArray(rawPackages) && rawPackages.length > 0) {
              packages = rawPackages.map((p: any) => {
                const features: FiverrGigPackageFeature[] = Array.isArray(p.features)
                  ? p.features.map((feat: any) => ({
                      label: feat.label || feat.name || "Feature",
                      included: Boolean(feat.included),
                      value: feat.value,
                    }))
                  : [];

                return {
                  id: p.id,
                  title: p.title || "Package",
                  description: p.description || "",
                  price: p.price ? Math.round(p.price / 100) : 50,
                  durationDays: p.duration ? Math.round(p.duration / 24) : 1,
                  revisions: p.revisions?.value === -1 ? "Unlimited" : p.revisions?.value ?? 1,
                  features,
                };
              });

              if (packages.length > 0 && (!startingPrice || startingPrice === "$50" || startingPrice === "Up to $50")) {
                startingPrice = `$${packages[0].price}`;
              }
            }

            // Categories
            if (pageData.overview?.categories?.category?.name) {
              category = pageData.overview.categories.category.name;
            }
            if (pageData.overview?.categories?.subCategory?.name) {
              subCategory = pageData.overview.categories.subCategory.name;
            }
            if (pageData.overview?.categories?.nestedSubCategory?.name) {
              nestedCategory = pageData.overview.categories.nestedSubCategory.name;
            }

            // Tags
            if (Array.isArray(pageData.tags?.tagsGigList) && pageData.tags.tagsGigList.length > 0) {
              tags = pageData.tags.tagsGigList.map((t: any) => t.name).filter(Boolean);
            }

            // Orders in queue & ratings
            if (typeof pageData.overview?.gig?.ordersInQueue === "number") {
              ordersInQueue = pageData.overview.gig.ordersInQueue;
            }
            if (typeof pageData.overview?.gig?.ratingsCount === "number") {
              reviewCount = pageData.overview.gig.ratingsCount;
            }
            if (typeof pageData.overview?.gig?.rating?.score === "number") {
              rating = pageData.overview.gig.rating.score;
            }

            // AI Summary
            if (Array.isArray(pageData.aiSummary?.summary)) {
              aiSummary = pageData.aiSummary.summary;
            }

            // Metadata from gig attributes (frameworks, tech stack)
            if (Array.isArray(pageData.description?.metadataAttributes)) {
              for (const attr of pageData.description.metadataAttributes) {
                if (attr.name && Array.isArray(attr.options)) {
                  const vals = attr.options.map((o: any) => o.label || o.value).filter(Boolean);
                  if (vals.length > 0 && !metadata.some((m) => m.type === attr.name)) {
                    metadata.push({ type: attr.name, value: vals });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Could not deep-enrich gig ${gigSlug}:`, err);
      }
    }

    return {
      id: initialGig.id || gigSlug || `gig_${Math.random()}`,
      title,
      slug: gigSlug,
      url: gigUrl,
      imageUrl: imageUrl || gallery[0] || "",
      gallery,
      startingPrice,
      rating,
      reviewCount,
      ordersInQueue,
      category,
      subCategory,
      nestedCategory,
      description,
      descriptionHtml,
      faqs,
      tags,
      packages,
      metadata,
      aiSummary,
    };
  }

  /**
   * Scrapes public profile data for any given Fiverr username or URL
   */
  public async scrapeProfile(rawInput: string): Promise<ScrapedFiverrProfile> {
    const cleanUsername = normalizeFiverrUsername(rawInput);
    if (!cleanUsername || cleanUsername.length < 2) {
      throw new Error("Invalid Fiverr username or profile URL provided.");
    }

    const { status, html } = await this.fetchHtml(`/${encodeURIComponent(cleanUsername)}`, 12000);

    if (status === 404) {
      throw new Error(`Fiverr profile '@${cleanUsername}' not found. Please check spelling or verify URL.`);
    }

    if (status >= 400) {
      throw new Error(`Fiverr returned HTTP status ${status}. The profile may be restricted or private.`);
    }

    // 1. Parse Perseus Initial Props JSON (<script type="application/json" id="perseus-initial-props">)
    let perseusData: any = null;
    const perseusMatch = html.match(
      /<script type="application\/json" id="perseus-initial-props">([\s\S]*?)<\/script>/
    );
    if (perseusMatch && perseusMatch[1]) {
      try {
        perseusData = JSON.parse(perseusMatch[1].trim());
      } catch (err) {
        console.warn("Failed to parse perseus-initial-props JSON:", err);
      }
    }

    // 2. Parse Schema.org JSON-LD (<script type="application/ld+json">)
    let jsonLdPerson: any = null;
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1].trim());
        if (parsed["@type"] === "ProfilePage" && parsed.mainEntity) {
          jsonLdPerson = parsed.mainEntity;
        } else if (parsed["@type"] === "Person") {
          jsonLdPerson = parsed;
        }
      } catch {}
    }

    // 3. Fallback Meta Tags
    const getMetaContent = (nameOrProp: string): string => {
      const match =
        html.match(new RegExp(`<meta\\s+(?:name|property)=["']${nameOrProp}["']\\s+content=["']([^"']*)["']`, "i")) ||
        html.match(new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+(?:name|property)=["']${nameOrProp}["']`, "i"));
      return match ? match[1] : "";
    };

    const seller = perseusData?.seller || {};
    const sellerUser = seller.user || {};
    const reviewsData = perseusData?.reviewsData || {};

    if (!perseusData && !jsonLdPerson && !html.includes("fiverr.com")) {
      throw new Error(`Could not parse profile content for '@${cleanUsername}'.`);
    }

    // Identity
    const username = sellerUser.name || jsonLdPerson?.name || cleanUsername;
    const displayName =
      sellerUser.profile?.displayName ||
      jsonLdPerson?.name ||
      sellerUser.name ||
      cleanUsername;

    const profileUrl = `https://www.fiverr.com/${cleanUsername}`;
    const avatarUrl =
      sellerUser.profileImageUrl ||
      jsonLdPerson?.image ||
      getMetaContent("og:image") ||
      "";

    // Tagline / Headline
    const tagline =
      seller.oneLinerTitle ||
      jsonLdPerson?.jobTitle ||
      "";

    // Bio / Description
    const description =
      seller.description ||
      jsonLdPerson?.description ||
      getMetaContent("og:description") ||
      "";

    // Location
    const country =
      sellerUser.address?.countryName ||
      perseusData?.seller?.address?.countryName ||
      "";
    const countryCode =
      sellerUser.address?.countryCode ||
      perseusData?.seller?.address?.countryCode ||
      "";

    // Joined At / Member Since
    const joinedAtTimestamp = sellerUser.joinedAt || undefined;
    const dateCreatedStr = jsonLdPerson?.dateCreated || undefined;
    const memberSince = formatMemberSince(joinedAtTimestamp, dateCreatedStr);

    // Response Time
    const responseTimeHours =
      typeof seller.responseTime?.inHours === "number" ? seller.responseTime.inHours : 1;
    const responseTimeText =
      responseTimeHours === 0
        ? "< 1 hour"
        : responseTimeHours === 1
        ? "1 hour"
        : `${responseTimeHours} hours`;

    // Seller Tier
    let sellerLevel = "New Seller";
    const rawLevel = seller.sellerLevel || seller.level || seller.achievementLevel?.tier || "";
    if (seller.isPro) {
      sellerLevel = "Fiverr Pro";
    } else if (rawLevel === "TOP_RATED" || rawLevel === "TOP_RATED_SELLER") {
      sellerLevel = "Top Rated Seller";
    } else if (rawLevel === "LEVEL_TWO" || rawLevel === "LEVEL_2") {
      sellerLevel = "Level 2 Seller";
    } else if (rawLevel === "LEVEL_ONE" || rawLevel === "LEVEL_1") {
      sellerLevel = "Level 1 Seller";
    } else if (rawLevel === "RISING_TALENT") {
      sellerLevel = "Rising Talent";
    } else if (rawLevel === "NEW_SELLER") {
      sellerLevel = "New Seller";
    } else if (rawLevel && rawLevel !== "NO_LEVEL") {
      sellerLevel = rawLevel.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    // Ratings
    const ratingScore =
      seller.rating?.score ||
      parseFloat(jsonLdPerson?.aggregateRating?.ratingValue) ||
      5.0;
    const reviewCount =
      seller.rating?.count ||
      parseInt(jsonLdPerson?.aggregateRating?.reviewCount || jsonLdPerson?.aggregateRating?.ratingCount || "0", 10) ||
      0;

    // Languages
    const languages: FiverrLanguage[] = [];
    if (Array.isArray(sellerUser.languages)) {
      for (const lang of sellerUser.languages) {
        const rawCode = (lang.code || "").toLowerCase();
        const langName = LANGUAGE_CODE_MAP[rawCode] || lang.code || "Language";
        let levelName = PROFICIENCY_LEVEL_MAP[lang.level] || lang.level || "Fluent";
        if (typeof lang.level === "number") {
          levelName = lang.level >= 4 ? "Native / Bilingual" : lang.level === 3 ? "Fluent" : "Conversational";
        }
        languages.push({
          language: langName,
          code: lang.code,
          level: levelName,
        });
      }
    } else if (Array.isArray(jsonLdPerson?.inLanguage)) {
      for (const code of jsonLdPerson.inLanguage) {
        const rawCode = (code || "").toLowerCase();
        languages.push({
          language: LANGUAGE_CODE_MAP[rawCode] || code.toUpperCase(),
          code,
          level: "Fluent",
        });
      }
    }

    // Education
    const education: FiverrEducation[] = [];
    if (Array.isArray(seller.activeEducations)) {
      for (const edu of seller.activeEducations) {
        education.push({
          degree: edu.degree || edu.degreeTitle || "Degree",
          school: edu.school || "University",
          degreeTitle: edu.degreeTitle,
          toYear: edu.toYear,
          countryCode: edu.countryCode,
        });
      }
    }

    // Certifications
    const certifications: FiverrCertification[] = [];
    if (Array.isArray(seller.certifications)) {
      for (const cert of seller.certifications) {
        certifications.push({
          name: cert.certificationName || "Certified Professional",
          from: cert.receivedFrom || "Issuer",
          year: cert.year,
        });
      }
    }

    // Recent Reviews & Delivery
    const recentReviews: FiverrReview[] = [];
    let latestDeliveryDate: string | undefined = undefined;

    const reviewsList = reviewsData.buying_reviews?.reviews;
    if (Array.isArray(reviewsList)) {
      for (const rev of reviewsList) {
        if (!latestDeliveryDate && rev.created_at) {
          latestDeliveryDate = rev.created_at;
        }
        recentReviews.push({
          id: rev.id,
          reviewer: rev.username || "Client",
          reviewerCountry: rev.reviewer_country,
          reviewerCountryCode: rev.reviewer_country_code,
          rating: rev.value || 5,
          comment: rev.comment || "",
          createdAt: rev.created_at || "",
          workSample: rev.work_sample || rev.work_sample_preview_url,
          orderDuration: rev.order_duration_en || rev.order_duration,
          priceRange: rev.order_price_range_usd || rev.order_price_range,
          sellerResponse: rev.seller_response?.comment,
        });
      }
    }

    const lastDeliveryText = formatRelativeTime(latestDeliveryDate);

    // ==========================================
    // 4. PUBLISHED GIGS EXTRACTION & PARALLEL ENRICHMENT
    // ==========================================
    const gigCandidates = new Map<string, any>();

    // A. Add active marketplace gigs from perseusData
    if (Array.isArray(perseusData?.gigsData)) {
      for (const g of perseusData.gigsData) {
        const slug = g.cached_slug || g.slug;
        if (slug) {
          gigCandidates.set(slug, {
            id: g.gig_id || g.id,
            title: g.title,
            slug,
            imageUrl: g.assets?.[0]?.cloud_img_main_gig || g.assets?.[0]?.url || g.seller_img || "",
            startingPrice: g.price_i ? `$${g.price_i}` : "$50",
            rating: g.buying_review_rating || 5.0,
            reviewCount: g.buying_review_rating_count || 0,
            metadata: g.metadata || [],
          });
        }
      }
    }

    // B. Add delivered gigs from reviews (crucial when seller has paused or delivered-only gigs)
    if (Array.isArray(reviewsList)) {
      for (const rev of reviewsList) {
        const slug = rev.gig_slug;
        if (slug && !gigCandidates.has(slug)) {
          const derivedTitle = slug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          gigCandidates.set(slug, {
            id: rev.gig_id || `deliv_${Math.random()}`,
            title: derivedTitle,
            slug,
            imageUrl: rev.work_sample || rev.work_sample_preview_url || "",
            startingPrice: rev.order_price_range_usd || "$50",
            rating: rev.value || 5,
            reviewCount: 1,
            category: "Programming & Tech",
            subCategory: "Custom Development",
            tags: ["custom development", "delivery sample"],
            metadata: [],
          });
        }
      }
    }

    // Concurrently deep-enrich every single candidate gig with descriptions, packages, FAQs, and scope
    const gigs: FiverrGig[] = await Promise.all(
      Array.from(gigCandidates.values()).map((cand) =>
        this.enrichGig(cleanUsername, cand.slug, cand)
      )
    );

    // ==========================================
    // 5. COMPREHENSIVE SKILLS & TECH STACK EXTRACTION
    // ==========================================
    const skillsMap = new Map<string, FiverrSkill>();

    // A. Add active structured skills from seller profile
    if (Array.isArray(seller.activeStructuredSkills)) {
      for (const s of seller.activeStructuredSkills) {
        if (s.name) {
          skillsMap.set(s.name.toLowerCase(), {
            name: s.name,
            level: s.level || "PRO",
            verified: Boolean(s.verified),
          });
        }
      }
    }

    // B. Add schema.org knowsAbout skills
    if (Array.isArray(jsonLdPerson?.knowsAbout)) {
      for (const s of jsonLdPerson.knowsAbout) {
        if (s && !skillsMap.has(s.toLowerCase())) {
          skillsMap.set(s.toLowerCase(), {
            name: s,
            level: "PRO",
            verified: false,
          });
        }
      }
    }

    // C. Extract all technology frameworks, tools, and languages declared in Gigs metadata
    for (const gig of gigs) {
      if (Array.isArray(gig.metadata)) {
        for (const meta of gig.metadata) {
          if (Array.isArray(meta.value)) {
            for (const item of meta.value) {
              const formattedName = TECH_NAME_MAP[item] || item.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              if (!skillsMap.has(formattedName.toLowerCase())) {
                skillsMap.set(formattedName.toLowerCase(), {
                  name: formattedName,
                  level: "PRO",
                  verified: false,
                });
              }
            }
          }
        }
      }
      // D. Also extract search tags from gigs
      if (Array.isArray(gig.tags)) {
        for (const tag of gig.tags) {
          const formattedTag = tag.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
          if (formattedTag.length > 2 && !skillsMap.has(formattedTag.toLowerCase())) {
            skillsMap.set(formattedTag.toLowerCase(), {
              name: formattedTag,
              level: "PRO",
              verified: false,
            });
          }
        }
      }
    }

    const skills: FiverrSkill[] = Array.from(skillsMap.values());

    return {
      username,
      displayName,
      profileUrl,
      avatarUrl,
      profileCoverUrl: seller.profileBackgroundImage || "",
      isAgency: Boolean(seller.isSelfIdentifiedAsAgency || seller.agency?.isAgency || false),
      tagline,
      description,
      country,
      countryCode,
      memberSince,
      joinedAtTimestamp,
      responseTimeHours,
      responseTimeText,
      lastDeliveryText,
      sellerLevel,
      isPro: Boolean(seller.isPro),
      isVerified: Boolean(seller.isVerified),
      isHighlyResponsive: Boolean(seller.isHighlyResponsive),
      rating: ratingScore,
      reviewCount,
      languages,
      skills,
      education,
      certifications,
      gigs,
      recentReviews,
      scrapedAt: new Date().toISOString(),
    };
  }
}

export const fiverrScraperService = new FiverrScraperService();
