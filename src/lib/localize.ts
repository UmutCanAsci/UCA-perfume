/**
 * src/lib/localize.ts
 * ───────────────────
 * Comprehensive localization helpers for database Enums (Sillage, Longevity,
 * Occasion, Season) and fragrance notes across ScentSphere.
 */

import { translateRaw } from "@/data/translations";
import { getLocalizedField } from "@/lib/i18n";

export const SILLAGE_MAP: Record<string, { tr: string; en: string }> = {
  MODERATE:    { tr: "Orta", en: "Moderate" },
  Moderate:    { tr: "Orta", en: "Moderate" },
  INTENSE:     { tr: "Yüksek / Güçlü", en: "Intense" },
  Intense:     { tr: "Yüksek / Güçlü", en: "Intense" },
  HEAVY:       { tr: "Yüksek / Güçlü", en: "Heavy" },
  Heavy:       { tr: "Yüksek / Güçlü", en: "Heavy" },
  STRONG:      { tr: "Yüksek / Güçlü", en: "Strong" },
  Strong:      { tr: "Yüksek / Güçlü", en: "Strong" },
  LIGHT:       { tr: "Hafif", en: "Light" },
  Light:       { tr: "Hafif", en: "Light" },
  SOFT:        { tr: "Hafif", en: "Soft" },
  Soft:        { tr: "Hafif", en: "Soft" },
  ENORMOUS:    { tr: "Çok Yüksek", en: "Enormous" },
  Enormous:    { tr: "Çok Yüksek", en: "Enormous" },
};

export const LONGEVITY_MAP: Record<string, { tr: string; en: string }> = {
  "LONG-LASTING":     { tr: "Uzun Ömürlü", en: "Long-Lasting" },
  "Long-Lasting":     { tr: "Uzun Ömürlü", en: "Long-Lasting" },
  LONG_LASTING:       { tr: "Uzun Ömürlü", en: "Long-Lasting" },
  MODERATE:           { tr: "Orta", en: "Moderate" },
  Moderate:           { tr: "Orta", en: "Moderate" },
  VERY_LONG_LASTING:  { tr: "Çok Kalıcı", en: "Very Long-Lasting" },
  "Very Long-Lasting": { tr: "Çok Kalıcı", en: "Very Long-Lasting" },
  "VERY-LONG-LASTING": { tr: "Çok Kalıcı", en: "Very Long-Lasting" },
  ETERNAL:            { tr: "Çok Kalıcı", en: "Eternal" },
  Eternal:            { tr: "Çok Kalıcı", en: "Eternal" },
  POOR:               { tr: "Zayıf", en: "Poor" },
  Poor:               { tr: "Zayıf", en: "Poor" },
  WEAK:               { tr: "Zayıf", en: "Weak" },
  Weak:               { tr: "Zayıf", en: "Weak" },
};

