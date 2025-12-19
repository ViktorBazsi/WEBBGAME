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
  fetchActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  fetchSubActivities,
  createSubActivity,
  updateSubActivity,
  deleteSubActivity,
} from "../../services/activities.js";
import { extractErrorMessage } from "../../services/apiClient.js";
import { API_BASE_URL } from "../../constants/api.js";

const activitySchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

const subSchema = Yup.object({
  activityId: Yup.string().required("Kotelezo"),
  name: Yup.string().required("Kotelezo"),
  type: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

const subEditSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  type: Yup.string().required("Kotelezo"),
  description: Yup.string(),
});

export default function AdminActivities() {
  const { showError, showInfo, showConfirm } = useModal();
  const [activities, setActivities] = useState([]);
  const [subActivities, setSubActivities] = useState([]);
  const [editActivityId, setEditActivityId] = useState("");
  const [editSubActivityId, setEditSubActivityId] = useState("");

  const load = async () => {
    const acts = await fetchActivities();
    setActivities(acts || []);
    if (editActivityId) {
      const subs = await fetchSubActivities(editActivityId);
      setSubActivities(subs || []);
    }
  };

  useEffect(() => {
    load().catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [showError]);

  useEffect(() => {
    if (!editActivityId) {
      setSubActivities([]);
      setEditSubActivityId("");
      return;
    }
    fetchSubActivities(editActivityId)
      .then((subs) => setSubActivities(subs || []))
      .catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [editActivityId, showError]);

  const selectedActivity = activities.find((a) => a.id === editActivityId);
  const selectedSub = subActivities.find((s) => s.id === editSubActivityId);
  const previewImg = (act) => (act?.img ? (act.img.startsWith("http") ? act.img : `${API_BASE_URL}${act.img}`) : null);

  const handleDeleteActivity = async (id) => {
    const ok = await showConfirm({ title: "Torles", message: "Biztosan torlod az activity-t?" });
    if (!ok) return;
    await deleteActivity(id);
    await load();
    showInfo({ message: "Torolve" });
  };

  const handleDeleteSub = async (subId) => {
    const ok = await showConfirm({ title: "Torles", message: "Biztosan torlod a subactivity-t?" });
    if (!ok) return;
    await deleteSubActivity(editActivityId, subId);
    const subs = await fetchSubActivities(editActivityId);
    setSubActivities(subs || []);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Activities & SubActivities" subtitle="Create / Edit" />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Create" subtitle="Activity" />
          <Formik
            initialValues={{ name: "", description: "" }}
            validationSchema={activitySchema}
            onSubmit={async (values, helpers) => {
              try {
                await createActivity(values);
                await load();
                helpers.resetForm();
                showInfo({ message: "Activity létrehozva" });
              } catch (err) {
                showError({ message: extractErrorMessage(err) });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Input label="Name" name="name" value={values.name} onChange={handleChange} />
                {touched.name && errors.name ? <p className="text-xs text-ember">{errors.name}</p> : null}
                <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                <Button type="submit" disabled={isSubmitting}>Create</Button>
              </form>
            )}
          </Formik>
        </Card>

        <Card>
          <SectionHeader title="Edit" subtitle="Activity" />
          <Select label="Activity" value={editActivityId} onChange={(e) => setEditActivityId(e.target.value)}>
            <option value="">Valassz activity-t</option>
            {activities.map((act) => (
              <option key={act.id} value={act.id}>
                {act.name}
              </option>
            ))}
          </Select>
          {selectedActivity?.img ? (
            <img src={previewImg(selectedActivity)} alt="preview" className="mt-3 h-24 w-full rounded-2xl object-cover" />
          ) : null}
          {editActivityId ? (
            <Formik
              enableReinitialize
              initialValues={{ name: selectedActivity?.name || "", description: selectedActivity?.description || "" }}
              validationSchema={activitySchema}
              onSubmit={async (values) => {
                try {
                  await updateActivity(editActivityId, values);
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
                  <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting}>Update</Button>
                    <Button variant="ghost" type="button" onClick={() => handleDeleteActivity(editActivityId)}>
                      Delete
                    </Button>
                  </div>
                </form>
              )}
            </Formik>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Create" subtitle="SubActivity" />
          <Formik
            initialValues={{ activityId: "", name: "", type: "", description: "" }}
            validationSchema={subSchema}
            onSubmit={async (values, helpers) => {
              try {
                await createSubActivity(values.activityId, {
                  name: values.name,
                  type: values.type,
                  description: values.description,
                });
                await fetchSubActivities(values.activityId).then((subs) => {
                  if (values.activityId === editActivityId) setSubActivities(subs || []);
                });
                helpers.resetForm();
                showInfo({ message: "SubActivity létrehozva" });
              } catch (err) {
                showError({ message: extractErrorMessage(err) });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Select label="Activity" name="activityId" value={values.activityId} onChange={handleChange}>
                  <option value="">Valassz</option>
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </Select>
                {touched.activityId && errors.activityId ? <p className="text-xs text-ember">{errors.activityId}</p> : null}
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
          <SectionHeader title="Edit" subtitle="SubActivity" />
          <Select
            label="Activity"
            value={editActivityId}
            onChange={(e) => {
              setEditActivityId(e.target.value);
              setEditSubActivityId("");
            }}
          >
            <option value="">Valassz activity-t</option>
            {activities.map((act) => (
              <option key={act.id} value={act.id}>
                {act.name}
              </option>
            ))}
          </Select>
          <Select label="SubActivity" value={editSubActivityId} onChange={(e) => setEditSubActivityId(e.target.value)}>
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
                name: selectedSub?.name || "",
                type: selectedSub?.type || "",
                description: selectedSub?.description || "",
              }}
              validationSchema={subEditSchema}
              onSubmit={async (values) => {
                try {
                  await updateSubActivity(editActivityId, editSubActivityId, values);
                  const subs = await fetchSubActivities(editActivityId);
                  setSubActivities(subs || []);
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
                  <Input label="Type" name="type" value={values.type} onChange={handleChange} />
                  {touched.type && errors.type ? <p className="text-xs text-ember">{errors.type}</p> : null}
                  <Input label="Description" name="description" value={values.description} onChange={handleChange} />
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting}>Update</Button>
                    <Button variant="ghost" type="button" onClick={() => handleDeleteSub(editSubActivityId)}>
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
