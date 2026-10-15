import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client";

describe.skipIf(process.env.RUN_STAFF_DATABASE_TESTS !== "1")("staff invitation database flow", () => {
  let prisma: PrismaClient;
  let repository: typeof import("../src/server/modules/salon/salon.repository");
  let staffRepository: typeof import("../src/server/modules/staff/staff.repository");
  let otpService: typeof import("../src/server/modules/otp/otp.service");
  let hashOtp: typeof import("../src/server/auth/otp").hashOtp;
  let ownerId: string;
  let salonId: string;
  let email: string;
  let suffix: string;
  beforeAll(async () => {
    await import("dotenv/config");
    if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1", "::1"].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error("Staff integration tests require a local database");
    prisma = (await import("../src/lib/prisma")).prisma;
    repository = await import("../src/server/modules/salon/salon.repository");
    staffRepository = await import("../src/server/modules/staff/staff.repository");
    otpService = await import("../src/server/modules/otp/otp.service");
    hashOtp = (await import("../src/server/auth/otp")).hashOtp;
  });
  beforeEach(async () => {
    suffix = randomUUID(); email = `staff-fixture-${suffix}@example.invalid`;
    ownerId = (await prisma.user.create({ data: { email: `owner-fixture-${suffix}@example.invalid`, emailVerified: true } })).id;
    salonId = (await prisma.salon.create({ data: { name: "Staff test fixture", slug: `staff-fixture-${suffix}`, address: "Synthetic", city: "Mumbai", state: "Maharashtra", zip: "400001", lat: 19, lng: 72, members: { create: { userId: ownerId, role: "OWNER" } } } })).id;
  });
  afterEach(async () => {
    const users = await prisma.user.findMany({ where: { OR: [{ email }, { id: ownerId }] }, select: { id: true } });
    const ids = users.map((user) => user.id);
    await prisma.staffServiceSkill.deleteMany({ where: { staffId: { in: ids } } });
    await prisma.service.deleteMany({ where: { salonId } });
    await prisma.otp.deleteMany({ where: { userId: { in: ids } } });
    await prisma.salonMember.deleteMany({ where: { salonId } });
    await prisma.salon.delete({ where: { id: salonId } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  });
  afterAll(async () => { if (prisma) await prisma.$disconnect(); });
  function add() { return repository.addSalonMember({ actorId: ownerId, salonId, email, name: "Salon stylist", avatar: "https://example.invalid/photo.png", bannerImage: "https://example.invalid/original-banner.png", title: "Hair stylist", description: "Salon-specific biography", role: "STAFF" }); }
  it("creates a pending profile, then activates only after recipient OTP and password setup", async () => {
    const member = await add();
    expect(member.title).toBe("Hair stylist");
    expect(member.bannerImage).toBe("https://example.invalid/original-banner.png");
    expect(member.user.emailVerified).toBe(false);
    expect(await repository.findSalonForViewer({ salonId, userId: member.userId })).toBeNull();
    expect(await staffRepository.findCallerMembership(salonId, member.userId)).toBeNull();
    const service = await prisma.service.create({ data: { salonId, name: "Test haircut", slug: "test-haircut", price: 100, duration: 30 } });
    await prisma.staffServiceSkill.create({ data: { staffId: member.userId, serviceId: service.id } });
    expect(await staffRepository.listStaffForService(salonId, service.id)).toEqual([]);
    await prisma.otp.create({ data: { userId: member.userId, channel: "EMAIL", purpose: "EMAIL_VERIFICATION", codeHash: await hashOtp("123456"), expiresAt: new Date(Date.now() + 60000) } });
    await expect(otpService.verifyOtpCode({ email, code: "123456" })).rejects.toThrow("Choose a password");
    await otpService.verifyOtpCode({ email, code: "123456", newPassword: "RecipientPassword123" });
    expect(await repository.findSalonForViewer({ salonId, userId: member.userId })).toMatchObject({ viewerRole: "STAFF" });
    expect(await staffRepository.listStaffForService(salonId, service.id)).toHaveLength(1);
    await expect(otpService.verifyOtpCode({ email, code: "123456", newPassword: "DifferentPassword123" })).rejects.toThrow("Invalid or expired code");
  });
  it("links existing accounts without altering their personal profile or credentials", async () => {
    const user = await prisma.user.create({ data: { email, name: "Personal name", avatar: "https://example.invalid/personal.png", bio: "Personal bio", password: "existing-password-hash", emailVerified: true } });
    const member = await add();
    expect(member.userId).toBe(user.id);
    expect(member.name).toBe("Salon stylist");
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ name: "Personal name", bio: "Personal bio", avatar: "https://example.invalid/personal.png", password: "existing-password-hash", emailVerified: true });
  });
  it("rejects deleted accounts without reviving them", async () => {
    await prisma.user.create({ data: { email, deletedAt: new Date() } });
    await expect(add()).rejects.toThrow("eligible account");
    expect(await prisma.salonMember.count({ where: { salonId } })).toBe(1);
  });
  it("allows only one membership under concurrent additions", async () => {
    const results = await Promise.allSettled([add(), add()]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
    expect(await prisma.salonMember.count({ where: { salonId } })).toBe(2);
  });
  it("allows self profile edits without changing personal identity or the URL on a name edit", async () => {
    const member = await add();
    await prisma.user.update({ where: { id: member.userId }, data: { emailVerified: true } });
    expect(member.slug).toBe("salon-stylist");
    const updated = await repository.updateOwnSalonMember(member.userId, salonId, member.id, { name: "New display name", title: null, bannerImage: "https://example.invalid/banner.png" });
    expect(updated).toMatchObject({ name: "New display name", slug: "salon-stylist", title: null, role: "STAFF", bannerImage: "https://example.invalid/banner.png" });
    expect(await repository.findSalonMemberBySlug(salonId, "salon-stylist")).toEqual({ id: member.id });
    expect((await repository.updateOwnSalonMember(member.userId, salonId, member.id, { bannerImage: null })).bannerImage).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: member.userId } })).toMatchObject({ name: "Salon stylist" });
    await expect(repository.updateOwnSalonMember(ownerId, salonId, member.id, { name: "Unauthorized" })).rejects.toMatchObject({ code: "P2025" });
    await expect(repository.updateOwnSalonMember(member.userId, "missing-salon", member.id, { name: "Unauthorized" })).rejects.toMatchObject({ code: "P2025" });
  });
  it("reserves unique slugs and rejects duplicate custom slugs", async () => {
    const owner = await prisma.salonMember.findUniqueOrThrow({ where: { userId_salonId: { userId: ownerId, salonId } } });
    await prisma.salonMember.update({ where: { id: owner.id }, data: { slug: "salon-stylist" } });
    const first = await add();
    expect(first.slug).toBe("salon-stylist-2");
    await prisma.user.update({ where: { id: first.userId }, data: { emailVerified: true } });
    await expect(repository.updateOwnSalonMember(first.userId, salonId, first.id, { slug: "salon-stylist" })).rejects.toMatchObject({ code: "P2002" });
    expect((await repository.updateOwnSalonMember(first.userId, salonId, first.id, { slug: "my-custom-name" })).slug).toBe("my-custom-name");
  });

  it("keeps an explicit create slug and rolls back a conflicting slug", async () => {
    const owner = await prisma.salonMember.findUniqueOrThrow({ where: { userId_salonId: { userId: ownerId, salonId } } });
    await prisma.salonMember.update({ where: { id: owner.id }, data: { slug: "reserved-name" } });
    await expect(repository.addSalonMember({ actorId: ownerId, salonId, email, name: "Stylist", slug: "reserved-name", role: "STAFF" })).rejects.toMatchObject({ code: "P2002" });
    expect(await prisma.user.count({ where: { email } })).toBe(0);
    const member = await repository.addSalonMember({ actorId: ownerId, salonId, email, name: "Stylist", slug: "chosen-profile", role: "STAFF" });
    expect(member.slug).toBe("chosen-profile");
  });

});
