import { useEffect, useState } from "react";
import {
  Church,
  Users,
  Droplets,
  BookOpen,
  Cross,
  Heart,
  Search,
  RefreshCw,
  ChevronDown,
  CalendarDays,
  MapPin,
  UserRound,
  X,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import RegisterPerson from "./registerperson";
import "./App.css";

const API = "http://127.0.0.1:8000/api";

const emptyStats = {
  registered_people: 0,
  baptisms: 0,
  first_holy_communions: 0,
  confirmations: 0,
  matrimonies: 0,
};

function formatDate(value) {
  if (!value) return "Not recorded";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [parishes, setParishes] = useState([]);
  const [parishId, setParishId] = useState("");
  const [stats, setStats] = useState(emptyStats);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingParishes, setLoadingParishes] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParishes() {
      try {
        setError("");
        const response = await fetch(`${API}/parishes/`);

        if (!response.ok) {
          throw new Error("Could not load parishes.");
        }

        const data = await response.json();
        setParishes(data);

        if (data.length > 0) {
          setParishId(String(data[0].id));
        }
      } catch (err) {
        setError(
          "Could not connect to Django. Check that your backend server is running."
        );
      } finally {
        setLoadingParishes(false);
      }
    }

    loadParishes();
  }, []);

  useEffect(() => {
    if (!parishId) {
      setStats(emptyStats);
      return;
    }

    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);

      try {
        const response = await fetch(
          `${API}/parishes/${parishId}/statistics/`
        );

        if (!response.ok) {
          throw new Error("Could not load parish statistics.");
        }

        const data = await response.json();

        if (!cancelled) {
          setStats(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load statistics for the selected parish.");
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [parishId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      setLoadingPeople(true);

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("q", search.trim());
        }

        if (parishId) {
          params.set("parish_id", parishId);
        }

        const response = await fetch(
          `${API}/people/search/?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Could not load people.");
        }

        const data = await response.json();

        if (!cancelled) {
          setPeople(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load the people list.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPeople(false);
        }
      }
    }

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, [parishId, search]);

  async function openPerson(person) {
    setSelectedPerson(person);
    setHistory(null);
    setLoadingHistory(true);

    try {
      const response = await fetch(
        `${API}/people/${person.id}/history/`
      );

      if (!response.ok) {
        throw new Error("Could not load sacramental history.");
      }

      const data = await response.json();
      setHistory(data);
    } catch {
      setError("Could not load this person's sacramental history.");
    } finally {
      setLoadingHistory(false);
    }
  }

  function closePerson() {
    setSelectedPerson(null);
    setHistory(null);
  }

  const statCards = [
    {
      label: "Baptisms",
      value: stats.baptisms,
      icon: Droplets,
      tone: "gold",
    },
    {
      label: "First Holy Communion",
      value: stats.first_holy_communions,
      icon: BookOpen,
      tone: "sage",
    },
    {
      label: "Confirmations",
      value: stats.confirmations,
      icon: Cross,
      tone: "green",
    },
    {
      label: "Matrimonies",
      value: stats.matrimonies,
      icon: Heart,
      tone: "gold",
    },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Church size={27} strokeWidth={1.7} />
          </div>
          <div>
            <h2>Parish Records</h2>
            <p>TORORO ARCHDIOCESE</p>
          </div>
        </div>

        <div className="sidebar-divider" />

        <p className="nav-heading">MAIN MENU</p>
        <div className="nav-item active">
          <Church size={19} />
          <span>Dashboard</span>
        </div>
        <div className="nav-item">
          <Users size={19} />
          <span>People directory</span>
        </div>
        <div className="nav-item">
          <Droplets size={19} />
          <span>Sacramental records</span>
        </div>

        <div className="sidebar-footer">
          <div className="footer-icon">
            <Cross size={18} />
          </div>
          <p>
            Faithfully preserving
            <br />
            our sacramental history.
          </p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <Church size={23} />
            <span>Parish Records</span>
          </div>
          <div className="breadcrumb">
            Archdiocese <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="topbar-label">
            <span className="status-dot" />
            Records Management
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div className="welcome-title-group">
              <div className="welcome-emblem" aria-hidden="true">
                <Church size={34} strokeWidth={1.3} />
              </div>
              <div>
                <p className="eyebrow">TORORO ARCHDIOCESE</p>
                <h1>Sacramental Records</h1>
                <p className="welcome-description">
                  A central place to preserve, manage, and find parish records.
                </p>
              </div>
            </div>

            <div className="welcome-actions">
              <RegisterPerson onRegistered={() => window.location.reload()} />
              <div
                className="people-total-circle"
                title="Registered people in the selected parish"
                aria-label={`Registered people: ${loadingStats ? "loading" : (stats.registered_people ?? 0).toLocaleString()}`}
              >
                <span>Registered people</span>
                <strong>
                  {loadingStats
                    ? "—"
                    : (stats.registered_people ?? 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="parish-panel">
            <div className="panel-icon">
              <MapPin size={21} />
            </div>
            <div className="parish-select-wrap">
              <label htmlFor="parish-select">SELECT PARISH</label>
              <div className="select-container">
                <select
                  id="parish-select"
                  value={parishId}
                  onChange={(event) => setParishId(event.target.value)}
                  disabled={loadingParishes || parishes.length === 0}
                >
                  {loadingParishes && <option>Loading parishes...</option>}
                  {!loadingParishes && parishes.length === 0 && (
                    <option value="">No parishes available</option>
                  )}
                  {parishes.map((parish) => (
                    <option key={parish.id} value={parish.id}>
                      {parish.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </div>
            </div>
            <div className="parish-detail">
              <span className="detail-label">ARCHDIOCESE</span>
              <strong>{stats.parish_name || "Tororo Archdiocese"}</strong>
            </div>
            <button
              className="refresh-button"
              onClick={() => {
                setParishId((current) => current);
                window.location.reload();
              }}
              title="Refresh dashboard"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </section>

          <section className="section-heading">
            <div>
              <h2>Parish overview</h2>
              <p>Current sacramental records and registered members</p>
            </div>
            {loadingStats && (
              <span className="loading-label">
                <LoaderCircle size={15} className="spin" /> Updating...
              </span>
            )}
          </section>

          <section className="stats-grid">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article className="stat-card" key={card.label}>
                  <div className={`stat-icon ${card.tone}`}>
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <p className="stat-label">{card.label}</p>
                  <div className="stat-bottom">
                    <strong>
                      {loadingStats ? "—" : (card.value ?? 0).toLocaleString()}
                    </strong>
                    <span className="stat-caption">Total records</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="directory-section">
            <div className="section-heading directory-heading">
              <div>
                <h2>People directory</h2>
                <p>Search by name or registration number</p>
              </div>
              <span className="result-count">
                {people.length} {people.length === 1 ? "person" : "people"}
              </span>
            </div>

            <div className="search-bar">
              <Search size={20} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Enter a name or registration number..."
                aria-label="Search people by name or registration number"
              />
              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PERSON</th>
                    <th>REGISTRATION NO.</th>
                    <th>HOME PARISH</th>
                    <th>DATE OF BIRTH</th>
                    <th>PROFILE</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPeople ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <LoaderCircle className="spin" size={20} />
                        Loading people...
                      </td>
                    </tr>
                  ) : people.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <Users size={25} />
                        <strong>No people found</strong>
                        <span>
                          Try another search or register a person in Django
                          Admin.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    people.map((person) => (
                      <tr key={person.id}>
                        <td>
                          <div className="person-cell">
                            <div className="person-avatar">
                              <UserRound size={18} />
                            </div>
                            <strong>
                              {person.christian_name} {person.surname}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span className="registration-number">
                            {person.registration_number}
                          </span>
                        </td>
                        <td>{person.home_parish_name || "—"}</td>
                        <td>{formatDate(person.date_of_birth)}</td>
                        <td>
                          <button
                            className="view-button"
                            onClick={() => openPerson(person)}
                          >
                            View history
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Records are loaded from the database.</span>
              <span>{people.length} results</span>
            </div>
          </section>

          <footer className="page-footer">
            <span>Tororo Archdiocese · Sacramental Records Management</span>
            <span>Faith · Community · Record</span>
          </footer>
        </div>
      </main>

      {selectedPerson && (
        <div className="modal-backdrop" onClick={closePerson}>
          <section
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Person sacramental history"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">PERSON PROFILE</p>
                <h2>
                  {selectedPerson.christian_name} {selectedPerson.surname}
                </h2>
                <span className="registration-number">
                  {selectedPerson.registration_number}
                </span>
              </div>
              <button
                className="icon-button close-modal"
                onClick={closePerson}
                aria-label="Close profile"
              >
                <X size={22} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="modal-loading">
                <LoaderCircle size={25} className="spin" />
                Loading sacramental history...
              </div>
            ) : history ? (
              <div className="history-content">
                <div className="profile-facts">
                  <div>
                    <span>Home parish</span>
                    <strong>
                      {history.person.home_parish_name || "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Date of birth</span>
                    <strong>{formatDate(history.person.date_of_birth)}</strong>
                  </div>
                  <div>
                    <span>Father</span>
                    <strong>{history.person.father_name || "Not recorded"}</strong>
                  </div>
                  <div>
                    <span>Mother</span>
                    <strong>{history.person.mother_name || "Not recorded"}</strong>
                  </div>
                </div>

                <h3>Sacramental history</h3>
                {[
                  {
                    title: "Baptism",
                    records: history.baptisms,
                    dateKey: "date_of_baptism",
                    numberKey: "registration_number",
                  },
                  {
                    title: "First Holy Communion",
                    records: history.first_holy_communions,
                    dateKey: "date_received",
                    numberKey: "registration_number",
                  },
                  {
                    title: "Confirmation",
                    records: history.confirmations,
                    dateKey: "date_received",
                    numberKey: "registration_number",
                  },
                  {
                    title: "Matrimony",
                    records: [
                      ...(history.matrimonies || []),
                      ...(history.spouse_matrimonies || []),
                    ],
                    dateKey: "date_of_marriage",
                    numberKey: "registration_number",
                  },
                ].map((group) => (
                  <div className="history-group" key={group.title}>
                    <div className="history-group-heading">
                      <CalendarDays size={17} />
                      <strong>{group.title}</strong>
                      <span>{group.records?.length || 0}</span>
                    </div>
                    {!group.records?.length ? (
                      <p className="no-record">No record entered</p>
                    ) : (
                      group.records.map((record, index) => (
                        <div
                          className="history-record"
                          key={`${group.title}-${record.id ?? index}`}
                        >
                          <div>
                            <strong>
                              {formatDate(record[group.dateKey])}
                            </strong>
                            <span>{record.parish_name || "Parish not listed"}</span>
                          </div>
                          {record.registration_number && (
                            <span className="registration-number">
                              {record.registration_number}
                            </span>
                          )}
                          {group.title === "Matrimony" && (
                            <span>
                              Spouse:{" "}
                              {record.spouse_profile
                                ? `${record.spouse_profile.christian_name} ${record.spouse_profile.surname}`
                                : record.spouse_name || "Not recorded"}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-record">
                History could not be loaded. Close this window and try again.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

