
import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import "./RegisterPerson.css";

const API = "http://127.0.0.1:8000/api";

const emptyForm = {
  registration_number: "",
  christian_name: "",
  surname: "",
  date_of_birth: "",
  phone_number: "",
  father_name: "",
  mother_name: "",
  godparent_name: "",
  residence: "",
  home_parish: "",
};

export default function RegisterPerson({ onRegistered }) {
  const [open, setOpen] = useState(false);
  const [parishes, setParishes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingParishes, setLoadingParishes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function loadParishes() {
      setLoadingParishes(true);
      setError("");

      try {
        const response = await fetch(`${API}/parishes/`);

        if (!response.ok) {
          throw new Error("Could not load the parish list.");
        }

        const data = await response.json();
        setParishes(data);
      } catch (err) {
        setError(err.message || "Could not load the parish list.");
      } finally {
        setLoadingParishes(false);
      }
    }

    loadParishes();
  }, [open]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      ...form,
      home_parish: Number(form.home_parish),
      date_of_birth: form.date_of_birth || null,
    };

    try {
      const response = await fetch(`${API}/people/search/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const details = Object.entries(data)
          .map(([field, errors]) => {
            const text = Array.isArray(errors)
              ? errors.join(" ")
              : typeof errors === "string"
                ? errors
                : JSON.stringify(errors);

            return `${field}: ${text}`;
          })
          .join(" | ");

        throw new Error(details || "Could not register this person.");
      }

      setMessage("Person registered successfully.");
      setForm(emptyForm);

      if (onRegistered) {
        await onRegistered();
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="register-person-button"
        onClick={() => {
          setMessage("");
          setError("");
          setOpen(true);
        }}
      >
        <UserPlus size={18} />
        Register Person
      </button>

      {open && (
        <div
          className="register-person-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            className="register-person-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-person-title"
          >
            <header className="register-person-header">
              <div>
                <h2 id="register-person-title">Register a Person</h2>
                <p>Enter the person's details below.</p>
              </div>

              <button
                type="button"
                className="register-person-close"
                onClick={() => setOpen(false)}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </header>

            {message && (
              <div className="register-person-success" role="status">
                {message}
              </div>
            )}

            {error && (
              <div className="register-person-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="register-person-grid">
                <label>
                  Registration number *
                  <input
                    name="registration_number"
                    value={form.registration_number}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Home parish *
                  <select
                    name="home_parish"
                    value={form.home_parish}
                    onChange={handleChange}
                    required
                    disabled={loadingParishes}
                  >
                    <option value="">
                      {loadingParishes
                        ? "Loading parishes..."
                        : "Select parish"}
                    </option>

                    {parishes.map((parish) => (
                      <option key={parish.id} value={parish.id}>
                        {parish.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Christian name *
                  <input
                    name="christian_name"
                    value={form.christian_name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Surname *
                  <input
                    name="surname"
                    value={form.surname}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Date of birth
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Phone number
                  <input
                    type="tel"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Father's name
                  <input
                    name="father_name"
                    value={form.father_name}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Mother's name
                  <input
                    name="mother_name"
                    value={form.mother_name}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Godparent's name
                  <input
                    name="godparent_name"
                    value={form.godparent_name}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Residence
                  <input
                    name="residence"
                    value={form.residence}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <footer className="register-person-actions">
                <button
                  type="button"
                  className="register-person-cancel"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="register-person-submit"
                  disabled={saving || loadingParishes}
                >
                  {saving ? "Saving..." : "Save Person"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
