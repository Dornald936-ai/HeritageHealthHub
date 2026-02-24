const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Heritage Health Hub API running" });
});

// Routes
app.use("/api/sites", require("./routes/sites"));
app.use("/api/cities", require("./routes/cities"));
app.use("/api/nearby", require("./routes/nearby"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));