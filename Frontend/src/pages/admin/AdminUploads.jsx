import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import FileInput from "../../components/ui/FileInput.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import { fetchLocations } from "../../services/locations.js";
import { fetchActivities, fetchSubActivities } from "../../services/activities.js";
import { fetchCharacters } from "../../services/characters.js";
import { fetchGirlfriends } from "../../services/girlfriends.js";
import { fetchJobs } from "../../services/jobs.js";
import {
  uploadEntityImage,
  uploadSubActivityImage,
  deleteEntityImage,
  deleteSubActivityImage,
  fetchSubActivityImage,
} from "../../services/uploads.js";
import { extractErrorMessage } from "../../services/apiClient.js";
import { API_BASE_URL } from "../../constants/api.js";

const entitySchema = Yup.object({
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

const entityOptions = [
  { value: "locations", label: "Location" },
  { value: "activities", label: "Activity" },
  { value: "jobs", label: "Job" },
  { value: "characters", label: "Character" },
  { value: "girlfriends", label: "Girlfriend" },
];

export default function AdminUploads() {
  const { showError, showInfo } = useModal();
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subActivities, setSubActivities] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [girlfriends, setGirlfriends] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedActivityForSub, setSelectedActivityForSub] = useState("");
  const [subPreviewParams, setSubPreviewParams] = useState(null);
  const [subPreviewPath, setSubPreviewPath] = useState(null);

  const load = async () => {
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
    load().catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [showError]);

  useEffect(() => {
    if (!selectedActivityForSub) {
      setSubActivities([]);
      return;
    }
    fetchSubActivities(selectedActivityForSub)
      .then((subs) => setSubActivities(subs || []))
      .catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [selectedActivityForSub, showError]);

  useEffect(() => {
    if (!subPreviewParams?.subId || !subPreviewParams?.targetId || !subPreviewParams?.strLevel) {
      setSubPreviewPath(null);
      return;
    }
    fetchSubActivityImage(subPreviewParams.subId, {
      targetType: subPreviewParams.targetType,
      targetId: subPreviewParams.targetId,
      strLevel: subPreviewParams.strLevel,
    })
      .then((res) => setSubPreviewPath(res?.path || null))
      .catch(() => setSubPreviewPath(null));
  }, [subPreviewParams]);

  const pickList = (entity) => {
    switch (entity) {
      case "locations":
        return locations;
      case "activities":
        return activities;
      case "jobs":
        return jobs;
      case "characters":
        return characters;
      case "girlfriends":
        return girlfriends;
      default:
        return [];
    }
  };

  const resolveEntityPreview = (entity, id, stage) => {
    if (!entity || !id) return null;
    const list = pickList(entity);
    const item = list.find((x) => x.id === id);
    if (!item) return null;
    if (entity === "characters" || entity === "girlfriends") {
      const idx = Math.max(0, Math.min((Number(stage) || 1) - 1, (item.images?.length || 5) - 1));
      return item.images?.[idx] || null;
    }
    return item.img || null;
  };

  const toUrl = (path) => (path ? (path.startsWith("http") ? path : `${API_BASE_URL}${path}`) : null);

  const handleDeleteEntityImage = async (values) => {
    try {
      await deleteEntityImage(
        values.entity,
        values.id,
        values.entity === "characters" || values.entity === "girlfriends" ? values.stage || undefined : undefined,
      );
      showInfo({ message: "Torolve" });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  const handleDeleteSubImage = async (values) => {
    try {
      await deleteSubActivityImage(values.subId, {
        targetType: values.targetType,
        targetId: values.targetId,
        strLevel: values.strLevel,
      });
      showInfo({ message: "Torolve" });
    } catch (err) {
      showError({ message: extractErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Uploads" subtitle="Entity & SubActivity" />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Entity image" subtitle="Upload" />
          <Formik
            initialValues={{ entity: "locations", id: "", stage: "", file: null }}
            validationSchema={entitySchema}
            onSubmit={async (values, helpers) => {
              try {
                await uploadEntityImage(
                  values.entity,
                  values.id,
                  values.file,
                  values.entity === "characters" || values.entity === "girlfriends" ? values.stage || undefined : undefined,
                );
                await load();
                helpers.resetForm();
                showInfo({ message: "Feltoltve" });
              } catch (err) {
                showError({ message: extractErrorMessage(err) });
              }
            }}
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
                    setFieldValue("stage", "");
                  }}
                >
                  {entityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Select label="Item" name="id" value={values.id} onChange={handleChange}>
                  <option value="">Valassz</option>
                  {pickList(values.entity).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                {(values.entity === "characters" || values.entity === "girlfriends") && (
                  <Input
                    label="Stage (1-5)"
                    name="stage"
                    type="number"
                    value={values.stage}
                    onChange={handleChange}
                  />
                )}
                {values.id ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Current image</p>
                    {resolveEntityPreview(values.entity, values.id, values.stage) ? (
                      <img
                        src={toUrl(resolveEntityPreview(values.entity, values.id, values.stage))}
                        alt="current"
                        className="mt-2 max-h-60 w-full rounded-lg object-contain bg-black/30"
                      />
                    ) : (
                      <p className="mt-1 text-white/50">Nincs kep</p>
                    )}
                  </div>
                ) : null}
                <FileInput
                  label="Kep fajl"
                  fileName={values.file?.name}
                  onChange={(e) => setFieldValue("file", e.currentTarget.files?.[0] || null)}
                />
                {touched.file && errors.file ? <p className="text-xs text-ember">{errors.file}</p> : null}
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>Upload</Button>
                  <Button
                    type="button"
                    variant="ghost"
                  onClick={async () => {
                    await handleDeleteEntityImage({
                      ...values,
                      stage: values.stage ? Number(values.stage) : undefined,
                    });
                    await load();
                  }}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            )}
          </Formik>
        </Card>

        <Card>
          <SectionHeader title="SubActivity image" subtitle="Upload" />
          <Formik
            initialValues={{ activityId: "", subId: "", targetType: "character", targetId: "", strLevel: "", file: null }}
            validationSchema={subImageSchema}
            onSubmit={async (values, helpers) => {
              try {
                await uploadSubActivityImage(
                  values.subId,
                  {
                    targetType: values.targetType,
                    targetId: values.targetId,
                    strLevel: values.strLevel,
                  },
                  values.file,
                );
                await load();
                helpers.resetForm();
                showInfo({ message: "Feltoltve" });
              } catch (err) {
                showError({ message: extractErrorMessage(err) });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Select
                  label="Activity"
                  name="activityId"
                  value={values.activityId}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedActivityForSub(e.target.value);
                    setFieldValue("subId", "");
                    setSubPreviewParams(null);
                  }}
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
                  name="subId"
                  value={values.subId}
                  onChange={(e) => {
                    handleChange(e);
                    setSubPreviewParams({
                      subId: e.target.value,
                      targetType: values.targetType,
                      targetId: values.targetId,
                      strLevel: values.strLevel,
                    });
                  }}
                >
                  <option value="">Valassz subactivity-t</option>
                  {subActivities.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Target type"
                  name="targetType"
                  value={values.targetType}
                  onChange={(e) => {
                    handleChange(e);
                    setSubPreviewParams({
                      subId: values.subId,
                      targetType: e.target.value,
                      targetId: values.targetId,
                      strLevel: values.strLevel,
                    });
                  }}
                >
                  <option value="character">Character</option>
                  <option value="girlfriend">Girlfriend</option>
                </Select>
                <Select
                  label="Target"
                  name="targetId"
                  value={values.targetId}
                  onChange={(e) => {
                    handleChange(e);
                    setSubPreviewParams({
                      subId: values.subId,
                      targetType: values.targetType,
                      targetId: e.target.value,
                      strLevel: values.strLevel,
                    });
                  }}
                >
                  <option value="">Valassz</option>
                  {(values.targetType === "character" ? characters : girlfriends).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="STR Level"
                  name="strLevel"
                  type="number"
                  value={values.strLevel}
                  onChange={(e) => {
                    handleChange(e);
                    setSubPreviewParams({
                      subId: values.subId,
                      targetType: values.targetType,
                      targetId: values.targetId,
                      strLevel: e.target.value,
                    });
                  }}
                />
                {values.subId && values.targetId && values.strLevel ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Current image</p>
                    {subPreviewPath ? (
                      <img
                        src={toUrl(subPreviewPath)}
                        alt="sub-preview"
                        className="mt-2 max-h-60 w-full rounded-lg object-contain bg-black/30"
                      />
                    ) : (
                      <p className="mt-1 text-white/50">Nincs kep</p>
                    )}
                  </div>
                ) : null}
                <FileInput
                  label="Kep fajl"
                  fileName={values.file?.name}
                  onChange={(e) => setFieldValue("file", e.currentTarget.files?.[0] || null)}
                />
                {touched.file && errors.file ? <p className="text-xs text-ember">{errors.file}</p> : null}
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>Upload SubActivity Image</Button>
                  <Button
                    type="button"
                    variant="ghost"
                  onClick={async () => {
                    await handleDeleteSubImage(values);
                    await load();
                  }}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            )}
          </Formik>
        </Card>
      </div>
    </div>
  );
}
