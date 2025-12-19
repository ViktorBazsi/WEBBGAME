import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import {
  fetchCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  fetchCharacterLifts,
  fetchCharacterEndurance,
} from "../../services/characters.js";
import { fetchLocations } from "../../services/locations.js";
import { extractErrorMessage } from "../../services/apiClient.js";
import { API_BASE_URL } from "../../constants/api.js";

const characterSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  gender: Yup.string().required("Kotelezo"),
  locationId: Yup.string(),
  charMoney: Yup.number(),
  householdMoney: Yup.number(),
  stats: Yup.object({
    str: Yup.number(),
    dex: Yup.number(),
    int: Yup.number(),
    char: Yup.number(),
    sta: Yup.number(),
    currentStamina: Yup.number(),
  }),
  measurement: Yup.object({
    height: Yup.number(),
    weight: Yup.number(),
    biceps: Yup.number(),
    chest: Yup.number(),
    quads: Yup.number(),
    calves: Yup.number(),
    back: Yup.number(),
  }),
});

const statFields = ["str", "dex", "int", "char", "sta", "currentStamina"];
const measurementFields = ["height", "weight", "biceps", "chest", "quads", "calves", "back"];

const imgUrl = (path) => (path ? (path.startsWith("http") ? path : `${API_BASE_URL}${path}`) : null);

