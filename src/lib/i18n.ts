/**
 * src/lib/i18n.ts
 * ────────────────
 * Central locale-aware field resolution utilities.
 *
 * These helpers are the single source of truth for resolving bilingual
 * database entity attributes. All components must use these helpers instead
 * of hand-rolling inline ternary language checks.
 *
 * Rules:
 *  - Never invent translations. Only read from DB columns or dictionary keys.
 *  - Always provide a full EN ↔ TR fallback chain so the UI never renders blank.
 *  - Brand names, note names stored as proper nouns in the DB are returned as-is.
 */

/**
 * Resolves a localized scalar field from a DB entity based on the active locale.
 *
 * Tries multiple naming conventions present in the codebase:
 *   - `{fieldBase}En` / `{fieldBase}Tr`  (camelCase, e.g. mainDescriptionEn)
 *   - `{fieldBase}_en` / `{fieldBase}_tr` (snake_case, e.g. description_en)
 *   - `{fieldBase}` as-is (language-neutral fallback)
 *
 * @example
 *   const desc = getLocalizedField(perfume, 'mainDescription', language);
 *   const desc = getLocalizedField(perfume, 'description', language);
 */
export function getLocalizedField(
  entity: Record<string, any> | null | undefined,
  fieldBase: string,
  locale: "en" | "tr"
): string {
  if (!entity) return "";
  const isEn = locale === "en";

  const primaryKeys = isEn
    ? [`${fieldBase}En`, `${fieldBase}_en`]
    : [`${fieldBase}Tr`, `${fieldBase}_tr`];

  const fallbackKeys = isEn
    ? [`${fieldBase}Tr`, `${fieldBase}_tr`, fieldBase]
    : [`${fieldBase}En`, `${fieldBase}_en`, fieldBase];

  for (const key of primaryKeys) {
    if (entity[key] && typeof entity[key] === "string" && entity[key].trim()) {
      return entity[key];
    }
  }
  for (const key of fallbackKeys) {
    if (entity[key] && typeof entity[key] === "string" && entity[key].trim()) {
      return entity[key];
    }
  }
  return "";
}

/**
 * Resolves localized note arrays from the API response shape.
 *
 * Handles both the explicit bilingual fields (`top_tr` / `top_en`)
 * and the language-neutral aliases (`top`, `mid`, `base`, `bas`, `kalp`, `dip`).
 *
 * @example
 *   const notes = getLocalizedNotes(perfume.notes, language);
 *   notes.top  // string[]
 *   notes.heart // string[]
 *   notes.base // string[]
 */
export function getLocalizedNotes(
  notes: Record<string, any> | null | undefined,
  locale: "en" | "tr"
): { top: string[]; heart: string[]; base: string[] } | null {
  if (!notes) return null;
  const isEn = locale === "en";

  const pick = (enKeys: string[], trKeys: string[]): string[] => {
    const primary = isEn ? enKeys : trKeys;
    const fallback = isEn ? trKeys : enKeys;
    for (const key of primary) {
      if (Array.isArray(notes[key]) && notes[key].length > 0) return notes[key];
    }
    for (const key of fallback) {
      if (Array.isArray(notes[key]) && notes[key].length > 0) return notes[key];
    }
    return [];
  };

  return {
    top: pick(["top_en", "top"], ["top_tr", "bas", "top"]),
    heart: pick(["mid_en", "heart_en", "mid", "heart"], ["mid_tr", "heart_tr", "kalp", "mid", "heart"]),
    base: pick(["base_en", "base"], ["base_tr", "dip", "base"]),
  };
}

/**
 * Translates a canonical English enum value (sillage, longevity, season,
 * occasion) to its localized display string using the `translateRaw` dictionary.
 *
 * Returns the input unchanged if no mapping exists — protects proper nouns
 * and values that should not be translated.
 */
export { translateRaw } from "@/data/translations";
