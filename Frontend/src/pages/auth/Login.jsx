import { useNavigate, Link } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useModal } from "../../contexts/ModalContext.jsx";
import { extractErrorMessage } from "../../services/apiClient.js";

const schema = Yup.object({
  email: Yup.string().email("Ervenytelen email").required("Kotelezo"),
  password: Yup.string().min(4, "Tul rovid").required("Kotelezo"),
});

export default function Login() {
  const { login } = useAuth();
  const { showError } = useModal();
  const navigate = useNavigate();

  return (
    <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col justify-center gap-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Belepes</p>
        <h1 className="font-display text-4xl text-white md:text-5xl">Lepj be a varosba.</h1>
        <p className="text-white/70">
          Valaszd ki a helyszint, indits egy subactivity-t, es kovessd a statok fejlodeset.
        </p>
      </div>
      <Card>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await login(values);
              navigate("/game");
            } catch (err) {
              showError({ message: extractErrorMessage(err) });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <Input
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="email@domain.com"
              />
              {touched.email && errors.email ? <p className="text-xs text-ember">{errors.email}</p> : null}
              <Input
                label="Jelszo"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
              />
              {touched.password && errors.password ? <p className="text-xs text-ember">{errors.password}</p> : null}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Belep..." : "Bejelentkezes"}
              </Button>
              <p className="text-sm text-white/60">
                Nincs meg fiokod?{" "}
                <Link to="/register" className="text-mint">
                  Regisztracio
                </Link>
              </p>
            </form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
