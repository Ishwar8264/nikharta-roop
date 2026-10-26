import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

const databaseUrl = process.env.SCHEMA_TEST_DATABASE_URL;

// Explicitly opt in to a local database. Every table lives in an isolated schema;
// the test never loads the application's .env or uses its configured database.
test("custom auth upgrade and social schema invariants", { skip: !databaseUrl }, async (t) => {
  const url = new URL(databaseUrl!);
  const host = url.searchParams.get("host") ?? url.hostname;
  assert.ok(["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) || host.startsWith("/"), "Use an explicit local test database");
  const client = new Client({ connectionString: databaseUrl });
  const schema = `social_schema_${randomUUID().replaceAll("-", "")}`;
  await client.connect();

  async function fails(sql: string, values: unknown[], code: string) {
    await assert.rejects(client.query(sql, values), (error: unknown) =>
      typeof error === "object" && error !== null && "code" in error && error.code === code,
    );
  }

  async function createUser(name: string, role = "USER") {
    return (await client.query('INSERT INTO "User" (name, role, "updatedAt") VALUES ($1, $2, now()) RETURNING id', [name, role])).rows[0].id as string;
  }

  async function createConversation(a: string, b: string) {
    const [first, second] = [a, b].sort();
    await client.query("BEGIN");
    try {
      const id = (await client.query('INSERT INTO "Conversation" ("firstProfileId", "secondProfileId") VALUES ($1, $2) RETURNING id', [first, second])).rows[0].id as string;
      await client.query('INSERT INTO "ConversationParticipant" ("conversationId", "profileId") VALUES ($1, $2), ($1, $3)', [id, first, second]);
      await client.query("COMMIT");
      return id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  async function message(conversation: string, profile: string, user: string, key: string, body: string | null = "Hello") {
    return (await client.query('INSERT INTO "ChatMessage" ("conversationId", "senderProfileId", "sentByUserId", "clientMessageId", body, "updatedAt") VALUES ($1, $2, $3, $4, $5, now()) RETURNING id', [conversation, profile, user, key, body])).rows[0].id as string;
  }

  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}", public`);
    const migrationsUrl = new URL("../prisma/migrations/", import.meta.url);
    const directories = (await readdir(migrationsUrl, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const designMigrationsUrl = new URL("../migration-plans/", import.meta.url);
    const socialMigrations = (await readdir(designMigrationsUrl, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const name of directories) {
      await client.query(await readFile(new URL(`${name}/migration.sql`, migrationsUrl), "utf8"));
    }

    // Seed the pre-upgrade shape, including an old privileged account/session.
    const legacyAdmin = await createUser("Legacy admin", "SUPER_ADMIN");
    await client.query('UPDATE "User" SET avatar = \'https://example.test/avatar.png\', "coverImage" = \'https://example.test/cover.png\', bio = \'Profile biography\', lat = 28, lng = 77, "loyaltyPoints" = 125, "accountType" = \'SALON_PARTNER\', "isOnboarded" = true, "partnerEligibilityBackfilledAt" = \'2026-10-01\' WHERE id = $1', [legacyAdmin]);
    const customer = await createUser("Customer");
    const staff = await createUser("Staff");
    const outsider = await createUser("Outsider");
    await client.query('INSERT INTO "Account" ("userId", provider, "providerUserId", "passwordHash") VALUES ($1, \'credentials\', $1, \'unchanged-hash\')', [legacyAdmin]);
    await client.query('INSERT INTO "RefreshToken" ("userId", "tokenHash", "expiresAt") VALUES ($1, \'unchanged-token-hash\', now() + interval \'1 day\')', [legacyAdmin]);
    const salon = (await client.query('INSERT INTO "Salon" (name, slug, address, city, state, zip, lat, lng, images, "updatedAt") VALUES (\'Salon\', \'test-salon\', \'Address\', \'Delhi\', \'Delhi\', \'110001\', 28, 77, ARRAY[]::text[], now()) RETURNING id')).rows[0].id as string;
    await client.query('INSERT INTO "SalonMember" ("userId", "salonId", role) VALUES ($1, $3, \'OWNER\'), ($2, $3, \'STAFF\')', [legacyAdmin, staff, salon]);

    const originalDocument = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Existing content" }] }] };
    const blogId = (await client.query('INSERT INTO "BlogPost" (title, slug, content, "contentJson", "authorId", "updatedAt") VALUES (\'Existing post\', \'existing-post\', \'Existing content\', $1, $2, now()) RETURNING id', [JSON.stringify(originalDocument), legacyAdmin])).rows[0].id;

    await client.query('INSERT INTO "Favorite" ("userId", "salonId") VALUES ($1, $2)', [customer, salon]);
    await client.query('INSERT INTO "BlogComment" ("postId", "userId", content) VALUES ($1, $2, \'Legacy comment\')', [blogId, customer]);

    for (const name of socialMigrations) {
      const sql = await readFile(new URL(`${name}/migration.sql`, designMigrationsUrl), "utf8");
      if (name.endsWith("profile_primary_contract")) {
        await t.test("refuses contract cleanup if legacy profile data changed after backfill", async () => {
          await client.query('UPDATE "User" SET name = \'Changed during migration\' WHERE id = $1', [legacyAdmin]);
          await assert.rejects(client.query(sql), /backfill is missing or stale/);
          await client.query("ROLLBACK");
          await client.query('UPDATE "User" SET name = \'Legacy admin\' WHERE id = $1', [legacyAdmin]);
        });
      }
      await client.query(sql);
    }

    // Explicit test-only activation: migrations must leave identities in DRAFT.
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "Profile" WHERE status <> \'DRAFT\'')).rows[0].count, 0);
    await client.query('UPDATE "User" SET "emailVerified" = true, status = \'ACTIVE\'');
    await client.query('UPDATE "ProfileOnboarding" SET status = \'COMPLETED\', "completedAt" = now()');
    await client.query('UPDATE "Profile" SET status = \'ACTIVE\'');

    const profiles = (await client.query('SELECT id, "personalUserId", "salonId" FROM "Profile"')).rows;
    const personal = (id: string) => profiles.find((p) => p.personalUserId === id)!.id as string;
    const salonProfile = profiles.find((p) => p.salonId === salon)!.id as string;
    const customerProfile = personal(customer);
    const outsiderProfile = personal(outsider);
    const conversation = await createConversation(customerProfile, salonProfile);
    const otherConversation = await createConversation(customerProfile, outsiderProfile);
    const firstMessage = await message(conversation, salonProfile, legacyAdmin, "salon-1");
    const otherMessage = await message(otherConversation, outsiderProfile, outsider, "outside-1");

    await t.test("preserves credentials and sessions while removing the legacy platform role", async () => {
      assert.equal((await client.query('SELECT role FROM "User" WHERE id = $1', [legacyAdmin])).rows[0].role, "ADMIN");
      assert.equal((await client.query('SELECT "passwordHash" FROM "Account" WHERE "userId" = $1', [legacyAdmin])).rows[0].passwordHash, "unchanged-hash");
      assert.equal((await client.query('SELECT "tokenHash" FROM "RefreshToken" WHERE "userId" = $1', [legacyAdmin])).rows[0].tokenHash, "unchanged-token-hash");
      const roles = await client.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type ty ON ty.oid = e.enumtypid JOIN pg_namespace ns ON ns.oid = ty.typnamespace WHERE ty.typname = 'PlatformRole' AND ns.nspname = $1 ORDER BY e.enumsortorder", [schema]);
      assert.deepEqual(roles.rows.map((row) => row.enumlabel), ["ADMIN", "CONTENT_ADMIN", "USER"]);
      assert.equal(profiles.length, 5);
    });

    await t.test("moves public data, consent state, and balances without fabricating history", async () => {
      const result = (await client.query('SELECT "displayName", avatar, "coverImage", bio, lat, lng FROM "Profile" WHERE "personalUserId" = $1', [legacyAdmin])).rows[0];
      assert.deepEqual(result, { displayName: "Legacy admin", avatar: "https://example.test/avatar.png", coverImage: "https://example.test/cover.png", bio: "Profile biography", lat: 28, lng: 77 });
      assert.equal((await client.query('SELECT points FROM "LoyaltyWallet" WHERE "userId" = $1', [legacyAdmin])).rows[0].points, 125);
      const onboarding = (await client.query('SELECT * FROM "UserOnboarding" WHERE "userId" = $1', [legacyAdmin])).rows[0];
      assert.equal(onboarding.accountType, "SALON_PARTNER");
      assert.equal(onboarding.isOnboarded, true);
      assert.equal(onboarding.onboardingCompletedAt, null);
      assert.equal(onboarding.partnerTermsAcceptedAt, null);
      assert.equal(onboarding.partnerEligibilityBackfilledAt.getFullYear(), 2026);
      assert.equal(onboarding.partnerEligibilityBackfilledAt.getMonth(), 9);
      assert.equal(onboarding.partnerEligibilityBackfilledAt.getDate(), 1);
      const columns = (await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'User'", [schema])).rows.map((row) => row.column_name);
      for (const column of ["name", "avatar", "bio", "lat", "lng", "coverImage", "loyaltyPoints", "isOnboarded", "accountType"]) assert.equal(columns.includes(column), false);
    });

    await t.test("automatically provisions one personal profile for every new user atomically", async () => {
      const id = (await client.query('INSERT INTO "User" (email, "updatedAt") VALUES (\'new@example.test\', now()) RETURNING id')).rows[0].id;
      const profile = (await client.query('SELECT * FROM "Profile" WHERE "personalUserId" = $1', [id])).rows;
      assert.equal(profile.length, 1);
      assert.equal(profile[0].type, "PERSONAL");
      assert.equal((await client.query('SELECT points FROM "LoyaltyWallet" WHERE "userId" = $1', [id])).rows[0].points, 0);
      assert.equal((await client.query('SELECT "isOnboarded" FROM "UserOnboarding" WHERE "userId" = $1', [id])).rows[0].isOnboarded, false);
      await fails('DELETE FROM "Profile" WHERE "personalUserId" = $1', [id], "23001");
      const count = (await client.query('SELECT count(*) FROM "Profile"')).rows[0].count;
      await client.query("BEGIN");
      await client.query('INSERT INTO "User" (email, "updatedAt") VALUES (\'rolled-back@example.test\', now())');
      await client.query("ROLLBACK");
      assert.equal((await client.query('SELECT count(*) FROM "Profile"')).rows[0].count, count);
      assert.equal((await client.query('SELECT count(*)::int AS count FROM "User" WHERE email = \'rolled-back@example.test\'')).rows[0].count, 0);
    });

    await t.test("automatically provisions a salon profile without duplicating public fields", async () => {
      const id = (await client.query('INSERT INTO "Salon" (address, city, state, zip, lat, lng, images, "updatedAt") VALUES ( \'Address\', \'Delhi\', \'Delhi\', \'110001\', 28, 77, ARRAY[]::text[], now()) RETURNING id')).rows[0].id;
      const profile = (await client.query('SELECT type FROM "Profile" WHERE "salonId" = $1', [id])).rows;
      assert.deepEqual(profile, [{ type: "SALON" }]);
      await fails('UPDATE "LoyaltyWallet" SET points = -1 WHERE "userId" = $1', [legacyAdmin], "23514");
    });

    await t.test("preserves salon slugs and stores native JSON without dropping existing content", async () => {
      assert.equal((await client.query('SELECT slug FROM "Profile" WHERE "salonId" = $1', [salon])).rows[0].slug, "test-salon");
      const personalSlug = (await client.query('SELECT slug FROM "Profile" WHERE "personalUserId" = $1', [legacyAdmin])).rows[0].slug;
      assert.equal(personalSlug, "legacy-admin");
      assert.equal(personalSlug.includes(legacyAdmin), false);
      assert.deepEqual((await client.query('SELECT "contentJson" FROM "BlogPost" WHERE id = $1', [blogId])).rows[0].contentJson, originalDocument);
      await fails('UPDATE "Profile" SET slug = \'Bad Slug\' WHERE "personalUserId" = $1', [legacyAdmin], "23514");
      await fails('UPDATE "Profile" SET slug = \'admin\' WHERE "personalUserId" = $1', [legacyAdmin], "23514");
    });

    await t.test("supports authoritative HTML and JSON messages without requiring plain text", async () => {
      await client.query('INSERT INTO "ChatMessage" ("conversationId", "senderProfileId", "sentByUserId", "clientMessageId", "bodyFormat", "bodyHtml", "updatedAt") VALUES ($1, $2, $3, \'rich-html\', \'HTML\', \'<p>Hello</p>\', now())', [conversation, customerProfile, customer]);
      await client.query('INSERT INTO "ChatMessage" ("conversationId", "senderProfileId", "sentByUserId", "clientMessageId", "bodyFormat", "bodyJson", "updatedAt") VALUES ($1, $2, $3, \'rich-json\', \'JSON\', $4::jsonb, now())', [conversation, customerProfile, customer, JSON.stringify(originalDocument)]);
      await fails('INSERT INTO "ChatMessage" ("conversationId", "senderProfileId", "sentByUserId", "clientMessageId", "bodyFormat", "bodyJson", "updatedAt") VALUES ($1, $2, $3, \'empty-json\', \'JSON\', \'{}\'::jsonb, now())', [conversation, customerProfile, customer], "23514");
    });

    await t.test("requires exactly one profile owner matching its type", async () => {
      await fails('INSERT INTO "Profile" (type) VALUES (\'PERSONAL\')', [], "23514");
      await fails('INSERT INTO "Profile" (type, "personalUserId", "salonId") VALUES (\'PERSONAL\', $1, $2)', [customer, salon], "23514");
      await fails('INSERT INTO "Profile" (type, "personalUserId") VALUES (\'SALON\', $1)', [customer], "23514");
      await fails('INSERT INTO "Profile" (type, "personalUserId") VALUES (\'PERSONAL\', $1)', [customer], "23505");
      await fails('UPDATE "Profile" SET "personalUserId" = $1 WHERE id = $2', [staff, customerProfile], "23514");
    });

    await t.test("rejects self conversations, reverse pairs, duplicates, and reassigned parties", async () => {
      const [a, b] = [customerProfile, salonProfile].sort();
      await fails('INSERT INTO "Conversation" ("firstProfileId", "secondProfileId") VALUES ($1, $1)', [a], "23514");
      await fails('INSERT INTO "Conversation" ("firstProfileId", "secondProfileId") VALUES ($2, $1)', [a, b], "23514");
      await fails('INSERT INTO "Conversation" ("firstProfileId", "secondProfileId") VALUES ($1, $2)', [a, b], "23505");
      await fails('UPDATE "Conversation" SET "secondProfileId" = $1 WHERE id = $2', [outsiderProfile, conversation], "23514");
    });

    await t.test("rejects outsiders as participants and message senders", async () => {
      await fails('INSERT INTO "ConversationParticipant" ("conversationId", "profileId") VALUES ($1, $2)', [conversation, outsiderProfile], "23514");
      await assert.rejects(message(conversation, outsiderProfile, outsider, "forged"), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23503");
    });

    await t.test("deduplicates retry keys and prevents replies across conversations", async () => {
      await assert.rejects(message(conversation, salonProfile, legacyAdmin, "salon-1"), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23505");
      await fails('UPDATE "ChatMessage" SET "replyToId" = $1 WHERE id = $2', [otherMessage, firstMessage], "23503");
      await fails('UPDATE "ChatMessage" SET "replyToId" = id WHERE id = $1', [firstMessage], "23514");
    });

    await t.test("keeps staff read cursors separate and scoped to the correct conversation", async () => {
      await client.query('INSERT INTO "ConversationReadState" ("conversationId", "profileId", "userId", "lastReadMessageId", "lastReadAt", "updatedAt") VALUES ($1, $2, $3, $5, now(), now()), ($1, $2, $4, NULL, NULL, now())', [conversation, salonProfile, legacyAdmin, staff, firstMessage]);
      assert.equal((await client.query('SELECT count(*)::int AS count FROM "ConversationReadState" WHERE "conversationId" = $1', [conversation])).rows[0].count, 2);
      await fails('UPDATE "ConversationReadState" SET "lastReadMessageId" = $1 WHERE "conversationId" = $2 AND "userId" = $3', [otherMessage, conversation, staff], "23503");
    });

    await t.test("preserves salon identity and sender audit after a staff membership is removed", async () => {
      const sent = await message(conversation, salonProfile, staff, "staff-1");
      await client.query('DELETE FROM "SalonMember" WHERE "salonId" = $1 AND "userId" = $2', [salon, staff]);
      assert.deepEqual((await client.query('SELECT "senderProfileId", "sentByUserId" FROM "ChatMessage" WHERE id = $1', [sent])).rows[0], { senderProfileId: salonProfile, sentByUserId: staff });
      await assert.rejects(message(conversation, salonProfile, staff, "revoked-staff"), /Current salon membership is required/);
    });

    const media = (await client.query('INSERT INTO "MediaAsset" ("userId", url, "publicId", folder, "updatedAt") VALUES ($1, \'https://example.test/image.png\', \'test-media\', \'tests\', now()) RETURNING id', [customer])).rows[0].id as string;

    await t.test("allows media-only messages atomically and rejects empty messages", async () => {
      await assert.rejects(message(conversation, customerProfile, customer, "empty", "   "), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23514");
      await client.query("BEGIN");
      const id = await message(conversation, customerProfile, customer, "photo", null);
      await client.query('INSERT INTO "ChatMessageMedia" ("messageId", "mediaId") VALUES ($1, $2)', [id, media]);
      await client.query("COMMIT");
      await fails('DELETE FROM "ChatMessageMedia" WHERE "messageId" = $1', [id], "23514");
    });

    const post = (await client.query('INSERT INTO "FeedPost" ("authorProfileId", "writtenByUserId", body, status, "publishedAt", "updatedAt") VALUES ($1, $2, \'Published\', \'PUBLISHED\', now(), now()) RETURNING id', [salonProfile, legacyAdmin])).rows[0].id as string;
    const otherPost = (await client.query('INSERT INTO "FeedPost" ("authorProfileId", "writtenByUserId", "updatedAt") VALUES ($1, $2, now()) RETURNING id', [customerProfile, customer])).rows[0].id as string;

    await t.test("rejects empty published posts while allowing media-only posts in one transaction", async () => {
      await fails('UPDATE "FeedPost" SET status = \'PUBLISHED\' WHERE id = $1', [otherPost], "23514");
      await fails('UPDATE "FeedPost" SET status = \'PUBLISHED\', "publishedAt" = now() WHERE id = $1', [otherPost], "23514");
      await client.query("BEGIN");
      await client.query('INSERT INTO "FeedPostMedia" ("postId", "mediaId") VALUES ($1, $2)', [otherPost, media]);
      await client.query('UPDATE "FeedPost" SET status = \'PUBLISHED\', "publishedAt" = now() WHERE id = $1', [otherPost]);
      await client.query("COMMIT");
      await fails('DELETE FROM "FeedPostMedia" WHERE "postId" = $1', [otherPost], "23514");
    });

    await t.test("scopes replies to their post and likes to the public identity", async () => {
      const comment = (await client.query('INSERT INTO "FeedComment" ("postId", "authorProfileId", "writtenByUserId", body, "updatedAt") VALUES ($1, $2, $3, \'Comment\', now()) RETURNING id', [post, customerProfile, customer])).rows[0].id;
      await fails('INSERT INTO "FeedComment" ("postId", "authorProfileId", "writtenByUserId", "parentId", body, "updatedAt") VALUES ($1, $2, $3, $4, \'Reply\', now())', [otherPost, customerProfile, customer, comment], "23503");
      await client.query('INSERT INTO "FeedLike" ("postId", "profileId", "performedByUserId") VALUES ($1, $2, $3)', [post, salonProfile, legacyAdmin]);
      await fails('INSERT INTO "FeedLike" ("postId", "profileId", "performedByUserId") VALUES ($1, $2, $3)', [post, salonProfile, legacyAdmin], "23505");
      await fails('DELETE FROM "Profile" WHERE id = $1', [salonProfile], "23001");
    });
    await t.test("rejects draft, suspended, pending and mismatched profile actors", async () => {
      const user = (await client.query('INSERT INTO "User" ("emailVerified", status, "updatedAt") VALUES (true, \'ACTIVE\', now()) RETURNING id')).rows[0].id;
      const profile = (await client.query('SELECT id FROM "Profile" WHERE "personalUserId" = $1', [user])).rows[0].id;
      const write = 'INSERT INTO "FeedPost" ("authorProfileId", "writtenByUserId", body, status, "publishedAt", "updatedAt") VALUES ($1, $2, \'Actor probe\', \'PUBLISHED\', now(), now())';
      await fails(write, [profile, user], "23514");
      // Saving an owned draft is allowed before completing profile onboarding.
      const draft = (await client.query('INSERT INTO "FeedPost" ("authorProfileId", "writtenByUserId", "updatedAt") VALUES ($1, $2, now()) RETURNING id', [profile, user])).rows[0].id;
      await fails('UPDATE "FeedPost" SET status = \'PUBLISHED\', body = \'Ready\', "publishedAt" = now() WHERE id = $1', [draft], "23514");
      await fails(write, [customerProfile, outsider], "23514");
      await fails('UPDATE "FeedPost" SET "writtenByUserId" = $1 WHERE id = $2', [outsider, draft], "23514");
      await client.query('UPDATE "ProfileOnboarding" SET status = \'COMPLETED\', "completedAt" = now() WHERE "profileId" = $1', [profile]);
      await client.query('UPDATE "Profile" SET status = \'ACTIVE\' WHERE id = $1', [profile]);
      await client.query(write, [profile, user]);
      await client.query('UPDATE "User" SET status = \'SUSPENDED\' WHERE id = $1', [user]);
      await fails(write, [profile, user], "23514");
      await client.query('UPDATE "User" SET status = \'PENDING_VERIFICATION\' WHERE id = $1', [user]);
      await fails(write, [profile, user], "23514");
      await client.query('UPDATE "User" SET status = \'ACTIVE\' WHERE id = $1', [user]);
      await client.query('UPDATE "Profile" SET status = \'SUSPENDED\' WHERE id = $1', [profile]);
      await fails(write, [profile, user], "23514");
    });

    await t.test("allows incomplete salon drafts and validates details before LIVE", async () => {
      const draft = (await client.query('INSERT INTO "Salon" ("updatedAt") VALUES (now()) RETURNING *')).rows[0];
      assert.equal(draft.status, "DRAFT");
      assert.equal(draft.isActive, false);
      assert.equal(draft.address, null);
      assert.equal(draft.lat, null);
      assert.deepEqual(draft.images, []);
      const profile = (await client.query('SELECT p.id, p.status, o.status AS "onboardingStatus" FROM "Profile" p JOIN "ProfileOnboarding" o ON o."profileId" = p.id WHERE p."salonId" = $1', [draft.id])).rows[0];
      assert.equal(profile.status, "DRAFT");
      assert.equal(profile.onboardingStatus, "PENDING");
      await fails('DELETE FROM "ProfileOnboarding" WHERE "profileId" = $1', [profile.id], "23514");
      await fails('UPDATE "Salon" SET status = \'LIVE\', "isActive" = true WHERE id = $1', [draft.id], "23514");
      await fails('UPDATE "Salon" SET lat = 100, lng = 77 WHERE id = $1', [draft.id], "23514");
      await client.query('UPDATE "Salon" SET address = \'Address\', city = \'Delhi\', state = \'Delhi\', zip = \'110001\', lat = 28, lng = 77, "isActive" = true, status = \'LIVE\' WHERE id = $1', [draft.id]);
      await fails('UPDATE "Salon" SET address = \' \' WHERE id = $1', [draft.id], "23514");
    });

    await t.test("backfills legacy favorite and blog identity without losing User attribution", async () => {
      assert.deepEqual((await client.query('SELECT "actorProfileId", "userId" FROM "Favorite" WHERE "userId" = $1', [customer])).rows[0], { actorProfileId: customerProfile, userId: customer });
      assert.deepEqual((await client.query('SELECT "actorProfileId", "userId", content FROM "BlogComment" WHERE "postId" = $1', [blogId])).rows[0], { actorProfileId: customerProfile, userId: customer, content: "Legacy comment" });
      assert.equal((await client.query('SELECT "actorProfileId" FROM "BlogPost" WHERE id = $1', [blogId])).rows[0].actorProfileId, personal(legacyAdmin));
    });

    await t.test("enforces personal actors for favorites and service/product reviews", async () => {
      const favoriteSql = 'INSERT INTO "Favorite" ("actorProfileId", "userId", "salonId") VALUES ($1, $2, $3)';
      await fails(favoriteSql, [salonProfile, legacyAdmin, salon], "23514");
      await fails(favoriteSql, [customerProfile, outsider, salon], "23514");
      await client.query(favoriteSql, [outsiderProfile, outsider, salon]);
      await fails(favoriteSql, [outsiderProfile, outsider, salon], "23505");
      const service = (await client.query('INSERT INTO "Service" ("salonId", name, slug, price, duration, images, "updatedAt") VALUES ($1, \'Cut\', \'review-cut\', 100, 30, ARRAY[]::text[], now()) RETURNING id', [salon])).rows[0].id;
      const product = (await client.query('INSERT INTO "Product" ("salonId", name, slug, price, stock, images, "updatedAt") VALUES ($1, \'Shampoo\', \'review-shampoo\', 100, 5, ARRAY[]::text[], now()) RETURNING id', [salon])).rows[0].id;
      for (const [table, target, id] of [["ServiceReview", "serviceId", service], ["ProductReview", "productId", product]]) {
        const sql = `INSERT INTO "${table}" ("actorProfileId", "userId", "${target}", rating, images) VALUES ($1, $2, $3, 5, ARRAY[]::text[])`;
        await fails(sql, [salonProfile, legacyAdmin, id], "23514");
        await fails(sql, [customerProfile, outsider, id], "23514");
        await client.query(sql, [customerProfile, customer, id]);
        await fails(sql, [customerProfile, customer, id], "23505");
      }
    });

    await t.test("validates salon blog actors and rejects removed members on chat cursors", async () => {
      const write = 'INSERT INTO "BlogPost" ("actorProfileId", "authorId", title, slug, "updatedAt") VALUES ($1, $2, \'Salon update\', $3, now()) RETURNING id';
      await fails(write, [salonProfile, outsider, "forged-salon-blog"], "23514");
      const blog = (await client.query(write, [salonProfile, legacyAdmin, "salon-blog"])).rows[0].id;
      await client.query('INSERT INTO "BlogComment" ("actorProfileId", "userId", "postId", content) VALUES ($1, $2, $3, \'Comment\')', [customerProfile, customer, blog]);
      await fails('UPDATE "BlogPost" SET "actorProfileId" = $1 WHERE id = $2', [personal(legacyAdmin), blog], "23514");
      await fails('UPDATE "ConversationReadState" SET "lastReadAt" = now() WHERE "conversationId" = $1 AND "userId" = $2', [conversation, staff], "23514");
    });

    await t.test("serializes onboarding regression against concurrent profile activation", async () => {
      const user = (await client.query('INSERT INTO "User" ("updatedAt") VALUES (now()) RETURNING id')).rows[0].id;
      const profile = (await client.query('SELECT id FROM "Profile" WHERE "personalUserId" = $1', [user])).rows[0].id;
      await client.query('UPDATE "ProfileOnboarding" SET status = \'COMPLETED\', "completedAt" = now() WHERE "profileId" = $1', [profile]);
      const peer = new Client({ connectionString: databaseUrl });
      await peer.connect();
      try {
        await peer.query(`SET search_path TO "${schema}", public`);
        await peer.query("SET lock_timeout TO '100ms'");
        await client.query("BEGIN");
        await client.query('UPDATE "Profile" SET status = \'ACTIVE\' WHERE id = $1', [profile]);
        await assert.rejects(peer.query('UPDATE "ProfileOnboarding" SET status = \'PENDING\', "completedAt" = NULL WHERE "profileId" = $1', [profile]), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "55P03");
        await client.query("COMMIT");
        await fails('UPDATE "ProfileOnboarding" SET status = \'PENDING\', "completedAt" = NULL WHERE "profileId" = $1', [profile], "23514");
      } finally {
        await client.query("ROLLBACK");
        await peer.end();
      }
    });

    await t.test("serializes profile actions against concurrent membership revocation", async () => {
      const peer = new Client({ connectionString: databaseUrl });
      await peer.connect();
      try {
        await peer.query(`SET search_path TO "${schema}", public`);
        await peer.query("SET lock_timeout TO '100ms'");
        await client.query("BEGIN");
        await client.query('SELECT assert_profile_operator($1, $2, true, false)', [salonProfile, legacyAdmin]);
        await assert.rejects(peer.query('DELETE FROM "SalonMember" WHERE "salonId" = $1 AND "userId" = $2', [salon, legacyAdmin]), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "55P03");
      } finally {
        await client.query("ROLLBACK");
        await peer.end();
      }
    });

    await t.test("account access and profile onboarding remain independent", async () => {
      const user = (await client.query('INSERT INTO "User" ("updatedAt") VALUES (now()) RETURNING id, status')).rows[0];
      assert.equal(user.status, "PENDING_VERIFICATION");
      const profile = (await client.query('SELECT p.id, p.status, o.status AS "onboardingStatus" FROM "Profile" p JOIN "ProfileOnboarding" o ON o."profileId" = p.id WHERE p."personalUserId" = $1', [user.id])).rows[0];
      assert.equal(profile.status, "DRAFT");
      assert.equal(profile.onboardingStatus, "PENDING");
      await fails('DELETE FROM "ProfileOnboarding" WHERE "profileId" = $1', [profile.id], "23514");
      await fails('UPDATE "User" SET status = \'ACTIVE\' WHERE id = $1', [user.id], "23514");
      await client.query('UPDATE "User" SET "emailVerified" = true, status = \'ACTIVE\' WHERE id = $1', [user.id]);
      await fails('UPDATE "Profile" SET status = \'ACTIVE\' WHERE id = $1', [profile.id], "23514");
      await fails('UPDATE "ProfileOnboarding" SET status = \'COMPLETED\' WHERE "profileId" = $1', [profile.id], "23514");
      await client.query('UPDATE "ProfileOnboarding" SET status = \'COMPLETED\', "completedAt" = now() WHERE "profileId" = $1', [profile.id]);
      assert.equal((await client.query('SELECT status FROM "Profile" WHERE id = $1', [profile.id])).rows[0].status, "DRAFT");
      await client.query('UPDATE "Profile" SET status = \'ACTIVE\' WHERE id = $1', [profile.id]);
      await fails('UPDATE "ProfileOnboarding" SET status = \'PENDING\', "completedAt" = NULL WHERE "profileId" = $1', [profile.id], "23514");
      await fails('DELETE FROM "ProfileOnboarding" WHERE "profileId" = $1', [profile.id], "23514");
      await fails('INSERT INTO "ProfileOnboarding" ("profileId") VALUES ($1)', [profile.id], "23505");
      const purposes = (await client.query("SELECT unnest(enum_range(NULL::\"OtpPurpose\"))::text AS purpose")).rows.map((row) => row.purpose);
      assert.ok(purposes.includes("LOGIN"));
      assert.ok(purposes.includes("REGISTRATION_VERIFICATION"));
    });

  } finally {
    await client.query("ROLLBACK");
    await client.query("SET search_path TO public");
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
});
