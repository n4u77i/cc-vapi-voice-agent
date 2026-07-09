const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CareCloud Voice Agent API",
      version: "1.0.0",
      description: "Operational backend API for an AI-powered healthcare intake voice agent."
    },
    servers: [
      {
        url: "/",
        description: "Current environment"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        },
        VapiSecret: {
          type: "apiKey",
          in: "header",
          name: "x-vapi-secret"
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});

module.exports = { swaggerSpec };
