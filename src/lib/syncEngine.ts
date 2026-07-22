import { prisma } from "@/lib/prisma";
import { perfumes } from "@/data/perfumes";
import { Concentration, Gender, NoteLayer } from "@/generated/prisma/client";

// Helpers – source string literals ➜ generated Prisma 7 enum constants
function toConcentrationEnum(raw: string): Concentration {
  switch (raw) {
    case "Eau de Parfum":     return Concentration.EAU_DE_PARFUM;
    case "Extrait de Parfum": return Concentration.EXTRAIT;
    case "Eau de Toilette":   return Concentration.EAU_DE_TOILETTE;
    default:
      throw new Error(`Unknown concentration: "${raw}"`);
  }
}

function toGenderEnum(raw: string): Gender {
  switch (raw) {
    case "Men":    return Gender.Men;
    case "Women":  return Gender.Women;
    case "Unisex": return Gender.Unisex;
    default:
      throw new Error(`Unknown gender: "${raw}"`);
  }
}

// Dictionaries
const EN_DESCRIPTIONS: Record<string, string> = {
  "bleu-de-chanel":
    "Symbolizing the timeless freedom of the modern man, Bleu de Chanel opens with a refreshing whisper of fresh citruses and deepens under the noble shadow of dry cedar. Sealed upon the skin with the creamy warmth of sandalwood, this intense composition is the expression of a bold and sophisticated signature.",
  "ganymede":
    "Inspired by the fluid and bright satellite of Jupiter, Ganymede redefines haute perfumery with a breathtaking mineral elegance. A composition where the supple texture of suede meets the ozonic freshness of violet leaves, grounded by the timeless depth of immortelle flowers.",
  "baccarat-rouge-540-extrait":
    "An alchemy of the senses where the poetic brilliance of jasmine and the density of radiant saffron melt into mineral facets of ambergris and the woody tones of freshly cut cedarwood. A highly concentrated, unforgettable olfactory signature.",
  "aventus":
    "A manifesto of strength, power, and success, Aventus opens with the vibrant crispness of pineapple and bergamot, deepens with a rich heart of birch and patchouli, and grounds itself on a magnificent base of oakmoss and ambergris, turning into a timeless symbol of ultimate power.",
};

const NOTE_TR_TO_EN: Record<string, string> = {
  "Greyfurt":          "Grapefruit",
  "Limon":             "Lemon",
  "Nane":              "Mint",
  "Pembe Biber":       "Pink Pepper",
  "Zencefil":          "Ginger",
  "Hindistan Cevizi":  "Nutmeg",
  "Yasemin":           "Jasmine",
  "Tütsü":             "Incense",
  "Sedir Ağacı":       "Cedarwood",
  "Sandal Ağacı":      "Sandalwood",
  "Paçuli":            "Patchouli",
  "Vetiver":           "Vetiver",
  "Mandalina":         "Mandarin",
  "Safran":            "Saffron",
  "Menekşe Yaprağı":   "Violet Leaf",
  "Osmanthus":         "Osmanthus",
  "Ölümsüz Çiçeği":    "Immortelle",
  "Süet Deri":         "Suede Leather",
  "Akigalawood":       "Akigalawood",
  "Mineral Akorlar":   "Mineral Accords",
  "Amber Ağacı":       "Amberwood",
  "Ambergris":         "Ambergris",
  "Çam Reçinesi":      "Pine Resin",
  "Ananas":            "Pineapple",
  "Bergamot":          "Bergamot",
  "Siyah Frenk Üzümü": "Blackcurrant",
  "Elma":              "Apple",
  "Huş Ağacı":         "Birch",
  "Gül":               "Rose",
  "Fas Yasemini":      "Moroccan Jasmine",
  "Misk":              "Musk",
  "Meşe Yosunu":       "Oakmoss",
  "Vanilya":           "Vanilla",
};

const SEASONS_BY_ID: Record<string, string[]> = {
  "bleu-de-chanel":          ["Spring", "Summer", "Autumn"],
  "ganymede":                ["All Seasons", "Spring", "Autumn"],
  "baccarat-rouge-540-extrait": ["Autumn", "Winter"],
  "aventus":                 ["Spring", "Summer", "Autumn"],
};

const OCCASIONS_BY_ID: Record<string, string[]> = {
  "bleu-de-chanel":          ["Casual Everyday", "Office Safe", "Signature Scent"],
  "ganymede":                ["Date Night", "Office Safe", "Signature Scent"],
  "baccarat-rouge-540-extrait": ["Date Night", "Gala Formal"],
  "aventus":                 ["Casual Everyday", "Office Safe", "Signature Scent"],
};

// ── Concurrency guard ────────────────────────────────────────────────────────
// During `next build`, Next.js spawns up to 13 parallel worker processes that
// all call runSyncEngine() concurrently. Because globalThis is per-process,
// the simple boolean flag cannot coordinate between workers, causing P2034
// deadlocks on the perfumeNote.deleteMany() step.
//
// Solution: use MySQL's advisory GET_LOCK() so only ONE worker runs the full
// sync at a time. Other workers acquire the lock immediately after the first
// releases it, see the "already executed" sentinel row, and bail out early.
//
// The sentinel is a dedicated row in the OlfactoryProfile table with a
// well-known sentinel ID that cannot clash with a real perfume slug.
declare global {
  var __syncEngineExecuted: boolean | undefined;
}

