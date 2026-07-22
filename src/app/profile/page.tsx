"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Eye, 
  Heart, 
  Sparkles, 
  Clock, 
  Bookmark, 
  X, 
  Check, 
  User, 
  ShieldAlert,
  Calendar,
  MessageSquare,
  Star
} from "lucide-react";
import { useScentSphere, CustomScentList } from "@/components/ScentSphereContext";
import { Perfume } from "@/types/perfume";

export default function ProfilePage() {
  const { 
    currentUser, 
    activeUser,
    submittedReviews,
    perfumes,
    createCustomList, 
    deleteCustomList, 
    toggleListPrivacy,
    removePerfumeFromList,
    wardrobeIds,
    favoriteIds,
    toggleWardrobe,
    toggleFavorite,
    handleLogout,
    dict,
    language
  } = useScentSphere();

  // local states
  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListPrivate, setNewListPrivate] = useState(false);

  // Stats
  const totalWardrobe = wardrobeIds.length;
  const totalFavorites = favoriteIds.length;
  const visibleLists = currentUser.customLists.filter(l => !isVisitorMode || !l.isPrivate);

  // Find all reviews written by this user across catalog and local submissions
  const userReviews = [
    ...perfumes.flatMap(p => 
      p.reviews
        .filter(r => r.user === currentUser.username)
        .map(r => ({ ...r, perfumeId: p.id, perfumeName: p.name, brand: p.brand }))
    ),
    ...submittedReviews
      .filter(r => r.user === currentUser.username)
      .map(r => {
        const p = perfumes.find(pf => pf.id === r.perfumeId);
        return { ...r, perfumeName: p?.name || r.perfumeId, brand: p?.brand || "" };
      })
  ];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createCustomList(newListName.trim(), newListDesc.trim(), newListPrivate);
    setNewListName("");
    setNewListDesc("");
    setNewListPrivate(false);
    setShowCreateModal(false);
  };

  // Helper to map perfume IDs to actual perfume objects
  const getPerfume = (id: string) => perfumes.find(p => p.id === id);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#c5a880]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-xs tracking-[0.2em] uppercase font-light text-[#f5f0e6]/70 hover:text-[#c5a880] transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {language === "tr" ? "KÜTÜPHANEYE DÖN" : "BACK TO LIBRARY"}
          </Link>

          <Link href="/" className="font-serif text-2xl tracking-[0.2em] gold-gradient-text uppercase font-bold">
            {dict.hero.title}
          </Link>

          <Link href="/consultant" className="text-xs tracking-[0.2em] uppercase font-light text-[#c5a880] hover:text-[#e5cda8] border border-[#c5a880]/30 px-3 py-1 rounded-sm transition-colors">
            {dict.nav.consultant}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-36 pb-20 w-full flex-1">
        {/* Profile Card & Info */}
        <section className="glass-premium p-8 rounded-sm border border-[#c5a880]/15 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="w-64 h-64 text-[#c5a880]" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e5cda8]/20 via-[#c5a880]/20 to-[#8e7355]/20 border border-[#c5a880]/30 flex items-center justify-center text-2xl font-serif text-[#c5a880] font-bold shadow-lg shadow-black/50">
                {currentUser.displayName.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-2xl md:text-3xl tracking-wide font-bold">{currentUser.displayName}</h1>
                  <span className="text-[10px] tracking-widest text-[#c5a880]/60 uppercase bg-[#c5a880]/5 border border-[#c5a880]/10 px-2 py-0.5 rounded-sm">
                    @{currentUser.username}
                  </span>
                </div>
                <p className="text-xs text-[#f5f0e6]/60 mt-1 max-w-xl font-light leading-relaxed">
                  {currentUser.bio === "Fragrance enthusiast." ? dict.profile.enthusiast : currentUser.bio}
                </p>
                {currentUser.role === "admin" && (
                  <div className="mt-3">
                    <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#e5cda8] border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-3 py-1.5 rounded-sm transition-all duration-300 font-semibold tracking-wider hover:scale-102">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                      {dict.nav.archivist}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Badges */}
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">{dict.profile.statsWardrobe}</span>
                <span className="font-serif text-lg font-bold text-white">{totalWardrobe}</span>
              </div>
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">{dict.profile.statsFavorites}</span>
                <span className="font-serif text-lg font-bold text-white">{totalFavorites}</span>
              </div>
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">{dict.profile.statsLists}</span>
                <span className="font-serif text-lg font-bold text-white">{currentUser.customLists.length}</span>
              </div>
            </div>
          </div>

          {/* Owner vs. Visitor Toggle Controls */}
          <div className="mt-8 pt-6 border-t border-[#c5a880]/10 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">

            <div className="flex items-center gap-3">
              {activeUser?.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-4 py-1.5 border border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[9px] tracking-widest uppercase rounded-sm transition-all duration-300 font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  Admin Panel &rarr;
                </Link>
              )}
              {activeUser && (
                <button
                  onClick={() => {
                    handleLogout();
                    window.location.href = "/";
                  }}
                  className="px-4 py-1.5 border border-red-500/20 hover:border-red-500 bg-red-950/10 text-red-400 hover:bg-red-500/10 text-[9px] tracking-widest uppercase rounded-sm transition-all duration-300 font-semibold cursor-pointer"
                >
                  {dict.profile.logout}
                </button>
              )}

              {isVisitorMode && (
                <div className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-[#c5a880] bg-[#c5a880]/5 px-3 py-1.5 rounded-sm border border-[#c5a880]/20">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{dict.profile.simulatingPublic}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2-Column Section: Core shelves on left, Custom curations on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: CORE PROFILE SHELVES (Current Wardrobe & Favorites) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Shelf: Current Wardrobe */}
            <section className="glass-premium p-6 rounded-sm border border-[#c5a880]/15 bg-black/25">
              <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-4">
                <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c5a880]" /> {dict.profile.wardrobeTitle}
                </h3>
                <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                  {dict.profile.shelfStatus}
                </span>
              </div>

              {wardrobeIds.length === 0 ? (
                <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-6">{dict.profile.emptyWardrobe}</p>
              ) : (
                <div className="space-y-3">
                  {wardrobeIds.map(id => {
                    const p = getPerfume(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex justify-between items-center p-3 bg-black/40 border border-[#c5a880]/5 rounded-sm hover:border-[#c5a880]/20 transition-all duration-300">
                        <Link href={`/perfume/${id}`} className="flex-1 min-w-0 pr-4">
                          <span className="text-[8px] text-[#c5a880]/80 tracking-widest uppercase block">{p.brand}</span>
                          <h4 className="font-serif text-xs tracking-wider text-white font-medium truncate hover:text-[#c5a880] transition-colors">{p.name}</h4>
                        </Link>
                        {!isVisitorMode && (
                          <button
                            onClick={() => toggleWardrobe(id)}
                            className="p-1.5 text-[#f5f0e6]/30 hover:text-red-400 hover:bg-red-500/5 rounded-sm transition-all cursor-pointer"
                            title={dict.profile.removeFromWardrobe}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Shelf: My Favorites */}
            <section className="glass-premium p-6 rounded-sm border border-[#c5a880]/15 bg-black/25">
              <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-4">
                <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#c5a880]" /> {dict.profile.favTitle}
                </h3>
                <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                  {dict.profile.shelfStatus}
                </span>
              </div>

              {favoriteIds.length === 0 ? (
                <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-6">
                  {dict.profile.emptyFavorites}
                </p>
              ) : (
                <div className="space-y-3">
                  {favoriteIds.map(id => {
                    const p = getPerfume(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex justify-between items-center p-3 bg-black/40 border border-[#c5a880]/5 rounded-sm hover:border-[#c5a880]/20 transition-all duration-300">
                        <Link href={`/perfume/${id}`} className="flex-1 min-w-0 pr-4">
                          <span className="text-[8px] text-[#c5a880]/80 tracking-widest uppercase block">{p.brand}</span>
                          <h4 className="font-serif text-xs tracking-wider text-white font-medium truncate hover:text-[#c5a880] transition-colors">{p.name}</h4>
                        </Link>
                        {!isVisitorMode && (
                          <button
                            onClick={() => toggleFavorite(id)}
                            className="p-1.5 text-[#f5f0e6]/30 hover:text-red-400 hover:bg-red-500/5 rounded-sm transition-all cursor-pointer"
                            title={dict.profile.removeFromFavorites}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT: CUSTOM SCENT CURATIONS (Public & Private toggleable lists) */}
          <div className="lg:col-span-7 space-y-8">
            <section className="glass-premium p-6 rounded-sm border border-[#c5a880]/15 bg-black/25 flex-1">
              
              {/* Header with list adder */}
              <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-6">
                <div>
                  <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#c5a880]" /> {dict.profile.customTitle}
                  </h3>
                  <p className="text-[9px] text-[#f5f0e6]/45 uppercase mt-0.5 tracking-wider">
                    {dict.profile.listSubtitle}
                  </p>
                </div>
                
                {!isVisitorMode && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3.5 py-1.5 bg-[#c5a880] hover:bg-[#e5cda8] text-black text-[9px] tracking-[0.2em] uppercase font-bold rounded-sm transition-colors flex items-center gap-1.5 shadow-md shadow-[#c5a880]/5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {dict.profile.createListBtn}
                  </button>
                )}
              </div>

              {/* Lists loop */}
              {visibleLists.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[9px] text-[#f5f0e6]/30 uppercase tracking-[0.25em] mb-2">{dict.profile.emptyLists}</p>
                  {!isVisitorMode && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-[9px] text-[#c5a880] hover:text-white border-b border-[#c5a880]/40 hover:border-white pb-0.5 uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer bg-transparent"
                    >
                      {dict.profile.curateNow}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {visibleLists.map(list => (
                    <motion.div 
                      key={list.id} 
                      layout
                      className="p-5 border border-[#c5a880]/15 bg-black/40 rounded-sm relative overflow-hidden"
                    >
                      {/* Privacy Ribbon/Indicator */}
                      <div className="flex justify-between items-start mb-3 border-b border-[#c5a880]/5 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-sm tracking-wide font-semibold text-white">{list.name}</h4>
                            
                            {/* Privacy Badge */}
                            {list.isPrivate ? (
                              <span className="flex items-center gap-1 text-[8px] bg-orange-950/20 border border-orange-800/30 text-orange-400 font-semibold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                <Lock className="w-2.5 h-2.5" /> {language === "tr" ? "Gizli" : "Private"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[8px] bg-green-500/5 border border-green-500/20 text-[#c5a880] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                <Unlock className="w-2.5 h-2.5" /> {language === "tr" ? "Açık" : "Public"}
                              </span>
                            )}
                          </div>
                          
                          {list.description && (
                            <p className="text-[10px] text-[#f5f0e6]/50 mt-1 font-light max-w-lg leading-relaxed">{list.description}</p>
                          )}
                        </div>

                        {/* Owner Controls */}
                        {!isVisitorMode && (
                          <div className="flex items-center gap-2">
                            {/* Privacy Toggle Button */}
                            <button
                              onClick={() => toggleListPrivacy(list.id, !list.isPrivate)}
                              className="px-2.5 py-1 border border-[#c5a880]/20 hover:border-[#c5a880] rounded-sm text-[8px] tracking-wider uppercase text-[#c5a880] transition-colors cursor-pointer bg-transparent"
                              title={list.isPrivate ? (language === "tr" ? "Herkese Açık Yap" : "Make Public") : (language === "tr" ? "Gizli Yap" : "Make Private")}
                            >
                              {list.isPrivate ? (language === "tr" ? "Herkese Açık Yap" : "Make Public") : (language === "tr" ? "Kilitle / Gizle" : "Lock / Hide")}
                            </button>

                            {/* Delete List */}
                            <button
                              onClick={() => deleteCustomList(list.id)}
                              className="p-1.5 border border-red-500/10 hover:border-red-500 text-red-500 hover:bg-red-500/5 rounded-sm transition-all cursor-pointer"
                              title={language === "tr" ? "Listeyi Sil" : "Delete List"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Perfumes inside the list */}
                      {list.perfumeIds.length === 0 ? (
                        <p className="text-[9px] text-[#f5f0e6]/25 uppercase tracking-widest italic py-2">
                          {language === "tr" ? "Bu koleksiyona koku eklenmedi. Katalogdan koku ekleyin." : "No scents added to this collection. Add scents from the catalog."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {list.perfumeIds.map(perfId => {
                            const p = getPerfume(perfId);
                            if (!p) return null;
                            return (
                              <div key={perfId} className="flex justify-between items-center p-2.5 bg-black/60 border border-white/5 rounded-sm hover:border-[#c5a880]/25 transition-all duration-300 group">
                                <Link href={`/perfume/${perfId}`} className="flex-1 min-w-0 pr-2">
                                  <span className="text-[8px] text-[#c5a880]/60 tracking-widest uppercase block">{p.brand}</span>
                                  <span className="font-serif text-[11px] font-medium text-[#f5f0e6] group-hover:text-[#c5a880] transition-colors block truncate">{p.name}</span>
                                </Link>
                                
                                {!isVisitorMode && (
                                  <button
                                    onClick={() => removePerfumeFromList(list.id, perfId)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[#f5f0e6]/30 hover:text-red-400 transition-all cursor-pointer"
                                    title={dict.profile.removeFromList}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>

        {/* Dynamic Reviews Feed */}
        <section className="glass-premium p-6 md:p-8 rounded-sm border border-[#c5a880]/15 bg-black/25 mt-10">
          <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-6">
            <div>
              <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c5a880]" /> {dict.profile.reviewsTitle}
              </h3>
              <p className="text-[9px] text-[#f5f0e6]/45 uppercase mt-0.5 tracking-wider">
                {dict.profile.reviewsSubtitle}
              </p>
            </div>
            <span className="text-[9px] bg-[#c5a880]/10 text-[#c5a880] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-medium">
              {userReviews.length} {dict.profile.reviewsReport}
            </span>
          </div>

          {userReviews.length === 0 ? (
            <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-10">
              {dict.profile.reviewsEmpty}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userReviews.map((review) => (
                <div key={review.id} className="p-5 bg-black/40 border border-[#c5a880]/10 rounded-sm hover:border-[#c5a880]/30 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <Link href={`/perfume/${review.perfumeId}`} className="hover:opacity-80">
                        <span className="text-[8px] text-[#c5a880]/80 tracking-widest uppercase block">{review.brand}</span>
                        <h4 className="font-serif text-xs tracking-wider text-white font-medium">{review.perfumeName}</h4>
                      </Link>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${i < review.rating ? "text-[#c5a880] fill-[#c5a880]" : "text-[#f5f0e6]/10"}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#f5f0e6]/60 leading-relaxed font-light italic mb-6">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-[#f5f0e6]/35 border-t border-white/5 pt-3">
                    <span>{dict.profile.reviewsLog}</span>
                    <span>{dict.profile.reviewsPublished} {review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* List Creation Modal / Overlay */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0c0c0c] border border-[#c5a880]/30 p-6 md:p-8 max-w-md w-full rounded-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-[#c5a880]/10 pb-3 mb-5">
                <h3 className="font-serif text-md tracking-wider uppercase font-semibold text-white">
                  {dict.profile.listCreateTitle}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-[#f5f0e6]/40 hover:text-white uppercase tracking-wider cursor-pointer"
                >
                  {dict.profile.listClose} ×
                </button>
              </div>

              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="text-[9px] tracking-widest text-[#f5f0e6]/50 uppercase block mb-1.5">
                    {dict.profile.listNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    placeholder={dict.profile.listNamePlaceholder}
                    className="w-full bg-black/40 border border-[#c5a880]/20 rounded-sm py-2 px-3 text-xs text-[#f5f0e6] focus:outline-none focus:border-[#c5a880] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] tracking-widest text-[#f5f0e6]/50 uppercase block mb-1.5">
                    {dict.profile.listDescLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={newListDesc}
                    onChange={e => setNewListDesc(e.target.value)}
                    placeholder={dict.profile.listDescPlaceholder}
                    className="w-full bg-black/40 border border-[#c5a880]/20 rounded-sm py-2 px-3 text-xs text-[#f5f0e6] focus:outline-none focus:border-[#c5a880] transition-colors resize-none"
                  />
                </div>

                {/* Privacy switch layout */}
                <div className="p-4 bg-black/40 border border-[#c5a880]/10 rounded-sm flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] tracking-widest text-[#c5a880] uppercase font-bold block mb-0.5">
                      {dict.profile.listPrivacyLabel}
                    </span>
                    <span className="text-[9px] text-[#f5f0e6]/40 uppercase tracking-wide block">
                      {dict.profile.listPrivacyHint}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewListPrivate(!newListPrivate)}
                    className={`px-4 py-1.5 rounded-sm border text-[9px] tracking-widest uppercase transition-all duration-300 font-semibold cursor-pointer ${
                      newListPrivate
                        ? "bg-orange-950/20 border-orange-800/40 text-orange-400"
                        : "bg-green-500/5 border-green-500/20 text-[#c5a880]"
                    }`}
                  >
                    {newListPrivate ? dict.profile.listPrivateBadge : dict.profile.listPublicBadge}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#c5a880] hover:bg-[#e5cda8] text-black text-[10px] tracking-[0.25em] uppercase font-bold rounded-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#c5a880]/10 cursor-pointer"
                >
                  {dict.profile.listCreateBtn} <Sparkles className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-black border-t border-[#c5a880]/15 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#f5f0e6]/30 tracking-widest uppercase">
          <span>© {new Date().getFullYear()} {dict.hero.title}. {dict.footer.rights}</span>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-[#c5a880] transition-colors">{dict.footer.privacy}</span>
            <span className="cursor-pointer hover:text-[#c5a880] transition-colors">{dict.footer.terms}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
