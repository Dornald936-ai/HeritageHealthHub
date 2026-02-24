const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

function readCities() {
  const filePath = path.join(__dirname, "..", "data", "cities.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

router.get("/", (req, res) => {
  res.json(readCities());
});

router.get("/:id", (req, res) => {
  const cities = readCities();
  const city = cities.find((c) => c.id === req.params.id);
  if (!city) return res.status(404).json({ error: "City not found" });
  res.json(city);
});

module.exports = router;