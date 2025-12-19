import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";
import { buildRelativeImagePath, deleteFileIfExists } from "../utils/file.helper.js";

const ENTITY_CONFIG = {
  locations: { model: prisma.location, field: "img", requiresAdmin: true },
  activities: { model: prisma.activity, field: "img", requiresAdmin: true },
  jobs: { model: prisma.job, field: "img", requiresAdmin: true },
  characters: { model: prisma.character, field: "images", staged: true },
  girlfriends: { model: prisma.girlfriend, field: "images", staged: true },
};

export const attachImageToEntity = async ({ entity, id, stage, user, file }) => {
  const normalized = entity?.toLowerCase();
  const config = normalized ? ENTITY_CONFIG[normalized] : null;
  if (!config) throw new HttpError("Nem támogatott feltöltési cél", 400);

  const isAdmin = user?.role === "ADMIN";
  if (config.requiresAdmin && !isAdmin) {
    throw new HttpError("Nincs jogosultság a feltöltéshez", 403);
  }

  let record = null;
  if (normalized === "characters") {
    record = await prisma.character.findFirst({
      where: isAdmin ? { id } : { id, userId: user?.id },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);
  } else if (normalized === "girlfriends") {
    record = await prisma.girlfriend.findFirst({
      where: isAdmin ? { id } : { id, character: { userId: user?.id } },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  } else {
    record = await config.model.findUnique({ where: { id } });
    if (!record) throw new HttpError("Entitás nem található", 404);
  }

  const relativePath = buildRelativeImagePath(normalized, file.filename);

  if (config.staged) {
    const targetStage = Number.isFinite(stage) ? Number(stage) : null;
    if (!targetStage || targetStage < 1) {
      throw new HttpError("Stage megadása kötelező és minimum 1", 400);
    }
    const images = Array.isArray(record.images)
      ? [...record.images]
      : [];
    while (images.length < targetStage) {
      images.push("");
    }
    const oldPath = images[targetStage - 1];
    images[targetStage - 1] = relativePath;

    const updated = await config.model.update({
      where: { id },
      data: { [config.field]: { set: images } },
      select: { id: true, [config.field]: true },
    });

    if (oldPath && oldPath !== relativePath) {
      await deleteFileIfExists(oldPath);
    }
    return {
      entity: normalized,
      id,
      stage: targetStage,
      path: relativePath,
      images: updated[config.field],
    };
  }

  const oldPath = record?.[config.field];
  const updated = await config.model.update({
    where: { id },
    data: { [config.field]: relativePath },
    select: { id: true, [config.field]: true },
  });
  if (oldPath && oldPath !== relativePath) {
    await deleteFileIfExists(oldPath);
  }

  return {
    entity: normalized,
    id,
    path: relativePath,
    [config.field]: updated[config.field],
  };
};

export const getImagesForEntity = async ({ entity, id, user }) => {
  const normalized = entity?.toLowerCase();
  const config = normalized ? ENTITY_CONFIG[normalized] : null;
  if (!config) throw new HttpError("Nem támogatott feltöltési cél", 400);

  const isAdmin = user?.role === "ADMIN";
  let record = null;
  if (normalized === "characters") {
    record = await prisma.character.findFirst({
      where: isAdmin ? { id } : { id, userId: user?.id },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);
    return { entity: normalized, id, images: record.images ?? [] };
  }
  if (normalized === "girlfriends") {
    record = await prisma.girlfriend.findFirst({
      where: isAdmin ? { id } : { id, character: { userId: user?.id } },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
    return { entity: normalized, id, images: record.images ?? [] };
  }

  record = await config.model.findUnique({
    where: { id },
    select: { id: true, [config.field]: true },
  });
  if (!record) throw new HttpError("Entitás nem található", 404);
  return { entity: normalized, id, [config.field]: record[config.field] ?? null };
};

export const deleteImageFromEntity = async ({ entity, id, stage, user }) => {
  const normalized = entity?.toLowerCase();
  const config = normalized ? ENTITY_CONFIG[normalized] : null;
  if (!config) throw new HttpError("Nem támogatott feltöltési cél", 400);

  const isAdmin = user?.role === "ADMIN";
  if (config.requiresAdmin && !isAdmin) {
    throw new HttpError("Nincs jogosultság a törléshez", 403);
  }

  let record = null;
  if (normalized === "characters") {
    record = await prisma.character.findFirst({
      where: isAdmin ? { id } : { id, userId: user?.id },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);
  } else if (normalized === "girlfriends") {
    record = await prisma.girlfriend.findFirst({
      where: isAdmin ? { id } : { id, character: { userId: user?.id } },
      select: { id: true, images: true },
    });
    if (!record) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  } else {
    record = await config.model.findUnique({ where: { id } });
    if (!record) throw new HttpError("Entitás nem található", 404);
  }

  if (config.staged) {
    const targetStage = Number.isFinite(stage) ? Number(stage) : null;
    if (!targetStage || targetStage < 1) {
      throw new HttpError("Stage megadása kötelező és minimum 1", 400);
    }
    const images = Array.isArray(record.images)
      ? [...record.images]
      : [];
    while (images.length < targetStage) {
      images.push("");
    }
    const oldPath = images[targetStage - 1];
    images[targetStage - 1] = "";

    const updated = await config.model.update({
      where: { id },
      data: { [config.field]: { set: images } },
      select: { id: true, [config.field]: true },
    });
    await deleteFileIfExists(oldPath);
    return {
      entity: normalized,
      id,
      stage: targetStage,
      images: updated[config.field],
    };
  }

  const oldPath = record?.[config.field];
  const updated = await config.model.update({
    where: { id },
    data: { [config.field]: null },
    select: { id: true, [config.field]: true },
  });
  await deleteFileIfExists(oldPath);

  return {
    entity: normalized,
    id,
    [config.field]: updated[config.field],
  };
};

const resolveSubActivityTarget = async ({ targetType, targetId, user, isAdmin }) => {
  if (!targetType || !targetId) {
    throw new HttpError("targetType és targetId kötelező", 400);
  }
  const normalized = String(targetType).toLowerCase();
  if (normalized === "character") {
    const character = await prisma.character.findFirst({
      where: isAdmin ? { id: targetId } : { id: targetId, userId: user?.id },
      select: { id: true },
    });
    if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);
    return { characterId: character.id, girlfriendId: null };
  }
  if (normalized === "girlfriend") {
    const girlfriend = await prisma.girlfriend.findFirst({
      where: isAdmin ? { id: targetId } : { id: targetId, character: { userId: user?.id } },
      select: { id: true },
    });
    if (!girlfriend) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
    return { characterId: null, girlfriendId: girlfriend.id };
  }
  throw new HttpError("targetType csak 'character' vagy 'girlfriend' lehet", 400);
};

const resolveSubActivityRecord = async (subActivityId) => {
  const sub = await prisma.subActivity.findUnique({
    where: { id: subActivityId },
    select: { id: true },
  });
  if (!sub) throw new HttpError("SubActivity nem található", 404);
  return sub;
};

const parseStrLevel = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new HttpError("strLevel kötelező és legalább 1", 400);
  }
  return parsed;
};

export const uploadSubActivityImage = async ({
  subActivityId,
  targetType,
  targetId,
  strLevel,
  user,
  file,
}) => {
  await resolveSubActivityRecord(subActivityId);
  const isAdmin = user?.role === "ADMIN";
  const target = await resolveSubActivityTarget({ targetType, targetId, user, isAdmin });
  const level = parseStrLevel(strLevel);

  const relativePath = buildRelativeImagePath("subactivity-images", file.filename);

  const existing = await prisma.subActivityImage.findFirst({
    where: {
      subActivityId,
      strLevel: level,
      characterId: target.characterId ?? undefined,
      girlfriendId: target.girlfriendId ?? undefined,
    },
  });

  if (existing) {
    const updated = await prisma.subActivityImage.update({
      where: { id: existing.id },
      data: { img: relativePath },
      select: { id: true, img: true, strLevel: true, subActivityId: true, characterId: true, girlfriendId: true },
    });
    await deleteFileIfExists(existing.img);
    return { ...updated, path: updated.img };
  }

  const created = await prisma.subActivityImage.create({
    data: {
      subActivityId,
      strLevel: level,
      img: relativePath,
      characterId: target.characterId,
      girlfriendId: target.girlfriendId,
    },
    select: { id: true, img: true, strLevel: true, subActivityId: true, characterId: true, girlfriendId: true },
  });
  return { ...created, path: created.img };
};

export const getSubActivityImage = async ({ subActivityId, targetType, targetId, strLevel, user }) => {
  await resolveSubActivityRecord(subActivityId);
  const isAdmin = user?.role === "ADMIN";
  const target = await resolveSubActivityTarget({ targetType, targetId, user, isAdmin });
  const level = parseStrLevel(strLevel);

  const existing = await prisma.subActivityImage.findFirst({
    where: {
      subActivityId,
      strLevel: level,
      characterId: target.characterId ?? undefined,
      girlfriendId: target.girlfriendId ?? undefined,
    },
    select: { id: true, img: true, strLevel: true, subActivityId: true, characterId: true, girlfriendId: true },
  });

  return {
    subActivityId,
    strLevel: level,
    characterId: target.characterId,
    girlfriendId: target.girlfriendId,
    path: existing?.img ?? null,
  };
};

export const deleteSubActivityImage = async ({ subActivityId, targetType, targetId, strLevel, user }) => {
  await resolveSubActivityRecord(subActivityId);
  const isAdmin = user?.role === "ADMIN";
  const target = await resolveSubActivityTarget({ targetType, targetId, user, isAdmin });
  const level = parseStrLevel(strLevel);

  const existing = await prisma.subActivityImage.findFirst({
    where: {
      subActivityId,
      strLevel: level,
      characterId: target.characterId ?? undefined,
      girlfriendId: target.girlfriendId ?? undefined,
    },
    select: { id: true, img: true },
  });
  if (!existing) throw new HttpError("Kép nem található", 404);

  await prisma.subActivityImage.delete({ where: { id: existing.id } });
  await deleteFileIfExists(existing.img);

  return {
    subActivityId,
    strLevel: level,
    characterId: target.characterId,
    girlfriendId: target.girlfriendId,
    deleted: true,
  };
};