export const OCCASION_MAP: Record<string, { tr: string; en: string }> = {
  CasualEveryday:      { tr: "Günlük Kullanım", en: "Casual Everyday" },
  "CASUAL EVERYDAY":   { tr: "Günlük Kullanım", en: "Casual Everyday" },
  "Casual Everyday":   { tr: "Günlük Kullanım", en: "Casual Everyday" },
  CASUAL:              { tr: "Günlük Kullanım", en: "Casual" },
  Casual:              { tr: "Günlük Kullanım", en: "Casual" },
  OfficeSafe:          { tr: "Ofis & İş", en: "Office Safe" },
  "OFFICE SAFE":       { tr: "Ofis & İş", en: "Office Safe" },
  "Office Safe":       { tr: "Ofis & İş", en: "Office Safe" },
  OFFICESAFE:          { tr: "Ofis & İş", en: "Office Safe" },
  Office:              { tr: "Ofis & İş", en: "Office" },
  DateNight:           { tr: "Gece Randevusu", en: "Date Night" },
  "DATE NIGHT":        { tr: "Gece Randevusu", en: "Date Night" },
  "Date Night":        { tr: "Gece Randevusu", en: "Date Night" },
  DATENIGHT:           { tr: "Gece Randevusu", en: "Date Night" },
  Date:                { tr: "Gece Randevusu", en: "Date" },
  GalaFormal:          { tr: "Gala & Resmi", en: "Gala & Formal" },
  "GALA FORMAL":       { tr: "Gala & Resmi", en: "Gala & Formal" },
  "Gala Formal":       { tr: "Gala & Resmi", en: "Gala & Formal" },
  GALAFORMAL:          { tr: "Gala & Resmi", en: "Gala & Formal" },
  Formal:              { tr: "Gala & Resmi", en: "Formal" },
  FORMAL:              { tr: "Gala & Resmi", en: "Formal" },
  SignatureScent:      { tr: "İmza Koku", en: "Signature Scent" },
  "SIGNATURE SCENT":   { tr: "İmza Koku", en: "Signature Scent" },
  "Signature Scent":   { tr: "İmza Koku", en: "Signature Scent" },
  SIGNATURESCENT:      { tr: "İmza Koku", en: "Signature Scent" },
  Signature:           { tr: "İmza Koku", en: "Signature" },
};

export const SEASON_MAP: Record<string, { tr: string; en: string }> = {
  Spring:       { tr: "İlkbahar", en: "Spring" },
  SPRING:       { tr: "İlkbahar", en: "Spring" },
  Summer:       { tr: "Yaz", en: "Summer" },
  SUMMER:       { tr: "Yaz", en: "Summer" },
  Autumn:       { tr: "Sonbahar", en: "Autumn" },
  AUTUMN:       { tr: "Sonbahar", en: "Autumn" },
  Winter:       { tr: "Kış", en: "Winter" },
  WINTER:       { tr: "Kış", en: "Winter" },
  AllSeasons:   { tr: "Tüm Mevsimler", en: "All Seasons" },
  "ALL SEASONS": { tr: "Tüm Mevsimler", en: "All Seasons" },
  "All Seasons": { tr: "Tüm Mevsimler", en: "All Seasons" },
  ALLSEASONS:   { tr: "Tüm Mevsimler", en: "All Seasons" },
};