export default function AdminCharacters() {
  const { showError, showInfo, showConfirm } = useModal();
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editId, setEditId] = useState("");
  const [liftCapacity, setLiftCapacity] = useState(null);
  const [liftBase, setLiftBase] = useState(null);
  const [endurance, setEndurance] = useState(null);
  const [enduranceBase, setEnduranceBase] = useState(null);

  const load = async () => {
    const [chars, locs] = await Promise.all([fetchCharacters(), fetchLocations()]);
    setCharacters(chars || []);
    setLocations(locs || []);
  };

  useEffect(() => {
    load().catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [showError]);

  const selected = characters.find((c) => c.id === editId);
  const stageIdx =
    selected?.stats?.[0]?.str != null ? Math.max(0, Math.min(4, Math.floor(selected.stats[0].str) - 1)) : 0;
  const previewImg = selected?.images?.[stageIdx] || "";

  useEffect(() => {
    if (!editId) {
      setLiftCapacity(null);
      setLiftBase(null);
      setEndurance(null);
      setEnduranceBase(null);
      return;
    }
    fetchCharacterLifts(editId)
      .then((data) => {
        setLiftCapacity(data?.capacity || null);
        setLiftBase(data?.base || null);
      })
      .catch(() => {
        setLiftCapacity(null);
        setLiftBase(null);
      });
    fetchCharacterEndurance(editId)
      .then((data) => {
        setEndurance(data?.capacity || null);
        setEnduranceBase(data?.base || null);
      })
      .catch(() => {
        setEndurance(null);
        setEnduranceBase(null);
      });
  }, [editId, selected?.stats?.[0]?.str, selected?.stats?.[0]?.sta]);

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title: "Torles", message: "Biztosan torlod?" });
    if (!ok) return;
    await deleteCharacter(id);
    await load();
    showInfo({ message: "Torolve" });
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Characters" subtitle="Create / Edit" />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Create" subtitle="Character" />
          <Formik
            initialValues={{ name: "", gender: "MALE", locationId: "", charMoney: 0, householdMoney: 0 }}
            validationSchema={characterSchema}
            onSubmit={async (values, helpers) => {
              try {
                await createCharacter({
                  name: values.name,
                  gender: values.gender,
                  locationId: values.locationId || null,
                });
                await load();
                helpers.resetForm();
                showInfo({ message: "Létrehozva" });
              } catch (err) {
                showError({ message: extractErrorMessage(err) });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                <Select label="Gender" name="gender" value={values.gender} onChange={handleChange}>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </Select>
                <Select label="Location" name="locationId" value={values.locationId} onChange={handleChange}>
                  <option value="">Nincs</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={isSubmitting}>Create</Button>
              </form>
            )}
          </Formik>
        </Card>

        <Card>
          <SectionHeader title="Edit" subtitle="Character" />
          <Select label="Character" value={editId} onChange={(e) => setEditId(e.target.value)}>
            <option value="">Valassz</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Current stage ({stageIdx + 1})</p>
            {previewImg ? (
              <img
                src={imgUrl(previewImg)}
                alt="preview"
                className="mx-auto mt-2 max-h-60 w-full rounded-xl object-contain"
              />
            ) : (
              <p className="mt-2 text-center text-sm text-white/60">Nincs kép ehhez a stage-hez, tölts fel.</p>
            )}
          </div>
          {editId ? (
            <Formik
              enableReinitialize
              initialValues={{
                name: selected?.name || "",
                gender: selected?.gender || "MALE",
                locationId: selected?.locationId || "",
                charMoney: selected?.charMoney ?? 0,
                householdMoney: selected?.householdMoney ?? 0,
                stats: {
                  str: selected?.stats?.[0]?.str ?? "",
                  dex: selected?.stats?.[0]?.dex ?? "",
                  int: selected?.stats?.[0]?.int ?? "",
                  char: selected?.stats?.[0]?.char ?? "",
                  sta: selected?.stats?.[0]?.sta ?? "",
                  currentStamina: selected?.stats?.[0]?.currentStamina ?? "",
                },
                measurement: {
                  height: selected?.stats?.[0]?.measurement?.height ?? "",
                  weight: selected?.stats?.[0]?.measurement?.weight ?? "",
                  biceps: selected?.stats?.[0]?.measurement?.biceps ?? "",
                  chest: selected?.stats?.[0]?.measurement?.chest ?? "",
                  quads: selected?.stats?.[0]?.measurement?.quads ?? "",
                  calves: selected?.stats?.[0]?.measurement?.calves ?? "",
                  back: selected?.stats?.[0]?.measurement?.back ?? "",
                },
              }}
              validationSchema={characterSchema}
              onSubmit={async (values) => {
                try {
                  await updateCharacter(editId, {
                    name: values.name,
                    gender: values.gender,
                    locationId: values.locationId || null,
                    charMoney: Number(values.charMoney),
                    householdMoney: Number(values.householdMoney),
                    stats: {
                      str: values.stats.str ? Number(values.stats.str) : undefined,
                      dex: values.stats.dex ? Number(values.stats.dex) : undefined,
                      int: values.stats.int ? Number(values.stats.int) : undefined,
                      char: values.stats.char ? Number(values.stats.char) : undefined,
                      sta: values.stats.sta ? Number(values.stats.sta) : undefined,
                      currentStamina: values.stats.currentStamina ? Number(values.stats.currentStamina) : undefined,
                    },
                    measurement: {
                      height: values.measurement.height ? Number(values.measurement.height) : undefined,
                      weight: values.measurement.weight ? Number(values.measurement.weight) : undefined,
                      biceps: values.measurement.biceps ? Number(values.measurement.biceps) : undefined,
                      chest: values.measurement.chest ? Number(values.measurement.chest) : undefined,
                      quads: values.measurement.quads ? Number(values.measurement.quads) : undefined,
                      calves: values.measurement.calves ? Number(values.measurement.calves) : undefined,
                      back: values.measurement.back ? Number(values.measurement.back) : undefined,
                    },
                  });
                  await load();
                  showInfo({ message: "Mentve" });
                } catch (err) {
                  showError({ message: extractErrorMessage(err) });
                }
              }}
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                  {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                  <Select label="Gender" name="gender" value={values.gender} onChange={handleChange}>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </Select>
                  <Select label="Location" name="locationId" value={values.locationId} onChange={handleChange}>
                    <option value="">Nincs</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                  <Input label="Money" name="charMoney" type="number" value={values.charMoney} onChange={handleChange} />
                  <Input
                    label="Household Money"
                    name="householdMoney"
                    type="number"
                    value={values.householdMoney}
                    onChange={handleChange}
                  />
                  <div className="rounded-2xl border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stats</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {statFields.map((field) => (
                        <Input
                          key={field}
                          label={field.toUpperCase()}
                          name={`stats.${field}`}
                          type="number"
                          value={values.stats?.[field] ?? ""}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Measurements (base)</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {measurementFields.map((field) => (
                        <Input
                          key={field}
                          label={field.toUpperCase()}
                          name={`measurement.${field}`}
                          type="number"
                          value={values.measurement?.[field] ?? ""}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Measurements (current/scaled)</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-white/70">
                      {measurementFields.map((field) => (
                        <div key={field} className="rounded-xl border border-white/10 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{field}</p>
                          <p className="text-sm">
                            {selected?.stats?.[0]?.measurementScaled?.[field] ??
                              selected?.stats?.[0]?.measurement?.[field] ??
                              "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Lift capacity</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-white/70">
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">BicepsCurl</p>
                        <p>Base: {liftBase?.bicepsCurl ?? "-"}</p>
                        <p>Current: {liftCapacity?.bicepsCurl ?? "-"}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Bench</p>
                        <p>Base: {liftBase?.benchPress ?? "-"}</p>
                        <p>Current: {liftCapacity?.benchPress ?? "-"}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Squat</p>
                        <p>Base: {liftBase?.squat ?? "-"}</p>
                        <p>Current: {liftCapacity?.squat ?? "-"}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">LatPulldown</p>
                        <p>Base: {liftBase?.latPulldown ?? "-"}</p>
                        <p>Current: {liftCapacity?.latPulldown ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Endurance</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-white/70">
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Distance (km/1h)</p>
                        <p>Base: {enduranceBase?.distanceKm ?? "-"}</p>
                        <p>Current: {endurance?.distanceKm ?? "-"}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Speed (km/h)</p>
                        <p>Base: {enduranceBase?.speedKmh ?? enduranceBase?.distanceKm ?? "-"}</p>
                        <p>Current: {endurance?.speedKmh ?? endurance?.distanceKm ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting}>Update</Button>
                    <Button variant="ghost" type="button" onClick={() => handleDelete(editId)}>
                      Delete
                    </Button>
                  </div>
                </form>
              )}
            </Formik>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
