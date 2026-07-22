/**
 * Scans all perfume note arrays for:
 *   1. Duplicate strings within the same tier (top / mid / base)
 *   2. The same note string appearing in multiple tiers of the same perfume
 */
import { perfumes } from "../data/perfumes";

let allClean = true;

for (const p of perfumes) {
  const tiers = [
    { name: "bas (TR)",    notes: p.notes.bas   },
    { name: "kalp (TR)",   notes: p.notes.kalp  },
    { name: "dip (TR)",    notes: p.notes.dip   },
    { name: "bas (EN)",    notes: p.notesEn?.bas  ?? [] },
    { name: "kalp (EN)",   notes: p.notesEn?.kalp ?? [] },
    { name: "dip (EN)",    notes: p.notesEn?.dip  ?? [] },
  ];

  // 1. Within-tier duplicates
  for (const { name, notes } of tiers) {
    const seen = new Set<string>();
    for (const note of notes) {
      if (seen.has(note)) {
        console.error(`❌ [${p.id}] WITHIN-TIER DUPLICATE in "${name}": "${note}"`);
        allClean = false;
      }
      seen.add(note);
    }
  }

  // 2. Cross-tier duplicates (same string in top AND mid/base etc.)
  const trTiers = [p.notes.bas, p.notes.kalp, p.notes.dip];
  for (let i = 0; i < trTiers.length; i++) {
    for (let j = i + 1; j < trTiers.length; j++) {
      const overlap = trTiers[i].filter(n => trTiers[j].includes(n));
      if (overlap.length > 0) {
        const names = ["bas","kalp","dip"];
        console.warn(`⚠️  [${p.id}] CROSS-TIER note(s) in TR "${names[i]}" AND "${names[j]}": ${overlap.join(", ")}`);
      }
    }
  }
}

if (allClean) {
  console.log("✅  No within-tier duplicate notes found across all 9 perfumes.");
} else {
  console.log("Fix the duplicates listed above in src/data/perfumes.ts");
}
