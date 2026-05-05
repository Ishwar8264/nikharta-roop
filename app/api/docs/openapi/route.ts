import { NextResponse } from "next/server";

import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
} from "@/features/auth/constants/auth.constants";
import {
  BOOKING_CODES,
  BOOKING_MESSAGES,
} from "@/features/bookings/constants/booking.constants";
import {
  BLOG_CODES,
  BLOG_MESSAGES,
} from "@/features/blogs/constants/blog.constants";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import {
  PAYMENT_CODES,
  PAYMENT_MESSAGES,
} from "@/features/payments/constants/payment.constants";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import {
  REVIEW_CODES,
  REVIEW_MESSAGES,
} from "@/features/reviews/constants/review.constants";
import {
  STAFF_CODES,
  STAFF_MESSAGES,
} from "@/features/staff/constants/staff.constants";
import {
  USER_CODES,
  USER_MESSAGES,
} from "@/features/users/constants/user.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenApiRecord = Record<string, unknown>;

/**
 * Wraps a successful endpoint payload in the shared API response shape.
 */
function successResponse(input: {
  codeExample: string;
  dataSchema: OpenApiRecord;
  messageExample: string;
}): OpenApiRecord {
  return {
    type: "object",
    required: ["success", "code", "message", "data"],
    properties: {
      success: { type: "boolean", example: true },
      code: { type: "string", example: input.codeExample },
      message: {
        type: "string",
        example: input.messageExample,
      },
      data: input.dataSchema,
    },
  };
}

/**
 * Describes the shared API error response shape.
 */
function errorResponse(): OpenApiRecord {
  return {
    type: "object",
    required: ["success", "code", "message", "data"],
    properties: {
      success: { type: "boolean", example: false },
      code: { type: "string", example: AUTH_CODES.VALIDATION_ERROR },
      message: {
        type: "string",
        example: AUTH_MESSAGES.INVALID_MOBILE,
      },
      data: { nullable: true, example: null },
    },
  };
}

const signupOtpDataSchema: OpenApiRecord = {
  type: "object",
  required: ["mobile", "retryAfter", "expiresAt"],
  properties: {
    mobile: { type: "string", example: "9876543210" },
    retryAfter: {
      type: "integer",
      example: AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS,
      description: "Seconds before OTP resend should be allowed.",
    },
    expiresAt: { type: "string", format: "date-time" },
    devOtp: {
      type: "string",
      nullable: true,
      example: "123456",
      description:
        "Returned only outside production for local testing before SMS integration.",
    },
  },
};

const authUserProperties: OpenApiRecord = {
  id: { type: "string", example: "cmokabtp40001fjw9ghgo2zv7" },
  mobile: { type: "string", example: "9876543210" },
  name: { type: "string", nullable: true, example: "Priya" },
  email: {
    type: "string",
    nullable: true,
    example: "priya@example.com",
  },
  role: { type: "string", example: "USER" },
  mobileVerifiedAt: { type: "string", format: "date-time" },
};

const authUserDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "mobile", "role", "mobileVerifiedAt"],
  properties: authUserProperties,
};

const profileUserDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "mobile", "role", "mobileVerifiedAt"],
  properties: {
    ...authUserProperties,
    avatarUrl: {
      type: "string",
      nullable: true,
      example: "https://cdn.example.com/avatar.jpg",
    },
    branchId: {
      type: "string",
      nullable: true,
      example: "cmokbranch0001",
    },
    profileCompletedAt: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
    notificationPreferences: {
      type: "object",
      additionalProperties: true,
      example: {
        bookingReminders: true,
        offers: true,
        whatsapp: true,
      },
    },
  },
};

const branchDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "nameHi",
    "city",
    "address",
    "phone",
    "openTime",
    "closeTime",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokbranch0001" },
    nameHi: { type: "string", example: "निखरता रूप जयपुर" },
    nameEn: {
      type: "string",
      nullable: true,
      example: "Nikharta Roop Jaipur",
    },
    city: { type: "string", example: "Jaipur" },
    address: { type: "string", example: "Main Road, Jaipur" },
    googleMapsUrl: {
      type: "string",
      nullable: true,
      example: "https://maps.google.com/?q=nikharta+roop+jaipur",
    },
    latitude: {
      type: "string",
      nullable: true,
      example: "26.9124000",
      description: "Stored as Decimal and serialized as string.",
    },
    longitude: {
      type: "string",
      nullable: true,
      example: "75.7873000",
      description: "Stored as Decimal and serialized as string.",
    },
    placeId: {
      type: "string",
      nullable: true,
      example: "ChIJ1234567890",
    },
    phone: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    openTime: {
      type: "string",
      example: "10:00:00",
      description: "Branch opening time in HH:mm:ss format.",
    },
    closeTime: {
      type: "string",
      example: "19:30:00",
      description: "Branch closing time in HH:mm:ss format.",
    },
    isActive: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const branchRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["nameHi", "city", "address", "phone", "openTime", "closeTime"],
  properties: {
    nameHi: {
      type: "string",
      minLength: 2,
      maxLength: 200,
      example: "निखरता रूप जयपुर",
    },
    nameEn: {
      type: "string",
      nullable: true,
      maxLength: 200,
      example: "Nikharta Roop Jaipur",
    },
    city: { type: "string", minLength: 2, maxLength: 100, example: "Jaipur" },
    address: {
      type: "string",
      minLength: 3,
      maxLength: 1000,
      example: "Main Road, Jaipur",
    },
    googleMapsUrl: {
      type: "string",
      nullable: true,
      format: "uri",
      example: "https://maps.google.com/?q=nikharta+roop+jaipur",
    },
    latitude: {
      type: "number",
      nullable: true,
      minimum: -90,
      maximum: 90,
      example: 26.9124,
      description: "Must be sent together with longitude.",
    },
    longitude: {
      type: "number",
      nullable: true,
      minimum: -180,
      maximum: 180,
      example: 75.7873,
      description: "Must be sent together with latitude.",
    },
    placeId: {
      type: "string",
      nullable: true,
      maxLength: 200,
      example: "ChIJ1234567890",
    },
    phone: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    openTime: {
      type: "string",
      pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$",
      example: "10:00",
    },
    closeTime: {
      type: "string",
      pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$",
      example: "19:30",
    },
    isActive: { type: "boolean", example: true },
  },
};

const branchPatchRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: branchRequestSchema.properties,
};

const branchHolidayDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "branchId", "date", "isClosed", "createdAt"],
  properties: {
    id: { type: "string", example: "cmokholiday0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    date: { type: "string", format: "date", example: "2026-05-10" },
    reasonHi: { type: "string", nullable: true, example: "त्योहार" },
    reasonEn: { type: "string", nullable: true, example: "Festival" },
    isClosed: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

const branchHolidayRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["date"],
  properties: {
    date: { type: "string", format: "date", example: "2026-05-10" },
    reasonHi: { type: "string", nullable: true, maxLength: 300 },
    reasonEn: { type: "string", nullable: true, maxLength: 300 },
    isClosed: { type: "boolean", default: true },
  },
};

const branchHolidayPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: branchHolidayRequestSchema.properties,
};

const serviceCategoryDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "nameHi",
    "nameEn",
    "slug",
    "sortOrder",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokcategory0001" },
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    nameHi: { type: "string", example: "बाल सेवाएं" },
    nameEn: { type: "string", example: "Hair Services" },
    slug: { type: "string", example: "hair-services" },
    description: {
      type: "string",
      nullable: true,
      example: "Hair cut, styling, color, and care services.",
    },
    sortOrder: { type: "integer", example: 10 },
    isActive: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const serviceDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "branchId",
    "categoryId",
    "nameHi",
    "nameEn",
    "slug",
    "descriptionHi",
    "price",
    "durationMinutes",
    "isActive",
    "branch",
    "category",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokservice0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", example: "cmokcategory0001" },
    nameHi: { type: "string", example: "हेयर कट" },
    nameEn: { type: "string", example: "Hair Cut" },
    slug: { type: "string", example: "hair-cut" },
    descriptionHi: { type: "string", example: "स्टाइलिश हेयर कट सेवा।" },
    descriptionEn: {
      type: "string",
      nullable: true,
      example: "Stylish hair cut service.",
    },
    price: {
      type: "string",
      example: "499.00",
      description: "Stored as Decimal and serialized as string.",
    },
    advanceAmount: {
      type: "string",
      nullable: true,
      example: "100.00",
      description: "Stored as Decimal and serialized as string.",
    },
    durationMinutes: { type: "integer", example: 45 },
    imageUrl: {
      type: "string",
      nullable: true,
      example: "https://cdn.example.com/services/hair-cut.jpg",
    },
    galleryUrls: {
      type: "array",
      items: { type: "string" },
      example: ["https://cdn.example.com/services/hair-cut-1.jpg"],
    },
    isActive: { type: "boolean", example: true },
    branch: {
      type: "object",
      required: ["id", "nameHi", "city"],
      properties: {
        id: { type: "string", example: "cmokbranch0001" },
        nameHi: { type: "string", example: "निखरता रूप जयपुर" },
        nameEn: { type: "string", nullable: true, example: "Nikharta Roop Jaipur" },
        city: { type: "string", example: "Jaipur" },
      },
    },
    category: serviceCategoryDataSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const serviceDetailDataSchema: OpenApiRecord = {
  allOf: [
    serviceDataSchema,
    {
      type: "object",
      required: ["variants", "addOns"],
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            required: [
              "id",
              "nameHi",
              "price",
              "durationMinutes",
              "sortOrder",
              "isActive",
            ],
            properties: {
              id: { type: "string", example: "cmokvariant0001" },
              nameHi: { type: "string", example: "लेयर कट" },
              nameEn: { type: "string", nullable: true, example: "Layer Cut" },
              descriptionHi: { type: "string", nullable: true },
              price: { type: "string", example: "699.00" },
              advanceAmount: { type: "string", nullable: true, example: "150.00" },
              durationMinutes: { type: "integer", example: 60 },
              sortOrder: { type: "integer", example: 1 },
              isActive: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
        addOns: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "nameHi", "price", "durationMinutes", "isActive"],
            properties: {
              id: { type: "string", example: "cmokaddon0001" },
              nameHi: { type: "string", example: "हेयर वॉश" },
              nameEn: { type: "string", nullable: true, example: "Hair Wash" },
              descriptionHi: { type: "string", nullable: true },
              price: { type: "string", example: "149.00" },
              durationMinutes: { type: "integer", example: 10 },
              isActive: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  ],
};

const adminServiceCategoryRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["nameHi", "nameEn", "slug"],
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", minLength: 2, maxLength: 200 },
    slug: { type: "string", example: "hair-services" },
    description: { type: "string", nullable: true, maxLength: 1000 },
    sortOrder: { type: "integer", minimum: 0, example: 10 },
    isActive: { type: "boolean", example: true },
  },
};

const adminServiceCategoryPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: adminServiceCategoryRequestSchema.properties,
};

const adminServiceRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: [
    "branchId",
    "categoryId",
    "nameHi",
    "nameEn",
    "slug",
    "descriptionHi",
    "price",
    "durationMinutes",
  ],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", example: "cmokcategory0001" },
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", minLength: 2, maxLength: 200 },
    slug: { type: "string", example: "hair-cut" },
    descriptionHi: { type: "string", minLength: 2, maxLength: 2000 },
    descriptionEn: { type: "string", nullable: true, maxLength: 2000 },
    price: { type: "number", minimum: 0, example: 499 },
    advanceAmount: { type: "number", nullable: true, minimum: 0, example: 100 },
    durationMinutes: { type: "integer", minimum: 5, maximum: 480, example: 45 },
    imageUrl: { type: "string", nullable: true, format: "uri" },
    galleryUrls: {
      type: "array",
      maxItems: 12,
      items: { type: "string", format: "uri" },
    },
    isActive: { type: "boolean", example: true },
  },
};

const adminServicePatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: adminServiceRequestSchema.properties,
};

const adminServiceVariantRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["nameHi", "price", "durationMinutes"],
  properties: {
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    descriptionHi: { type: "string", nullable: true, maxLength: 1000 },
    price: { type: "number", minimum: 0, example: 799 },
    advanceAmount: { type: "number", nullable: true, minimum: 0, example: 100 },
    durationMinutes: { type: "integer", minimum: 5, maximum: 480, example: 60 },
    sortOrder: { type: "integer", minimum: 0, example: 10 },
    isActive: { type: "boolean", example: true },
  },
};

const adminServiceVariantPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: adminServiceVariantRequestSchema.properties,
};

const adminServiceAddOnRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["nameHi", "price"],
  properties: {
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    descriptionHi: { type: "string", nullable: true, maxLength: 1000 },
    price: { type: "number", minimum: 0, example: 149 },
    durationMinutes: { type: "integer", minimum: 0, maximum: 240, example: 15 },
    isActive: { type: "boolean", example: true },
  },
};

const adminServiceAddOnPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: adminServiceAddOnRequestSchema.properties,
};

