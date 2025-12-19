import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";
import { ensureStatsWithMeasurement } from "../utils/stats.helper.js";
import { advanceTime, formatHHMM } from "../utils/time.helper.js";
import { sleepAndLevelUp } from "./character.service.js";
import { sleepAndLevelUpGirlfriend } from "./girlfriend.service.js";

export const listActivities = () =>
  prisma.activity.findMany({ include: { location: true, subActivities: true } });

export const getActivity = async (id) => {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { location: true, subActivities: true },
  });
  if (!activity) throw new HttpError("Activity nem található", 404);
  return activity;
};

export const createActivity = (data) => {
  const { subActivities, ...rest } = data;
  return prisma.activity.create({
    data: {
      ...rest,
      subActivities: subActivities ? { create: subActivities } : undefined,
    },
    include: { location: true, subActivities: true },
  });
};

export const updateActivity = async (id, data) => {
  await getActivity(id);
  const { subActivities, ...rest } = data;
  // subActivities kezelése külön endpointszal
  return prisma.activity.update({
    where: { id },
    data: rest,
    include: { location: true, subActivities: true },
  });
};

export const deleteActivity = async (id) => {
  await getActivity(id);
  await prisma.activity.delete({ where: { id } });
  return true;
};

// SubActivity helpers
export const listSubActivities = (activityId) =>
  prisma.subActivity.findMany({ where: { activityId } });

export const createSubActivity = async (activityId, data) => {
  await getActivity(activityId);
  return prisma.subActivity.create({
    data: { ...data, activityId },
  });
};

export const updateSubActivity = async (activityId, subId, data) => {
  await getActivity(activityId);
  const sub = await prisma.subActivity.findUnique({ where: { id: subId } });
  if (!sub || sub.activityId !== activityId) throw new HttpError("SubActivity nem található", 404);
  return prisma.subActivity.update({
    where: { id: subId },
    data,
  });
};

export const deleteSubActivity = async (activityId, subId) => {
  await getActivity(activityId);
  const sub = await prisma.subActivity.findUnique({ where: { id: subId } });
  if (!sub || sub.activityId !== activityId) throw new HttpError("SubActivity nem található", 404);
  await prisma.subActivity.delete({ where: { id: subId } });
  return true;
};

