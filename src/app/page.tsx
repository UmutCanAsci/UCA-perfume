"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  Search, 
  Star, 
  Droplet, 
  User, 
  Heart, 
  Filter, 
  ChevronDown, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Bookmark,
  Award,
  X,
  Plus,
  Menu
} from "lucide-react";
import perfumesData from "@/data/perfumesData.json";
import { Perfume } from "@/types/perfume";
import { useScentSphere } from "@/components/ScentSphereContext";
import { translateRaw, translateComment } from "@/data/translations";

const brands = [
  "All",
  "Chanel",
  "Maison Francis Kurkdjian",
  "Creed",
  "Yves Saint Laurent",
  "Guerlain",
  "Dior",
  "Marc-Antoine Barrois"
];

const popularNotes = [
  "Vanilla",
  "Cedar",
  "Lemon",
  "Jasmine",
  "Bergamot",
  "Saffron",
  "Sandalwood",
  "Ambergris",
  "Pineapple",
  "Coffee"
];

export default function Home() {
  const { 
    currentUser, 
    activeUser,
    perfumes,
    homeReviews,
    submitHomeReview,
    reloadHomeReviews,
    wardrobeIds,
    favoriteIds,
    toggleWardrobe,
    toggleFavorite,
    addPerfumeToList,
    removePerfumeFromList,
    language,
    toggleLanguage,
    t,
    dict
  } = useScentSphere();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedProfileAttribute, setSelectedProfileAttribute] = useState<string>("All");
  const [activeNoteFilters, setActiveNoteFilters] = useState<string[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [hoveredPerfumeId, setHoveredPerfumeId] = useState<string | null>(null);
  const [hoveredPyramidLevel, setHoveredPyramidLevel] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSidebarEnter = () => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setIsSidebarExpanded(true);
  };

  const handleSidebarLeave = () => {
    collapseTimerRef.current = setTimeout(() => setIsSidebarExpanded(false), 300);
  };

  const closeSidebar = () => setIsSidebarExpanded(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset pagination whenever any filter changes
  useEffect(() => {
    setVisibleCount(4);
  }, [searchTerm, selectedGender, selectedBrand, selectedProfileAttribute, activeNoteFilters]);

  // Filter perfumes based on search and selected options
  const filteredPerfumes = perfumes.filter((perfume) => {
    // 1. Text Search
    const matchesSearch = 
      searchTerm === "" ||
      perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perfume.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perfume.notes.top.some(n => n.toLowerCase().includes(searchTerm.toLowerCase())) ||
      perfume.notes.mid.some(n => n.toLowerCase().includes(searchTerm.toLowerCase())) ||
      perfume.notes.base.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 2. Gender/Audience
    const matchesGender = 
      selectedGender.toLowerCase() === "all" || 
      perfume.gender?.toLowerCase() === selectedGender.toLowerCase() ||
      (selectedGender.toLowerCase() === "men" && perfume.gender?.toLowerCase().includes("men")) ||
      (selectedGender.toLowerCase() === "women" && perfume.gender?.toLowerCase().includes("women"));
    
    // 3. Brand
    const matchesBrand = selectedBrand === "All" || perfume.brand === selectedBrand;
    
    // 4. Olfactory Scent Profile Attribute (Woody, Floral, etc.)
    let matchesProfile = true;
    if (selectedProfileAttribute !== "All") {
      const val = perfume.olfactoryProfile[selectedProfileAttribute as keyof typeof perfume.olfactoryProfile] || 0;
      matchesProfile = val >= 20; // significant presence threshold (>= 20%)
    }
    
    // 5. Note Tag filters
    let matchesNotes = true;
    if (activeNoteFilters.length > 0) {
      matchesNotes = activeNoteFilters.every(note => 
        perfume.notes.top.some(n => n.toLowerCase() === note.toLowerCase()) ||
        perfume.notes.mid.some(n => n.toLowerCase() === note.toLowerCase()) ||
        perfume.notes.base.some(n => n.toLowerCase() === note.toLowerCase())
      );
    }
    
    return matchesSearch && matchesGender && matchesBrand && matchesProfile && matchesNotes;
  });

  const isAnyFilterActive = 
    searchTerm !== "" || 
    selectedGender !== "All" || 
    selectedBrand !== "All" || 
    selectedProfileAttribute !== "All" || 
    activeNoteFilters.length > 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedGender("All");
    setSelectedBrand("All");
    setSelectedProfileAttribute("All");
    setActiveNoteFilters([]);
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details drawer
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return prev; // limit to 3 perfumes
      }
      return [...prev, id];
    });
  };

  const selectedComparePerfumes = selectedCompareIds
    .map(id => perfumes.find(p => p.id === id)!)
    .filter(Boolean);

  // Setup data for Overlay Comparison Radar Chart
  const subjects = ["Floral", "Woody", "Spicy", "Fresh", "Sweet"] as const;
  
  // Find maximum raw value for each compared perfume
  const perfumeMaxValues = selectedComparePerfumes.map(p => {
    const vals = subjects.map(sub => p.olfactoryProfile?.[sub] ?? 0);
    const maxVal = Math.max(...vals);
    return maxVal > 0 ? maxVal : 1;
  });

  const comparisonChartData = subjects.map(sub => {
    const dataPoint: any = { subject: sub };
    selectedComparePerfumes.forEach((p, idx) => {
      const rawVal = p.olfactoryProfile?.[sub] ?? 0;
      const maxRawValue = perfumeMaxValues[idx];
      const scaledValue = (rawVal / maxRawValue) * 10;
      dataPoint[`val${idx}`] = Number(scaledValue.toFixed(1));
    });
    return dataPoint;
  });

  const compareColors = ["#E2E8F0", "#D4AF37", "#3B82F6"]; // High-Contrast Pure Platinum, Rich Amber Gold, Royal Midnight Blue

  // Animation variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black flex overflow-x-hidden max-w-full">

      {/* ═══════════════════════════════════════════════════════
          COLLAPSIBLE LUXURY SIDEBAR
          Collapsed: w-14 micro-bar (toggle + brand mark)
          Expanded:  w-72 full panel (overlay, no layout shift)
      ═══════════════════════════════════════════════════════ */}

      {/* Dim overlay — only visible on mobile when sidebar is open */}
      <AnimatePresence>
        {isSidebarExpanded && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSidebar}
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        animate={{ width: isSidebarExpanded ? "18rem" : "3.5rem" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 bottom-0 z-[58] overflow-hidden
                   bg-black/85 backdrop-blur-2xl
                   border-r border-[#c5a880]/30
                   shadow-[10px_0_40px_rgba(0,0,0,0.8)]
                   hidden md:flex md:flex-col"
      >
        {/* ── Inner panel — always 288px wide, clipped by parent ── */}
        <div className="w-72 flex flex-col h-full">

          {/* ── HEADER ROW: toggle button + sliding logo ── */}
          <div className="flex items-center h-16 px-3.5 border-b border-[#c5a880]/15 shrink-0">
            {/* Toggle button — always within the 56px collapsed strip */}
            <button
              onClick={() => setIsSidebarExpanded(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#c5a880]/50 hover:text-[#c5a880] hover:bg-[#c5a880]/8 transition-all duration-200 shrink-0"
              aria-label={isSidebarExpanded ? "Collapse navigation" : "Expand navigation"}
            >
              {isSidebarExpanded
                ? <X className="w-4 h-4" />
                : <Menu className="w-4 h-4" />}
            </button>

            {/* UCA logo — fades in with the panel */}
            <motion.div
              animate={{ opacity: isSidebarExpanded ? 1 : 0, x: isSidebarExpanded ? 0 : -8 }}
              transition={{ duration: 0.2, delay: isSidebarExpanded ? 0.08 : 0 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <Link
                href="#"
                onClick={closeSidebar}
                aria-label="UCA — Luxury Perfume Encyclopedia"
              >
                <span className="text-xl font-serif tracking-[0.3em] font-bold gold-gradient-text uppercase">
                  {dict.hero.title}
                </span>
              </Link>
            </motion.div>
          </div>

          {/* ── BODY: scrollable nav + search ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">

            {/* Collapsed micro-bar: vertical nav dots */}
            <motion.div
              animate={{ opacity: isSidebarExpanded ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-4 pt-6 px-3.5 absolute"
              style={{ pointerEvents: isSidebarExpanded ? "none" : "auto" }}
            >
              <div className="w-1 h-1 rounded-full bg-[#c5a880]/30" title={dict.nav.encyclopedia} />
              <div className="w-1 h-1 rounded-full bg-[#c5a880]/30" title={dict.nav.community} />
              <div className="w-1 h-1 rounded-full bg-[#c5a880]/20" title={dict.nav.consultant} />
            </motion.div>

            {/* Expanded nav content */}
            <motion.div
              animate={{ opacity: isSidebarExpanded ? 1 : 0 }}
              transition={{ duration: 0.2, delay: isSidebarExpanded ? 0.1 : 0 }}
              className="px-3 pt-6 flex flex-col gap-1"
            >
              {/* Section label */}
              <span lang={language === "tr" ? "tr" : "en"} className="text-[9px] tracking-[0.3em] uppercase text-[#c5a880]/40 font-medium mb-3 pl-1 whitespace-nowrap">
                {dict.sidebar.navigate}
              </span>

              <a
                href="#encyclopedia"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-300 hover:text-[#c5a880] hover:bg-[#c5a880]/5 transition-all duration-200 group whitespace-nowrap"
              >
                <span className="w-1 h-1 rounded-full bg-[#c5a880]/40 group-hover:bg-[#c5a880] transition-colors shrink-0" />
                {dict.nav.encyclopedia}
              </a>

              <a
                href="#community"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-300 hover:text-[#c5a880] hover:bg-[#c5a880]/5 transition-all duration-200 group whitespace-nowrap"
              >
                <span className="w-1 h-1 rounded-full bg-[#c5a880]/40 group-hover:bg-[#c5a880] transition-colors shrink-0" />
                {dict.nav.community}
              </a>

              {/* Scent Consultant — luxury pill */}
              <Link
                href="/consultant"
                onClick={closeSidebar}
                className="flex items-center gap-2.5 mt-2 px-3 py-2.5 rounded-lg border border-[#c5a880]/40 hover:border-[#c5a880] bg-[#c5a880]/5 hover:bg-[#c5a880]/12 shadow-[0_0_18px_rgba(197,168,128,0.06)] hover:shadow-[0_0_24px_rgba(197,168,128,0.18)] text-[11px] uppercase tracking-[0.2em] font-medium text-[#e6ca65] transition-all duration-300 whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 text-[#c5a880] shrink-0" />
                {dict.nav.consultant}
              </Link>

              {/* Admin archivist link */}
              {activeUser?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={closeSidebar}
                  className="flex items-center gap-2.5 mt-1 px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.2em] font-medium text-[#D4AF37] hover:text-[#f0d978] hover:bg-[#D4AF37]/5 transition-all duration-200 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
                  {dict.nav.archivist}
                </Link>
              )}

              {/* Search */}
              <div className="mt-6 mb-2">
                <span lang={language === "tr" ? "tr" : "en"} className="text-[9px] tracking-[0.3em] uppercase text-[#c5a880]/40 font-medium mb-3 pl-1 block whitespace-nowrap">
                  {dict.sidebar.search}
                </span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={dict.hero.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 focus:border-[#c5a880] rounded-full px-4 py-2 pr-9 text-xs tracking-wider text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all duration-300"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c5a880]/50 pointer-events-none" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── FOOTER: language + user + copyright ── */}
          <motion.div
            animate={{ opacity: isSidebarExpanded ? 1 : 0 }}
            transition={{ duration: 0.2, delay: isSidebarExpanded ? 0.12 : 0 }}
            className="shrink-0 px-3 pb-6 pt-4 border-t border-neutral-800/60 flex flex-col gap-4"
          >
            {/* Language Toggle */}
            <div className="flex items-center justify-between">
              <span lang={language === "tr" ? "tr" : "en"} className="text-[9px] tracking-[0.3em] uppercase text-[#c5a880]/40 font-medium whitespace-nowrap">
                {dict.sidebar.language}
              </span>
              <button
                onClick={toggleLanguage}
                title={language === "en" ? "Switch to Turkish" : "Switch to English"}
                className="text-[10px] tracking-[0.2em] font-semibold uppercase border border-neutral-700 hover:border-[#c5a880] px-3 py-1 rounded-md text-neutral-300 hover:text-[#c5a880] bg-transparent cursor-pointer transition-all duration-300 select-none leading-none"
              >
                {language === "en" ? "EN" : "TR"}
              </button>
            </div>

            {/* User / Login */}
            <Link
              href={activeUser ? "/profile" : "/auth"}
              onClick={closeSidebar}
              className="flex items-center gap-2.5 border border-[#c5a880]/40 hover:border-[#c5a880] bg-gradient-to-r from-neutral-900 via-[#c5a880]/8 to-neutral-900 hover:via-[#c5a880]/18 hover:shadow-[0_0_20px_rgba(197,168,128,0.18)] px-4 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-semibold text-[#f3e5c8] transition-all duration-300 whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 shrink-0 text-[#c5a880]" />
              <span className="truncate">{activeUser ? `@${activeUser.username}` : dict.nav.guest}</span>
            </Link>

            {/* Copyright */}
            <p className="text-[9px] tracking-[0.2em] uppercase text-neutral-700 whitespace-nowrap">
              &copy; {new Date().getFullYear()} {dict.hero.title}
            </p>
          </motion.div>

        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT — full viewport width (sidebar overlays)
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 w-full overflow-x-hidden">

      {/* Cinematic Hero Section with Hardware-Accelerated Video Loop */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden w-full bg-[#0F0F10]">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.25]"
            src="/assets/hero-bg.mp4"
          />
          {/* Vignette gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-[#0F0F10]/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F10]/90 via-transparent to-[#0F0F10]/90" />
        </div>

        {/* Cinematic Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div 
              variants={fadeInUp} 
              className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-[#c5a880]/20 bg-[#c5a880]/5 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium text-[#c5a880]">
                {dict.hero.badge}
              </span>
            </motion.div>

            <motion.h1 
              className="font-serif text-4xl sm:text-5xl md:text-8xl tracking-[0.1em] uppercase font-bold leading-tight mb-6 flex flex-wrap justify-center gap-x-[0.15em] sm:gap-x-[0.2em]"
            >
              {dict.hero.mainTitle.split(" ").map((word, wordIndex, wordsArr) => {
                const isGold = wordIndex === wordsArr.length - 1;
                return (
                  <Fragment key={wordIndex}>
                    {isGold && <div className="w-full h-0" />}
                    <span className={`whitespace-nowrap inline-block ${isGold ? "gold-gradient-text" : ""}`}>
                      {word.split("").map((char, charIndex) => (
                        <motion.span
                          key={charIndex}
                          variants={{
                            hidden: { opacity: 0, y: 12 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                          }}
                          style={{ display: "inline-block" }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </span>
                  </Fragment>
                );
              })}
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="max-w-2xl text-[#f5f0e6]/75 text-sm md:text-lg font-light tracking-wide leading-relaxed mb-10 min-h-[80px] flex items-center justify-center"
            >
              {dict.hero.desc}
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center"
            >
              <Link href="/consultant">
                <motion.div
                  whileHover={{ y: -3, scale: 1.05, boxShadow: "0px 0px 25px rgba(197, 168, 128, 0.3)" }}
                  whileTap={{ scale: 0.985 }}
                  className="px-7 py-3.5 border border-[#c5a880] bg-gradient-to-r from-[#c5a880]/20 via-[#e6ca65]/10 to-[#c5a880]/20 hover:from-[#c5a880]/30 hover:to-[#c5a880]/30 shadow-[0_0_20px_rgba(197,168,128,0.15)] text-[#f3e5c8] text-xs md:text-sm font-semibold tracking-[0.2em] uppercase rounded-full transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#e6ca65] shrink-0" />
                  <span>{dict.nav.consultant} ✦</span>
                </motion.div>
              </Link>

              <motion.a 
                whileHover={{ y: -3, scale: 1.025, boxShadow: "0px 8px 24px rgba(197, 168, 128, 0.2)" }}
                whileTap={{ scale: 0.985 }}
                href="#encyclopedia" 
                className="px-7 py-3.5 bg-[#c5a880] text-[#050505] text-xs font-semibold tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-lg flex items-center gap-2 font-bold cursor-pointer"
              >
                {dict.hero.btnDatabase} <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>

              <motion.button 
                whileHover={{ y: -3, scale: 1.025, borderColor: "#c5a880" }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  const el = document.getElementById("community");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-7 py-3.5 border border-[#c5a880]/30 text-[#f5f0e6] text-xs font-semibold tracking-[0.2em] uppercase rounded-full transition-all duration-300 backdrop-blur-sm cursor-pointer"
              >
                {dict.hero.btnCommunity}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-[#c5a880]/60 cursor-pointer z-10"
          onClick={() => {
            const el = document.getElementById("encyclopedia");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="text-[9px] tracking-[0.35em] uppercase font-light">{dict.hero.scroll}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content & Perfume Encyclopedia */}
      <section id="encyclopedia" className="py-32 relative z-10 max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center mb-16 min-h-[140px] justify-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-widest uppercase mb-4 leading-tight min-h-[60px] flex items-center justify-center flex-wrap gap-x-3">
            {dict.encyclopedia.title.split(" ")[0]} <span className="gold-gradient-text inline-block">{dict.encyclopedia.title.split(" ").slice(1).join(" ")}</span>
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent mb-6" />
          <p className="max-w-xl text-[#f5f0e6]/60 text-xs md:text-sm tracking-wide font-light leading-relaxed min-h-[44px] flex items-center text-center justify-center">
            {dict.encyclopedia.subtitle}
          </p>
        </div>

        {/* Filters and Controls Container */}
        <div className="flex flex-col gap-6 mb-12 border-b border-[#c5a880]/15 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-3">
              {["All", "Unisex", "Men", "Women"].map((gender) => (
                <button
                  type="button"
                  key={gender}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedGender(gender);
                  }}
                  className={`px-5 py-2 rounded-full text-[10px] tracking-[0.2em] uppercase transition-all duration-300 border ${
                    selectedGender === gender
                      ? "bg-[#c5a880] text-black border-[#c5a880]"
                      : "bg-transparent text-[#f5f0e6]/70 border-[#c5a880]/20 hover:border-[#c5a880]/50"
                  }`}
                >
                  {gender === "All" && dict.cards.all}
                  {gender === "Unisex" && dict.cards.unisex}
                  {gender === "Men" && dict.cards.men}
                  {gender === "Women" && dict.cards.women}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <input
                  type="text"
                  placeholder={dict.cards.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-[#c5a880]/20 rounded-sm py-2 pl-4 pr-10 text-xs tracking-wider text-[#f5f0e6] focus:outline-none focus:border-[#c5a880] transition-colors duration-300"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-[#c5a880]/60" />
              </div>
              
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`px-4 py-2 border rounded-sm text-[10px] tracking-[0.2em] uppercase flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  isFilterPanelOpen || activeNoteFilters.length > 0 || selectedBrand !== "All" || selectedProfileAttribute !== "All"
                    ? "bg-[#c5a880]/15 border-[#c5a880] text-[#c5a880]"
                    : "bg-transparent border-[#c5a880]/20 text-[#f5f0e6]/70 hover:border-[#c5a880]/50"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{dict.cards.filters}</span>
              </button>

              {isAnyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="text-[9px] tracking-[0.2em] uppercase text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/50 px-3.5 py-2 rounded-sm transition-all duration-300 cursor-pointer"
                >
                  {dict.matrix.clear}
                </button>
              )}
            </div>
          </div>

          {/* Expandable Advanced Filter Panel */}
          <AnimatePresence>
            {isFilterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-6 pt-6 border-t border-[#c5a880]/10">
                  {/* Select Scent Profile */}
                  <div>
                    <label lang={language === "tr" ? "tr" : "en"} className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-2">{dict.filterPanel.byScentProfile}</label>
                    <div className="flex flex-wrap gap-2">
                      {(["All", "Floral", "Woody", "Spicy", "Fresh", "Sweet"] as const).map((profile) => {
                        const profileLabel: Record<string, string> = {
                          All:    dict.filterPanel.all,
                          Floral: translateRaw("Floral", language === "tr"),
                          Woody:  translateRaw("Woody", language === "tr"),
                          Spicy:  translateRaw("Spicy", language === "tr"),
                          Fresh:  translateRaw("Fresh", language === "tr"),
                          Sweet:  translateRaw("Sweet", language === "tr"),
                        };
                        return (
                          <button
                            key={profile}
                            onClick={() => setSelectedProfileAttribute(profile)}
                            className={`px-3 py-1.5 rounded-sm text-[9px] tracking-wider transition-all duration-300 border ${
                              selectedProfileAttribute === profile
                                ? "bg-[#c5a880]/20 border-[#c5a880] text-[#c5a880]"
                                : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/20"
                            }`}
                          >
                            {profileLabel[profile] ?? profile}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter Note Tags */}
                  <div>
                    <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-2">{dict.filterPanel.byNotes}</label>
                    <div className="flex flex-wrap gap-2">
                      {popularNotes.map((note) => {
                        const isActive = activeNoteFilters.includes(note);
                        return (
                          <button
                            key={note}
                            onClick={() => {
                              setActiveNoteFilters(prev => 
                                prev.includes(note) 
                                  ? prev.filter(n => n !== note)
                                  : [...prev, note]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[9px] tracking-wider transition-all duration-300 border flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? "bg-[#c5a880] text-black border-[#c5a880]"
                                : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                            }`}
                          >
                            <span>{translateRaw(note, language === "tr")}</span>
                            {isActive && <span className="text-[8px] font-bold">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Perfume Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[400px]"
        >
          {filteredPerfumes.slice(0, visibleCount).map((perfume) => (
            <div
              key={perfume.id}
              onMouseEnter={() => setHoveredPerfumeId(perfume.id)}
              onMouseLeave={() => setHoveredPerfumeId(null)}
              className="group relative glass-premium rounded-sm overflow-hidden flex flex-col justify-between h-[480px] hover:border-[#c5a880]/35 transition-all duration-500 animate-fadeIn"
            >
              {/* Visual Accent Layer */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#c5a880]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Custom circular Compare Toggle Checkbox */}
              <button
                type="button"
                onClick={(e) => toggleCompare(perfume.id, e)}
                className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 bg-black/60 backdrop-blur-md cursor-pointer hover:scale-105"
                style={{
                  borderColor: selectedCompareIds.includes(perfume.id) ? "#c5a880" : "rgba(197, 168, 128, 0.3)"
                }}
                title="Select for Scent Comparison"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    selectedCompareIds.includes(perfume.id) ? "bg-[#c5a880]" : "bg-transparent"
                  }`}
                >
                  {selectedCompareIds.includes(perfume.id) && (
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 stroke-black stroke-[4] fill-none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Card Top Information */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] tracking-[0.25em] uppercase font-light text-[#c5a880]">
                    {perfume.brand}
                  </span>
                  <div className="flex items-center gap-1 mr-6">
                    <Star className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" />
                    <span className="text-[10px] font-semibold text-[#f5f0e6]">{perfume.rating}</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg tracking-wider text-[#f5f0e6] mb-1.5 group-hover:text-[#c5a880] transition-colors duration-300">
                  {perfume.name}
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] tracking-wider bg-black/60 px-2 py-0.5 rounded-sm text-[#f5f0e6]/50 uppercase">
                    {perfume.concentration}
                  </span>
                  <span className="text-[9px] tracking-wider bg-[#c5a880]/10 px-2 py-0.5 rounded-sm text-[#c5a880] uppercase">
                    {perfume.gender}
                  </span>
                </div>

                {/* Curation Quick Actions */}
                <div className="flex items-center gap-2 mb-4 text-[9px] tracking-wider uppercase font-semibold">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (perfume?.id) {
                        toggleWardrobe(perfume.id);
                      }
                    }}
                    className={`relative z-30 pointer-events-auto cursor-pointer py-0.5 px-2.5 border tracking-widest text-[10px] uppercase font-light rounded-full transition-all duration-300 ${
                      wardrobeIds.includes(perfume.id)
                        ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                        : "border-[#c5a880]/30 text-[#c5a880] hover:text-white hover:border-[#c5a880]/60 bg-transparent"
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
                    className={`relative z-30 pointer-events-auto cursor-pointer py-0.5 px-2.5 border tracking-widest text-[10px] uppercase font-light rounded-full transition-all duration-300 ${
                      favoriteIds.includes(perfume.id)
                        ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                        : "border-[#c5a880]/30 text-[#c5a880] hover:text-white hover:border-[#c5a880]/60 bg-transparent"
                    }`}
                  >
                    {favoriteIds.includes(perfume.id) ? `★ ${dict.addedToFavorites}` : `+ ${dict.addToFavorites}`}
                  </button>
                </div>

                <p className="text-xs text-[#f5f0e6]/60 leading-relaxed font-light line-clamp-3 mb-6">
                  {language === "tr"
                    ? ((perfume as any).description_tr || (perfume as any).mainDescriptionTr || perfume.description)
                    : ((perfume as any).description_en || (perfume as any).mainDescriptionEn || perfume.description)}
                </p>
              </div>

              {/* Card Middle: Interactive Olfactory Pyramid Drawer */}
              <div className="px-6 flex-1 flex flex-col justify-end">
                <div className="border-t border-[#c5a880]/10 pt-4 mb-4">
                  <span className="text-[9px] tracking-[0.2em] uppercase font-light text-[#c5a880]/80 block mb-2.5">
                    {dict.cards.olfactoryNotes}
                  </span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-light">
                      <span className="text-[#f5f0e6]/40 uppercase tracking-wider">Top:</span>
                      <span className="text-[#f5f0e6]/80 text-right line-clamp-1 truncate max-w-[150px]">
                        {(language === "tr"
                          ? ((perfume.notes as any).top_tr ?? perfume.notes.top)
                          : perfume.notes.top
                        ).map((n: string) => translateRaw(n, false)).join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-light">
                      <span className="text-[#f5f0e6]/40 uppercase tracking-wider">Heart:</span>
                      <span className="text-[#f5f0e6]/80 text-right line-clamp-1 truncate max-w-[150px]">
                        {(language === "tr"
                          ? ((perfume.notes as any).mid_tr ?? perfume.notes.mid)
                          : perfume.notes.mid
                        ).map((n: string) => translateRaw(n, false)).join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-light">
                      <span className="text-[#f5f0e6]/40 uppercase tracking-wider">Base:</span>
                      <span className="text-[#f5f0e6]/80 text-right line-clamp-1 truncate max-w-[150px]">
                        {(language === "tr"
                          ? ((perfume.notes as any).base_tr ?? perfume.notes.base)
                          : perfume.notes.base
                        ).map((n: string) => translateRaw(n, false)).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Action / Expand Bottom */}
              <div className="p-6 bg-black/20 border-t border-[#c5a880]/5 flex justify-between items-center">
                <span className="text-[10px] tracking-widest text-[#f5f0e6]/50 uppercase">
                  {dict.cards.released}: {perfume.yearReleased}
                </span>
                
                <button 
                  type="button"
                  onClick={() => setSelectedPerfume(perfume)}
                  className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[#c5a880] group-hover:text-[#f5f0e6] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {dict.cards.viewDetails} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Localized Pagination Trigger Area */}
        {visibleCount < filteredPerfumes.length && (
          <div className="flex justify-center mt-12 mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setVisibleCount(prev => prev + 4);
              }}
              className="tracking-[0.2em] text-xs font-medium text-[#c5a880]/70 hover:text-[#c5a880] transition-colors duration-300 uppercase cursor-pointer"
            >
              {language === "tr" ? "DAHA FAZLA KEŞFET ➔" : "MORE TO EXPLORE ➔"}
            </button>
          </div>
        )}

        {filteredPerfumes.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-[#f5f0e6]/40 font-light text-sm tracking-widest">
              {dict.cards.noResults}
            </p>
          </motion.div>
        )}
      </section>

      {/* Floating Compare Action Bar Overlay */}
      <AnimatePresence>
        {selectedCompareIds.length >= 1 && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed bottom-8 left-1/2 z-40 w-[90%] max-w-4xl backdrop-blur-md bg-black/60 border border-white/10 px-6 py-4 rounded-full flex items-center justify-between gap-6 shadow-[0_10px_50px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-4 overflow-hidden flex-1">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#c5a880] flex-shrink-0">Compare ({selectedCompareIds.length}/3)</span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 whitespace-nowrap">
                {selectedCompareIds.map(id => {
                  const item = perfumes.find(p => p.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="bg-white/5 border border-white/10 px-3 py-1 text-xs rounded-full flex items-center gap-2 whitespace-nowrap text-white/80 flex-shrink-0">
                      <span className="truncate max-w-[90px]">{item.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompareIds(prev => prev.filter(pId => pId !== id));
                        }}
                        className="w-3.5 h-3.5 rounded-full bg-black/40 hover:bg-black/80 flex items-center justify-center text-[#c5a880] cursor-pointer text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 border-l border-white/10 pl-4">
              <button
                onClick={() => setSelectedCompareIds([])}
                className="text-[10px] tracking-widest uppercase hover:text-white text-[#f5f0e6]/50 transition-colors cursor-pointer"
              >
                {dict.matrix.clear}
              </button>
              
              <button
                disabled={selectedCompareIds.length < 2}
                onClick={() => setIsCompareModalOpen(true)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold rounded-full transition-all duration-300 ${
                  selectedCompareIds.length >= 2
                    ? "bg-[#c5a880] text-black hover:bg-[#e5cda8] cursor-pointer shadow-lg shadow-[#c5a880]/15"
                    : "bg-neutral-800 text-[#f5f0e6]/30 border border-white/5 cursor-not-allowed"
                }`}
              >
                {dict.matrix.compareNow}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Comparison Matrix Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 md:p-12 overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8 pb-4 border-b border-[#c5a880]/10">
              <div>
                <span className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold">{dict.blueprint.title}</span>
                <h2 className="font-serif text-2xl md:text-4xl tracking-wider font-bold mt-1">{dict.matrix.header}</h2>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 border border-[#c5a880]/20 hover:border-[#c5a880] rounded-full text-[#c5a880] hover:text-[#f5f0e6] transition-colors duration-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="max-w-7xl mx-auto w-full flex-1 overflow-x-auto no-scrollbar">
              <div 
                className="space-y-2 border border-[#c5a880]/15 bg-black/40 p-6 md:p-8 rounded-sm mb-12"
                style={{ minWidth: selectedComparePerfumes.length >= 3 ? "900px" : "650px" }}
              >
                
                {/* Header Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/10 pb-6 mb-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="hidden md:block" />
                  {selectedComparePerfumes.map((p, idx) => (
                    <div key={p.id} className="relative pt-4 pr-4">
                      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: compareColors[idx] }} />
                      <span className="text-[9px] tracking-wider text-[#c5a880]/60 uppercase block">{p.brand}</span>
                      <h3 className="font-serif text-base md:text-lg font-bold tracking-wide text-white truncate">{p.name}</h3>
                      <span className="text-[9px] text-[#f5f0e6]/40 uppercase mt-0.5 block">{p.concentration}</span>
                    </div>
                  ))}
                </div>

                {/* House / Brand Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.matrix.brand}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="text-xs md:text-sm font-medium text-white">{p.brand}</div>
                  ))}
                </div>

                {/* Concentration Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.matrix.concentration}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="text-xs md:text-sm font-light text-[#f5f0e6]/80">{p.concentration}</div>
                  ))}
                </div>

                {/* Release Year Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.matrix.year}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="text-xs md:text-sm font-light text-[#f5f0e6]/80">{p.yearReleased}</div>
                  ))}
                </div>

                {/* Audience Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.matrix.audience}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="text-xs md:text-sm font-light text-[#f5f0e6]/80">{p.gender}</div>
                  ))}
                </div>

                {/* Rating Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.matrix.rating}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs md:text-sm">
                      <Star className="w-3.5 h-3.5 fill-[#c5a880] text-[#c5a880]" />
                      <span className="font-semibold text-white">{p.rating} / 5</span>
                    </div>
                  ))}
                </div>

                {/* Olfactory Profile Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.blueprint.title}</div>
                  {selectedComparePerfumes.map((p, idx) => (
                    <div key={p.id} className="space-y-3 w-full pr-4">
                      {subjects.map(sub => {
                        const val = p.olfactoryProfile[sub];
                        return (
                          <div key={sub} className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] tracking-wider font-light text-[#f5f0e6]/60">
                              <span>{dict.metrics[sub.toLowerCase() as keyof typeof dict.metrics] || sub}</span>
                              <span>{val}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ 
                                  width: `${val}%`,
                                  backgroundColor: compareColors[idx]
                                }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Top Notes Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.timeline.top}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="flex flex-wrap gap-1.5 pr-4">
                      {p.notes.top.map(n => (
                        <span key={n} className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-sm text-[#f5f0e6]/80">{n}</span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Heart Notes Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.timeline.heart}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="flex flex-wrap gap-1.5 pr-4">
                      {p.notes.mid.map(n => (
                        <span key={n} className="text-[9px] bg-[#c5a880]/5 border border-[#c5a880]/10 px-2 py-0.5 rounded-sm text-[#c5a880]">{n}</span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Base Notes Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.timeline.base}</div>
                  {selectedComparePerfumes.map(p => (
                    <div key={p.id} className="flex flex-wrap gap-1.5 pr-4">
                      {p.notes.base.map(n => (
                        <span key={n} className="text-[9px] bg-black/40 border border-[#8e7355]/20 px-2 py-0.5 rounded-sm text-[#e5cda8]/60">{n}</span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Section Divider Row */}
                <div 
                  className="pt-8 pb-4 border-b border-white/[0.05]"
                  style={{
                    gridColumn: `span ${selectedComparePerfumes.length + 1}`
                  }}
                >
                  <span className="text-white/30 tracking-[0.2em] text-[10px] font-bold uppercase block">{dict.matrix.sectionPerfEnv}</span>
                </div>

                {/* Sillage / Projection Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.blueprint.sillage}</div>
                  {selectedComparePerfumes.map(p => {
                    const val = p.sillage;
                    return (
                      <div key={p.id} className="text-xs md:text-sm font-light text-[#f5f0e6]/80 pr-4">
                        {val ? (
                          <span className="inline-block bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm text-white/90">
                            {val}
                          </span>
                        ) : "—"}
                      </div>
                    );
                  })}
                </div>

                {/* Longevity Trail Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.blueprint.longevity}</div>
                  {selectedComparePerfumes.map(p => {
                    const val = p.longevity;
                    return (
                      <div key={p.id} className="text-xs md:text-sm font-light text-[#f5f0e6]/80 pr-4">
                        {val ? (
                          <span className="inline-block bg-[#c5a880]/10 border border-[#c5a880]/20 px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm text-[#c5a880]">
                            {val}
                          </span>
                        ) : "—"}
                      </div>
                    );
                  })}
                </div>

                {/* Optimal Season Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center border-b border-[#c5a880]/5 py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.blueprint.seasons}</div>
                  {selectedComparePerfumes.map(p => {
                    const vals = p.seasons;
                    return (
                      <div key={p.id} className="flex flex-wrap gap-1.5 pr-4">
                        {vals?.length ? vals.map(s => (
                          <span key={s} className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-sm text-[#f5f0e6]/80">{s}</span>
                        )) : "—"}
                      </div>
                    );
                  })}
                </div>

                {/* Scent Vibe / Occasion Row */}
                <div 
                  className="grid gap-6 md:gap-8 items-center py-4"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedComparePerfumes.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="text-white/50 tracking-widest text-xs font-semibold uppercase">{dict.blueprint.occasions}</div>
                  {selectedComparePerfumes.map(p => {
                    const vals = p.occasions;
                    return (
                      <div key={p.id} className="flex flex-wrap gap-1.5 pr-4">
                        {vals?.length ? vals.map(v => (
                          <span key={v} className="text-[9px] bg-black/40 border border-[#8e7355]/20 px-2 py-0.5 rounded-sm text-[#e5cda8]/75">{v}</span>
                        )) : "—"}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* UNIFIED COMPARISON RADAR CHART ROW (Desktop only visual highlight) */}
              <div className="hidden md:block glass-premium p-8 rounded-sm border border-[#c5a880]/15 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="font-serif text-lg tracking-wider text-white">{dict.matrix.header}</h3>
                    <p className="text-[10px] tracking-wide text-[#f5f0e6]/40 uppercase mt-0.5">{dict.matrix.sectionPerfEnv}</p>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4">
                    {selectedComparePerfumes.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: compareColors[idx] }} />
                        <span className="font-medium text-white">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {mounted ? (
                  <div className="w-full h-[320px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonChartData}>
                        <PolarGrid stroke="rgba(197, 168, 128, 0.15)" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: "rgba(245, 240, 230, 0.7)", fontSize: 10, letterSpacing: "0.1em" }} 
                          tickFormatter={(value) => {
                            const key = value.toLowerCase() as keyof typeof dict.metrics;
                            return dict.metrics[key] || value;
                          }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 10]} 
                          ticks={[0, 2, 4, 6, 8, 10]}
                          tick={false}
                          axisLine={false}
                        />
                        {selectedComparePerfumes.map((p, idx) => (
                          <Radar
                            key={p.id}
                            name={p.name}
                            dataKey={`val${idx}`}
                            stroke={compareColors[idx]}
                            fill={compareColors[idx]}
                            fillOpacity={0.12}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-xs text-[#f5f0e6]/20 tracking-wider">
                    RENDERING MOLECULAR CHART...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Olfactory Notes Interactive Spotlight */}
      <section id="notes" className="py-32 bg-black/40 border-y border-[#c5a880]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#c5a880] mb-3 block">
                {dict.pyramidSection.anatomyLabel}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-widest uppercase mb-6 leading-tight min-h-[90px] md:min-h-[105px] flex flex-wrap items-center">
                <span className="mr-2 sm:mr-3">{dict.pyramidSection.title}</span> <span className="gold-gradient-text inline-block">{dict.pyramidSection.titleHighlight}</span>
              </h2>
              <p className="text-[#f5f0e6]/70 text-sm font-light leading-relaxed mb-8 min-h-[72px]">
                {dict.pyramidSection.desc}
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: dict.timeline.top,
                    description: dict.timeline.topDesc.toLowerCase().includes("first") 
                      ? "The initial, immediate impression. Light, volatile compounds like citruses and herbs that vaporize within 15 minutes." 
                      : "İlk, ani izlenim. Narenciye ve otlar gibi 15 dakika içinde buharlaşan hafif, uçucu bileşikler.",
                    percentage: dict.timeline.topDesc.toLowerCase().includes("first") ? "15-20% composition" : "%15-20 kompozisyon"
                  },
                  {
                    title: dict.timeline.heart,
                    description: dict.pyramidSection.midDesc,
                    percentage: dict.timeline.heartDesc.toLowerCase().includes("2") ? "60-70% composition" : "%60-70 kompozisyon"
                  },
                  {
                    title: dict.timeline.base,
                    description: dict.timeline.baseDesc.toLowerCase().includes("enduring") 
                      ? "The enduring foundation. Heavy molecules like woods, musks, and resins that ground the scent and can last on the skin for days." 
                      : "Kalıcı temel. Kokuyu sabitleyen ve ciltte günlerce kalabilen odunlar, miskler ve reçineler gibi ağır moleküller.",
                    percentage: dict.timeline.baseDesc.toLowerCase().includes("enduring") ? "15-20% composition" : "%15-20 kompozisyon"
                  }
                ].map((pyramidLevel, index) => (
                  <div key={index} className="flex gap-4 p-4 border border-[#c5a880]/10 bg-black/20 hover:border-[#c5a880]/30 transition-colors duration-300 rounded-sm">
                    <div className="text-[#c5a880] font-serif text-lg">0{index + 1}</div>
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-serif tracking-wider text-sm">{pyramidLevel.title}</h4>
                        <span className="text-[9px] tracking-wider text-[#c5a880]/60 uppercase">{pyramidLevel.percentage}</span>
                      </div>
                      <p className="text-xs text-[#f5f0e6]/60 font-light leading-relaxed">
                        {pyramidLevel.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Visual Pyramid Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center justify-center p-8 bg-[#c5a880]/5 border border-[#c5a880]/10 rounded-sm h-[450px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <Droplet className="w-5 h-5 text-[#c5a880]/30" />
              </div>
              
              {/* Graphic Pyramid */}
              <div className="w-full max-w-sm flex flex-col items-center gap-2 relative">
                {/* Level 1: Top */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 60 }}
                  onMouseEnter={() => setHoveredPyramidLevel(1)}
                  onMouseLeave={() => setHoveredPyramidLevel(null)}
                  className={`w-[40%] aspect-[4/1] bg-gradient-to-b from-[#e5cda8]/20 to-[#c5a880]/20 border flex items-center justify-center rounded-sm group cursor-default transition-colors duration-300 ${
                    hoveredPyramidLevel === 1 ? "border-[#e5cda8] bg-[#c5a880]/35 shadow-[0_0_15px_rgba(229,205,168,0.15)]" : "border-[#c5a880]/40"
                  }`}
                >
                  <span className="text-[10px] tracking-widest text-[#e5cda8] uppercase font-semibold">{dict.timeline.top.split(" (")[0]}</span>
                </motion.div>
                
                {/* Level 2: Mid */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.25, type: "spring", stiffness: 60 }}
                  onMouseEnter={() => setHoveredPyramidLevel(2)}
                  onMouseLeave={() => setHoveredPyramidLevel(null)}
                  className={`w-[70%] aspect-[5/1] bg-gradient-to-b from-[#c5a880]/15 to-[#8e7355]/15 border flex items-center justify-center rounded-sm group cursor-default transition-colors duration-300 ${
                    hoveredPyramidLevel === 2 ? "border-[#c5a880] bg-[#c5a880]/25 shadow-[0_0_15px_rgba(197,168,128,0.15)]" : "border-[#c5a880]/30"
                  }`}
                >
                  <span className="text-[10px] tracking-widest text-[#c5a880] uppercase font-semibold">{dict.timeline.heart.split(" (")[0]}</span>
                </motion.div>

                {/* Level 3: Base */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 60 }}
                  onMouseEnter={() => setHoveredPyramidLevel(3)}
                  onMouseLeave={() => setHoveredPyramidLevel(null)}
                  className={`w-full aspect-[6/1] bg-gradient-to-b from-[#8e7355]/10 to-transparent border flex items-center justify-center rounded-sm group cursor-default transition-colors duration-300 ${
                    hoveredPyramidLevel === 3 ? "border-[#8e7355] bg-[#c5a880]/15 shadow-[0_0_15px_rgba(142,115,85,0.15)]" : "border-[#c5a880]/25"
                  }`}
                >
                  <span className="text-[10px] tracking-widest text-[#8e7355] uppercase font-semibold">{dict.timeline.base.split(" (")[0]}</span>
                </motion.div>
              </div>

              {/* Dynamic details overlay block */}
              <div className="h-16 flex items-center justify-center mt-6 w-full max-w-xs relative">
                <AnimatePresence mode="wait">
                  {hoveredPyramidLevel === null ? (
                    <motion.p
                      key="default"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[9px] text-[#f5f0e6]/45 uppercase tracking-[0.25em] text-center"
                    >
                      {dict.pyramidSection.hoverText}
                    </motion.p>
                  ) : hoveredPyramidLevel === 1 ? (
                    <motion.div
                      key="level1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center"
                    >
                      <span className="text-[9px] tracking-widest text-[#e5cda8] uppercase font-semibold block mb-0.5">
                        {dict.timeline.topDesc.toLowerCase().includes("first") ? "Top: Light & Volatile" : "Üst: Hafif & Uçucu"}
                      </span>
                      <span className="text-[10px] text-[#f5f0e6]/70 leading-normal block">
                        {dict.timeline.topDesc.toLowerCase().includes("first") 
                          ? "Citruses, ozone, green leaves. Vaporizes within 15 mins." 
                          : "Narenciye, ozon, yeşil yapraklar. 15 dakika içinde buharlaşır."}
                      </span>
                    </motion.div>
                  ) : hoveredPyramidLevel === 2 ? (
                    <motion.div
                      key="level2"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center"
                    >
                      <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-semibold block mb-0.5">
                        {dict.pyramidSection.midHoverTitle}
                      </span>
                      <span className="text-[10px] text-[#f5f0e6]/70 leading-normal block">
                        {dict.pyramidSection.midHoverDesc}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="level3"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center"
                    >
                      <span className="text-[9px] tracking-widest text-[#8e7355] uppercase font-semibold block mb-0.5">
                        {dict.timeline.baseDesc.toLowerCase().includes("enduring") ? "Base: Dry Down Foundation" : "Dip: Kalıcı Temel"}
                      </span>
                      <span className="text-[10px] text-[#f5f0e6]/70 leading-normal block">
                        {dict.timeline.baseDesc.toLowerCase().includes("enduring") 
                          ? "Oud, sandalwood, vanilla, ambergris. Persists for days." 
                          : "Ud, sandal ağacı, vanilya, gri kehribar. Günlerce kalıcıdır."}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 text-center border-t border-[#c5a880]/10 pt-6 w-full max-w-xs">
                <p className="text-[9px] tracking-[0.2em] text-[#c5a880] uppercase mb-1 font-semibold">{dict.pyramidSection.didYouKnow}</p>
                <p className="text-[10px] text-[#f5f0e6]/50 font-light leading-relaxed">
                  {dict.pyramidSection.didYouKnowDesc}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community / The Scent Dialogue Section */}
      <section id="community" className="py-32 max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center mb-16 min-h-[140px] justify-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-widest uppercase mb-4 leading-tight min-h-[60px] flex items-center justify-center flex-wrap gap-x-3">
            {dict.community.dialogueTitle} <span className="gold-gradient-text inline-block">{dict.community.dialogueHighlight}</span>
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent mb-6" />
          <p className="max-w-xl text-[#f5f0e6]/60 text-xs md:text-sm tracking-wide font-light leading-relaxed min-h-[44px] flex items-center text-center justify-center">
            {dict.community.subtitle}
          </p>
        </div>

        {/* Reviews Showcase Grid */}
        {homeReviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-24 border border-[#c5a880]/10 rounded-sm bg-black/20"
          >
            <div className="w-12 h-12 rounded-full border border-[#c5a880]/20 flex items-center justify-center mb-6">
              <Star className="w-5 h-5 text-[#c5a880]/40" />
            </div>
            <p className="text-[#f5f0e6]/40 font-light text-xs tracking-[0.25em] uppercase text-center max-w-xs">
              {dict.community.emptyState}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {homeReviews.slice(0, visibleReviewCount).map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="p-6 glass-premium rounded-sm hover:border-[#c5a880]/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#c5a880]/15 flex items-center justify-center text-[10px] text-[#c5a880] font-semibold">
                          {review.user[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-medium block">{review.user}</span>
                          <span className="text-[9px] text-[#f5f0e6]/40">{review.date}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${i < review.rating ? "text-[#c5a880] fill-[#c5a880]" : "text-[#f5f0e6]/10"}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#f5f0e6]/70 leading-relaxed font-light italic mb-6">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-[#c5a880]/10 pt-4 flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider text-[#c5a880]/60">{dict.community.reviewFor}</span>
                    <span className="text-[10px] font-medium tracking-wide text-[#f5f0e6]">
                      {review.perfumeName} <span className="text-[#f5f0e6]/40">{dict.community.reviewBy} {review.brand}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More Pagination — non-jumping, luxury minimal style */}
            {visibleReviewCount < homeReviews.length && (
              <div className="flex flex-col items-center mt-12 mb-4 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleReviewCount(prev => prev + 3)}
                  className="tracking-[0.2em] text-xs font-medium text-[#c5a880]/70 hover:text-[#c5a880] transition-colors duration-300 uppercase cursor-pointer"
                >
                  {dict.community.loadMore}
                </button>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 text-[#c5a880]/50" />
                </motion.div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Scent Philosophy */}
      <section id="philosophy" className="py-32 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          {/* Subtle decoration lines with slow floating animation */}
          <motion.div 
            animate={{ y: [0, 25, 0] }}
            transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
            className="absolute top-10 left-1/4 w-[1px] h-[500px] bg-[#c5a880]" 
          />
          <motion.div 
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
            className="absolute bottom-10 right-1/4 w-[1px] h-[500px] bg-[#c5a880]" 
          />
        </div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] tracking-[0.35em] uppercase font-semibold text-[#c5a880] mb-4 block">
              {dict.philosophy.label}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-widest uppercase mb-8 leading-tight min-h-[50px] flex items-center justify-center flex-wrap gap-x-3">
              {dict.philosophy.title} <span className="gold-gradient-text inline-block">{dict.philosophy.titleHighlight}</span>
            </h2>
            <p className="text-[#f5f0e6]/75 text-sm md:text-base font-light leading-loose max-w-2xl mx-auto mb-10 min-h-[120px] flex items-center justify-center">
              &ldquo;{dict.philosophy.quote}&rdquo;
            </p>
            <div className="w-12 h-[1px] bg-[#c5a880] mx-auto mb-4" />
            <span className="font-serif text-xs italic tracking-wider text-[#c5a880]">{dict.philosophy.founders}</span>
          </motion.div>
        </div>
      </section>

      {/* Detailed View Modal (Interactive Feature) */}
      <AnimatePresence>
        {selectedPerfume && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedPerfume(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-[#0c0c0c] border border-[#c5a880]/20 max-w-3xl w-full rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Visual Spotlight (Dynamic Background) */}
              <div className="md:w-1/3 bg-gradient-to-br from-[#c5a880]/15 via-[#c5a880]/5 to-transparent p-6 flex flex-col justify-between border-r border-[#c5a880]/10 min-h-[450px] md:min-h-full">
                <div>
                  <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
                    {selectedPerfume.brand}
                  </span>
                  <h4 className="font-serif text-xl tracking-wider mb-2">
                    {selectedPerfume.name}
                  </h4>
                  <span className="text-[9px] tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm uppercase text-[#f5f0e6]/60">
                    {selectedPerfume.concentration}
                  </span>

                  {/* Scent Radar Chart */}
                  <div className="mt-8 mb-6 flex flex-col items-center">
                    <span className="text-[8px] tracking-[0.25em] uppercase text-[#c5a880]/80 self-start mb-3">
                      {language === "tr" ? "KOKU İMZASI" : "Scent Signature"}
                    </span>
                    {mounted ? (
                      <div className="w-full h-[200px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                            { subject: "Floral", value: selectedPerfume.olfactoryProfile.Floral },
                            { subject: "Woody", value: selectedPerfume.olfactoryProfile.Woody },
                            { subject: "Spicy", value: selectedPerfume.olfactoryProfile.Spicy },
                            { subject: "Fresh", value: selectedPerfume.olfactoryProfile.Fresh },
                            { subject: "Sweet", value: selectedPerfume.olfactoryProfile.Sweet }
                          ]}>
                            <PolarGrid stroke="rgba(197, 168, 128, 0.15)" />
                            <PolarAngleAxis 
                              dataKey="subject" 
                              tick={{ fill: "rgba(245, 240, 230, 0.6)", fontSize: 8, letterSpacing: "0.05em" }} 
                              tickFormatter={(value) => {
                                const key = value.toLowerCase() as keyof typeof dict.metrics;
                                return dict.metrics[key] || value;
                              }}
                            />
                            <Radar
                              name={selectedPerfume.name}
                              dataKey="value"
                              stroke="#c5a880"
                              fill="#c5a880"
                              fillOpacity={0.25}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-[9px] text-[#f5f0e6]/20 tracking-wider">
                        LOADING SIGNATURE...
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" />
                        <span className="text-xs font-semibold">{selectedPerfume.rating} / 5</span>
                      </div>
                      <span className="text-[9px] tracking-wider text-[#f5f0e6]/40 uppercase">
                        {language === "tr" ? "YAYINLANMA:" : "Released:"} {selectedPerfume.yearReleased}
                      </span>
                    </div>

                    {/* Shelf controls inside details drawer */}
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[9px] tracking-wider uppercase font-semibold">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedPerfume?.id) {
                            toggleWardrobe(selectedPerfume.id);
                          }
                        }}
                        className={`relative z-30 pointer-events-auto w-full px-4 py-2 border tracking-widest text-[10px] uppercase font-light transition-all duration-300 ${
                          wardrobeIds.includes(selectedPerfume.id)
                            ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                            : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent"
                        }`}
                      >
                        {wardrobeIds.includes(selectedPerfume.id) ? `✓ ${dict.addedToWardrobe}` : `+ ${dict.addToWardrobe}`}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedPerfume?.id) {
                            toggleFavorite(selectedPerfume.id);
                          }
                        }}
                        className={`relative z-30 pointer-events-auto w-full px-4 py-2 border tracking-widest text-[10px] uppercase font-light transition-all duration-300 ${
                          favoriteIds.includes(selectedPerfume.id)
                            ? "border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10"
                            : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent"
                        }`}
                      >
                        {favoriteIds.includes(selectedPerfume.id) ? `★ ${dict.addedToFavorites}` : `+ ${dict.addToFavorites}`}
                      </button>
                    </div>

                    {/* Custom Lists select inside details drawer */}
                    {currentUser.customLists.length > 0 && (
                      <div className="mt-1">
                        <label className="text-[8px] tracking-widest text-[#f5f0e6]/45 uppercase block mb-1">{language === "tr" ? "ÖZEL KÜRASYONA EKLE:" : "ADD TO CUSTOM CURATION:"}</label>
                        <div className="flex flex-wrap gap-1">
                          {currentUser.customLists.map(list => {
                            const hasPerfume = list.perfumeIds.includes(selectedPerfume.id);
                            return (
                              <button
                                key={list.id}
                                onClick={() => {
                                  hasPerfume 
                                    ? removePerfumeFromList(list.id, selectedPerfume.id) 
                                    : addPerfumeToList(list.id, selectedPerfume.id);
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

                  <Link
                    href={`/perfume/${selectedPerfume.id}`}
                    className="w-full py-3 bg-[#c5a880] hover:bg-[#e5cda8] text-black text-[9px] tracking-[0.2em] uppercase font-bold text-center rounded-sm transition-all duration-300 block shadow-lg shadow-[#c5a880]/10"
                  >
                    {dict.matrix.clear === "CLEAR" ? "Full Discussion" : "Tüm İnceleme"} →
                  </Link>
                </div>
              </div>

              {/* Right Column: Detailed Olfactory Pyramid and Reviews */}
              <div className="md:w-2/3 p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[600px]">
                <div>
                  {/* Close button */}
                  <div className="flex justify-between items-start mb-6">
                    <h5 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold">{dict.blueprint.title}</h5>
                    <button 
                      onClick={() => setSelectedPerfume(null)}
                      className="text-xs text-[#f5f0e6]/50 hover:text-white uppercase tracking-widest cursor-pointer"
                    >
                      {dict.perfumePage.closeModal} ×
                    </button>
                  </div>

                  <p className="text-xs text-[#f5f0e6]/70 leading-relaxed font-light mb-8">
                    {language === "tr"
                      ? ((selectedPerfume as any).description_tr || (selectedPerfume as any).mainDescriptionTr || selectedPerfume.description)
                      : ((selectedPerfume as any).description_en || (selectedPerfume as any).mainDescriptionEn || selectedPerfume.description)}
                  </p>

                  {/* Olfactory Blueprint Horizontal Diagnostics Bar */}
                  <div className="flex flex-wrap items-center gap-6 py-4 border-b border-white/[0.05] mb-6 text-[11px] tracking-wider uppercase">
                    {/* Performance Section */}
                    <div className="flex items-center gap-3 pr-6 border-r border-white/[0.05] shrink-0">
                      <span className="border border-white/[0.06] bg-white/[0.02] text-white/70 px-3 py-1 rounded-full whitespace-nowrap">
                        {dict.blueprint.sillage}: {selectedPerfume.sillage || "—"}
                      </span>
                      <span className="border border-white/[0.06] bg-white/[0.02] text-white/70 px-3 py-1 rounded-full whitespace-nowrap">
                        {dict.blueprint.longevity}: {selectedPerfume.longevity || "—"}
                      </span>
                    </div>
                     {/* Environment Section */}
                    <div className="flex flex-wrap items-center gap-4 text-white/60">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#c5a880]/80">{dict.blueprint.seasons}:</span>
                        <span>{selectedPerfume.seasons?.map(s => translateRaw(s, language === "tr")).join(", ") || "—"}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#c5a880]/80">{dict.blueprint.occasions}:</span>
                        <span>{selectedPerfume.occasions?.map(o => translateRaw(o, language === "tr")).join(", ") || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Olfactory Diagram */}
                  <div className="space-y-4 mb-8">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] tracking-[0.2em] text-[#e5cda8] uppercase font-medium">{dict.timeline.top}</span>
                        <span className="text-[9px] text-[#f5f0e6]/30 uppercase">{dict.timeline.topDesc}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPerfume.notes.top.map(note => (
                          <span key={note} className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-sm text-[#f5f0e6]/80">
                            {translateRaw(note, language === "tr")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] tracking-[0.2em] text-[#c5a880] uppercase font-medium">{dict.timeline.heart}</span>
                        <span className="text-[9px] text-[#f5f0e6]/30 uppercase">{dict.timeline.heartDesc}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPerfume.notes.mid.map(note => (
                          <span key={note} className="text-[10px] bg-[#c5a880]/5 border border-[#c5a880]/10 px-2.5 py-1 rounded-sm text-[#c5a880]">
                            {translateRaw(note, language === "tr")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] tracking-[0.2em] text-[#8e7355] uppercase font-medium">{dict.timeline.base}</span>
                        <span className="text-[9px] text-[#f5f0e6]/30 uppercase">{dict.timeline.baseDesc}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPerfume.notes.base.map(note => (
                          <span key={note} className="text-[10px] bg-black/40 border border-[#8e7355]/20 px-2.5 py-1 rounded-sm text-[#e5cda8]/60">
                            {translateRaw(note, language === "tr")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reviews inside Modal */}
                  <div>
                    <h6 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold mb-4">
                      {dict.perfumePage.communityAnalysis} ({selectedPerfume.reviews.length})
                    </h6>
                    <div className="space-y-4">
                      {selectedPerfume.reviews.map(review => (
                        <div key={review.id} className="p-4 bg-white/5 rounded-sm border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-semibold text-[#c5a880]">{review.user}</span>
                            <span className="text-[8px] text-[#f5f0e6]/40">{review.date}</span>
                          </div>
                          <p className="text-xs font-light text-[#f5f0e6]/70 leading-relaxed italic">
                            &ldquo;{translateComment(review.comment, language === "tr")}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-black border-t border-[#c5a880]/15 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <span className="font-serif text-xl tracking-[0.25em] gold-gradient-text uppercase font-bold block mb-4">
                {dict.hero.title}
              </span>
              <p className="max-w-sm text-xs font-light text-[#f5f0e6]/50 leading-relaxed mb-6">
                {dict.footer.desc}
              </p>
              <div className="flex gap-4">
                <span className="text-[10px] tracking-widest text-[#c5a880] cursor-pointer hover:text-white transition-colors">INSTAGRAM</span>
                <span className="text-[10px] tracking-widest text-[#c5a880] cursor-pointer hover:text-white transition-colors">TWITTER</span>
                <span className="text-[10px] tracking-widest text-[#c5a880] cursor-pointer hover:text-white transition-colors">PINTEREST</span>
              </div>
            </div>

            <div>
              <h5 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#c5a880] mb-4">{dict.footer.navTitle}</h5>
              <ul className="space-y-2 text-xs font-light text-[#f5f0e6]/60">
                <li><a href="#encyclopedia" className="hover:text-[#c5a880] transition-colors">{dict.nav.encyclopedia}</a></li>
                <li><a href="#notes" className="hover:text-[#c5a880] transition-colors">{dict.footer.olfactoryPyramid}</a></li>
                <li><a href="#community" className="hover:text-[#c5a880] transition-colors">{dict.nav.community}</a></li>
                <li><a href="#philosophy" className="hover:text-[#c5a880] transition-colors">{dict.footer.philosophy}</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#c5a880] mb-4">{dict.footer.newsletterTitle}</h5>
              <p className="text-xs font-light text-[#f5f0e6]/50 leading-relaxed mb-4">
                {dict.footer.newsletterDesc}
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder={dict.footer.inputPlaceholder} 
                  className="bg-neutral-900 border border-[#c5a880]/20 rounded-l-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880] w-full"
                />
                <button className="bg-[#c5a880] text-black text-[10px] font-bold tracking-widest uppercase px-4 rounded-r-sm hover:bg-[#e5cda8] transition-colors">
                  {dict.footer.joinBtn}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#c5a880]/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#f5f0e6]/30 tracking-widest uppercase">
            <span>© {new Date().getFullYear()} {dict.hero.title}. {dict.footer.rights}</span>
            <div className="flex gap-6">
              <span className="cursor-pointer hover:text-[#c5a880] transition-colors">{dict.footer.privacy}</span>
              <span className="cursor-pointer hover:text-[#c5a880] transition-colors">{dict.footer.terms}</span>
            </div>
          </div>
        </div>
      </footer>

      </div>{/* end main content offset wrapper */}
    </div>
  );
}

