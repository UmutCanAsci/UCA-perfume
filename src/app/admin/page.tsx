"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useScentSphere } from "@/components/ScentSphereContext";
import { Perfume } from "@/types/perfume";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  MessageSquare,
  Trash2,
  CheckCircle,
  Award,
  Sparkles,
  Plus,
  Loader2,
  Sparkle,
  Globe,
} from "lucide-react";

// ─── Bilingual Label Badge ────────────────────────────────────────────────────

function LangBadge({ lang }: { lang: "EN" | "TR" }) {
  return (
    <span
      className={`inline-block text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm border mr-1.5 ${
        lang === "EN"
          ? "border-[#D4AF37]/60 text-[#D4AF37] bg-[#D4AF37]/8"
          : "border-[#c5a880]/40 text-[#c5a880] bg-[#c5a880]/5"
      }`}
    >
      {lang}
    </span>
  );
}

// ─── Bilingual textarea block ─────────────────────────────────────────────────

interface BilingualTextareaProps {
  labelKey: string;
  valueEn: string;
  valueTr: string;
  onChangeEn: (v: string) => void;
  onChangeTr: (v: string) => void;
  rows?: number;
  placeholderEn?: string;
  placeholderTr?: string;
}
function BilingualTextarea({
  labelKey,
  valueEn,
  valueTr,
  onChangeEn,
  onChangeTr,
  rows = 3,
  placeholderEn = "",
  placeholderTr = "",
}: BilingualTextareaProps) {
  return (
    <div className="space-y-2">
      <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block">
        {labelKey}
      </span>
      <div>
        <label className="text-[8px] tracking-widest text-[#f5f0e6]/30 uppercase flex items-center mb-1">
          <LangBadge lang="EN" /> English
        </label>
        <textarea
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          rows={rows}
          placeholder={placeholderEn}
          className="w-full border border-[#D4AF37]/20 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all resize-none placeholder-white/20"
        />
      </div>
      <div>
        <label className="text-[8px] tracking-widest text-[#f5f0e6]/30 uppercase flex items-center mb-1">
          <LangBadge lang="TR" /> Türkçe
        </label>
        <textarea
          value={valueTr}
          onChange={(e) => onChangeTr(e.target.value)}
          rows={rows}
          placeholder={placeholderTr}
          className="w-full border border-[#c5a880]/20 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#c5a880] focus:outline-none transition-all resize-none placeholder-white/20"
        />
      </div>
    </div>
  );
}

// ─── Bilingual single-line input block ───────────────────────────────────────

