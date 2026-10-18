import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { privateVerificationDownload } from "@/lib/cloudinary";
import { findMediaAssetById } from "@/server/modules/media/media.repository";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { resolveSalonId } from "@/server/modules/service/service.repository";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";

/** Private documents bypass image optimization and are never cached publicly. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ salonRef: string; mediaId: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
  const auth = await getAuthContext(request);
  if (!auth)
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401, headers },
    );
  const { salonRef, mediaId } = await params;
  if (!/^[a-f0-9]{48}$/i.test(mediaId))
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404, headers },
    );
  const salonId = await resolveSalonId(salonRef);
  if (!salonId)
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404, headers },
    );
  if (auth.role !== "SUPER_ADMIN") {
    try {
      const salon = await findSalonForViewer({ salonId, userId: auth.sub });
      if (!salon) throw new SalonNotFoundError();
      assertRoleAtLeast(salon.viewerRole, "MANAGER");
    } catch (error) {
      if (
        error instanceof SalonNotFoundError ||
        error instanceof SalonRoleInsufficientError
      )
        return NextResponse.json(
          { message: "Document not found" },
          { status: 404, headers },
        );
      throw error;
    }
  }
  const asset = await findMediaAssetById(mediaId);
  if (
    !asset ||
    asset.purpose !== "VERIFICATION" ||
    asset.attachedToId !== salonId ||
    asset.attachedToType !== "SALON_VERIFICATION"
  )
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404, headers },
    );
  return new Response(null, {
    status: 302,
    headers: {
      ...headers,
      Location: privateVerificationDownload(asset.publicId),
    },
  });
}