const ADVISORY_LOCK_NAME = "uca_sync_engine";
const ADVISORY_LOCK_TIMEOUT_SEC = 30; // wait up to 30 s for the lock

async function acquireAdvisoryLock(): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<[{ acquired: number }]>(
    `SELECT GET_LOCK(?, ?) AS acquired`,
    ADVISORY_LOCK_NAME,
    ADVISORY_LOCK_TIMEOUT_SEC
  );
  return result[0]?.acquired === 1;
}

async function releaseAdvisoryLock(): Promise<void> {
  await prisma.$queryRawUnsafe(
    `SELECT RELEASE_LOCK(?)`,
    ADVISORY_LOCK_NAME
  );
}

export async function runSyncEngine() {
  console.log("=== SYNC ENGINE ACTIVATED ===");
  console.log("Static file perfumes count:", perfumes.length);

  // Fast path: same Node.js process already ran the sync (hot-reload guard).
  if (globalThis.__syncEngineExecuted) {
    console.log("Sync engine already marked executed on global scope.");
    return;
  }

  // Slow path: acquire a MySQL advisory lock so parallel build workers don't
  // race each other on the write-heavy note deletion / recreation steps.
  const locked = await acquireAdvisoryLock();
  if (!locked) {
    // Another worker holds the lock and the timeout elapsed — bail out safely.
    console.log("⏳ Sync engine: could not acquire advisory lock; skipping duplicate sync.");
    return;
  }

  // We hold the lock. Mark the in-process flag so any re-entrant calls within
  // this same process (e.g. HMR) skip the full sync.
  globalThis.__syncEngineExecuted = true;

  console.log("🔄 Starting autonomous data synchronization...");

  try {
    // 1. Prune legacy records from the database
    const validIds = perfumes.map((p) => p.id);
    const deleteResult = await prisma.perfume.deleteMany({
      where: { id: { notIn: validIds } },
    });
    if (deleteResult.count > 0) {
      console.log(`🧹 Pruned ${deleteResult.count} stale perfume(s) from the database.`);
    }

    // 2. Upsert valid records
    for (const source of perfumes) {
      const concentration = toConcentrationEnum(source.concentration);
      const gender = toGenderEnum(source.gender);
      const descriptionEn = source.mainDescriptionEn ?? EN_DESCRIPTIONS[source.id] ?? source.mainDescription;
      const seasons = (source.seasons ?? SEASONS_BY_ID[source.id] ?? ["All Seasons"]).join(", ");
      const occasions = (source.occasions ?? OCCASIONS_BY_ID[source.id] ?? ["Casual Everyday"]).join(", ");

      // Upsert Perfume row
      await prisma.perfume.upsert({
        where: { id: source.id },
        update: {
          name: source.name,
          brand: source.brand,
          concentration,
          gender,
          mainDescriptionTr: source.mainDescription,
          mainDescriptionEn: descriptionEn,
          seasons,
          occasions,
        },
        create: {
          id: source.id,
          name: source.name,
          brand: source.brand,
          concentration,
          gender,
          mainDescriptionTr: source.mainDescription,
          mainDescriptionEn: descriptionEn,
          seasons,
          occasions,
        },
      });

      // Delete-then-recreate notes for this perfume (idempotent, lock-protected)
      await prisma.perfumeNote.deleteMany({ where: { perfumeId: source.id } });

      const noteLayers: { layer: NoteLayer; names: string[]; namesEn?: string[] }[] = [
        { layer: NoteLayer.bas,  names: source.notes.bas,  namesEn: source.notesEn?.bas  },
        { layer: NoteLayer.kalp, names: source.notes.kalp, namesEn: source.notesEn?.kalp },
        { layer: NoteLayer.dip,  names: source.notes.dip,  namesEn: source.notesEn?.dip  },
      ];

      for (const { layer, names, namesEn } of noteLayers) {
        await prisma.perfumeNote.createMany({
          data: names.map((noteNameTr, index) => {
            let noteNameEn = namesEn?.[index] ?? NOTE_TR_TO_EN[noteNameTr];
            if (!noteNameEn) {
              console.warn(`⚠️  Translation missing for note "${noteNameTr}". Using Turkish string.`);
              noteNameEn = noteNameTr;
            }
            return { perfumeId: source.id, noteNameTr, noteNameEn, layer };
          }),
        });
      }

      // Upsert the five-axis olfactory profile (the data the radar chart reads)
      await prisma.olfactoryProfile.upsert({
        where: { perfumeId: source.id },
        update: {
          floral: source.olfactoryProfile.Floral,
          woody:  source.olfactoryProfile.Woody,
          spicy:  source.olfactoryProfile.Spicy,
          fresh:  source.olfactoryProfile.Fresh,
          sweet:  source.olfactoryProfile.Sweet,
        },
        create: {
          perfumeId: source.id,
          floral: source.olfactoryProfile.Floral,
          woody:  source.olfactoryProfile.Woody,
          spicy:  source.olfactoryProfile.Spicy,
          fresh:  source.olfactoryProfile.Fresh,
          sweet:  source.olfactoryProfile.Sweet,
        },
      });

      console.log(`Successfully synced perfume: ${source.id}`);
    }

    console.log(`✅ Synchronization complete. ${perfumes.length} perfumes synced.`);
  } catch (error) {
    console.error("❌ Synchronization failed:", error);
  } finally {
    // Always release the advisory lock, even if the sync threw an error.
    await releaseAdvisoryLock();
  }
}
