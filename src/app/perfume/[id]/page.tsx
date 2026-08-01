"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Clock, 
  Calendar, 
  Award,
  ChevronRight
} from "lucide-react";
import type { Perfume } from "@/data/perfumes";
import { useScentSphere } from "@/components/ScentSphereContext";
import { Lock, Unlock, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { translateRaw, translateComment } from "@/data/translations";
import { getLocalizedField } from "@/lib/i18n";
import { localizeSillage, localizeLongevity, localizeOccasion, localizeSeason, localizeNote } from "@/lib/localize";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PerfumePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const perfumeId = resolvedParams.id;
  
  const {
    currentUser,
    perfumes: contextPerfumes,
    reviewsReplies,
    submittedReviews,
    wardrobeIds,
    favoriteIds,
    toggleWardrobe,
    toggleFavorite,
    addPerfumeToList,
    removePerfumeFromList,
    addReplyToReview,
    addReview,
    submitHomeReview,
    reloadHomeReviews,
    language,
    toggleLanguage,
    t,
    dict
  } = useScentSphere();

  // ── Database-sourced perfume data ──────────────────────────────────────
  // The page is a Client Component, so we fetch from the Route Handler
  // GET /api/perfume/:id which queries MySQL via the Prisma 7 singleton.
  const [dbPerfume, setDbPerfume] = useState<Perfume | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    setDbLoading(true);
    fetch(`/api/perfume/${perfumeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setDbPerfume(data ?? null);
        setDbLoading(false);
      })
      .catch(() => setDbLoading(false));
  }, [perfumeId]);

  const contextPerfume = contextPerfumes.find((p) => p.id === perfumeId);
  const rawPerfume = (dbPerfume || contextPerfume) as unknown as Perfume | undefined;
  const raw = (dbPerfume || contextPerfume) as any;

  const perfume = raw ? {
    id:               raw.id,
    name:             raw.name,
    brand:            raw.brand,
    concentration:    raw.concentration,
    gender:           raw.gender,
    olfactoryProfile: {
      Floral: raw.olfactoryProfile?.Floral ?? raw.olfactoryProfile?.floral ?? 0,
      Woody:  raw.olfactoryProfile?.Woody  ?? raw.olfactoryProfile?.woody  ?? 0,
      Spicy:  raw.olfactoryProfile?.Spicy  ?? raw.olfactoryProfile?.spicy  ?? 0,
      Fresh:  raw.olfactoryProfile?.Fresh  ?? raw.olfactoryProfile?.fresh  ?? 0,
      Sweet:  raw.olfactoryProfile?.Sweet  ?? raw.olfactoryProfile?.sweet  ?? 0,
    },
    notes: {
      // Language-aware top-level arrays used by most of the existing UI
      top:     (language === "en" ? (raw.notes?.top_en  ?? raw.notes?.top  ?? []) : (raw.notes?.top_tr  ?? raw.notes?.bas  ?? raw.notes?.top ?? [])) as string[],
      mid:     (language === "en" ? (raw.notes?.mid_en  ?? raw.notes?.mid  ?? []) : (raw.notes?.mid_tr  ?? raw.notes?.kalp ?? raw.notes?.mid ?? [])) as string[],
      base:    (language === "en" ? (raw.notes?.base_en ?? raw.notes?.base ?? []) : (raw.notes?.base_tr ?? raw.notes?.dip  ?? raw.notes?.base ?? [])) as string[],
      // Explicit bilingual variants passed through for language-switched renders
      top_tr:  (raw.notes?.top_tr  ?? raw.notes?.bas  ?? raw.notes?.top  ?? []) as string[],
      top_en:  (raw.notes?.top_en  ?? raw.notes?.top  ?? []) as string[],
      mid_tr:  (raw.notes?.mid_tr  ?? raw.notes?.kalp ?? raw.notes?.mid  ?? []) as string[],
      mid_en:  (raw.notes?.mid_en  ?? raw.notes?.mid  ?? []) as string[],
      base_tr: (raw.notes?.base_tr ?? raw.notes?.dip  ?? raw.notes?.base ?? []) as string[],
      base_en: (raw.notes?.base_en ?? raw.notes?.base ?? []) as string[],
    },
    seasons:        (Array.isArray(raw.seasons) ? raw.seasons : typeof raw.seasons === "string" ? raw.seasons.split(",").map((s: string) => s.trim()) : []) as string[],
    occasions:      (Array.isArray(raw.occasions) ? raw.occasions : typeof raw.occasions === "string" ? raw.occasions.split(",").map((o: string) => o.trim()) : []) as string[],
    description:    (language === "en" ? (raw.description_en || raw.mainDescriptionEn || raw.description || "") : (raw.description_tr || raw.mainDescriptionTr || raw.description || "")) as string,
    description_tr: (raw.description_tr ?? raw.mainDescriptionTr ?? raw.description ?? "") as string,
    description_en: (raw.description_en ?? raw.mainDescriptionEn ?? raw.description ?? "") as string,
    reviews:        (raw.reviews ?? []) as any[],
    rating:         (raw.rating    ?? 5.0)            as number,
    yearReleased:   (raw.yearReleased ?? 2026)         as number,
    sillage:        (raw.sillage   ?? "MODERATE")     as string,
    longevity:      (raw.longevity ?? "LONG-LASTING")  as string,
  } : undefined;

  const allReviews = perfume ? [
    ...(perfume.reviews || []),
    ...submittedReviews.filter((r) => r.perfumeId === perfume.id)
  ] : [];

  const [mounted, setMounted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Threaded replies local state
  const [activeReplyBox, setActiveReplyBox] = useState<{ type: "review" | "reply"; id: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawProfile = (dbPerfume as any)?.olfactoryProfile ?? (contextPerfume as any)?.olfactoryProfile;
  const safeProfile = {
    Floral: rawProfile?.Floral ?? rawProfile?.floral ?? 0,
    Woody:  rawProfile?.Woody  ?? rawProfile?.woody  ?? 0,
    Spicy:  rawProfile?.Spicy  ?? rawProfile?.spicy  ?? 0,
    Fresh:  rawProfile?.Fresh  ?? rawProfile?.fresh  ?? 0,
    Sweet:  rawProfile?.Sweet  ?? rawProfile?.sweet  ?? 0,
  };
  const safeMax = Math.max(
    safeProfile.Floral, safeProfile.Woody, safeProfile.Spicy,
    safeProfile.Fresh,  safeProfile.Sweet, 1
  );
  const safeRadarData = [
    { subject: "Floral", value: (safeProfile.Floral / safeMax) * 100 },
    { subject: "Woody",  value: (safeProfile.Woody  / safeMax) * 100 },
    { subject: "Spicy",  value: (safeProfile.Spicy  / safeMax) * 100 },
    { subject: "Fresh",  value: (safeProfile.Fresh  / safeMax) * 100 },
    { subject: "Sweet",  value: (safeProfile.Sweet  / safeMax) * 100 },
  ];

  const [animatedRadarData, setAnimatedRadarData] = useState(() =>
    safeRadarData.map((d) => ({ ...d, value: 0 }))
  );

  useEffect(() => {
    // Re-run whenever: the component mounts, the route changes, OR the async
    // DB fetch completes (dbPerfume goes from null → real data).
    // Without `dbPerfume` in the deps the chart stayed frozen at all-zeros
    // because safeRadarData was computed correctly on each render but the
    // effect that pushes it into state never re-fired after the fetch.
    if (mounted && !dbLoading) {
      setAnimatedRadarData(safeRadarData.map((d) => ({ ...d, value: 0 })));
      const timer = setTimeout(() => {
        setAnimatedRadarData(safeRadarData);
      }, 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, perfumeId, dbPerfume]);

  // ── All hooks declared. Early-return guards follow. ───────────────────────

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f5f0e6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border border-[#c5a880]/30 border-t-[#c5a880] rounded-full animate-spin mx-auto" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880]/60">{dict.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!perfume) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f5f0e6] flex flex-col items-center justify-center p-6 selection:bg-[#c5a880] selection:text-black">
        <div className="glass-premium p-12 text-center max-w-md rounded-sm">
          <h1 className="font-serif text-3xl tracking-widest uppercase mb-4 text-[#c5a880]">{dict.perfumePage.notFound}</h1>
          <p className="text-xs text-[#f5f0e6]/50 tracking-wider mb-8 leading-relaxed">
            {dict.perfumePage.notFoundDesc}
          </p>
          <Link 
            href="/"
            className="px-6 py-3 bg-[#c5a880] hover:bg-[#e5cda8] text-black text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors duration-300 block"
          >
            {dict.perfumePage.returnToLibrary}
          </Link>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newUserName.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Persist to MySQL via the API — works for authenticated and guest users.
      await submitHomeReview(perfume.id, newRating, newComment.trim(), newUserName.trim());
      // 2. Refresh the homepage Scent Dialogue feed instantly.
      await reloadHomeReviews();
      // 3. Also update local context so the review shows on this page without a refresh.
      addReview(perfume.id, newRating, newComment.trim(), newUserName.trim());
      setSubmitted(true);
      setNewComment("");
      setNewUserName("");
    } catch (err) {
      console.error("[ReviewSubmit] DB persist failed, falling back to local:", err);
      // Graceful degradation: add to local context state so the user still
      // sees their review appear on this page even if the API is unreachable.
      addReview(perfume.id, newRating, newComment.trim(), newUserName.trim());
      setSubmitted(true);
      setNewComment("");
      setNewUserName("");
    } finally {
      setSubmitting(false);
    }
  };

  // radarData and normalizedProfile for the render section below.
  // (animatedRadarData state is already hoisted above — see safeRadarData block)
  const profileValues = Object.values(perfume.olfactoryProfile) as number[];
  const maxVal = Math.max(...profileValues, 1);

  const normalizedProfile = {
    Floral: ((perfume.olfactoryProfile.Floral || 0) / maxVal) * 100,
    Woody:  ((perfume.olfactoryProfile.Woody  || 0) / maxVal) * 100,
    Spicy:  ((perfume.olfactoryProfile.Spicy  || 0) / maxVal) * 100,
    Fresh:  ((perfume.olfactoryProfile.Fresh  || 0) / maxVal) * 100,
    Sweet:  ((perfume.olfactoryProfile.Sweet  || 0) / maxVal) * 100,
  };

  const radarData = [
    { subject: "Floral", value: normalizedProfile.Floral },
    { subject: "Woody",  value: normalizedProfile.Woody  },
    { subject: "Spicy",  value: normalizedProfile.Spicy  },
    { subject: "Fresh",  value: normalizedProfile.Fresh  },
    { subject: "Sweet",  value: normalizedProfile.Sweet  },
  ];

  void radarData; // consumed via animatedRadarData (state already updated above)

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" }
    }
  };

  interface ThreadedReplyNode {
    reply: import("@/components/ScentSphereContext").ReviewReply;
    children: ThreadedReplyNode[];
    level: number;
  }

  const buildReplyTree = (replies: import("@/components/ScentSphereContext").ReviewReply[]): ThreadedReplyNode[] => {
    const replyMap: { [id: string]: ThreadedReplyNode } = {};
    
    // Initialize nodes
    replies.forEach(r => {
      replyMap[r.id] = { reply: r, children: [], level: 1 };
    });

    const roots: ThreadedReplyNode[] = [];

    replies.forEach(r => {
      const node = replyMap[r.id];
      if (r.parentId && replyMap[r.parentId]) {
        replyMap[r.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    const setLevels = (nodes: ThreadedReplyNode[], level: number) => {
      nodes.forEach(n => {
        n.level = level;
        setLevels(n.children, level + 1);
      });
    };
    setLevels(roots, 1);

    return roots;
  };

  const handleSendReply = (reviewId: string, parentId?: string) => {
    if (!replyText.trim()) return;
    addReplyToReview(perfume.id, reviewId, parentId, replyText.trim(), currentUser.username);
    setReplyText("");
    setActiveReplyBox(null);
  };

  const renderReplyNode = (node: ThreadedReplyNode, reviewId: string) => {
    const isReplying = activeReplyBox?.type === "reply" && activeReplyBox.id === node.reply.id;
    // Cap visual nesting/indentation at a maximum of 3 levels deep
    const visualLevel = Math.min(node.level, 3);
    // Indent only up to level 3. Level 4 and deeper render with 0 additional indentation.
    const mlClass = visualLevel === 1 ? "ml-3 md:ml-5" : visualLevel === 2 ? "ml-3 md:ml-5" : "ml-0";
    
    return (
      <div key={node.reply.id} className={`mt-3 pl-3 border-l border-[#c5a880]/15 ${mlClass}`}>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-[#c5a880]">@{node.reply.user}</span>
            <span className="text-[8px] text-[#f5f0e6]/35">{node.reply.date}</span>
          </div>
          
          <button
            onClick={() => setActiveReplyBox({ type: "reply", id: node.reply.id })}
            className="text-[8px] tracking-wider uppercase text-[#c5a880]/60 hover:text-white cursor-pointer"
          >
            {dict.perfumePage.replyToReview}
          </button>
        </div>
        <p className="text-xs text-[#f5f0e6]/75 font-light leading-relaxed pl-0.5">
          {translateComment(node.reply.comment, language === "tr")}
        </p>

        {/* Inline reply input */}
        {isReplying && (
          <div className="mt-2 pl-3 border-l border-dashed border-[#c5a880]/20 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`${dict.perfumePage.replyPlaceholder.replace('...', '')} @${node.reply.user}...`}
              className="flex-1 bg-black/40 border border-[#c5a880]/20 rounded-sm py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-[#c5a880]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendReply(reviewId, node.reply.id);
                }
              }}
            />
            <button
              onClick={() => handleSendReply(reviewId, node.reply.id)}
              className="bg-[#c5a880] text-black text-[9px] font-bold uppercase px-3 rounded-sm hover:bg-[#e5cda8] transition-colors cursor-pointer"
            >
              {dict.perfumePage.send}
            </button>
            <button
              onClick={() => setActiveReplyBox(null)}
              className="text-[#f5f0e6]/40 hover:text-white text-xs px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Child replies */}
        {node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map(child => renderReplyNode(child, reviewId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#c5a880]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-xs tracking-[0.2em] uppercase font-light text-[#f5f0e6]/70 hover:text-[#c5a880] transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {dict.perfumePage.returnToLibrary}
          </Link>

          <Link href="/" className="font-serif text-2xl tracking-[0.2em] gold-gradient-text uppercase font-bold">
            {dict.hero.title}
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-[10px] tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer bg-transparent border-0 uppercase font-semibold select-none"
              title={language === "en" ? "Dil değiştir: Türkçe" : "Switch language: English"}
            >
              {language === "en" ? "EN" : "TR"}
            </button>
            <Link href="/consultant" className="text-xs tracking-[0.2em] uppercase font-light text-[#c5a880] hover:text-[#e5cda8] border border-[#c5a880]/30 px-3 py-1 rounded-sm transition-colors duration-300">
              {dict.nav.consultant}
            </Link>
            <Link href="/profile" className="p-2 border border-[#c5a880]/20 rounded-full hover:border-[#c5a880]/60 transition-colors duration-300 flex items-center gap-1.5" title="View Profile">
              <UserIcon className="w-4 h-4 text-[#c5a880]" />
              <span className="text-[9px] tracking-wider uppercase font-semibold text-[#c5a880] hidden lg:inline">@{currentUser.username}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Cinematic Content Hub: Split Screen Layout */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 flex flex-col lg:flex-row gap-12 min-h-[calc(100vh-80px)]">
        <aside className="w-full lg:w-2/5 lg:sticky lg:top-20 lg:h-[calc(100vh-120px)] p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#c5a880]/10 bg-black/5">
          <div>
            <div className="relative p-6 rounded-sm overflow-hidden mb-6 border border-white/[0.04] bg-white/[0.01] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <div className="absolute inset-0 z-0 opacity-80" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }} />
            
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[#c5a880] uppercase mb-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>{dict.perfumePage.masterwork}</span>
                </div>

                <h1 className="font-serif text-3xl md:text-4xl tracking-wider mb-2 font-bold">
                  {perfume.name}
                </h1>
                
                <p className="text-sm text-[#c5a880]/80 tracking-widest uppercase mb-4">
                  by {perfume.brand}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-sm uppercase text-[#f5f0e6]/60">
                    {perfume.concentration}
                  </span>
                  <span className="text-[10px] tracking-widest bg-[#c5a880]/10 px-3 py-1 rounded-sm text-[#c5a880] uppercase font-medium">
                    {perfume.gender}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Shelf & Curation Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-8 text-[9px] tracking-wider uppercase font-semibold">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (perfume?.id) {
                    toggleWardrobe(perfume.id);
                  }
                }}
                className={`relative z-30 pointer-events-auto px-5 py-3 border tracking-widest text-[10px] uppercase font-light transition-all duration-300 ${
                  wardrobeIds.includes(perfume.id)
                    ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                    : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent"
                }`}
              >
                {wardrobeIds.includes(perfume.id) ? `✓ ${dict.addedToWardrobe}` : `+ ${dict.addToWardrobe}`}
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (perfume?.id) {
                    toggleFavorite(perfume.id);
                  }
                }}
                className={`relative z-30 pointer-events-auto px-5 py-3 border tracking-widest text-[10px] uppercase font-light transition-all duration-300 ${
                  favoriteIds.includes(perfume.id)
                    ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                    : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent"
                }`}
              >
                {favoriteIds.includes(perfume.id) ? `★ ${dict.addedToFavorites}` : `+ ${dict.addToFavorites}`}
              </button>

              {/* Custom list quick selectors */}
              {currentUser.customLists.length > 0 && (
                <div className="w-full mt-2">
                  <span className="text-[8px] tracking-widest text-[#f5f0e6]/45 uppercase block mb-1">{dict.perfumePage.addToCurations}</span>
                  <div className="flex flex-wrap gap-1">
                    {currentUser.customLists.map(list => {
                      const hasPerfume = list.perfumeIds.includes(perfume.id);
                      return (
                        <button
                          key={list.id}
                          onClick={() => {
                            hasPerfume 
                              ? removePerfumeFromList(list.id, perfume.id) 
                              : addPerfumeToList(list.id, perfume.id);
                          }}
                          className={`px-2 py-0.5 border rounded-sm text-[8px] tracking-wider transition-all cursor-pointer ${
                            hasPerfume
                              ? "bg-[#c5a880]/15 border-[#c5a880] text-[#c5a880] font-semibold"
                              : "border-white/5 bg-white/5 text-[#f5f0e6]/50 hover:border-white/20"
                          }`}
                        >
                          {list.name} {hasPerfume && "✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Olfactory Profile Radar Chart */}
            <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-6 rounded-sm relative overflow-hidden mb-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <div className="absolute inset-0 z-0 opacity-80" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }} />
              
              <div className="relative z-10">
                <span className="text-[9px] tracking-[0.25em] uppercase text-[#c5a880] block mb-4">
                  {dict.perfumePage.scentFingerprint}
                </span>

                {mounted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-[240px] flex items-center justify-center"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={animatedRadarData}>
                        <defs>
                          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.05} />
                          </radialGradient>
                        </defs>
                        <PolarGrid stroke="rgba(212, 175, 55, 0.15)" strokeWidth={1} />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: "rgba(212, 175, 55, 0.7)", fontSize: 9, letterSpacing: "0.1em" }} 
                          tickFormatter={(value) => {
                            const key = value.toLowerCase() as keyof typeof dict.metrics;
                            return dict.metrics[key] || value;
                          }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={{ fill: "rgba(212, 175, 55, 0.35)", fontSize: 8 }}
                          axisLine={{ stroke: "rgba(212, 175, 55, 0.15)" }}
                        />
                        <Radar
                          name={perfume.name}
                          dataKey="value"
                          stroke="#F4D068"
                          strokeWidth={1.5}
                          fill="url(#goldGlow)"
                          fillOpacity={1}
                          isAnimationActive={true}
                          animationEasing="ease-out"
                          animationDuration={1200}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-xs text-[#f5f0e6]/20 tracking-wider">
                    {dict.perfumePage.decodingProfile}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center bg-black/40 border border-[#c5a880]/10 p-4 rounded-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#c5a880] fill-[#c5a880]" />
              <span className="text-sm font-semibold">{perfume.rating} / 5</span>
              <span className="text-[10px] text-[#f5f0e6]/40 font-light">({allReviews.length} {dict.perfumePage.reviews})</span>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Formula Details, Notes, and Community Discussion */}
        <main className="w-full lg:w-3/5 p-6 lg:p-8 py-12 space-y-16">
          {/* Scent Narrative */}
          <section className="space-y-4">
            <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold">
              {dict.perfumePage.olfactoryNarrative}
            </h3>
            <p className="text-sm md:text-base text-[#f5f0e6]/80 leading-relaxed font-light tracking-wide first-letter:text-3xl first-letter:font-serif first-letter:text-[#c5a880] first-letter:mr-2 first-letter:float-left mb-6">
              {getLocalizedField(raw, 'description', language) || getLocalizedField(raw, 'mainDescription', language) || ""}
            </p>

            {/* Olfactory Blueprint Horizontal Diagnostics Bar */}
            <div className="flex flex-wrap items-center gap-6 py-4 border-b border-white/[0.05] text-[11px] tracking-wider uppercase">
              {/* Performance Section */}
              <div className="flex items-center gap-3 pr-6 border-r border-white/[0.05] shrink-0">
                <span className="border border-white/[0.06] bg-white/[0.02] text-white/70 px-3 py-1 rounded-full whitespace-nowrap">
                  {dict.blueprint.sillage}: {localizeSillage(perfume.sillage, language === 'tr')}
                </span>
                <span className="border border-white/[0.06] bg-white/[0.02] text-white/70 px-3 py-1 rounded-full whitespace-nowrap">
                  {dict.blueprint.longevity}: {localizeLongevity(perfume.longevity, language === 'tr')}
                </span>
              </div>
              {/* Environment Section */}
              <div className="flex flex-wrap items-center gap-4 text-white/60">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#c5a880]/80">{dict.blueprint.seasons}:</span>
                  <span>{perfume.seasons?.map(s => localizeSeason(s, language === "tr")).join(", ") || "—"}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#c5a880]/80">{dict.blueprint.occasions}:</span>
                  <span>{perfume.occasions?.map(o => localizeOccasion(o, language === "tr")).join(", ") || "—"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Olfactory Pyramid Formula (Redesigned as Timeline) */}
          <section className="space-y-8">
            <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold">{dict.blueprint.title}</h3>
            
            <div className="relative pl-8 md:pl-10 border-l border-dashed border-white/[0.1] space-y-12 py-2 ml-4">
              
              {/* Top Notes */}
              <div className="relative">
                {/* Timeline node marker */}
                <div className="absolute -left-[42px] md:-left-[50px] top-1 w-5 h-5 rounded-full bg-[#050505] border border-[#D4AF37] flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <div>
                    <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block">
                      {dict.timeline.top}
                    </span>
                    <span className="text-[10px] text-[#f5f0e6]/40 uppercase tracking-widest font-light mt-0.5 block">
                      {dict.timeline.topDesc}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f0e6]/50 max-w-md font-light leading-relaxed">
                    {dict.perfumePage.topNoteDesc}
                  </p>
                </div>
                
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex flex-wrap gap-2.5 pt-1"
                >
                  {perfume.notes.top.map((note, index) => (
                    <motion.span 
                      variants={fadeInUp} 
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0px 0px 12px rgba(212, 175, 55, 0.35)", 
                        borderColor: "rgba(212, 175, 55, 0.4)",
                        color: "#D4AF37"
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      key={`${note}-${index}`}
                      className="text-xs tracking-wider border border-white/[0.06] bg-white/[0.02] py-1.5 px-3 rounded-full text-[#f5f0e6]/80 cursor-default transition-all duration-300"
                    >
                      {localizeNote(note, language === 'tr')}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              {/* Mid Notes */}
              <div className="relative">
                {/* Timeline node marker */}
                <div className="absolute -left-[42px] md:-left-[50px] top-1 w-5 h-5 rounded-full bg-[#050505] border border-[#D4AF37] flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <div>
                    <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block">
                      {dict.timeline.heart}
                    </span>
                    <span className="text-[10px] text-[#f5f0e6]/40 uppercase tracking-widest font-light mt-0.5 block">
                      {dict.timeline.heartDesc}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f0e6]/50 max-w-md font-light leading-relaxed">
                    {dict.perfumePage.heartNoteDesc}
                  </p>
                </div>
                
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex flex-wrap gap-2.5 pt-1"
                >
                  {perfume.notes.mid.map((note, index) => (
                    <motion.span 
                      variants={fadeInUp} 
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0px 0px 12px rgba(212, 175, 55, 0.35)", 
                        borderColor: "rgba(212, 175, 55, 0.4)",
                        color: "#D4AF37"
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      key={`${note}-${index}`}
                      className="text-xs tracking-wider border border-white/[0.06] bg-white/[0.02] py-1.5 px-3 rounded-full text-[#f5f0e6]/80 cursor-default transition-all duration-300"
                    >
                      {localizeNote(note, language === 'tr')}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              {/* Base Notes */}
              <div className="relative">
                {/* Timeline node marker */}
                <div className="absolute -left-[42px] md:-left-[50px] top-1 w-5 h-5 rounded-full bg-[#050505] border border-[#D4AF37] flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  <Calendar className="w-2.5 h-2.5 text-[#D4AF37]" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <div>
                    <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block">
                      {dict.timeline.base}
                    </span>
                    <span className="text-[10px] text-[#f5f0e6]/40 uppercase tracking-widest font-light mt-0.5 block">
                      {dict.timeline.baseDesc}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f0e6]/50 max-w-md font-light leading-relaxed">
                    {dict.perfumePage.baseNoteDesc}
                  </p>
                </div>
                
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex flex-wrap gap-2.5 pt-1"
                >
                  {perfume.notes.base.map((note, index) => (
                    <motion.span 
                      variants={fadeInUp} 
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0px 0px 12px rgba(212, 175, 55, 0.35)", 
                        borderColor: "rgba(212, 175, 55, 0.4)",
                        color: "#D4AF37"
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      key={`${note}-${index}`}
                      className="text-xs tracking-wider border border-white/[0.06] bg-white/[0.02] py-1.5 px-3 rounded-full text-[#f5f0e6]/80 cursor-default transition-all duration-300"
                    >
                      {localizeNote(note, language === 'tr')}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

            </div>
          </section>

          {/* Scent Community & Discussion Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {dict.perfumePage.communityDialogue}
              </h3>
              <span className="text-[9px] bg-[#c5a880]/10 text-[#c5a880] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-medium">
                {dict.perfumePage.verifiedReports}
              </span>
            </div>

            {/* List Reviews */}
            <div className="space-y-4">
              {allReviews.map((review) => (
                <div key={review.id} className="p-5 glass-premium rounded-sm relative">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#c5a880]/15 flex items-center justify-center text-[10px] text-[#c5a880] font-bold">
                        {review.user[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-semibold block">{review.user}</span>
                        <span className="text-[9px] text-[#f5f0e6]/40">{review.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? "text-[#c5a880] fill-[#c5a880]" : "text-[#f5f0e6]/10"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-[#f5f0e6]/70 leading-relaxed font-light italic pl-1 mb-4">
                    &ldquo;{translateComment(review.comment, language === "tr")}&rdquo;
                  </p>

                  {/* Community Threaded Replies */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    {/* Reply Toggle */}
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] tracking-wider text-[#c5a880]/50 font-medium">
                        {dict.perfumePage.sensoryDialogue}
                      </span>
                      <button
                        onClick={() => setActiveReplyBox({ type: "review", id: review.id })}
                        className="text-[9px] tracking-wider uppercase text-[#c5a880] hover:text-[#e5cda8] font-semibold cursor-pointer"
                      >
                        {dict.perfumePage.replyToReview}
                      </button>
                    </div>

                    {/* Review reply form */}
                    {activeReplyBox?.type === "review" && activeReplyBox.id === review.id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={dict.perfumePage.replyPlaceholder}
                          className="flex-1 bg-black/40 border border-[#c5a880]/20 rounded-sm py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-[#c5a880]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendReply(review.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(review.id)}
                          className="bg-[#c5a880] text-black text-[9px] font-bold uppercase px-3 rounded-sm hover:bg-[#e5cda8] transition-colors cursor-pointer"
                        >
                          {dict.perfumePage.send}
                        </button>
                        <button
                          onClick={() => setActiveReplyBox(null)}
                          className="text-[#f5f0e6]/45 hover:text-white text-xs px-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Nested replies nodes */}
                    {(() => {
                      const repliesList = reviewsReplies[perfume.id]?.[review.id] || [];
                      if (repliesList.length === 0) return null;
                      const replyTree = buildReplyTree(repliesList);
                      return (
                        <div className="space-y-1">
                          {replyTree.map(node => renderReplyNode(node, review.id))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              ))}
            </div>

            {/* Review Submission Form Placeholder */}
            <div className="glass-premium p-6 rounded-sm border border-[#c5a880]/10">
              <h4 className="font-serif text-sm tracking-wider mb-4 text-[#c5a880] uppercase">
                {dict.perfumePage.submitReport}
              </h4>
              
              {submitted ? (
                <div className="py-6 text-center">
                  <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase font-bold block mb-2">
                    {dict.perfumePage.reportLogged}
                  </span>
                  <p className="text-xs text-[#f5f0e6]/50 tracking-wider">
                    {dict.perfumePage.reportLoggedDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newUserName" className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1.5">
                        {dict.perfumePage.yourIdentity}
                      </label>
                      <input 
                        id="newUserName"
                        type="text" 
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder={dict.perfumePage.yourIdentityPlaceholder ?? (language === 'tr' ? "Örn: KokuTutkunu" : "e.g. NoseConnoisseur")} 
                        className="w-full bg-black/40 border border-[#c5a880]/20 rounded-sm py-2 px-3 text-xs text-[#f5f0e6] focus:outline-none focus:border-[#c5a880] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1.5">
                        {dict.perfumePage.ratingLabel}
                      </label>
                      <div className="flex gap-2 h-[34px] items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNewRating(i + 1)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={`w-5 h-5 cursor-pointer transition-colors ${
                                i < newRating ? "text-[#c5a880] fill-[#c5a880]" : "text-[#f5f0e6]/10 hover:text-[#c5a880]/50"
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newComment" className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1.5">
                      {dict.perfumePage.critiqueLabel}
                    </label>
                    <textarea 
                      id="newComment"
                      required
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={dict.perfumePage.critiquePlaceholder} 
                      className="w-full bg-black/40 border border-[#c5a880]/20 rounded-sm py-2 px-3 text-xs text-[#f5f0e6] focus:outline-none focus:border-[#c5a880] transition-colors"
                    />
                  </div>

                  {submitError && (
                    <p className="text-xs text-red-400/80 tracking-wider">{submitError}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#c5a880] hover:bg-[#e5cda8] disabled:opacity-60 disabled:cursor-not-allowed text-black text-[10px] tracking-[0.25em] uppercase font-bold rounded-sm transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? dict.common.loading.replace('...', '...')
                      : <>{dict.perfumePage.submitBtn} <Send className="w-3.5 h-3.5" /></>}
                  </button>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
