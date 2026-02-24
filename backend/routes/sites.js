const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

function readSites() {
  const filePath = path.join(__dirname, "..", "data", "sites.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

router.get("/", (req, res) => {
  res.json(readSites());
});

router.get("/:id", (req, res) => {
  const sites = readSites();
  const site = sites.find((s) => s.id === req.params.id);
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json(site);
});

module.exports = router;