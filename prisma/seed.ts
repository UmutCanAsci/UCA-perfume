import "dotenv/config";
import {
  NoteLayer,
  SeasonEnum,
  OccasionEnum,
} from "@prisma/client";
import { perfumes } from "../src/data/perfumes";
import { prisma } from "../src/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Resmi İngilizce Açıklamalar
// ─────────────────────────────────────────────────────────────────────────────

const EN_DESCRIPTIONS: Record<string, string> = {
  "bleu-de-chanel":
    "Symbolizing the timeless freedom of the modern man, Bleu de Chanel opens with a refreshing " +
    "whisper of fresh citruses and deepens under the noble shadow of dry cedar. Sealed upon the " +
    "skin with the creamy warmth of sandalwood, this intense composition is the expression of a " +
    "bold and sophisticated signature.",

  ganymede:
    "Inspired by the fluid and bright satellite of Jupiter, Ganymede redefines haute perfumery " +
    "with a breathtaking mineral elegance. A composition where the supple texture of suede meets " +
    "the ozonic freshness of violet leaves, grounded by the timeless depth of immortelle flowers.",

  "baccarat-rouge-540-extrait":
    "An alchemy of the senses where the poetic brilliance of jasmine and the density of radiant " +
    "saffron melt into mineral facets of ambergris and the woody tones of freshly cut cedarwood. " +
    "A highly concentrated, unforgettable olfactory signature.",

  aventus:
    "A manifesto of strength, power, and success, Aventus opens with the vibrant crispness of " +
    "pineapple and bergamot, deepens with a rich heart of birch and patchouli, and grounds itself " +
    "on a magnificent base of oakmoss and ambergris, turning into a timeless symbol of ultimate power.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Nota Sözlüğü – Türkçe (Kaynak Veri) ➜ İngilizce
// ─────────────────────────────────────────────────────────────────────────────

const NOTE_TR_TO_EN: Record<string, string> = {
  // Bleu de Chanel
  Greyfurt: "Grapefruit",
  Limon: "Lemon",
  Nane: "Mint",
  "Pembe Biber": "Pink Pepper",
  Zencefil: "Ginger",
  "Hindistan Cevizi": "Nutmeg",
  Yasemin: "Jasmine",
  Tütsü: "Incense",
  "Sedir Ağacı": "Cedarwood",
  "Sandal Ağacı": "Sandalwood",
  Paçuli: "Patchouli",
  Vetiver: "Vetiver",
  // Ganymede
  Mandalina: "Mandarin",
  Safran: "Saffron",
  "Menekşe Yaprağı": "Violet Leaf",
  Osmanthus: "Osmanthus",
  "Ölümsüz Çiçeği": "Immortelle",
  "Süet Deri": "Suede Leather",
  Akigalawood: "Akigalawood",
  "Mineral Akorlar": "Mineral Accords",
  // Baccarat Rouge 540
  "Amber Ağacı": "Amberwood",
  Ambergris: "Ambergris",
  "Çam Reçinesi": "Pine Resin",
  // Aventus
  Ananas: "Pineapple",
  Bergamot: "Bergamot",
  "Siyah Frenk Üzümü": "Blackcurrant",
  Elma: "Apple",
  "Huş Ağacı": "Birch",
  Gül: "Rose",
  "Fas Yasemini": "Moroccan Jasmine",
  Misk: "Musk",
  "Meşe Yosunu": "Oakmoss",
  Vanilya: "Vanilla",
  // Miss Dior Blooming Bouquet
  "Sicilya Mandalinası": "Sicilian Mandarin",
  "Pembe Şakayık": "Pink Peony",
  "Şam Gülü": "Damascus Rose",
  Kayısı: "Apricot",
  Şeftali: "Peach",
  "Beyaz Misk": "White Musk",
  // Gucci Flora
  "Armut Çiçeği": "Pear Blossom",
  "Kırmızı Meyveler": "Red Berries",
  "İtalyan Mandalinası": "Italian Mandarin",
  "Beyaz Gardenya": "White Gardenia",
  Frangipani: "Frangipani",
  "Esmer Şeker": "Brown Sugar",
  // Black XS
  Adaçayı: "Sage",
  "Kadife Çiçeği": "Tagetes",
  Pralin: "Praline",
  Tarçın: "Cinnamon",
  "Tolu Balsamı": "Tolu Balsam",
  "Siyah Kakule": "Black Cardamom",
  "Brezilya Gül Ağacı": "Brazilian Rosewood",
  "Siyah Kehribar": "Black Amber",
  // Shalimar
  İris: "Iris",
  "Tonka Fasulyesi": "Tonka Bean",
  // Black Opium
  "Portakal Çiçeği": "Orange Blossom",
  Armut: "Pear",
  Kahve: "Coffee",
  "Acı Badem": "Bitter Almond",
  "Meyan Kökü": "Licorice",
  "Kaşmir Ağacı": "Cashmere Wood",
};

// ─────────────────────────────────────────────────────────────────────────────
// Mevsim & Ortam Eşleşmeleri (Enums)
// ─────────────────────────────────────────────────────────────────────────────

const SEASONS_BY_ID: Record<string, SeasonEnum[]> = {
  "bleu-de-chanel": [SeasonEnum.Spring, SeasonEnum.Summer, SeasonEnum.Autumn],
  ganymede: [
    SeasonEnum.AllSeasons,
    SeasonEnum.Spring,
    SeasonEnum.Autumn,
  ],
  "baccarat-rouge-540-extrait": [SeasonEnum.Autumn, SeasonEnum.Winter],
  aventus: [SeasonEnum.Spring, SeasonEnum.Summer, SeasonEnum.Autumn],
};

const OCCASIONS_BY_ID: Record<string, OccasionEnum[]> = {
  "bleu-de-chanel": [
    OccasionEnum.CasualEveryday,
    OccasionEnum.OfficeSafe,
    OccasionEnum.SignatureScent,
  ],
  ganymede: [
    OccasionEnum.DateNight,
    OccasionEnum.OfficeSafe,
    OccasionEnum.SignatureScent,
  ],
  "baccarat-rouge-540-extrait": [
    OccasionEnum.DateNight,
    OccasionEnum.GalaFormal,
  ],
  aventus: [
    OccasionEnum.CasualEveryday,
    OccasionEnum.OfficeSafe,
    OccasionEnum.SignatureScent,
  ],
};

const SEASON_LOCALIZATION: Record<SeasonEnum, { tr: string; en: string }> = {
  [SeasonEnum.Spring]:     { tr: "İlkbahar", en: "Spring" },
  [SeasonEnum.Summer]:     { tr: "Yaz", en: "Summer" },
  [SeasonEnum.Autumn]:     { tr: "Sonbahar", en: "Autumn" },
  [SeasonEnum.Winter]:     { tr: "Kış", en: "Winter" },
  [SeasonEnum.AllSeasons]: { tr: "Tüm Mevsimler", en: "All Seasons" },
};

const OCCASION_LOCALIZATION: Record<OccasionEnum, { tr: string; en: string }> = {
  [OccasionEnum.CasualEveryday]: { tr: "Günlük Kullanım", en: "Casual Everyday" },
  [OccasionEnum.OfficeSafe]:     { tr: "Ofis & İş", en: "Office Safe" },
  [OccasionEnum.DateNight]:      { tr: "Gece Randevusu", en: "Date Night" },
  [OccasionEnum.GalaFormal]:     { tr: "Gala & Resmi", en: "Gala Formal" },
  [OccasionEnum.SignatureScent]: { tr: "İmza Koku", en: "Signature Scent" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Seed Function
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌱 Starting ScentSphere database seed ...\n");

  // 0. Base Admin/Tester Kullanıcısı (Favoriler, Gardırop vb. için)
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: "tester",
      email: "test@scentsphere.com",
      passwordHash: "placeholder_not_for_auth",
      role: "ADMIN",
    },
  });
  console.log("  ✔ Baseline user upserted: tester (id=1)\n");

  // 1. Parfümler ve Notalar
  for (const source of perfumes) {
    const descriptionEn =
      EN_DESCRIPTIONS[source.id] ?? source.mainDescriptionEn ?? source.mainDescription;

    // Perfume Kaydı
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

    console.log(`  ✔ Perfume upserted: ${source.name} (${source.id})`);

    // Mevsim İlişkileri
    await prisma.perfumeSeason.deleteMany({
      where: { perfumeId: source.id },
    });
    const seasons = SEASONS_BY_ID[source.id] ?? [SeasonEnum.AllSeasons];
    await prisma.perfumeSeason.createMany({
      data: seasons.map((season) => ({
        perfumeId: source.id,
        season,
        seasonTr: SEASON_LOCALIZATION[season].tr,
        seasonEn: SEASON_LOCALIZATION[season].en,
      })),
      skipDuplicates: true,
    });

    // Ortam İlişkileri
    await prisma.perfumeOccasion.deleteMany({
      where: { perfumeId: source.id },
    });
    const occasions = OCCASIONS_BY_ID[source.id] ?? [
      OccasionEnum.CasualEveryday,
    ];
    await prisma.perfumeOccasion.createMany({
      data: occasions.map((occasion) => ({
        perfumeId: source.id,
        occasion,
        occasionTr: OCCASION_LOCALIZATION[occasion].tr,
        occasionEn: OCCASION_LOCALIZATION[occasion].en,
      })),
      skipDuplicates: true,
    });

    // Notaların Master Note Tablosuna ve PerfumeNote İlişkilerine Eklenmesi
    await prisma.perfumeNote.deleteMany({
      where: { perfumeId: source.id },
    });

    // Build a TR→EN mapping from notesEn if available, falling back to the dictionary
    const notesEnByLayer: Record<string, Record<string, string>> = {};
    if (source.notesEn) {
      const layerKeys: Array<[string, string[]]> = [
        ["bas",  source.notesEn.bas],
        ["kalp", source.notesEn.kalp],
        ["dip",  source.notesEn.dip],
      ];
      for (const [key, enNames] of layerKeys) {
        notesEnByLayer[key] = {};
        const trNames = source.notes[key as keyof typeof source.notes];
        trNames.forEach((tr, i) => {
          notesEnByLayer[key][tr] = enNames[i] ?? tr;
        });
      }
    }

    const noteLayers: { layer: NoteLayer; names: string[]; layerKey: string }[] = [
      { layer: NoteLayer.TOP,   names: source.notes.bas,  layerKey: "bas"  },
      { layer: NoteLayer.HEART, names: source.notes.kalp, layerKey: "kalp" },
      { layer: NoteLayer.BASE,  names: source.notes.dip,  layerKey: "dip"  },
    ];

    for (const { layer, names, layerKey } of noteLayers) {
      for (const noteNameTr of names) {
        const noteNameEn =
          notesEnByLayer[layerKey]?.[noteNameTr] ??
          NOTE_TR_TO_EN[noteNameTr] ??
          noteNameTr;

        // Master Note Upsert
        const note = await prisma.note.upsert({
          where: { nameTr: noteNameTr },
          update: { nameEn: noteNameEn },
          create: {
            nameTr: noteNameTr,
            nameEn: noteNameEn,
          },
        });

        // Junction Record (Use upsert to gracefully handle duplicate notes in seed data)
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
        woody: source.olfactoryProfile.Woody,
        spicy: source.olfactoryProfile.Spicy,
        fresh: source.olfactoryProfile.Fresh,
        sweet: source.olfactoryProfile.Sweet,
      },
      create: {
        perfumeId: source.id,
        floral: source.olfactoryProfile.Floral,
        woody: source.olfactoryProfile.Woody,
        spicy: source.olfactoryProfile.Spicy,
        fresh: source.olfactoryProfile.Fresh,
        sweet: source.olfactoryProfile.Sweet,
      },
    });

    console.log(`     └─ Notes, Seasons, Occasions & Profile seeded.\n`);
  }

  console.log(
    `🎉 Seed complete — ${perfumes.length} perfumes successfully populated in Railway MySQL.\n`
  );
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });