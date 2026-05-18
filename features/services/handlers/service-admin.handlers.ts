/**
 * Purpose: Barrel exports for service admin route handlers.
 * Responsibilities: keep App Router route files small while exposing management operations.
 * Important notes: handlers enforce auth and branch scoping in their feature modules.
 */
export {
  handleCreateServiceCategory,
  handleUpdateServiceCategory,
} from "./service-category-admin.handlers";
export {
  handleCreateAdminService,
  handleListAdminServices,
  handleUpdateAdminService,
} from "./service-management-admin.handlers";
export {
  handleCreateServiceAddOn,
  handleCreateServiceVariant,
  handleUpdateServiceAddOn,
  handleUpdateServiceVariant,
} from "./service-option-admin.handlers";
