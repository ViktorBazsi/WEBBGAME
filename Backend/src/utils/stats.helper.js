import prisma from "../models/prisma-client.js";

const scaleByLevel = (base, level, factor = 1.1) => {
  if (base == null) return null;
  const scaled = base * Math.pow(factor, Math.max(0, (level ?? 1) - 1));
  return Math.ceil(scaled);
};

/**
 * Gondoskodik róla, hogy legyen stats rekord, alap értékekkel és measurement kapcsolattal.
 * Visszaadja a (frissített) stats sort measurement-tel együtt, ha elérhető.
 */
export const ensureStatsWithMeasurement = async (performer, isGirlfriend = false) => {
  if (!performer) return null;

  let stats = performer.stats?.[0] ?? null;

  if (!stats) {
    stats = await prisma.stats.create({
      data: isGirlfriend
        ? { girlfriendId: performer.id, str: 1, dex: 1, int: 1, char: 1, sta: 1, currStaXp: 0, currentStamina: 1 }
        : { characterId: performer.id, str: 1, dex: 1, int: 1, char: 1, sta: 1, currStaXp: 0, currentStamina: 1 },
    });
  } else {
    const patch = {};
    for (const key of ["str", "dex", "int", "char", "sta"]) {
      if (stats[key] == null) patch[key] = 1;
    }
    for (const key of ["currStrXp", "currDexXp", "currIntXp", "currCharXp", "currStaXp"]) {
      if (stats[key] == null) patch[key] = 0;
    }
    if (stats.currentStamina == null) patch.currentStamina = stats.sta ?? 1;
    if (Object.keys(patch).length) {
      stats = await prisma.stats.update({
        where: { id: stats.id },
        data: patch,
      });
    }
  }

  const gender = performer.gender || (isGirlfriend ? "FEMALE" : undefined);
  const strLevel = stats.str ?? 1;
  // keressünk measurementet; ha nincs pontos szintű, legalább a legkisebb elérhetőt (alap)
  let measurement = null;
  if (stats.measurementId) {
    measurement = await prisma.measurements.findUnique({ where: { id: stats.measurementId } });
  }
  if (!measurement) {
    measurement =
      (await prisma.measurements.findFirst({
        where: gender ? { gender } : {},
        orderBy: { strLevel: "asc" },
      })) || null;
  }

  if (measurement && stats.measurementId !== measurement.id) {
    stats = await prisma.stats.update({
      where: { id: stats.id },
      data: { measurementId: measurement.id },
      include: { measurement: true },
    });
  } else if (measurement && !stats.measurement) {
    stats = { ...stats, measurement };
  } else if (!measurement && stats.measurementId && !stats.measurement) {
    const existingMeasurement = await prisma.measurements.findUnique({
      where: { id: stats.measurementId },
    });
    if (existingMeasurement) {
      stats = { ...stats, measurement: existingMeasurement };
    }
  }

  if (stats?.measurement) {
    const base = stats.measurement;
    const growth =
      (await prisma.measurementsGrowth.findFirst({
        where: gender ? { gender } : {},
      })) || { weightFactor: 1.1, heightFactor: 1.01, bicepsFactor: 1.1, chestFactor: 1.1, quadsFactor: 1.1, calvesFactor: 1.1, backFactor: 1.1 };
    const scaled = {
      ...base,
      weight: scaleByLevel(base.weight, strLevel, growth.weightFactor ?? 1.1),
      height: scaleByLevel(base.height, strLevel, growth.heightFactor ?? 1.01),
      biceps: scaleByLevel(base.biceps, strLevel, growth.bicepsFactor ?? 1.1),
      chest: scaleByLevel(base.chest, strLevel, growth.chestFactor ?? 1.1),
      quads: scaleByLevel(base.quads, strLevel, growth.quadsFactor ?? 1.1),
      calves: scaleByLevel(base.calves, strLevel, growth.calvesFactor ?? 1.1),
      back: scaleByLevel(base.back, strLevel, growth.backFactor ?? 1.1),
      scaled: true,
    };
    stats.measurementScaled = scaled;
  }

  return stats;
};
