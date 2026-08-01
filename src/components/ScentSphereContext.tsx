"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Perfume } from "@/types/perfume";
import perfumesData from "@/data/perfumesData.json";
import { dictionaries } from "@/data/translations";

export interface CustomScentList {
  id: string;
  name: string;
  description?: string;
  perfumeIds: string[];
  isPrivate: boolean; // Dynamic list privacy: Public vs. Private
  createdAt: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  wardrobe: string[];  // Perfume IDs (Permanently Public)
  favorites: string[]; // Perfume IDs (Permanently Public)
  customLists: CustomScentList[];
  password?: string;
  email?: string;
  role?: "admin" | "user" | "ADMIN" | "USER";
}

export interface ReviewReply {
  id: string;
  parentId?: string; // Cap nesting visually, but keep logical threads
  user: string;
  comment: string;
  date: string;
}

export interface UserReview {
  id: string;
  perfumeId: string;
  user: string;
  comment: string;
  rating: number;
  date: string;
}

export interface ReviewRepliesMap {
  [perfumeId: string]: {
    [reviewId: string]: ReviewReply[];
  };
}

/** Shaped review record returned by GET /api/reviews and POST /api/reviews */
export interface HomeReview {
  id: number;
  perfumeId: string;
  perfumeName: string;
  brand: string;
  rating: number;
  comment: string;
  user: string;       // username string
  date: string;       // "YYYY-MM-DD"
  createdAt: string;  // full ISO timestamp
}

