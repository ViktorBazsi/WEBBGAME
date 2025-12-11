import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const measurementsData = [
  { strLevel: 1, gender: "FEMALE", weight: 50, height: 162, biceps: 24, quads: 47, back: 36, chest: 80, calves: 31 },
  { strLevel: 2, gender: "FEMALE", weight: 58, height: 165, biceps: 27, quads: 53, back: 38, chest: 88, calves: 34 },
  { strLevel: 3, gender: "FEMALE", weight: 64, height: 167, biceps: 30, quads: 59, back: 40, chest: 95, calves: 36 },
  { strLevel: 4, gender: "FEMALE", weight: 72, height: 169, biceps: 33, quads: 65, back: 42, chest: 102, calves: 39 },
  { strLevel: 5, gender: "FEMALE", weight: 80, height: 170, biceps: 36, quads: 72, back: 44, chest: 110, calves: 42 },
  { strLevel: 1, gender: "MALE", weight: 62, height: 175, biceps: 28, quads: 50, back: 42, chest: 90, calves: 36 },
  { strLevel: 2, gender: "MALE", weight: 75, height: 178, biceps: 32, quads: 56, back: 44, chest: 100, calves: 38 },
  { strLevel: 3, gender: "MALE", weight: 82, height: 180, biceps: 35, quads: 62, back: 46, chest: 108, calves: 40 },
  { strLevel: 4, gender: "MALE", weight: 92, height: 182, biceps: 39, quads: 68, back: 48, chest: 118, calves: 42 },
  { strLevel: 5, gender: "MALE", weight: 104, height: 184, biceps: 43, quads: 75, back: 50, chest: 128, calves: 45 },
];

const liftCapacityData = [
  { strLevel: 1, gender: "FEMALE", bicepsCurl: 4, benchPress: 15, squat: 25, latPulldown: 20 },
  { strLevel: 2, gender: "FEMALE", bicepsCurl: 6, benchPress: 25, squat: 40, latPulldown: 30 },
  { strLevel: 3, gender: "FEMALE", bicepsCurl: 8, benchPress: 35, squat: 55, latPulldown: 40 },
  { strLevel: 4, gender: "FEMALE", bicepsCurl: 10, benchPress: 45, squat: 70, latPulldown: 50 },
  { strLevel: 5, gender: "FEMALE", bicepsCurl: 12, benchPress: 60, squat: 90, latPulldown: 65 },
  { strLevel: 1, gender: "MALE", bicepsCurl: 6, benchPress: 30, squat: 40, latPulldown: 30 },
  { strLevel: 2, gender: "MALE", bicepsCurl: 9, benchPress: 50, squat: 70, latPulldown: 50 },
  { strLevel: 3, gender: "MALE", bicepsCurl: 12, benchPress: 75, squat: 100, latPulldown: 70 },
  { strLevel: 4, gender: "MALE", bicepsCurl: 16, benchPress: 100, squat: 140, latPulldown: 90 },
  { strLevel: 5, gender: "MALE", bicepsCurl: 20, benchPress: 130, squat: 180, latPulldown: 110 },
];

const enduranceCapacityData = [
  { staLevel: 1, gender: "MALE", distanceKm: 1 },
  { staLevel: 2, gender: "MALE", distanceKm: 3 },
  { staLevel: 3, gender: "MALE", distanceKm: 7 },
  { staLevel: 4, gender: "MALE", distanceKm: 15 },
  { staLevel: 5, gender: "MALE", distanceKm: 20 },
  { staLevel: 1, gender: "FEMALE", distanceKm: 1 },
  { staLevel: 2, gender: "FEMALE", distanceKm: 2 },
  { staLevel: 3, gender: "FEMALE", distanceKm: 5 },
  { staLevel: 4, gender: "FEMALE", distanceKm: 10 },
  { staLevel: 5, gender: "FEMALE", distanceKm: 15 },
];

const statRequirementData = (() => {
  const levels = [
    { level: 1, neededXp: 60 },
    { level: 2, neededXp: 80 },
    { level: 3, neededXp: 100 },
    { level: 4, neededXp: 120 },
    { level: 5, neededXp: 140 },
  ];
  const types = ["STR", "DEX", "INT", "CHAR", "STA"];
  const rows = [];
  for (const t of types) {
    for (const l of levels) {
      rows.push({ statType: t, level: l.level, neededXp: l.neededXp });
    }
  }
  return rows;
})();

async function main() {
  for (const m of measurementsData) {
    await prisma.measurements.upsert({
      where: { strLevel_gender: { strLevel: m.strLevel, gender: m.gender } },
      update: m,
      create: m,
    });
  }

  for (const l of liftCapacityData) {
    await prisma.liftCapacity.upsert({
      where: { strLevel_gender: { strLevel: l.strLevel, gender: l.gender } },
      update: l,
      create: l,
    });
  }

  for (const r of statRequirementData) {
    await prisma.statRequirement.upsert({
      where: { statType_level: { statType: r.statType, level: r.level } },
      update: r,
      create: r,
    });
  }

  for (const e of enduranceCapacityData) {
    await prisma.enduranceCapacity.upsert({
      where: { staLevel_gender: { staLevel: e.staLevel, gender: e.gender } },
      update: e,
      create: e,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
