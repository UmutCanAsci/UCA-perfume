"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Award,
  RefreshCw,
  Star,
  Check,
  Plus
} from "lucide-react";
import { useScentSphere } from "@/components/ScentSphereContext";
import { translateRaw } from "@/data/translations";
import type { WizardAnswers } from "@/lib/matchmaking";
import type { Perfume } from "@/types/perfume";

interface RecommendationResult {
  perfume: Perfume;
  percentage: number;
}

const vibes = [
  { id: "Silk", title: "Silk", desc: "Soft & Elegant", detail: "Notes of clean linen, powdery iris, and delicate white musk." },
  { id: "Smoke", title: "Smoke", desc: "Mysterious & Deep", detail: "Smoky incense, dark leather, heavy woods, and warm resins." },
  { id: "Rain", title: "Rain", desc: "Fresh & Clean", detail: "Ocean breeze, wet green leaves, and dew-drenched minerals." },
  { id: "Sun", title: "Sun", desc: "Warm & Bright", detail: "Zesty citrus, sunny bergamot, sweet amber, and tropical warmth." },
  { id: "Forest", title: "Forest", desc: "Natural & Earthy", detail: "Damp oakmoss, green pine needles, dry cedar, and vetiver roots." },
  { id: "Spice", title: "Spice", desc: "Bold & Passionate", detail: "Hot cardamom, black pepper, exotic saffron, and warm cinnamon." }
];

const styles = [
  { id: "Minimalist", title: "The Minimalist", desc: "Clean & Subtle", detail: "Skin scents that whisper, sitting close for intimate projection." },
  { id: "Charismatic", title: "The Charismatic", desc: "Bold & Unforgettable", detail: "Powerful compositions that announce your presence in a room." },
  { id: "Free Spirit", title: "The Free Spirit", desc: "Energetic & Sporty", detail: "Crisp citrus and marine notes that feel refreshing and alive." },
  { id: "Romantic", title: "The Romantic", desc: "Graceful & Floral", detail: "Exquisite rose, jasmine, and blooming peony formulas." }
];

const occasions = ["Daily Wear", "Special Occasion", "Office / Work", "Date Night", "Night Out"];
const seasons = ["Spring", "Summer", "Autumn", "Winter", "All Seasons"];
const genders = ["Feminine", "Masculine", "Unisex"];
const intensities = ["Light", "Moderate", "Rich / Intense"];
const sillages = ["Skin Scent (Subtle & Close)", "Moderate Signature (Noticeable)", "Beast Mode (Powerfully Long-Lasting)"];
const dressCodes = ["Formal (Suit & Tie)", "Edgy (Leather Jacket)", "Casual (Relaxed)"];

