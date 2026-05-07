import type {
  CreateRevenueSnapshotInput,
  UpdateRevenueSnapshotInput,
} from "@/schema/revenue-snapshots/schema.revenue-snapshot";

/**
 * Converts create input into Prisma-ready revenue snapshot data.
 */
export function createRevenueSnapshotData(input: CreateRevenueSnapshotInput) {
  return {
    ...input,
    date: new Date(`${input.date}T00:00:00.000Z`),
  };
}

/**
 * Converts update input into Prisma-ready revenue snapshot data.
 */
export function updateRevenueSnapshotData(input: UpdateRevenueSnapshotInput) {
  return input;
}
