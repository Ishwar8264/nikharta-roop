/**
 * Re-exports public product discovery handlers.
 */
export {
  handleGetProduct,
  handleListProductCategories,
  handleListProducts,
} from "./product-public.handlers";
/**
 * Re-exports admin product list handlers.
 */
export {
  handleListAdminProductCategories,
  handleListAdminProducts,
} from "./product-admin-list.handlers";
/**
 * Re-exports admin product category write handlers.
 */
export {
  handleCreateProductCategory,
  handleUpdateProductCategory,
} from "./product-category-admin.handlers";
/**
 * Re-exports admin product write handlers.
 */
export {
  handleCreateProduct,
  handleUpdateProduct,
} from "./product-admin.handlers";
