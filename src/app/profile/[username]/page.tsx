"use client";

import { use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Unlock, 
  Heart, 
  Clock, 
  Bookmark, 
  User,
  ShieldCheck,
  Award,
  MessageSquare,
  Star
} from "lucide-react";
import { useScentSphere } from "@/components/ScentSphereContext";
import { Perfume } from "@/types/perfume";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const { userProfiles, submittedReviews, perfumes } = useScentSphere();

  // Find profile
  const profile = userProfiles[username];

  // Find all reviews written by this user across catalog and local submissions
  const userReviews = profile
    ? [
        ...perfumes.flatMap(p => 
          p.reviews
            .filter(r => r.user === username)
            .map(r => ({ ...r, perfumeId: p.id, perfumeName: p.name, brand: p.brand }))
        ),
        ...submittedReviews
          .filter(r => r.user === username)
          .map(r => {
            const p = perfumes.find(pf => pf.id === r.perfumeId);
            return { ...r, perfumeName: p?.name || r.perfumeId, brand: p?.brand || "" };
          })
      ]
    : [];

  // Helper to map perfume IDs to actual perfume objects
  const getPerfume = (id: string) => perfumes.find(p => p.id === id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f5f0e6] flex flex-col items-center justify-center p-6 selection:bg-[#c5a880] selection:text-black">
        <div className="glass-premium p-12 text-center max-w-md rounded-sm">
          <h1 className="font-serif text-3xl tracking-widest uppercase mb-4 text-[#c5a880]">Profile Void</h1>
          <p className="text-xs text-[#f5f0e6]/50 tracking-wider mb-8 leading-relaxed">
            The scent connoisseur you are searching for does not exist in our community archives.
          </p>
          <Link 
            href="/"
            className="px-6 py-3 bg-[#c5a880] hover:bg-[#e5cda8] text-black text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors duration-300 block"
          >
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  // Filter public custom lists
  const publicCustomLists = profile.customLists.filter(list => !list.isPrivate);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e6] font-sans selection:bg-[#c5a880] selection:text-black flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#c5a880]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-xs tracking-[0.2em] uppercase font-light text-[#f5f0e6]/70 hover:text-[#c5a880] transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Library
          </Link>

          <Link href="/" className="font-serif text-2xl tracking-[0.2em] gold-gradient-text uppercase font-bold">
            UCA
          </Link>

          <Link href="/consultant" className="text-xs tracking-[0.2em] uppercase font-light text-[#c5a880] hover:text-[#e5cda8] border border-[#c5a880]/30 px-3 py-1 rounded-sm transition-colors">
            Scent Consultant
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e5cda8]/10 via-[#c5a880]/10 to-transparent border border-[#c5a880]/20 flex items-center justify-center text-2xl font-serif text-[#c5a880] font-bold">
                {profile.displayName.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-2xl md:text-3xl tracking-wide font-bold">{profile.displayName}</h1>
                  <span className="text-[10px] tracking-widest text-[#c5a880]/60 uppercase bg-[#c5a880]/5 border border-[#c5a880]/10 px-2 py-0.5 rounded-sm">
                    @{profile.username}
                  </span>
                </div>
                <p className="text-xs text-[#f5f0e6]/60 mt-1 max-w-xl font-light leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Stats Badges */}
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">Wardrobe</span>
                <span className="font-serif text-lg font-bold text-white">{profile.wardrobe.length}</span>
              </div>
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">Favorites</span>
                <span className="font-serif text-lg font-bold text-white">{profile.favorites.length}</span>
              </div>
              <div className="text-center px-4 py-2 border border-[#c5a880]/10 bg-black/40 rounded-sm min-w-[80px]">
                <span className="text-[9px] tracking-widest text-[#f5f0e6]/40 uppercase block mb-1">Custom Lists</span>
                <span className="font-serif text-lg font-bold text-white">{publicCustomLists.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#c5a880]/10 flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-[#c5a880]/80">
            <ShieldCheck className="w-4 h-4" />
            <span>Browsing public verified fragrance shelves</span>
          </div>
        </section>

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: CORE PROFILE SHELVES */}
          <div className="lg:col-span-5 space-y-8">
            {/* Shelf: Current Wardrobe */}
            <section className="glass-premium p-6 rounded-sm border border-[#c5a880]/15 bg-black/25">
              <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-4">
                <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c5a880]" /> Wardrobe
                </h3>
              </div>

              {profile.wardrobe.length === 0 ? (
                <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-6">Wardrobe shelf is empty.</p>
              ) : (
                <div className="space-y-3">
                  {profile.wardrobe.map(id => {
                    const p = getPerfume(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="p-3 bg-black/40 border border-[#c5a880]/5 rounded-sm hover:border-[#c5a880]/20 transition-all duration-300">
                        <Link href={`/perfume/${id}`} className="block">
                          <span className="text-[8px] text-[#c5a880]/80 tracking-widest uppercase block">{p.brand}</span>
                          <span className="font-serif text-xs tracking-wider text-white font-medium hover:text-[#c5a880] transition-colors block truncate">{p.name}</span>
                        </Link>
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
                  <Heart className="w-4 h-4 text-[#c5a880]" /> Favorites
                </h3>
              </div>

              {profile.favorites.length === 0 ? (
                <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-6">Favorites shelf is empty.</p>
              ) : (
                <div className="space-y-3">
                  {profile.favorites.map(id => {
                    const p = getPerfume(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="p-3 bg-black/40 border border-[#c5a880]/5 rounded-sm hover:border-[#c5a880]/20 transition-all duration-300">
                        <Link href={`/perfume/${id}`} className="block">
                          <span className="text-[8px] text-[#c5a880]/80 tracking-widest uppercase block">{p.brand}</span>
                          <span className="font-serif text-xs tracking-wider text-white font-medium hover:text-[#c5a880] transition-colors block truncate">{p.name}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: PUBLIC CUSTOM SCENT CURATIONS */}
          <div className="lg:col-span-7 space-y-8">
            <section className="glass-premium p-6 rounded-sm border border-[#c5a880]/15 bg-black/25 flex-1">
              <div className="flex items-center justify-between border-b border-[#c5a880]/10 pb-3 mb-6">
                <div>
                  <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#c5a880]" /> Scent Collections
                  </h3>
                  <p className="text-[9px] text-[#f5f0e6]/45 uppercase mt-0.5 tracking-wider">Curated scent collections & staples</p>
                </div>
              </div>

              {publicCustomLists.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest">No public scent lists found.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {publicCustomLists.map(list => (
                    <div key={list.id} className="p-5 border border-[#c5a880]/15 bg-black/40 rounded-sm relative">
                      <div className="border-b border-[#c5a880]/5 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-sm tracking-wide font-semibold text-white">{list.name}</h4>
                          <span className="flex items-center gap-1 text-[8px] bg-green-500/5 border border-green-500/20 text-[#c5a880] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            <Unlock className="w-2.5 h-2.5" /> Public Collection
                          </span>
                        </div>
                        {list.description && (
                          <p className="text-[10px] text-[#f5f0e6]/50 mt-1 font-light max-w-lg leading-relaxed">{list.description}</p>
                        )}
                      </div>

                      {list.perfumeIds.length === 0 ? (
                        <p className="text-[9px] text-[#f5f0e6]/25 uppercase tracking-widest italic py-2">No scents in this collection.</p>
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
                <MessageSquare className="w-4 h-4 text-[#c5a880]" /> Sensory Reviews Feed
              </h3>
              <p className="text-[9px] text-[#f5f0e6]/45 uppercase mt-0.5 tracking-wider">Automated registry of published olfactory reports</p>
            </div>
            <span className="text-[9px] bg-[#c5a880]/10 text-[#c5a880] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-medium">
              {userReviews.length} Reports
            </span>
          </div>

          {userReviews.length === 0 ? (
            <p className="text-[10px] text-[#f5f0e6]/30 uppercase tracking-widest text-center py-10">This connoisseur has not submitted any olfactory reports yet.</p>
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
                    <span>OLFACTORY LOG</span>
                    <span>PUBLISHED: {review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
