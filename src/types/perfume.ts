export interface PerfumeNotes {
  top: string[];
  mid: string[];
  base: string[];
  heart?: string[];
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface OlfactoryProfile {
  Floral: number;
  Woody: number;
  Spicy: number;
  Fresh: number;
  Sweet: number;
}

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  gender: 'Unisex' | 'Men' | 'Women' | 'Shared';
  rating: number;
  description: string;
  description_en: string;
  description_tr: string;
  notes: PerfumeNotes;
  reviews: Review[];
  olfactoryProfile: OlfactoryProfile;
  concentration?: string; // e.g., "Eau de Parfum", "Extrait de Parfum"
  image?: string; // Image path or placeholder
  yearReleased?: number;
  /** Accepts both legacy display strings and canonical API enum keys */
  sillage: 'Intimate' | 'Moderate' | 'Heavy' | 'Nuclear' | 'MODERATE' | 'HEAVY' | 'INTIMATE' | 'NUCLEAR' | string;
  longevity: 'Ephemeral' | 'Moderate' | 'Long-Lasting' | 'Eternal' | 'LONG-LASTING' | 'EPHEMERAL' | 'ETERNAL' | string;
  seasons: string[];
  occasions: string[];
  audience?: string;
}

