import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Clock,
  RefreshCw,
  Award,
  Zap,
  Bot,
  Globe,
  Server,
  Smartphone,
  Code,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Palette,
  Search,
  Star,
  Heart,
  HelpCircle,
  FileText,
  DollarSign,
  ListChecks,
  Monitor,
  Layers,
  Info,
  X,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GigGeneratorViewProps {
  onGigGenerated?: () => void;
  initialNiche?: string;
  initialSkills?: string;
}

interface RadioOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'ai' | 'web' | 'backend' | 'mobile' | 'speed' | 'quality' | 'enterprise' | 'code';
  recommended?: boolean;
}

interface InterrogationQuestion {
  step: number;
  totalSteps: number;
  questionId: string;
  headline: string;
  subtext: string;
  options: RadioOption[];
  allowCustomInput?: boolean;
}

interface GigPackageTier {
  name: string;
  title: string;
  description: string;
  deliveryDays: number;
  revisions: number | string;
  priceUsd: number;
  features: { name: string; included: boolean }[];
}

interface GigBlueprint {
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

type StudioTab = 'overview' | 'pricing' | 'description' | 'requirements' | 'thumbnail';

export const GigGeneratorView: React.FC<GigGeneratorViewProps> = ({
  onGigGenerated,
  initialNiche,
  initialSkills,
}) => {
  const { user, userContext } = useAuth();

  // Mode: 'interrogation' | 'analyzing' | 'studio'
  const [mode, setMode] = useState<'interrogation' | 'analyzing' | 'studio'>('interrogation');
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  // Interrogation state
  const [currentQuestion, setCurrentQuestion] = useState<InterrogationQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);

  // Analysis / Telemetry animation step
  const [telemetryStep, setTelemetryStep] = useState<number>(1);

