import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  session: vi.fn(),
  salon: vi.fn(),
  verification: vi.fn(),
  provider: vi.fn(),
  save: vi.fn(),
}));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mock.session }));
vi.mock("../src/server/modules/salon/salon.service", () => ({
  getSalonForServiceManagement: mock.salon,
}));
vi.mock("../src/server/modules/verification/verification.repository", () => ({
  findVerificationBySalonId: mock.verification,
}));
vi.mock("../src/server/modules/media/media.repository", () => ({
  createMediaAsset: mock.save,
}));
vi.mock("../src/lib/cloudinary", async (original) => ({
  ...(await original<typeof import("../src/lib/cloudinary")>()),
  getAuthenticatedCloudinaryImage: mock.provider,
}));
import {
  registerVerificationUpload,
  signVerificationUpload,
} from "../src/features/verification/upload-actions";
const publicId =
  "nikharta-roop/verification/owner/salon/11111111-1111-4111-8111-111111111111";
const providerAsset = {
  public_id: publicId,
  secure_url: "https://res.cloudinary.com/example/image/authenticated/test.png",
  type: "authenticated",
  resource_type: "image",
  bytes: 1000,
  format: "png",
  width: 100,
  height: 100,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
  mock.session.mockResolvedValue({ id: "owner" });
  mock.salon.mockResolvedValue({ id: "salon", viewerRole: "OWNER" });
  mock.verification.mockResolvedValue({ status: "PENDING" });
  mock.provider.mockResolvedValue(providerAsset);
  mock.save.mockResolvedValue({ id: "1".repeat(48) });
});
afterEach(() => vi.unstubAllEnvs());
describe("private verification uploads", () => {
  it("signs a private, non-overwritable upload in the owner/salon namespace", async () => {
    const signature = await signVerificationUpload("salon-slug");
    expect(signature).toMatchObject({
      type: "authenticated",
      overwrite: false,
      allowedFormats: "jpg,png,webp,avif",
    });
    expect(
      signature.publicId.startsWith("nikharta-roop/verification/owner/salon/"),
    ).toBe(true);
  });
  it("registers provider-confirmed metadata and returns an application-protected URL", async () => {
    const asset = await registerVerificationUpload("salon-slug", publicId);
    expect(mock.save).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining({
        purpose: "VERIFICATION",
        attachedToId: "salon",
        bytes: 1000,
      }),
    );
    expect(asset.mediaId).toBe("1".repeat(48));
    expect(asset.url).toBe(
      `/api/v1/salons/salon/verification/documents/${"1".repeat(48)}`,
    );
    expect(asset.url).not.toContain("cloudinary");
  });
  it("rejects another owner's namespace before querying the provider", async () => {
    await expect(
      registerVerificationUpload(
        "salon-slug",
        publicId.replace("/owner/", "/other/"),
      ),
    ).rejects.toThrow("Invalid");
    expect(mock.provider).not.toHaveBeenCalled();
    expect(mock.save).not.toHaveBeenCalled();
  });
  it.each([
    { type: "upload" },
    { bytes: 6 * 1024 * 1024 },
    { format: "svg" },
    { width: 0 },
    { public_id: "wrong" },
    { resource_type: "raw" },
  ])("rejects invalid provider metadata %j", async (override) => {
    mock.provider.mockResolvedValue({ ...providerAsset, ...override });
    await expect(
      registerVerificationUpload("salon-slug", publicId),
    ).rejects.toThrow("valid");
    expect(mock.save).not.toHaveBeenCalled();
  });
  it("requires an authenticated owner and blocks edits to verified/suspended salons", async () => {
    mock.session.mockResolvedValueOnce(null);
    await expect(signVerificationUpload("salon-slug")).rejects.toThrow(
      "Authentication",
    );
    mock.salon.mockResolvedValueOnce({ id: "salon", viewerRole: "MANAGER" });
    await expect(signVerificationUpload("salon-slug")).rejects.toThrow("owner");
    for (const status of ["VERIFIED", "SUSPENDED"]) {
      mock.verification.mockResolvedValueOnce({ status });
      await expect(signVerificationUpload("salon-slug")).rejects.toThrow(
        "cannot be changed",
      );
    }
  });
});
