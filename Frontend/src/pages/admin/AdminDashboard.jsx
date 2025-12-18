import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import AppLayout from "../../components/layout/AppLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import FileInput from "../../components/ui/FileInput.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import {
  attachActivityToLocation,
  createLocation,
  deleteLocation,
  fetchLocations,
  updateLocation,
} from "../../services/locations.js";
import {
  createActivity,
  createSubActivity,
  deleteActivity,
  fetchActivities,
  fetchSubActivities,
  updateActivity,
  updateSubActivity,
} from "../../services/activities.js";
import { createCharacter, fetchCharacters, updateCharacter } from "../../services/characters.js";
import { createGirlfriend, fetchGirlfriends, updateGirlfriend } from "../../services/girlfriends.js";
import { fetchJobs } from "../../services/jobs.js";
import { uploadEntityImage, uploadSubActivityImage } from "../../services/uploads.js";
import { extractErrorMessage } from "../../services/apiClient.js";

const locationSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  description: Yup.string(),
  requirement: Yup.string(),
});

const activitySchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

const subSchema = Yup.object({
  activityId: Yup.string().required("Valassz activity-t"),
  name: Yup.string().required("Kotelezo"),
  type: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

const subEditSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  type: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

const assignSchema = Yup.object({
  locationId: Yup.string().required("Kotelezo"),
  activityId: Yup.string().required("Kotelezo"),
});

const characterSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  gender: Yup.string().required("Kotelezo"),
  locationId: Yup.string(),
});

const girlfriendSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  gender: Yup.string().required("Kotelezo"),
  characterId: Yup.string(),
});

const uploadSchema = Yup.object({
  entity: Yup.string().required("Kotelezo"),
  id: Yup.string().required("Kotelezo"),
  stage: Yup.string(),
  file: Yup.mixed().required("Kotelezo"),
});

const subImageSchema = Yup.object({
  subId: Yup.string().required("Kotelezo"),
  targetType: Yup.string().required("Kotelezo"),
  targetId: Yup.string().required("Kotelezo"),
  strLevel: Yup.number().typeError("Szam kell").required("Kotelezo"),
  file: Yup.mixed().required("Kotelezo"),
});

const statsSchema = Yup.object({
  str: Yup.number().typeError("Szam kell"),
  dex: Yup.number().typeError("Szam kell"),
  int: Yup.number().typeError("Szam kell"),
  char: Yup.number().typeError("Szam kell"),
  sta: Yup.number().typeError("Szam kell"),
  currentStamina: Yup.number().typeError("Szam kell"),
});