// Execute subactivity: apply XP to character stats
export const executeSubActivity = async (userId, characterId, subId, isAdmin = false, girlfriendId) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: { include: { measurement: true } } },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);

  const sub = await prisma.subActivity.findUnique({
    where: { id: subId },
  });
  if (!sub) throw new HttpError("SubActivity nem található", 404);
  const activity = await prisma.activity.findUnique({
    where: { id: sub.activityId },
  });

  let girlfriend = null;
  if (girlfriendId) {
    girlfriend = await prisma.girlfriend.findFirst({
      where: isAdmin
        ? { id: girlfriendId }
        : { id: girlfriendId, character: { userId } },
      include: { stats: { include: { measurement: true } } },
    });
    if (!girlfriend) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  }

  const performer = girlfriend ?? character;
  let performerStats = await ensureStatsWithMeasurement(performer, Boolean(girlfriend));

  const type = sub.type?.toUpperCase();
  if (type === "SLEEP") {
    if (girlfriend) {
      const result = await sleepAndLevelUpGirlfriend(userId, girlfriend.id, isAdmin);
      return { message: `${girlfriend.name} aludt és feltöltődött.`, girlfriend: result };
    }
    const result = await sleepAndLevelUp(userId, character.id, isAdmin);
    return { message: `${character.name} aludt és feltöltődött.`, character: result };
  }
  const xpGain = sub.xpGained ?? 0;
  const staminaCost = sub.staminaCost ?? 1;
  const isMeasurementSub = (sub.name || "").toLowerCase().includes("measure");
  const durationMinutes = sub.length ?? 30;

  if (!type || !["STR", "DEX", "INT", "CHAR", "STA"].includes(type)) {
    throw new HttpError("SubActivity type nincs beállítva vagy érvénytelen", 400);
  }

  const fieldMap = {
    STR: { level: "str", xp: "currStrXp" },
    DEX: { level: "dex", xp: "currDexXp" },
    INT: { level: "int", xp: "currIntXp" },
    CHAR: { level: "char", xp: "currCharXp" },
    STA: { level: "sta", xp: "currStaXp" },
  };

  const { level, xp } = fieldMap[type];
  const currentLevel = performerStats[level] ?? 0;
  const currentXp = performerStats[xp] ?? 0;

  // stamina költség
  if ((performerStats.currentStamina ?? 0) < staminaCost) {
    throw new HttpError("Nincs elég stamina az activity-hez", 400);
  }

  const requirement = await prisma.statRequirement.findUnique({
    where: {
      statType_level: { statType: type, level: currentLevel },
    },
  });
  const neededXp = requirement?.neededXp ?? sub.xpNeeded ?? 999;

  let newXp = currentXp + xpGain;
  if (newXp > neededXp) newXp = neededXp;

  // Speciális: treadmill run (STA típus, név tartalmazza) STR XP-t is ad lvl 3-ig
  let strBoostXp = 0;
  if (type === "STA" && sub.name.toLowerCase().includes("treadmill")) {
    const currentStrXp = performerStats.currStrXp ?? 0;
    const currentStrLevel = performerStats.str ?? 0;
    const strRequirement = await prisma.statRequirement.findUnique({
      where: { statType_level: { statType: "STR", level: currentStrLevel } },
    });
    const strNeeded = strRequirement?.neededXp ?? 999;
    if (currentStrLevel < 3) {
      const nextStrXp = Math.min(currentStrXp + 5, strNeeded); // treadmill futás csak 5 STR XP-t ad
      strBoostXp = nextStrXp;
    }
  }

  const updateData = {
    [level]: currentLevel,
    [xp]: newXp,
    currentStamina: Math.max((performerStats.currentStamina ?? 0) - staminaCost, 0),
  };
  if (strBoostXp) {
    updateData.str = performerStats.str ?? 0;
    updateData.currStrXp = strBoostXp;
  }

  await prisma.stats.update({
    where: { id: performerStats.id },
    data: updateData,
  });

  // idő fogyasztása: performer szintű
  if (durationMinutes > 0) {
    if (girlfriend) {
      const advanced = advanceTime(girlfriend.time ?? character.time, durationMinutes, girlfriend.day ?? character.day);
      await prisma.girlfriend.update({
        where: { id: girlfriend.id },
        data: { time: advanced.minutes, currentTime: advanced.formatted, day: advanced.day },
      });
      girlfriend.time = advanced.minutes;
      girlfriend.currentTime = advanced.formatted;
      girlfriend.day = advanced.day;
    } else {
      const advanced = advanceTime(character.time, durationMinutes, character.day);
      await prisma.character.update({
        where: { id: character.id },
        data: { time: advanced.minutes, currentTime: advanced.formatted, day: advanced.day },
      });
      character.time = advanced.minutes; // lokális frissítés
      character.currentTime = advanced.formatted;
      character.day = advanced.day;
    }
  }

  const updatedCharacter = await prisma.character.findUnique({
    where: { id: character.id },
    include: { stats: { include: { measurement: true } } },
  });
  const updatedGirlfriend = girlfriend
    ? await prisma.girlfriend.findUnique({
        where: { id: girlfriend.id },
        include: { stats: { include: { measurement: true } } },
      })
    : null;

  const performerName = girlfriend ? updatedGirlfriend?.name ?? girlfriend.name : updatedCharacter?.name ?? character.name;
  const staminaAfter =
    updateData.currentStamina ??
    updatedCharacter?.stats?.[0]?.currentStamina ??
    updatedGirlfriend?.stats?.[0]?.currentStamina ??
    0;

  let message = `${performerName} végrehajtotta a ${sub.name} sub-activity-t.`;
  if (staminaCost) {
    message += ` Stamina költség: ${staminaCost}, maradék: ${staminaAfter}.`;
  }
  const timeAfterMinutes = girlfriend
    ? updatedGirlfriend?.time ?? girlfriend.time ?? character.time
    : updatedCharacter?.time ?? character.time;
  const timeAfterFormatted = girlfriend
    ? updatedGirlfriend?.currentTime ?? girlfriend.currentTime ?? formatHHMM(timeAfterMinutes)
    : updatedCharacter?.currentTime ?? character.currentTime ?? formatHHMM(timeAfterMinutes);
  if (durationMinutes > 0) {
    message += ` Jelenlegi idő: ${timeAfterFormatted}.`;
  }
  const measurementGender = girlfriend
    ? updatedGirlfriend?.stats?.[0]?.measurement?.gender
    : updatedCharacter?.stats?.[0]?.measurement?.gender;
  const strLevel = girlfriend
    ? updatedGirlfriend?.stats?.[0]?.str ?? 0
    : updatedCharacter?.stats?.[0]?.str ?? 0;
  const performerMeasurement =
    (girlfriend ? updatedGirlfriend?.stats?.[0]?.measurementScaled : updatedCharacter?.stats?.[0]?.measurementScaled) ??
    (girlfriend ? updatedGirlfriend?.stats?.[0]?.measurement : updatedCharacter?.stats?.[0]?.measurement);
  let filledDescription = sub.description || "";
  if (!isMeasurementSub && measurementGender !== undefined) {
    const baseLift =
      (await prisma.liftCapacity.findFirst({
        where: measurementGender ? { gender: measurementGender } : {},
        orderBy: { strLevel: "asc" },
      })) || null;
    const growth =
      (await prisma.liftGrowth.findFirst({
        where: measurementGender ? { gender: measurementGender } : {},
      })) || {};
    if (baseLift) {
      const scaleCurl = Math.pow(growth.bicepsCurlFactor || 1.1, Math.max(0, strLevel - 1));
      const scaleBench = Math.pow(growth.benchPressFactor || 1.1, Math.max(0, strLevel - 1));
      const scaleSquat = Math.pow(growth.squatFactor || 1.1, Math.max(0, strLevel - 1));
      const scaleLat = Math.pow(growth.latPulldownFactor || 1.1, Math.max(0, strLevel - 1));
      const capacity = {
        bicepsCurl: baseLift.bicepsCurl ? Math.ceil(baseLift.bicepsCurl * scaleCurl) : null,
        benchPress: baseLift.benchPress ? Math.ceil(baseLift.benchPress * scaleBench) : null,
        squat: baseLift.squat ? Math.ceil(baseLift.squat * scaleSquat) : null,
        latPulldown: baseLift.latPulldown ? Math.ceil(baseLift.latPulldown * scaleLat) : null,
      };
      const map = {
        biceps: capacity.bicepsCurl,
        curl: capacity.bicepsCurl,
        bench: capacity.benchPress,
        squat: capacity.squat,
        lat: capacity.latPulldown,
      };
      const key = Object.keys(map).find((k) => sub.name.toLowerCase().includes(k));
      if (key) {
        const amount = map[key];
        if (amount) {
          message += ` Emelt súly: ${amount} kg.`;
          const template = sub.description || "";
          const replacements = [
            { token: "{{name}}", value: performerName },
            { token: "{{weight}}", value: String(amount) },
            { token: "[name]", value: performerName },
            { token: "[weight]", value: String(amount) },
          ];
          let rendered = template;
          for (const r of replacements) {
            rendered = rendered.split(r.token).join(r.value);
          }
          if (!rendered || rendered === template) {
            rendered = `${performerName} éppen ${amount} kg-mal végzi a(z) ${sub.name} gyakorlatot.`;
          }
          filledDescription = rendered;
        }
      }
    }
  }

  // Measurement-based text (pl. “measure biceps”) és placeholder kitöltés
  if (performerMeasurement) {
    const measureMap = {
      biceps: performerMeasurement.biceps,
      quads: performerMeasurement.quads,
      back: performerMeasurement.back,
      chest: performerMeasurement.chest,
      calves: performerMeasurement.calves,
      weight: performerMeasurement.weight,
      height: performerMeasurement.height,
    };
    const measureKey = Object.keys(measureMap).find((k) => sub.name.toLowerCase().includes(k));
    if (measureKey) {
      const mVal = measureMap[measureKey];
      if (mVal !== null && mVal !== undefined) {
        message += ` Mért érték (${measureKey}): ${mVal}.`;
      }
    }
    const template = filledDescription || sub.description || "";
    const replacements = [
      { token: "{{name}}", value: performerName },
      { token: "[name]", value: performerName },
      { token: "{{measurement}}", value: measureKey ? String(measureMap[measureKey] ?? "") : "" },
      { token: "[measurement]", value: measureKey ? String(measureMap[measureKey] ?? "") : "" },
      { token: "{{biceps}}", value: String(measureMap.biceps ?? "") },
      { token: "[biceps]", value: String(measureMap.biceps ?? "") },
      { token: "{{chest}}", value: String(measureMap.chest ?? "") },
      { token: "[chest]", value: String(measureMap.chest ?? "") },
      { token: "{{back}}", value: String(measureMap.back ?? "") },
      { token: "[back]", value: String(measureMap.back ?? "") },
      { token: "{{quads}}", value: String(measureMap.quads ?? "") },
      { token: "[quads]", value: String(measureMap.quads ?? "") },
      { token: "{{calves}}", value: String(measureMap.calves ?? "") },
      { token: "[calves]", value: String(measureMap.calves ?? "") },
      { token: "{{weight}}", value: String(measureMap.weight ?? "") },
      { token: "[weight]", value: String(measureMap.weight ?? "") },
      { token: "{{height}}", value: String(measureMap.height ?? "") },
      { token: "[height]", value: String(measureMap.height ?? "") },
      { token: "{{distanceKm}}", value: "" },
      { token: "[distanceKm]", value: "" },
    ];
    let rendered = template;
    for (const r of replacements) {
      if (r.value) rendered = rendered.split(r.token).join(r.value);
    }
    if (rendered && rendered !== template) {
      filledDescription = rendered;
    }
  }

  // Endurance capacity (táv) hozzáadása üzenethez/placeholderekhez STA stat alapján
  let distanceText = "";
  const staLevel = girlfriend
    ? updatedGirlfriend?.stats?.[0]?.sta
    : updatedCharacter?.stats?.[0]?.sta;
  if (staLevel != null) {
    const baseEndurance =
      (await prisma.enduranceCapacity.findFirst({
        where: measurementGender ? { gender: measurementGender } : {},
        orderBy: { staLevel: "asc" },
      })) || null;
    const growth =
      (await prisma.enduranceGrowth.findFirst({
        where: measurementGender ? { gender: measurementGender } : {},
      })) || {};
    if (baseEndurance?.distanceKm != null) {
      const scale = Math.pow(growth.distanceFactor || 1.1, Math.max(0, (staLevel ?? 1) - 1));
      const dist = Math.ceil(baseEndurance.distanceKm * scale);
      distanceText = `${dist} km`;
      message += ` Megtehető táv: ${distanceText}.`;
      const template = filledDescription || sub.description || "";
      const replacements = [
        { token: "{{distanceKm}}", value: String(dist) },
        { token: "[distanceKm]", value: String(dist) },
      ];
      let rendered = template;
      for (const r of replacements) {
        rendered = rendered.split(r.token).join(r.value);
      }
      if (rendered && rendered !== template) filledDescription = rendered;
    }
  }

  if (newXp >= neededXp) {
    message += " Elérted a szükséges XP-t, aludj egyet a szintlépéshez!";
  }

  return {
    character: updatedCharacter,
    girlfriend: updatedGirlfriend,
    message,
    description: filledDescription,
    progress: {
      stat: type,
      level: currentLevel,
      currentXp: newXp,
      neededXp,
    },
    time: { minutes: timeAfterMinutes, formatted: timeAfterFormatted },
  };
};
