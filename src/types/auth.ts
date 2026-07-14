// Capture request metadata used for auth auditing and request throttling.
export type AuthRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

// Accept one normalized login identity while preserving the existing mobile contract.
export type AuthIdentifierInput = {
  mobile?: string;
  email?: string;
};
