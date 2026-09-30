import type { OpenAPIV3_1 } from "openapi-types";

/** OpenAPI paths exposed by the appointment module. */
export const appointmentPaths: OpenAPIV3_1.PathsObject = {
      // ============================================================
      // APPOINTMENTS
      // ============================================================
      "/api/v1/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List the current user's appointments",
          description:
            "Returns the authenticated user's appointments as a customer. " +
            "Use `upcoming=true` to see only future bookings that are not yet " +
            "terminal (SCHEDULED or CONFIRMED).",
          operationId: "listMyAppointments",
          security: [{ bearerAuth: [] }, { accessCookie: [] }],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "SCHEDULED",
                  "CONFIRMED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                  "RESCHEDULED",
                ],
              },
            },
            {
              name: "upcoming",
              in: "query",
              schema: {
                type: "string",
                enum: ["true", "false"],
              },
              description: "Filter to only future SCHEDULED/CONFIRMED bookings.",
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of appointments",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedAppointmentsResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid list filters",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "500": {
              description: "Unexpected listing failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Appointments"],
          summary: "Create an appointment",
          description:
            "Books one or more services at a salon. If `customerId` is omitted " +
            "the authenticated user is treated as the customer. Staff members " +
            "at MANAGER+ level can book on behalf of another customer. The " +
            "server derives `endTime` from the sum of service durations and " +
            "validates the slot against salon hours, staff schedule, approved " +
            "leaves, and existing bookings inside a serializable transaction.",
          operationId: "createAppointment",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateAppointmentRequest",
                },
                examples: {
                  selfBooking: {
                    summary: "Self-booking, single service",
                    value: {
                      salonRef: "glamour-studio",
                      staffId: "3fe48374dc93727a7c57bd53796fe078dc46b76b6f21fffb",
                      startTime: "2026-10-01T10:00:00+05:30",
                      services: [
                        {
                          serviceId:
                            "7a2c4e5f6879a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e",
                        },
                      ],
                      notes: "First booking",
                    },
                  },
                  walkIn: {
                    summary: "Manager booking for a customer",
                    value: {
                      salonRef: "glamour-studio",
                      customerId:
                        "84e31f150f4d44229698298ae23eeb27f8c9d0e1a2b3c4d5",
                      staffId:
                        "3fe48374dc93727a7c57bd53796fe078dc46b76b6f21fffb",
                      startTime: "2026-10-01T14:00:00+05:30",
                      services: [
                        {
                          serviceId:
                            "7a2c4e5f6879a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Appointment created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AppointmentResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Validation failure, start time in the past, unknown services, or staff lacks required skills",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "Not allowed to book on behalf of another customer",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description:
                "Slot taken, outside salon hours, outside staff schedule, or staff on leave",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/appointments/{appointmentId}": {
        get: {
          tags: ["Appointments"],
          summary: "Get an appointment",
          description:
            "Returns the appointment if the caller is the customer, the " +
            "assigned staff member, or a MANAGER+ at the salon.",
          operationId: "getAppointment",
          security: [{ bearerAuth: [] }, { accessCookie: [] }],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Appointment detail",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AppointmentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid appointment ID",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "No access to this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/appointments/{appointmentId}/cancel": {
        post: {
          tags: ["Appointments"],
          summary: "Cancel an appointment",
          description:
            "Customers can cancel their own booking. Assigned staff and " +
            "MANAGER+ can cancel an appointment. A terminal-state appointment " +
            "cannot be cancelled again.",
          operationId: "cancelAppointment",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CancelAppointmentRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Appointment cancelled",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AppointmentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "Not allowed to cancel this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Appointment is in a terminal state",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/appointments/{appointmentId}/reschedule": {
        post: {
          tags: ["Appointments"],
          summary: "Reschedule an appointment",
          description:
            "Marks the current appointment as RESCHEDULED and creates a new " +
            "appointment with `rescheduledFrom` pointing at the old one. The " +
            "new slot is validated against the same availability rules as a " +
            "fresh booking.",
          operationId: "rescheduleAppointment",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RescheduleAppointmentRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "New appointment created; original marked RESCHEDULED",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AppointmentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure or start time in the past",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "No access to this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description:
                "Terminal state, slot taken, outside hours, or staff on leave",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/appointments/{appointmentId}/status": {
        patch: {
          tags: ["Appointments"],
          summary: "Update appointment status",
          description:
            "Advances the appointment through its lifecycle. Allowed " +
            "transitions: SCHEDULED→CONFIRMED/CANCELLED, " +
            "CONFIRMED→IN_PROGRESS/CANCELLED/NO_SHOW, " +
            "IN_PROGRESS→COMPLETED/CANCELLED. Terminal states cannot be " +
            "modified. Customers may only transition to CANCELLED.",
          operationId: "updateAppointmentStatus",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateAppointmentStatusRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Status updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AppointmentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "Not allowed to transition this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Invalid transition or terminal state",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/appointments/{appointmentId}/payment": {
        post: {
          tags: ["Appointments"],
          summary: "Record a payment",
          description:
            "Records a payment for the appointment. CASH payments are captured " +
            "as PAID immediately; ONLINE/CARD/UPI/WALLET payments start as " +
            "PENDING until a gateway callback confirms them. Customers and " +
            "salon staff may record a payment.",
          operationId: "recordAppointmentPayment",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreatePaymentRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Payment recorded",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaymentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "No access to this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Payment already exists for this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Appointments"],
          summary: "Update the appointment payment",
          description:
            "Reconciles a payment record — status changes, refunds, gateway " +
            "reference updates. Requires MANAGER+ at the appointment's salon.",
          operationId: "updateAppointmentPayment",
          security: [
            { bearerAuth: [] },
            { accessCookie: [], csrfToken: [] },
          ],
          parameters: [
            {
              name: "appointmentId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdatePaymentRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Payment updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaymentResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": {
              description: "No access to this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Appointment or payment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonRef}/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List appointments for a salon",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "listSalonAppointments",
          security: [{ bearerAuth: [] }, { accessCookie: [] }],
          parameters: [
            {
              name: "salonRef",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Page size. Defaults to 20, max 100.",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "SCHEDULED",
                  "CONFIRMED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                  "RESCHEDULED",
                ],
              },
            },
            {
              name: "staffId",
              in: "query",
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "from",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
            {
              name: "to",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of appointments",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedAppointmentsResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonRef}/availability": {
        get: {
          tags: ["Appointments"],
          summary: "Compute availability for a staff member",
          description:
            "Public endpoint. Returns bookable start-time slots for a given " +
            "date, computed as the intersection of salon opening hours, staff " +
            "scheduled hours, approved leaves, and existing bookings. Slots " +
            "are returned in the salon's local timezone.",
          operationId: "getSalonAvailability",
          security: [],
          parameters: [
            {
              name: "salonRef",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "query",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "serviceIds",
              in: "query",
              required: true,
              description: "Comma-separated list of service IDs",
              schema: { type: "string" },
              example:
                "7a2c4e5f6879a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e",
            },
            {
              name: "date",
              in: "query",
              required: true,
              description: "Target date in YYYY-MM-DD format",
              schema: {
                type: "string",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              example: "2026-10-01",
            },
          ],
          responses: {
            "200": {
              description: "Availability slots",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AvailabilityResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Validation failure, unavailable service, or staff skill mismatch",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
};

/** Reusable OpenAPI schemas exposed by the appointment module. */
export const appointmentSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        // ============================================================
        // APPOINTMENT SCHEMAS
        // ============================================================
        AppointmentServiceLine: {
          type: "object",
          required: ["serviceId", "staffId", "price", "service", "staff"],
          properties: {
            serviceId: { $ref: "#/components/schemas/ResourceId" },
            staffId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            price: { type: "number", format: "double" },
            service: {
              type: "object",
              required: ["id", "name", "slug", "duration", "images"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: "string" },
                slug: { type: "string" },
                duration: { type: "integer" },
                images: {
                  type: "array",
                  items: { type: "string", format: "uri" },
                },
              },
            },
            staff: {
              oneOf: [
                {
                  type: "object",
                  required: ["id", "name", "avatar"],
                  properties: {
                    id: { $ref: "#/components/schemas/ResourceId" },
                    name: { type: ["string", "null"] },
                    avatar: { type: ["string", "null"], format: "uri" },
                  },
                },
                { type: "null" },
              ],
            },
          },
        },
        Payment: {
          type: "object",
          required: [
            "id",
            "appointmentId",
            "amount",
            "status",
            "method",
            "transactionId",
            "gatewayRef",
            "refundAmount",
            "createdAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            appointmentId: { $ref: "#/components/schemas/ResourceId" },
            amount: { type: "number", format: "double" },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "PAID",
                "PARTIALLY_PAID",
                "REFUNDED",
                "FAILED",
              ],
            },
            method: {
              type: "string",
              enum: ["CASH", "CARD", "UPI", "WALLET", "ONLINE"],
            },
            transactionId: { type: ["string", "null"] },
            gatewayRef: { type: ["string", "null"] },
            refundAmount: { type: ["number", "null"], format: "double" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Appointment: {
          type: "object",
          required: [
            "id",
            "customerId",
            "salonId",
            "staffId",
            "startTime",
            "endTime",
            "status",
            "subtotal",
            "discount",
            "tax",
            "totalPrice",
            "notes",
            "cancelReason",
            "rescheduledFrom",
            "salon",
            "services",
            "payment",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            customerId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            staffId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: [
                "SCHEDULED",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
                "RESCHEDULED",
              ],
            },
            subtotal: { type: "number", format: "double" },
            discount: { type: "number", format: "double" },
            tax: { type: "number", format: "double" },
            totalPrice: { type: "number", format: "double" },
            notes: { type: ["string", "null"] },
            cancelReason: { type: ["string", "null"] },
            rescheduledFrom: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            salon: {
              type: "object",
              required: ["id", "name", "slug", "timezone"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: "string" },
                slug: { type: "string" },
                timezone: { type: "string" },
              },
            },
            services: {
              type: "array",
              items: { $ref: "#/components/schemas/AppointmentServiceLine" },
            },
            payment: {
              oneOf: [
                { $ref: "#/components/schemas/Payment" },
                { type: "null" },
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateAppointmentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["salonRef", "startTime", "services"],
          properties: {
            salonRef: {
              type: "string",
              minLength: 2,
              maxLength: 80,
              description: "Salon slug or id",
              example: "glamour-studio",
            },
            customerId: {
              $ref: "#/components/schemas/ResourceId",
              description:
                "Optional. When omitted the caller is the customer. Only " +
                "MANAGER+ members of the salon may supply this.",
            },
            staffId: { $ref: "#/components/schemas/ResourceId" },
            startTime: { type: "string", format: "date-time" },
            services: {
              type: "array",
              minItems: 1,
              maxItems: 20,
              description: "Each service ID may appear at most once.",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["serviceId"],
                properties: {
                  serviceId: { $ref: "#/components/schemas/ResourceId" },
                  staffId: { $ref: "#/components/schemas/ResourceId" },
                },
              },
            },
            notes: { type: "string", maxLength: 2000 },
            couponCode: {
              type: "string",
              minLength: 3,
              maxLength: 32,
              pattern: "^[A-Za-z0-9-]+$",
            },
          },
        },
        CancelAppointmentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["reason"],
          properties: {
            reason: { type: "string", minLength: 2, maxLength: 500 },
          },
        },
        RescheduleAppointmentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["startTime"],
          properties: {
            startTime: { type: "string", format: "date-time" },
            staffId: { $ref: "#/components/schemas/ResourceId" },
          },
        },
        UpdateAppointmentStatusRequest: {
          type: "object",
          additionalProperties: false,
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: [
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
              ],
            },
            reason: { type: "string", maxLength: 500 },
          },
        },
        CreatePaymentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["amount", "method"],
          properties: {
            amount: {
              type: "number",
              format: "double",
              minimum: 0,
              maximum: 10000000,
            },
            method: {
              type: "string",
              enum: ["CASH", "CARD", "UPI", "WALLET", "ONLINE"],
            },
            transactionId: { type: "string", maxLength: 128 },
            gatewayRef: { type: "string", maxLength: 255 },
          },
        },
        UpdatePaymentRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            status: {
              type: "string",
              enum: [
                "PENDING",
                "PAID",
                "PARTIALLY_PAID",
                "REFUNDED",
                "FAILED",
              ],
            },
            refundAmount: {
              type: "number",
              format: "double",
              minimum: 0,
              maximum: 10000000,
            },
            transactionId: { type: "string", maxLength: 128 },
            gatewayRef: { type: "string", maxLength: 255 },
          },
        },
        AppointmentResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["appointment"],
              properties: {
                appointment: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
        },
        PaymentResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["payment"],
              properties: {
                payment: { $ref: "#/components/schemas/Payment" },
              },
            },
          },
        },
        PaginatedAppointmentsResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Appointment" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        AvailabilitySlot: {
          type: "object",
          required: ["startTime", "endTime"],
          properties: {
            startTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
              example: "10:00",
            },
            endTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
              example: "10:30",
            },
          },
        },
        AvailabilityResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["date", "timezone", "slots"],
              properties: {
                date: {
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  example: "2026-10-01",
                },
                timezone: { type: "string", example: "Asia/Kolkata" },
                slots: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AvailabilitySlot" },
                },
              },
            },
          },
        },
};
