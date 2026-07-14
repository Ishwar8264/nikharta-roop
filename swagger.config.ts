import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api/v1",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Nikharta Roop Salon API",
        version: "1.0.0",
        description: "Complete API documentation for the salon booking system",
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local Development Server",
        },
      ],
      // 👇 TAGS ADD KARO (Isse groups bante hain screenshot jaisa)
      tags: [
        { name: "Auth", description: "Authentication & User sessions" },
        { name: "Admin", description: "Admin-only management endpoints" },
        { name: "Bookings", description: "Appointment booking and slots" },
        { name: "Services", description: "Salon services & categories" },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [], // Global security
    },
  });
  return spec;
};
