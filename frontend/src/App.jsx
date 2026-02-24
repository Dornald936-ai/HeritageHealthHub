import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function TopBar({ search, setSearch }) {
  return (
    <header
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Heritage Health Hub 🇿🇼</h1>
          <p style={{ marginTop: 6, color: "#4b5563" }}>
            Heritage sites + city tips + nearby clinics/pharmacies.
          </p>
        </div>

        <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/">Home</Link>
        </nav>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search sites or cities..."
        style={{
          width: "100%",
          marginTop: 10,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #d1d5db",
          outline: "none",
        }}
      />
    </header>
  );
}

function NearbyCardList({ places }) {
  const card = {
    border: "1px solid #eee",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    background: "white",
  };

  return (
    <div style={{ marginTop: 10 }}>
      {places.map((p) => (
        <div key={p.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <b>{p.name}</b>
            <span style={{ color: "#6b7280" }}>{p.type}</span>
          </div>
          {p.address ? <div style={{ color: "#4b5563", marginTop: 6 }}>{p.address}</div> : null}
          {p.phone ? <div style={{ color: "#4b5563", marginTop: 6 }}>Phone: {p.phone}</div> : null}
          <div style={{ marginTop: 8 }}>
            <a href={mapsLink(p.lat, p.lng)} target="_blank" rel="noreferrer">
              View on Maps
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function Home({ sites, cities, search, setSearch, gpsBox }) {
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "white",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  };

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) =>
      ((s.name || "") + " " + (s.province || "") + " " + (s.description || ""))
        .toLowerCase()
        .includes(q)
    );
  }, [search, sites]);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [search, cities]);

  return (
    <>
      <TopBar search={search} setSearch={setSearch} />

      {gpsBox}

      <section style={{ marginBottom: 14 }}>
        <h2>Heritage Sites</h2>
        <div style={grid}>
          {filteredSites.map((s) => (
            <Link key={s.id} to={`/site/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={card}>
                {s.image ? (
                  <img
                    src={s.image}
                    alt={s.name}
                    style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                  />
                ) : null}
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>{s.name}</h3>
                <div style={{ color: "#6b7280" }}>{s.province ? `Province: ${s.province}` : ""}</div>
                <p style={{ color: "#374151" }}>{s.description}</p>
                <span style={{ color: "#2563eb" }}>Open details →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Cities Tips</h2>
        <div style={grid}>
          {filteredCities.map((c) => (
            <Link key={c.id} to={`/city/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={card}>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                  />
                ) : null}
                <h3 style={{ marginTop: 0 }}>{c.name}</h3>
                <ul>
                  {(c.tips || []).slice(0, 3).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <span style={{ color: "#2563eb" }}>Open tips →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function SiteDetails({ sites }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const site = sites.find((s) => s.id === id);

  const [box, setBox] = useState({ loading: false, error: "", places: [] });

  async function loadNearbyForSite(lat, lng, radius = 5000) {
    setBox({ loading: true, error: "", places: [] });
    try {
      const res = await fetch(`${API_BASE}/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load nearby places");
      setBox({ loading: false, error: "", places: data.places || [] });
    } catch (e) {
      setBox({ loading: false, error: e.message, places: [] });
    }
  }

  if (!site) {
    return (
      <div style={{ padding: 18 }}>
        <p>Site not found.</p>
        <button onClick={() => navigate("/")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 18, maxWidth: 1000, margin: "0 auto" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <div style={{ background: "white", padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
        {site.image ? (
          <img
            src={site.image}
            alt={site.name}
            style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
          />
        ) : null}

        <h2 style={{ marginTop: 0 }}>{site.name}</h2>
        {site.province ? <p style={{ color: "#6b7280" }}>Province: {site.province}</p> : null}
        <p>{site.description}</p>

        {site.location?.lat && site.location?.lng ? (
          <p>
            <a href={mapsLink(site.location.lat, site.location.lng)} target="_blank" rel="noreferrer">
              View site on Maps
            </a>
          </p>
        ) : null}

        {(site.healthTips || []).length > 0 ? (
          <>
            <b>Health Tips</b>
            <ul>
              {site.healthTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        ) : null}

        {(site.safetyTips || []).length > 0 ? (
          <>
            <b>Safety Tips</b>
            <ul>
              {site.safetyTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        ) : null}

        {(site.whatToCarry || []).length > 0 ? (
          <>
            <b>What to Carry</b>
            <ul>
              {site.whatToCarry.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        ) : null}

        {site.location?.lat && site.location?.lng ? (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => loadNearbyForSite(site.location.lat, site.location.lng, 5000)}
              style={{ padding: "10px 12px", borderRadius: 12 }}
            >
              Find clinics & pharmacies near this site (5km)
            </button>

            {box.loading && <p>Searching…</p>}
            {box.error && <p style={{ color: "crimson" }}>{box.error}</p>}
            {!box.loading && !box.error && box.places.length > 0 && <NearbyCardList places={box.places.slice(0, 12)} />}
          </div>
        ) : (
          <p style={{ color: "#6b7280" }}>No coordinates for this site yet.</p>
        )}
      </div>
    </div>
  );
}

function CityDetails({ cities }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const city = cities.find((c) => c.id === id);

  if (!city) {
    return (
      <div style={{ padding: 18 }}>
        <p>City not found.</p>
        <button onClick={() => navigate("/")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 18, maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <div style={{ background: "white", padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
        {city.image ? (
          <img
            src={city.image}
            alt={city.name}
            style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
          />
        ) : null}
        <h2 style={{ marginTop: 0 }}>{city.name}</h2>
        <b>Tips</b>
        <ul>
          {(city.tips || []).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  const [sites, setSites] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search shared on Home
  const [search, setSearch] = useState("");

  // GPS (shown on Home)
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [nearby, setNearby] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/sites`),
          fetch(`${API_BASE}/api/cities`),
        ]);

        const sData = await sRes.json();
        const cData = await cRes.json();

        setSites(sData);
        setCities(cData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported on this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message || "Permission denied / error getting location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function loadNearby(lat, lng, radius = 3000) {
    setNearbyError("");
    setNearbyLoading(true);
    setNearby([]);
    try {
      const res = await fetch(`${API_BASE}/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load nearby places");
      setNearby(data.places || []);
    } catch (e) {
      setNearbyError(e.message);
    } finally {
      setNearbyLoading(false);
    }
  }

  const gpsBox = (
    <section
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        marginBottom: 14,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Your Location</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={getLocation} style={{ padding: "10px 12px", borderRadius: 12 }}>
          Get My GPS Location
        </button>

        <button
          disabled={!position}
          onClick={() => loadNearby(position.lat, position.lng, 3000)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            cursor: position ? "pointer" : "not-allowed",
          }}
        >
          Find clinics & pharmacies near me (3km)
        </button>
      </div>

      {geoError && <p style={{ color: "crimson" }}>{geoError}</p>}
      {position && (
        <p style={{ color: "#374151" }}>
          <b>Lat:</b> {position.lat} | <b>Lng:</b> {position.lng}{" "}
          <a href={mapsLink(position.lat, position.lng)} target="_blank" rel="noreferrer">
            Open on Maps
          </a>
        </p>
      )}

      {nearbyLoading && <p>Searching nearby places…</p>}
      {nearbyError && <p style={{ color: "crimson" }}>{nearbyError}</p>}
      {!nearbyLoading && !nearbyError && nearby.length > 0 && (
        <>
          <h3 style={{ marginBottom: 8 }}>Nearby results</h3>
          <NearbyCardList places={nearby.slice(0, 12)} />
        </>
      )}
    </section>
  );

  if (loading) return <div style={{ padding: 18 }}>Loading…</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={<Home sites={sites} cities={cities} search={search} setSearch={setSearch} gpsBox={gpsBox} />}
      />
      <Route path="/site/:id" element={<SiteDetails sites={sites} />} />
      <Route path="/city/:id" element={<CityDetails cities={cities} />} />
    </Routes>
  );
}
