import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approvalEvidenceSchema,
  reviewVerificationSchema,
  submitVerificationSchema,
} from "../src/server/modules/verification/verification.schema";
import {
  applyVerificationDecision,
  submitVerification,
} from "../src/server/modules/verification/verification.repository";

const mock = vi.hoisted(() => ({
  lock: vi.fn(),
  salon: vi.fn(),
  verification: vi.fn(),
  assets: vi.fn(),
  count: vi.fn(),
  publish: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    $transaction: (callback: (transaction: unknown) => unknown) =>
      callback({
        $queryRaw: mock.lock,
        salon: { findFirst: mock.salon, update: mock.publish },
        salonVerification: {
          findUnique: mock.verification,
          update: mock.update,
          upsert: mock.upsert,
        },
        salonVerificationReview: { create: mock.audit },
        mediaAsset: { findMany: mock.assets, count: mock.count },
      }),
  },
}));

const documents = ["PAN", "Shop license", "Salon photo 1", "Salon photo 2"].map(
  (kind, index) => ({ kind, mediaId: String(index + 1).repeat(48) }),
);
const parsedDocuments = submitVerificationSchema.parse({ documents }).documents;
const version = "2026-10-10T10:00:00.000Z";
const evidence = approvalEvidenceSchema.parse({
  identityVerified: true,
  businessVerified: true,
  authorityVerified: true,
  addressMatched: true,
  premisesVerified: true,
  identitySource: "Income Tax",
  identityReference: "LOOKUP-123",
  businessAuthority: "Municipal authority",
  businessReference: "CERTIFICATE-123",
  notes:
    "Official identity and business records matched the applicant and salon address; premises photos checked.",
});
const decision = {
  salonId: "salon",
  reviewerId: "admin",
  status: "VERIFIED" as const,
  reason: null,
  expectedUpdatedAt: version,
  evidence,
};

beforeEach(() => {
  vi.clearAllMocks();
  mock.salon.mockResolvedValue({ slug: "salon", members: [] });
  mock.verification.mockResolvedValue({
    id: "verification",
    updatedAt: new Date(version),
    submittedAt: new Date(version),
    status: "PENDING",
    documents,
  });
  mock.assets.mockResolvedValue(documents);
  mock.count.mockResolvedValue(4);
  mock.update.mockResolvedValue({ status: "VERIFIED" });
});

describe("verification proof policy", () => {
  it("requires all four proof types and rejects arbitrary URLs, unknown kinds and duplicate media", () => {
    expect(submitVerificationSchema.safeParse({ documents }).success).toBe(
      true,
    );
    expect(
      submitVerificationSchema.safeParse({ documents: documents.slice(1) })
        .success,
    ).toBe(false);
    expect(
      submitVerificationSchema.safeParse({
        documents: documents.map((doc) => ({
          kind: doc.kind,
          url: "https://evil.example/fake.jpg",
        })),
      }).success,
    ).toBe(false);
    expect(
      submitVerificationSchema.safeParse({
        documents: documents.map((doc) => ({ ...doc, kind: "Anything" })),
      }).success,
    ).toBe(false);
    expect(
      submitVerificationSchema.safeParse({
        documents: documents.map((doc) => ({
          ...doc,
          mediaId: documents[0].mediaId,
        })),
      }).success,
    ).toBe(false);
  });
  it("requires intentional approval evidence, while rejection needs a reason and version", () => {
    expect(
      reviewVerificationSchema.safeParse({
        status: "VERIFIED",
        expectedUpdatedAt: version,
      }).success,
    ).toBe(false);
    expect(
      reviewVerificationSchema.safeParse({
        status: "VERIFIED",
        expectedUpdatedAt: version,
        evidence: { ...evidence, identityVerified: false },
      }).success,
    ).toBe(false);
    expect(
      reviewVerificationSchema.safeParse({
        status: "VERIFIED",
        expectedUpdatedAt: version,
        evidence,
      }).success,
    ).toBe(true);
    expect(
      reviewVerificationSchema.safeParse({
        status: "REJECTED",
        expectedUpdatedAt: version,
        reason: "Upload clear private proofs",
      }).success,
    ).toBe(true);
    expect(
      reviewVerificationSchema.safeParse({
        status: "REJECTED",
        reason: "Bad files",
      }).success,
    ).toBe(false);
  });
});

describe("transactional publication gate", () => {
  it("locks the salon and records the exact reviewed snapshot before publication", async () => {
    await applyVerificationDecision(decision);
    expect(mock.lock).toHaveBeenCalledOnce();
    expect(mock.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reviewerId: "admin",
        evidence,
        submission: documents,
      }),
    });
    expect(mock.publish).toHaveBeenCalledWith({
      where: { id: "salon" },
      data: { isActive: true },
    });
    expect(mock.audit.mock.invocationCallOrder[0]).toBeLessThan(
      mock.publish.mock.invocationCallOrder[0],
    );
  });
  it.each(["VERIFIED", "REJECTED", "SUSPENDED"])(
    "cannot approve a %s submission",
    async (status) => {
      mock.verification.mockResolvedValue({
        status,
        updatedAt: new Date(version),
        submittedAt: new Date(version),
        documents,
      });
      await expect(applyVerificationDecision(decision)).rejects.toThrow();
      expect(mock.publish).not.toHaveBeenCalled();
    },
  );
  it("blocks stale review, self-review, missing proofs and missing private assets", async () => {
    await expect(
      applyVerificationDecision({
        ...decision,
        expectedUpdatedAt: "2026-10-09T10:00:00.000Z",
      }),
    ).rejects.toThrow("changed");
    mock.salon.mockResolvedValueOnce({ members: [{ role: "OWNER" }] });
    await expect(applyVerificationDecision(decision)).rejects.toThrow(
      "own salon",
    );
    mock.verification.mockResolvedValueOnce({
      status: "PENDING",
      updatedAt: new Date(version),
      submittedAt: new Date(version),
      documents: [{ kind: "PAN", url: "https://fake.example/image.jpg" }],
    });
    await expect(applyVerificationDecision(decision)).rejects.toThrow("legacy");
    mock.count.mockResolvedValueOnce(3);
    await expect(applyVerificationDecision(decision)).rejects.toThrow(
      "missing",
    );
    expect(mock.publish).not.toHaveBeenCalled();
    expect(mock.audit).not.toHaveBeenCalled();
  });
  it("will not approve even through a repository call with incomplete evidence", async () => {
    await expect(
      applyVerificationDecision({ ...decision, evidence: undefined }),
    ).rejects.toThrow("evidence");
    expect(mock.publish).not.toHaveBeenCalled();
  });
  it("scopes submission assets to the current owner, salon and private purpose", async () => {
    await submitVerification("salon", "owner", parsedDocuments);
    expect(mock.assets).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "owner",
        purpose: "VERIFICATION",
        attachedToId: "salon",
        deletedAt: null,
      }),
    });
    expect(mock.publish).toHaveBeenCalledWith({
      where: { id: "salon" },
      data: { isActive: false },
    });
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          documents: expect.arrayContaining([
            expect.objectContaining({
              mediaId: documents[0].mediaId,
              url: expect.stringContaining("/verification/documents/"),
            }),
          ]),
        }),
      }),
    );
  });
  it("rejects another owner's or another salon's files and does not overwrite verification", async () => {
    mock.assets.mockResolvedValueOnce([]);
    await expect(
      submitVerification("salon", "owner", parsedDocuments),
    ).rejects.toThrow("belonging");
    expect(mock.upsert).not.toHaveBeenCalled();
    expect(mock.publish).not.toHaveBeenCalled();
  });
});