interface ScentSphereContextType {
  currentUser: UserProfile;
  activeUser: UserProfile | null;
  userProfiles: { [username: string]: UserProfile };
  reviewsReplies: ReviewRepliesMap;
  submittedReviews: UserReview[];
  perfumes: Perfume[];
  homeReviews: HomeReview[];
  addPerfume: (perfume: Perfume) => void;
  updatePerfume: (id: string, perfume: Perfume) => void;
  deletePerfume: (id: string) => void;
  reloadPerfumes: () => Promise<void>;
  reloadHomeReviews: () => Promise<void>;
  submitHomeReview: (perfumeId: string, rating: number, comment: string, usernameOverride?: string) => Promise<void>;
  addToWardrobe: (perfumeId: string) => void;
  removeFromWardrobe: (perfumeId: string) => void;
  addToFavorites: (perfumeId: string) => void;
  removeFromFavorites: (perfumeId: string) => void;
  createCustomList: (name: string, description: string, isPrivate: boolean) => void;
  deleteCustomList: (listId: string) => void;
  updateCustomList: (listId: string, updates: Partial<CustomScentList>) => void;
  toggleListPrivacy: (listId: string, isPrivate: boolean) => void;
  addPerfumeToList: (listId: string, perfumeId: string) => void;
  removePerfumeFromList: (listId: string, perfumeId: string) => void;
  addReplyToReview: (perfumeId: string, reviewId: string, parentId: string | undefined, comment: string, user: string) => void;
  addReview: (perfumeId: string, rating: number, comment: string, user: string) => void;
  handleLogin: (username: string, passwordSecret: string, dbUser?: { id: number; username: string; email: string; createdAt: string; role?: string }) => void;
  handleSignUp: (username: string, passwordSecret: string, email?: string, dbUser?: { id: number; username: string; email: string; createdAt: string; role?: string }) => void;
  handleLogout: () => void;
  language: 'en' | 'tr';
  toggleLanguage: () => void;
  t: (key: string) => string;
  dict: typeof dictionaries.en;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userId: number | null;
  wardrobeIds: string[];
  favoriteIds: string[];
  toggleWardrobe: (perfumeId: string) => Promise<void>;
  toggleFavorite: (perfumeId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  /** True once the localStorage hydration pass has completed — safe to evaluate auth state after this. */
  sessionLoaded: boolean;
}

const ScentSphereContext = createContext<ScentSphereContextType | undefined>(undefined);

// Initial Mock Profiles
const initialProfiles: { [username: string]: UserProfile } = {
  Founder: {
    username: "Founder",
    displayName: "Umut",
    email: "founder@uca.com",
    password: "password",
    role: "admin",
    bio: "UCA Creator & Master Archivist.",
    avatarUrl: "/avatars/founder.jpg",
    wardrobe: ["ganymede", "aventus"],
    favorites: ["baccarat-rouge-540-extrait"],
    customLists: []
  },
  NoseConnoisseur: {
    username: "NoseConnoisseur",
    displayName: "Alex Carter",
    password: "password",
    bio: "Sensory architect, niche specialist, and collector of rare extraits.",
    avatarUrl: "/avatars/alex.jpg",
    wardrobe: ["bleu-de-chanel", "aventus"],
    favorites: ["ganymede", "baccarat-rouge-540-extrait"],
    customLists: [
      {
        id: "winter-staples",
        name: "My Winter Staples",
        description: "Heavy ambers, dry woods, and warm spices for freezing temperatures.",
        perfumeIds: ["shalimar", "black-xs-men"],
        isPrivate: false,
        createdAt: "2026-01-10T12:00:00Z"
      },
      {
        id: "date-night-killers",
        name: "Date Night Killers",
        description: "Intimate skin projection, vanilla, leather, and hypnotic trails.",
        perfumeIds: ["black-opium", "ganymede"],
        isPrivate: true, // Private custom list
        createdAt: "2026-02-14T20:30:00Z"
      }
    ]
  },
  ScentSage: {
    username: "ScentSage",
    displayName: "Sophia Lee",
    password: "password",
    bio: "Dedicated perfume reviewer. Always seeking the perfect dry oakmoss and damp pine notes.",
    avatarUrl: "/avatars/sophia.jpg",
    wardrobe: ["miss-dior-blooming-bouquet", "shalimar"],
    favorites: ["black-opium", "aventus"],
    customLists: [
      {
        id: "office-essentials",
        name: "Sophisticated Office Scents",
        description: "Subtle, non-offensive fresh scents that still carry a professional edge.",
        perfumeIds: ["bleu-de-chanel", "miss-dior-blooming-bouquet"],
        isPrivate: false,
        createdAt: "2026-03-01T09:15:00Z"
      }
    ]
  }
};

const defaultReplies: ReviewRepliesMap = {
  "baccarat-rouge-540-extrait": {
    "rev-br-1": [
      {
        id: "rep-1",
        user: "ScentSage",
        comment: "Completely agree with this description. The metallic/salty aspect is what makes Baccarat so polarizing, yet brilliant.",
        date: "2026-06-28"
      },
      {
        id: "rep-2",
        parentId: "rep-1",
        user: "NoseConnoisseur",
        comment: "Yes! The ethyl maltol sugar rush cuts right through the ambergris saltiness in such an architectural way.",
        date: "2026-06-29"
      }
    ]
  }
};

export const ScentSphereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [userProfilesArray, setUserProfilesArray] = useState<UserProfile[]>(Object.values(initialProfiles));
  const [reviewsReplies, setReviewsReplies] = useState<ReviewRepliesMap>(defaultReplies);
  const [submittedReviews, setSubmittedReviews] = useState<UserReview[]>([]);
  const [perfumes, setPerfumes] = useState<Perfume[]>(perfumesData as Perfume[]);
  const [homeReviews, setHomeReviews] = useState<HomeReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tr'>('en');
  const [searchQuery, setSearchQuery] = useState("");

