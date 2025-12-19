import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/layout/AppLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Select from "../../components/ui/Select.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import { fetchLocations } from "../../services/locations.js";
import { fetchSubActivities, executeSubActivity } from "../../services/activities.js";
import { fetchCharacters, fetchCharacterLifts, fetchCharacterEndurance } from "../../services/characters.js";
import { fetchGirlfriends } from "../../services/girlfriends.js";
import { API_BASE_URL } from "../../constants/api.js";
import { extractErrorMessage } from "../../services/apiClient.js";

const fallbackBackground =
  "linear-gradient(135deg, rgba(255,106,61,0.35) 0%, rgba(29,211,176,0.3) 55%, rgba(11,15,20,0.9) 100%)";

export default function GamePage() {
  const { showError, showInfo } = useModal();
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subActivities, setSubActivities] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [girlfriends, setGirlfriends] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [selectedGirlfriendId, setSelectedGirlfriendId] = useState("");
  const [loading, setLoading] = useState(true);
  const [highlight, setHighlight] = useState("");
  const [liftCapacity, setLiftCapacity] = useState(null);
  const [enduranceCapacity, setEnduranceCapacity] = useState(null);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [locs, chars, gfs] = await Promise.all([fetchLocations(), fetchCharacters(), fetchGirlfriends()]);
        setLocations(locs || []);
        setCharacters(chars || []);
        setGirlfriends(gfs || []);
        if (locs?.[0]) {
          setSelectedLocationId(locs[0].id);
          setActivities(locs[0].activity || []);
          if (locs[0].activity?.[0]) {
            setSelectedActivityId(locs[0].activity[0].id);
          }
        }
        if (chars?.[0]) {
          setSelectedCharacterId(chars[0].id);
        }
      } catch (err) {
        showError({ message: extractErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [showError]);

  useEffect(() => {
    const loadSubs = async () => {
      if (!selectedActivityId) {
        setSubActivities([]);
        return;
      }
      try {
        const subs = await fetchSubActivities(selectedActivityId);
        setSubActivities(subs || []);
      } catch (err) {
        showError({ message: extractErrorMessage(err) });
      }
    };

    loadSubs();
  }, [selectedActivityId, showError]);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const selectedCharacter = useMemo(
    () => characters.find((char) => char.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const getStageIndex = (stats, totalStages = 1) => {
    const str = stats?.str ?? 1;
    const maxIdx = Math.max(1, totalStages);
    const stage = Math.max(1, Math.min(maxIdx, Math.floor(str)));
    return stage - 1;
  };

  const getCharacterImage = () => {
    if (!selectedCharacter?.images?.length) return null;
    const idx = getStageIndex(selectedCharacter.stats?.[0], selectedCharacter.images.length);
    return selectedCharacter.images[idx] || null;
  };

  const availableGirlfriends = useMemo(
    () =>
      girlfriends.filter(
        (gf) => !selectedCharacterId || !gf.characterId || gf.characterId === selectedCharacterId,
      ),
    [girlfriends, selectedCharacterId],
  );

  const selectedGirlfriend = useMemo(
    () => availableGirlfriends.find((g) => g.id === selectedGirlfriendId),
    [availableGirlfriends, selectedGirlfriendId],
  );

  const getGirlfriendImage = () => {
    if (!selectedGirlfriend?.images?.length) return null;
    const idx = getStageIndex(selectedGirlfriend.stats?.[0], selectedGirlfriend.images.length);
    return selectedGirlfriend.images[idx] || null;
  };
  const charHeightCm =
    selectedCharacter?.stats?.[0]?.measurementScaled?.height ??
    selectedCharacter?.stats?.[0]?.measurement?.height ??
    null;
  const gfHeightCm =
    selectedGirlfriend?.stats?.[0]?.measurementScaled?.height ??
    selectedGirlfriend?.stats?.[0]?.measurement?.height ??
    null;
  const baseHeight = Math.max(charHeightCm || 0, gfHeightCm || 0, 175);

  const scaleHeight = (heightCm, fallback = 60, bias = 1) => {
    if (!heightCm) return `${fallback}vh`;
    const scaled = (heightCm / 250) * 85 * bias; // 250 cm = teljes háttér ~ 85vh
    const clamped = Math.min(85, Math.max(35, scaled));
    return `${clamped}vh`;
  };

  useEffect(() => {
    if (selectedCharacterId && availableGirlfriends.length) {
      const attached = availableGirlfriends.find((g) => g.characterId === selectedCharacterId);
      setSelectedGirlfriendId(attached?.id || availableGirlfriends[0].id);
    } else {
      setSelectedGirlfriendId("");
    }
  }, [selectedCharacterId, availableGirlfriends]);

  useEffect(() => {
    if (!selectedCharacterId) {
      setLiftCapacity(null);
      setEnduranceCapacity(null);
      return;
    }
    fetchCharacterLifts(selectedCharacterId)
      .then((res) => setLiftCapacity(res?.capacity || null))
      .catch(() => setLiftCapacity(null));
    fetchCharacterEndurance(selectedCharacterId)
      .then((res) => setEnduranceCapacity(res?.capacity || null))
      .catch(() => setEnduranceCapacity(null));
  }, [selectedCharacterId, selectedCharacter?.stats?.[0]?.str, selectedCharacter?.stats?.[0]?.sta]);

  const locationImg = selectedLocation?.img
    ? selectedLocation.img.startsWith("http")
      ? selectedLocation.img
      : `${API_BASE_URL}${selectedLocation.img}`
    : null;

  const characterImgPath = getCharacterImage()
    ? getCharacterImage().startsWith("http")
      ? getCharacterImage()
      : `${API_BASE_URL}${getCharacterImage()}`
    : null;

  const girlfriendImgPath = getGirlfriendImage()
    ? getGirlfriendImage().startsWith("http")
      ? getGirlfriendImage()
      : `${API_BASE_URL}${getGirlfriendImage()}`
    : null;

  const handleLocationChange = (event) => {
    const id = event.target.value;
    setSelectedLocationId(id);
    const loc = locations.find((item) => item.id === id);
    const nextActivities = loc?.activity || [];
    setActivities(nextActivities);
    setSelectedActivityId(nextActivities[0]?.id || "");
  };

  const handleRunSub = async (subId) => {
    if (!selectedCharacterId) {
      showInfo({ title: "Hianyzo karakter", message: "Elobb valassz karaktert." });
      return;
    }
    try {
      const result = await executeSubActivity(selectedCharacterId, subId);
      showInfo({ title: "Akcio kesz", message: result?.message || "Akcio vegrehajtva." });
      const updatedCharacters = await fetchCharacters();
      setCharacters(updatedCharacters || []);
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  const handleRunSubForGirlfriend = async (subId) => {
    if (!selectedGirlfriendId) {
      showInfo({ title: "Hianyzo baratno", message: "Elobb valassz baratnot." });
      return;
    }
    try {
      const result = await executeSubActivity(selectedCharacterId || "", subId, selectedGirlfriendId);
      showInfo({ title: "Akcio kesz", message: result?.message || "Akcio vegrehajtva." });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  return (
    <AppLayout fullBleed>
      <div
        className="relative min-h-[calc(100vh-70px)] w-full overflow-hidden"
        style={{
          backgroundImage: locationImg
            ? `linear-gradient(180deg, rgba(11,15,20,0.25), rgba(11,15,20,0.55)), url(${locationImg})`
            : fallbackBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/15 to-ink/35" />
        {/* Character sprite */}
        {characterImgPath ? (
          <img
            src={characterImgPath}
            alt="Character"
            className="pointer-events-none absolute bottom-0 max-h-[85vh] object-contain"
            style={{
              left: "48%",
              transform: "translateX(-65%)",
              height: scaleHeight(selectedCharacter?.stats?.[0]?.measurement?.height, 60, 1.05),
              zIndex: highlight === "gf" ? 9 : 11,
              filter: highlight === "char" ? "drop-shadow(0 0 28px rgba(29,211,176,0.6))" : "none",
            }}
          />
        ) : null}
        {/* Girlfriend sprite */}
        {girlfriendImgPath ? (
          <img
            src={girlfriendImgPath}
            alt="Girlfriend"
            className="pointer-events-none absolute bottom-0 max-h-[85vh] object-contain"
            style={{
              left: "52%",
              transform: "translateX(-35%)",
              height: scaleHeight(selectedGirlfriend?.stats?.[0]?.measurement?.height, 55, 0.95),
              zIndex: highlight === "char" ? 9 : 12,
              filter: highlight === "gf" ? "drop-shadow(0 0 28px rgba(255,106,61,0.55))" : "none",
            }}
          />
        ) : null}
        <div className="group/left pointer-events-none absolute left-0 top-0 z-20 flex h-full">
          <div className="pointer-events-auto h-full w-4 bg-white/5" />
          <aside className="pointer-events-auto h-full w-[360px] -ml-4 -translate-x-[330px] rounded-r-[32px] border border-white/10 bg-ink/75 backdrop-blur p-5 shadow-glow transition duration-700 group-hover/left:translate-x-0">
            <Card className="space-y-4 bg-ink/80">
              <Select
                label="Karakter"
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
              >
                <option value="">Valassz karaktert</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </Select>
              <Select label="Helyszin" value={selectedLocationId} onChange={handleLocationChange}>
                <option value="">Valassz helyszint</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Activity"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
              >
                <option value="">Valassz activity-t</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Baratno"
                value={selectedGirlfriendId}
                onChange={(e) => setSelectedGirlfriendId(e.target.value)}
              >
                <option value="">Valassz baratnot</option>
                {availableGirlfriends.map((gf) => (
                  <option key={gf.id} value={gf.id}>
                    {gf.name}
                  </option>
                ))}
              </Select>
            </Card>
            <Card className="mt-4 bg-ink/80">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Subactivities</p>
              <div className="mt-4 flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
                {subActivities.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{sub.name}</p>
                      <p className="text-xs text-white/50">{sub.description || "Nincs leiras"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="subtle" onClick={() => handleRunSub(sub.id)}>
                        Char
                      </Button>
                      <Button variant="ghost" onClick={() => handleRunSubForGirlfriend(sub.id)}>
                        GF
                      </Button>
                    </div>
                  </div>
                ))}
                {subActivities.length === 0 && !loading ? (
                  <p className="text-sm text-white/50">Nincs subactivity ezen a helyszinen.</p>
                ) : null}
              </div>
            </Card>
          </aside>
        </div>

        <div className="group/location relative min-h-[520px]">
          <div className="pointer-events-none absolute inset-0" />
          <div className="absolute left-8 top-8 max-w-xl opacity-0 transition duration-700 group-hover/location:opacity-100">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Aktualis helyszin</p>
            <h2 className="font-display text-3xl text-white">{selectedLocation?.name || "Ismeretlen hely"}</h2>
            <p className="mt-2 text-white/80">{selectedLocation?.description || "Nincs leiras."}</p>
          </div>
        </div>

        <div className="group/right pointer-events-none absolute right-0 top-0 z-20 flex h-full">
          <aside className="pointer-events-auto h-full w-[360px] translate-x-[330px] rounded-l-[32px] border border-white/10 bg-ink/75 backdrop-blur p-5 shadow-glow transition duration-700 group-hover/right:translate-x-0">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Informaciok</p>
            <div className="mt-4 flex flex-col gap-3">
              <div
                className="rounded-2xl border border-white/10 px-3 py-2 transition duration-200 hover:border-mint/60"
                onMouseEnter={() => setHighlight("char")}
                onMouseLeave={() => setHighlight("")}
              >
                <p className="text-sm font-semibold text-white">Karakter</p>
                <div className="mt-2 space-y-1 text-xs text-white/70">
                  <p>Nev: {selectedCharacter?.name || "-"}</p>
                  <p>Ido: {selectedCharacter?.currentTime || "--:--"}</p>
                  <p>Nap: {selectedCharacter?.day || "-"}</p>
                  <p>Stamina: {selectedCharacter?.stats?.[0]?.currentStamina ?? "-"}</p>
                  <p>Penz: {selectedCharacter?.charMoney ?? "-"}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                  <p>STR: {selectedCharacter?.stats?.[0]?.str ?? "-"}</p>
                  <p>DEX: {selectedCharacter?.stats?.[0]?.dex ?? "-"}</p>
                  <p>INT: {selectedCharacter?.stats?.[0]?.int ?? "-"}</p>
                  <p>CHAR: {selectedCharacter?.stats?.[0]?.char ?? "-"}</p>
                  <p>STA: {selectedCharacter?.stats?.[0]?.sta ?? "-"}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/50">
                  <p>Weight: {selectedCharacter?.stats?.[0]?.measurementScaled?.weight ?? selectedCharacter?.stats?.[0]?.measurement?.weight ?? "-"}</p>
                  <p>Height: {selectedCharacter?.stats?.[0]?.measurementScaled?.height ?? selectedCharacter?.stats?.[0]?.measurement?.height ?? "-"}</p>
                  <p>Biceps: {selectedCharacter?.stats?.[0]?.measurementScaled?.biceps ?? selectedCharacter?.stats?.[0]?.measurement?.biceps ?? "-"}</p>
                  <p>Chest: {selectedCharacter?.stats?.[0]?.measurementScaled?.chest ?? selectedCharacter?.stats?.[0]?.measurement?.chest ?? "-"}</p>
                </div>
                {liftCapacity ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/50">
                    <p>BicepsCurl: {liftCapacity.bicepsCurl ?? "-"}</p>
                    <p>Bench: {liftCapacity.benchPress ?? "-"}</p>
                    <p>Squat: {liftCapacity.squat ?? "-"}</p>
                    <p>LatPulldown: {liftCapacity.latPulldown ?? "-"}</p>
                  </div>
                ) : null}
                {enduranceCapacity ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/50">
                    <p>Distance (km/1h): {enduranceCapacity.distanceKm ?? "-"}</p>
                    <p>Speed (km/h): {enduranceCapacity.speedKmh ?? enduranceCapacity.distanceKm ?? "-"}</p>
                  </div>
                ) : null}
              </div>
              <div
                className="rounded-2xl border border-white/10 px-3 py-2 transition duration-200 hover:border-ember/60"
                onMouseEnter={() => setHighlight("gf")}
                onMouseLeave={() => setHighlight("")}
              >
                <p className="text-sm font-semibold text-white">Baratno</p>
                <div className="mt-2 space-y-1 text-xs text-white/70">
                  <p>Nev: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.name || "-"}</p>
                  <p>Stamina: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.currentStamina ?? "-"}</p>
                  <p>Penz: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.girMoney ?? "-"}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                  <p>STR: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.str ?? "-"}</p>
                  <p>DEX: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.dex ?? "-"}</p>
                  <p>INT: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.int ?? "-"}</p>
                  <p>CHAR: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.char ?? "-"}</p>
                  <p>STA: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.sta ?? "-"}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/50">
                  <p>Weight: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurementScaled?.weight ?? availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurement?.weight ?? "-"}</p>
                  <p>Height: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurementScaled?.height ?? availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurement?.height ?? "-"}</p>
                  <p>Biceps: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurementScaled?.biceps ?? availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurement?.biceps ?? "-"}</p>
                  <p>Chest: {availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurementScaled?.chest ?? availableGirlfriends.find((g) => g.id === selectedGirlfriendId)?.stats?.[0]?.measurement?.chest ?? "-"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 px-3 py-2">
                <p className="text-sm font-semibold text-white">Tippek</p>
                <p className="mt-2 text-xs text-white/70">
                  Vidd a kurzort a bal also savra es indits subactivity-t, vagy hasznald a GF gombot.
                </p>
              </div>
            </div>
          </aside>
          <div className="pointer-events-auto h-full w-4 bg-white/5 rounded-l-full" />
        </div>
      </div>
    </AppLayout>
  );
}
