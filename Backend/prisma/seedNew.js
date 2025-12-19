import prisma from "../src/models/prisma-client.js";

/**
 * Egységes bázis seed a skálázott logikához.
 * - Measurements: STR 1-10, gender MALE/FEMALE (height/weight stb.)
 * - LiftCapacity: bicepsCurl/benchPress/squat/latPulldown (STR 1-10) MALE/FEMALE
 * - EnduranceCapacity: distanceKm (STA 1-10) MALE/FEMALE
 *
 * A backend skáláz: measurementScaled, lift skála 1.1^(str-1), endurance skála 1.1^(sta-1).
 */

const MALE_BASE = {
  height: 175,
  weight: 70,
  biceps: 30,
  chest: 95,
  quads: 55,
  calves: 35,
  back: 45,
};

const FEMALE_BASE = {
  height: 165,
  weight: 55,
  biceps: 24,
  chest: 85,
  quads: 50,
  calves: 32,
  back: 40,
};

const buildMeasurements = (genderBase, gender) => [
  {
    strLevel: 1,
    gender,
    ...genderBase,
  },
];

const MALE_LIFT_BASE = {
  bicepsCurl: 15,
  benchPress: 40,
  squat: 60,
  latPulldown: 35,
};

const FEMALE_LIFT_BASE = {
  bicepsCurl: 8,
  benchPress: 25,
  squat: 40,
  latPulldown: 20,
};

const buildLift = (base, gender) => [
  {
    strLevel: 1,
    gender,
    ...base,
  },
];

const buildEndurance = (baseKm, gender) => [
  {
    staLevel: 1,
    gender,
    distanceKm: baseKm,
  },
];

async function main() {
  console.log("Seeding measurements, lift capacity, endurance capacity...");

  const measurements = [
    ...buildMeasurements(MALE_BASE, "MALE"),
    ...buildMeasurements(FEMALE_BASE, "FEMALE"),
  ];
  const lifts = [...buildLift(MALE_LIFT_BASE, "MALE"), ...buildLift(FEMALE_LIFT_BASE, "FEMALE")];
  const endurance = [...buildEndurance(5, "MALE"), ...buildEndurance(4, "FEMALE")];
  const measurementsGrowth = [
    { gender: "MALE", weightFactor: 1.1, heightFactor: 1.01, bicepsFactor: 1.1, chestFactor: 1.1, quadsFactor: 1.1, calvesFactor: 1.1, backFactor: 1.1 },
    { gender: "FEMALE", weightFactor: 1.1, heightFactor: 1.01, bicepsFactor: 1.1, chestFactor: 1.1, quadsFactor: 1.1, calvesFactor: 1.1, backFactor: 1.1 },
  ];
  const liftGrowth = [
    { gender: "MALE", bicepsCurlFactor: 1.15, benchPressFactor: 1.15, squatFactor: 1.15, latPulldownFactor: 1.15 },
    { gender: "FEMALE", bicepsCurlFactor: 1.15, benchPressFactor: 1.15, squatFactor: 1.15, latPulldownFactor: 1.15 },
  ];
  const enduranceGrowth = [
    { gender: "MALE", distanceFactor: 1.1 },
    { gender: "FEMALE", distanceFactor: 1.1 },
  ];

  await prisma.measurements.deleteMany({});
  await prisma.liftCapacity.deleteMany({});
  await prisma.enduranceCapacity.deleteMany({});
  await prisma.measurementsGrowth.deleteMany({});
  await prisma.liftGrowth.deleteMany({});
  await prisma.enduranceGrowth.deleteMany({});

  await prisma.measurements.createMany({ data: measurements });
  await prisma.liftCapacity.createMany({ data: lifts });
  await prisma.enduranceCapacity.createMany({ data: endurance });
  await prisma.measurementsGrowth.createMany({ data: measurementsGrowth });
  await prisma.liftGrowth.createMany({ data: liftGrowth });
  await prisma.enduranceGrowth.createMany({ data: enduranceGrowth });

  console.log("Seed kész");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