export default function AdminDashboard() {
  const { showInfo, showError, showConfirm } = useModal();
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [girlfriends, setGirlfriends] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [subActivities, setSubActivities] = useState([]);
  const [editLocationId, setEditLocationId] = useState("");
  const [editActivityId, setEditActivityId] = useState("");
  const [editSubActivityActivityId, setEditSubActivityActivityId] = useState("");
  const [editSubActivityId, setEditSubActivityId] = useState("");
  const [editCharacterId, setEditCharacterId] = useState("");
  const [editGirlfriendId, setEditGirlfriendId] = useState("");

  const refreshData = async () => {
    const [locs, acts, chars, gfs, jobsData] = await Promise.all([
      fetchLocations(),
      fetchActivities(),
      fetchCharacters(),
      fetchGirlfriends(),
      fetchJobs(),
    ]);
    setLocations(locs || []);
    setActivities(acts || []);
    setCharacters(chars || []);
    setGirlfriends(gfs || []);
    setJobs(jobsData || []);
  };

  useEffect(() => {
    refreshData().catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [showError]);

  useEffect(() => {
    if (!editSubActivityActivityId) {
      setSubActivities([]);
      setEditSubActivityId("");
      return;
    }
    fetchSubActivities(editSubActivityActivityId)
      .then((data) => setSubActivities(data || []))
      .catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [editSubActivityActivityId, showError]);

  const handleSubmit = async (handler, reset) => {
    try {
      await handler();
      await refreshData();
      reset();
      showInfo({ title: "Kesz", message: "Sikeres mentes." });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  const handleDeleteLocation = async (id) => {
    const ok = await showConfirm({
      title: "Torles",
      message: "Biztosan torlod ezt a location-t?",
    });
    if (!ok) return;
    try {
      await deleteLocation(id);
      await refreshData();
      showInfo({ message: "Torolve." });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  const handleDeleteActivity = async (id) => {
    const ok = await showConfirm({
      title: "Torles",
      message: "Biztosan torlod ezt az activity-t?",
    });
    if (!ok) return;
    try {
      await deleteActivity(id);
      await refreshData();
      showInfo({ message: "Torolve." });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  const entityOptions = (entity) => {
    if (entity === "locations") return locations;
    if (entity === "activities") return activities;
    if (entity === "jobs") return jobs;
    if (entity === "characters") return characters;
    if (entity === "girlfriends") return girlfriends;
    return [];
  };

  const selectedLocation = locations.find((loc) => loc.id === editLocationId);
  const selectedActivity = activities.find((act) => act.id === editActivityId);
  const selectedSubActivity = subActivities.find((sub) => sub.id === editSubActivityId);
  const selectedCharacter = characters.find((char) => char.id === editCharacterId);
  const selectedGirlfriend = girlfriends.find((gf) => gf.id === editGirlfriendId);

  return (
    <AppLayout>
      <div className="space-y-10">
        <SectionHeader
          title="Admin Dashboard"
          subtitle="Game builder"
          actions={<span className="text-xs uppercase tracking-[0.3em] text-white/50">Protected</span>}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Location" subtitle="Create" />
            <Formik
              initialValues={{ name: "", description: "", requirement: "" }}
              validationSchema={locationSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(() => createLocation(values), () => helpers.resetForm())
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                  {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                  <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                  <Input label="Requirement" name="requirement" value={values.requirement} onChange={handleChange} />
                  <Button type="submit" disabled={isSubmitting}>Create Location</Button>
                </form>
              )}
            </Formik>
            <div className="mt-6 space-y-2 text-xs text-white/60">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between">
                  <span>{loc.name}</span>
                  <Button variant="ghost" onClick={() => handleDeleteLocation(loc.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Activity" subtitle="Create" />
            <Formik
              initialValues={{ name: "", description: "" }}
              validationSchema={activitySchema}
              onSubmit={(values, helpers) =>
                handleSubmit(() => createActivity(values), () => helpers.resetForm())
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                  {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                  <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                  <Button type="submit" disabled={isSubmitting}>Create Activity</Button>
                </form>
              )}
            </Formik>
            <div className="mt-6 space-y-2 text-xs text-white/60">
              {activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between">
                  <span>{act.name}</span>
                  <Button variant="ghost" onClick={() => handleDeleteActivity(act.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="SubActivity" subtitle="Create" />
            <Formik
              initialValues={{ activityId: "", name: "", type: "", description: "" }}
              validationSchema={subSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(
                  () => createSubActivity(values.activityId, {
                    name: values.name,
                    type: values.type,
                    description: values.description,
                  }),
                  () => helpers.resetForm()
                )
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Select label="Activity" name="activityId" value={values.activityId} onChange={handleChange}>
                    <option value="">Valassz activity-t</option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name}
                      </option>
                    ))}
                  </Select>
                  {touched.activityId && errors.activityId ? (
                    <p className="text-xs text-ember">{errors.activityId}</p>
                  ) : null}
                  <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                  {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                  <Input label="Type" name="type" value={values.type} onChange={handleChange} />
                  {touched.type && errors.type ? <p className="text-xs text-ember">{errors.type}</p> : null}
                  <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                  <Button type="submit" disabled={isSubmitting}>Create SubActivity</Button>
                </form>
              )}
            </Formik>
          </Card>

          <Card>
            <SectionHeader title="Location + Activity" subtitle="Assign" />
            <Formik
              initialValues={{ locationId: "", activityId: "" }}
              validationSchema={assignSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(() => attachActivityToLocation(values.locationId, values.activityId), () => helpers.resetForm())
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Select label="Location" name="locationId" value={values.locationId} onChange={handleChange}>
                    <option value="">Valassz location-t</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                  {touched.locationId && errors.locationId ? (
                    <p className="text-xs text-ember">{errors.locationId}</p>
                  ) : null}
                  <Select label="Activity" name="activityId" value={values.activityId} onChange={handleChange}>
                    <option value="">Valassz activity-t</option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name}
                      </option>
                    ))}
                  </Select>
                  {touched.activityId && errors.activityId ? (
                    <p className="text-xs text-ember">{errors.activityId}</p>
                  ) : null}
                  <Button type="submit" disabled={isSubmitting}>Assign</Button>
                </form>
              )}
            </Formik>
          </Card>

          <Card>
            <SectionHeader title="Character" subtitle="Create" />
            <Formik
              initialValues={{ name: "", gender: "MALE", locationId: "" }}
              validationSchema={characterSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(() => createCharacter(values), () => helpers.resetForm())
              }
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
                  <Button type="submit" disabled={isSubmitting}>Create Character</Button>
                </form>
              )}
            </Formik>
          </Card>

          <Card>
            <SectionHeader title="Girlfriend" subtitle="Create" />
            <Formik
              initialValues={{ name: "", gender: "FEMALE", characterId: "" }}
              validationSchema={girlfriendSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(() => createGirlfriend(values), () => helpers.resetForm())
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                  {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                  <Select label="Gender" name="gender" value={values.gender} onChange={handleChange}>
                    <option value="FEMALE">FEMALE</option>
                    <option value="MALE">MALE</option>
                  </Select>
                  <Select label="Character" name="characterId" value={values.characterId} onChange={handleChange}>
                    <option value="">Nincs hozzarendelve</option>
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" disabled={isSubmitting}>Create Girlfriend</Button>
                </form>
              )}
            </Formik>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Location" subtitle="Edit" />
            <div className="mt-4 grid gap-4">
              <Select label="Location" value={editLocationId} onChange={(e) => setEditLocationId(e.target.value)}>
                <option value="">Valassz location-t</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
              {editLocationId ? (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name: selectedLocation?.name || "",
                    description: selectedLocation?.description || "",
                    requirement: selectedLocation?.requirement || "",
                  }}
                  validationSchema={locationSchema}
                  onSubmit={(values, helpers) =>
                    handleSubmit(() => updateLocation(editLocationId, values), () => helpers.resetForm())
                  }
                >
                  {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                      <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                      <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                      <Input label="Requirement" name="requirement" value={values.requirement} onChange={handleChange} />
                      <Button type="submit" disabled={isSubmitting}>Update Location</Button>
                    </form>
                  )}
                </Formik>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Activity" subtitle="Edit" />
            <div className="mt-4 grid gap-4">
              <Select label="Activity" value={editActivityId} onChange={(e) => setEditActivityId(e.target.value)}>
                <option value="">Valassz activity-t</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </Select>
              {editActivityId ? (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name: selectedActivity?.name || "",
                    description: selectedActivity?.description || "",
                  }}
                  validationSchema={activitySchema}
                  onSubmit={(values, helpers) =>
                    handleSubmit(() => updateActivity(editActivityId, values), () => helpers.resetForm())
                  }
                >
                  {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                      <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                      <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                      <Button type="submit" disabled={isSubmitting}>Update Activity</Button>
                    </form>
                  )}
                </Formik>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="SubActivity" subtitle="Edit" />
            <div className="mt-4 grid gap-4">
              <Select
                label="Activity"
                value={editSubActivityActivityId}
                onChange={(e) => setEditSubActivityActivityId(e.target.value)}
              >
                <option value="">Valassz activity-t</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </Select>
              <Select
                label="SubActivity"
                value={editSubActivityId}
                onChange={(e) => setEditSubActivityId(e.target.value)}
              >
                <option value="">Valassz subactivity-t</option>
                {subActivities.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
              {editSubActivityId ? (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name: selectedSubActivity?.name || "",
                    type: selectedSubActivity?.type || "",
                    description: selectedSubActivity?.description || "",
                  }}
                  validationSchema={subEditSchema}
                  onSubmit={(values, helpers) =>
                    handleSubmit(
                      () => updateSubActivity(editSubActivityActivityId, editSubActivityId, values),
                      () => helpers.resetForm()
                    )
                  }
                >
                  {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                      <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                      <Input label="Type" name="type" value={values.type} onChange={handleChange} />
                      {touched.type && errors.type ? <p className="text-xs text-ember">{errors.type}</p> : null}
                      <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                      <Button type="submit" disabled={isSubmitting}>Update SubActivity</Button>
                    </form>
                  )}
                </Formik>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Character" subtitle="Edit" />
            <div className="mt-4 grid gap-4">
              <Select label="Character" value={editCharacterId} onChange={(e) => setEditCharacterId(e.target.value)}>
                <option value="">Valassz karaktert</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </Select>
              {editCharacterId ? (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name: selectedCharacter?.name || "",
                    gender: selectedCharacter?.gender || "MALE",
                    locationId: selectedCharacter?.locationId || "",
                    charMoney: selectedCharacter?.charMoney ?? 0,
                    householdMoney: selectedCharacter?.householdMoney ?? 0,
                    stats: {
                      str: selectedCharacter?.stats?.[0]?.str ?? "",
                      dex: selectedCharacter?.stats?.[0]?.dex ?? "",
                      int: selectedCharacter?.stats?.[0]?.int ?? "",
                      char: selectedCharacter?.stats?.[0]?.char ?? "",
                      sta: selectedCharacter?.stats?.[0]?.sta ?? "",
                      currentStamina: selectedCharacter?.stats?.[0]?.currentStamina ?? "",
                    },
                    measurement: {
                      height: selectedCharacter?.stats?.[0]?.measurement?.height ?? "",
                      weight: selectedCharacter?.stats?.[0]?.measurement?.weight ?? "",
                      biceps: selectedCharacter?.stats?.[0]?.measurement?.biceps ?? "",
                      chest: selectedCharacter?.stats?.[0]?.measurement?.chest ?? "",
                      quads: selectedCharacter?.stats?.[0]?.measurement?.quads ?? "",
                      calves: selectedCharacter?.stats?.[0]?.measurement?.calves ?? "",
                      back: selectedCharacter?.stats?.[0]?.measurement?.back ?? "",
                    },
                  }}
                  validationSchema={characterSchema.shape({ stats: statsSchema })}
                  onSubmit={(values, helpers) =>
                    handleSubmit(
                      () =>
                        updateCharacter(editCharacterId, {
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
                            currentStamina: values.stats.currentStamina
                              ? Number(values.stats.currentStamina)
                              : undefined,
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
                        }),
                      () => helpers.resetForm()
                    )
                  }
                >
                  {({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
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
                      <Input
                        label="Money"
                        name="charMoney"
                        type="number"
                        value={values.charMoney}
                        onChange={handleChange}
                      />
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
                          {["str", "dex", "int", "char", "sta", "currentStamina"].map((field) => (
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
                        {errors.stats && typeof errors.stats === "string" ? (
                          <p className="text-xs text-ember">{errors.stats}</p>
                        ) : null}
                      </div>
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Measurements</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {["height", "weight", "biceps", "chest", "quads", "calves", "back"].map((field) => (
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
                      <Button type="submit" disabled={isSubmitting}>Update Character</Button>
                    </form>
                  )}
                </Formik>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Girlfriend" subtitle="Edit" />
            <div className="mt-4 grid gap-4">
              <Select label="Girlfriend" value={editGirlfriendId} onChange={(e) => setEditGirlfriendId(e.target.value)}>
                <option value="">Valassz baratnot</option>
                {girlfriends.map((gf) => (
                  <option key={gf.id} value={gf.id}>
                    {gf.name}
                  </option>
                ))}
              </Select>
              {editGirlfriendId ? (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name: selectedGirlfriend?.name || "",
                    gender: selectedGirlfriend?.gender || "FEMALE",
                    characterId: selectedGirlfriend?.characterId || "",
                    girMoney: selectedGirlfriend?.girMoney ?? 0,
                    stats: {
                      str: selectedGirlfriend?.stats?.[0]?.str ?? "",
                      dex: selectedGirlfriend?.stats?.[0]?.dex ?? "",
                      int: selectedGirlfriend?.stats?.[0]?.int ?? "",
                      char: selectedGirlfriend?.stats?.[0]?.char ?? "",
                      sta: selectedGirlfriend?.stats?.[0]?.sta ?? "",
                      currentStamina: selectedGirlfriend?.stats?.[0]?.currentStamina ?? "",
                    },
                    measurement: {
                      height: selectedGirlfriend?.stats?.[0]?.measurement?.height ?? "",
                      weight: selectedGirlfriend?.stats?.[0]?.measurement?.weight ?? "",
                      biceps: selectedGirlfriend?.stats?.[0]?.measurement?.biceps ?? "",
                      chest: selectedGirlfriend?.stats?.[0]?.measurement?.chest ?? "",
                      quads: selectedGirlfriend?.stats?.[0]?.measurement?.quads ?? "",
                      calves: selectedGirlfriend?.stats?.[0]?.measurement?.calves ?? "",
                      back: selectedGirlfriend?.stats?.[0]?.measurement?.back ?? "",
                    },
                  }}
                  validationSchema={girlfriendSchema.shape({ stats: statsSchema })}
                  onSubmit={(values, helpers) =>
                    handleSubmit(
                      () =>
                        updateGirlfriend(editGirlfriendId, {
                          name: values.name,
                          gender: values.gender,
                          characterId: values.characterId || null,
                          girMoney: Number(values.girMoney),
                          stats: {
                            str: values.stats.str ? Number(values.stats.str) : undefined,
                            dex: values.stats.dex ? Number(values.stats.dex) : undefined,
                            int: values.stats.int ? Number(values.stats.int) : undefined,
                            char: values.stats.char ? Number(values.stats.char) : undefined,
                            sta: values.stats.sta ? Number(values.stats.sta) : undefined,
                            currentStamina: values.stats.currentStamina
                              ? Number(values.stats.currentStamina)
                              : undefined,
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
                        }),
                      () => helpers.resetForm()
                    )
                  }
                >
                  {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                      <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                      <Select label="Gender" name="gender" value={values.gender} onChange={handleChange}>
                        <option value="FEMALE">FEMALE</option>
                        <option value="MALE">MALE</option>
                      </Select>
                      <Select label="Character" name="characterId" value={values.characterId} onChange={handleChange}>
                        <option value="">Nincs hozzarendelve</option>
                        {characters.map((char) => (
                          <option key={char.id} value={char.id}>
                            {char.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Money"
                        name="girMoney"
                        type="number"
                        value={values.girMoney}
                        onChange={handleChange}
                      />
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stats</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {["str", "dex", "int", "char", "sta", "currentStamina"].map((field) => (
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
                        {errors.stats && typeof errors.stats === "string" ? (
                          <p className="text-xs text-ember">{errors.stats}</p>
                        ) : null}
                      </div>
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Measurements</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {["height", "weight", "biceps", "chest", "quads", "calves", "back"].map((field) => (
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
                      <Button type="submit" disabled={isSubmitting}>Update Girlfriend</Button>
                    </form>
                  )}
                </Formik>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Entity image" subtitle="Upload" />
            <Formik
              initialValues={{ entity: "locations", id: "", stage: "", file: null }}
              validationSchema={uploadSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(
                  () => uploadEntityImage(values.entity, values.id, values.file, values.stage || undefined),
                  () => helpers.resetForm()
                )
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Select
                    label="Entity"
                    name="entity"
                    value={values.entity}
                    onChange={(e) => {
                      handleChange(e);
                      setFieldValue("id", "");
                      if (e.target.value !== "characters" && e.target.value !== "girlfriends") {
                        setFieldValue("stage", "");
                      }
                    }}
                  >
                    <option value="locations">Location</option>
                    <option value="activities">Activity</option>
                    <option value="jobs">Job</option>
                    <option value="characters">Character</option>
                    <option value="girlfriends">Girlfriend</option>
                  </Select>
                  <Select label="Entity item" name="id" value={values.id} onChange={handleChange}>
                    <option value="">Valassz elemet</option>
                    {entityOptions(values.entity).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  {touched.id && errors.id ? <p className="text-xs text-ember">{errors.id}</p> : null}
                  {(values.entity === "characters" || values.entity === "girlfriends") && (
                    <Input
                      label="Stage (1-5)"
                      name="stage"
                      type="number"
                      value={values.stage}
                      onChange={handleChange}
                    />
                  )}
                  <FileInput
                    label="Kep fajl"
                    fileName={values.file?.name}
                    onChange={(e) => setFieldValue("file", e.currentTarget.files?.[0] || null)}
                  />
                  {touched.file && errors.file ? <p className="text-xs text-ember">{errors.file}</p> : null}
                  <Button type="submit" disabled={isSubmitting}>Upload</Button>
                </form>
              )}
            </Formik>
          </Card>

          <Card>
            <SectionHeader title="SubActivity image" subtitle="Upload" />
            <Formik
              initialValues={{ subId: "", targetType: "character", targetId: "", strLevel: "", file: null }}
              validationSchema={subImageSchema}
              onSubmit={(values, helpers) =>
                handleSubmit(
                  () =>
                    uploadSubActivityImage(
                      values.subId,
                      {
                        targetType: values.targetType,
                        targetId: values.targetId,
                        strLevel: values.strLevel,
                      },
                      values.file
                    ),
                  () => helpers.resetForm()
                )
              }
            >
              {({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                  <Input label="SubActivity ID" name="subId" value={values.subId} onChange={handleChange} />
                  {touched.subId && errors.subId ? <p className="text-xs text-ember">{errors.subId}</p> : null}
                  <Select label="Target Type" name="targetType" value={values.targetType} onChange={handleChange}>
                    <option value="character">Character</option>
                    <option value="girlfriend">Girlfriend</option>
                  </Select>
                  <Input label="Target ID" name="targetId" value={values.targetId} onChange={handleChange} />
                  {touched.targetId && errors.targetId ? <p className="text-xs text-ember">{errors.targetId}</p> : null}
                  <Input
                    label="STR Level"
                    name="strLevel"
                    type="number"
                    value={values.strLevel}
                    onChange={handleChange}
                  />
                  {touched.strLevel && errors.strLevel ? <p className="text-xs text-ember">{errors.strLevel}</p> : null}
                  <FileInput
                    label="Kep fajl"
                    fileName={values.file?.name}
                    onChange={(e) => setFieldValue("file", e.currentTarget.files?.[0] || null)}
                  />
                  {touched.file && errors.file ? <p className="text-xs text-ember">{errors.file}</p> : null}
                  <Button type="submit" disabled={isSubmitting}>Upload SubActivity Image</Button>
                </form>
              )}
            </Formik>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
