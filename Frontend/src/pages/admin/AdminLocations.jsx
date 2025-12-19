import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import { fetchLocations, createLocation, updateLocation, deleteLocation, attachActivityToLocation } from "../../services/locations.js";
import { fetchActivities } from "../../services/activities.js";
import { extractErrorMessage } from "../../services/apiClient.js";
import { API_BASE_URL } from "../../constants/api.js";

const locationSchema = Yup.object({
  name: Yup.string().required("Kotelezo"),
  description: Yup.string(),
  requirement: Yup.string(),
});

const assignSchema = Yup.object({
  locationId: Yup.string().required("Kotelezo"),
  activityId: Yup.string().required("Kotelezo"),
});

export default function AdminLocations() {
  const { showInfo, showError, showConfirm } = useModal();
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editId, setEditId] = useState("");

  const load = async () => {
    const [locs, acts] = await Promise.all([fetchLocations(), fetchActivities()]);
    setLocations(locs || []);
    setActivities(acts || []);
  };

  useEffect(() => {
    load().catch((err) => showError({ message: extractErrorMessage(err) }));
  }, [showError]);

  const selected = locations.find((l) => l.id === editId);

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title: "Torles", message: "Biztosan torlod?" });
    if (!ok) return;
    await deleteLocation(id);
    await load();
    showInfo({ message: "Torolve." });
  };

  const previewImg = (loc) => (loc?.img ? (loc.img.startsWith("http") ? loc.img : `${API_BASE_URL}${loc.img}`) : null);

  return (
    <div className="space-y-8">
      <SectionHeader title="Locations" subtitle="Create / Edit" />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Create" subtitle="Location" />
          <Formik
            initialValues={{ name: "", description: "", requirement: "" }}
            validationSchema={locationSchema}
            onSubmit={async (values, helpers) => {
              try {
                await createLocation(values);
                await load();
                helpers.resetForm();
                showInfo({ message: "Location létrehozva" });
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
                <Input label="Requirement" name="requirement" value={values.requirement} onChange={handleChange} />
                <Button type="submit" disabled={isSubmitting}>Create</Button>
              </form>
            )}
          </Formik>
        </Card>

        <Card>
          <SectionHeader title="Edit" subtitle="Location" />
          <Select label="Location" value={editId} onChange={(e) => setEditId(e.target.value)}>
            <option value="">Valassz</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
          {selected?.img ? (
            <img src={previewImg(selected)} alt="preview" className="mt-3 h-24 w-full rounded-2xl object-cover" />
          ) : null}
          {editId ? (
            <Formik
              enableReinitialize
              initialValues={{
                name: selected?.name || "",
                description: selected?.description || "",
                requirement: selected?.requirement || "",
              }}
              validationSchema={locationSchema}
              onSubmit={async (values, helpers) => {
                try {
                  await updateLocation(editId, values);
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
                  <Input label="Requirement" name="requirement" value={values.requirement} onChange={handleChange} />
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

      <Card>
        <SectionHeader title="Assign Activity" subtitle="Location" />
        <Formik
          initialValues={{ locationId: "", activityId: "" }}
          validationSchema={assignSchema}
          onSubmit={async (values, helpers) => {
            try {
              await attachActivityToLocation(values.locationId, values.activityId);
              await load();
              helpers.resetForm();
              showInfo({ message: "Hozzarendelve" });
            } catch (err) {
              showError({ message: extractErrorMessage(err) });
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <Select label="Location" name="locationId" value={values.locationId} onChange={handleChange}>
                <option value="">Valassz</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
              {touched.locationId && errors.locationId ? <p className="text-xs text-ember">{errors.locationId}</p> : null}
              <Select label="Activity" name="activityId" value={values.activityId} onChange={handleChange}>
                <option value="">Valassz</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </Select>
              {touched.activityId && errors.activityId ? <p className="text-xs text-ember">{errors.activityId}</p> : null}
              <Button type="submit" disabled={isSubmitting}>Assign</Button>
            </form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
