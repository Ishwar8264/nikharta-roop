import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client";
import {
  approvalEvidenceSchema,
  submitVerificationSchema,
} from "../src/server/modules/verification/verification.schema";

// Opt-in integration checks create and remove isolated fixtures in a local database only.
describe.skipIf(process.env.RUN_VERIFICATION_DATABASE_TESTS !== "1")(
  "verification database transactions",
  () => {
    let prisma: PrismaClient;
    let repository: typeof import("../src/server/modules/verification/verification.repository");
    let salonRepository: typeof import("../src/server/modules/salon/salon.repository");
    let ownerId: string;
    let reviewerId: string;
    let salonId: string;
    let documents: ReturnType<
      typeof submitVerificationSchema.parse
    >["documents"];
    const evidence = approvalEvidenceSchema.parse({
      identityVerified: true,
      businessVerified: true,
      authorityVerified: true,
      addressMatched: true,
      premisesVerified: true,
      identitySource: "Income Tax",
      identityReference: "SYNTHETIC-LOOKUP",
      businessAuthority: "Synthetic authority",
      businessReference: "SYNTHETIC-REFERENCE",
      notes:
        "Synthetic database transaction fixture only; no real business or identity has been verified.",
    });

    beforeAll(async () => {
      await import("dotenv/config");
      if (
        !process.env.DATABASE_URL ||
        !["localhost", "127.0.0.1", "::1"].includes(
          new URL(process.env.DATABASE_URL).hostname,
        )
      )
        throw new Error("Integration tests require a local database");
      prisma = (await import("../src/lib/prisma")).prisma;
      repository = await import(
        "../src/server/modules/verification/verification.repository"
      );
      salonRepository = await import(
        "../src/server/modules/salon/salon.repository"
      );
    });
    beforeEach(async () => {
      const suffix = randomUUID();
      ownerId = (
        await prisma.user.create({
          data: { email: `verification-owner-${suffix}@example.invalid` },
        })
      ).id;
      reviewerId = (
        await prisma.user.create({
          data: {
            email: `verification-admin-${suffix}@example.invalid`,
            role: "SUPER_ADMIN",
          },
        })
      ).id;
      salonId = (
        await prisma.salon.create({
          data: {
            name: "Synthetic verification fixture",
            slug: `verification-fixture-${suffix}`,
            address: "Synthetic address",
            city: "Mumbai",
            state: "Maharashtra",
            zip: "400001",
            lat: 19,
            lng: 72,
            images: [],
            isActive: false,
            members: { create: { userId: ownerId, role: "OWNER" } },
            verification: { create: {} },
          },
        })
      ).id;
      const uploads = await Promise.all(
        ["PAN", "Shop license", "Salon photo 1", "Salon photo 2"].map(
          async (kind, index) => {
            const asset = await prisma.mediaAsset.create({
              data: {
                userId: ownerId,
                publicId: `synthetic/${suffix}/${index}`,
                url: "https://example.invalid/synthetic.png",
                folder: "synthetic",
                purpose: "VERIFICATION",
                attachedToType: "SALON_VERIFICATION",
                attachedToId: salonId,
                bytes: 100,
                format: "png",
                width: 1,
                height: 1,
              },
            });
            return { kind, mediaId: asset.id };
          },
        ),
      );
      documents = submitVerificationSchema.parse({
        documents: uploads,
      }).documents;
    });
    afterEach(async () => {
      if (salonId) {
        await prisma.salonVerificationReview.deleteMany({
          where: { verification: { salonId } },
        });
        await prisma.salonVerification.deleteMany({ where: { salonId } });
        await prisma.mediaAsset.deleteMany({
          where: { attachedToId: salonId },
        });
        await prisma.salonMember.deleteMany({ where: { salonId } });
        await prisma.salon.deleteMany({ where: { id: salonId } });
      }
      await prisma.user.deleteMany({
        where: { id: { in: [ownerId, reviewerId].filter(Boolean) } },
      });
    });
    afterAll(async () => {
      if (prisma) await prisma.$disconnect();
    });

    it("allows only one concurrent decision for a submission and writes one audit record", async () => {
      const submitted = await repository.submitVerification(
        salonId,
        ownerId,
        documents,
      );
      const decision = {
        salonId,
        reviewerId,
        status: "VERIFIED" as const,
        reason: null,
        expectedUpdatedAt: submitted.updatedAt.toISOString(),
        evidence,
      };
      const decisions = await Promise.allSettled([
        repository.applyVerificationDecision(decision),
        repository.applyVerificationDecision(decision),
      ]);
      expect(
        decisions.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        decisions.filter((result) => result.status === "rejected"),
      ).toHaveLength(1);
      expect(
        await prisma.salonVerificationReview.count({
          where: { verification: { salonId } },
        }),
      ).toBe(1);
      expect(
        (await prisma.salon.findUniqueOrThrow({ where: { id: salonId } }))
          .isActive,
      ).toBe(true);
      await salonRepository.updateSalonById(salonId, {
        address: "New synthetic address",
      });
      expect(
        (await prisma.salon.findUniqueOrThrow({ where: { id: salonId } }))
          .isActive,
      ).toBe(false);
      const reset = await prisma.salonVerification.findUniqueOrThrow({
        where: { salonId },
      });
      expect(reset.status).toBe("PENDING");
      expect(reset.submittedAt).toBeNull();
      expect(
        await prisma.salonVerificationReview.count({
          where: { verification: { salonId } },
        }),
      ).toBe(1);
    });
    it("rolls back an approval without evidence and keeps the salon hidden", async () => {
      const submitted = await repository.submitVerification(
        salonId,
        ownerId,
        documents,
      );
      await expect(
        repository.applyVerificationDecision({
          salonId,
          reviewerId,
          status: "VERIFIED",
          reason: null,
          expectedUpdatedAt: submitted.updatedAt.toISOString(),
        }),
      ).rejects.toThrow("evidence");
      expect(
        (await prisma.salon.findUniqueOrThrow({ where: { id: salonId } }))
          .isActive,
      ).toBe(false);
      expect(
        await prisma.salonVerificationReview.count({
          where: { verification: { salonId } },
        }),
      ).toBe(0);
      expect(
        (
          await prisma.salonVerification.findUniqueOrThrow({
            where: { salonId },
          })
        ).status,
      ).toBe("PENDING");
    });
  },
);
