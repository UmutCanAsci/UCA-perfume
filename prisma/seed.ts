import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Concentration, Gender, NoteLayer } from "../src/generated/prisma/client";
import { perfumes } from "../src/data/perfumes";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers – source string literals ➜ generated Prisma 7 enum constants
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Prisma 7 client bootstrap (WASM engine + MariaDB/MySQL 8 driver adapter)
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaMariaDb({
  host:           "127.0.0.1",
  port:           3306,
  user:           "root",
  password:       "mysql",
  database:       "scentsphere",
  bigIntAsNumber: true,
});

const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// Official English manifestos for mainDescriptionEn
// ─────────────────────────────────────────────────────────────────────────────

const EN_DESCRIPTIONS: Record<string, string> = {
  "bleu-de-chanel":
    "Symbolizing the timeless freedom of the modern man, Bleu de Chanel opens with a refreshing " +
    "whisper of fresh citruses and deepens under the noble shadow of dry cedar. Sealed upon the " +
    "skin with the creamy warmth of sandalwood, this intense composition is the expression of a " +
    "bold and sophisticated signature.",

  "ganymede":
    "Inspired by the fluid and bright satellite of Jupiter, Ganymede redefines haute perfumery " +
    "with a breathtaking mineral elegance. A composition where the supple texture of suede meets " +
    "the ozonic freshness of violet leaves, grounded by the timeless depth of immortelle flowers.",

  "baccarat-rouge-540-extrait":
    "An alchemy of the senses where the poetic brilliance of jasmine and the density of radiant " +
    "saffron melt into mineral facets of ambergris and the woody tones of freshly cut cedarwood. " +
    "A highly concentrated, unforgettable olfactory signature.",

  "aventus":
    "A manifesto of strength, power, and success, Aventus opens with the vibrant crispness of " +
    "pineapple and bergamot, deepens with a rich heart of birch and patchouli, and grounds itself " +
    "on a magnificent base of oakmoss and ambergris, turning into a timeless symbol of ultimate power.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Note localisation – Turkish (DB storage from source data) → English
// Covers every ingredient across all 4 seeded perfumes.
// Extend this map when new perfumes are added to src/data/perfumes.ts.
// ─────────────────────────────────────────────────────────────────────────────

const NOTE_TR_TO_EN: Record<string, string> = {
  // ── Bleu de Chanel ────────────────────────────────────────────────────────
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
  // ── Ganymede ──────────────────────────────────────────────────────────────
  "Mandalina":         "Mandarin",
  "Safran":            "Saffron",
  "Menekşe Yaprağı":   "Violet Leaf",
  "Osmanthus":         "Osmanthus",
  "Ölümsüz Çiçeği":    "Immortelle",
  "Süet Deri":         "Suede Leather",
  "Akigalawood":       "Akigalawood",
  "Mineral Akorlar":   "Mineral Accords",
  // ── Baccarat Rouge 540 ────────────────────────────────────────────────────
  "Amber Ağacı":       "Amberwood",
  "Ambergris":         "Ambergris",
  "Çam Reçinesi":      "Pine Resin",
  // ── Aventus ───────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Season / Occasion maps – Turkish source values → English DB strings
// Used by the matchmaking algorithm directly after this sprint.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌱  Starting ScentSphere database seed …\n");

  // ── 0. Baseline User (for FK integrity on reviews / wardrobe) ─────────────
  await prisma.user.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      id:           1,
      username:     "tester",
      email:        "test@scentsphere.com",
      passwordHash: "placeholder_not_for_auth",
    },
  });
  console.log("  ✔  Baseline user upserted: tester (id=1)\n");

  // ── 1–3. Perfumes, Notes, Profiles ────────────────────────────────────────
  for (const source of perfumes) {
    const concentration  = toConcentrationEnum(source.concentration);
    const gender         = toGenderEnum(source.gender);
    const descriptionEn  = EN_DESCRIPTIONS[source.id] ?? source.mainDescription;
    const seasons        = (SEASONS_BY_ID[source.id]  ?? ["All Seasons"]).join(", ");
    const occasions      = (OCCASIONS_BY_ID[source.id] ?? ["Casual Everyday"]).join(", ");

    // ── 1. Upsert Perfume row ────────────────────────────────────────────────
    await prisma.perfume.upsert({
      where:  { id: source.id },
      update: {
        name:              source.name,
        brand:             source.brand,
        concentration,
        gender,
        mainDescriptionTr: source.mainDescription,
        mainDescriptionEn: descriptionEn,
        seasons,
        occasions,
      },
      create: {
        id:                source.id,
        name:              source.name,
        brand:             source.brand,
        concentration,
        gender,
        mainDescriptionTr: source.mainDescription,
        mainDescriptionEn: descriptionEn,
        seasons,
        occasions,
      },
    });

    console.log(`  ✔  Perfume upserted: ${source.name} (${source.id})`);

    // ── 2. Notes – delete-then-recreate for clean idempotency ───────────────
    await prisma.perfumeNote.deleteMany({ where: { perfumeId: source.id } });

    const noteLayers: { layer: NoteLayer; names: string[] }[] = [
      { layer: NoteLayer.bas,  names: source.notes.bas  },
      { layer: NoteLayer.kalp, names: source.notes.kalp },
      { layer: NoteLayer.dip,  names: source.notes.dip  },
    ];

    for (const { layer, names } of noteLayers) {
      await prisma.perfumeNote.createMany({
        data: names.map((noteNameTr) => ({
          perfumeId:  source.id,
          noteNameTr,
          noteNameEn: NOTE_TR_TO_EN[noteNameTr] ?? noteNameTr, // fallback: keep Turkish if missing
          layer,
        })),
      });
    }

    const noteCount =
      source.notes.bas.length + source.notes.kalp.length + source.notes.dip.length;
    console.log(`      └─ ${noteCount} bilingual notes seeded (bas / kalp / dip)`);

    // ── 3. Upsert OlfactoryProfile row ──────────────────────────────────────
    await prisma.olfactoryProfile.upsert({
      where:  { perfumeId: source.id },
      update: {
        floral: source.olfactoryProfile.Floral,
        woody:  source.olfactoryProfile.Woody,
        spicy:  source.olfactoryProfile.Spicy,
        fresh:  source.olfactoryProfile.Fresh,
        sweet:  source.olfactoryProfile.Sweet,
      },
      create: {
        perfumeId: source.id,
        floral:    source.olfactoryProfile.Floral,
        woody:     source.olfactoryProfile.Woody,
        spicy:     source.olfactoryProfile.Spicy,
        fresh:     source.olfactoryProfile.Fresh,
        sweet:     source.olfactoryProfile.Sweet,
      },
    });

    console.log(`      └─ OlfactoryProfile seeded\n`);
  }

  console.log(`🎉  Seed complete — ${perfumes.length} perfumes inserted into MySQL.\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point – guaranteed disconnect and pool close
// ─────────────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
