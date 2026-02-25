import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function NearbyCardList({ places }) {
  return (
    <div style={{ marginTop: 10 }}>
      {places.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 12,
            marginBottom: 8,
            background: "white",
          }}
        >
          <b>{p.name}</b> <span style={{ color: "#6b7280" }}>({p.type})</span>
          {p.address && <div style={{ marginTop: 6 }}>{p.address}</div>}
          {p.phone && <div>Phone: {p.phone}</div>}
          <div style={{ marginTop: 6 }}>
            <a href={mapsLink(p.lat, p.lng)} target="_blank" rel="noreferrer">
              View on Maps
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [sites, setSites] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [nearby, setNearby] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");

  // 🔵 Load sites & cities
  useEffect(() => {
    async function fetchData() {
      try {
        const [sitesRes, citiesRes] = await Promise.all([
          fetch(`${API_BASE}/api/sites`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/cities`, { cache: "no-store" }),
        ]);

        const sitesData = await sitesRes.json();
        const citiesData = await citiesRes.json();

        setSites(sitesData);
        setCities(citiesData);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 🔵 GPS
  function getLocation() {
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => setGeoError(err.message)
    );
  }

  // 🔵 Load nearby clinics
  async function loadNearby(lat, lng, radius = 3000) {
    setNearbyLoading(true);
    setNearbyError("");
    setNearby([]);

    try {
      const res = await fetch(
        `${API_BASE}/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load nearby");

      setNearby(data.places || []);
    } catch (err) {
      setNearbyError(err.message);
    } finally {
      setNearbyLoading(false);
    }
  }

  const filteredSites = useMemo(() => {
    const q = search.toLowerCase();
    return sites.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.province?.toLowerCase().includes(q)
    );
  }, [search, sites]);

  const filteredCities = useMemo(() => {
    const q = search.toLowerCase();
    return cities.filter((c) =>
      c.name?.toLowerCase().includes(q)
    );
  }, [search, cities]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Heritage Health Hub 🇿🇼</h1>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 20,
          borderRadius: 8,
        }}
      />

      {/* GPS Section */}
      <div style={{ marginBottom: 30 }}>
        <button onClick={getLocation}>Get My Location</button>
        {position && (
          <>
            <p>
              Lat: {position.lat} | Lng: {position.lng}
            </p>
            <button onClick={() => loadNearby(position.lat, position.lng)}>
              Find Clinics Near Me
            </button>
          </>
        )}
        {geoError && <p style={{ color: "red" }}>{geoError}</p>}
        {nearbyLoading && <p>Searching...</p>}
        {nearbyError && <p style={{ color: "red" }}>{nearbyError}</p>}
        {nearby.length > 0 && <NearbyCardList places={nearby} />}
      </div>

      {/* Sites */}
      <h2>Heritage Sites</h2>
      {filteredSites.map((site) => (
        <div
          key={site.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <h3>{site.name}</h3>
          <p>{site.description}</p>
          {site.location && (
            <button
              onClick={() =>
                loadNearby(site.location.lat, site.location.lng, 5000)
              }
            >
              Clinics near this site
            </button>
          )}
        </div>
      ))}

      {/* Cities */}
      <h2 style={{ marginTop: 40 }}>Cities</h2>
      {filteredCities.map((city) => (
        <div
          key={city.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <h3>{city.name}</h3>
          <ul>
            {city.tips?.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}