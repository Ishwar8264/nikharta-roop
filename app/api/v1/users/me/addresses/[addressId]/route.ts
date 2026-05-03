import {
  handleDeleteAddress,
  handleUpdateAddress,
} from "@/features/users/handlers/user.handlers";

export const runtime = "nodejs";

type AddressRouteContext = {
  params: Promise<{
    addressId: string;
  }>;
};

/**
 * Routes address patch requests to the current-user address handler.
 */
export async function PATCH(request: Request, context: AddressRouteContext) {
  const { addressId } = await context.params;

  return handleUpdateAddress(request, addressId);
}

/**
 * Routes address delete requests to the current-user address handler.
 */
export async function DELETE(request: Request, context: AddressRouteContext) {
  const { addressId } = await context.params;

  return handleDeleteAddress(request, addressId);
}
