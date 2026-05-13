import { z } from "zod";

import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import type { MediaRow } from "@/features/media/helpers/media.mapper";
import { toPublicMedia } from "@/features/media/helpers/media.mapper";
import { mediaError, mediaJson } from "@/features/media/responses/media.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import type { HttpStatus } from "@/lib/constants/http-status";

/**
 * Parses media query strings with feature-owned validation errors.
 */
export function parseMediaQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: mediaError({
      code: MEDIA_CODES.VALIDATION_ERROR,
      message: MEDIA_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a media collection in the shared response shape.
 */
export function mediaListResponse(media: MediaRow[], limit: number) {
  return mediaJson({
    code: MEDIA_CODES.MEDIA_LISTED,
    data: { limit, media: media.map(toPublicMedia) },
    message: MEDIA_MESSAGES.MEDIA_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps one media asset in the shared response shape.
 */
export function mediaDetailResponse(
  media: MediaRow,
  code: string,
  status: HttpStatus = HTTP_STATUS.OK,
) {
  return mediaJson({
    code,
    data: { media: toPublicMedia(media) },
    message:
      code === MEDIA_CODES.MEDIA_CREATED
        ? MEDIA_MESSAGES.MEDIA_CREATED
        : MEDIA_MESSAGES.MEDIA_UPDATED,
    status,
    success: true,
  });
}
