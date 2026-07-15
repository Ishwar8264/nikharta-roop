// Describe every successful API envelope returned by the shared response helper.
export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
};

// Describe every failed API envelope while preserving the backend message.
export type ApiErrorResponse = {
  success: false;
  error: string;
};

// Keep success and failure responses distinguishable through the success flag.
export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
