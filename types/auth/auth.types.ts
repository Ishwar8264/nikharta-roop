import type { HttpStatus } from "@/lib/constants/http-status";

export type ApiJsonInput = {
  code: string;
  data?: unknown;
  message: string;
  status?: HttpStatus;
  success: boolean;
};
