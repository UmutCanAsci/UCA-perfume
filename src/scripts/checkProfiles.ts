import { prisma } from "../lib/prisma";

async function main() {
  const profiles = await prisma.olfactoryProfile.findMany();
  console.log("olfactory_profiles rows:", JSON.stringify(profiles, null, 2));
  const perfumes = await prisma.perfume.findMany({ select: { id: true, name: true } });
  console.log("perfumes:", JSON.stringify(perfumes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