export const NOTE_MAP: Record<string, { tr: string; en: string }> = {
  Grapefruit:           { tr: "Greyfurt", en: "Grapefruit" },
  Lemon:               { tr: "Limon", en: "Lemon" },
  Mint:                { tr: "Nane", en: "Mint" },
  "Pink Pepper":        { tr: "Pembe Biber", en: "Pink Pepper" },
  "Black Pepper":       { tr: "Karabiber", en: "Black Pepper" },
  Ginger:              { tr: "Zencefil", en: "Ginger" },
  Nutmeg:              { tr: "Hindistan Cevizi", en: "Nutmeg" },
  Jasmine:             { tr: "Yasemin", en: "Jasmine" },
  "Moroccan Jasmine":   { tr: "Fas Yasemini", en: "Moroccan Jasmine" },
  Incense:             { tr: "Tütsü", en: "Incense" },
  Cedar:               { tr: "Sedir Ağacı", en: "Cedarwood" },
  Cedarwood:           { tr: "Sedir Ağacı", en: "Cedarwood" },
  Sandalwood:          { tr: "Sandal Ağacı", en: "Sandalwood" },
  Patchouli:           { tr: "Paçuli", en: "Patchouli" },
  Vetiver:             { tr: "Vetiver", en: "Vetiver" },
  Mandarin:            { tr: "Mandalina", en: "Mandarin" },
  "Mandarin Orange":    { tr: "Mandalina", en: "Mandarin" },
  Saffron:             { tr: "Safran", en: "Saffron" },
  "Violet Leaf":        { tr: "Menekşe Yaprağı", en: "Violet Leaf" },
  Violet:              { tr: "Menekşe", en: "Violet" },
  Osmanthus:           { tr: "Osmanthus", en: "Osmanthus" },
  Immortelle:          { tr: "Ölümsüz Çiçeği", en: "Immortelle" },
  "Suede Leather":      { tr: "Süet Deri", en: "Suede Leather" },
  Suede:               { tr: "Süet Deri", en: "Suede" },
  Leather:             { tr: "Deri", en: "Leather" },
  Akigalawood:         { tr: "Akigalawood", en: "Akigalawood" },
  "Mineral Accords":    { tr: "Mineral Akorlar", en: "Mineral Accords" },
  "Mineral Notes":      { tr: "Mineral Notaları", en: "Mineral Notes" },
  Amberwood:           { tr: "Kehribar Ağacı", en: "Amberwood" },
  Ambergris:           { tr: "Gri Kehribar", en: "Ambergris" },
  "Grey Amber":         { tr: "Gri Kehribar", en: "Grey Amber" },
  "Pine Resin":         { tr: "Çam Reçinesi", en: "Pine Resin" },
  "Fir Resin":          { tr: "Çam Reçinesi", en: "Fir Resin" },
  Pineapple:           { tr: "Ananas", en: "Pineapple" },
  Bergamot:            { tr: "Bergamot", en: "Bergamot" },
  Blackcurrant:        { tr: "Siyah Frenk Üzümü", en: "Blackcurrant" },
  Apple:               { tr: "Elma", en: "Apple" },
  Birch:               { tr: "Huş Ağacı", en: "Birch" },
  Rose:                { tr: "Gül", en: "Rose" },
  Musk:                { tr: "Misk", en: "Musk" },
  "White Musk":        { tr: "Beyaz Misk", en: "White Musk" },
  Oakmoss:             { tr: "Meşe Yosunu", en: "Oakmoss" },
  Vanilla:             { tr: "Vanilya", en: "Vanilla" },
  "Tonka Bean":        { tr: "Tonka Fasulyesi", en: "Tonka Bean" },
  Amber:               { tr: "Kehribar", en: "Amber" },
  Coffee:              { tr: "Kahve", en: "Coffee" },
  Praline:             { tr: "Pralin", en: "Praline" },
  Pear:                { tr: "Armut", en: "Pear" },
  Iris:                { tr: "Süsen", en: "Iris" },
  Peony:               { tr: "Şakayık", en: "Peony" },
  "Pink Peony":        { tr: "Pembe Şakayık", en: "Pink Peony" },
  "Damask Rose":       { tr: "Şam Gülü", en: "Damask Rose" },
  Apricot:             { tr: "Kayısı", en: "Apricot" },
  Tobacco:             { tr: "Tütün", en: "Tobacco" },

  // Turkish keys mapped to English for reverse lookup
  Greyfurt:            { tr: "Greyfurt", en: "Grapefruit" },
  Limon:               { tr: "Limon", en: "Lemon" },
  Nane:                { tr: "Nane", en: "Mint" },
  "Pembe Biber":       { tr: "Pembe Biber", en: "Pink Pepper" },
  "Hindistan Cevizi":  { tr: "Hindistan Cevizi", en: "Nutmeg" },
  Yasemin:             { tr: "Yasemin", en: "Jasmine" },
  Tütsü:               { tr: "Tütsü", en: "Incense" },
  "Sedir Ağacı":       { tr: "Sedir Ağacı", en: "Cedarwood" },
  "Sandal Ağacı":      { tr: "Sandal Ağacı", en: "Sandalwood" },
  Paçuli:              { tr: "Paçuli", en: "Patchouli" },
  Mandalina:           { tr: "Mandalina", en: "Mandarin" },
  Safran:              { tr: "Safran", en: "Saffron" },
  "Menekşe Yaprağı":   { tr: "Menekşe Yaprağı", en: "Violet Leaf" },
  "Ölümsüz Çiçeği":    { tr: "Ölümsüz Çiçeği", en: "Immortelle" },
  "Süet Deri":         { tr: "Süet Deri", en: "Suede Leather" },
  "Mineral Akorlar":   { tr: "Mineral Akorlar", en: "Mineral Accords" },
  "Kehribar Ağacı":    { tr: "Kehribar Ağacı", en: "Amberwood" },
  "Gri Kehribar":      { tr: "Gri Kehribar", en: "Ambergris" },
  "Kehribar":          { tr: "Kehribar", en: "Amber" },
  "Çam Reçinesi":      { tr: "Çam Reçinesi", en: "Pine Resin" },
  Ananas:              { tr: "Ananas", en: "Pineapple" },
  "Siyah Frenk Üzümü": { tr: "Siyah Frenk Üzümü", en: "Blackcurrant" },
  Elma:                { tr: "Elma", en: "Apple" },
  "Huş Ağacı":         { tr: "Huş Ağacı", en: "Birch" },
  Gül:                 { tr: "Gül", en: "Rose" },
  "Fas Yasemini":      { tr: "Fas Yasemini", en: "Moroccan Jasmine" },
  Misk:                { tr: "Misk", en: "Musk" },
  "Meşe Yosunu":       { tr: "Meşe Yosunu", en: "Oakmoss" },
  Vanilya:             { tr: "Vanilya", en: "Vanilla" },
};

