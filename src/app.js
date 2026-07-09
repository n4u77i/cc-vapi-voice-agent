const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { env } = require("./config/env");
const { requestLogger } = require("./middleware/requestLogger");
const { rateLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health.routes");
const docsRoutes = require("./routes/docs.routes");
const vapiRoutes = require("./routes/vapi.routes");
const callsRoutes = require("./routes/calls.routes");
const intakesRoutes = require("./routes/intakes.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.use("/", healthRoutes);
app.use("/docs", docsRoutes);
app.use("/api/v1/vapi", vapiRoutes);
app.use("/api/v1/calls", callsRoutes);
app.use("/api/v1/intakes", intakesRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist."
  });
});

app.use(errorHandler);

module.exports = { app };
