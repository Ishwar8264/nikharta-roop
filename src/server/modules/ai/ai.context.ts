import "server-only";

import type { AiContextType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { AiInvalidContextError } from "./ai.errors";

/** Shared preamble applied to every system prompt. */
const BASE_PREAMBLE = [
  "You are Nikharta Roop, a helpful assistant for a salon booking platform.",
  "Answer concisely and in the same language the user writes in.",
  "Never invent facts about a specific salon, service, product, or staff member.",
  "If the provided context does not contain the answer, say so and suggest the user ask the salon directly.",
].join(" ");

/**
 * Builds the system prompt for a chat turn.
 *
 * Why:
 * The `contextType` and `contextId` on the chat select a data snapshot that
 * gets folded into the system prompt before every turn. This keeps the
 * assistant grounded in real platform data instead of hallucinating around
 * the user's question — the single most important lever for AI quality on a
 * domain-specific product.
 *
 * Returns the base preamble alone when `contextType` is GENERAL, or throws a
 * typed error when a specific context was requested but its entity is gone
 * (deleted between chat creation and this call).
 */
export async function buildSystemPrompt(input: {
  contextType: AiContextType;
  contextId: string | null;
}): Promise<string> {
  if (input.contextType === "GENERAL" || !input.contextId) {
    return BASE_PREAMBLE;
  }

  if (input.contextType === "SERVICE") {
    const service = await prisma.service.findFirst({
      where: { id: input.contextId, deletedAt: null },
      select: {
        name: true,
        shortDescription: true,
        description: true,
        price: true,
        duration: true,
        salon: { select: { name: true, city: true } },
        category: { select: { name: true } },
      },
    });
    if (!service) throw new AiInvalidContextError("Service no longer exists.");

    return [
      BASE_PREAMBLE,
      "",
      "You are answering questions about this specific service:",
      `- Name: ${service.name}`,
      `- Salon: ${service.salon.name} (${service.salon.city})`,
      `- Category: ${service.category?.name ?? "Uncategorized"}`,
      `- Price: ₹${service.price.toString()}`,
      `- Duration: ${service.duration} minutes`,
      service.shortDescription ? `- Summary: ${service.shortDescription}` : "",
      service.description ? `- Details: ${service.description}` : "",
      "",
      "Answer using only the facts above for anything service-specific. " +
        "For booking, pricing changes, or availability, tell the user to contact the salon.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (input.contextType === "PRODUCT") {
    const product = await prisma.product.findFirst({
      where: { id: input.contextId, deletedAt: null },
      select: {
        name: true,
        shortDescription: true,
        description: true,
        price: true,
        stock: true,
        salon: { select: { name: true, city: true } },
        category: { select: { name: true } },
      },
    });
    if (!product) throw new AiInvalidContextError("Product no longer exists.");

    return [
      BASE_PREAMBLE,
      "",
      "You are answering questions about this specific product:",
      `- Name: ${product.name}`,
      `- Salon: ${product.salon.name} (${product.salon.city})`,
      `- Category: ${product.category?.name ?? "Uncategorized"}`,
      `- Price: ₹${product.price.toString()}`,
      `- In stock: ${product.stock > 0 ? "yes" : "no"}`,
      product.shortDescription ? `- Summary: ${product.shortDescription}` : "",
      product.description ? `- Details: ${product.description}` : "",
      "",
      "Answer using only the facts above. For pickup, delivery, or stock changes, " +
        "tell the user to contact the salon directly.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (input.contextType === "STAFF") {
    const staff = await prisma.user.findFirst({
      where: { id: input.contextId, deletedAt: null },
      select: {
        name: true,
        bio: true,
        salonMemberships: {
          select: {
            role: true,
            salon: { select: { name: true, city: true } },
          },
        },
        staffSkills: {
          select: {
            experience: true,
            service: { select: { name: true } },
          },
        },
        staffRatingsReceived: {
          select: { rating: true },
        },
      },
    });
    if (!staff) {
      throw new AiInvalidContextError("Staff member no longer exists.");
    }

    const membership = staff.salonMemberships[0];
    const ratingSum = staff.staffRatingsReceived.reduce(
      (sum, r) => sum + r.rating,
      0,
    );
    const ratingCount = staff.staffRatingsReceived.length;
    const avgRating =
      ratingCount > 0 ? (ratingSum / ratingCount).toFixed(2) : null;

    const skills = staff.staffSkills
      .map(
        (s) =>
          `  • ${s.service.name}${s.experience ? ` (${s.experience} yrs)` : ""}`,
      )
      .join("\n");

    return [
      BASE_PREAMBLE,
      "",
      "You are answering questions about this specific staff member:",
      `- Name: ${staff.name ?? "Unnamed"}`,
      membership
        ? `- Works at: ${membership.salon.name} (${membership.salon.city})`
        : "",
      membership ? `- Role: ${membership.role}` : "",
      avgRating
        ? `- Average rating: ${avgRating} (${ratingCount} reviews)`
        : "",
      staff.bio ? `- Bio: ${staff.bio}` : "",
      skills ? `- Specialties:\n${skills}` : "",
      "",
      "Answer only using the facts above. For availability or booking, " +
        "tell the user to contact the salon directly.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return BASE_PREAMBLE;
}

/**
 * Asserts that a chat's context is still valid.
 *
 * Why:
 * Called once at chat-creation time so an invalid reference is rejected
 * before any messages exist. Uses the same underlying lookups as
 * `buildSystemPrompt`, so there is a single definition of "valid context".
 */
export async function assertContextValid(input: {
  contextType: AiContextType;
  contextId: string | null;
}): Promise<void> {
  await buildSystemPrompt(input);
}