export function localizeSillage(val: string | undefined | null, isTr: boolean): string {
  if (!val) return "—";
  const clean = val.trim();
  const found = SILLAGE_MAP[clean] || SILLAGE_MAP[clean.toUpperCase()];
  if (found) return isTr ? found.tr : found.en;
  return translateRaw(clean, isTr);
}

export function localizeLongevity(val: string | undefined | null, isTr: boolean): string {
  if (!val) return "—";
  const clean = val.trim();
  const normKey = clean.toUpperCase().replace(/\s+/g, "_");
  const found = LONGEVITY_MAP[clean] || LONGEVITY_MAP[normKey];
  if (found) return isTr ? found.tr : found.en;
  return translateRaw(clean, isTr);
}

export function localizeOccasion(val: string | undefined | null, isTr: boolean): string {
  if (!val) return "—";
  const clean = val.trim();
  const found = OCCASION_MAP[clean] || OCCASION_MAP[clean.toUpperCase()];
  if (found) return isTr ? found.tr : found.en;
  return translateRaw(clean, isTr);
}

export function localizeSeason(val: string | undefined | null, isTr: boolean): string {
  if (!val) return "—";
  const clean = val.trim();
  const found = SEASON_MAP[clean] || SEASON_MAP[clean.toUpperCase()];
  if (found) return isTr ? found.tr : found.en;
  return translateRaw(clean, isTr);
}

export function localizeNote(val: string | undefined | null, isTr: boolean): string {
  if (!val) return "";
  const clean = val.trim();
  const found = NOTE_MAP[clean];
  if (found) return isTr ? found.tr : found.en;

  // Case-insensitive lookup fallback
  const keys = Object.keys(NOTE_MAP);
  const matchedKey = keys.find(k => k.toLowerCase() === clean.toLowerCase());
  if (matchedKey) {
    const item = NOTE_MAP[matchedKey];
    return isTr ? item.tr : item.en;
  }

  return translateRaw(clean, isTr);
}

export function localizeNotes(notes: string[] | undefined | null, isTr: boolean): string[] {
  if (!notes || !Array.isArray(notes)) return [];
  return notes.map(n => localizeNote(n, isTr));
}

export function getLocalizedDescription(
  perfume: Record<string, any> | null | undefined,
  isTr: boolean
): string {
  if (!perfume) return "";
  const lang = isTr ? "tr" : "en";
  return (
    getLocalizedField(perfume, "mainDescription", lang) ||
    getLocalizedField(perfume, "description", lang) ||
    perfume.description ||
    ""
  );
}