interface BilingualInputProps {
  labelKey: string;
  valueEn: string;
  valueTr: string;
  onChangeEn: (v: string) => void;
  onChangeTr: (v: string) => void;
  placeholderEn?: string;
  placeholderTr?: string;
}
function BilingualInput({
  labelKey,
  valueEn,
  valueTr,
  onChangeEn,
  onChangeTr,
  placeholderEn = "",
  placeholderTr = "",
}: BilingualInputProps) {
  return (
    <div className="space-y-2">
      <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block">
        {labelKey}
      </span>
      <div>
        <label className="text-[8px] tracking-widest text-[#f5f0e6]/30 uppercase flex items-center mb-1">
          <LangBadge lang="EN" /> English
        </label>
        <input
          type="text"
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          placeholder={placeholderEn}
          className="w-full border border-[#D4AF37]/20 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all placeholder-white/20"
        />
      </div>
      <div>
        <label className="text-[8px] tracking-widest text-[#f5f0e6]/30 uppercase flex items-center mb-1">
          <LangBadge lang="TR" /> Türkçe
        </label>
        <input
          type="text"
          value={valueTr}
          onChange={(e) => onChangeTr(e.target.value)}
          placeholder={placeholderTr}
          className="w-full border border-[#c5a880]/20 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#c5a880] focus:outline-none transition-all placeholder-white/20"
        />
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const {
    currentUser,
    activeUser,
    userProfiles,
    submittedReviews,
    reviewsReplies,
    perfumes,
    addPerfume,
    updatePerfume,
    deletePerfume,
    reloadPerfumes,
    language,
    toggleLanguage,
    dict,
    sessionLoaded,
  } = useScentSphere();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ai-generator" | "moderation" | "directory" | "manage"
  >("ai-generator");

  // ── Edit & Delete state ─────────────────────────────────────────────────────
  const [editingPerfumeId, setEditingPerfumeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── AI Generator query ──────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [formFeedback, setFormFeedback] = useState("");

  // ── Scalar metadata ─────────────────────────────────────────────────────────
  const [perfumeName, setPerfumeName] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState<"Unisex" | "Men" | "Women" | "Shared">(
    "Unisex"
  );
  const [concentration, setConcentration] = useState("Eau de Parfum");
  const [yearReleased, setYearReleased] = useState(new Date().getFullYear());

  // ── Bilingual descriptions ──────────────────────────────────────────────────
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionTr, setDescriptionTr] = useState("");

  // ── Bilingual notes (comma-separated) ──────────────────────────────────────
  const [topNotesEn, setTopNotesEn] = useState("");
  const [topNotesTr, setTopNotesTr] = useState("");
  const [heartNotesEn, setHeartNotesEn] = useState("");
  const [heartNotesTr, setHeartNotesTr] = useState("");
  const [baseNotesEn, setBaseNotesEn] = useState("");
  const [baseNotesTr, setBaseNotesTr] = useState("");

  // ── Scent Fingerprint ───────────────────────────────────────────────────────
  const [sweet, setSweet] = useState(20);
  const [spicy, setSpicy] = useState(20);
  const [floral, setFloral] = useState(20);
  const [fresh, setFresh] = useState(20);
  const [woody, setWoody] = useState(20);

  // ── Performance & Environment ───────────────────────────────────────────────
  const [sillage, setSillage] = useState<string>("Moderate");
  const [longevity, setLongevity] = useState<string>("Long-Lasting");

  // ── Bilingual seasons / occasions (comma-separated) ─────────────────────────
  const [seasonsEn, setSeasonsEn] = useState("Spring, Autumn");
  const [seasonsTr, setSeasonsTr] = useState("İlkbahar, Sonbahar");
  const [occasionsEn, setOccasionsEn] = useState("Casual Everyday, Office Safe");
  const [occasionsTr, setOccasionsTr] = useState(
    "Günlük Kullanım, Ofis Uyumlu"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────────────────
  // Three-state flow:
  //   1. !mounted || !sessionLoaded  → loading spinner (localStorage not yet hydrated)
  //   2. sessionLoaded && isAdmin    → full dashboard
  //   3. sessionLoaded && !isAdmin   → access denied
  const isAdmin =
    !!activeUser &&
    typeof activeUser.role === "string" &&
    activeUser.role.toUpperCase() === "ADMIN";

  // ── State 1: Loading ────────────────────────────────────────────────────────
  if (!mounted || !sessionLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/10" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D4AF37] animate-spin"
              style={{ animationDuration: "900ms" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-semibold">
              {language === "tr" ? "Kimlik Doğrulanıyor" : "Authenticating"}
            </p>
            <p className="text-[9px] tracking-widest uppercase text-[#f5f0e6]/30">
              {language === "tr"
                ? "Oturum verileri okunuyor…"
                : "Reading session credentials…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── State 3: Access denied ──────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans flex items-center justify-center p-6 selection:bg-[#c5a880] selection:text-black">
        <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-12 text-center max-w-md rounded-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl tracking-widest uppercase text-red-500 font-bold">
              Access Revoked
            </h1>
            <p className="text-xs text-[#f5f0e6]/50 tracking-wider leading-relaxed">
              The credentials provided lack authorization to enter the
              UCA Master Archive vault. Redirecting you to safety…
            </p>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500/50 rounded-full animate-[loading_3s_linear_infinite]"
                style={{ width: "100%" }}
              />
            </div>
            <Link
              href="/"
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] tracking-widest uppercase font-semibold border border-white/10 rounded-sm transition-colors duration-300 block"
            >
              Return Immediately
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── State 2: Access granted — full dashboard ────────────────────────────────

  const totalPerfumes = perfumes.length;
  const activeProfiles = Object.keys(userProfiles).length;
  const avgRating = (
    perfumes.reduce((acc, p) => acc + p.rating, 0) / totalPerfumes
  ).toFixed(2);

  const cleanNotes = (str: string) =>
    str
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

  // ── AI Profile Generator ────────────────────────────────────────────────────
  //
  // Each preset populates BOTH EN and TR fields simultaneously. The Turkish
  // translations are professional fragrance descriptions matching the
  // existing catalog style in src/data/perfumes.ts.
  const handleAIGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setFormFeedback("Please enter a perfume name or search query first.");
      return;
    }
    setIsGenerating(true);
    setFormFeedback("");
    setGenerationSuccess(false);

    setTimeout(() => {
      const q = query.trim().toLowerCase();

      if (
        q.includes("tobacco vanille") ||
        (q.includes("tobacco") && q.includes("vanille"))
      ) {
        setPerfumeName("Tobacco Vanille");
        setBrand("Tom Ford");
        setGender("Unisex");
        setConcentration("Eau de Parfum");
        setYearReleased(2007);
        setDescriptionEn(
          "An opulent, warm, and iconic artisanal fragrance highlighting rich tobacco leaf and sweet vanilla accords with a seductive oriental depth."
        );
        setDescriptionTr(
          "Zengin tütün yaprağı ve tatlı vanilya akortlarını baştan çıkarıcı bir oryantal derinlikle buluşturan, görkemli, sıcak ve ikonik bir el yapımı parfüm."
        );
        setTopNotesEn("Tobacco Leaf, Ginger, Spicy Notes");
        setTopNotesTr("Tütün Yaprağı, Zencefil, Baharatlı Notalar");
        setHeartNotesEn("Vanilla, Cacao, Tonka Bean, Tobacco Blossom");
        setHeartNotesTr("Vanilya, Kakao, Tonka Fasulyesi, Tütün Çiçeği");
        setBaseNotesEn("Dried Fruits, Woody Notes");
        setBaseNotesTr("Kuru Meyveler, Odunsu Notalar");
        setSweet(45);
        setSpicy(35);
        setWoody(15);
        setFresh(5);
        setFloral(0);
        setSillage("Heavy");
        setLongevity("Eternal");
        setSeasonsEn("Autumn, Winter");
        setSeasonsTr("Sonbahar, Kış");
        setOccasionsEn("Date Night, Gala Formal");
        setOccasionsTr("Gece Randevusu, Gala Formal");
      } else if (
        q.includes("gypsy water") ||
        (q.includes("gypsy") && q.includes("water"))
      ) {
        setPerfumeName("Gypsy Water");
        setBrand("Byredo");
        setGender("Unisex");
        setConcentration("Eau de Parfum");
        setYearReleased(2008);
        setDescriptionEn(
          "A beautiful glamorization of the Romany lifestyle, based on a fascination for the myth. The scent of fresh soil, deep forests and campfires."
        );
        setDescriptionTr(
          "Romani yaşam biçiminin büyüleyici bir yüceltilmesi; mitten beslenen bir hayranlıkla ilham alan bu koku, taze toprak, derin ormanlar ve kamp ateşinin izlerini taşır."
        );
        setTopNotesEn("Juniper, Lemon, Bergamot, Pepper");
        setTopNotesTr("Ardıç, Limon, Bergamot, Biber");
        setHeartNotesEn("Pine Needles, Incense, Orris Root");
        setHeartNotesTr("Çam İğneleri, Tütsü, Süsen Kökü");
        setBaseNotesEn("Sandalwood, Vanilla, Amber");
        setBaseNotesTr("Sandal Ağacı, Vanilya, Amber");
        setSweet(10);
        setSpicy(10);
        setWoody(30);
        setFresh(45);
        setFloral(5);
        setSillage("Moderate");
        setLongevity("Moderate");
        setSeasonsEn("Spring, Summer");
        setSeasonsTr("İlkbahar, Yaz");
        setOccasionsEn("Casual Everyday, Office Safe");
        setOccasionsTr("Günlük Kullanım, Ofis Uyumlu");
      } else if (q.includes("bleu de chanel") || q.includes("bleu")) {
        setPerfumeName("Bleu de Chanel");
        setBrand("Chanel");
        setGender("Men");
        setConcentration("Eau de Parfum");
        setYearReleased(2014);
        setDescriptionEn(
          "An aromatic-woody fragrance that unites the invigorating freshness of citrus with the woody whisper of dry cedar. New Caledonian sandalwood lends it a warm and sensual trail."
        );
        setDescriptionTr(
          "Narenciyelerin canlandırıcı ferahlığını kuru sedirin odunsu fısıltısıyla buluşturan aromatik-odunsu bir parfüm. Yeni Kaledonya sandal ağacı, ona sıcak ve duyumsal bir iz katıyor."
        );
        setTopNotesEn("Grapefruit, Lemon, Mint, Pink Pepper");
        setTopNotesTr("Greyfurt, Limon, Nane, Pembe Biber");
        setHeartNotesEn("Ginger, Nutmeg, Jasmine");
        setHeartNotesTr("Zencefil, Hindistan Cevizi, Yasemin");
        setBaseNotesEn("Incense, Vetiver, Cedar, Sandalwood, Patchouli, Labdanum");
        setBaseNotesTr("Tütsü, Vetiver, Sedir, Sandal Ağacı, Paçuli, Labdanum");
        setSweet(5);
        setSpicy(15);
        setWoody(40);
        setFresh(35);
        setFloral(5);
        setSillage("Moderate");
        setLongevity("Long-Lasting");
        setSeasonsEn("Spring, Summer, Autumn");
        setSeasonsTr("İlkbahar, Yaz, Sonbahar");
        setOccasionsEn("Office Safe, Casual Everyday");
        setOccasionsTr("Ofis Uyumlu, Günlük Kullanım");
      } else if (q.includes("santal 33") || q.includes("santal")) {
        setPerfumeName("Santal 33");
        setBrand("Le Labo");
        setGender("Unisex");
        setConcentration("Eau de Parfum");
        setYearReleased(2011);
        setDescriptionEn(
          "An iconic, intoxicating cardamom-spiced sandalwood trail that captures the spirit of the American West."
        );
        setDescriptionTr(
          "Amerikan Batısı'nın ruhunu yakalayan, ikonik ve sarhoş edici, kakule baharatlı sandal ağacı izli bir parfüm."
        );
        setTopNotesEn("Cardamom, Iris, Violet Accord");
        setTopNotesTr("Kakule, İris, Menekşe Akoru");
        setHeartNotesEn("Papyrus, Ambrox, Leather");
        setHeartNotesTr("Papirüs, Ambroks, Deri");
        setBaseNotesEn("Sandalwood, Cedarwood, Musk");
        setBaseNotesTr("Sandal Ağacı, Sedir Ağacı, Misk");
        setSweet(5);
        setSpicy(20);
        setWoody(60);
        setFresh(10);
        setFloral(5);
        setSillage("Heavy");
        setLongevity("Long-Lasting");
        setSeasonsEn("Autumn, Winter, Spring");
        setSeasonsTr("Sonbahar, Kış, İlkbahar");
        setOccasionsEn("Date Night, Casual Everyday");
        setOccasionsTr("Gece Randevusu, Günlük Kullanım");
      } else {
        // Generic fallback — derive brand/name from query tokens
        const parts = query.trim().split(" ");
        const inferredBrand = parts[0]
          ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
          : "Generic";
        const inferredName = parts
          .slice(1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") || "Scent Aura";

        setPerfumeName(inferredName);
        setBrand(inferredBrand);
        setGender("Unisex");
        setConcentration("Eau de Parfum");
        setYearReleased(new Date().getFullYear());
        setDescriptionEn(
          `A sophisticated fragrance profile created automatically for ${query.trim()}. Edit this description to reflect the true olfactory character.`
        );
        setDescriptionTr(
          `${query.trim()} için otomatik olarak oluşturulmuş sofistike bir parfüm profili. Gerçek koku karakterini yansıtmak için bu açıklamayı düzenleyin.`
        );
        setTopNotesEn("Bergamot, Pink Pepper, Grapefruit");
        setTopNotesTr("Bergamot, Pembe Biber, Greyfurt");
        setHeartNotesEn("Lavender, Geranium, Jasmine");
        setHeartNotesTr("Lavanta, Sardunya, Yasemin");
        setBaseNotesEn("Sandalwood, Amber, Patchouli, Musk");
        setBaseNotesTr("Sandal Ağacı, Amber, Paçuli, Misk");
        setSweet(25);
        setSpicy(20);
        setWoody(25);
        setFresh(20);
        setFloral(10);
        setSillage("Moderate");
        setLongevity("Long-Lasting");
        setSeasonsEn("Spring, Autumn");
        setSeasonsTr("İlkbahar, Sonbahar");
        setOccasionsEn("Casual Everyday, Office Safe");
        setOccasionsTr("Günlük Kullanım, Ofis Uyumlu");
      }

      setIsGenerating(false);
      setGenerationSuccess(true);
      setFormFeedback(
        "AI Profile generated! Both English and Turkish fields have been populated. Review and refine before committing."
      );
    }, 1500);
  };

  // ── Commit to database ────────────────────────────────────────────────
  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!perfumeName || !brand || !descriptionEn || !descriptionTr) {
      setFormFeedback("Form incomplete. Please fill out name, brand, and both EN/TR descriptions.");
      return;
    }
    if (!topNotesEn || !topNotesTr || !heartNotesEn || !heartNotesTr || !baseNotesEn || !baseNotesTr) {
      setFormFeedback("All note layers (Top, Heart, Base) must have both English and Turkish entries.");
      return;
    }

    setIsSaving(true);
    setFormFeedback("");

    const derivedId = editingPerfumeId ?? perfumeName.toLowerCase().replace(/\s+/g, "-");

    // Build the shared Perfume object for optimistic context updates
    const newPerfume: Perfume = {
      id: derivedId,
      name: perfumeName,
      brand,
      gender,
      rating: 5.0,
      concentration,
      yearReleased,
      description:    descriptionEn,
      description_en: descriptionEn,
      description_tr: descriptionTr,
      notes: {
        top:  cleanNotes(topNotesEn),
        mid:  cleanNotes(heartNotesEn),
        base: cleanNotes(baseNotesEn),
      },
      olfactoryProfile: {
        Floral: Number(floral),
        Woody:  Number(woody),
        Spicy:  Number(spicy),
        Fresh:  Number(fresh),
        Sweet:  Number(sweet),
      },
      reviews:   [],
      sillage,
      longevity,
      seasons:   cleanNotes(seasonsEn),
      occasions: cleanNotes(occasionsEn),
    };

    // Shared API payload (used by both create and update paths)
    const apiPayload = {
      id:          derivedId,
      name:        perfumeName,
      brand,
      gender,
      concentration,
      descriptionEn,
      descriptionTr,
      notes: {
        topEn:  cleanNotes(topNotesEn),
        topTr:  cleanNotes(topNotesTr),
        midEn:  cleanNotes(heartNotesEn),
        midTr:  cleanNotes(heartNotesTr),
        baseEn: cleanNotes(baseNotesEn),
        baseTr: cleanNotes(baseNotesTr),
      },
      olfactoryProfile: {
        Floral: Number(floral), Woody: Number(woody),
        Spicy:  Number(spicy),  Fresh: Number(fresh), Sweet: Number(sweet),
      },
      seasons:   cleanNotes(seasonsEn).join(", "),
      occasions: cleanNotes(occasionsEn).join(", "),
      sillage,
      longevity,
      yearReleased,
    };

    try {
      if (editingPerfumeId) {
        // ── UPDATE path: optimistic update + awaited PUT ─────────────────────
        updatePerfume(editingPerfumeId, newPerfume);

        const putRes = await fetch(`/api/perfume/${editingPerfumeId}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(apiPayload),
        });

        if (!putRes.ok) {
          const errBody = await putRes.json().catch(() => ({ error: putRes.statusText }));
          throw new Error(errBody.error ?? "PUT failed");
        }
      } else {
        // ── CREATE path: awaited POST → merge returned record → reload DB ─────
        const postRes = await fetch("/api/perfumes", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(apiPayload),
        });

        if (!postRes.ok) {
          const errBody = await postRes.json().catch(() => ({ error: postRes.statusText }));
          throw new Error(errBody.error ?? "POST failed");
        }

        // Use the DB-authoritative record the server echoes back
        const created = await postRes.json();
        addPerfume(created as Perfume);

        // Force a full catalogue refresh so every tab/browser also sees it
        await reloadPerfumes();
      }

      // ── Reset form fields ─────────────────────────────────────────────────
      setQuery("");
      setPerfumeName("");
      setBrand("");
      setDescriptionEn("");
      setDescriptionTr("");
      setTopNotesEn("");
      setTopNotesTr("");
      setHeartNotesEn("");
      setHeartNotesTr("");
      setBaseNotesEn("");
      setBaseNotesTr("");
      setSeasonsEn("Spring, Autumn");
      setSeasonsTr("İlkbahar, Sonbahar");
      setOccasionsEn("Casual Everyday, Office Safe");
      setOccasionsTr("Günlük Kullanım, Ofis Uyumlu");
      setSweet(20);
      setSpicy(20);
      setFloral(20);
      setFresh(20);
      setWoody(20);
      setGenerationSuccess(false);

      const savedName  = newPerfume.name;
      const wasEditing = !!editingPerfumeId;
      setEditingPerfumeId(null);

      setFormFeedback(
        wasEditing
          ? `✅ "${savedName}" updated and persisted to MySQL.`
          : `✅ "${savedName}" committed to the Encyclopedia and persisted to MySQL.`
      );
    } catch (err: any) {
      setFormFeedback("❌ Failed to save: " + (err?.message ?? "Unknown error. Check the browser console."));
    } finally {
      setIsSaving(false);
    }
  };


  // ── Load an existing perfume into the form for editing ─────────────────────
  const handleLoadForEdit = (p: Perfume) => {
    setPerfumeName(p.name);
    setBrand(p.brand);
    setGender(p.gender as "Unisex" | "Men" | "Women" | "Shared");
    setConcentration(p.concentration ?? "Eau de Parfum");
    setYearReleased(p.yearReleased ?? new Date().getFullYear());
    setDescriptionEn(p.description_en ?? p.description ?? "");
    setDescriptionTr(p.description_tr ?? p.description ?? "");
    setTopNotesEn(p.notes.top.join(", "));
    setTopNotesTr((p.notes as any).top_tr ? (p.notes as any).top_tr.join(", ") : p.notes.top.join(", "));
    setHeartNotesEn(p.notes.mid.join(", "));
    setHeartNotesTr((p.notes as any).mid_tr ? (p.notes as any).mid_tr.join(", ") : p.notes.mid.join(", "));
    setBaseNotesEn(p.notes.base.join(", "));
    setBaseNotesTr((p.notes as any).base_tr ? (p.notes as any).base_tr.join(", ") : p.notes.base.join(", "));
    setSweet(p.olfactoryProfile.Sweet);
    setSpicy(p.olfactoryProfile.Spicy);
    setFloral(p.olfactoryProfile.Floral);
    setFresh(p.olfactoryProfile.Fresh);
    setWoody(p.olfactoryProfile.Woody);
    setSillage(p.sillage);
    setLongevity(p.longevity);
    setSeasonsEn(p.seasons.join(", "));
    setSeasonsTr(p.seasons.join(", ")); // fallback — EN until TR stored
    setOccasionsEn(p.occasions.join(", "));
    setOccasionsTr(p.occasions.join(", ")); // fallback — EN until TR stored
    setEditingPerfumeId(p.id);
    setGenerationSuccess(true);
    setFormFeedback("");
    setQuery("");
    setActiveTab("ai-generator");
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete a perfume with DB cascade ──────────────────────────────────────
  const handleDeletePerfume = async (id: string) => {
    setIsDeleting(true);
    try {
      // Optimistic UI: remove from context immediately
      deletePerfume(id);
      // Fire DB delete
      await fetch(`/api/perfume/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[DELETE /api/perfume] DB sync failed (non-blocking):", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-900/5 rounded-full blur-[150px] pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group text-xs tracking-[0.2em] uppercase font-light text-[#f5f0e6]/70 hover:text-[#c5a880] transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {language === "tr" ? "KÜTÜPHANEYE DÖN" : "BACK TO LIBRARY"}
          </Link>

          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[#D4AF37] uppercase font-bold">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            <span>{dict.nav.archivist}</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleLanguage}
              className="text-[10px] tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer bg-transparent border-0 uppercase font-semibold select-none"
              title={
                language === "en"
                  ? "Dil değiştir: Türkçe"
                  : "Switch language: English"
              }
            >
              {language === "en" ? "EN" : "TR"}
            </button>
            <div className="text-[9px] tracking-wider uppercase font-semibold text-[#c5a880]">
              @{activeUser.username}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 w-full space-y-10">

        {/* Title */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-[#c5a880] uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Administrator Control Vault</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-wider font-bold">
            Scent Archives Console
          </h1>
          <p className="text-xs text-[#f5f0e6]/45 tracking-wider max-w-xl font-light">
            Review logged scent critiques, check database integrity, and
            automate bilingual perfume profile creations using AI.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Total Perfumes", value: totalPerfumes, icon: <Database className="w-5 h-5 text-[#c5a880]/60" />, clickable: true },
            { label: "User Profiles", value: activeProfiles, icon: <Users className="w-5 h-5 text-[#c5a880]/60" />, clickable: false },
            { label: "Average Database Rating", value: `${avgRating} / 5`, icon: <Sparkles className="w-5 h-5 text-[#c5a880]/60" />, clickable: false },
          ].map(({ label, value, icon, clickable }) => (
            <div
              key={label}
              onClick={clickable ? () => setActiveTab("manage") : undefined}
              className={`backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-6 rounded-sm relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 ${
                clickable
                  ? "cursor-pointer hover:border-[#c5a880]/30 hover:shadow-[0_8px_40px_rgba(212,175,55,0.08)] group"
                  : ""
              }`}
            >
              <div
                className="absolute inset-0 z-0 opacity-80"
                style={{
                  background:
                    "radial-gradient(circle at 10% 10%, rgba(212,175,55,0.05) 0%, transparent 60%)",
                }}
              />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className={`text-[9px] tracking-widest uppercase block mb-1 transition-colors duration-300 ${
                    clickable ? "text-[#f5f0e6]/40 group-hover:text-[#c5a880]/70" : "text-[#f5f0e6]/40"
                  }`}>
                    {label}
                    {clickable && <span className="ml-1.5 text-[#c5a880]/40 group-hover:text-[#c5a880] transition-colors">↗</span>}
                  </span>
                  <span className="font-serif text-2xl font-bold text-white">
                    {value}
                  </span>
                </div>
                {icon}
              </div>
            </div>
          ))}
        </section>

        {/* Tab Controls */}
        <div className="flex flex-wrap border-b border-white/[0.05] gap-6 md:gap-8">
          {(
            [
              { id: "ai-generator", label: editingPerfumeId ? "✎ Editing Perfume" : "AI Scent Generator" },
              { id: "moderation", label: `Critique Moderation (${submittedReviews.length})` },
              { id: "directory", label: `Connoisseur Directory (${activeProfiles})` },
              { id: "manage", label: `Manage Perfumes (${totalPerfumes})` },
            ] as { id: "ai-generator" | "moderation" | "directory" | "manage"; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-3 text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-300 relative cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? "text-[#D4AF37]"
                  : "text-[#f5f0e6]/40 hover:text-[#f5f0e6]/80"
              }`}
            >
              {label}
              {activeTab === id && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab 1: AI Scent Generator ─────────────────────────────────────── */}
        {activeTab === "ai-generator" && (
          <div className="space-y-8">

            {/* Query card */}
            <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-8 rounded-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6 relative overflow-hidden">
              <div
                className="absolute inset-0 z-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <h3 className="text-xs tracking-[0.25em] text-[#c5a880] uppercase font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkle
                    className="w-4 h-4 text-[#c5a880] animate-spin"
                    style={{ animationDuration: "10s" }}
                  />
                  {dict.admin.formTitle}
                </h3>
                <p className="text-[11px] text-[#f5f0e6]/50 tracking-wider mb-6 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#D4AF37]/60 shrink-0" />
                  AI generates a complete bilingual profile — English and Turkish
                  fields populated simultaneously for instant review.
                </p>
                <form
                  onSubmit={handleAIGenerate}
                  className="flex flex-col sm:flex-row gap-4 items-end"
                >
                  <div className="flex-1 w-full">
                    <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                      {dict.admin.inputLabel}
                    </label>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Tom Ford Tobacco Vanille…"
                      className="w-full border-b border-white/[0.1] bg-transparent rounded-none py-2 px-1 text-xs text-[#f5f0e6] placeholder-[#f5f0e6]/30 focus:border-[#D4AF37] focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#e5cda8] disabled:bg-[#D4AF37]/50 text-black text-xs font-semibold tracking-widest uppercase rounded-none transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Profiling…
                      </>
                    ) : (
                      dict.admin.generateBtn
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Feedback banner */}
            {formFeedback && (
              <div
                className={`p-4 text-xs rounded-sm border text-center ${
                  generationSuccess
                    ? "bg-amber-950/20 border-amber-800/40 text-[#c5a880]"
                    : "bg-red-950/20 border-red-800/40 text-red-400"
                }`}
              >
                {formFeedback}
              </div>
            )}

            {/* Bilingual profile editor */}
            {(generationSuccess || perfumeName) && (
              <form
                onSubmit={handleCommit}
                className="space-y-8"
              >
                <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-8 rounded-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-8">

                  {/* Section header */}
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-xs tracking-[0.25em] text-[#c5a880] uppercase font-semibold flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      Review &amp; Calibrate Bilingual Formulation
                    </h3>
                    <p className="text-[10px] text-[#f5f0e6]/35 tracking-wider mt-1">
                      Gold labels&nbsp;
                      <LangBadge lang="EN" />
                      indicate English fields; copper labels&nbsp;
                      <LangBadge lang="TR" />
                      indicate Turkish fields. Both are required before committing.
                    </p>
                  </div>

                  {/* ── Scalar metadata ──────────────────────────────────────── */}
                  <div>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase block font-semibold mb-4">
                      Core Metadata
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Perfume Name
                        </label>
                        <input
                          type="text"
                          value={perfumeName}
                          onChange={(e) => setPerfumeName(e.target.value)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Gender Segment
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        >
                          <option value="Unisex">Unisex</option>
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                          <option value="Shared">Shared</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Concentration
                        </label>
                        <input
                          type="text"
                          value={concentration}
                          onChange={(e) => setConcentration(e.target.value)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Bilingual Description ─────────────────────────────────── */}
                  <div className="border-t border-white/5 pt-6">
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase block font-semibold mb-4">
                      Luxury Description
                    </span>
                    <BilingualTextarea
                      labelKey="Main Description"
                      valueEn={descriptionEn}
                      valueTr={descriptionTr}
                      onChangeEn={setDescriptionEn}
                      onChangeTr={setDescriptionTr}
                      rows={3}
                      placeholderEn="Describe the olfactory journey in English…"
                      placeholderTr="Koku yolculuğunu Türkçe olarak açıklayın…"
                    />
                  </div>

                  {/* ── Scent Fingerprint ─────────────────────────────────────── */}
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase block font-semibold">
                      Scent Fingerprint (Radar Chart %)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                      {(
                        [
                          ["Sweet", sweet, setSweet],
                          ["Spicy", spicy, setSpicy],
                          ["Floral", floral, setFloral],
                          ["Fresh", fresh, setFresh],
                          ["Woody", woody, setWoody],
                        ] as const
                      ).map(([label, val, setter]) => (
                        <div key={label}>
                          <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={val}
                            onChange={(e) => (setter as any)(Number(e.target.value))}
                            className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Bilingual Notes ───────────────────────────────────────── */}
                  <div className="border-t border-white/5 pt-6 space-y-6">
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase block font-semibold">
                      Olfactory Evaporation Timeline — Bilingual Notes
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <BilingualInput
                        labelKey="Top Notes (comma-separated)"
                        valueEn={topNotesEn}
                        valueTr={topNotesTr}
                        onChangeEn={setTopNotesEn}
                        onChangeTr={setTopNotesTr}
                        placeholderEn="e.g., Lemon, Mint, Pepper"
                        placeholderTr="e.g., Limon, Nane, Biber"
                      />
                      <BilingualInput
                        labelKey="Heart Notes (comma-separated)"
                        valueEn={heartNotesEn}
                        valueTr={heartNotesTr}
                        onChangeEn={setHeartNotesEn}
                        onChangeTr={setHeartNotesTr}
                        placeholderEn="e.g., Jasmine, Rose, Iris"
                        placeholderTr="e.g., Yasemin, Gül, İris"
                      />
                      <BilingualInput
                        labelKey="Base Notes (comma-separated)"
                        valueEn={baseNotesEn}
                        valueTr={baseNotesTr}
                        onChangeEn={setBaseNotesEn}
                        onChangeTr={setBaseNotesTr}
                        placeholderEn="e.g., Sandalwood, Amber, Musk"
                        placeholderTr="e.g., Sandal Ağacı, Amber, Misk"
                      />
                    </div>
                  </div>

                  {/* ── Performance Diagnostics ───────────────────────────────── */}
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase block font-semibold">
                      Performance &amp; Environment Diagnostics
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Sillage
                        </label>
                        <select
                          value={sillage}
                          onChange={(e: any) => setSillage(e.target.value)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        >
                          <option value="Intimate">Intimate</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Heavy">Heavy</option>
                          <option value="Nuclear">Nuclear</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">
                          Longevity
                        </label>
                        <select
                          value={longevity}
                          onChange={(e: any) => setLongevity(e.target.value)}
                          className="w-full border border-white/10 bg-black/40 py-2 px-3 text-xs text-white focus:border-[#D4AF37] focus:outline-none transition-all"
                        >
                          <option value="Ephemeral">Ephemeral</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Long-Lasting">Long-Lasting</option>
                          <option value="Eternal">Eternal</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                      <BilingualInput
                        labelKey="Seasons (comma-separated)"
                        valueEn={seasonsEn}
                        valueTr={seasonsTr}
                        onChangeEn={setSeasonsEn}
                        onChangeTr={setSeasonsTr}
                        placeholderEn="e.g., Spring, Summer, Autumn"
                        placeholderTr="e.g., İlkbahar, Yaz, Sonbahar"
                      />
                      <BilingualInput
                        labelKey="Occasions (comma-separated)"
                        valueEn={occasionsEn}
                        valueTr={occasionsTr}
                        onChangeEn={setOccasionsEn}
                        onChangeTr={setOccasionsTr}
                        placeholderEn="e.g., Office Safe, Date Night"
                        placeholderTr="e.g., Ofis Uyumlu, Gece Randevusu"
                      />
                    </div>
                  </div>

                  {/* ── Commit Button ─────────────────────────────────────────── */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    {/* Feedback banner */}
                    {formFeedback && (
                      <div className={`text-[10px] tracking-wider px-4 py-2.5 rounded-sm border ${
                        formFeedback.startsWith("✅")
                          ? "text-emerald-400 bg-emerald-950/30 border-emerald-500/20"
                          : formFeedback.startsWith("❌")
                          ? "text-red-400 bg-red-950/30 border-red-500/20"
                          : "text-[#c5a880] bg-[#c5a880]/5 border-[#c5a880]/15"
                      }`}>
                        {formFeedback}
                      </div>
                    )}
                    <div className="flex justify-end">
                      {editingPerfumeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPerfumeId(null);
                            setGenerationSuccess(false);
                            setPerfumeName("");
                            setBrand("");
                            setFormFeedback("");
                          }}
                          className="mr-4 px-6 py-3 text-[#f5f0e6]/40 hover:text-[#f5f0e6]/70 border border-white/5 hover:border-white/15 text-xs font-semibold tracking-[0.2em] uppercase rounded-none transition-all duration-300 cursor-pointer flex items-center gap-2"
                        >
                          ✕ Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3 bg-transparent hover:bg-[#D4AF37] disabled:opacity-60 disabled:cursor-wait text-[#D4AF37] hover:text-black border border-[#D4AF37]/45 hover:border-[#D4AF37] text-xs font-semibold tracking-[0.25em] uppercase rounded-none transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center gap-2"
                      >
                        {isSaving
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Plus className="w-4 h-4" />
                        }
                        {isSaving
                          ? (language === "tr" ? "Kaydediliyor..." : "Saving...")
                          : editingPerfumeId
                            ? (language === "tr" ? "Parfümü Güncelle" : "Update Perfume")
                            : dict.admin.commitBtn
                        }
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Tab 2: Critique Moderation ─────────────────────────────────────── */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Sensory Critiques Queue ({submittedReviews.length})
            </h3>
            {submittedReviews.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-12 text-center rounded-sm text-xs text-[#f5f0e6]/40 tracking-wider shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                NO NEW REPORTS LOGGED
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submittedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-6 rounded-sm relative shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-semibold block text-white">
                            @{review.user}
                          </span>
                          <span className="text-[9px] text-[#f5f0e6]/45 tracking-wider uppercase block mt-0.5">
                            Perfume ID: {review.perfumeId}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#c5a880] tracking-widest uppercase bg-[#c5a880]/5 px-2 py-0.5 border border-[#c5a880]/10 rounded-sm font-semibold">
                          ★ {review.rating} / 5
                        </span>
                      </div>
                      <p className="text-xs text-[#f5f0e6]/75 font-light leading-relaxed italic border-l border-white/5 pl-3 py-1 my-4">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#f5f0e6]/40 border-t border-white/5 pt-4 mt-2">
                      <span>Logged: {review.date}</span>
                      <div className="flex gap-2">
                        <button className="text-[#D4AF37] hover:text-[#e5cda8] transition-colors duration-300 font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button className="text-red-500 hover:text-red-400 transition-colors duration-300 font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer ml-3">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Connoisseur Directory ─────────────────────────────────── */}
        {activeTab === "directory" && (
          <div className="space-y-6">
            <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Scent Connoisseur Directory ({activeProfiles})
            </h3>
            <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] rounded-sm divide-y divide-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              {Object.values(userProfiles).map((profile) => (
                <div
                  key={profile.username}
                  className="p-5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {profile.displayName}
                      </span>
                      <span className="text-[9px] text-[#c5a880] tracking-widest uppercase bg-[#c5a880]/5 px-2 py-0.5 border border-[#c5a880]/15 rounded-sm font-bold">
                        {profile.role || "user"}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#f5f0e6]/45 tracking-wider block mt-1">
                      @{profile.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#f5f0e6]/45 tracking-widest uppercase text-right space-y-1">
                    <div>
                      Wardrobe:{" "}
                      <span className="text-white font-serif font-bold">
                        {profile.wardrobe.length}
                      </span>{" "}
                      items
                    </div>
                    <div>
                      Favorites:{" "}
                      <span className="text-white font-serif font-bold">
                        {profile.favorites.length}
                      </span>{" "}
                      items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 4: Manage Perfumes ────────────────────────────────────────── */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] tracking-[0.3em] text-[#c5a880] uppercase font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                Scent Inventory — {totalPerfumes} Records
              </h3>
              <button
                onClick={() => { setEditingPerfumeId(null); setGenerationSuccess(false); setPerfumeName(""); setActiveTab("ai-generator"); }}
                className="px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-[9px] tracking-[0.2em] uppercase font-semibold rounded-sm transition-all duration-300 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                {language === "tr" ? "Yeni Parfüm" : "New Perfume"}
              </button>
            </div>

            {/* Inventory grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {perfumes.map((p) => (
                <div
                  key={p.id}
                  className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] rounded-sm overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#c5a880]/20 transition-all duration-300 group"
                >
                  {/* Top accent bar */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c5a880]/20 to-transparent group-hover:via-[#c5a880]/50 transition-all duration-500" />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <span className="text-[8px] tracking-[0.25em] text-[#c5a880] uppercase block mb-0.5">
                          {p.brand}
                        </span>
                        <h4 className="font-serif text-sm text-white tracking-wide truncate">
                          {p.name}
                        </h4>
                        <span className="text-[8px] font-mono text-[#f5f0e6]/25 tracking-wider">
                          id: {p.id}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[8px] tracking-wider bg-[#c5a880]/10 border border-[#c5a880]/15 px-2 py-0.5 rounded-sm text-[#c5a880] uppercase">
                          {p.gender}
                        </span>
                        <span className="text-[8px] tracking-wider text-[#f5f0e6]/30 bg-black/40 px-2 py-0.5 rounded-sm border border-white/5">
                          {p.concentration ?? "EDP"}
                        </span>
                      </div>
                    </div>

                    {/* Olfactory fingerprint mini-bars */}
                    <div className="flex items-end gap-1 mb-4 h-8">
                      {([
                        { k: "Floral", c: "#e879f9" },
                        { k: "Woody",  c: "#a78b5f" },
                        { k: "Spicy",  c: "#f97316" },
                        { k: "Fresh",  c: "#38bdf8" },
                        { k: "Sweet",  c: "#D4AF37" },
                      ] as { k: keyof typeof p.olfactoryProfile; c: string }[]).map(({ k, c }) => {
                        const val = p.olfactoryProfile[k] ?? 0;
                        const pct = Math.max(4, Math.round((val / 100) * 100));
                        return (
                          <div key={k} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-full rounded-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ height: `${pct}%`, backgroundColor: c, minHeight: "4px" }}
                            />
                            <span className="text-[6px] tracking-wider text-[#f5f0e6]/25">{k.slice(0, 2).toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes preview */}
                    <p className="text-[9px] text-[#f5f0e6]/40 leading-relaxed line-clamp-1 mb-4">
                      {p.notes.top.slice(0, 3).join(" · ")}
                    </p>

                    {/* Action row */}
                    {deleteConfirmId === p.id ? (
                      /* Inline delete confirmation */
                      <div className="bg-red-950/30 border border-red-500/20 rounded-sm p-3 space-y-2">
                        <p className="text-[9px] text-red-400 tracking-wider">
                          {language === "tr"
                            ? `"${p.name}" kalıcı olarak silinsin mi?`
                            : `Permanently delete "${p.name}"?`
                          }
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeletePerfume(p.id)}
                            disabled={isDeleting}
                            className="flex-1 py-1.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-[8px] tracking-[0.2em] uppercase font-bold rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            {language === "tr" ? "Sil" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[#f5f0e6]/60 text-[8px] tracking-[0.2em] uppercase font-bold rounded-sm transition-all cursor-pointer"
                          >
                            {language === "tr" ? "İptal" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadForEdit(p)}
                          className="flex-1 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 text-[#D4AF37] text-[8px] tracking-[0.25em] uppercase font-semibold rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                          {language === "tr" ? "Düzenle" : "Edit"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="flex-1 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/15 hover:border-red-500/40 text-red-400 hover:text-red-300 text-[8px] tracking-[0.25em] uppercase font-semibold rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          {language === "tr" ? "Sil" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {perfumes.length === 0 && (
              <div className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.04] p-16 text-center rounded-sm text-xs text-[#f5f0e6]/30 tracking-widest shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                NO PERFUMES IN ARCHIVE
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
