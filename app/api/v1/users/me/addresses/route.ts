export const runtime = "nodejs";

export {
  handleCreateAddress as POST,
  handleListAddresses as GET,
} from "@/features/users/handlers/user.handlers";
