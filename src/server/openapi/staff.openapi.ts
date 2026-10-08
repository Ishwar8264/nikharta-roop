import type { OpenAPIV3_1 } from "openapi-types";

/** Staff paths: members, schedules, leaves, skills. */
export const staffPaths = {
      "/api/v1/salons/{salonId}/staff": {
        get: {
          tags: ["Staff"],
          summary: "List staff in a salon",
          operationId: "listSalonStaff",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "role",
              in: "query",
              schema: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            },
          ],
          responses: {
            "200": {
              description: "Paginated staff list",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedStaffResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
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
      "/api/v1/salons/{salonId}/staff/{staffId}": {
        get: {
          tags: ["Staff"],
          summary: "Get a staff member",
          operationId: "getStaffDetail",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Staff detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StaffResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or staff member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/schedule": {
        get: {
          tags: ["Staff"],
          summary: "Get a staff member's weekly schedule",
          operationId: "getStaffSchedule",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Weekly schedule",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScheduleResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or staff member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Staff"],
          summary: "Replace a staff member's weekly schedule",
          description:
            "Requires MANAGER or OWNER. Staff cannot edit their own schedule.",
          operationId: "replaceStaffSchedule",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReplaceScheduleRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Schedule replaced",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScheduleResponse" },
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
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/leaves": {
        get: {
          tags: ["Staff"],
          summary: "List leave requests",
          operationId: "listStaffLeaves",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Leave requests",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedLeavesResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Staff"],
          summary: "Request a leave",
          operationId: "createStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateLeaveRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Leave requested",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LeaveResponse" },
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
            "403": { $ref: "#/components/responses/Forbidden" },
            "409": {
              description: "Overlapping leave exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/leaves/{leaveId}": {
        patch: {
          tags: ["Staff"],
          summary: "Approve or reject a leave",
          operationId: "updateStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "leaveId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateLeaveRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Leave updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LeaveResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, staff member, or leave not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Staff"],
          summary: "Cancel a leave",
          operationId: "cancelStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "leaveId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Leave cancelled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, staff member, or leave not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Approved leave requires manager cancellation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/skills": {
        get: {
          tags: ["Staff"],
          summary: "List a staff member's skills",
          operationId: "getStaffSkills",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Skill list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SkillsResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        put: {
          tags: ["Staff"],
          summary: "Replace a staff member's skills",
          operationId: "replaceStaffSkills",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReplaceSkillsRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Skills replaced",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SkillsResponse" },
                },
              },
            },
            "400": {
              description: "Validation failure or service from another salon",
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
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/v1/salons/{salonId}/services/{serviceId}/staff": {
        get: {
          tags: ["Staff"],
          summary: "List staff who can perform a service",
          operationId: "listStaffForSalonService",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Staff who can perform the service",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StaffListResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
} as unknown as OpenAPIV3_1.PathsObject;

/** Staff schemas. */
export const staffSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        StaffMember: {
          type: "object",
          required: ["id", "userId", "salonId", "role", "user"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            userId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            user: {
              type: "object",
              required: ["id", "name", "email", "avatar"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: ["string", "null"] },
                email: { type: ["string", "null"], format: "email" },
                avatar: { type: ["string", "null"], format: "uri" },
              },
            },
          },
        },
        ScheduleDay: {
          type: "object",
          required: ["id", "day", "startTime", "endTime", "isOff"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            day: {
              type: "string",
              enum: [
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ],
            },
            startTime: {
              type: ["string", "null"],
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            endTime: {
              type: ["string", "null"],
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            isOff: { type: "boolean" },
          },
        },
        StaffLeave: {
          type: "object",
          required: [
            "id",
            "staffId",
            "salonId",
            "startDate",
            "endDate",
            "reason",
            "approved",
            "createdAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            staffId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            reason: { type: ["string", "null"] },
            approved: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        StaffSkill: {
          type: "object",
          required: ["serviceId", "experience", "service"],
          properties: {
            serviceId: { $ref: "#/components/schemas/ResourceId" },
            experience: { type: ["integer", "null"], minimum: 0, maximum: 80 },
            service: {
              type: "object",
              required: ["id", "name", "slug"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: "string" },
                slug: { type: "string" },
              },
            },
          },
        },
        ReplaceScheduleRequest: {
          type: "object",
          additionalProperties: false,
          required: ["days"],
          properties: {
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["day"],
                properties: {
                  day: {
                    $ref: "#/components/schemas/ScheduleDay/properties/day",
                  },
                  startTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  endTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  isOff: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        CreateLeaveRequest: {
          type: "object",
          additionalProperties: false,
          required: ["startDate", "endDate"],
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            reason: { type: "string", maxLength: 500 },
          },
        },
        UpdateLeaveRequest: {
          type: "object",
          additionalProperties: false,
          required: ["approved"],
          properties: { approved: { type: "boolean" } },
        },
        ReplaceSkillsRequest: {
          type: "object",
          additionalProperties: false,
          required: ["skills"],
          properties: {
            skills: {
              type: "array",
              maxItems: 100,
              uniqueItems: true,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["serviceId"],
                properties: {
                  serviceId: { $ref: "#/components/schemas/ResourceId" },
                  experience: { type: "integer", minimum: 0, maximum: 80 },
                },
              },
            },
          },
        },
        StaffResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["staff"],
              properties: {
                staff: { $ref: "#/components/schemas/StaffMember" },
              },
            },
          },
        },
        StaffListResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffMember" },
            },
          },
        },
        PaginatedStaffResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffMember" },
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
        ScheduleResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["schedule"],
              properties: {
                schedule: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ScheduleDay" },
                },
              },
            },
          },
        },
        LeaveResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["leave"],
              properties: {
                leave: { $ref: "#/components/schemas/StaffLeave" },
              },
            },
          },
        },
        PaginatedLeavesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffLeave" },
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
        SkillsResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["skills"],
              properties: {
                skills: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StaffSkill" },
                },
              },
            },
          },
        },
};
