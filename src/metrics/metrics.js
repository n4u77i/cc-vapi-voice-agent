const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const vapiWebhookEventsTotal = new client.Counter({
  name: "vapi_webhook_events_total",
  help: "Total Vapi webhook events",
  labelNames: ["event_type"]
});

const patientIntakesCreatedTotal = new client.Counter({
  name: "patient_intakes_created_total",
  help: "Total patient intakes created"
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(vapiWebhookEventsTotal);
register.registerMetric(patientIntakesCreatedTotal);

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  vapiWebhookEventsTotal,
  patientIntakesCreatedTotal
};
