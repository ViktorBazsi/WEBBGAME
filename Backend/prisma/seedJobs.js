import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const physicalJobs = [
  {
    name: "Construction Worker I",
    jobType: "physical",
    level: 1,
    xpNeeded: 40,
    xpGained: 10,
    strXp: 5,
    length: 480,
    money: 160,
    description: "Alapszintű építkezési segédmunka, súlyok cipelése és alap feladatok.",
    entryLevelXp: 0,
  },
  {
    name: "Construction Worker II",
    jobType: "physical",
    level: 2,
    xpNeeded: 120,
    xpGained: 15,
    strXp: 10,
    length: 480,
    money: 200,
    description: "Nehéz fizikai munka, állványozás és anyagmozgatás felelősséggel.",
    entryLevelXp: 40,
  },
  {
    name: "Construction Worker III",
    jobType: "physical",
    level: 3,
    xpNeeded: 240,
    xpGained: 20,
    strXp: 10,
    length: 360,
    money: 250,
    description: "Haladó építkezési feladatok, gépkezelés és összetettebb szerelés.",
    entryLevelXp: 120,
  },
  {
    name: "Construction Worker IV",
    jobType: "physical",
    level: 4,
    xpNeeded: 360,
    xpGained: 20,
    strXp: 10,
    staXp: 5,
    length: 360,
    money: 500,
    description: "Mester szintű fizikai munka, csapatvezetés és kritikus feladatok.",
    entryLevelXp: 240,
  },
  {
    name: "Construction Master",
    jobType: "physical",
    level: 5,
    xpNeeded: 480,
    xpGained: 20,
    strXp: 10,
    staXp: 10,
    length: 240,
    money: 750,
    description: "Építkezési munka mestere: vezetés, tervezés és minőségbiztosítás.",
    spec: "achievement:construction-master",
    entryLevelXp: 360,
  },
];

const officeJobs = [
  {
    name: "Office Assistant I",
    jobType: "office",
    level: 1,
    xpNeeded: 40,
    xpGained: 10,
    intXp: 5,
    length: 480,
    money: 160,
    description: "Alapszintű irodai adminisztráció, iratrendezés és adatbevitel.",
    staminaCost: 1,
    entryLevelXp: 0,
  },
  {
    name: "Office Assistant II",
    jobType: "office",
    level: 2,
    xpNeeded: 120,
    xpGained: 15,
    intXp: 10,
    length: 480,
    money: 200,
    description: "Bonyolultabb adminisztráció, ügyintézés és naptárkezelés.",
    staminaCost: 1,
    entryLevelXp: 40,
  },
  {
    name: "Office Specialist III",
    jobType: "office",
    level: 3,
    xpNeeded: 240,
    xpGained: 20,
    intXp: 10,
    length: 360,
    money: 250,
    description: "Önálló projektek, riportok készítése és folyamatfejlesztés.",
    staminaCost: 1,
    entryLevelXp: 120,
  },
  {
    name: "Office Lead IV",
    jobType: "office",
    level: 4,
    xpNeeded: 360,
    xpGained: 20,
    intXp: 10,
    charXp: 5,
    length: 360,
    money: 500,
    description: "Csapatvezetés, prezentációk és partnerkommunikáció.",
    staminaCost: 1,
    entryLevelXp: 240,
  },
  {
    name: "Office Director V",
    jobType: "office",
    level: 5,
    xpNeeded: 480,
    xpGained: 20,
    intXp: 10,
    charXp: 10,
    length: 240,
    money: 750,
    description: "Stratégiai döntéshozatal, tárgyalások és szervezetfejlesztés.",
    staminaCost: 1,
    spec: "achievement:office-master",
    entryLevelXp: 360,
  },
];

const achievements = [
  { name: "construction-master", description: "Építkezési munka mestere" },
  { name: "office-master", description: "Irodai karrier mestere" },
];

async function main() {
  const jobsToCreate = [];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { name: ach.name },
      update: ach,
      create: ach,
    });
  }

  // töröljük a korábbi office/physical jobokat, hogy friss adatok menjenek be
  await prisma.job.deleteMany({
    where: { jobType: { in: ["physical", "office"] } },
  });

  for (const j of [...physicalJobs, ...officeJobs]) {
    jobsToCreate.push(j);
  }

  if (jobsToCreate.length) {
    await prisma.job.createMany({ data: jobsToCreate, skipDuplicates: true });
  }

  console.log("Seed jobs completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