const packageServiceDataSchema: OpenApiRecord = {
  type: "object",
  required: ["serviceId", "quantity", "sortOrder", "service"],
  properties: {
    serviceId: { type: "string", example: "cmokservice0001" },
    quantity: { type: "integer", example: 1 },
    sortOrder: { type: "integer", example: 0 },
    service: {
      type: "object",
      required: ["id", "nameHi", "slug", "price", "durationMinutes"],
      properties: {
        id: { type: "string", example: "cmokservice0001" },
        nameHi: { type: "string", example: "हेयर कट" },
        nameEn: { type: "string", nullable: true, example: "Hair Cut" },
        slug: { type: "string", example: "hair-cut" },
        price: { type: "string", example: "499.00" },
        durationMinutes: { type: "integer", example: 45 },
        imageUrl: { type: "string", nullable: true, format: "uri" },
      },
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

const packageDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "branchId", "nameHi", "slug", "price", "isActive"],
  properties: {
    id: { type: "string", example: "cmokpackage0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", nullable: true, example: "cmokcategory0001" },
    nameHi: { type: "string", example: "ब्राइडल पैकेज" },
    nameEn: { type: "string", nullable: true, example: "Bridal Package" },
    slug: { type: "string", example: "bridal-package" },
    descriptionHi: { type: "string", nullable: true },
    descriptionEn: { type: "string", nullable: true },
    price: { type: "string", example: "4999.00" },
    advanceAmount: { type: "string", nullable: true, example: "1000.00" },
    durationMinutes: { type: "integer", nullable: true, example: 180 },
    imageUrl: { type: "string", nullable: true, format: "uri" },
    isCustom: { type: "boolean", example: false },
    isActive: { type: "boolean", example: true },
    branch: { type: "object", additionalProperties: true },
    category: { type: "object", nullable: true, additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const packageDetailDataSchema: OpenApiRecord = {
  allOf: [
    packageDataSchema,
    {
      type: "object",
      required: ["services"],
      properties: {
        services: { type: "array", items: packageServiceDataSchema },
      },
    },
  ],
};

const packageServiceRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["serviceId"],
  properties: {
    serviceId: { type: "string", example: "cmokservice0001" },
    quantity: { type: "integer", minimum: 1, maximum: 50, default: 1 },
    sortOrder: { type: "integer", minimum: 0, default: 0 },
  },
};

const adminPackageRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["branchId", "nameHi", "slug", "price"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", nullable: true, example: "cmokcategory0001" },
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    slug: { type: "string", example: "bridal-package" },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    descriptionEn: { type: "string", nullable: true, maxLength: 2000 },
    price: { type: "number", minimum: 0, example: 4999 },
    advanceAmount: { type: "number", nullable: true, minimum: 0, example: 1000 },
    durationMinutes: { type: "integer", nullable: true, minimum: 5 },
    imageUrl: { type: "string", nullable: true, format: "uri" },
    isCustom: { type: "boolean", example: false },
    isActive: { type: "boolean", example: true },
    services: { type: "array", maxItems: 30, items: packageServiceRequestSchema },
  },
};

const adminPackagePatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", nullable: true, example: "cmokcategory0001" },
    nameHi: { type: "string", minLength: 2, maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    slug: { type: "string", example: "bridal-package" },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    descriptionEn: { type: "string", nullable: true, maxLength: 2000 },
    price: { type: "number", minimum: 0, example: 4999 },
    advanceAmount: { type: "number", nullable: true, minimum: 0, example: 1000 },
    durationMinutes: { type: "integer", nullable: true, minimum: 5 },
    imageUrl: { type: "string", nullable: true, format: "uri" },
    isCustom: { type: "boolean", example: false },
    isActive: { type: "boolean", example: true },
  },
};

const consultationDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "userId", "branchId", "status", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", example: "cmokconsult0001" },
    userId: { type: "string", example: "cmokuser0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    staffId: { type: "string", nullable: true, example: "cmokstaff0001" },
    packageId: { type: "string", nullable: true, example: "cmokpackage0001" },
    preferredDate: { type: "string", format: "date", nullable: true },
    preferredTime: { type: "string", nullable: true, example: "11:30:00" },
    status: {
      type: "string",
      enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"],
      example: "REQUESTED",
    },
    notes: { type: "string", nullable: true },
    adminNotes: { type: "string", nullable: true },
    completedAt: { type: "string", format: "date-time", nullable: true },
    cancelledAt: { type: "string", format: "date-time", nullable: true },
    branch: { type: "object", nullable: true, additionalProperties: true },
    staff: { type: "object", nullable: true, additionalProperties: true },
    package: { type: "object", nullable: true, additionalProperties: true },
    user: { type: "object", nullable: true, additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const createConsultationRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["branchId"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    staffId: { type: "string", example: "cmokstaff0001" },
    packageId: { type: "string", example: "cmokpackage0001" },
    preferredDate: { type: "string", format: "date", example: "2026-05-10" },
    preferredTime: { type: "string", example: "11:30" },
    notes: { type: "string", nullable: true, maxLength: 1000 },
  },
};

const adminConsultationPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    staffId: { type: "string", example: "cmokstaff0001" },
    packageId: { type: "string", example: "cmokpackage0001" },
    preferredDate: { type: "string", format: "date", example: "2026-05-10" },
    preferredTime: { type: "string", example: "11:30" },
    status: {
      type: "string",
      enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"],
    },
    adminNotes: { type: "string", nullable: true, maxLength: 1000 },
  },
};

const offerDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "code",
    "titleHi",
    "discountType",
    "discountValue",
    "validFrom",
    "validUntil",
    "isActive",
  ],
  properties: {
    id: { type: "string", example: "cmokoffer0001" },
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    code: { type: "string", example: "BRIDAL10" },
    titleHi: { type: "string", example: "ब्राइडल ऑफर" },
    titleEn: { type: "string", nullable: true, example: "Bridal Offer" },
    descriptionHi: { type: "string", nullable: true },
    discountType: { type: "string", enum: ["PERCENTAGE", "FLAT_AMOUNT"] },
    discountValue: { type: "string", example: "10.00" },
    minOrder: { type: "string", nullable: true, example: "999.00" },
    maxDiscount: { type: "string", nullable: true, example: "500.00" },
    usageLimit: { type: "integer", nullable: true, example: 100 },
    usageCount: { type: "integer", example: 0 },
    perUserLimit: { type: "integer", nullable: true, example: 1 },
    validFrom: { type: "string", format: "date-time" },
    validUntil: { type: "string", format: "date-time" },
    isActive: { type: "boolean", example: true },
    branch: { type: "object", nullable: true, additionalProperties: true },
    services: { type: "array", items: { type: "object" } },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const validateOfferRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["branchId", "code", "orderAmount"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    code: { type: "string", example: "BRIDAL10" },
    orderAmount: { type: "number", minimum: 0, example: 4999 },
    serviceIds: { type: "array", items: { type: "string" } },
  },
};

const adminOfferRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: [
    "code",
    "titleHi",
    "discountType",
    "discountValue",
    "validFrom",
    "validUntil",
  ],
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    code: { type: "string", example: "BRIDAL10" },
    titleHi: { type: "string", minLength: 2, maxLength: 200 },
    titleEn: { type: "string", nullable: true, maxLength: 200 },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    discountType: { type: "string", enum: ["PERCENTAGE", "FLAT_AMOUNT"] },
    discountValue: { type: "number", minimum: 0, example: 10 },
    minOrder: { type: "number", nullable: true, minimum: 0, example: 999 },
    maxDiscount: { type: "number", nullable: true, minimum: 0, example: 500 },
    usageLimit: { type: "integer", nullable: true, minimum: 1 },
    perUserLimit: { type: "integer", nullable: true, minimum: 1 },
    validFrom: { type: "string", format: "date-time" },
    validUntil: { type: "string", format: "date-time" },
    isActive: { type: "boolean", example: true },
    serviceIds: { type: "array", maxItems: 100, items: { type: "string" } },
  },
};

const adminOfferPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    code: { type: "string", example: "BRIDAL10" },
    titleHi: { type: "string", minLength: 2, maxLength: 200 },
    titleEn: { type: "string", nullable: true, maxLength: 200 },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    discountType: { type: "string", enum: ["PERCENTAGE", "FLAT_AMOUNT"] },
    discountValue: { type: "number", minimum: 0, example: 10 },
    minOrder: { type: "number", nullable: true, minimum: 0, example: 999 },
    maxDiscount: { type: "number", nullable: true, minimum: 0, example: 500 },
    usageLimit: { type: "integer", nullable: true, minimum: 1 },
    perUserLimit: { type: "integer", nullable: true, minimum: 1 },
    validFrom: { type: "string", format: "date-time" },
    validUntil: { type: "string", format: "date-time" },
    isActive: { type: "boolean", example: true },
  },
};

const offerServiceRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["serviceId"],
  properties: {
    serviceId: { type: "string", example: "cmokservice0001" },
  },
};

const portfolioDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "branchId", "imageUrls", "isFeatured", "isPublished"],
  properties: {
    id: { type: "string", example: "cmokportfolio0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    staffId: { type: "string", nullable: true, example: "cmokstaff0001" },
    serviceId: { type: "string", nullable: true, example: "cmokservice0001" },
    packageId: { type: "string", nullable: true, example: "cmokpackage0001" },
    titleHi: { type: "string", nullable: true, example: "ब्राइडल मेकअप" },
    descriptionHi: { type: "string", nullable: true },
    beforeImageUrl: { type: "string", nullable: true },
    afterImageUrl: { type: "string", nullable: true },
    imageUrls: {
      type: "array",
      items: { type: "string" },
      example: ["https://cdn.example.com/look.jpg"],
    },
    isFeatured: { type: "boolean", example: true },
    isPublished: { type: "boolean", example: true },
    sortOrder: { type: "integer", example: 10 },
    branch: { type: "object", nullable: true, additionalProperties: true },
    staff: { type: "object", nullable: true, additionalProperties: true },
    service: { type: "object", nullable: true, additionalProperties: true },
    package: { type: "object", nullable: true, additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const adminPortfolioRequestSchema: OpenApiRecord = {
  type: "object",
  required: ["branchId"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    staffId: { type: "string", nullable: true, example: "cmokstaff0001" },
    serviceId: { type: "string", nullable: true, example: "cmokservice0001" },
    packageId: { type: "string", nullable: true, example: "cmokpackage0001" },
    titleHi: { type: "string", nullable: true, maxLength: 200 },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    beforeImageUrl: { type: "string", nullable: true },
    afterImageUrl: { type: "string", nullable: true },
    imageUrls: { type: "array", items: { type: "string" }, maxItems: 20 },
    isFeatured: { type: "boolean", default: false },
    isPublished: { type: "boolean", default: true },
    sortOrder: { type: "integer", minimum: 0, maximum: 100000 },
  },
};

const adminPortfolioPatchSchema: OpenApiRecord = {
  ...adminPortfolioRequestSchema,
  required: undefined,
  minProperties: 1,
};

const blogCategoryDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "nameHi", "slug", "isActive", "sortOrder"],
  properties: {
    id: { type: "string", example: "cmokblogcat0001" },
    nameHi: { type: "string", example: "ब्यूटी टिप्स" },
    nameEn: { type: "string", nullable: true, example: "Beauty Tips" },
    slug: { type: "string", example: "beauty-tips" },
    description: { type: "string", nullable: true },
    sortOrder: { type: "integer", example: 10 },
    isActive: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const blogDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "categoryId", "titleHi", "slug", "contentHi", "status"],
  properties: {
    id: { type: "string", example: "cmokblog0001" },
    categoryId: { type: "string", example: "cmokblogcat0001" },
    authorId: { type: "string", nullable: true, example: "cmokuser0001" },
    titleHi: { type: "string", example: "ब्राइडल मेकअप गाइड" },
    titleEn: { type: "string", nullable: true, example: "Bridal Makeup Guide" },
    slug: { type: "string", example: "bridal-makeup-guide" },
    excerptHi: { type: "string", nullable: true },
    contentHi: { type: "string" },
    coverImageUrl: { type: "string", nullable: true },
    status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
    publishedAt: { type: "string", format: "date-time", nullable: true },
    category: blogCategoryDataSchema,
    author: { type: "object", nullable: true, additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const adminBlogCategoryRequestSchema: OpenApiRecord = {
  type: "object",
  required: ["nameHi", "slug"],
  properties: {
    nameHi: { type: "string", maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    slug: { type: "string", example: "beauty-tips", maxLength: 220 },
    description: { type: "string", nullable: true, maxLength: 2000 },
    sortOrder: { type: "integer", minimum: 0, maximum: 100000 },
    isActive: { type: "boolean", default: true },
  },
};

const adminBlogPostRequestSchema: OpenApiRecord = {
  type: "object",
  required: ["categoryId", "titleHi", "slug", "contentHi"],
  properties: {
    categoryId: { type: "string", example: "cmokblogcat0001" },
    titleHi: { type: "string", maxLength: 240 },
    titleEn: { type: "string", nullable: true, maxLength: 240 },
    slug: { type: "string", example: "bridal-makeup-guide", maxLength: 260 },
    excerptHi: { type: "string", nullable: true, maxLength: 1000 },
    contentHi: { type: "string", minLength: 10 },
    coverImageUrl: { type: "string", nullable: true },
    status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
    publishedAt: { type: "string", format: "date-time", nullable: true },
  },
};

const adminBlogPatchSchema: OpenApiRecord = {
  ...adminBlogPostRequestSchema,
  required: undefined,
  minProperties: 1,
};

const productCategoryDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "nameHi", "slug", "slugScope", "isActive"],
  properties: {
    id: { type: "string", example: "cmokproductcat0001" },
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    slugScope: { type: "string", example: "global" },
    nameHi: { type: "string", example: "हेयर केयर" },
    nameEn: { type: "string", nullable: true, example: "Hair Care" },
    slug: { type: "string", example: "hair-care" },
    description: { type: "string", nullable: true },
    isActive: { type: "boolean", example: true },
    branch: { type: "object", nullable: true, additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const productDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "branchId", "nameHi", "slug", "price", "stockQuantity"],
  properties: {
    id: { type: "string", example: "cmokproduct0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", nullable: true, example: "cmokproductcat0001" },
    nameHi: { type: "string", example: "शैम्पू" },
    nameEn: { type: "string", nullable: true, example: "Shampoo" },
    slug: { type: "string", example: "shampoo" },
    descriptionHi: { type: "string", nullable: true },
    price: { type: "string", example: "299.00" },
    stockQuantity: { type: "integer", example: 10 },
    imageUrl: { type: "string", nullable: true },
    isActive: { type: "boolean", example: true },
    branch: { type: "object", additionalProperties: true },
    category: { ...productCategoryDataSchema, nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const adminProductCategoryRequestSchema: OpenApiRecord = {
  type: "object",
  required: ["nameHi", "slug"],
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    nameHi: { type: "string", maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    slug: { type: "string", example: "hair-care", maxLength: 220 },
    description: { type: "string", nullable: true, maxLength: 2000 },
    isActive: { type: "boolean", default: true },
  },
};

const adminProductRequestSchema: OpenApiRecord = {
  type: "object",
  required: ["branchId", "nameHi", "slug", "price"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    categoryId: { type: "string", nullable: true, example: "cmokproductcat0001" },
    nameHi: { type: "string", maxLength: 200 },
    nameEn: { type: "string", nullable: true, maxLength: 200 },
    slug: { type: "string", example: "shampoo", maxLength: 220 },
    descriptionHi: { type: "string", nullable: true, maxLength: 2000 },
    price: { type: "number", example: 299 },
    stockQuantity: { type: "integer", minimum: 0, default: 0 },
    imageUrl: { type: "string", nullable: true },
    isActive: { type: "boolean", default: true },
  },
};

const adminProductPatchSchema: OpenApiRecord = {
  ...adminProductRequestSchema,
  required: undefined,
  minProperties: 1,
};

const staffDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "userId", "branchId", "name", "isAvailable"],
  properties: {
    id: { type: "string", example: "cmokstaff0001" },
    userId: { type: "string", example: "cmokuser0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    name: { type: "string", nullable: true, example: "Anjali" },
    specialization: { type: "array", items: { type: "string" } },
    experienceYears: { type: "integer", nullable: true, example: 5 },
    bioHi: { type: "string", nullable: true },
    bioEn: { type: "string", nullable: true },
    photoUrl: { type: "string", nullable: true },
    rating: { type: "string", example: "4.80" },
    isAvailable: { type: "boolean", example: true },
    workDays: { type: "array", items: { type: "integer" } },
    workStart: { type: "string", example: "10:00:00" },
    workEnd: { type: "string", example: "19:00:00" },
    services: { type: "array", items: { type: "object" } },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const adminStaffRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["userId", "branchId", "workStart", "workEnd"],
  properties: {
    userId: { type: "string", example: "cmokuser0001" },
    branchId: { type: "string", example: "cmokbranch0001" },
    specialization: { type: "array", items: { type: "string" } },
    experienceYears: { type: "integer", nullable: true, minimum: 0 },
    bioHi: { type: "string", nullable: true },
    bioEn: { type: "string", nullable: true },
    photoUrl: { type: "string", nullable: true, format: "uri" },
    isAvailable: { type: "boolean", example: true },
    workDays: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } },
    workStart: { type: "string", example: "10:00" },
    workEnd: { type: "string", example: "19:00" },
    serviceIds: { type: "array", items: { type: "string" } },
  },
};

const adminStaffPatchSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: adminStaffRequestSchema.properties,
};

const staffLeaveRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["startsAt", "endsAt"],
  properties: {
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    reason: { type: "string", nullable: true, maxLength: 300 },
  },
};

const reviewDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "bookingId", "rating", "isApproved", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", example: "cmokreview0001" },
    bookingId: { type: "string", example: "cmokbooking0001" },
    rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
    commentHi: { type: "string", nullable: true },
    photoUrls: { type: "array", items: { type: "string", format: "uri" } },
    isApproved: { type: "boolean", example: true },
    user: { type: "object", nullable: true },
    service: { type: "object", nullable: true },
    staff: { type: "object", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const createReviewRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["rating"],
  properties: {
    rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
    commentHi: { type: "string", nullable: true, maxLength: 1000 },
    photoUrls: {
      type: "array",
      maxItems: 6,
      items: { type: "string", format: "uri" },
    },
  },
};

const updateReviewModerationRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["isApproved"],
  properties: {
    isApproved: { type: "boolean", example: false },
  },
};

const avatarDataSchema: OpenApiRecord = {
  type: "object",
  required: ["avatarUrl", "user"],
  properties: {
    avatarUrl: {
      type: "string",
      nullable: true,
      example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    },
    user: profileUserDataSchema,
  },
};

const addressDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "line1", "city", "isDefault", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", example: "cmokaddress0001" },
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    label: { type: "string", nullable: true, example: "Home" },
    recipientName: { type: "string", nullable: true, example: "Priya" },
    mobile: { type: "string", nullable: true, example: "9876543210" },
    line1: { type: "string", example: "House 24, Main Road" },
    line2: { type: "string", nullable: true, example: "Near market" },
    landmark: { type: "string", nullable: true, example: "City Mall" },
    city: { type: "string", example: "Jaipur" },
    state: { type: "string", nullable: true, example: "Rajasthan" },
    postalCode: { type: "string", nullable: true, example: "302001" },
    latitude: {
      type: "string",
      nullable: true,
      example: "26.9124000",
      description: "Stored as Decimal and serialized as string.",
    },
    longitude: {
      type: "string",
      nullable: true,
      example: "75.7873000",
      description: "Stored as Decimal and serialized as string.",
    },
    isDefault: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const addressRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["line1", "city"],
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    label: { type: "string", nullable: true, maxLength: 80, example: "Home" },
    recipientName: {
      type: "string",
      nullable: true,
      maxLength: 100,
      example: "Priya",
    },
    mobile: {
      type: "string",
      nullable: true,
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    line1: { type: "string", minLength: 3, maxLength: 240 },
    line2: { type: "string", nullable: true, maxLength: 240 },
    landmark: { type: "string", nullable: true, maxLength: 200 },
    city: { type: "string", minLength: 2, maxLength: 100, example: "Jaipur" },
    state: { type: "string", nullable: true, maxLength: 100 },
    postalCode: { type: "string", nullable: true, maxLength: 12 },
    latitude: {
      type: "number",
      nullable: true,
      minimum: -90,
      maximum: 90,
      description: "Accepted as number; returned as Decimal string.",
    },
    longitude: {
      type: "number",
      nullable: true,
      minimum: -180,
      maximum: 180,
      description: "Accepted as number; returned as Decimal string.",
    },
    isDefault: { type: "boolean", example: true },
  },
};

const addressPatchRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: addressRequestSchema.properties,
};

const bookingHistoryItemSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "displayId",
    "bookingDate",
    "slotStart",
    "slotEnd",
    "status",
    "totalAmount",
    "branch",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokbooking0001" },
    displayId: { type: "string", example: "NR-2026-0001" },
    bookingDate: { type: "string", format: "date-time" },
    slotStart: { type: "string", format: "date-time" },
    slotEnd: { type: "string", format: "date-time" },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      example: "CONFIRMED",
    },
    totalAmount: { type: "string", example: "1200.00" },
    branch: {
      type: "object",
      required: ["id", "nameHi", "city"],
      properties: {
        id: { type: "string" },
        nameHi: { type: "string", example: "निखरता रूप जयपुर" },
        nameEn: { type: "string", nullable: true, example: "Nikharta Roop Jaipur" },
        city: { type: "string", example: "Jaipur" },
      },
    },
    service: { type: "object", nullable: true },
    serviceVariant: { type: "object", nullable: true },
    package: { type: "object", nullable: true },
    staff: { type: "object", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const bookingSlotDataSchema: OpenApiRecord = {
  type: "object",
  required: ["startTime", "endTime", "available", "availableStaffCount"],
  properties: {
    startTime: {
      type: "string",
      example: "10:00:00",
      description: "Slot start time in HH:mm:ss format.",
    },
    endTime: {
      type: "string",
      example: "10:45:00",
      description: "Slot end time in HH:mm:ss format.",
    },
    available: { type: "boolean", example: true },
    availableStaffCount: {
      type: "integer",
      example: 2,
      description: "Number of qualified staff available for this slot.",
    },
  },
};

const bookingDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "displayId",
    "bookingDate",
    "slotStart",
    "slotEnd",
    "status",
    "totalAmount",
    "branch",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokbooking0001" },
    displayId: { type: "string", example: "NR20260503A1B2C3" },
    bookingDate: { type: "string", format: "date-time" },
    slotStart: { type: "string", format: "date-time" },
    slotEnd: { type: "string", format: "date-time" },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      example: "PENDING",
    },
    totalAmount: { type: "string", example: "799.00" },
    advanceAmount: { type: "string", nullable: true, example: "100.00" },
    discountAmount: { type: "string", example: "0.00" },
    notes: { type: "string", nullable: true, example: "Prefer quiet room." },
    pendingExpiresAt: { type: "string", format: "date-time", nullable: true },
    cancelledAt: { type: "string", format: "date-time", nullable: true },
    cancellationReason: { type: "string", nullable: true },
    checkedInAt: { type: "string", format: "date-time", nullable: true },
    completedAt: { type: "string", format: "date-time", nullable: true },
    branch: {
      type: "object",
      required: ["id", "nameHi", "city"],
      properties: {
        id: { type: "string", example: "cmokbranch0001" },
        nameHi: { type: "string", example: "निखरता रूप जयपुर" },
        nameEn: { type: "string", nullable: true, example: "Nikharta Roop Jaipur" },
        city: { type: "string", example: "Jaipur" },
      },
    },
    service: { type: "object", nullable: true },
    serviceVariant: { type: "object", nullable: true },
    staff: { type: "object", nullable: true },
    addOns: { type: "array", items: { type: "object" } },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const createBookingRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["branchId", "serviceId", "bookingDate", "slotStart"],
  properties: {
    branchId: { type: "string", example: "cmokbranch0001" },
    serviceId: { type: "string", example: "cmokservice0001" },
    serviceVariantId: {
      type: "string",
      nullable: true,
      example: "cmokvariant0001",
    },
    staffId: { type: "string", nullable: true, example: "cmokstaff0001" },
    bookingDate: { type: "string", format: "date", example: "2026-05-10" },
    slotStart: { type: "string", example: "10:00:00" },
    notes: { type: "string", nullable: true, maxLength: 500 },
    addOns: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        required: ["addOnId"],
        properties: {
          addOnId: { type: "string", example: "cmokaddon0001" },
          quantity: { type: "integer", minimum: 1, maximum: 10, example: 1 },
        },
      },
    },
  },
};

const rescheduleBookingRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["bookingDate", "slotStart"],
  properties: {
    bookingDate: { type: "string", format: "date", example: "2026-05-11" },
    slotStart: { type: "string", example: "14:00:00" },
    staffId: { type: "string", nullable: true, example: "cmokstaff0001" },
  },
};

const cancelBookingRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  properties: {
    reason: {
      type: "string",
      nullable: true,
      maxLength: 300,
      example: "Customer requested cancellation.",
    },
  },
};

const refundDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "status", "amount", "requestedAt", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", example: "cmokrefund0001" },
    status: {
      type: "string",
      enum: ["REQUESTED", "PROCESSING", "SUCCEEDED", "FAILED"],
      example: "REQUESTED",
    },
    amount: { type: "string", example: "499.00" },
    reason: { type: "string", nullable: true, example: "Customer cancelled." },
    providerRefundId: { type: "string", nullable: true },
    requestedAt: { type: "string", format: "date-time" },
    processedAt: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const paymentDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "bookingId",
    "provider",
    "status",
    "currency",
    "amount",
    "amountPaid",
    "amountRefunded",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokpayment0001" },
    bookingId: { type: "string", example: "cmokbooking0001" },
    provider: {
      type: "string",
      enum: ["RAZORPAY", "CASH", "UPI_OFFLINE"],
      example: "RAZORPAY",
    },
    providerOrderId: { type: "string", nullable: true, example: "razorpay_123" },
    providerPaymentId: { type: "string", nullable: true, example: "pay_123" },
    status: {
      type: "string",
      enum: [
        "CREATED",
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      example: "CREATED",
    },
    currency: { type: "string", example: "INR" },
    amount: { type: "string", example: "499.00" },
    amountPaid: { type: "string", example: "0.00" },
    amountRefunded: { type: "string", example: "0.00" },
    paymentUrl: { type: "string", nullable: true },
    paidAt: { type: "string", format: "date-time", nullable: true },
    refundedAt: { type: "string", format: "date-time", nullable: true },
    refunds: {
      type: "array",
      items: refundDataSchema,
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const createPaymentRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  properties: {
    provider: {
      type: "string",
      enum: ["RAZORPAY"],
      default: "RAZORPAY",
    },
  },
};

const verifyPaymentRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["providerOrderId", "providerPaymentId"],
  properties: {
    providerOrderId: { type: "string", example: "razorpay_123" },
    providerPaymentId: { type: "string", example: "pay_123" },
    signature: {
      type: "string",
      description:
        "Required in production for Razorpay HMAC verification.",
      example: "d6f4...",
    },
  },
};

const createRefundRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  properties: {
    amount: {
      type: "number",
      example: 499,
      description: "Defaults to the remaining refundable amount.",
    },
    reason: {
      type: "string",
      nullable: true,
      maxLength: 300,
      example: "Customer cancelled booking.",
    },
  },
};

const authSessionDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "expiresAt", "user"],
  properties: {
    id: { type: "string", example: "cmokabtp40002fjw9v6ehw21x" },
    expiresAt: { type: "string", format: "date-time" },
    user: authUserDataSchema,
  },
};

const signupVerifyDataSchema: OpenApiRecord = {
  type: "object",
  required: ["user", "session", "accessToken", "refreshToken"],
  properties: {
    accessToken: {
      type: "string",
      description:
        "Opaque bearer token for protected APIs. Also set as an HttpOnly cookie for browser clients.",
    },
    user: authUserDataSchema,
    session: authSessionDataSchema,
    sessionToken: {
      type: "string",
      deprecated: true,
      description:
        "Legacy alias for accessToken. New clients should use accessToken.",
    },
    refreshToken: {
      type: "string",
      description:
        "Opaque refresh token. Also set as an HttpOnly cookie for browser clients.",
    },
  },
};

const mobileRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["mobile"],
  properties: {
    mobile: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
  },
};

const otpRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["mobile", "otp"],
  properties: {
    mobile: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    otp: {
      type: "string",
      pattern: "^\\d{6}$",
      example: "123456",
    },
  },
};

const refreshRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["refreshToken"],
  properties: {
    refreshToken: {
      type: "string",
      example: "opaque-refresh-token",
    },
  },
};

