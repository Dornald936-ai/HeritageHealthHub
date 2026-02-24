const express = require("express");
const router = express.Router();

const fetchFn = global.fetch || require("node-fetch");

// GET /api/nearby?lat=-17.83&lng=31.05&radius=3000
router.get("/", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 3000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "lat and lng are required numbers" });
    }

    // Overpass query: find hospitals, clinics, pharmacies around the point
    const query = `
      [out:json];
      (
        node(around:${radius},${lat},${lng})["amenity"="hospital"];
        node(around:${radius},${lat},${lng})["amenity"="clinic"];
        node(around:${radius},${lat},${lng})["amenity"="doctors"];
        node(around:${radius},${lat},${lng})["amenity"="pharmacy"];
      );
      out center tags;
    `;

    const overpassUrl = "https://overpass-api.de/api/interpreter";

    const response = await fetchFn(overpassUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Overpass API error", status: response.status });
    }

    const data = await response.json();

    const results = (data.elements || []).map((el) => {
      const tags = el.tags || {};
      return {
        id: el.id,
        type: tags.amenity || "unknown",
        name: tags.name || "(Unnamed)",
        lat: el.lat,
        lng: el.lon,
        phone: tags.phone || tags["contact:phone"] || "",
        address: [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:suburb"],
          tags["addr:city"],
        ]
          .filter(Boolean)
          .join(", "),
      };
    });

    // Sort: named places first
    results.sort((a, b) => (a.name === "(Unnamed)") - (b.name === "(Unnamed)"));

    res.json({
      center: { lat, lng },
      radius,
      count: results.length,
      places: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error querying nearby places" });
  }
});

module.exports = router;