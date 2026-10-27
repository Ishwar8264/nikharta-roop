import { ApiReference } from "@scalar/nextjs-api-reference";
import { API_BASE_PATH } from "@nikharta-roop/shared";

/** Standalone reference; request URLs follow the current localhost/preview/deployment origin. */
export const GET = ApiReference({
  pageTitle: "Nikharta Roop API Documentation",
  theme: "purple",
  cdn: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.0",
  url: `${API_BASE_PATH}/openapi`,
});