  const [userId, setUserId] = useState<number | null>(1); // Simulating active user CANN (id: 1)
  const [wardrobeIds, setWardrobeIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const refreshUserData = async () => {
    if (!userId) return;
    try {
      const [wardrobeRes, favoritesRes] = await Promise.all([
        fetch(`/api/wardrobe?userId=${userId}`),
        fetch(`/api/favorites?userId=${userId}`)
      ]);
      if (wardrobeRes.ok) {
        const wardrobes = await wardrobeRes.json();
        setWardrobeIds(wardrobes.map((item: any) => item.perfumeId));
      }
      if (favoritesRes.ok) {
        const favorites = await favoritesRes.json();
        setFavoriteIds(favorites.map((item: any) => item.perfumeId));
      }
    } catch (error) {
      console.error("Error hydrating context collections from Database:", error);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [userId]);

  const toggleWardrobe = async (perfumeId: string) => {
    const activeUserId = userId ?? 1;
    const isAdded = wardrobeIds.includes(perfumeId);

    // Optimistic UI state update
    setWardrobeIds(prev => isAdded ? prev.filter(id => id !== perfumeId) : [...prev, perfumeId]);

    try {
      const res = await fetch("/api/wardrobe", {
        method: isAdded ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: Number(activeUserId),
          perfumeId,
          status: "OWNED"
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed API response");
      }
    } catch (err) {
      console.error("Wardrobe action failed, executing state rollback:", err);
      // Rollback on failure
      setWardrobeIds(prev => isAdded ? [...prev, perfumeId] : prev.filter(id => id !== perfumeId));
    }
  };

  const toggleFavorite = async (perfumeId: string) => {
    const activeUserId = userId ?? 1;
    const isAdded = favoriteIds.includes(perfumeId);

    // Optimistic UI state update
    setFavoriteIds(prev => isAdded ? prev.filter(id => id !== perfumeId) : [...prev, perfumeId]);

    try {
      const res = await fetch("/api/favorites", {
        method: isAdded ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: Number(activeUserId),
          perfumeId 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed API response");
      }
    } catch (err) {
      console.error("Favorites action failed, executing state rollback:", err);
      // Rollback on failure
      setFavoriteIds(prev => isAdded ? [...prev, perfumeId] : prev.filter(id => id !== perfumeId));
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'tr' : 'en');
  };

  const dict = dictionaries[language] || dictionaries.en;

  const t = (key: string): string => {
    const keys = key.split('.');
    // Try the active language first
    let current: any = dict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback: try English dictionary so missing TR keys degrade gracefully
        let fallback: any = dictionaries.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // Key does not exist in either locale — return key path
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof current === 'string' ? current : key;
  };

  const userProfiles = userProfilesArray.reduce<{ [username: string]: UserProfile }>((acc, p) => {
    acc[p.username] = p;
    return acc;
  }, {});

  const currentUser = activeUser || {
    username: "Guest",
    displayName: dict.profile?.guestName ?? "Guest Connoisseur",
    bio: dict.profile?.guestBio ?? "Anonymous browsing session",
    wardrobe: [],
    favorites: [],
    customLists: []
  };

  // Sync state from localStorage on mount, then hydrate perfumes from MySQL.
  // The static perfumesData.json provides an instant first-render seed;
  // the /api/perfumes response silently supersedes it once resolved.
  useEffect(() => {
    try {
      localStorage.removeItem("uca_perfumes");

      const storedActiveUser    = localStorage.getItem("uca_active_user");
      const storedProfilesArray = localStorage.getItem("uca_profiles_array");
      const storedReplies       = localStorage.getItem("uca_replies");
      const storedReviews       = localStorage.getItem("uca_submitted_reviews");
      const storedLanguage      = localStorage.getItem("uca_language");

      if (storedActiveUser)    setActiveUser(JSON.parse(storedActiveUser));
      if (storedProfilesArray) setUserProfilesArray(JSON.parse(storedProfilesArray));
      if (storedReplies)       setReviewsReplies(JSON.parse(storedReplies));
      if (storedReviews)       setSubmittedReviews(JSON.parse(storedReviews));
      if (storedLanguage === "en" || storedLanguage === "tr") setLanguage(storedLanguage);
    } catch (e) {
      console.error("Failed to load local storage state", e);
    }
    setLoaded(true);

    // Live DB hydration — inline fetch so there is no forward-reference TDZ issue.
    fetch("/api/perfumes", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then((data: import("@/types/perfume").Perfume[] | null) => {
        if (Array.isArray(data) && data.length > 0) setPerfumes(data);
      })
      .catch(err => console.warn("[UCAContext] DB hydration failed — keeping static JSON seed:", err));

    // Hydrate homepage reviews from the database.
    fetch("/api/reviews", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then((data: HomeReview[]) => {
        if (Array.isArray(data)) setHomeReviews(data);
      })
      .catch(err => console.warn("[UCAContext] Reviews hydration failed:", err));
  }, []);

  // Save changes to localStorage
  // NOTE: perfumes are intentionally excluded — they are always hydrated fresh
  // from the static JSON source to prevent stale/filtered data from persisting.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("uca_active_user", JSON.stringify(activeUser));
      localStorage.setItem("uca_profiles_array", JSON.stringify(userProfilesArray));
      localStorage.setItem("uca_replies", JSON.stringify(reviewsReplies));
      localStorage.setItem("uca_submitted_reviews", JSON.stringify(submittedReviews));
      localStorage.setItem("uca_language", language);
    } catch (e) {
      console.error("Failed to save state to local storage", e);
    }
  }, [activeUser, userProfilesArray, reviewsReplies, submittedReviews, language, loaded]);

  const addPerfume = (newPerfume: Perfume) => {
    setPerfumes(prev => {
      if (prev.some(p => p.id === newPerfume.id)) return prev;
      return [...prev, newPerfume];
    });
  };

  const updatePerfume = (id: string, updated: Perfume) => {
    setPerfumes(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deletePerfume = (id: string) => {
    setPerfumes(prev => prev.filter(p => p.id !== id));
  };

  /**
   * loadPerfumesFromDB — fetches the full catalogue from /api/perfumes and
   * replaces the local state with the authoritative MySQL snapshot.
   * Falls back silently on network failure so the static JSON seed remains.
   */
  const loadPerfumesFromDB = async (): Promise<void> => {
    try {
      const res = await fetch("/api/perfumes", { cache: "no-store" });
      if (!res.ok) return;
      const data: Perfume[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPerfumes(data);
      }
    } catch (err) {
      console.warn("[UCAContext] DB fetch failed — keeping static JSON seed:", err);
    }
  };

  const reloadPerfumes = loadPerfumesFromDB;

  /**
   * reloadHomeReviews — fetches the full review list from /api/reviews and
   * replaces the homeReviews state with the latest DB snapshot.
   */
  const reloadHomeReviews = async (): Promise<void> => {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (!res.ok) return;
      const data: HomeReview[] = await res.json();
      if (Array.isArray(data)) setHomeReviews(data);
    } catch (err) {
      console.warn("[UCAContext] reloadHomeReviews failed:", err);
    }
  };

  /**
   * submitHomeReview — POSTs a new review to /api/reviews using the current
   * active user's username as the auth credential. Refreshes the homeReviews
   * state on success. Throws on failure so callers can show error UI.
   */
  const submitHomeReview = async (
    perfumeId: string,
    rating: number,
    comment: string,
    usernameOverride?: string
  ): Promise<void> => {
    // Resolve the username: prefer explicit override, then logged-in user, then "Guest"
    const username = usernameOverride?.trim() || activeUser?.username || "Guest";
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perfumeId,
        rating,
        comment,
        username,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Failed to submit review.");
    }
    const newReview: HomeReview = await res.json();
    // Prepend so it appears at the top (newest-first order)
    setHomeReviews(prev => [newReview, ...prev]);
  };

  const updateAllProfilesWithUser = (updatedUser: UserProfile) => {
    if (activeUser && activeUser.username === updatedUser.username) {
      setActiveUser(updatedUser);
    }
    setUserProfilesArray(prev => prev.map(p => p.username === updatedUser.username ? updatedUser : p));
  };

  const addToWardrobe = (perfumeId: string) => {
    if (!wardrobeIds.includes(perfumeId)) {
      toggleWardrobe(perfumeId);
    }
  };

  const removeFromWardrobe = (perfumeId: string) => {
    if (wardrobeIds.includes(perfumeId)) {
      toggleWardrobe(perfumeId);
    }
  };

  const addToFavorites = (perfumeId: string) => {
    if (!favoriteIds.includes(perfumeId)) {
      toggleFavorite(perfumeId);
    }
  };

  const removeFromFavorites = (perfumeId: string) => {
    if (favoriteIds.includes(perfumeId)) {
      toggleFavorite(perfumeId);
    }
  };

  const createCustomList = (name: string, description: string, isPrivate: boolean) => {
    const newList: CustomScentList = {
      id: `list-${Date.now()}`,
      name,
      description,
      perfumeIds: [],
      isPrivate,
      createdAt: new Date().toISOString()
    };
    const updated = {
      ...currentUser,
      customLists: [...currentUser.customLists, newList]
    };
    updateAllProfilesWithUser(updated);
  };

  const deleteCustomList = (listId: string) => {
    const updated = {
      ...currentUser,
      customLists: currentUser.customLists.filter(l => l.id !== listId)
    };
    updateAllProfilesWithUser(updated);
  };

  const updateCustomList = (listId: string, updates: Partial<CustomScentList>) => {
    const updated = {
      ...currentUser,
      customLists: currentUser.customLists.map(l => 
        l.id === listId ? { ...l, ...updates } : l
      )
    };
    updateAllProfilesWithUser(updated);
  };

  const toggleListPrivacy = (listId: string, isPrivate: boolean) => {
    updateCustomList(listId, { isPrivate });
  };

  const addPerfumeToList = (listId: string, perfumeId: string) => {
    const list = currentUser.customLists.find(l => l.id === listId);
    if (!list || list.perfumeIds.includes(perfumeId)) return;
    
    updateCustomList(listId, {
      perfumeIds: [...list.perfumeIds, perfumeId]
    });
  };

  const removePerfumeFromList = (listId: string, perfumeId: string) => {
    const list = currentUser.customLists.find(l => l.id === listId);
    if (!list) return;
    
    updateCustomList(listId, {
      perfumeIds: list.perfumeIds.filter(id => id !== perfumeId)
    });
  };

  const addReplyToReview = (
    perfumeId: string, 
    reviewId: string, 
    parentId: string | undefined, 
    comment: string, 
    user: string
  ) => {
    const newReply: ReviewReply = {
      id: `rep-${Date.now()}`,
      parentId,
      user,
      comment,
      date: new Date().toISOString().split("T")[0]
    };

    setReviewsReplies(prev => {
      const perfumeReplies = prev[perfumeId] || {};
      const reviewRepliesList = perfumeReplies[reviewId] || [];
      return {
        ...prev,
        [perfumeId]: {
          ...perfumeReplies,
          [reviewId]: [...reviewRepliesList, newReply]
        }
      };
    });
  };

  const addReview = (
    perfumeId: string,
    rating: number,
    comment: string,
    user: string
  ) => {
    const newReview: UserReview = {
      id: `rev-${Date.now()}`,
      perfumeId,
      user,
      comment,
      rating,
      date: new Date().toISOString().split("T")[0]
    };
    setSubmittedReviews(prev => [...prev, newReview]);
  };

  const handleSignUp = (
    usernameOrEmail: string,
    passwordSecret: string,
    emailOverride?: string,
    dbUser?: { id: number; username: string; email: string; createdAt: string; role?: string }
  ) => {
    // If the API already persisted the user, use its canonical username/email;
    // otherwise fall back to the locally-derived values (mock / dev mode).
    const resolvedUsername = dbUser?.username ?? (
      usernameOrEmail.includes("@") ? usernameOrEmail.split("@")[0] : usernameOrEmail
    );
    const resolvedEmail = dbUser?.email ?? emailOverride ?? (
      usernameOrEmail.includes("@") ? usernameOrEmail.trim().toLowerCase() : undefined
    );

    const cleanInput = resolvedEmail?.toLowerCase() ?? resolvedUsername.toLowerCase();
    const exists = userProfilesArray.some(
      p => p.username.toLowerCase() === resolvedUsername.toLowerCase() ||
           (p.email && resolvedEmail && p.email.toLowerCase() === resolvedEmail)
    );
    if (exists) {
      // Profile already synced (e.g. hot-reload) — just activate it.
      const existing = userProfilesArray.find(
        p => p.username.toLowerCase() === resolvedUsername.toLowerCase()
      );
      if (existing) { setActiveUser(existing); return; }
    }

    const isAdmin = cleanInput === "founder@uca.com" ||
                    cleanInput === "admin@uca.com" ||
                    cleanInput === "umut@uca.com" ||
                    cleanInput === "umut3@uca.com";

    const newProfile: UserProfile = {
      username:    resolvedUsername,
      displayName: resolvedUsername,
      email:       resolvedEmail,
      password:    passwordSecret,
      role:        (dbUser?.role as any) || (isAdmin ? "admin" : "user"),
      bio:         isAdmin ? "UCA Creator & Master Archivist." : "Fragrance enthusiast.",
      wardrobe:    [],
      favorites:   [],
      customLists: []
    };

    setUserProfilesArray(prev => [...prev, newProfile]);
    setActiveUser(newProfile);
  };

  const handleLogin = (
    usernameOrEmail: string,
    passwordSecret: string,
    dbUser?: { id: number; username: string; email: string; createdAt: string; role?: string }
  ) => {
    // When called from the auth page after a successful API response, we trust
    // the dbUser payload and use it to resolve the canonical username/email.
    const resolvedUsername = dbUser?.username ?? usernameOrEmail.trim();
    const resolvedEmail    = dbUser?.email    ?? (usernameOrEmail.includes("@") ? usernameOrEmail.trim().toLowerCase() : undefined);
    const cleanInput = (resolvedEmail ?? resolvedUsername).toLowerCase();

    let matched = userProfilesArray.find(
      p => p.username.toLowerCase() === resolvedUsername.toLowerCase() ||
           (p.email && resolvedEmail && p.email.toLowerCase() === resolvedEmail)
    );

    const isAdmin = cleanInput === "founder@uca.com" ||
                    cleanInput === "admin@uca.com"  ||
                    cleanInput === "umut@uca.com"   ||
                    cleanInput === "umut3@uca.com";

    if (!matched) {
      // User exists in the DB but not yet in the local context (e.g. fresh tab).
      // Bootstrap a local profile from the DB payload.
      const bootstrapped: UserProfile = {
        username:    resolvedUsername,
        displayName: resolvedUsername,
        email:       resolvedEmail,
        password:    passwordSecret,
        role:        (dbUser?.role as any) || (isAdmin ? "admin" : "user"),
        bio:         isAdmin ? "UCA Creator & Master Archivist." : "Fragrance enthusiast.",
        avatarUrl:   isAdmin ? "/avatars/founder.jpg" : undefined,
        wardrobe:    isAdmin ? ["ganymede", "aventus"] : [],
        favorites:   isAdmin ? ["baccarat-rouge-540-extrait"] : [],
        customLists: []
      };
      setUserProfilesArray(prev => [...prev, bootstrapped]);
      setActiveUser(bootstrapped);
      return;
    }

    // For users already present in the local mock profiles, also accept password
    // mismatches gracefully when a dbUser token was provided (API already validated).
    if (!dbUser && matched.password !== passwordSecret) {
      throw new Error("Invalid username/email or password");
    }

    matched = {
      ...matched,
      role: (dbUser?.role as any) || (isAdmin ? "admin" : (matched.role || "user")),
    };

    setActiveUser(matched);
  };

  const handleLogout = () => {
    setActiveUser(null);
  };

  return (
    <ScentSphereContext.Provider
      value={{
        currentUser,
        activeUser,
        userProfiles,
        reviewsReplies,
        submittedReviews,
        perfumes,
        homeReviews,
        addPerfume,
        updatePerfume,
        deletePerfume,
        reloadPerfumes,
        reloadHomeReviews,
        submitHomeReview,
        addToWardrobe,
        removeFromWardrobe,
        addToFavorites,
        removeFromFavorites,
        createCustomList,
        deleteCustomList,
        updateCustomList,
        toggleListPrivacy,
        addPerfumeToList,
        removePerfumeFromList,
        addReplyToReview,
        addReview,
        handleLogin,
        handleSignUp,
        handleLogout,
        language,
        toggleLanguage,
        t,
        dict,
        searchQuery,
        setSearchQuery,
        userId,
        wardrobeIds,
        favoriteIds,
        toggleWardrobe,
        toggleFavorite,
        refreshUserData,
        sessionLoaded: loaded,
      }}
    >
      {children}
    </ScentSphereContext.Provider>
  );
};

export const useScentSphere = () => {
  const context = useContext(ScentSphereContext);
  if (context === undefined) {
    throw new Error("useScentSphere must be used within a UCAProvider");
  }
  return context;
};