const sessionsDataSchema: OpenApiRecord = {
  type: "object",
  required: ["currentSessionId", "sessions", "user"],
  properties: {
    currentSessionId: { type: "string" },
    user: authUserDataSchema,
    sessions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "expiresAt", "createdAt"],
        properties: {
          id: { type: "string" },
          deviceName: { type: "string", nullable: true },
          ipAddress: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const sessionIdDataSchema: OpenApiRecord = {
  type: "object",
  required: ["sessionId"],
  properties: {
    sessionId: { type: "string" },
  },
};

/**
 * Creates an OpenAPI JSON endpoint definition.
 */
function jsonEndpoint(input: {
  description: string;
  failureDescription?: string;
  method?: "delete" | "get" | "patch" | "post";
  parameters?: OpenApiRecord[];
  requestSchema?: OpenApiRecord;
  requestBodyRequired?: boolean;
  requiresAuth?: boolean;
  responseSchema: OpenApiRecord;
  successCode: string;
  successDescription?: string;
  successMessage: string;
  successStatus?: number;
  summary: string;
  tag?: string;
}): OpenApiRecord {
  const method = input.method ?? "post";
  const successStatus = input.successStatus ?? HTTP_STATUS.CREATED;

  return {
    [method]: {
      tags: [input.tag ?? "Auth"],
      summary: input.summary,
      description: input.description,
      ...(input.requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
      ...(input.parameters ? { parameters: input.parameters } : {}),
      ...(input.requestSchema
        ? {
            requestBody: {
              required: input.requestBodyRequired ?? true,
              content: {
                "application/json": {
                  schema: input.requestSchema,
                },
              },
            },
          }
        : {}),
      responses: {
        [successStatus]: {
          description: input.successDescription ?? "Success.",
          content: {
            "application/json": {
              schema: successResponse({
                codeExample: input.successCode,
                dataSchema: input.responseSchema,
                messageExample: input.successMessage,
              }),
            },
          },
        },
        [HTTP_STATUS.TOO_MANY_REQUESTS]: {
          description: "OTP resend cooldown is active.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.CONFLICT]: {
          description: "Account already exists.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.GONE]: {
          description: "OTP is missing or expired.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.LOCKED]: {
          description: "OTP attempts are locked.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.UNAUTHORIZED]: {
          description: "OTP is invalid.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
          description: "Request validation failed.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
          description: input.failureDescription ?? "Registration failed.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
      },
    },
  };
}

/**
 * Builds repeated admin booking status action documentation.
 */
function adminBookingStatusEndpoint(summary: string, description: string) {
  return jsonEndpoint({
    method: "patch",
    tag: "Admin",
    summary,
    description,
    failureDescription: "Booking status update failed.",
    requiresAuth: true,
    parameters: [
      {
        name: "bookingId",
        in: "path",
        required: true,
        schema: { type: "string", example: "cmokbooking0001" },
      },
    ],
    responseSchema: {
      type: "object",
      required: ["booking"],
      properties: { booking: bookingDataSchema },
    },
    successCode: BOOKING_CODES.BOOKING_STATUS_UPDATED,
    successDescription: "Booking status updated.",
    successMessage: BOOKING_MESSAGES.BOOKING_STATUS_UPDATED,
    successStatus: HTTP_STATUS.OK,
  });
}

/**
 * Returns the static OpenAPI document used by Swagger UI.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json(
    {
      openapi: "3.1.0",
      info: {
        title: "Nikharta Roop API",
        version: "1.0.0",
        description:
          "Mobile-first API for Nikharta Roop. Endpoints are grouped by flow: Auth first, then User, then future modules.",
      },
      tags: [
        {
          name: "Auth",
          description: "OTP signup/login, sessions, refresh, logout.",
        },
        {
          name: "User",
          description: "Current user profile, avatar, addresses, and history.",
        },
        {
          name: "Branches",
          description: "Public branch discovery and branch selection.",
        },
        {
          name: "Services",
          description: "Public service categories, service lists, and details.",
        },
        {
          name: "Packages",
          description: "Public package discovery and package details.",
        },
        {
          name: "Consultations",
          description: "Consultation requests and follow-up scheduling.",
        },
        {
          name: "Offers",
          description: "Coupons, discounts, and offer validation.",
        },
        {
          name: "Portfolio",
          description: "Before/after gallery and featured salon work.",
        },
        {
          name: "Blogs",
          description: "Public editorial content and admin blog management.",
        },
        {
          name: "Products",
          description: "Retail product discovery and admin product management.",
        },
        {
          name: "Staff",
          description: "Public staff discovery and staff detail endpoints.",
        },
        {
          name: "Bookings",
          description: "Booking availability, creation, and lifecycle endpoints.",
        },
        {
          name: "Payments",
          description: "Booking payments, verification, and refund requests.",
        },
        {
          name: "Reviews",
          description: "Booking reviews and public rating feeds.",
        },
        {
          name: "Admin",
          description: "Admin-only operations for managing business data.",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      servers: [{ url: origin }],
      paths: {
        "/api/v1/auth/register": jsonEndpoint({
          summary: "Register",
          description:
            "Start signup by sending an OTP to a 10-digit Indian mobile number. This endpoint does not create a user, select a branch, upload an avatar, or set a password.",
          requestSchema: {
            type: "object",
            additionalProperties: false,
            required: ["mobile"],
            properties: {
              mobile: {
                type: "string",
                pattern: "^[6-9]\\d{9}$",
                example: "9876543210",
              },
              name: {
                type: "string",
                minLength: 2,
                maxLength: 100,
                example: "Priya",
              },
              email: {
                type: "string",
                format: "email",
                maxLength: 150,
                example: "priya@example.com",
              },
            },
          },
          responseSchema: signupOtpDataSchema,
          successCode: AUTH_CODES.SIGNUP_OTP_SENT,
          successDescription: "Signup OTP challenge created.",
          successMessage: AUTH_MESSAGES.SIGNUP_OTP_SENT,
        }),
        "/api/v1/auth/register/verify": jsonEndpoint({
          summary: "Verify registration OTP",
          description:
            "Verify the signup OTP, create the user account, mark the mobile number as verified, and start an auth session.",
          failureDescription: "Signup OTP verification failed.",
          requestSchema: {
            type: "object",
            additionalProperties: false,
            required: ["mobile", "otp"],
            properties: {
              mobile: {
                type: "string",
                pattern: "^[6-9]\\d{9}$",
                example: "9876543210",
              },
              otp: {
                type: "string",
                pattern: "^\\d{6}$",
                example: "123456",
              },
            },
          },
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.SIGNUP_COMPLETED,
          successDescription: "Account created and session started.",
          successMessage: AUTH_MESSAGES.SIGNUP_COMPLETED,
        }),
        "/api/v1/auth/login": jsonEndpoint({
          summary: "Login",
          description:
            "Send a login OTP to an existing active user. This endpoint never creates a user.",
          failureDescription: "Login OTP request failed.",
          requestSchema: mobileRequestSchema,
          responseSchema: signupOtpDataSchema,
          successCode: AUTH_CODES.LOGIN_OTP_SENT,
          successDescription: "Login OTP challenge created.",
          successMessage: AUTH_MESSAGES.LOGIN_OTP_SENT,
        }),
        "/api/v1/auth/login/verify": jsonEndpoint({
          summary: "Verify login OTP",
          description:
            "Verify the login OTP and create a new auth session for the existing user.",
          failureDescription: "Login OTP verification failed.",
          requestSchema: otpRequestSchema,
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.LOGIN_COMPLETED,
          successDescription: "Login session created.",
          successMessage: AUTH_MESSAGES.LOGIN_COMPLETED,
        }),
        "/api/v1/auth/refresh": jsonEndpoint({
          summary: "Refresh session",
          description:
            "Rotate the refresh token and issue a fresh access token. Browser clients can rely on the HttpOnly refresh cookie; API clients can send refreshToken in the JSON body.",
          failureDescription: "Session refresh failed.",
          requestSchema: refreshRequestSchema,
          requestBodyRequired: false,
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.SESSION_REFRESHED,
          successDescription: "Session refreshed.",
          successMessage: AUTH_MESSAGES.SESSION_REFRESHED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/me": jsonEndpoint({
          method: "get",
          summary: "Current user",
          description: "Return the current authenticated user.",
          requiresAuth: true,
          responseSchema: {
            type: "object",
            required: ["user"],
            properties: {
              user: authUserDataSchema,
            },
          },
          successCode: AUTH_CODES.ME_LOADED,
          successDescription: "Current user loaded.",
          successMessage: AUTH_MESSAGES.ME_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/logout": jsonEndpoint({
          summary: "Logout",
          description: "Revoke the current auth session.",
          requiresAuth: true,
          responseSchema: sessionIdDataSchema,
          successCode: AUTH_CODES.LOGOUT_COMPLETED,
          successDescription: "Current session revoked.",
          successMessage: AUTH_MESSAGES.LOGOUT_COMPLETED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/sessions": jsonEndpoint({
          method: "get",
          summary: "List sessions",
          description: "List active sessions for the current authenticated user.",
          requiresAuth: true,
          responseSchema: sessionsDataSchema,
          successCode: AUTH_CODES.SESSIONS_LOADED,
          successDescription: "Active sessions loaded.",
          successMessage: AUTH_MESSAGES.SESSIONS_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/sessions/{sessionId}": jsonEndpoint({
          method: "delete",
          summary: "Revoke session",
          description: "Revoke one active session owned by the current user.",
          requiresAuth: true,
          responseSchema: sessionIdDataSchema,
          successCode: AUTH_CODES.SESSION_REVOKED,
          successDescription: "Session revoked.",
          successMessage: AUTH_MESSAGES.SESSION_REVOKED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/users/me/profile": {
          ...jsonEndpoint({
            method: "get",
            tag: "User",
            summary: "Get profile",
            description:
              "Return profile-safe fields for the current authenticated user.",
            failureDescription: "Profile load failed.",
            requiresAuth: true,
            responseSchema: {
              type: "object",
              required: ["user"],
              properties: {
                user: profileUserDataSchema,
              },
            },
            successCode: USER_CODES.PROFILE_LOADED,
            successDescription: "Profile loaded.",
            successMessage: USER_MESSAGES.PROFILE_LOADED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "patch",
            tag: "User",
            summary: "Update profile",
            description:
              "Update one or more editable profile fields for the current authenticated user. Omitted fields stay unchanged. This endpoint does not change mobile number, role, or auth tokens.",
            failureDescription: "Profile update failed.",
            requiresAuth: true,
            requestSchema: {
              type: "object",
              additionalProperties: false,
              minProperties: 1,
              properties: {
                name: {
                  type: "string",
                  nullable: true,
                  minLength: 2,
                  maxLength: 100,
                  example: "Priya",
                },
                email: {
                  type: "string",
                  format: "email",
                  nullable: true,
                  maxLength: 150,
                  example: "priya@example.com",
                },
                avatarUrl: {
                  type: "string",
                  nullable: true,
                  format: "uri",
                  example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
                },
                branchId: {
                  type: "string",
                  nullable: true,
                  example: "cmokbranch0001",
                },
                notificationPreferences: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    bookingReminders: { type: "boolean" },
                    email: { type: "boolean" },
                    offers: { type: "boolean" },
                    push: { type: "boolean" },
                    sms: { type: "boolean" },
                    whatsapp: { type: "boolean" },
                  },
                },
              },
            },
            responseSchema: {
              type: "object",
              required: ["user"],
              properties: {
                user: profileUserDataSchema,
              },
            },
            successCode: USER_CODES.PROFILE_UPDATED,
            successDescription: "Profile updated.",
            successMessage: USER_MESSAGES.PROFILE_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/users/me/avatar": {
          ...jsonEndpoint({
            method: "post",
            tag: "User",
            summary: "Update avatar",
            description:
              "Save the current user's Cloudinary/S3 avatar URL after the image has been uploaded to external storage.",
            failureDescription: "Avatar update failed.",
            requiresAuth: true,
            requestSchema: {
              type: "object",
              additionalProperties: false,
              required: ["avatarUrl"],
              properties: {
                avatarUrl: {
                  type: "string",
                  format: "uri",
                  maxLength: 2048,
                  pattern: "^https://",
                  example:
                    "https://res.cloudinary.com/demo/image/upload/v1/users/avatar.jpg",
                },
              },
            },
            responseSchema: avatarDataSchema,
            successCode: USER_CODES.AVATAR_UPDATED,
            successDescription: "Avatar updated.",
            successMessage: USER_MESSAGES.AVATAR_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "User",
            summary: "Remove avatar",
            description: "Clear the current user's saved avatar URL.",
            failureDescription: "Avatar removal failed.",
            requiresAuth: true,
            responseSchema: avatarDataSchema,
            successCode: USER_CODES.AVATAR_REMOVED,
            successDescription: "Avatar removed.",
            successMessage: USER_MESSAGES.AVATAR_REMOVED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/users/me/addresses": {
          ...jsonEndpoint({
            method: "get",
            tag: "User",
            summary: "List addresses",
            description: "List saved addresses owned by the current user.",
            failureDescription: "Address load failed.",
            requiresAuth: true,
            responseSchema: {
              type: "object",
              required: ["addresses"],
              properties: {
                addresses: {
                  type: "array",
                  items: addressDataSchema,
                },
              },
            },
            successCode: USER_CODES.ADDRESS_LISTED,
            successDescription: "Addresses loaded.",
            successMessage: USER_MESSAGES.ADDRESS_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "User",
            summary: "Create address",
            description:
              "Create a saved address for the current user. The first address becomes default automatically unless isDefault is provided.",
            failureDescription: "Address creation failed.",
            requiresAuth: true,
            requestSchema: addressRequestSchema,
            responseSchema: {
              type: "object",
              required: ["address"],
              properties: {
                address: addressDataSchema,
              },
            },
            successCode: USER_CODES.ADDRESS_CREATED,
            successDescription: "Address created.",
            successMessage: USER_MESSAGES.ADDRESS_CREATED,
          }),
        },
        "/api/v1/users/me/addresses/{addressId}": {
          ...jsonEndpoint({
            method: "patch",
            tag: "User",
            summary: "Update address",
            description: "Update one saved address owned by the current user.",
            failureDescription: "Address update failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "addressId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestSchema: addressPatchRequestSchema,
            responseSchema: {
              type: "object",
              required: ["address"],
              properties: {
                address: addressDataSchema,
              },
            },
            successCode: USER_CODES.ADDRESS_UPDATED,
            successDescription: "Address updated.",
            successMessage: USER_MESSAGES.ADDRESS_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "User",
            summary: "Delete address",
            description: "Delete one saved address owned by the current user.",
            failureDescription: "Address deletion failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "addressId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["addressId"],
              properties: {
                addressId: { type: "string", example: "cmokaddress0001" },
              },
            },
            successCode: USER_CODES.ADDRESS_DELETED,
            successDescription: "Address deleted.",
            successMessage: USER_MESSAGES.ADDRESS_DELETED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/users/me/bookings": jsonEndpoint({
          method: "get",
          tag: "User",
          summary: "Booking history",
          description:
            "List recent bookings owned by the current user. Supports status and limit query filters.",
          failureDescription: "Booking history load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: [
                  "PENDING",
                  "CONFIRMED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                ],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["bookings", "limit"],
            properties: {
              bookings: {
                type: "array",
                items: bookingHistoryItemSchema,
              },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: USER_CODES.BOOKING_HISTORY_LOADED,
          successDescription: "Booking history loaded.",
          successMessage: USER_MESSAGES.BOOKING_HISTORY_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/users/me/consultations": jsonEndpoint({
          method: "get",
          tag: "User",
          summary: "List my consultations",
          description:
            "List consultation requests owned by the current user. Supports status and limit filters.",
          failureDescription: "Consultation list load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["consultations", "limit"],
            properties: {
              consultations: { type: "array", items: consultationDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: CONSULTATION_CODES.CONSULTATIONS_LISTED,
          successDescription: "Consultations loaded.",
          successMessage: CONSULTATION_MESSAGES.CONSULTATIONS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/bookings": {
          ...jsonEndpoint({
            method: "get",
            tag: "Bookings",
            summary: "List bookings",
            description:
              "List bookings owned by the current authenticated user. Supports status and limit filters.",
            failureDescription: "Booking list load failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "status",
                in: "query",
                required: false,
                schema: {
                  type: "string",
                  enum: [
                    "PENDING",
                    "CONFIRMED",
                    "IN_PROGRESS",
                    "COMPLETED",
                    "CANCELLED",
                    "NO_SHOW",
                  ],
                },
              },
              {
                name: "limit",
                in: "query",
                required: false,
                schema: {
                  type: "integer",
                  minimum: 1,
                  maximum: 50,
                  default: 20,
                },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["bookings", "limit"],
              properties: {
                bookings: {
                  type: "array",
                  items: bookingDataSchema,
                },
                limit: { type: "integer", example: 20 },
              },
            },
            successCode: BOOKING_CODES.BOOKING_LIST_LOADED,
            successDescription: "Bookings loaded.",
            successMessage: BOOKING_MESSAGES.BOOKING_LIST_LOADED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Bookings",
            summary: "Create booking",
            description:
              "Create a pending booking for the current user. The server re-checks slot availability in a transaction and auto-assigns an available qualified staff member when staffId is omitted.",
            failureDescription: "Booking creation failed.",
            requiresAuth: true,
            requestSchema: createBookingRequestSchema,
            responseSchema: {
              type: "object",
              required: ["booking"],
              properties: {
                booking: bookingDataSchema,
              },
            },
            successCode: BOOKING_CODES.BOOKING_CREATED,
            successDescription: "Booking created.",
            successMessage: BOOKING_MESSAGES.BOOKING_CREATED,
            successStatus: HTTP_STATUS.CREATED,
          }),
        },
        "/api/v1/bookings/{bookingId}": jsonEndpoint({
          method: "get",
          tag: "Bookings",
          summary: "Get booking",
          description: "Load one booking owned by the current authenticated user.",
          failureDescription: "Booking detail load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "bookingId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokbooking0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: {
              booking: bookingDataSchema,
            },
          },
          successCode: BOOKING_CODES.BOOKING_DETAIL_LOADED,
          successDescription: "Booking details loaded.",
          successMessage: BOOKING_MESSAGES.BOOKING_DETAIL_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/bookings/{bookingId}/payments": {
          ...jsonEndpoint({
            method: "get",
            tag: "Payments",
            summary: "List booking payments",
            description:
              "List payment attempts for one booking owned by the current user.",
            failureDescription: "Payment list load failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "bookingId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbooking0001" },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["payments"],
              properties: {
                payments: {
                  type: "array",
                  items: paymentDataSchema,
                },
              },
            },
            successCode: PAYMENT_CODES.PAYMENT_LIST_LOADED,
            successDescription: "Payments loaded.",
            successMessage: PAYMENT_MESSAGES.PAYMENT_LIST_LOADED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Payments",
            summary: "Create booking payment",
            description:
              "Create or reuse an unpaid payment intent for a pending booking. The amount uses advanceAmount when configured, otherwise totalAmount.",
            failureDescription: "Payment creation failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "bookingId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbooking0001" },
              },
            ],
            requestBodyRequired: false,
            requestSchema: createPaymentRequestSchema,
            responseSchema: {
              type: "object",
              required: ["payment"],
              properties: {
                payment: paymentDataSchema,
              },
            },
            successCode: PAYMENT_CODES.PAYMENT_CREATED,
            successDescription: "Payment created.",
            successMessage: PAYMENT_MESSAGES.PAYMENT_CREATED,
            successStatus: HTTP_STATUS.CREATED,
          }),
        },
        "/api/v1/bookings/{bookingId}/cancel": jsonEndpoint({
          method: "patch",
          tag: "Bookings",
          summary: "Cancel booking",
          description:
            "Cancel a pending or confirmed booking owned by the current user.",
          failureDescription: "Booking cancellation failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "bookingId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokbooking0001" },
            },
          ],
          requestSchema: cancelBookingRequestSchema,
          requestBodyRequired: false,
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: {
              booking: bookingDataSchema,
            },
          },
          successCode: BOOKING_CODES.BOOKING_CANCELLED,
          successDescription: "Booking cancelled.",
          successMessage: BOOKING_MESSAGES.BOOKING_CANCELLED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/bookings/{bookingId}/reschedule": jsonEndpoint({
          method: "patch",
          tag: "Bookings",
          summary: "Reschedule booking",
          description:
            "Move a pending or confirmed booking to a new date/time after re-checking availability.",
          failureDescription: "Booking reschedule failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "bookingId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokbooking0001" },
            },
          ],
          requestSchema: rescheduleBookingRequestSchema,
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: {
              booking: bookingDataSchema,
            },
          },
          successCode: BOOKING_CODES.BOOKING_RESCHEDULED,
          successDescription: "Booking rescheduled.",
          successMessage: BOOKING_MESSAGES.BOOKING_RESCHEDULED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/bookings/{bookingId}/review": jsonEndpoint({
          method: "post",
          tag: "Reviews",
          summary: "Create booking review",
          description:
            "Create one review for a completed booking owned by the current user.",
          failureDescription: "Review creation failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "bookingId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokbooking0001" },
            },
          ],
          requestSchema: createReviewRequestSchema,
          responseSchema: {
            type: "object",
            required: ["review"],
            properties: { review: reviewDataSchema },
          },
          successCode: REVIEW_CODES.REVIEW_CREATED,
          successDescription: "Review created.",
          successMessage: REVIEW_MESSAGES.REVIEW_CREATED,
          successStatus: HTTP_STATUS.CREATED,
        }),
        "/api/v1/bookings/slots": jsonEndpoint({
          method: "get",
          tag: "Bookings",
          summary: "List booking slots",
          description:
            "Calculate available 30-minute grid slots for a service on one branch/date. Applies service duration, branch holidays, staff qualification, staff leave, existing bookings, and a 2-hour minimum advance window.",
          failureDescription: "Booking slot load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
            {
              name: "serviceId",
              in: "query",
              required: true,
              schema: {
                type: "string",
                example: "cmokservice0001",
              },
            },
            {
              name: "serviceVariantId",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "cmokvariant0001",
              },
            },
            {
              name: "staffId",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "cmokstaff0001",
              },
            },
            {
              name: "date",
              in: "query",
              required: true,
              schema: {
                type: "string",
                format: "date",
                example: "2026-05-10",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: [
              "branchId",
              "serviceId",
              "date",
              "durationMinutes",
              "isClosed",
              "slots",
            ],
            properties: {
              branchId: { type: "string", example: "cmokbranch0001" },
              serviceId: { type: "string", example: "cmokservice0001" },
              serviceVariantId: {
                type: "string",
                nullable: true,
                example: "cmokvariant0001",
              },
              staffId: {
                type: "string",
                nullable: true,
                example: "cmokstaff0001",
              },
              date: { type: "string", format: "date", example: "2026-05-10" },
              durationMinutes: { type: "integer", example: 45 },
              isClosed: { type: "boolean", example: false },
              closedReason: {
                type: "string",
                nullable: true,
                example: null,
              },
              slots: {
                type: "array",
                items: bookingSlotDataSchema,
              },
            },
          },
          successCode: BOOKING_CODES.BOOKING_SLOTS_LISTED,
          successDescription: "Booking slots loaded.",
          successMessage: BOOKING_MESSAGES.BOOKING_SLOTS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/payments/{paymentId}/verify": jsonEndpoint({
          method: "post",
          tag: "Payments",
          summary: "Verify payment",
          description:
            "Verify a provider payment for the current user. On success the payment becomes PAID and the pending booking becomes CONFIRMED.",
          failureDescription: "Payment verification failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "paymentId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpayment0001" },
            },
          ],
          requestSchema: verifyPaymentRequestSchema,
          responseSchema: {
            type: "object",
            required: ["payment"],
            properties: {
              payment: paymentDataSchema,
            },
          },
          successCode: PAYMENT_CODES.PAYMENT_VERIFIED,
          successDescription: "Payment verified.",
          successMessage: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/payments/{paymentId}/refunds": jsonEndpoint({
          method: "post",
          tag: "Payments",
          summary: "Request refund",
          description:
            "Create a refund request for a paid payment after the booking has been cancelled. Provider processing is handled separately.",
          failureDescription: "Refund request failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "paymentId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpayment0001" },
            },
          ],
          requestBodyRequired: false,
          requestSchema: createRefundRequestSchema,
          responseSchema: {
            type: "object",
            required: ["payment"],
            properties: {
              payment: paymentDataSchema,
            },
          },
          successCode: PAYMENT_CODES.REFUND_CREATED,
          successDescription: "Refund requested.",
          successMessage: PAYMENT_MESSAGES.REFUND_CREATED,
          successStatus: HTTP_STATUS.CREATED,
        }),
        "/api/v1/branches": jsonEndpoint({
          method: "get",
          tag: "Branches",
          summary: "List branches",
          description:
            "List active branches for public discovery. Supports an optional city filter.",
          failureDescription: "Branch list load failed.",
          parameters: [
            {
              name: "city",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "Jaipur",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["branches"],
            properties: {
              branches: {
                type: "array",
                items: branchDataSchema,
              },
            },
          },
          successCode: BRANCH_CODES.BRANCHES_LISTED,
          successDescription: "Branches loaded.",
          successMessage: BRANCH_MESSAGES.BRANCHES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/branches/{branchId}": jsonEndpoint({
          method: "get",
          tag: "Branches",
          summary: "Get branch",
          description: "Load one active branch by id.",
          failureDescription: "Branch load failed.",
          parameters: [
            {
              name: "branchId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["branch"],
            properties: {
              branch: branchDataSchema,
            },
          },
          successCode: BRANCH_CODES.BRANCH_LOADED,
          successDescription: "Branch loaded.",
          successMessage: BRANCH_MESSAGES.BRANCH_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/services/categories": jsonEndpoint({
          method: "get",
          tag: "Services",
          summary: "List service categories",
          description:
            "List active global service categories and, when branchId is provided, active branch-specific categories.",
          failureDescription: "Service category load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["categories"],
            properties: {
              categories: {
                type: "array",
                items: serviceCategoryDataSchema,
              },
            },
          },
          successCode: SERVICE_CODES.CATEGORIES_LISTED,
          successDescription: "Service categories loaded.",
          successMessage: SERVICE_MESSAGES.CATEGORIES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/services": jsonEndpoint({
          method: "get",
          tag: "Services",
          summary: "List services",
          description:
            "List active services for one selected branch. Supports category and limit filters.",
          failureDescription: "Service list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
            {
              name: "categoryId",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "cmokcategory0001",
              },
            },
            {
              name: "categorySlug",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "hair-services",
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["services", "limit"],
            properties: {
              services: {
                type: "array",
                items: serviceDataSchema,
              },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: SERVICE_CODES.SERVICES_LISTED,
          successDescription: "Services loaded.",
          successMessage: SERVICE_MESSAGES.SERVICES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/services/{serviceId}": jsonEndpoint({
          method: "get",
          tag: "Services",
          summary: "Get service",
          description:
            "Load one active service by id, including active variants and add-ons.",
          failureDescription: "Service load failed.",
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                example: "cmokservice0001",
              },
            },
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.SERVICE_LOADED,
          successDescription: "Service loaded.",
          successMessage: SERVICE_MESSAGES.SERVICE_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/services/{serviceId}/reviews": jsonEndpoint({
          method: "get",
          tag: "Reviews",
          summary: "List service reviews",
          description:
            "List approved public reviews for one service, optionally scoped to a branch.",
          failureDescription: "Review list load failed.",
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["reviews", "limit"],
            properties: {
              reviews: { type: "array", items: reviewDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: REVIEW_CODES.REVIEW_LISTED,
          successDescription: "Reviews loaded.",
          successMessage: REVIEW_MESSAGES.REVIEW_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/packages": jsonEndpoint({
          method: "get",
          tag: "Packages",
          summary: "List packages",
          description:
            "List active packages for one selected branch. Supports category and limit filters.",
          failureDescription: "Package list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "categoryId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokcategory0001" },
            },
            {
              name: "categorySlug",
              in: "query",
              required: false,
              schema: { type: "string", example: "bridal" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["packages", "limit"],
            properties: {
              packages: { type: "array", items: packageDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: PACKAGE_CODES.PACKAGES_LISTED,
          successDescription: "Packages loaded.",
          successMessage: PACKAGE_MESSAGES.PACKAGES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/packages/{packageId}": jsonEndpoint({
          method: "get",
          tag: "Packages",
          summary: "Get package",
          description: "Load one active package with attached active services.",
          failureDescription: "Package load failed.",
          parameters: [
            {
              name: "packageId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpackage0001" },
            },
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: { type: "string", example: "cmokbranch0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["package"],
            properties: { package: packageDetailDataSchema },
          },
          successCode: PACKAGE_CODES.PACKAGE_LOADED,
          successDescription: "Package loaded.",
          successMessage: PACKAGE_MESSAGES.PACKAGE_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/consultations": jsonEndpoint({
          method: "post",
          tag: "Consultations",
          summary: "Create consultation",
          description:
            "Create a consultation request for the current user. Optional package and staff must belong to the selected active branch.",
          failureDescription: "Consultation creation failed.",
          requiresAuth: true,
          requestSchema: createConsultationRequestSchema,
          responseSchema: {
            type: "object",
            required: ["consultation"],
            properties: { consultation: consultationDataSchema },
          },
          successCode: CONSULTATION_CODES.CONSULTATION_CREATED,
          successDescription: "Consultation created.",
          successMessage: CONSULTATION_MESSAGES.CONSULTATION_CREATED,
          successStatus: HTTP_STATUS.CREATED,
        }),
        "/api/v1/consultations/{consultationId}": jsonEndpoint({
          method: "get",
          tag: "Consultations",
          summary: "Get consultation",
          description: "Load one consultation request owned by the current user.",
          failureDescription: "Consultation load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "consultationId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokconsult0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["consultation"],
            properties: { consultation: consultationDataSchema },
          },
          successCode: CONSULTATION_CODES.CONSULTATION_LOADED,
          successDescription: "Consultation loaded.",
          successMessage: CONSULTATION_MESSAGES.CONSULTATION_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/offers": jsonEndpoint({
          method: "get",
          tag: "Offers",
          summary: "List offers",
          description:
            "List active global offers and branch-specific offers for discovery.",
          failureDescription: "Offer list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["offers", "limit"],
            properties: {
              offers: { type: "array", items: offerDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: OFFER_CODES.OFFERS_LISTED,
          successDescription: "Offers loaded.",
          successMessage: OFFER_MESSAGES.OFFERS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/offers/validate": jsonEndpoint({
          method: "post",
          tag: "Offers",
          summary: "Validate offer",
          description:
            "Validate a coupon for the current user before booking creation. The response includes computed discount and final amount.",
          failureDescription: "Offer validation failed.",
          requiresAuth: true,
          requestSchema: validateOfferRequestSchema,
          responseSchema: {
            type: "object",
            required: ["offer", "discountAmount", "finalAmount"],
            properties: {
              offer: offerDataSchema,
              discountAmount: { type: "string", example: "500.00" },
              finalAmount: { type: "string", example: "4499.00" },
            },
          },
          successCode: OFFER_CODES.OFFER_VALIDATED,
          successDescription: "Offer validated.",
          successMessage: OFFER_MESSAGES.OFFER_VALIDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/portfolio": jsonEndpoint({
          method: "get",
          tag: "Portfolio",
          summary: "List portfolio",
          description:
            "List published gallery work, optionally filtered by branch, staff, service, package, or featured state.",
          failureDescription: "Portfolio list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "staffId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokstaff0001" },
            },
            {
              name: "serviceId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokservice0001" },
            },
            {
              name: "featured",
              in: "query",
              required: false,
              schema: { type: "boolean" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["portfolio", "limit"],
            properties: {
              portfolio: { type: "array", items: portfolioDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: PORTFOLIO_CODES.PORTFOLIO_LISTED,
          successDescription: "Portfolio loaded.",
          successMessage: PORTFOLIO_MESSAGES.PORTFOLIO_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/blogs/categories": jsonEndpoint({
          method: "get",
          tag: "Blogs",
          summary: "List blog categories",
          description: "List active blog categories for editorial filters.",
          failureDescription: "Blog category list load failed.",
          responseSchema: {
            type: "object",
            required: ["categories"],
            properties: {
              categories: { type: "array", items: blogCategoryDataSchema },
            },
          },
          successCode: BLOG_CODES.CATEGORIES_LISTED,
          successDescription: "Blog categories loaded.",
          successMessage: BLOG_MESSAGES.CATEGORIES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/blogs": jsonEndpoint({
          method: "get",
          tag: "Blogs",
          summary: "List blogs",
          description:
            "List published blog posts, optionally filtered by category slug.",
          failureDescription: "Blog list load failed.",
          parameters: [
            {
              name: "categorySlug",
              in: "query",
              required: false,
              schema: { type: "string", example: "beauty-tips" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["blogs", "limit"],
            properties: {
              blogs: { type: "array", items: blogDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: BLOG_CODES.BLOGS_LISTED,
          successDescription: "Blogs loaded.",
          successMessage: BLOG_MESSAGES.BLOGS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/blogs/{slug}": jsonEndpoint({
          method: "get",
          tag: "Blogs",
          summary: "Get blog",
          description: "Load one published blog post by slug.",
          failureDescription: "Blog detail load failed.",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string", example: "bridal-makeup-guide" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["blog"],
            properties: { blog: blogDataSchema },
          },
          successCode: BLOG_CODES.BLOG_LOADED,
          successDescription: "Blog loaded.",
          successMessage: BLOG_MESSAGES.BLOG_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/products/categories": jsonEndpoint({
          method: "get",
          tag: "Products",
          summary: "List product categories",
          description:
            "List active global and branch-specific product categories.",
          failureDescription: "Product category list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["categories", "limit"],
            properties: {
              categories: { type: "array", items: productCategoryDataSchema },
              limit: { type: "integer", example: 50 },
            },
          },
          successCode: PRODUCT_CODES.CATEGORY_LISTED,
          successDescription: "Product categories loaded.",
          successMessage: PRODUCT_MESSAGES.CATEGORY_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/products": jsonEndpoint({
          method: "get",
          tag: "Products",
          summary: "List products",
          description:
            "List active retail products, optionally filtered by branch or category.",
          failureDescription: "Product list load failed.",
          parameters: [
            { name: "branchId", in: "query", required: false, schema: { type: "string" } },
            { name: "categoryId", in: "query", required: false, schema: { type: "string" } },
            { name: "categorySlug", in: "query", required: false, schema: { type: "string" } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
          ],
          responseSchema: {
            type: "object",
            required: ["products", "limit"],
            properties: {
              products: { type: "array", items: productDataSchema },
              limit: { type: "integer", example: 50 },
            },
          },
          successCode: PRODUCT_CODES.PRODUCTS_LISTED,
          successDescription: "Products loaded.",
          successMessage: PRODUCT_MESSAGES.PRODUCTS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/products/{productId}": jsonEndpoint({
          method: "get",
          tag: "Products",
          summary: "Get product",
          description: "Load one active retail product by id.",
          failureDescription: "Product detail load failed.",
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
            { name: "branchId", in: "query", required: false, schema: { type: "string" } },
          ],
          responseSchema: {
            type: "object",
            required: ["product"],
            properties: { product: productDataSchema },
          },
          successCode: PRODUCT_CODES.PRODUCT_LOADED,
          successDescription: "Product loaded.",
          successMessage: PRODUCT_MESSAGES.PRODUCT_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/staff": jsonEndpoint({
          method: "get",
          tag: "Staff",
          summary: "List staff",
          description:
            "List available staff for one active branch, optionally filtered by service.",
          failureDescription: "Staff list load failed.",
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "serviceId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: { type: "array", items: staffDataSchema } },
          },
          successCode: STAFF_CODES.STAFF_LISTED,
          successDescription: "Staff loaded.",
          successMessage: STAFF_MESSAGES.STAFF_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/staff/{staffId}": jsonEndpoint({
          method: "get",
          tag: "Staff",
          summary: "Get staff",
          description: "Load one available staff member for one active branch.",
          failureDescription: "Staff detail load failed.",
          parameters: [
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokstaff0001" },
            },
            {
              name: "branchId",
              in: "query",
              required: true,
              schema: { type: "string", example: "cmokbranch0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: staffDataSchema },
          },
          successCode: STAFF_CODES.STAFF_LOADED,
          successDescription: "Staff details loaded.",
          successMessage: STAFF_MESSAGES.STAFF_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/staff/{staffId}/reviews": jsonEndpoint({
          method: "get",
          tag: "Reviews",
          summary: "List staff reviews",
          description:
            "List approved public reviews for one staff member, optionally scoped to a branch.",
          failureDescription: "Review list load failed.",
          parameters: [
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokstaff0001" },
            },
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["reviews", "limit"],
            properties: {
              reviews: { type: "array", items: reviewDataSchema },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: REVIEW_CODES.REVIEW_LISTED,
          successDescription: "Reviews loaded.",
          successMessage: REVIEW_MESSAGES.REVIEW_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/branches": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create branch",
          description:
            "Create a branch and return the generated branch id. Supports map-ready coordinates, Google Maps URL, and Google place id. Requires ADMIN or SUPER_ADMIN.",
          failureDescription: "Branch creation failed.",
          requiresAuth: true,
          requestSchema: branchRequestSchema,
          responseSchema: {
            type: "object",
            required: ["branchId", "branch"],
            properties: {
              branchId: { type: "string", example: "cmokbranch0001" },
              branch: branchDataSchema,
            },
          },
          successCode: BRANCH_CODES.BRANCH_CREATED,
          successDescription: "Branch created.",
          successMessage: BRANCH_MESSAGES.BRANCH_CREATED,
        }),
        "/api/v1/admin/branches/{branchId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update branch",
          description:
            "Update one or more branch fields. Omitted fields stay unchanged. Requires ADMIN or SUPER_ADMIN.",
          failureDescription: "Branch update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "branchId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
          ],
          requestSchema: branchPatchRequestSchema,
          responseSchema: {
            type: "object",
            required: ["branch"],
            properties: {
              branch: branchDataSchema,
            },
          },
          successCode: BRANCH_CODES.BRANCH_UPDATED,
          successDescription: "Branch updated.",
          successMessage: BRANCH_MESSAGES.BRANCH_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/branches/{branchId}/holidays": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List branch holidays",
            description:
              "List closed or special operating dates for one branch. Booking slot calculation uses closed holidays to block availability.",
            failureDescription: "Branch holiday list load failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "branchId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbranch0001" },
              },
              {
                name: "from",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
              },
              {
                name: "to",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
              },
              {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["holidays", "limit"],
              properties: {
                holidays: { type: "array", items: branchHolidayDataSchema },
                limit: { type: "integer", example: 50 },
              },
            },
            successCode: BRANCH_CODES.HOLIDAY_LISTED,
            successDescription: "Branch holidays loaded.",
            successMessage: BRANCH_MESSAGES.HOLIDAY_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create branch holiday",
            description:
              "Create one branch holiday or special closed date. Duplicate branch/date rows are rejected.",
            failureDescription: "Branch holiday creation failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "branchId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbranch0001" },
              },
            ],
            requestSchema: branchHolidayRequestSchema,
            responseSchema: {
              type: "object",
              required: ["holiday"],
              properties: { holiday: branchHolidayDataSchema },
            },
            successCode: BRANCH_CODES.HOLIDAY_CREATED,
            successDescription: "Branch holiday created.",
            successMessage: BRANCH_MESSAGES.HOLIDAY_CREATED,
          }),
        },
        "/api/v1/admin/branches/{branchId}/holidays/{holidayId}": {
          ...jsonEndpoint({
            method: "patch",
            tag: "Admin",
            summary: "Update branch holiday",
            description:
              "Update one branch holiday date, reason, or closed flag.",
            failureDescription: "Branch holiday update failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "branchId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbranch0001" },
              },
              {
                name: "holidayId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokholiday0001" },
              },
            ],
            requestSchema: branchHolidayPatchSchema,
            responseSchema: {
              type: "object",
              required: ["holiday"],
              properties: { holiday: branchHolidayDataSchema },
            },
            successCode: BRANCH_CODES.HOLIDAY_UPDATED,
            successDescription: "Branch holiday updated.",
            successMessage: BRANCH_MESSAGES.HOLIDAY_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "Admin",
            summary: "Delete branch holiday",
            description: "Delete one branch holiday by id.",
            failureDescription: "Branch holiday deletion failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "branchId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokbranch0001" },
              },
              {
                name: "holidayId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokholiday0001" },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["holidayId"],
              properties: {
                holidayId: { type: "string", example: "cmokholiday0001" },
              },
            },
            successCode: BRANCH_CODES.HOLIDAY_DELETED,
            successDescription: "Branch holiday deleted.",
            successMessage: BRANCH_MESSAGES.HOLIDAY_DELETED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/admin/services/categories": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create service category",
          description:
            "Create a global or branch-specific service category. Branch admins are limited to their assigned branch; only super admins can create global categories.",
          failureDescription: "Service category creation failed.",
          requiresAuth: true,
          requestSchema: adminServiceCategoryRequestSchema,
          responseSchema: {
            type: "object",
            required: ["category"],
            properties: {
              category: serviceCategoryDataSchema,
            },
          },
          successCode: SERVICE_CODES.CATEGORY_CREATED,
          successDescription: "Service category created.",
          successMessage: SERVICE_MESSAGES.CATEGORY_CREATED,
        }),
        "/api/v1/admin/services/categories/{categoryId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update service category",
          description:
            "Update service category fields or deactivate a category by setting isActive to false.",
          failureDescription: "Service category update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "categoryId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokcategory0001" },
            },
          ],
          requestSchema: adminServiceCategoryPatchSchema,
          responseSchema: {
            type: "object",
            required: ["category"],
            properties: {
              category: serviceCategoryDataSchema,
            },
          },
          successCode: SERVICE_CODES.CATEGORY_UPDATED,
          successDescription: "Service category updated.",
          successMessage: SERVICE_MESSAGES.CATEGORY_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/services": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create service",
          description:
            "Create a service under an active branch and matching global or branch-specific category.",
          failureDescription: "Service creation failed.",
          requiresAuth: true,
          requestSchema: adminServiceRequestSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.SERVICE_CREATED,
          successDescription: "Service created.",
          successMessage: SERVICE_MESSAGES.SERVICE_CREATED,
        }),
        "/api/v1/admin/services/{serviceId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update service",
          description:
            "Update service fields or deactivate a service by setting isActive to false.",
          failureDescription: "Service update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          requestSchema: adminServicePatchSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.SERVICE_UPDATED,
          successDescription: "Service updated.",
          successMessage: SERVICE_MESSAGES.SERVICE_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/services/{serviceId}/variants": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create service variant",
          description: "Create a priced duration option under one service.",
          failureDescription: "Service variant creation failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          requestSchema: adminServiceVariantRequestSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.VARIANT_CREATED,
          successDescription: "Service variant created.",
          successMessage: SERVICE_MESSAGES.VARIANT_CREATED,
        }),
        "/api/v1/admin/services/{serviceId}/variants/{variantId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update service variant",
          description:
            "Update variant fields or deactivate a variant by setting isActive to false.",
          failureDescription: "Service variant update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
            {
              name: "variantId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokvariant0001" },
            },
          ],
          requestSchema: adminServiceVariantPatchSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.VARIANT_UPDATED,
          successDescription: "Service variant updated.",
          successMessage: SERVICE_MESSAGES.VARIANT_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/services/{serviceId}/add-ons": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create service add-on",
          description: "Create an optional priced add-on under one service.",
          failureDescription: "Service add-on creation failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          requestSchema: adminServiceAddOnRequestSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.ADD_ON_CREATED,
          successDescription: "Service add-on created.",
          successMessage: SERVICE_MESSAGES.ADD_ON_CREATED,
        }),
        "/api/v1/admin/services/{serviceId}/add-ons/{addOnId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update service add-on",
          description:
            "Update add-on fields or deactivate an add-on by setting isActive to false.",
          failureDescription: "Service add-on update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
            {
              name: "addOnId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokaddon0001" },
            },
          ],
          requestSchema: adminServiceAddOnPatchSchema,
          responseSchema: {
            type: "object",
            required: ["service"],
            properties: {
              service: serviceDetailDataSchema,
            },
          },
          successCode: SERVICE_CODES.ADD_ON_UPDATED,
          successDescription: "Service add-on updated.",
          successMessage: SERVICE_MESSAGES.ADD_ON_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/packages": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create package",
          description:
            "Create a package under an active branch and optionally attach active branch services.",
          failureDescription: "Package creation failed.",
          requiresAuth: true,
          requestSchema: adminPackageRequestSchema,
          responseSchema: {
            type: "object",
            required: ["package"],
            properties: { package: packageDetailDataSchema },
          },
          successCode: PACKAGE_CODES.PACKAGE_CREATED,
          successDescription: "Package created.",
          successMessage: PACKAGE_MESSAGES.PACKAGE_CREATED,
        }),
        "/api/v1/admin/packages/{packageId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update package",
          description:
            "Update package fields or deactivate a package by setting isActive to false.",
          failureDescription: "Package update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "packageId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpackage0001" },
            },
          ],
          requestSchema: adminPackagePatchSchema,
          responseSchema: {
            type: "object",
            required: ["package"],
            properties: { package: packageDetailDataSchema },
          },
          successCode: PACKAGE_CODES.PACKAGE_UPDATED,
          successDescription: "Package updated.",
          successMessage: PACKAGE_MESSAGES.PACKAGE_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/packages/{packageId}/services": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Assign package service",
          description:
            "Attach or update one active branch service inside a package.",
          failureDescription: "Package service assignment failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "packageId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpackage0001" },
            },
          ],
          requestSchema: packageServiceRequestSchema,
          responseSchema: {
            type: "object",
            required: ["package"],
            properties: { package: packageDetailDataSchema },
          },
          successCode: PACKAGE_CODES.PACKAGE_SERVICE_ASSIGNED,
          successDescription: "Package service assigned.",
          successMessage: PACKAGE_MESSAGES.PACKAGE_SERVICE_ASSIGNED,
        }),
        "/api/v1/admin/packages/{packageId}/services/{serviceId}": jsonEndpoint({
          method: "delete",
          tag: "Admin",
          summary: "Remove package service",
          description: "Remove one service from a package.",
          failureDescription: "Package service removal failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "packageId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokpackage0001" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["packageId", "serviceId"],
            properties: {
              packageId: { type: "string", example: "cmokpackage0001" },
              serviceId: { type: "string", example: "cmokservice0001" },
            },
          },
          successCode: PACKAGE_CODES.PACKAGE_SERVICE_REMOVED,
          successDescription: "Package service removed.",
          successMessage: PACKAGE_MESSAGES.PACKAGE_SERVICE_REMOVED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/staff": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create staff",
          description:
            "Create a staff profile for an active user and optionally assign services.",
          failureDescription: "Staff creation failed.",
          requiresAuth: true,
          requestSchema: adminStaffRequestSchema,
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: staffDataSchema },
          },
          successCode: STAFF_CODES.STAFF_CREATED,
          successDescription: "Staff created.",
          successMessage: STAFF_MESSAGES.STAFF_CREATED,
        }),
        "/api/v1/admin/staff/{staffId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update staff",
          description: "Update staff profile and availability fields.",
          failureDescription: "Staff update failed.",
          requiresAuth: true,
          parameters: [
            { name: "staffId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: adminStaffPatchSchema,
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: staffDataSchema },
          },
          successCode: STAFF_CODES.STAFF_UPDATED,
          successDescription: "Staff updated.",
          successMessage: STAFF_MESSAGES.STAFF_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/staff/{staffId}/services": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Assign staff service",
          description: "Assign one active branch service to a staff member.",
          failureDescription: "Staff service assignment failed.",
          requiresAuth: true,
          parameters: [
            { name: "staffId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: {
            type: "object",
            required: ["serviceId"],
            properties: { serviceId: { type: "string", example: "cmokservice0001" } },
          },
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: staffDataSchema },
          },
          successCode: STAFF_CODES.SERVICE_ASSIGNED,
          successDescription: "Staff service assigned.",
          successMessage: STAFF_MESSAGES.SERVICE_ASSIGNED,
        }),
        "/api/v1/admin/staff/{staffId}/services/{serviceId}": jsonEndpoint({
          method: "delete",
          tag: "Admin",
          summary: "Remove staff service",
          description: "Remove one service assignment from a staff member.",
          failureDescription: "Staff service removal failed.",
          requiresAuth: true,
          parameters: [
            { name: "staffId", in: "path", required: true, schema: { type: "string" } },
            { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          ],
          responseSchema: {
            type: "object",
            required: ["staff"],
            properties: { staff: staffDataSchema },
          },
          successCode: STAFF_CODES.SERVICE_REMOVED,
          successDescription: "Staff service removed.",
          successMessage: STAFF_MESSAGES.SERVICE_REMOVED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/staff/{staffId}/leaves": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create staff leave",
          description: "Create a leave window that blocks staff availability.",
          failureDescription: "Staff leave creation failed.",
          requiresAuth: true,
          parameters: [
            { name: "staffId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: staffLeaveRequestSchema,
          responseSchema: { type: "object", additionalProperties: true },
          successCode: STAFF_CODES.LEAVE_CREATED,
          successDescription: "Staff leave created.",
          successMessage: STAFF_MESSAGES.LEAVE_CREATED,
        }),
        "/api/v1/admin/staff/{staffId}/leaves/{leaveId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update staff leave",
          description: "Update one staff leave window.",
          failureDescription: "Staff leave update failed.",
          requiresAuth: true,
          parameters: [
            { name: "staffId", in: "path", required: true, schema: { type: "string" } },
            { name: "leaveId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: {
            ...staffLeaveRequestSchema,
            required: undefined,
            minProperties: 1,
          },
          responseSchema: { type: "object", additionalProperties: true },
          successCode: STAFF_CODES.LEAVE_UPDATED,
          successDescription: "Staff leave updated.",
          successMessage: STAFF_MESSAGES.LEAVE_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/bookings": jsonEndpoint({
          method: "get",
          tag: "Admin",
          summary: "List admin bookings",
          description:
            "List bookings for salon operations. Branch admins are scoped to their branch; super admins can filter by branch.",
          failureDescription: "Admin booking list load failed.",
          requiresAuth: true,
          parameters: [
            { name: "branchId", in: "query", required: false, schema: { type: "string" } },
            { name: "date", in: "query", required: false, schema: { type: "string", format: "date" } },
            { name: "status", in: "query", required: false, schema: { type: "string" } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
          ],
          responseSchema: {
            type: "object",
            required: ["bookings", "limit"],
            properties: {
              bookings: { type: "array", items: bookingDataSchema },
              limit: { type: "integer", example: 50 },
            },
          },
          successCode: BOOKING_CODES.ADMIN_BOOKING_LIST_LOADED,
          successDescription: "Admin bookings loaded.",
          successMessage: BOOKING_MESSAGES.ADMIN_BOOKING_LIST_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/bookings/{bookingId}": jsonEndpoint({
          method: "get",
          tag: "Admin",
          summary: "Get admin booking",
          description: "Load one booking for salon operations.",
          failureDescription: "Admin booking detail load failed.",
          requiresAuth: true,
          parameters: [
            { name: "bookingId", in: "path", required: true, schema: { type: "string" } },
          ],
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: { booking: bookingDataSchema },
          },
          successCode: BOOKING_CODES.BOOKING_DETAIL_LOADED,
          successDescription: "Booking details loaded.",
          successMessage: BOOKING_MESSAGES.BOOKING_DETAIL_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/bookings/{bookingId}/assign-staff": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Assign booking staff",
          description: "Assign a qualified staff member from the booking branch.",
          failureDescription: "Booking staff assignment failed.",
          requiresAuth: true,
          parameters: [
            { name: "bookingId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: {
            type: "object",
            required: ["staffId"],
            properties: { staffId: { type: "string", example: "cmokstaff0001" } },
          },
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: { booking: bookingDataSchema },
          },
          successCode: BOOKING_CODES.BOOKING_STATUS_UPDATED,
          successDescription: "Booking staff assigned.",
          successMessage: BOOKING_MESSAGES.BOOKING_STATUS_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/bookings/{bookingId}/cancel": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Admin cancel booking",
          description: "Cancel an operational booking and record status history.",
          failureDescription: "Booking cancellation failed.",
          requiresAuth: true,
          parameters: [
            { name: "bookingId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: cancelBookingRequestSchema,
          requestBodyRequired: false,
          responseSchema: {
            type: "object",
            required: ["booking"],
            properties: { booking: bookingDataSchema },
          },
          successCode: BOOKING_CODES.BOOKING_STATUS_UPDATED,
          successDescription: "Booking cancelled.",
          successMessage: BOOKING_MESSAGES.BOOKING_CANCELLED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/bookings/{bookingId}/confirm": adminBookingStatusEndpoint(
          "Confirm booking",
          "Confirm a pending booking.",
        ),
        "/api/v1/admin/bookings/{bookingId}/check-in": adminBookingStatusEndpoint(
          "Check in booking",
          "Mark a confirmed booking as in progress and set checkedInAt.",
        ),
        "/api/v1/admin/bookings/{bookingId}/start": adminBookingStatusEndpoint(
          "Start booking",
          "Start a confirmed booking and set checkedInAt.",
        ),
        "/api/v1/admin/bookings/{bookingId}/complete": adminBookingStatusEndpoint(
          "Complete booking",
          "Complete an in-progress booking and set completedAt.",
        ),
        "/api/v1/admin/bookings/{bookingId}/no-show": adminBookingStatusEndpoint(
          "Mark no-show",
          "Mark a confirmed booking as no-show.",
        ),
        "/api/v1/admin/consultations": jsonEndpoint({
          method: "get",
          tag: "Admin",
          summary: "List admin consultations",
          description:
            "List consultation requests for salon operations. Branch admins are scoped to their branch; super admins can filter by branch.",
          failureDescription: "Admin consultation list load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "branchId",
              in: "query",
              required: false,
              schema: { type: "string", example: "cmokbranch0001" },
            },
            {
              name: "date",
              in: "query",
              required: false,
              schema: { type: "string", format: "date" },
            },
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["consultations", "limit"],
            properties: {
              consultations: { type: "array", items: consultationDataSchema },
              limit: { type: "integer", example: 50 },
            },
          },
          successCode: CONSULTATION_CODES.CONSULTATIONS_LISTED,
          successDescription: "Admin consultations loaded.",
          successMessage: CONSULTATION_MESSAGES.CONSULTATIONS_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/consultations/{consultationId}": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "Get admin consultation",
            description: "Load one consultation request for salon operations.",
            failureDescription: "Admin consultation load failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "consultationId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokconsult0001" },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["consultation"],
              properties: { consultation: consultationDataSchema },
            },
            successCode: CONSULTATION_CODES.CONSULTATION_LOADED,
            successDescription: "Consultation loaded.",
            successMessage: CONSULTATION_MESSAGES.CONSULTATION_LOADED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "patch",
            tag: "Admin",
            summary: "Update admin consultation",
            description:
              "Update consultation assignment, preferred schedule, status, or admin notes.",
            failureDescription: "Admin consultation update failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "consultationId",
                in: "path",
                required: true,
                schema: { type: "string", example: "cmokconsult0001" },
              },
            ],
            requestSchema: adminConsultationPatchSchema,
            responseSchema: {
              type: "object",
              required: ["consultation"],
              properties: { consultation: consultationDataSchema },
            },
            successCode: CONSULTATION_CODES.CONSULTATION_UPDATED,
            successDescription: "Consultation updated.",
            successMessage: CONSULTATION_MESSAGES.CONSULTATION_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/admin/offers": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Create offer",
          description:
            "Create a global or branch-specific offer. Branch admins are limited to their assigned branch; only super admins can create global offers.",
          failureDescription: "Offer creation failed.",
          requiresAuth: true,
          requestSchema: adminOfferRequestSchema,
          responseSchema: {
            type: "object",
            required: ["offer"],
            properties: { offer: offerDataSchema },
          },
          successCode: OFFER_CODES.OFFER_CREATED,
          successDescription: "Offer created.",
          successMessage: OFFER_MESSAGES.OFFER_CREATED,
        }),
        "/api/v1/admin/offers/{offerId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update offer",
          description:
            "Update offer fields or deactivate an offer by setting isActive to false.",
          failureDescription: "Offer update failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "offerId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokoffer0001" },
            },
          ],
          requestSchema: adminOfferPatchSchema,
          responseSchema: {
            type: "object",
            required: ["offer"],
            properties: { offer: offerDataSchema },
          },
          successCode: OFFER_CODES.OFFER_UPDATED,
          successDescription: "Offer updated.",
          successMessage: OFFER_MESSAGES.OFFER_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/offers/{offerId}/services": jsonEndpoint({
          method: "post",
          tag: "Admin",
          summary: "Assign offer service",
          description:
            "Attach one active branch service to an offer. Offers with no services apply to all services.",
          failureDescription: "Offer service assignment failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "offerId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokoffer0001" },
            },
          ],
          requestSchema: offerServiceRequestSchema,
          responseSchema: {
            type: "object",
            required: ["offer"],
            properties: { offer: offerDataSchema },
          },
          successCode: OFFER_CODES.OFFER_SERVICE_ASSIGNED,
          successDescription: "Offer service assigned.",
          successMessage: OFFER_MESSAGES.OFFER_SERVICE_ASSIGNED,
        }),
        "/api/v1/admin/offers/{offerId}/services/{serviceId}": jsonEndpoint({
          method: "delete",
          tag: "Admin",
          summary: "Remove offer service",
          description: "Remove one service restriction from an offer.",
          failureDescription: "Offer service removal failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "offerId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokoffer0001" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokservice0001" },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["offerId", "serviceId"],
            properties: {
              offerId: { type: "string", example: "cmokoffer0001" },
              serviceId: { type: "string", example: "cmokservice0001" },
            },
          },
          successCode: OFFER_CODES.OFFER_SERVICE_REMOVED,
          successDescription: "Offer service removed.",
          successMessage: OFFER_MESSAGES.OFFER_SERVICE_REMOVED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/portfolio": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List admin portfolio",
            description:
              "List portfolio items for gallery operations. Branch admins are scoped to their branch.",
            failureDescription: "Admin portfolio list load failed.",
            requiresAuth: true,
            parameters: [
              { name: "branchId", in: "query", required: false, schema: { type: "string" } },
              { name: "staffId", in: "query", required: false, schema: { type: "string" } },
              { name: "serviceId", in: "query", required: false, schema: { type: "string" } },
              { name: "isPublished", in: "query", required: false, schema: { type: "boolean" } },
              { name: "isFeatured", in: "query", required: false, schema: { type: "boolean" } },
              { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
            ],
            responseSchema: {
              type: "object",
              required: ["portfolio", "limit"],
              properties: {
                portfolio: { type: "array", items: portfolioDataSchema },
                limit: { type: "integer", example: 50 },
              },
            },
            successCode: PORTFOLIO_CODES.PORTFOLIO_LISTED,
            successDescription: "Admin portfolio loaded.",
            successMessage: PORTFOLIO_MESSAGES.PORTFOLIO_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create portfolio item",
            description:
              "Create gallery work linked to one branch and optional staff, service, or package.",
            failureDescription: "Portfolio creation failed.",
            requiresAuth: true,
            requestSchema: adminPortfolioRequestSchema,
            responseSchema: {
              type: "object",
              required: ["portfolioItem"],
              properties: { portfolioItem: portfolioDataSchema },
            },
            successCode: PORTFOLIO_CODES.PORTFOLIO_CREATED,
            successDescription: "Portfolio item created.",
            successMessage: PORTFOLIO_MESSAGES.PORTFOLIO_CREATED,
          }),
        },
        "/api/v1/admin/portfolio/{portfolioItemId}": {
          ...jsonEndpoint({
            method: "patch",
            tag: "Admin",
            summary: "Update portfolio item",
            description:
              "Update portfolio content, media URLs, publish state, or sort order.",
            failureDescription: "Portfolio update failed.",
            requiresAuth: true,
            parameters: [
              { name: "portfolioItemId", in: "path", required: true, schema: { type: "string" } },
            ],
            requestSchema: adminPortfolioPatchSchema,
            responseSchema: {
              type: "object",
              required: ["portfolioItem"],
              properties: { portfolioItem: portfolioDataSchema },
            },
            successCode: PORTFOLIO_CODES.PORTFOLIO_UPDATED,
            successDescription: "Portfolio item updated.",
            successMessage: PORTFOLIO_MESSAGES.PORTFOLIO_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "Admin",
            summary: "Delete portfolio item",
            description: "Delete one portfolio item and its linked media assets.",
            failureDescription: "Portfolio deletion failed.",
            requiresAuth: true,
            parameters: [
              { name: "portfolioItemId", in: "path", required: true, schema: { type: "string" } },
            ],
            responseSchema: {
              type: "object",
              required: ["portfolioItemId"],
              properties: {
                portfolioItemId: { type: "string", example: "cmokportfolio0001" },
              },
            },
            successCode: PORTFOLIO_CODES.PORTFOLIO_DELETED,
            successDescription: "Portfolio item deleted.",
            successMessage: PORTFOLIO_MESSAGES.PORTFOLIO_DELETED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/admin/blogs/categories": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List admin blog categories",
            description: "List all blog categories, including inactive categories.",
            failureDescription: "Admin blog category list load failed.",
            requiresAuth: true,
            responseSchema: {
              type: "object",
              required: ["categories"],
              properties: {
                categories: { type: "array", items: blogCategoryDataSchema },
              },
            },
            successCode: BLOG_CODES.CATEGORIES_LISTED,
            successDescription: "Admin blog categories loaded.",
            successMessage: BLOG_MESSAGES.CATEGORIES_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create blog category",
            description: "Create a category used by blog posts.",
            failureDescription: "Blog category creation failed.",
            requiresAuth: true,
            requestSchema: adminBlogCategoryRequestSchema,
            responseSchema: {
              type: "object",
              required: ["category"],
              properties: { category: blogCategoryDataSchema },
            },
            successCode: BLOG_CODES.BLOG_CATEGORY_CREATED,
            successDescription: "Blog category created.",
            successMessage: BLOG_MESSAGES.BLOG_CATEGORY_CREATED,
          }),
        },
        "/api/v1/admin/blogs/categories/{categoryId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update blog category",
          description: "Update blog category fields or deactivate a category.",
          failureDescription: "Blog category update failed.",
          requiresAuth: true,
          parameters: [
            { name: "categoryId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: {
            ...adminBlogCategoryRequestSchema,
            required: undefined,
            minProperties: 1,
          },
          responseSchema: {
            type: "object",
            required: ["category"],
            properties: { category: blogCategoryDataSchema },
          },
          successCode: BLOG_CODES.BLOG_CATEGORY_UPDATED,
          successDescription: "Blog category updated.",
          successMessage: BLOG_MESSAGES.BLOG_CATEGORY_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/blogs": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List admin blogs",
            description: "List draft, published, or archived blog posts.",
            failureDescription: "Admin blog list load failed.",
            requiresAuth: true,
            parameters: [
              { name: "categoryId", in: "query", required: false, schema: { type: "string" } },
              { name: "categorySlug", in: "query", required: false, schema: { type: "string" } },
              { name: "status", in: "query", required: false, schema: { type: "string" } },
              { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
            ],
            responseSchema: {
              type: "object",
              required: ["blogs", "limit"],
              properties: {
                blogs: { type: "array", items: blogDataSchema },
                limit: { type: "integer", example: 50 },
              },
            },
            successCode: BLOG_CODES.BLOGS_LISTED,
            successDescription: "Admin blogs loaded.",
            successMessage: BLOG_MESSAGES.BLOGS_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create blog",
            description: "Create a draft or published blog post.",
            failureDescription: "Blog creation failed.",
            requiresAuth: true,
            requestSchema: adminBlogPostRequestSchema,
            responseSchema: {
              type: "object",
              required: ["blog"],
              properties: { blog: blogDataSchema },
            },
            successCode: BLOG_CODES.BLOG_CREATED,
            successDescription: "Blog created.",
            successMessage: BLOG_MESSAGES.BLOG_CREATED,
          }),
        },
        "/api/v1/admin/blogs/{blogId}": {
          ...jsonEndpoint({
            method: "patch",
            tag: "Admin",
            summary: "Update blog",
            description: "Update blog content, category, status, or publish time.",
            failureDescription: "Blog update failed.",
            requiresAuth: true,
            parameters: [
              { name: "blogId", in: "path", required: true, schema: { type: "string" } },
            ],
            requestSchema: adminBlogPatchSchema,
            responseSchema: {
              type: "object",
              required: ["blog"],
              properties: { blog: blogDataSchema },
            },
            successCode: BLOG_CODES.BLOG_UPDATED,
            successDescription: "Blog updated.",
            successMessage: BLOG_MESSAGES.BLOG_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "Admin",
            summary: "Delete blog",
            description: "Delete one blog post and its linked media assets.",
            failureDescription: "Blog deletion failed.",
            requiresAuth: true,
            parameters: [
              { name: "blogId", in: "path", required: true, schema: { type: "string" } },
            ],
            responseSchema: {
              type: "object",
              required: ["blogId"],
              properties: { blogId: { type: "string", example: "cmokblog0001" } },
            },
            successCode: BLOG_CODES.BLOG_DELETED,
            successDescription: "Blog deleted.",
            successMessage: BLOG_MESSAGES.BLOG_DELETED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/admin/products/categories": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List admin product categories",
            description:
              "List global and branch-specific product categories for retail setup.",
            failureDescription: "Admin product category list load failed.",
            requiresAuth: true,
            parameters: [
              { name: "branchId", in: "query", required: false, schema: { type: "string" } },
              { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
            ],
            responseSchema: {
              type: "object",
              required: ["categories", "limit"],
              properties: {
                categories: { type: "array", items: productCategoryDataSchema },
                limit: { type: "integer", example: 50 },
              },
            },
            successCode: PRODUCT_CODES.CATEGORY_LISTED,
            successDescription: "Admin product categories loaded.",
            successMessage: PRODUCT_MESSAGES.CATEGORY_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create product category",
            description:
              "Create a global or branch-specific retail product category.",
            failureDescription: "Product category creation failed.",
            requiresAuth: true,
            requestSchema: adminProductCategoryRequestSchema,
            responseSchema: {
              type: "object",
              required: ["category"],
              properties: { category: productCategoryDataSchema },
            },
            successCode: PRODUCT_CODES.CATEGORY_CREATED,
            successDescription: "Product category created.",
            successMessage: PRODUCT_MESSAGES.CATEGORY_CREATED,
          }),
        },
        "/api/v1/admin/products/categories/{categoryId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update product category",
          description: "Update product category fields or deactivate a category.",
          failureDescription: "Product category update failed.",
          requiresAuth: true,
          parameters: [
            { name: "categoryId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: {
            ...adminProductCategoryRequestSchema,
            required: undefined,
            minProperties: 1,
          },
          responseSchema: {
            type: "object",
            required: ["category"],
            properties: { category: productCategoryDataSchema },
          },
          successCode: PRODUCT_CODES.CATEGORY_UPDATED,
          successDescription: "Product category updated.",
          successMessage: PRODUCT_MESSAGES.CATEGORY_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/products": {
          ...jsonEndpoint({
            method: "get",
            tag: "Admin",
            summary: "List admin products",
            description: "List retail products for admin inventory setup.",
            failureDescription: "Admin product list load failed.",
            requiresAuth: true,
            parameters: [
              { name: "branchId", in: "query", required: false, schema: { type: "string" } },
              { name: "categoryId", in: "query", required: false, schema: { type: "string" } },
              { name: "categorySlug", in: "query", required: false, schema: { type: "string" } },
              { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
            ],
            responseSchema: {
              type: "object",
              required: ["products", "limit"],
              properties: {
                products: { type: "array", items: productDataSchema },
                limit: { type: "integer", example: 50 },
              },
            },
            successCode: PRODUCT_CODES.PRODUCTS_LISTED,
            successDescription: "Admin products loaded.",
            successMessage: PRODUCT_MESSAGES.PRODUCTS_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "Admin",
            summary: "Create product",
            description: "Create one retail product for an active branch.",
            failureDescription: "Product creation failed.",
            requiresAuth: true,
            requestSchema: adminProductRequestSchema,
            responseSchema: {
              type: "object",
              required: ["product"],
              properties: { product: productDataSchema },
            },
            successCode: PRODUCT_CODES.PRODUCT_CREATED,
            successDescription: "Product created.",
            successMessage: PRODUCT_MESSAGES.PRODUCT_CREATED,
          }),
        },
        "/api/v1/admin/products/{productId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Update product",
          description: "Update product details, price, stock, or active state.",
          failureDescription: "Product update failed.",
          requiresAuth: true,
          parameters: [
            { name: "productId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestSchema: adminProductPatchSchema,
          responseSchema: {
            type: "object",
            required: ["product"],
            properties: { product: productDataSchema },
          },
          successCode: PRODUCT_CODES.PRODUCT_UPDATED,
          successDescription: "Product updated.",
          successMessage: PRODUCT_MESSAGES.PRODUCT_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/admin/reviews/{reviewId}": jsonEndpoint({
          method: "patch",
          tag: "Admin",
          summary: "Moderate review",
          description:
            "Approve or hide one review. Branch admins can moderate reviews for their branch; super admins can moderate all reviews.",
          failureDescription: "Review moderation failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "reviewId",
              in: "path",
              required: true,
              schema: { type: "string", example: "cmokreview0001" },
            },
          ],
          requestSchema: updateReviewModerationRequestSchema,
          responseSchema: {
            type: "object",
            required: ["review"],
            properties: { review: reviewDataSchema },
          },
          successCode: REVIEW_CODES.REVIEW_UPDATED,
          successDescription: "Review updated.",
          successMessage: REVIEW_MESSAGES.REVIEW_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
