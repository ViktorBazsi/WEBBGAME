/**
 * A "time" mezőt percre normalizálja.
 * Ha a kapott érték 48 alatti, órának vesszük (8 -> 480 perc).
 * Ha 48 vagy felette, percnek tekintjük.
 */
export const normalizeMinutes = (timeValue = 0) => {
  const numeric = Number(timeValue) || 0;
  if (numeric < 48) return numeric * 60;
  return numeric;
};

export const addMinutes = (timeValue, minutesToAdd = 0) => {
  const base = normalizeMinutes(timeValue);
  return base + (minutesToAdd || 0);
};

export const formatHHMM = (minutesValue = 0) => {
  const total = Math.max(0, Math.floor(minutesValue)) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const advanceTime = (timeValue = 0, minutesToAdd = 0, day = "Monday") => {
  const base = normalizeMinutes(timeValue);
  const total = base + (minutesToAdd || 0);
  const dayShift = Math.floor(total / 1440);
  const minutes = total % 1440;
  let newDay = day;
  if (dayShift && day) {
    const idx = DAYS.indexOf(day);
    if (idx >= 0) {
      newDay = DAYS[(idx + dayShift) % DAYS.length];
    }
  }
  return { minutes, day: newDay, formatted: formatHHMM(minutes) };
};
