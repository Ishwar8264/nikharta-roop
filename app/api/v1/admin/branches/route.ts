export const runtime = "nodejs";

export {
  handleAdminListBranches as GET,
  handleCreateBranch as POST,
} from "@/features/branches/handlers/branch.handlers";
