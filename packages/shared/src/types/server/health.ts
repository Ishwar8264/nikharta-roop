/** Successful health-check response returned by the API. */
export interface HealthStatus {
  status: "ok";
  database: "connected";
  timestamp: string;
}
