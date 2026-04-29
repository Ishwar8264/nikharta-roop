export const runtime = "nodejs";

export {
  handleGetProfile as GET,
  handleUpdateProfile as PATCH,
} from "@/features/users/handlers/user.handlers";
