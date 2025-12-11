import prisma from "../models/prisma-client.js";

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
  const measurement = await prisma.measurements.findFirst({
    where: gender ? { strLevel, gender } : { strLevel },
  });

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

  return stats;
};
