import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { mediaError } from "@/features/media/responses/media.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { MediaVisibleError } from "./media.shared";

/**
 * Converts expected and unexpected media failures into safe responses.
 */
export function handleMediaError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof MediaVisibleError) {
    return mediaError({ code: error.code, message: error.message, status: error.status });
  }
  console.error(input.code, { error, handler: input.handler });
  return mediaError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a media not-found error.
 */
export function throwMediaNotFound(): never {
  throw new MediaVisibleError(
    MEDIA_CODES.MEDIA_NOT_FOUND,
    MEDIA_MESSAGES.MEDIA_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
