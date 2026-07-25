/**
 * src/components/HtmlLangSetter.tsx
 * ────────────────────────────────────
 * Thin client component that keeps the <html lang="..."> attribute in sync
 * with the active client-side locale from ScentSphereContext.
 *
 * Because the root layout is a Server Component it can only emit a static
 * lang value. This component runs after hydration and updates the DOM
 * attribute reactively whenever the user toggles language.
 *
 * Mounted inside ScentSphereProvider in layout.tsx — renders nothing to the DOM.
 */
"use client";

import { useEffect } from "react";
import { useScentSphere } from "./ScentSphereContext";

export function HtmlLangSetter() {
  const { language } = useScentSphere();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