export default function ConsultantPage() {
  const { currentUser, addToWardrobe, language, toggleLanguage, t } = useScentSphere();
  
  // State for wizard steps
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [mounted, setMounted] = useState(false);
  const [isFormulating, setIsFormulating] = useState(false);

  // Heuristic Input states
  const [selectedVibe, setSelectedVibe] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("Daily Wear");
  const [selectedSeason, setSelectedSeason] = useState("All Seasons");
  const [selectedGender, setSelectedGender] = useState("Unisex");
  const [selectedIntensity, setSelectedIntensity] = useState("Moderate");
  const [selectedSillage, setSelectedSillage] = useState("Moderate Signature (Noticeable)");
  const [selectedDressCode, setSelectedDressCode] = useState("Casual (Relaxed)");
  const [preferredNotesText, setPreferredNotesText] = useState("");

  const [results, setResults] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setSelectedVibe("");
    setSelectedStyle("");
    setSelectedOccasion("Daily Wear");
    setSelectedSeason("All Seasons");
    setSelectedGender("Unisex");
    setSelectedIntensity("Moderate");
    setSelectedSillage("Moderate Signature (Noticeable)");
    setSelectedDressCode("Casual (Relaxed)");
    setPreferredNotesText("");
    setResults([]);
    setDirection(-1);
    setStep(1);
    setIsFormulating(false);
  };

  // ── Weighted Matchmaking Engine — now powered by MySQL via /api/consultant ──
  const calculateOlfactoryPrescription = () => {
    setIsFormulating(true);

    const answers: WizardAnswers = {
      vibe:               selectedVibe,
      style:              selectedStyle,
      occasion:           selectedOccasion,
      season:             selectedSeason,
      gender:             selectedGender,
      intensity:          selectedIntensity,
      sillage:            selectedSillage,
      dressCode:          selectedDressCode,
      preferredNotesText: preferredNotesText,
    };

    // Theatrical delay so the "Formulating…" animation plays in full,
    // then fire the DB-backed matchmaking request in parallel.
    const delay = new Promise<void>((resolve) => setTimeout(resolve, 2000));

    Promise.all([
      delay,
      fetch("/api/consultant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(answers),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .catch((err) => {
          console.error("[consultant] API error:", err);
          return [] as RecommendationResult[];
        }),
    ]).then(([, top3]) => {
      setResults(top3 as RecommendationResult[]);
      setDirection(1);
      setStep(4); // navigate to results view
      setIsFormulating(false);
    });
  };


  const stepsVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    })
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  if (isFormulating) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-[#f5f0e6] flex flex-col items-center justify-center p-6 selection:bg-[#c5a880] selection:text-black relative overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.15]"
            src="/assets/consultant-bg.mp4"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6 max-w-md relative z-10"
        >
          {/* Animated Gold Pulse Rings */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-[#c5a880]/30"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full border border-[#c5a880]/60"
            />
            <Sparkles className="w-8 h-8 text-[#c5a880] animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif text-lg tracking-widest uppercase font-semibold text-white">{t("formulating")}</h3>
            <p className="text-[10px] text-[#c5a880]/80 tracking-widest uppercase animate-pulse">{t("formulatingDesc")}</p>
          </div>
          
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent mx-auto mt-4" />
          <p className="text-[10px] text-[#f5f0e6]/45 leading-relaxed font-light uppercase tracking-widest">
            {language === 'tr'
              ? "Katalog notaları filtreleniyor, yayılım zarfları eşleştiriliyor ve mevsimsel parametreler analiz ediliyor."
              : "Filtering catalog notes, matching sillage envelopes, and evaluating seasonal parameters"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.2]"
          src="/assets/consultant-bg.mp4"
        />
        {/* Dark luxury overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-[#0F0F10]/50 to-[#0F0F10]/80" />
      </div>
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#c5a880]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-xs tracking-[0.2em] uppercase font-light text-[#f5f0e6]/70 hover:text-[#c5a880] transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("backToLibrary")}
          </Link>

          <Link href="/" className="font-serif text-2xl tracking-[0.2em] gold-gradient-text uppercase font-bold">
            UCA
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-[10px] tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer bg-transparent border-0 uppercase font-semibold select-none"
              title={language === "en" ? "Dil değiştir: Türkçe" : "Switch language: English"}
            >
              {language === "en" ? "EN" : "TR"}
            </button>
            <Link href="/consultant" className="text-xs tracking-[0.2em] uppercase font-light text-[#c5a880] border border-[#c5a880] px-3 py-1 rounded-sm">
              {t("scentConsultant")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-36 pb-20 w-full flex-1 flex flex-col justify-center relative z-10">
        {step < 4 && (
          <div className="w-full max-w-2xl mx-auto mb-10">
            {/* Step progress bar */}
            <div className="flex justify-between items-center text-[10px] tracking-[0.25em] text-[#c5a880] uppercase font-bold mb-3">
              <span>{t("olfactoryDiagnosticsLabel")}</span>
              <span>{t("stepOf")} {step} {t("of")} 3</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#c5a880] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ type: "spring", stiffness: 85, damping: 15 }}
              />
            </div>
          </div>
        )}

        <div className="w-full">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepsVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] mb-2 block">{t("stepOf")} 1</span>
                  <h2 className="font-serif text-2xl md:text-4xl tracking-wider font-bold">{t("step1Title")}</h2>
                  <p className="text-xs text-[#f5f0e6]/50 tracking-wider mt-1.5">{t("step1Desc")}</p>
                </div>

                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
                >
                  {vibes.map(v => (
                    <motion.button
                      variants={fadeInUp}
                      whileHover={{ 
                        y: -4, 
                        scale: 1.015, 
                        borderColor: "rgba(212, 175, 55, 0.45)", 
                        boxShadow: "0 0 20px rgba(212, 175, 55, 0.15)" 
                      }}
                      whileTap={{ scale: 0.99 }}
                      key={v.id}
                      onClick={() => setSelectedVibe(v.id)}
                      className={`p-6 rounded-sm text-left border flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden group transition-all duration-300 ${
                        selectedVibe === v.id
                          ? "border-[#D4AF37]/50 bg-[#D4AF37]/5"
                          : "border-white/[0.05] bg-white/[0.02] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                      }`}
                    >
                      {selectedVibe === v.id && (
                        <span className="absolute top-3 right-3 text-[#c5a880]">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-1 group-hover:text-[#e5cda8] transition-colors">
                          {language === 'tr'
                            ? v.id === 'Silk' ? 'İPEK'
                              : v.id === 'Smoke' ? 'DUMAN'
                              : v.id === 'Rain' ? 'YAĞMUR'
                              : v.id === 'Sun' ? 'GÜNEŞ'
                              : v.id === 'Forest' ? 'ORMAN'
                              : 'BAHARAT'
                            : v.title}
                        </span>
                        <h4 className="font-serif text-sm font-semibold tracking-wide text-white mb-2">
                          {language === 'tr'
                            ? v.id === 'Silk' ? 'ZARİF & YUMUŞAK'
                              : v.id === 'Smoke' ? 'GİZEMLİ & DERİN'
                              : v.id === 'Rain' ? 'TAZE & SAF'
                              : v.id === 'Sun' ? 'SICAK & IŞILTILI'
                              : v.id === 'Forest' ? 'DOĞAL & TOPRAKSI'
                              : 'İDDİALI & TUTKULU'
                            : v.desc}
                        </h4>
                      </div>
                      <p className="text-[10px] text-[#f5f0e6]/40 leading-relaxed font-light">
                        {language === 'tr'
                          ? v.id === 'Silk' ? 'Temiz keten, pudramsı nergis ve narin beyaz misk notaları.'
                            : v.id === 'Smoke' ? 'Tütsü esintisi, koyu deri, yoğun odunsu dokular ve sıcak reçineler.'
                            : v.id === 'Rain' ? 'Okyanus esintisi, ıslak yeşil yapraklar ve čiy damlalarıyla bezeli mineraller.'
                            : v.id === 'Sun' ? 'Canlandırıcı narenciye, güneşli bergamot, tatlı kehribar ve tropikal sıcaklık.'
                            : v.id === 'Forest' ? 'Nemli meşe yosunu, yeşil çam iğneleri, kuru sedir ağacı ve vetiver kökleri.'
                            : 'Kızgın kakule, karabiber, egzotik safran ve sıcak tarçın notaları.'
                          : v.detail}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>

                <div className="flex justify-end max-w-4xl mx-auto">
                  <button
                    disabled={!selectedVibe}
                    onClick={handleNext}
                    className={`px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 flex items-center gap-2 ${
                      selectedVibe
                        ? "bg-[#c5a880] text-black hover:bg-[#e5cda8] cursor-pointer shadow-lg shadow-[#c5a880]/10"
                        : "bg-neutral-800 text-[#f5f0e6]/20 border border-white/5 cursor-not-allowed"
                    }`}
                  >
                    {t("nextStep")} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepsVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] mb-2 block">{t("stepOf")} 2</span>
                  <h2 className="font-serif text-2xl md:text-4xl tracking-wider font-bold">{t("step2Title")}</h2>
                  <p className="text-xs text-[#f5f0e6]/50 tracking-wider mt-1.5">{t("step2Desc")}</p>
                </div>

                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10"
                >
                  {styles.map(s => (
                    <motion.button
                      variants={fadeInUp}
                      whileHover={{ 
                        y: -4, 
                        scale: 1.015, 
                        borderColor: "rgba(212, 175, 55, 0.45)", 
                        boxShadow: "0 0 20px rgba(212, 175, 55, 0.15)" 
                      }}
                      whileTap={{ scale: 0.985 }}
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`p-6 rounded-sm text-left border flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden group transition-all duration-300 ${
                        selectedStyle === s.id
                          ? "border-[#D4AF37]/50 bg-[#D4AF37]/5"
                          : "border-white/[0.05] bg-white/[0.02] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                      }`}
                    >
                      {selectedStyle === s.id && (
                        <span className="absolute top-3 right-3 text-[#c5a880]">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-1 group-hover:text-[#e5cda8] transition-colors">
                          {language === 'tr'
                            ? s.id === 'Minimalist' ? 'MİNİMALİST'
                              : s.id === 'Charismatic' ? 'KARİZMATİK'
                              : s.id === 'Free Spirit' ? 'ÖZGÜR RUH'
                              : 'ROMANTİK'
                            : s.title}
                        </span>
                        <h4 className="font-serif text-sm font-semibold tracking-wide text-white mb-2">
                          {language === 'tr'
                            ? s.id === 'Minimalist' ? 'TEMİZ & ZARİF'
                              : s.id === 'Charismatic' ? 'GÜÇLÜ & UNUTULMAZ'
                              : s.id === 'Free Spirit' ? 'ENERJİK & SPORTİF'
                              : 'ZARİF & ÇİÇEKSİ'
                            : s.desc}
                        </h4>
                      </div>
                      <p className="text-[10px] text-[#f5f0e6]/40 leading-relaxed font-light">
                        {language === 'tr'
                          ? s.id === 'Minimalist' ? 'Tenle bütünleşerek fısıldayan, sadece en yakındakilerin hissedebileceği mahrem bir iz.'
                            : s.id === 'Charismatic' ? 'Girdiğiniz her ortamda varlığınızı ilan eden, yüksek fark edilirliğe sahip güçlü kompozisyonlar.'
                            : s.id === 'Free Spirit' ? 'Canlandırıcı ve hayat dolu hissettiren, gevrek narenciye ve deniz notaları.'
                            : 'Seçkin gül, yasemin ve yeni açmış şakayık formüllerinin büyüleyici uyumu.'
                          : s.detail}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>

                <div className="flex justify-between max-w-4xl mx-auto">
                  <button
                    onClick={handleBack}
                    className="px-8 py-3.5 border border-[#c5a880]/20 hover:border-[#c5a880] text-[#f5f0e6] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("back")}
                  </button>
                  <button
                    disabled={!selectedStyle}
                    onClick={handleNext}
                    className={`px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 flex items-center gap-2 ${
                      selectedStyle
                        ? "bg-[#c5a880] text-black hover:bg-[#e5cda8] cursor-pointer shadow-lg shadow-[#c5a880]/10"
                        : "bg-neutral-800 text-[#f5f0e6]/20 border border-white/5 cursor-not-allowed"
                    }`}
                  >
                    {t("nextStep")} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepsVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-8">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] mb-2 block">{t("stepOf")} 3</span>
                  <h2 className="font-serif text-2xl md:text-4xl tracking-wider font-bold">{t("step3Title")}</h2>
                  <p className="text-xs text-[#f5f0e6]/50 tracking-wider mt-1.5">{t("step3Desc")}</p>
                </div>

                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="glass-premium p-6 md:p-8 rounded-sm space-y-6 border border-[#c5a880]/10 mb-10 bg-black/10"
                >
                  {/* Occasion */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("occasion")}</span>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map(o => (
                        <button
                          key={o}
                          onClick={() => setSelectedOccasion(o)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedOccasion === o
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (o === 'Daily Wear' ? 'Günlük' : o === 'Special Occasion' ? 'Özel Davet' : o === 'Office / Work' ? 'Ofis / İş' : o === 'Date Night' ? 'Buluşma Gecesi' : 'Gece Eğlencesi') : o}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Season */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("season")}</span>
                    <div className="flex flex-wrap gap-2">
                      {seasons.map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSeason(s)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedSeason === s
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (s === 'Spring' ? 'İlkbahar' : s === 'Summer' ? 'Yaz' : s === 'Autumn' ? 'Sonbahar' : s === 'Winter' ? 'Kış' : 'Tüm Mevsimler') : s}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Gender preference */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("genderAudienceProfile")}</span>
                    <div className="flex flex-wrap gap-2">
                      {genders.map(g => (
                        <button
                          key={g}
                          onClick={() => setSelectedGender(g)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedGender === g
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (g === 'Feminine' ? 'Feminen' : g === 'Masculine' ? 'Maskülen' : 'Unisex') : g}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Intensity */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("concentrationIntensity")}</span>
                    <div className="flex flex-wrap gap-2">
                      {intensities.map(i => (
                        <button
                          key={i}
                          onClick={() => setSelectedIntensity(i)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedIntensity === i
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (i === 'Light' ? 'Hafif' : i === 'Moderate' ? 'Dengeli' : 'Yoğun / Yoğun (Intense)') : i}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Sillage & Longevity */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("sillageAndLongevityTarget")}</span>
                    <div className="flex flex-wrap gap-2">
                      {sillages.map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSillage(s)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedSillage === s
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (s === 'Skin Scent (Subtle & Close)' ? 'Ten Kokusu (Zarif & Yakın)' : s === 'Moderate Signature (Noticeable)' ? 'İmza Koku (Belirgin & Dengeli)' : 'Yüksek Performans (Çok Kalıcı)') : s}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Dress Code */}
                  <motion.div variants={fadeInUp}>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-2.5">{t("aestheticDressCode")}</span>
                    <div className="flex flex-wrap gap-2">
                      {dressCodes.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDressCode(d)}
                          className={`px-4 py-1.5 rounded-full text-[9px] tracking-wider transition-all duration-300 border cursor-pointer ${
                            selectedDressCode === d
                              ? "bg-[#c5a880] text-black border-[#c5a880] font-semibold"
                              : "bg-black/20 border-white/5 text-[#f5f0e6]/50 hover:border-white/10"
                          }`}
                        >
                          {language === 'tr' ? (d.toLowerCase().includes('formal') ? 'Resmi / Klasik' : d.toLowerCase().includes('edgy') ? 'Asi / Aykırı' : 'Gündelik / Rahat') : d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                <div className="flex justify-between max-w-3xl mx-auto">
                  <button
                    onClick={handleBack}
                    className="px-8 py-3.5 border border-[#c5a880]/20 hover:border-[#c5a880] text-[#f5f0e6] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t("back")}
                  </button>
                  <button
                    onClick={calculateOlfactoryPrescription}
                    className="px-8 py-3.5 bg-[#c5a880] text-black hover:bg-[#e5cda8] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#c5a880]/15 font-bold"
                  >
                    {t("generatePrescription")} <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepsVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-5xl mx-auto w-full relative"
              >
                {/* Floating Gold Particles Accent */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden h-[600px] w-full">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 0, 
                        y: 400, 
                        x: (i * 80) - 480,
                        scale: 0.5
                      }}
                      animate={{ 
                        opacity: [0, 0.4, 0],
                        y: -150,
                      }}
                      transition={{
                        duration: i % 2 === 0 ? 6 : 8,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                      className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-[#c5a880]/40 blur-[0.5px]"
                    />
                  ))}
                </div>

                <div className="text-center mb-12 relative z-10">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] mb-2 block">{t("sensoryDiagnosticsComplete")}</span>
                  <h2 className="font-serif text-3xl md:text-5xl tracking-wider font-bold">{t("yourOlfactoryPrescription")}</h2>
                  <p className="text-xs text-[#f5f0e6]/50 tracking-wider mt-2">
                    {language === 'tr' ? "Analiz sonuçlarınıza göre karakterinizi yansıtan, yüksek sanatsal değere sahip özel koku seçimi." : t("prescriptionDesc")}
                  </p>
                </div>

                {/* Top Match: Standalone Centerpiece */}
                {results[0] && (() => {
                  const topMatch = results[0];
                  const isInWardrobe = currentUser.wardrobe.includes(topMatch.perfume.id);
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
                      className="relative backdrop-blur-xl bg-white/[0.02] border border-[#c5a880]/30 shadow-[0_0_50px_rgba(212,175,55,0.12)] p-8 rounded-sm overflow-hidden mb-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 z-10"
                    >
                      {/* Premium gold top line highlight */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                      
                      {/* Amber Gold Glow Backdrop */}
                      <div 
                        className="absolute inset-0 z-0 pointer-events-none opacity-80" 
                        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }} 
                      />

                      {/* Rank / Identity */}
                      <div className="relative z-10 flex-1 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] block mb-1">
                              {topMatch.perfume.brand}
                            </span>
                            <h3 className="font-serif text-2xl md:text-3xl font-bold tracking-wide text-white">
                              {topMatch.perfume.name}
                            </h3>
                          </div>
                          <div className="px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-xs font-semibold text-[#D4AF37] tracking-widest uppercase rounded-sm shadow-[0_0_12px_rgba(212,175,55,0.25)] flex flex-col items-center justify-center">
                            <span className="text-lg font-serif font-bold leading-none">
                              {language === 'tr' ? `%${topMatch.percentage}` : `${topMatch.percentage}%`}
                            </span>
                            <span className="text-[8px] mt-1 font-sans">
                              {language === 'tr' ? "UYUM" : "Match"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm text-[#f5f0e6]/50 uppercase">
                            {topMatch.perfume.concentration}
                          </span>
                          <span className="text-[9px] bg-[#c5a880]/5 border border-[#c5a880]/10 px-2 py-0.5 rounded-sm text-[#c5a880] uppercase">
                            {topMatch.perfume.gender}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="w-3 h-3 fill-[#c5a880] text-[#c5a880]" />
                            <span className="text-[10px] font-semibold text-white">{topMatch.perfume.rating}</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#f5f0e6]/65 leading-relaxed font-light">
                          {language === "tr" ? topMatch.perfume.description_tr : topMatch.perfume.description_en}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5 items-center">
                          <button
                            onClick={() => addToWardrobe(topMatch.perfume.id)}
                            className={`w-full sm:w-auto px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold border rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                              isInWardrobe
                                ? "bg-transparent border-green-800/40 text-green-400"
                                : "bg-[#D4AF37] hover:bg-[#e5cda8] border-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.25)] font-bold"
                            }`}
                          >
                            {isInWardrobe ? (
                              <>
                                <Check className="w-4 h-4" /> {t("inPersonalCollection")}
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> {t("addToPersonalCollection")}
                              </>
                            )}
                          </button>

                          <Link 
                            href={`/perfume/${topMatch.perfume.id}`}
                            className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#c5a880] hover:text-[#e5cda8] transition-colors duration-300 flex items-center gap-1.5 py-3"
                          >
                            {language === 'tr' ? "DETAYLARI GÖR" : "VIEW BLUEPRINT"} <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Right Timeline details */}
                      <div className="relative z-10 w-full md:w-80 border-t md:border-t-0 md:border-l border-[#c5a880]/15 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
                        <span className="text-[9px] tracking-[0.2em] text-[#c5a880] uppercase block mb-3 font-semibold">
                          {language === 'tr' ? "KOKU PİRAMİDİ" : "EVAPORATION TIMELINE"}
                        </span>
                        
                        <div className="space-y-4 text-xs font-light">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[#f5f0e6]/45 block mb-1">
                              {language === 'tr' ? "Üst Notalar (Açılış)" : "Top Notes"}
                            </span>
                            <span className="text-white font-medium">
                              {(language === 'tr'
                                ? ((topMatch.perfume as any).notes_tr?.top ?? topMatch.perfume.notes.top)
                                : ((topMatch.perfume as any).notes_en?.top ?? topMatch.perfume.notes.top)
                              ).join(", ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[#f5f0e6]/45 block mb-1">
                              {language === 'tr' ? "Orta Notalar (Kalp)" : "Heart Notes"}
                            </span>
                            <span className="text-white font-medium">
                              {(language === 'tr'
                                ? ((topMatch.perfume as any).notes_tr?.mid ?? topMatch.perfume.notes.mid)
                                : ((topMatch.perfume as any).notes_en?.mid ?? topMatch.perfume.notes.mid)
                              ).join(", ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[#f5f0e6]/45 block mb-1">
                              {language === 'tr' ? "Alt Notalar (Dip)" : "Base Notes"}
                            </span>
                            <span className="text-white font-medium">
                              {(language === 'tr'
                                ? ((topMatch.perfume as any).notes_tr?.base ?? topMatch.perfume.notes.base)
                                : ((topMatch.perfume as any).notes_en?.base ?? topMatch.perfume.notes.base)
                              ).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Symmetrical Flanks: Alternative Discoveries */}
                <div className="text-center mt-12 mb-6">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-[#c5a880]/60">
                    {language === 'tr' ? "ALTERNATİF KEŞİFLER" : "ALTERNATIVE CHOICES"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
                  {results.slice(1, 3).map((res, index) => {
                    const isInWardrobe = currentUser.wardrobe.includes(res.perfume.id);
                    return (
                      <motion.div
                        key={res.perfume.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.2, duration: 0.6 } }}
                        className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-6 rounded-sm flex flex-col justify-between relative hover:border-[#c5a880]/30 transition-all duration-300 shadow-md group"
                      >
                        {/* Rating & Match */}
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[8px] tracking-[0.25em] uppercase text-[#c5a880] block">
                            {res.perfume.brand}
                          </span>
                          <span className="text-[10px] text-[#c5a880] tracking-widest uppercase bg-[#c5a880]/5 px-2 py-0.5 border border-[#c5a880]/10 rounded-sm font-semibold">
                            {language === 'tr' ? `%${res.percentage} UYUM` : `${res.percentage}% MATCH`}
                          </span>
                        </div>

                        {/* Title & info */}
                        <div className="space-y-3">
                          <h4 className="font-serif text-lg font-bold text-white tracking-wide line-clamp-1">
                            {res.perfume.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-white/5 px-2 py-0.5 text-[#f5f0e6]/40 uppercase">
                              {res.perfume.concentration}
                            </span>
                            <div className="flex items-center gap-1 ml-2">
                              <Star className="w-3 h-3 fill-[#c5a880] text-[#c5a880]" />
                              <span className="text-[10px] font-semibold text-white">{res.perfume.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#f5f0e6]/50 leading-relaxed font-light line-clamp-3">
                            {language === "tr" ? res.perfume.description_tr : res.perfume.description_en}
                          </p>
                        </div>

                        {/* Evaporation timeline summary */}
                        <div className="border-t border-white/5 py-3 my-4 space-y-1.5 text-[10px] font-light">
                          <div className="flex justify-between">
                            <span className="text-[#f5f0e6]/30 uppercase tracking-wide">
                              {language === 'tr' ? "Üst Notalar (Açılış):" : "Top:"}
                            </span>
                            <span className="text-[#f5f0e6]/70 truncate max-w-[200px]">
                              {(language === 'tr'
                                ? ((res.perfume as any).notes_tr?.top ?? res.perfume.notes.top)
                                : ((res.perfume as any).notes_en?.top ?? res.perfume.notes.top)
                              ).join(", ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#f5f0e6]/30 uppercase tracking-wide">
                              {language === 'tr' ? "Orta Notalar (Kalp):" : "Heart:"}
                            </span>
                            <span className="text-[#f5f0e6]/70 truncate max-w-[200px]">
                              {(language === 'tr'
                                ? ((res.perfume as any).notes_tr?.mid ?? res.perfume.notes.mid)
                                : ((res.perfume as any).notes_en?.mid ?? res.perfume.notes.mid)
                              ).join(", ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#f5f0e6]/30 uppercase tracking-wide">
                              {language === 'tr' ? "Alt Notalar (Dip):" : "Base:"}
                            </span>
                            <span className="text-[#f5f0e6]/70 truncate max-w-[200px]">
                              {(language === 'tr'
                                ? ((res.perfume as any).notes_tr?.base ?? res.perfume.notes.base)
                                : ((res.perfume as any).notes_en?.base ?? res.perfume.notes.base)
                              ).join(", ")}
                            </span>
                          </div>
                        </div>

                        {/* Buttons Footer */}
                        <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() => addToWardrobe(res.perfume.id)}
                            className={`w-full py-2.5 text-[9px] tracking-widest uppercase font-semibold border rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                              isInWardrobe
                                ? "bg-transparent border-green-800/40 text-green-400"
                                : "bg-transparent hover:bg-[#D4AF37] border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#D4AF37] hover:text-black shadow-[0_0_8px_rgba(212,175,55,0.1)]"
                            }`}
                          >
                            {isInWardrobe ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> {language === 'tr' ? "GARDIROBA EKLENDİ" : t("addedToWardrobe")}
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> {language === 'tr' ? "GARDIROBA EKLE" : "ADD TO WARDROBE"}
                              </>
                            )}
                          </button>

                          <Link 
                            href={`/perfume/${res.perfume.id}`}
                            className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#c5a880] hover:text-[#e5cda8] transition-colors duration-300 flex items-center justify-center gap-1 py-1"
                          >
                            {language === 'tr' ? "DETAYLARI GÖR" : "VIEW BLUEPRINT"} <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="px-8 py-3.5 border border-[#c5a880]/30 hover:border-[#c5a880] text-[#c5a880] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 flex items-center gap-2 cursor-pointer bg-transparent shadow-lg hover:bg-[#c5a880]/5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> {t("restartDiscovery")}
                  </button>
                  <Link 
                    href="/" 
                    className="text-xs text-[#f5f0e6]/40 hover:text-[#c5a880] tracking-widest uppercase transition-colors"
                  >
                    {language === 'tr' ? "KÜTÜPHANEYE DÖN" : "RETURN TO SCENT LIBRARY"}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-[#c5a880]/15 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#f5f0e6]/30 tracking-widest uppercase">
          <span>© {new Date().getFullYear()} UCA. All Rights Reserved.</span>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-[#c5a880] transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-[#c5a880] transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
