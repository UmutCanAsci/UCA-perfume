import { prisma } from "@/lib/prisma";
import { perfumes } from "@/data/perfumes";
import { NoteLayer, SeasonEnum, OccasionEnum } from "@prisma/client";

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

const SEASONS_BY_ID: Record<string, SeasonEnum[]> = {
  "bleu-de-chanel":             [SeasonEnum.Spring, SeasonEnum.Summer, SeasonEnum.Autumn],
  "ganymede":                   [SeasonEnum.AllSeasons, SeasonEnum.Spring, SeasonEnum.Autumn],
  "baccarat-rouge-540-extrait": [SeasonEnum.Autumn, SeasonEnum.Winter],
  "aventus":                    [SeasonEnum.Spring, SeasonEnum.Summer, SeasonEnum.Autumn],
};

const OCCASIONS_BY_ID: Record<string, OccasionEnum[]> = {
  "bleu-de-chanel":             [OccasionEnum.CasualEveryday, OccasionEnum.OfficeSafe, OccasionEnum.SignatureScent],
  "ganymede":                   [OccasionEnum.DateNight, OccasionEnum.OfficeSafe, OccasionEnum.SignatureScent],
  "baccarat-rouge-540-extrait": [OccasionEnum.DateNight, OccasionEnum.GalaFormal],
  "aventus":                    [OccasionEnum.CasualEveryday, OccasionEnum.OfficeSafe, OccasionEnum.SignatureScent],
};

// ── Concurrency guard ────────────────────────────────────────────────────────
declare global {
  var __syncEngineExecuted: boolean | undefined;
}

const ADVISORY_LOCK_NAME = "uca_sync_engine";
const ADVISORY_LOCK_TIMEOUT_SEC = 30;

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

  if (globalThis.__syncEngineExecuted) {
    console.log("Sync engine already marked executed on global scope.");
    return;
  }

  const locked = await acquireAdvisoryLock();
  if (!locked) {
    console.log("⏳ Sync engine: could not acquire advisory lock; skipping duplicate sync.");
    return;
  }

  globalThis.__syncEngineExecuted = true;
  console.log("🔄 Starting autonomous data synchronization...");

  try {
    const validIds = perfumes.map((p) => p.id);
    const deleteResult = await prisma.perfume.deleteMany({
      where: { id: { notIn: validIds } },
    });
    if (deleteResult.count > 0) {
      console.log(`🧹 Pruned ${deleteResult.count} stale perfume(s) from the database.`);
    }

    for (const source of perfumes) {
      const descriptionEn = source.mainDescriptionEn ?? EN_DESCRIPTIONS[source.id] ?? source.mainDescription;

      // Upsert Perfume scalar row
      await prisma.perfume.upsert({
        where: { id: source.id },
        update: {
          name: source.name,
          brand: source.brand,
          concentration: source.concentration,
          gender: source.gender,
          mainDescriptionTr: source.mainDescription,
          mainDescriptionEn: descriptionEn,
        },
        create: {
          id: source.id,
          name: source.name,
          brand: source.brand,
          concentration: source.concentration,
          gender: source.gender,
          mainDescriptionTr: source.mainDescription,
          mainDescriptionEn: descriptionEn,
        },
      });

      // Seasons
      await prisma.perfumeSeason.deleteMany({ where: { perfumeId: source.id } });
      const seasons = SEASONS_BY_ID[source.id] ?? [SeasonEnum.AllSeasons];
      await prisma.perfumeSeason.createMany({
        data: seasons.map((season) => ({ perfumeId: source.id, season })),
        skipDuplicates: true,
      });

      // Occasions
      await prisma.perfumeOccasion.deleteMany({ where: { perfumeId: source.id } });
      const occasions = OCCASIONS_BY_ID[source.id] ?? [OccasionEnum.CasualEveryday];
      await prisma.perfumeOccasion.createMany({
        data: occasions.map((occasion) => ({ perfumeId: source.id, occasion })),
        skipDuplicates: true,
      });

      // Notes
      await prisma.perfumeNote.deleteMany({ where: { perfumeId: source.id } });

      const noteLayers: { layer: NoteLayer; names: string[] }[] = [
        { layer: NoteLayer.TOP,   names: source.notes.bas },
        { layer: NoteLayer.HEART, names: source.notes.kalp },
        { layer: NoteLayer.BASE,  names: source.notes.dip },
      ];

      for (const { layer, names } of noteLayers) {
        for (const noteNameTr of names) {
          const noteNameEn = NOTE_TR_TO_EN[noteNameTr] ?? noteNameTr;

          const note = await prisma.note.upsert({
            where: { nameTr: noteNameTr },
            update: { nameEn: noteNameEn },
            create: { nameTr: noteNameTr, nameEn: noteNameEn },
          });

          await prisma.perfumeNote.upsert({
            where: {
              perfumeId_noteId_layer: {
                perfumeId: source.id,
                noteId: note.id,
                layer,
              },
            },
            update: {},
            create: {
              perfumeId: source.id,
              noteId: note.id,
              layer,
            },
          });
        }
      }

      // Olfactory Profile
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
    await releaseAdvisoryLock();
  }
}