  // Synthesized Blueprint
  const [blueprint, setBlueprint] = useState<GigBlueprint | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Thumbnail Studio Safe Zone
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);

  // Dedicated Autonomous Gig Visual Design Agent State
  const [imageAgentRunning, setImageAgentRunning] = useState<boolean>(false);
  const [agentConcepts, setAgentConcepts] = useState<any[]>([
    {
      id: 'concept_saas_cockpit',
      name: '3D Product Showcase (MacBook Pro & Code IDE)',
      heroSubject: 'Floating 3D MacBook Pro & Code IDE with Live Revenue Metrics',
      aesthetic: 'Clean Emerald Engineering & Silicon Valley Pro',
      headline: 'CUSTOM AI AGENTS & FULL-STACK SAAS',
      subHook: 'Production Next.js 15 • OpenAI GPT-4o • Stripe Ready',
      badges: ['Next.js', 'React', 'OpenAI', 'Python', 'FastAPI', 'Tailwind'],
      trustBadges: ['★ 5.0 Star Reviews', '⚡ 24H Turnaround', '100% Code Ownership'],
      theme: 'emerald_pro',
      imageSrc: '/flagship_gigs/concept_saas_cockpit.jpg',
    },
    {
      id: 'concept_hybrid_zenkoders',
      name: 'Zenkoders Flagship (100+ Web Apps Developed)',
      heroSubject: 'High-Converting Agency Showcase with 3D SaaS Dashboard',
      aesthetic: 'Fiverr Vetted Pro & Top-Rated Seller Benchmark',
      headline: '100+ WEB APPLICATIONS DEVELOPED',
      subHook: 'Powerful • Scalable • Secure • Rapid 48H MVP',
      badges: ['Next.js', 'React', 'Node.js', 'AWS', 'Supabase', 'Cursor'],
      trustBadges: ['★ 5-Star Reviews', '700+ Orders Completed', 'Free Consultation'],
      theme: 'emerald_pro',
      imageSrc: '/flagship_gigs/concept_saas_cockpit.jpg',
    },
    {
      id: 'concept_ai_agent',
      name: '3D AI Workflow Command Center (LangChain & Chatbot Matrix)',
      heroSubject: 'Floating Glassmorphic AI Chatbot & LangChain Flowchart Matrix',
      aesthetic: 'Deep Cyber Slate & High-Tech Futurism',
      headline: 'CUSTOM AI AGENTS & CHATBOTS',
      subHook: 'OpenAI GPT-4o • LangChain • Voice Automation • RAG',
      badges: ['OpenAI', 'LangChain', 'Python', 'FastAPI', 'Next.js', 'Docker'],
      trustBadges: ['⚡ Sub-Second Latency', '100% Custom Code', 'Daily Video Update'],
      theme: 'cyber_slate',
      imageSrc: '/flagship_gigs/concept_ai_agent.jpg',
    },
    {
      id: 'concept_pro_consultant',
      name: 'Fiverr Pro Tech Consultant (The Executive Agency Look)',
      heroSubject: 'Charismatic Senior AI Developer in Black Blazer with Studio Lighting',
      aesthetic: 'Charismatic Professional Freelancer & Agency Founder',
      headline: 'FULL STACK AI & WEB DEVELOPER',
      subHook: 'Enterprise LangChain • Custom RAG • Production Scalability',
      badges: ['OpenAI', 'Next.js', 'Python', 'FastAPI', 'AWS', 'Docker'],
      trustBadges: ['★ Top Rated 5.0', '⚡ 24H Delivery', 'Free Video Consultation'],
      theme: 'emerald_pro',
      imageSrc: '/flagship_gigs/pro_developer_avatar.jpg',
    },
    {
      id: 'concept_neural_matrix',
      name: '3D Quantum Cloud Server Core & Microservices',
      heroSubject: 'Isometric Glowing Quantum Neural Processor & Server Racks',
      aesthetic: 'High-Tech Enterprise Cloud Infrastructure',
      headline: 'ENTERPRISE CLOUD & AI APIS',
      subHook: 'High Throughput • Zero Downtime • Full Documentation',
      badges: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'Kubernetes'],
      trustBadges: ['🔒 Bank-Grade Security', '99.9% Uptime SLA', 'Full Code Rights'],
      theme: 'dark_glassmorphic',
      imageSrc: '/flagship_gigs/concept_neural_matrix.jpg',
    },
  ]);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('concept_saas_cockpit');
  const [displayMode, setDisplayMode] = useState<'studio_split' | 'full_bleed'>('studio_split');
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);
  const [agentKnowledge, setAgentKnowledge] = useState<{
    wordCount: number;
    charCount: number;
    directivesExcerpt: string;
    totalChapters: number;
  } | null>(null);

  // 3D Subject & AI Artwork State
  const [visualSubject, setVisualSubject] = useState<'robot' | 'dashboard' | 'neural_core' | 'mobile_app' | 'flux_art'>('flux_art');
  const [artworkPrompt, setArtworkPrompt] = useState<string>('Award-winning commercial Fiverr gig cover, modern high-tech 3D isometric full-stack SaaS web application showcase, floating frameless Apple MacBook Pro and curved glass OLED display showing a sleek dark-mode SaaS dashboard with glowing live revenue metrics, interactive user analytics charts, and a modern code editor IDE window with syntax highlighting, vibrant emerald green and cyan neon edge lighting, dark obsidian luxury tech background, ray tracing, ultra-crisp, 8k resolution, absolutely no human faces, no robot faces, no text');
  const [artworkDataUri, setArtworkDataUri] = useState<string | null>('/flagship_gigs/concept_saas_cockpit.jpg');
  const artworkImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize Thumbnail State with High-Converting Defaults
  const [thumbnailTheme, setThumbnailTheme] = useState<'dark_glassmorphic' | 'emerald_pro' | 'cyber_slate' | 'midnight_amber'>('emerald_pro');
  const [thumbnailHeadline, setThumbnailHeadline] = useState<string>('CUSTOM AI AGENTS & FULL-STACK SAAS');
  const [thumbnailSubHook, setThumbnailSubHook] = useState<string>('Production Next.js 15 • OpenAI GPT-4o • Stripe Ready');
  const [thumbnailBadges, setThumbnailBadges] = useState<string[]>(['Next.js', 'React', 'OpenAI', 'Python', 'FastAPI', 'Tailwind']);
  const [thumbnailTrust, setThumbnailTrust] = useState<string[]>(['★ 5.0 Star Reviews', '⚡ 24H Turnaround', '100% Code Ownership']);

  // Description 5-Part & Tone State
  const [descriptionTone, setDescriptionTone] = useState<'roi_closer' | 'enterprise' | 'rapid_mvp'>('roi_closer');
  const [regeneratingDesc, setRegeneratingDesc] = useState<boolean>(false);

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial interrogation question on mount
  useEffect(() => {
    loadInitialQuestion();
  }, []);

  // Preload initial flagship artwork image on mount or when artworkDataUri changes
  useEffect(() => {
    if (artworkDataUri) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        artworkImgRef.current = img;
        drawThumbnail();
      };
      img.src = artworkDataUri;
    }
  }, [artworkDataUri]);

  // Sync props if passed
  useEffect(() => {
    if (initialNiche || initialSkills) {
      setAnswers((prev) => ({
        ...prev,
        ...(initialNiche ? { service_domain: initialNiche } : {}),
        ...(initialSkills ? { tech_arsenal: initialSkills } : {}),
      }));
    }
  }, [initialNiche, initialSkills]);

  // Sync thumbnail state when blueprint arrives
  useEffect(() => {
    if (blueprint?.thumbnailSpecs) {
      setThumbnailHeadline(blueprint.thumbnailSpecs.headline || 'PRODUCTION AI & WEB APPS');
      setThumbnailSubHook(blueprint.thumbnailSpecs.subHook || 'Enterprise Architecture • 24H Delivery');
      setThumbnailBadges(blueprint.thumbnailSpecs.techBadges || ['Next.js', 'React', 'TypeScript', 'Node.js']);
      setThumbnailTrust(blueprint.thumbnailSpecs.trustBadges || ['⚡ 24H Turnaround', '100% Code Ownership', 'Loom Video Demo']);
      if (blueprint.thumbnailSpecs.themeStyle) {
        setThumbnailTheme(blueprint.thumbnailSpecs.themeStyle);
      }
      if (blueprint.thumbnailSpecs.visualSubject) {
        setVisualSubject(blueprint.thumbnailSpecs.visualSubject);
      }
      if (blueprint.thumbnailSpecs.artworkPrompt) {
        setArtworkPrompt(blueprint.thumbnailSpecs.artworkPrompt);
      }
      if (blueprint.description.tone && (blueprint.description.tone === 'enterprise' || blueprint.description.tone === 'rapid_mvp' || blueprint.description.tone === 'roi_closer')) {
        setDescriptionTone(blueprint.description.tone);
      }
    }
  }, [blueprint]);

  // Redraw canvas whenever thumbnail parameters change
  useEffect(() => {
    if (mode === 'studio' && activeTab === 'thumbnail') {
      drawThumbnail();
    }
  }, [
    mode,
    activeTab,
    thumbnailTheme,
    thumbnailHeadline,
    thumbnailSubHook,
    thumbnailBadges,
    thumbnailTrust,
    showSafeZone,
    visualSubject,
    artworkDataUri,
    displayMode,
  ]);

  const loadInitialQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch('/api/v1/gigs/interrogate-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentQuestion(data.data);
        // Pre-select recommended option if available
        const rec = data.data.options.find((o: RadioOption) => o.recommended);
        if (rec) {
          setSelectedOptionId(rec.id);
        } else if (data.data.options.length > 0) {
          setSelectedOptionId(data.data.options[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial interrogation question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSelectOption = (option: RadioOption) => {
    setSelectedOptionId(option.id);
    setIsCustomSelected(false);
  };

  const handleSelectCustom = () => {
    setIsCustomSelected(true);
    setSelectedOptionId('custom');
  };

  const handleNextStep = async () => {
    if (!currentQuestion) return;

    let chosenValue = '';
    if (isCustomSelected) {
      chosenValue = customInputValue.trim() || 'Custom Specification';
    } else {
      const opt = currentQuestion.options.find((o) => o.id === selectedOptionId);
      chosenValue = opt ? opt.title : selectedOptionId;
    }

    const updatedAnswers = {
      ...answers,
      [currentQuestion.questionId]: chosenValue,
    };
    setAnswers(updatedAnswers);

    // If reached step 4, proceed to synthesis
    if (currentQuestion.step >= currentQuestion.totalSteps) {
      startSynthesis(updatedAnswers);
      return;
    }

    // Otherwise fetch next turn
    setLoadingQuestion(true);
    try {
      const res = await fetch('/api/v1/gigs/interrogate-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: currentQuestion.step,
          answers: updatedAnswers,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentQuestion(data.data);
        const rec = data.data.options.find((o: RadioOption) => o.recommended);
        setSelectedOptionId(rec ? rec.id : data.data.options[0]?.id || '');
        setIsCustomSelected(false);
        setCustomInputValue('');
      } else {
        // If no more questions, synthesize
        startSynthesis(updatedAnswers);
      }
    } catch (err) {
      console.error('Failed to fetch next question:', err);
      startSynthesis(updatedAnswers);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const startSynthesis = async (finalAnswers: Record<string, string>) => {
    setMode('analyzing');
    setTelemetryStep(1);

    // Telemetry progress simulation
    const t1 = setTimeout(() => setTelemetryStep(2), 1200);
    const t2 = setTimeout(() => setTelemetryStep(3), 2600);
    const t3 = setTimeout(() => setTelemetryStep(4), 4200);

    try {
      const res = await fetch('/api/v1/gigs/synthesize-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          userId: user?.id,
        }),
      });
      const json = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (json.success && json.data) {
        setBlueprint(json.data);
        setMode('studio');
        if (onGigGenerated) onGigGenerated();
      } else {
        throw new Error(json.error || 'Failed to synthesize blueprint');
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      alert('Encountered an issue synthesizing the gig. Retrying with fallback heuristic engine...');
      setMode('interrogation');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyEntireGig = () => {
    if (!blueprint) return;
    const fullText = `=== FIVERR GIG CREATION BLUEPRINT ===
STEP 1: OVERVIEW
Gig Title: ${blueprint.overview.title}
Category: ${blueprint.overview.category} > ${blueprint.overview.subCategory}
Search Tags (5): ${blueprint.overview.searchTags.join(', ')}

STEP 2: SCOPE & PRICING
[BASIC] $${blueprint.pricing.basic.priceUsd} - ${blueprint.pricing.basic.title} (${blueprint.pricing.basic.deliveryDays} Day Delivery, ${blueprint.pricing.basic.revisions} Revisions)
${blueprint.pricing.basic.description}

[STANDARD] $${blueprint.pricing.standard.priceUsd} - ${blueprint.pricing.standard.title} (${blueprint.pricing.standard.deliveryDays} Days Delivery, ${blueprint.pricing.standard.revisions} Revisions)
${blueprint.pricing.standard.description}

[PREMIUM] $${blueprint.pricing.premium.priceUsd} - ${blueprint.pricing.premium.title} (${blueprint.pricing.premium.deliveryDays} Days Delivery, ${blueprint.pricing.premium.revisions} Revisions)
${blueprint.pricing.premium.description}

STEP 3: DESCRIPTION
${blueprint.description.fullText}

FAQS:
${blueprint.faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n')}

STEP 4: BUYER REQUIREMENTS
${blueprint.buyerRequirements.map((r, i) => `${i + 1}. [${r.mandatory ? 'MANDATORY' : 'OPTIONAL'}] ${r.question}`).join('\n')}
`;
    copyToClipboard(fullText, 'full_blueprint');
  };

  // Autonomous Gig Visual Design Agent Generation
  const handleGenerateWithImageAgent = async (conceptOverrideId?: string, customPromptOverride?: string) => {
    setImageAgentRunning(true);
    try {
      const cId = conceptOverrideId || selectedConceptId;
      const pToUse = customPromptOverride || artworkPrompt;
      const res = await fetch('/api/v1/gigs/image-agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blueprint?.overview?.title || answers.service_domain || 'Custom AI & Tech Solution',
          serviceDomain: answers.service_domain || blueprint?.overview?.subCategory,
          techStack: answers.tech_arsenal || thumbnailBadges,
          stylePreset: cId,
          customPrompt: pToUse,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setArtworkDataUri(data.data.dataUri);
        if (data.data.variations) {
          setAgentConcepts(data.data.variations);
        }
        if (data.data.concept) {
          setSelectedConceptId(data.data.concept.id);
          if (data.data.concept.headline) setThumbnailHeadline(data.data.concept.headline);
          if (data.data.concept.subHook) setThumbnailSubHook(data.data.concept.subHook);
          if (data.data.concept.badges?.length) setThumbnailBadges(data.data.concept.badges);
          if (data.data.concept.trustBadges?.length) setThumbnailTrust(data.data.concept.trustBadges);
          if (data.data.concept.theme) setThumbnailTheme(data.data.concept.theme);
        }
        const img = new Image();
        img.onload = () => {
          artworkImgRef.current = img;
          setVisualSubject('flux_art');
          drawThumbnail();
        };
        img.src = data.data.dataUri;
      } else {
        throw new Error(data.error || 'Failed to render image');
      }
    } catch (err) {
      console.error('Gig Visual Design Agent error:', err);
      alert('Gig Visual Design Agent could not connect to render engine. Please retry.');
    } finally {
      setImageAgentRunning(false);
    }
  };

  const loadAgentKnowledge = async () => {
    try {
      const res = await fetch('/api/v1/gigs/image-agent/knowledge');
      const data = await res.json();
      if (data.success && data.data) {
        setAgentKnowledge(data.data);
        setShowKnowledgeModal(true);
      }
    } catch (err) {
      console.error('Failed to load agent knowledge:', err);
    }
  };

  const handleSelectConcept = (concept: any) => {
    setSelectedConceptId(concept.id);
    if (concept.headline) setThumbnailHeadline(concept.headline);
    if (concept.subHook) setThumbnailSubHook(concept.subHook);
    if (concept.badges?.length) setThumbnailBadges(concept.badges);
    if (concept.trustBadges?.length) setThumbnailTrust(concept.trustBadges);
    if (concept.theme) setThumbnailTheme(concept.theme);
    if (concept.imageSrc) {
      setArtworkDataUri(concept.imageSrc);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        artworkImgRef.current = img;
        drawThumbnail();
      };
      img.src = concept.imageSrc;
    }
    handleGenerateWithImageAgent(concept.id);
  };

  const handleRegenerateDescription = async (newTone: 'roi_closer' | 'enterprise' | 'rapid_mvp') => {
    if (!blueprint) return;
    setDescriptionTone(newTone);
    setRegeneratingDesc(true);
    try {
      const res = await fetch('/api/v1/gigs/regenerate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blueprint.overview.title,
          serviceDomain: answers.service_domain || blueprint.overview.subCategory,
          techStack: answers.tech_arsenal || blueprint.thumbnailSpecs.techBadges.join(', '),
          tone: newTone,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBlueprint((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            description: {
              ...prev.description,
              ...data.data,
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to regenerate gig description:', err);
    } finally {
      setRegeneratingDesc(false);
    }
  };

  // Helper for rendering icons
  const renderOptionIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return <Bot className="w-5 h-5 text-[#10b981]" />;
      case 'web':
        return <Globe className="w-5 h-5 text-[#38bdf8]" />;
      case 'backend':
        return <Server className="w-5 h-5 text-[#818cf8]" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-[#f472b6]" />;
      case 'speed':
        return <Zap className="w-5 h-5 text-[#fbbf24]" />;
      case 'enterprise':
        return <ShieldCheck className="w-5 h-5 text-[#34d399]" />;
      default:
        return <Code className="w-5 h-5 text-[#a78bfa]" />;
    }
  };

  /**
   * Real Vector Brand Logo Renderer on Canvas
   */
  const drawBrandLogo = (ctx: CanvasRenderingContext2D, brand: string, x: number, y: number, size: number = 20) => {
    const b = brand.toLowerCase();
    ctx.save();
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (b.includes('react')) {
      ctx.strokeStyle = '#61dafb';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = '#61dafb';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      for (const angle of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, size * 0.46, size * 0.18, angle, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (b.includes('openai') || b.includes('gpt')) {
      ctx.strokeStyle = '#10a37f';
      ctx.lineWidth = 1.8;
      const r = size * 0.42;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * (r * 0.45), cy + Math.sin(angle) * (r * 0.45), r * 0.45, angle, angle + Math.PI);
        ctx.stroke();
      }
    } else if (b.includes('next')) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, cy + 5.5);
      ctx.lineTo(cx - 4.5, cy - 5.5);
      ctx.lineTo(cx + 4.5, cy + 5.5);
      ctx.stroke();
    } else if (b.includes('python')) {
      ctx.fillStyle = '#387eb8';
      ctx.beginPath();
      ctx.roundRect(cx - 6, cy - 6, 8, 8, [4, 4, 0, 4]);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe873';
      ctx.beginPath();
      ctx.roundRect(cx - 2, cy - 2, 8, 8, [0, 4, 4, 4]);
      ctx.fill();
      ctx.fillStyle = '#387eb8';
      ctx.beginPath();
      ctx.arc(cx + 3, cy + 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.includes('typescript') || b === 'ts') {
      ctx.fillStyle = '#3178c6';
      ctx.beginPath();
      ctx.roundRect(cx - 7, cy - 7, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText('TS', cx - 5.5, cy + 3.5);
    } else if (b.includes('tailwind')) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 1, 4, Math.PI, 0);
      ctx.arc(cx + 3, cy + 2, 4, 0, Math.PI);
      ctx.fill();
    } else if (b.includes('flutter')) {
      ctx.fillStyle = '#02569B';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 6);
      ctx.lineTo(cx + 5, cy + 4);
      ctx.lineTo(cx + 1, cy + 4);
      ctx.lineTo(cx - 5, cy - 2);
      ctx.fill();
      ctx.fillStyle = '#0175C2';
      ctx.beginPath();
      ctx.moveTo(cx + 1, cy + 4);
      ctx.lineTo(cx + 5, cy + 4);
      ctx.lineTo(cx - 1, cy - 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  /**
   * HTML5 Canvas High-Converting 1280x769 Thumbnail Generator
   * Features: 48/52 Split Layout (Left: Conversion Copy & Tech Badges; Right: 3D Visual Art & Mockups)
   */
  /**
   * HTML5 Canvas High-Converting 1280x769 Thumbnail Generator
   * Full-bleed Edge-to-Edge Zenkoders / Fiverr Pro Flagship Layout
   * - Edge-to-edge canvas with dark luxury tech studio background (no 55px margins)
   * - Right 60%: High-res 8K 3D photorealistic asset (MacBook Pro + SaaS dashboard) seamlessly blended with horizontal alpha feather
   * - Left 40%: The exact high-converting conversion stack (Fiverr Pro vetted, 5.0 rating, 52px headline, slogan pill, tech badges, trust pillars, video consultation CTA, checklist)
   */
  const drawThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 769;
    canvas.width = width;
    canvas.height = height;

    // Full-Bleed 100% Photorealistic AI Artwork Mode (Direct Artwork View)
    if (displayMode === 'full_bleed' && artworkImgRef.current) {
      ctx.drawImage(artworkImgRef.current, 0, 0, width, height);

      // Safe Zone Overlay if enabled
      if (showSafeZone) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(0, 24, width, height - 48);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(width - 320, height - 120, 320, 120);
        ctx.strokeRect(width - 320, height - 120, 320, 120);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('⚠ FIVERR PRICE BADGE DANGER ZONE', width - 305, height - 60);
        ctx.restore();
      }

      // Synchronize preview simulator canvas
      if (previewCanvasRef.current) {
        const pCtx = previewCanvasRef.current.getContext('2d');
        if (pCtx) {
          pCtx.clearRect(0, 0, 360, 216);
          pCtx.drawImage(canvas, 0, 0, 360, 216);
        }
      }
      return;
    }

    // =========================================================================
    // 1. FULL-BLEED STUDIO BACKGROUND (EDGE-TO-EDGE LUXURY TECH OBSIDIAN)
    // =========================================================================
    let bgBase1 = '#03080e';
    let bgBase2 = '#07151a';
    let bgBase3 = '#020509';
    let glowOrb1 = 'rgba(16, 185, 129, 0.22)';
    let glowOrb2 = 'rgba(56, 189, 248, 0.20)';
    let accentHighlight = '#34d399';

    if (thumbnailTheme === 'dark_glassmorphic') {
      bgBase1 = '#040714';
      bgBase2 = '#091224';
      bgBase3 = '#03050f';
      glowOrb1 = 'rgba(56, 189, 248, 0.26)';
      glowOrb2 = 'rgba(99, 102, 241, 0.18)';
      accentHighlight = '#7dd3fc';
    } else if (thumbnailTheme === 'cyber_slate') {
      bgBase1 = '#060b17';
      bgBase2 = '#0f1d36';
      bgBase3 = '#050914';
      glowOrb1 = 'rgba(56, 189, 248, 0.24)';
      glowOrb2 = 'rgba(129, 140, 248, 0.20)';
      accentHighlight = '#818cf8';
    } else if (thumbnailTheme === 'midnight_amber') {
      bgBase1 = '#090704';
      bgBase2 = '#191309';
      bgBase3 = '#070503';
      glowOrb1 = 'rgba(245, 158, 11, 0.24)';
      glowOrb2 = 'rgba(217, 119, 6, 0.16)';
      accentHighlight = '#fbbf24';
    }

    // Base background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, bgBase1);
    bgGrad.addColorStop(0.5, bgBase2);
    bgGrad.addColorStop(1, bgBase3);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing atmospheric radial orbs
    const orb1 = ctx.createRadialGradient(280, 220, 10, 280, 220, 480);
    orb1.addColorStop(0, glowOrb1);
    orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, width, height);

    const orb2 = ctx.createRadialGradient(width - 250, 360, 20, width - 250, 360, 520);
    orb2.addColorStop(0, glowOrb2);
    orb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, width, height);

    // Subtle perspective matrix grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // =========================================================================
    // 2. RIGHT 60%: 3D FLAGSHIP HERO SHOWCASE (SEAMLESS HORIZONTAL FADE)
    // =========================================================================
    const heroX = 470;
    const heroW = width - heroX;
    const heroH = height;

    if (artworkImgRef.current) {
      const img = artworkImgRef.current;
      const imgRatio = img.width / img.height;
      const boxRatio = heroW / heroH;
      let sW = img.width;
      let sH = img.height;
      let sX = 0;
      let sY = 0;

      if (imgRatio > boxRatio) {
        sW = img.height * boxRatio;
        sX = (img.width - sW) / 2;
      } else {
        sH = img.width / boxRatio;
        sY = (img.height - sH) / 2;
      }

      ctx.save();
      // Draw 3D asset edge-to-edge on right 60%
      ctx.drawImage(img, sX, sY, sW, sH, heroX, 0, heroW, heroH);

      // Organic horizontal alpha feather: fades the image seamlessly into the left dark background
      const fadeGrad = ctx.createLinearGradient(heroX - 10, 0, heroX + 280, 0);
      fadeGrad.addColorStop(0, bgBase1);
      fadeGrad.addColorStop(0.32, bgBase1);
      fadeGrad.addColorStop(0.72, 'rgba(3, 8, 14, 0.55)');
      fadeGrad.addColorStop(1, 'rgba(3, 8, 14, 0)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(heroX - 20, 0, 310, height);

      // Top & bottom subtle studio vignettes
      const topVignette = ctx.createLinearGradient(0, 0, 0, 110);
      topVignette.addColorStop(0, 'rgba(2, 5, 10, 0.75)');
      topVignette.addColorStop(1, 'rgba(2, 5, 10, 0)');
      ctx.fillStyle = topVignette;
      ctx.fillRect(heroX, 0, heroW, 110);

      const bottomVignette = ctx.createLinearGradient(0, height - 110, 0, height);
      bottomVignette.addColorStop(0, 'rgba(2, 5, 10, 0)');
      bottomVignette.addColorStop(1, 'rgba(2, 5, 10, 0.85)');
      ctx.fillStyle = bottomVignette;
      ctx.fillRect(heroX, height - 110, heroW, 110);

      // Floating Live Status Badge on Hero (Top Right)
      const fPillX = width - 295;
      const fPillY = 48;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(fPillX, fPillY, 245, 38, 19);
      ctx.fill();
      ctx.stroke();

      // Glowing Green Live Indicator
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fPillX + 22, fPillY + 19, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('⚡ 100% PRODUCTION READY', fPillX + 36, fPillY + 23);
      ctx.restore();
    } else {
      // Procedural Fallback 3D SaaS Dashboard & IDE Showcase if artwork still loading
      ctx.save();
      const pBoxX = heroX + 40;
      const pBoxY = 85;
      const pBoxW = heroW - 80;
      const pBoxH = height - 170;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pBoxX, pBoxY, pBoxW, pBoxH, 18);
      ctx.fill();
      ctx.stroke();

      // Mac header
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.beginPath();
      ctx.roundRect(pBoxX, pBoxY, pBoxW, 46, [18, 18, 0, 0]);
      ctx.fill();

      // Mac dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pBoxX + 22, pBoxY + 23, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pBoxX + 42, pBoxY + 23, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pBoxX + 62, pBoxY + 23, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ enterprise.saas.cockpit.ts (v2.4)', pBoxX + 90, pBoxY + 28);
      ctx.restore();
    }

    // =========================================================================
    // 3. LEFT 40%: THE HIGH-CONVERTING CONVERSION STACK (ZENKODERS BENCHMARK)
    // =========================================================================
    const leftX = 56;

    // --- ROW 1: TOP AUTHORITY BADGES (Y = 52) ---
    ctx.save();
    // Badge 1: Fiverr Pro Vetted
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(leftX, 52, 205, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('★ FIVERR PRO VETTED', leftX + 16, 52 + 22);

    // Badge 2: Top Rated 5.0 (100+)
    const trX = leftX + 217;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(trX, 52, 205, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('★ TOP RATED 5.0 (100+)', trX + 16, 52 + 22);
    ctx.restore();

    // --- ROW 2: HIGH-IMPACT 52PX CONVERSION HEADLINE (Y = 142) ---
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.font = '900 52px system-ui, -apple-system, sans-serif';

    const rawHeadline = thumbnailHeadline || 'CUSTOM AI AGENTS & FULL-STACK SAAS';
    const words = rawHeadline.split(' ');
    const midpoint = Math.ceil(words.length / 2);
    const line1 = words.slice(0, midpoint).join(' ');
    const line2 = words.slice(midpoint).join(' ');

    const headlineY1 = 145;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line1.toUpperCase(), leftX, headlineY1);

    const headlineY2 = line2 ? headlineY1 + 62 : headlineY1;
    if (line2) {
      ctx.fillStyle = accentHighlight;
      ctx.fillText(line2.toUpperCase(), leftX, headlineY2);
    }
    ctx.restore();

    // --- ROW 3: SLOGAN / VALUE PROPOSITION PILL (Y = 270) ---
    const sloganY = line2 ? headlineY2 + 38 : headlineY1 + 55;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(leftX, sloganY, 390, 34, 17);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚡ POWERFUL • SCALABLE • PRODUCTION SECURE', leftX + 16, sloganY + 21);
    ctx.restore();

    // --- ROW 4: SUB-HOOK DESCRIPTION (Y = 345) ---
    const subY = sloganY + 68;
    ctx.save();
    ctx.fillStyle = 'rgba(241, 245, 249, 0.92)';
    ctx.font = '600 20px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(thumbnailSubHook || 'Enterprise Architecture • OpenAI GPT-4o • Stripe Ready', leftX, subY);
    ctx.restore();

    // --- ROW 5: VECTOR TECH BRAND BADGES (Y = 390) ---
    const badgeY = subY + 32;
    let badgeX = leftX;
    const badgesToRender = (thumbnailBadges.length > 0 ? thumbnailBadges : ['Next.js', 'React', 'OpenAI', 'Python', 'FastAPI']).slice(0, 4);

    badgesToRender.forEach((badge) => {
      ctx.save();
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      const textMetrics = ctx.measureText(badge);
      const badgeW = textMetrics.width + 48;
      const badgeH = 38;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
      ctx.fill();
      ctx.stroke();

      // Draw authentic vector logo
      drawBrandLogo(ctx, badge, badgeX + 10, badgeY + 9, 20);

      // Badge text
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(badge, badgeX + 36, badgeY + 24);
      ctx.restore();

      badgeX += badgeW + 12;
    });

    // --- ROW 6: TRUST PILLARS (Y = 490) ---
    const trustY = badgeY + 56;
    const trustItems = (thumbnailTrust.length > 0 ? thumbnailTrust : ['★ 5.0 Star Reviews', '⚡ 24H Turnaround', '100% Code Ownership']).slice(0, 3);
    const trustCardW = 166;

    trustItems.forEach((item, idx) => {
      const itemX = leftX + idx * (trustCardW + 10);
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(itemX, trustY, trustCardW, 40, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('✔', itemX + 10, trustY + 24);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 11.5px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.replace(/^[★⚡✔\s]+/, ''), itemX + 28, trustY + 24);
      ctx.restore();
    });

    // --- ROW 7: DIRECT VIDEO CONSULTATION CTA BANNER (THE ZENKODERS SIGNATURE) (Y = 560) ---
    const ctaY = trustY + 56;
    const ctaW = 518;
    const ctaH = 54;

    ctx.save();
    // Dark Emerald Gradient Banner
    const ctaGrad = ctx.createLinearGradient(leftX, ctaY, leftX + ctaW, ctaY);
    ctaGrad.addColorStop(0, '#064e3b');
    ctaGrad.addColorStop(1, '#065f46');
    ctx.fillStyle = ctaGrad;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(leftX, ctaY, ctaW, ctaH, 14);
    ctx.fill();
    ctx.stroke();

    // Pulse dot icon
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(leftX + 26, ctaY + 27, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // CTA Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('CONTACT FOR A FREE VIDEO CONSULTATION', leftX + 44, ctaY + 33);

    // Arrow icon
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('→', leftX + ctaW - 32, ctaY + 34);
    ctx.restore();

    // --- ROW 8: ENTERPRISE CHECKLIST BULLET STRIP (Y = 648) ---
    const checkY = ctaY + 84;
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('✦ Clean Architecture', leftX, checkY);
    ctx.fillText('✦ Full API Documentation', leftX + 175, checkY);
    ctx.fillText('✦ 30 Days Free Post-Launch Support', leftX + 355, checkY);
    ctx.restore();

    // =========================================================================
    // 4. FIVERR SAFE-ZONE GUIDELINES (OPTIONAL OVERLAY)
    // =========================================================================
    if (showSafeZone) {
      ctx.save();
      // Fiverr 40px outer safe margin
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Safe Zone Label
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('⚠️ FIVERR MOBILE SAFE ZONE (1280 x 769)', 50, 32);

      // Fiverr Badge Overlays Simulation (Bottom Right Favorite & Starting Price)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fillRect(width - 240, height - 100, 200, 60);
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('FIVERR PRICE TAG ZONE', width - 230, height - 65);
      ctx.fillText('(DO NOT PLACE TEXT HERE)', width - 230, height - 48);

      ctx.restore();
    }

    // Sync preview canvas in search simulator
    if (previewCanvasRef.current) {
      const pctx = previewCanvasRef.current.getContext('2d');
      if (pctx) {
        pctx.drawImage(canvas, 0, 0, width, height);
      }
    }
  };

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure redrawn cleanly without safe zone overlay for actual download
    const prevSafe = showSafeZone;
    if (prevSafe) {
      setShowSafeZone(false);
      // Synchronous redraw
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `fiverr-gig-thumbnail-1280x769.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setShowSafeZone(prevSafe);
      }, 50);
    } else {
      const link = document.createElement('a');
      link.download = `fiverr-gig-thumbnail-1280x769.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  // -------------------------------------------------------------
  // RENDER: STAGE 1 - INTERROGATION DISCOVERY
  // -------------------------------------------------------------
  if (mode === 'interrogation') {
    return (
      <div className="space-y-6 text-[#222325] max-w-4xl mx-auto">
        {/* Header Ribbon */}
        <div className="bg-white p-5 rounded-xl border border-[#dadbdd] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1dbf73]/10 flex items-center justify-center text-[#1dbf73] shrink-0 border border-[#1dbf73]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#222325]">
                  AI Gig Strategist • Discovery Interrogation
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1dbf73]/15 text-[#1dbf73] text-[11px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73] animate-pulse" />
                  Live Interrogator
                </span>
                {userContext?.profile?.name && (
                  <span className="text-[10px] text-[#19a463] font-semibold bg-[#1dbf73]/10 px-2 py-0.5 rounded">
                    @{userContext.profile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#74767e] mt-0.5">
                Targeting high-ticket enterprise buyers. Grounded in your profile skills and 2026 Fiverr algorithm rules.
              </p>
            </div>
          </div>

          {currentQuestion && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#74767e] bg-[#f7f7f7] px-3 py-1.5 rounded-lg border border-[#e4e5e7]">
              <span>Step {currentQuestion.step} of {currentQuestion.totalSteps}</span>
              <div className="w-20 bg-[#e4e5e7] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#1dbf73] h-full transition-all duration-300"
                  style={{ width: `${(currentQuestion.step / currentQuestion.totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Question & Radio Cards Card */}
        {loadingQuestion ? (
          <div className="bg-white p-16 rounded-xl border border-[#dadbdd] shadow-sm text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#1dbf73] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#404145]">Analyzing your response & fetching tailored options...</p>
          </div>
        ) : currentQuestion ? (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-[#dadbdd] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider">
                Question {currentQuestion.step} of {currentQuestion.totalSteps}
              </span>
              <h3 className="text-2xl font-black text-[#222325] mt-1 tracking-tight">
                {currentQuestion.headline}
              </h3>
              <p className="text-sm text-[#74767e] mt-1.5 leading-relaxed">
                {currentQuestion.subtext}
              </p>
            </div>

            {/* Radio Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id && !isCustomSelected;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'border-[#1dbf73] bg-[#1dbf73]/5 shadow-sm'
                        : 'border-[#e4e5e7] bg-white hover:border-[#1dbf73]/50 hover:bg-[#fafafa]'
                    }`}
                  >
                    {/* Top Row: Icon + Radio circle + Recommended pill */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#1dbf73]/15' : 'bg-[#f0f2f5]'
                          }`}
                        >
                          {renderOptionIcon(opt.iconType)}
                        </div>
                        {opt.recommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1dbf73] text-white">
                            ★ Recommended
                          </span>
                        )}
                      </div>

                      {/* Custom Radio Ring */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#1dbf73] bg-[#1dbf73]' : 'border-[#b5b6ba] bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className={`text-sm font-bold ${isSelected ? 'text-[#1dbf73]' : 'text-[#222325]'}`}>
                        {opt.title}
                      </h4>
                      <p className="text-xs text-[#62646a] mt-1 leading-relaxed">
                        {opt.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Custom Write-In Radio Card */}
              {currentQuestion.allowCustomInput && (
                <div
                  onClick={handleSelectCustom}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer md:col-span-2 ${
                    isCustomSelected
                      ? 'border-[#1dbf73] bg-[#1dbf73]/5 shadow-sm'
                      : 'border-[#e4e5e7] bg-white hover:border-[#1dbf73]/50 hover:bg-[#fafafa]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isCustomSelected ? 'bg-[#1dbf73]/15' : 'bg-[#f0f2f5]'
                        }`}
                      >
                        <Zap className="w-5 h-5 text-[#f59e0b]" />
                      </div>
                      <span className="text-sm font-bold text-[#222325]">
                        Custom / Specific Requirement
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isCustomSelected ? 'border-[#1dbf73] bg-[#1dbf73]' : 'border-[#b5b6ba] bg-white'
                      }`}
                    >
                      {isCustomSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {isCustomSelected && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        placeholder="Type your exact service, framework, or turnaround requirement here..."
                        className="w-full px-3.5 py-2 text-xs border border-[#1dbf73] rounded-lg bg-white text-[#222325] focus:outline-none"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-[#efeff0] flex items-center justify-between">
              {currentQuestion.step > 1 ? (
                <button
                  type="button"
                  onClick={() => loadInitialQuestion()}
                  className="px-4 py-2 text-xs font-bold text-[#74767e] hover:text-[#222325] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Restart Interrogation
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={loadingQuestion}
                className="fiverr-btn-green py-3 px-8 rounded-xl font-bold text-sm text-white flex items-center gap-2 cursor-pointer shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
              >
                {currentQuestion.step >= currentQuestion.totalSteps ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Launch Deep Market Research & Synthesize Gig Studio
                  </>
                ) : (
                  <>
                    Continue to Next Step
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STAGE 2 - LIVE MARKET SCANNING RADAR
  // -------------------------------------------------------------
  if (mode === 'analyzing') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-8">
        {/* Radar Animation */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#1dbf73]/15 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full border-2 border-[#1dbf73]/40 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="w-16 h-16 rounded-full bg-[#1dbf73] flex items-center justify-center text-white shadow-lg shadow-[#1dbf73]/30">
            <Search className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#222325]">
            Autonomous Market Agent in Progress
          </h2>
          <p className="text-sm text-[#74767e] mt-2">
            Inspecting live Page-1 ranking competitors on Fiverr and crafting your high-converting studio blueprint.
          </p>
        </div>

        {/* Stepped Telemetry */}
        <div className="bg-white p-6 rounded-xl border border-[#dadbdd] shadow-sm text-left space-y-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {telemetryStep >= 1 ? (
              <CheckCircle2 className="w-5 h-5 text-[#1dbf73] shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-[#e4e5e7] shrink-0" />
            )}
            <span className={`text-xs font-semibold ${telemetryStep >= 1 ? 'text-[#222325]' : 'text-[#74767e]'}`}>
              1. Grounding seller interrogation answers & micro-niche
            </span>
          </div>

          <div className="flex items-center gap-3">
            {telemetryStep >= 2 ? (
              <CheckCircle2 className="w-5 h-5 text-[#1dbf73] shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-[#1dbf73] animate-spin shrink-0" />
            )}
            <span className={`text-xs font-semibold ${telemetryStep >= 2 ? 'text-[#222325]' : 'text-[#74767e]'}`}>
              2. Inspecting live Page-1 competitors for top-ranking tags & pricing
            </span>
          </div>

          <div className="flex items-center gap-3">
            {telemetryStep >= 3 ? (
              <CheckCircle2 className="w-5 h-5 text-[#1dbf73] shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-[#e4e5e7] shrink-0" />
            )}
            <span className={`text-xs font-semibold ${telemetryStep >= 3 ? 'text-[#222325]' : 'text-[#74767e]'}`}>
              3. Reverse-engineering 1,200 character description & objection-crushing FAQs
            </span>
          </div>

          <div className="flex items-center gap-3">
            {telemetryStep >= 4 ? (
              <CheckCircle2 className="w-5 h-5 text-[#1dbf73] shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-[#e4e5e7] shrink-0" />
            )}
            <span className={`text-xs font-semibold ${telemetryStep >= 4 ? 'text-[#222325]' : 'text-[#74767e]'}`}>
              4. Architecting 1280 × 769 px thumbnail layout & trust badges
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STAGE 3 & 4 - THE 6-STEP STUDIO & THUMBNAIL ENGINE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 text-[#222325] max-w-6xl mx-auto pb-12">
      {/* Studio Header Ribbon */}
      <div className="bg-white p-5 rounded-xl border border-[#dadbdd] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider">
              {blueprint?.overview.category} &gt; {blueprint?.overview.subCategory}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#1dbf73]/15 text-[#1dbf73] text-[10px] font-bold">
              ✓ Market Verified
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#222325] mt-1 tracking-tight">
            {blueprint?.overview.title}
          </h1>
          <p className="text-xs text-[#74767e] mt-1 flex items-center gap-2">
            <span>Market Benchmark: <strong>${blueprint?.marketResearch.medianStartingPrice}</strong></span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#19a463]" />
              Algorithm Niche Score: <strong className="text-[#19a463]">{blueprint?.marketResearch.nicheOpportunityScore}%</strong>
            </span>
            <span>&bull;</span>
            <span>Competitors Analyzed: <strong>{blueprint?.marketResearch.analyzedCompetitorCount}</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={copyEntireGig}
            className="px-4 py-2 rounded-lg bg-[#1dbf73] text-white font-bold text-xs hover:bg-[#19a463] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copiedKey === 'full_blueprint' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'full_blueprint' ? 'Copied Full Gig!' : 'Copy Entire Blueprint'}
          </button>
          <button
            onClick={() => {
              setMode('interrogation');
              loadInitialQuestion();
            }}
            className="px-3.5 py-2 rounded-lg bg-[#f5f5f5] hover:bg-[#e4e5e7] text-[#404145] font-bold text-xs border border-[#dadbdd] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Interrogation
          </button>
        </div>
      </div>

      {/* Fiverr Exact 6-Step Tab Bar */}
      <div className="flex border-b border-[#dadbdd] overflow-x-auto scrollbar-none bg-white rounded-t-xl px-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#1dbf73] text-[#1dbf73]'
              : 'border-transparent text-[#74767e] hover:text-[#222325]'
          }`}
        >
          <FileText className="w-4 h-4" />
          1. Overview & Tags
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-[#1dbf73] text-[#1dbf73]'
              : 'border-transparent text-[#74767e] hover:text-[#222325]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          2. Pricing & Packages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('description')}
          className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'description'
              ? 'border-[#1dbf73] text-[#1dbf73]'
              : 'border-transparent text-[#74767e] hover:text-[#222325]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          3. Description & FAQs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'requirements'
              ? 'border-[#1dbf73] text-[#1dbf73]'
              : 'border-transparent text-[#74767e] hover:text-[#222325]'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          4. Buyer Requirements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('thumbnail')}
          className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'thumbnail'
              ? 'border-[#1dbf73] text-[#1dbf73]'
              : 'border-transparent text-[#74767e] hover:text-[#222325]'
          }`}
        >
          <Palette className="w-4 h-4 text-[#1dbf73]" />
          5. High-Converting Thumbnail Studio (1280x769)
          <span className="px-1.5 py-0.2 rounded bg-[#1dbf73] text-white text-[9px] font-black uppercase">
            SaaS Engine
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & SEARCH TAGS */}
      {/* ========================================================= */}
      {activeTab === 'overview' && blueprint && (
        <div className="bg-white p-6 rounded-b-xl border border-[#dadbdd] border-t-0 shadow-sm space-y-6 animate-in fade-in">
          {/* Where to Paste Banner */}
          <div className="bg-[#f7fdf9] p-3.5 rounded-lg border border-[#1dbf73]/30 flex items-center justify-between text-xs">
            <span className="text-[#19a463] font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Where to paste on Fiverr: <strong>Fiverr Gig Creation &gt; Step 1: Overview</strong>
            </span>
          </div>

          {/* Gig Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                Gig Title ({blueprint.overview.title.length} / 80 Chars)
              </label>
              <button
                onClick={() => copyToClipboard(blueprint.overview.title, 'title')}
                className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'title' ? 'Copied!' : 'Copy Title'}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7] text-base font-bold text-[#222325]">
              {blueprint.overview.title}
            </div>
            <p className="text-xs text-[#74767e]">
              Fiverr Rule: Must start with <code>I will</code>. Optimal length is between 45 and 65 characters to avoid mobile clipping.
            </p>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7]">
              <div className="text-[11px] font-bold text-[#74767e] uppercase">Primary Category</div>
              <div className="text-sm font-bold text-[#222325] mt-1">{blueprint.overview.category}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7]">
              <div className="text-[11px] font-bold text-[#74767e] uppercase">Sub-Category & Service Type</div>
              <div className="text-sm font-bold text-[#222325] mt-1">
                {blueprint.overview.subCategory} &bull; {blueprint.overview.serviceType}
              </div>
            </div>
          </div>

          {/* Search Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                Top 5 Positive Search Keywords (Mandatory 5 Tags)
              </label>
              <button
                onClick={() => copyToClipboard(blueprint.overview.searchTags.join(', '), 'all_tags')}
                className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'all_tags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'all_tags' ? 'Copied all 5 tags!' : 'Copy all 5 tags (comma-separated)'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {blueprint.overview.searchTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(tag, `tag_${idx}`)}
                  className="px-4 py-2 rounded-lg bg-[#f0f2f5] hover:bg-[#1dbf73]/10 hover:text-[#19a463] text-[#222325] border border-[#dadbdd] transition-all font-semibold text-xs flex items-center gap-2 cursor-pointer"
                  title="Click to copy single tag"
                >
                  <span>#{tag}</span>
                  {copiedKey === `tag_${idx}` ? (
                    <Check className="w-3 h-3 text-[#1dbf73]" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-50" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#74767e]">
              Fiverr Rule: Exactly 5 tags allowed, max 20 characters per tag, letters and numbers only.
            </p>
          </div>

          {/* Metadata */}
          {blueprint.overview.metadata && (
            <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7] space-y-2">
              <div className="text-xs font-bold text-[#404145] uppercase">Fiverr Gig Metadata Attributes</div>
              <div className="text-xs text-[#62646a] space-y-1">
                <div>
                  <strong>Programming Languages:</strong>{' '}
                  {blueprint.overview.metadata.programmingLanguages.join(', ')}
                </div>
                <div>
                  <strong>Frameworks:</strong>{' '}
                  {blueprint.overview.metadata.frameworks.join(', ')}
                </div>
                <div>
                  <strong>Platforms:</strong>{' '}
                  {blueprint.overview.metadata.deploymentPlatforms.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRICING & PACKAGES (3 TIERS) */}
      {/* ========================================================= */}
      {activeTab === 'pricing' && blueprint && (
        <div className="bg-white p-6 rounded-b-xl border border-[#dadbdd] border-t-0 shadow-sm space-y-6 animate-in fade-in">
          {/* Where to Paste Banner */}
          <div className="bg-[#f7fdf9] p-3.5 rounded-lg border border-[#1dbf73]/30 flex items-center justify-between text-xs">
            <span className="text-[#19a463] font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Where to paste on Fiverr: <strong>Fiverr Gig Creation &gt; Step 2: Scope & Pricing (Enable 3 Packages)</strong>
            </span>
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* BASIC */}
            <div className="p-5 rounded-xl border border-[#dadbdd] bg-white relative flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#74767e] uppercase tracking-wider">Basic Starter</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${blueprint.pricing.basic.title}\n${blueprint.pricing.basic.description}`,
                        'copy_basic'
                      )
                    }
                    className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'copy_basic' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Tier
                  </button>
                </div>
                <div className="text-3xl font-black text-[#222325]">${blueprint.pricing.basic.priceUsd}</div>
                <div className="text-xs font-bold text-[#1dbf73]">{blueprint.pricing.basic.title}</div>
                <p className="text-xs text-[#62646a] leading-relaxed min-h-16">
                  {blueprint.pricing.basic.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#efeff0]">
                <div className="flex items-center justify-between text-xs text-[#404145] font-semibold">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#74767e]" /> {blueprint.pricing.basic.deliveryDays} Day Delivery</span>
                  <span>{blueprint.pricing.basic.revisions} Revisions</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  {blueprint.pricing.basic.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#404145]">
                      <Check className="w-3.5 h-3.5 text-[#1dbf73]" />
                      <span>{feat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STANDARD (FEATURED) */}
            <div className="p-5 rounded-xl border-2 border-[#1dbf73] bg-[#1dbf73]/5 relative flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1dbf73] text-white text-[10px] font-black uppercase tracking-wider">
                    Most Popular / Best Seller
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${blueprint.pricing.standard.title}\n${blueprint.pricing.standard.description}`,
                        'copy_standard'
                      )
                    }
                    className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'copy_standard' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Tier
                  </button>
                </div>
                <div className="text-3xl font-black text-[#222325]">${blueprint.pricing.standard.priceUsd}</div>
                <div className="text-xs font-bold text-[#1dbf73]">{blueprint.pricing.standard.title}</div>
                <p className="text-xs text-[#404145] leading-relaxed min-h-16">
                  {blueprint.pricing.standard.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1dbf73]/20">
                <div className="flex items-center justify-between text-xs text-[#222325] font-bold">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#1dbf73]" /> {blueprint.pricing.standard.deliveryDays} Days Delivery</span>
                  <span>{blueprint.pricing.standard.revisions} Revisions</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  {blueprint.pricing.standard.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#222325] font-medium">
                      <Check className="w-3.5 h-3.5 text-[#1dbf73]" />
                      <span>{feat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="p-5 rounded-xl border border-[#dadbdd] bg-white relative flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#74767e] uppercase tracking-wider">Premium VIP</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${blueprint.pricing.premium.title}\n${blueprint.pricing.premium.description}`,
                        'copy_premium'
                      )
                    }
                    className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'copy_premium' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Tier
                  </button>
                </div>
                <div className="text-3xl font-black text-[#222325]">${blueprint.pricing.premium.priceUsd}</div>
                <div className="text-xs font-bold text-[#1dbf73]">{blueprint.pricing.premium.title}</div>
                <p className="text-xs text-[#62646a] leading-relaxed min-h-16">
                  {blueprint.pricing.premium.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#efeff0]">
                <div className="flex items-center justify-between text-xs text-[#404145] font-semibold">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#74767e]" /> {blueprint.pricing.premium.deliveryDays} Days Delivery</span>
                  <span>Unlimited Revisions</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  {blueprint.pricing.premium.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#404145]">
                      <Check className="w-3.5 h-3.5 text-[#1dbf73]" />
                      <span>{feat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DESCRIPTION & FAQS (5-PART AGENCY COPY FRAMEWORK) */}
      {/* ========================================================= */}
      {activeTab === 'description' && blueprint && (
        <div className="bg-white p-6 rounded-b-xl border border-[#dadbdd] border-t-0 shadow-sm space-y-6 animate-in fade-in">
          {/* Where to Paste Banner */}
          <div className="bg-[#f7fdf9] p-3.5 rounded-lg border border-[#1dbf73]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#19a463] font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4 shrink-0" />
              Where to paste on Fiverr: <strong>Fiverr Gig Creation &gt; Step 3: Description & FAQ</strong>
            </span>
            <span className="text-slate-500 font-medium">
              5-Part High-Converting Agency Framework
            </span>
          </div>

          {/* Tone Selector & Live Character Counter */}
          <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-[#404145] uppercase tracking-wider block mb-1">
                  Copywriting Conversion Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegenerateDescription('roi_closer')}
                    disabled={regeneratingDesc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      descriptionTone === 'roi_closer'
                        ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-sm'
                        : 'bg-white text-[#404145] border-[#dadbdd] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    🎯 ROI Closer (High Conversion)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateDescription('enterprise')}
                    disabled={regeneratingDesc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      descriptionTone === 'enterprise'
                        ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-sm'
                        : 'bg-white text-[#404145] border-[#dadbdd] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    🏢 Enterprise Architect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateDescription('rapid_mvp')}
                    disabled={regeneratingDesc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      descriptionTone === 'rapid_mvp'
                        ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-sm'
                        : 'bg-white text-[#404145] border-[#dadbdd] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    ⚡ Rapid Startup MVP
                  </button>
                </div>
              </div>

              {/* Character Count Progress Meter */}
              <div className="space-y-1.5 min-w-[220px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#404145]">Length:</span>
                  <span
                    className={`font-black ${
                      blueprint.description.fullText.length <= 1200
                        ? 'text-[#10b981]'
                        : 'text-red-500'
                    }`}
                  >
                    {blueprint.description.fullText.length} / 1,200 chars
                  </span>
                </div>
                <div className="w-full bg-[#e4e5e7] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      blueprint.description.fullText.length <= 1200 ? 'bg-[#10b981]' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (blueprint.description.fullText.length / 1200) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-[#74767e] text-right font-medium">
                  {blueprint.description.fullText.length <= 1200 ? '✓ Optimal Fiverr Length' : '⚠️ Exceeds Limit'}
                </div>
              </div>
            </div>

            {regeneratingDesc && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#1dbf73] pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Regenerating 5-part agency copy with {descriptionTone} tone...
              </div>
            )}
          </div>

          {/* 5-Part Agency Copywriting Framework Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                5-Part Agency Copy Framework Cards
              </h4>
              <button
                onClick={() => copyToClipboard(blueprint.description.fullText, 'full_desc')}
                className="fiverr-btn-green py-1.5 px-3.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedKey === 'full_desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'full_desc' ? 'Copied Full Description!' : 'Copy Full Formatted Description'}
              </button>
            </div>

            {/* Part 1: The Pattern-Interrupt Hook */}
            <div className="p-4 rounded-xl border border-[#dadbdd] bg-white space-y-2 hover:border-[#1dbf73]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold text-[#222325]">
                    🎯 The Pattern-Interrupt Hook (Above "Read More" Fold)
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(blueprint.description.hook, 'part_hook')}
                  className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'part_hook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Hook
                </button>
              </div>
              <p className="text-xs text-[#222325] bg-[#fafafa] p-3 rounded-lg border border-[#e4e5e7] leading-relaxed font-medium">
                {blueprint.description.hook}
              </p>
              <p className="text-[11px] text-[#74767e]">
                Addresses client frustration with cheap freelancers (spaghetti code, missed deadlines) before the "Read More" button.
              </p>
            </div>

            {/* Part 2: The Deliverables Matrix */}
            <div className="p-4 rounded-xl border border-[#dadbdd] bg-white space-y-2.5 hover:border-[#1dbf73]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold text-[#222325]">
                    📦 The Deliverables Matrix (What You Build)
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      blueprint.description.deliverables.map((d) => `✔ ${d}`).join('\n'),
                      'part_deliv'
                    )
                  }
                  className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'part_deliv' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Deliverables
                </button>
              </div>
              <div className="space-y-1.5 bg-[#fafafa] p-3 rounded-lg border border-[#e4e5e7]">
                {blueprint.description.deliverables.map((deliv, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#222325]">
                    <span className="text-[#10b981] font-bold">✔</span>
                    <span>{deliv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 3: The Unfair Advantage (Why Hire Me) */}
            <div className="p-4 rounded-xl border border-[#dadbdd] bg-white space-y-2.5 hover:border-[#1dbf73]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold text-[#222325]">
                    💎 The Unfair Advantage (Why Clients Choose You)
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      blueprint.description.whyHireMe.map((w) => `★ ${w}`).join('\n'),
                      'part_why'
                    )
                  }
                  className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'part_why' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Why Me
                </button>
              </div>
              <div className="space-y-1.5 bg-[#fafafa] p-3 rounded-lg border border-[#e4e5e7]">
                {blueprint.description.whyHireMe.map((why, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#222325]">
                    <span className="text-[#fbbf24] font-bold">★</span>
                    <span>{why}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 4: 4-Step Working Process */}
            <div className="p-4 rounded-xl border border-[#dadbdd] bg-white space-y-2.5 hover:border-[#1dbf73]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <span className="text-xs font-bold text-[#222325]">
                    🚀 4-Step Working Roadmap
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      (blueprint.description.process || [
                        '1. Scope & Architecture Alignment',
                        '2. Rapid Prototyping & Core Build',
                        '3. Rigorous QA & Verification',
                        '4. Full Handover & Video Walkthrough',
                      ]).join('\n'),
                      'part_proc'
                    )
                  }
                  className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'part_proc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Process
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#fafafa] p-3 rounded-lg border border-[#e4e5e7]">
                {(blueprint.description.process || [
                  '1. Scope & Architecture Alignment',
                  '2. Rapid Prototyping & Core Build',
                  '3. Rigorous QA & Verification',
                  '4. Full Handover & Video Walkthrough',
                ]).map((step, idx) => (
                  <div key={idx} className="text-xs text-[#222325] font-medium p-2 rounded bg-white border border-[#dadbdd]">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Part 5: Call to Action (CTA) */}
            <div className="p-4 rounded-xl border border-[#dadbdd] bg-white space-y-2 hover:border-[#1dbf73]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] font-bold text-xs flex items-center justify-center">
                    5
                  </span>
                  <span className="text-xs font-bold text-[#222325]">
                    🤝 High-Converting Call to Action (CTA)
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(blueprint.description.callToAction, 'part_cta')}
                  className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'part_cta' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy CTA
                </button>
              </div>
              <p className="text-xs text-[#222325] bg-[#fafafa] p-3 rounded-lg border border-[#e4e5e7] font-semibold">
                {blueprint.description.callToAction}
              </p>
            </div>
          </div>

          {/* Full Markdown Raw View for Fast Paste */}
          <div className="space-y-2 pt-2 border-t border-[#efeff0]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                Full Formatted Markdown Text (1-Click Paste into Fiverr)
              </label>
              <button
                onClick={() => copyToClipboard(blueprint.description.fullText, 'full_markdown')}
                className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'full_markdown' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'full_markdown' ? 'Copied Full Text!' : 'Copy Full Description'}
              </button>
            </div>
            <pre className="bg-[#fafafa] p-5 rounded-xl text-xs text-[#404145] whitespace-pre-wrap font-sans max-h-72 overflow-y-auto border border-[#e4e5e7] leading-relaxed shadow-inner">
              {blueprint.description.fullText}
            </pre>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-3 pt-2 border-t border-[#efeff0]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                Objection-Crushing FAQs ({blueprint.faqs.length} Questions)
              </label>
              <button
                onClick={() =>
                  copyToClipboard(
                    blueprint.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'),
                    'all_faqs'
                  )
                }
                className="text-xs text-[#1dbf73] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'all_faqs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'all_faqs' ? 'Copied all FAQs!' : 'Copy all FAQs'}
              </button>
            </div>

            <div className="space-y-2.5">
              {blueprint.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#222325]">
                      Q: {faq.question}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`, `faq_${idx}`)}
                      className="text-xs text-[#74767e] hover:text-[#1dbf73] cursor-pointer"
                      title="Copy this FAQ"
                    >
                      {copiedKey === `faq_${idx}` ? <Check className="w-3.5 h-3.5 text-[#1dbf73]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#62646a] leading-relaxed">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BUYER REQUIREMENTS */}
      {/* ========================================================= */}
      {activeTab === 'requirements' && blueprint && (
        <div className="bg-white p-6 rounded-b-xl border border-[#dadbdd] border-t-0 shadow-sm space-y-6 animate-in fade-in">
          {/* Where to Paste Banner */}
          <div className="bg-[#f7fdf9] p-3.5 rounded-lg border border-[#1dbf73]/30 flex items-center justify-between text-xs">
            <span className="text-[#19a463] font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Where to paste on Fiverr: <strong>Fiverr Gig Creation &gt; Step 4: Requirements</strong>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#222325]">
                Order Initiation Questions
              </h3>
              <p className="text-xs text-[#74767e] mt-1">
                Fiverr displays these questions to the buyer immediately after they place an order. The countdown timer does not start until the buyer answers these questions.
              </p>
            </div>

            <div className="space-y-3">
              {blueprint.buyerRequirements.map((req, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e5e7] flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#1dbf73]">#{idx + 1}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          req.mandatory ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {req.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className="text-[10px] text-[#74767e]">
                        Type: {req.type === 'free_text' ? 'Free Text Answer' : 'File Attachment'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#222325] pt-1">
                      {req.question}
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(req.question, `req_${idx}`)}
                    className="p-2 rounded-lg bg-white border border-[#dadbdd] hover:border-[#1dbf73] text-[#404145] hover:text-[#1dbf73] cursor-pointer"
                    title="Copy Question"
                  >
                    {copiedKey === `req_${idx}` ? <Check className="w-4 h-4 text-[#1dbf73]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: 1280 × 769 HIGH-CONVERTING THUMBNAIL STUDIO & SIMULATOR */}
      {/* ========================================================= */}
      {activeTab === 'thumbnail' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Guidelines Banner */}
          <div className="bg-[#0b0f19] text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#1dbf73]" />
                <h3 className="text-base font-bold">Fiverr 2026 High-Converting Thumbnail Engine</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1dbf73]/20 text-[#1dbf73] text-[10px] font-bold">
                  1280 × 769 px (16:9 Standard)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Engineered for maximum CTR (Click-Through Rate). Large punchy typography (max 5 words), verified tech stack badges, and 3 trust guarantee pills.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <button
                type="button"
                onClick={() => setShowSafeZone(!showSafeZone)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showSafeZone
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {showSafeZone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSafeZone ? 'Hide Safe Zone' : 'Show Safe Zone Overlay'}
              </button>

              <button
                type="button"
                onClick={handleDownloadThumbnail}
                className="fiverr-btn-green py-2 px-5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-105"
              >
                <Download className="w-4 h-4" />
                Download 1280x769 PNG
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Interactive Controls */}
            <div className="bg-white p-5 rounded-xl border border-[#dadbdd] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#404145] uppercase tracking-wider">
                  Thumbnail Controls & Styling
                </h4>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Flux 3D + 20K Agent
                </span>
              </div>

              {/* Dedicated Autonomous Gig Visual Design Agent Command Station */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      Gig Visual Design Agent
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Active • 20,211 Words KB
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  Autonomous design agent programmed with 45 visual neuroscience directives, 0.3s retinal thumb-stop eye tracking, and 1280×769 photorealistic 3D rendering.
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={loadAgentKnowledge}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Inspect 20,211-Word Directives
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">Zero CORS Canvas</span>
                </div>
              </div>

              {/* 1-Click Flagship Agent Generation Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleGenerateWithImageAgent(selectedConceptId)}
                  disabled={imageAgentRunning}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1dbf73] via-emerald-500 to-teal-500 hover:brightness-110 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  {imageAgentRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Compiling Prompt & Rendering 3D Visual (~4s)...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-white" />
                      <span>✨ Auto-Generate 10/10 Flagship Gig Image</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Synthesizes high-converting visual based on your gig title, domain & tech stack
                </p>
              </div>

              {/* A/B Tested Visual Concepts Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#404145] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#1dbf73]" />
                    A/B Tested Visual Concepts
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Click to generate</span>
                </div>

                <div className="space-y-1.5">
                  {agentConcepts.map((concept, idx) => {
                    const isSelected = selectedConceptId === concept.id;
                    return (
                      <button
                        key={concept.id || idx}
                        type="button"
                        onClick={() => handleSelectConcept(concept)}
                        disabled={imageAgentRunning}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-slate-900 ring-1 ring-[#1dbf73]'
                            : 'border-[#e4e5e7] bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{concept.name}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-[#1dbf73] text-white text-[9px] font-extrabold uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{concept.heroSubject}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 pt-0.5">#{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Composition Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-[#404145] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-[#1dbf73]" />
                  Composition Display Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('studio_split')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                      displayMode === 'studio_split'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    <span className="block font-bold">48/52 Studio Split</span>
                    <span className="text-[10px] text-slate-500 font-normal">Copy + Badges + 3D Art</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('full_bleed')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                      displayMode === 'full_bleed'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    <span className="block font-bold">100% Full-Bleed</span>
                    <span className="text-[10px] text-slate-500 font-normal">Cinematic Full-Frame 3D</span>
                  </button>
                </div>
              </div>

              {/* Custom 3D Prompt Override Panel */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Fine-Tune 3D Prompt
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold">1280 × 769 Res</span>
                </div>
                <textarea
                  rows={2}
                  value={artworkPrompt}
                  onChange={(e) => setArtworkPrompt(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-400 text-slate-800 font-mono text-[11px]"
                  placeholder="Enter custom prompt override for agent..."
                />
                <button
                  type="button"
                  onClick={() => handleGenerateWithImageAgent(selectedConceptId, artworkPrompt)}
                  disabled={imageAgentRunning}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  {imageAgentRunning ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Re-Render with Custom Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#62646a] mb-2">
                  Visual Aesthetic Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setThumbnailTheme('dark_glassmorphic')}
                    className={`p-2.5 rounded-lg text-xs font-bold text-left border transition-all cursor-pointer ${
                      thumbnailTheme === 'dark_glassmorphic'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    Dark Glassmorphic
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailTheme('emerald_pro')}
                    className={`p-2.5 rounded-lg text-xs font-bold text-left border transition-all cursor-pointer ${
                      thumbnailTheme === 'emerald_pro'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    Emerald Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailTheme('cyber_slate')}
                    className={`p-2.5 rounded-lg text-xs font-bold text-left border transition-all cursor-pointer ${
                      thumbnailTheme === 'cyber_slate'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    Cyber Slate
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailTheme('midnight_amber')}
                    className={`p-2.5 rounded-lg text-xs font-bold text-left border transition-all cursor-pointer ${
                      thumbnailTheme === 'midnight_amber'
                        ? 'border-[#1dbf73] bg-[#1dbf73]/10 text-[#19a463]'
                        : 'border-[#dadbdd] bg-white text-[#404145] hover:bg-[#fafafa]'
                    }`}
                  >
                    Midnight Amber
                  </button>
                </div>
              </div>

              {/* Headline Text Input */}
              <div>
                <label className="block text-xs font-semibold text-[#62646a] mb-1.5">
                  Main Headline (Max 5 Words for High CTR)
                </label>
                <input
                  type="text"
                  value={thumbnailHeadline}
                  onChange={(e) => setThumbnailHeadline(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] font-bold focus:border-[#1dbf73] focus:outline-none"
                  placeholder="CUSTOM AI AGENTS & WEB APPS"
                />
              </div>

              {/* Sub-hook Text Input */}
              <div>
                <label className="block text-xs font-semibold text-[#62646a] mb-1.5">
                  Sub-Hook Headline
                </label>
                <input
                  type="text"
                  value={thumbnailSubHook}
                  onChange={(e) => setThumbnailSubHook(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                  placeholder="Enterprise Architecture • 24H Turnaround"
                />
              </div>

              {/* Tech Badges Editor */}
              <div>
                <label className="block text-xs font-semibold text-[#62646a] mb-1.5">
                  Tech Badges (Auto-renders vector brand logos)
                </label>
                <input
                  type="text"
                  value={thumbnailBadges.join(', ')}
                  onChange={(e) =>
                    setThumbnailBadges(
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3.5 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                  placeholder="Next.js, Python, OpenAI, FastAPI"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Supported logos: React, Next.js, OpenAI, Python, TypeScript, Tailwind, Flutter.
                </p>
              </div>

              {/* Trust Badges Editor */}
              <div>
                <label className="block text-xs font-semibold text-[#62646a] mb-1.5">
                  3 Trust Guarantee Badges
                </label>
                <input
                  type="text"
                  value={thumbnailTrust.join(', ')}
                  onChange={(e) =>
                    setThumbnailTrust(
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3.5 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                  placeholder="⚡ 24H Turnaround, 100% Code Ownership, Loom Video Demo"
                />
              </div>
            </div>

            {/* Right Column: High-Res Canvas & Fiverr Live Marketplace Simulator */}
            <div className="lg:col-span-2 space-y-6">
              {/* Canvas Preview Container */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-2">
                  <span className="font-mono">Output: 1280 × 769 px &bull; 16:9 Standard</span>
                  <span className="text-[#10b981] font-semibold">Ready for Upload</span>
                </div>
                <div className="w-full aspect-[1280/769] rounded-lg overflow-hidden border border-slate-800 relative bg-black">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain block"
                  />
                </div>
              </div>

              {/* Fiverr Search Card Live Simulator */}
              <div className="bg-white p-5 rounded-xl border border-[#dadbdd] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#efeff0] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#1dbf73]" />
                    <h4 className="text-xs font-bold text-[#222325] uppercase tracking-wider">
                      Fiverr Marketplace Search Simulator
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#74767e]">
                    Live simulation: How clients see your gig in search results
                  </span>
                </div>

                {/* Fiverr Authentic Search Result Card Replica */}
                <div className="max-w-xs mx-auto md:mx-0 bg-white rounded-lg border border-[#e4e5e7] hover:shadow-md transition-shadow overflow-hidden group">
                  {/* Card Thumbnail */}
                  <div className="aspect-[16/9] w-full bg-slate-900 relative overflow-hidden">
                    <canvas
                      ref={previewCanvasRef}
                      width={1280}
                      height={769}
                      className="w-full h-full object-cover"
                    />
                    <button className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 space-y-2">
                    {/* Seller Bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1dbf73] text-white text-[10px] font-bold flex items-center justify-center">
                        {(user?.username || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-bold text-[#222325] hover:underline cursor-pointer">
                          {user?.username || 'senior_dev'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#74767e]">&bull; Level 2</span>
                      </div>
                    </div>

                    {/* Gig Title */}
                    <h5 className="text-xs font-medium text-[#404145] line-clamp-2 leading-snug group-hover:text-[#1dbf73] transition-colors">
                      {blueprint?.overview.title || 'I will build custom production AI agents and modern web apps'}
                    </h5>

                    {/* Rating & Price Row */}
                    <div className="pt-2 border-t border-[#efeff0] flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#222325]">
                        <Star className="w-3.5 h-3.5 fill-[#ffbe5b] text-[#ffbe5b]" />
                        <span>5.0</span>
                        <span className="text-[#74767e] font-normal">(28)</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#74767e] uppercase block">Starting at</span>
                        <span className="text-sm font-black text-[#222325]">
                          ${blueprint?.pricing.basic.priceUsd || 75}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 20,211-WORD AGENT KNOWLEDGE BASE INSPECTOR MODAL */}
      {/* ========================================================= */}
      {showKnowledgeModal && agentKnowledge && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gig Visual Design Agent Knowledge Base</h3>
                  <p className="text-xs text-slate-400">Autonomous Directives & Retinal Thumb-Stop Optics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Word Count</span>
                <span className="text-xl font-black text-emerald-400">{agentKnowledge.wordCount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Character Count</span>
                <span className="text-xl font-black text-teal-400">{agentKnowledge.charCount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Master Chapters</span>
                <span className="text-xl font-black text-purple-400">{agentKnowledge.totalChapters}</span>
              </div>
            </div>

            {/* Directives Excerpt Viewer */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap select-text">
              {agentKnowledge.directivesExcerpt}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Registered with Logger Telemetry as AGENT_IMAGE_GENERATOR</span>
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(false)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
