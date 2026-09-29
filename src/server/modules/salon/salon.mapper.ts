import "server-only";

import type { PublicSalonDetail } from "./salon.types";

type SalonDetailRow = Omit<PublicSalonDetail, "services"> & {
  services: Array<
    Omit<PublicSalonDetail["services"][number], "price"> & {
      price: { toNumber(): number };
    }
  >;
};

/**
 * Converts Prisma-specific values in a salon detail row to its public shape.
 *
 * Why:
 * Service prices are Prisma Decimals. Returning plain numbers keeps Server
 * Component props and JSON API responses stable and serializable.
 */
export function toPublicSalonDetail(row: SalonDetailRow): PublicSalonDetail {
  return {
    ...row,
    services: row.services.map((service) => ({
      ...service,
      price: service.price.toNumber(),
    })),
  };
}
