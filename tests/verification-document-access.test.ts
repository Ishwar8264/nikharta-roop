import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  salon: vi.fn(),
  resolve: vi.fn(),
  asset: vi.fn(),
  download: vi.fn(),
}));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mock.auth }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({
  findSalonForViewer: mock.salon,
}));
vi.mock("../src/server/modules/service/service.repository", () => ({
  resolveSalonId: mock.resolve,
}));
vi.mock("../src/server/modules/media/media.repository", () => ({
  findMediaAssetById: mock.asset,
}));
vi.mock("../src/lib/cloudinary", () => ({
  privateVerificationDownload: mock.download,
}));
import { GET } from "../src/app/api/v1/salons/[salonRef]/verification/documents/[mediaId]/route";
import { SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
const request = () =>
  GET(new Request("http://localhost/api/documents"), {
    params: Promise.resolve({ salonRef: "salon", mediaId: "1".repeat(48) }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mock.auth.mockResolvedValue({ sub: "owner", role: "USER" });
  mock.salon.mockResolvedValue({ viewerRole: "OWNER" });
  mock.resolve.mockResolvedValue("salon-id");
  mock.asset.mockResolvedValue({
    purpose: "VERIFICATION",
    attachedToId: "salon-id",
    attachedToType: "SALON_VERIFICATION",
    publicId: "private-proof",
  });
  mock.download.mockReturnValue("https://api.cloudinary.com/private-download");
});
describe("private document delivery", () => {
  it("requires login and salon management access before generating a link", async () => {
    mock.auth.mockResolvedValueOnce(null);
    expect((await request()).status).toBe(401);
    mock.salon.mockRejectedValueOnce(new SalonRoleInsufficientError());
    expect((await request()).status).toBe(404);
    expect(mock.download).not.toHaveBeenCalled();
  });
  it("rejects cross-salon and public-gallery documents", async () => {
    mock.asset.mockResolvedValueOnce({
      purpose: "VERIFICATION",
      attachedToId: "different-salon",
    });
    expect((await request()).status).toBe(404);
    mock.asset.mockResolvedValueOnce({
      purpose: "GENERAL",
      attachedToId: "salon-id",
    });
    expect((await request()).status).toBe(404);
    expect(mock.download).not.toHaveBeenCalled();
  });
  it("allows an authorised viewer with no-store delivery headers", async () => {
    const response = await request();
    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("allows super admins to inspect proofs without salon membership", async () => {
    mock.auth.mockResolvedValueOnce({ sub: "admin", role: "SUPER_ADMIN" });
    expect((await request()).status).toBe(302);
    expect(mock.salon).not.toHaveBeenCalled();
  });
});
