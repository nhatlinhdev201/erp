// src/lib/openapi/spec.ts
// OpenAPI 3.0 Specification for L-ERP HRM API

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'L-ERP HRM API',
        version: '1.0.0',
        description: `
# L-ERP HRM REST API

Hệ thống API RESTful cho Quản lý Nhân sự Thông minh (AI-First HRM).

## Authentication
Tất cả các endpoints yêu cầu xác thực qua session cookie hoặc Bearer token.

## Rate Limiting
- 100 requests/minute cho authenticated users
- 20 requests/minute cho unauthenticated requests

## Response Format
Tất cả responses trả về JSON với format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
\`\`\`

## Error Handling
Errors trả về với HTTP status codes thích hợp:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
    `,
        contact: {
            name: 'L-ERP HRM Support',
            email: 'support@your-domain.com',
        },
        license: {
            name: 'Proprietary',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000/api',
            description: 'Development server',
        },
        {
            url: 'https://your-domain.com/api',
            description: 'Production server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Employees', description: 'Employee management' },
        { name: 'Attendance', description: 'Attendance tracking' },
        { name: 'Leave', description: 'Leave management' },
        { name: 'Payroll', description: 'Payroll processing' },
        { name: 'Performance', description: 'Performance management' },
        { name: 'Learning', description: 'Learning & Development' },
        { name: 'Recruitment', description: 'Recruitment pipeline' },
        { name: 'AI', description: 'AI-powered features' },
        { name: 'Admin', description: 'System administration' },
    ],
    paths: {
        // ═══════════════════════════════════════════════════════════════
        // HEALTH CHECK
        // ═══════════════════════════════════════════════════════════════
        '/health': {
            get: {
                summary: 'Health Check',
                description: 'Check system health status',
                tags: ['Admin'],
                responses: {
                    '200': {
                        description: 'System is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        database: { type: 'string', example: 'connected' },
                                        memory: {
                                            type: 'object',
                                            properties: {
                                                used: { type: 'number' },
                                                total: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // EMPLOYEES
        // ═══════════════════════════════════════════════════════════════
        '/employees': {
            get: {
                summary: 'List Employees',
                description: 'Get paginated list of employees',
                tags: ['Employees'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                    { name: 'departmentId', in: 'query', schema: { type: 'string' } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PROBATION'] } },
                ],
                responses: {
                    '200': {
                        description: 'List of employees',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Employee' },
                                        },
                                        pagination: { $ref: '#/components/schemas/Pagination' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create Employee',
                description: 'Create a new employee',
                tags: ['Employees'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateEmployeeInput' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Employee created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Employee' },
                            },
                        },
                    },
                },
            },
        },
        '/employees/{id}': {
            get: {
                summary: 'Get Employee',
                description: 'Get employee by ID',
                tags: ['Employees'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'Employee details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Employee' },
                            },
                        },
                    },
                    '404': { description: 'Employee not found' },
                },
            },
            put: {
                summary: 'Update Employee',
                description: 'Update employee information',
                tags: ['Employees'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateEmployeeInput' },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Employee updated' },
                },
            },
            delete: {
                summary: 'Delete Employee',
                description: 'Soft delete an employee',
                tags: ['Employees'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Employee deleted' },
                },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // ATTENDANCE
        // ═══════════════════════════════════════════════════════════════
        '/attendance': {
            get: {
                summary: 'List Attendance Records',
                description: 'Get attendance records with filters',
                tags: ['Attendance'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
                    { name: 'employeeId', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'List of attendance records',
                    },
                },
            },
        },
        '/attendance/check-in': {
            post: {
                summary: 'Check In',
                description: 'Record employee check-in',
                tags: ['Attendance'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    location: {
                                        type: 'object',
                                        properties: {
                                            latitude: { type: 'number' },
                                            longitude: { type: 'number' },
                                        },
                                    },
                                    device: { type: 'string' },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Check-in recorded' },
                },
            },
        },
        '/attendance/check-out': {
            post: {
                summary: 'Check Out',
                description: 'Record employee check-out',
                tags: ['Attendance'],
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Check-out recorded' },
                },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // LEAVE
        // ═══════════════════════════════════════════════════════════════
        '/leave': {
            get: {
                summary: 'List Leave Requests',
                description: 'Get leave requests',
                tags: ['Leave'],
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'List of leave requests' },
                },
            },
            post: {
                summary: 'Create Leave Request',
                description: 'Submit a new leave request',
                tags: ['Leave'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateLeaveRequest' },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Leave request created' },
                },
            },
        },
        '/leave/balance': {
            get: {
                summary: 'Get Leave Balance',
                description: 'Get leave balance for current user',
                tags: ['Leave'],
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Leave balance',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LeaveBalance' },
                            },
                        },
                    },
                },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // PAYROLL
        // ═══════════════════════════════════════════════════════════════
        '/payroll': {
            get: {
                summary: 'List Payroll Records',
                description: 'Get payroll records',
                tags: ['Payroll'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'year', in: 'query', schema: { type: 'integer' } },
                    { name: 'month', in: 'query', schema: { type: 'integer' } },
                ],
                responses: {
                    '200': { description: 'List of payroll records' },
                },
            },
        },
        '/payroll/calculate': {
            post: {
                summary: 'Calculate Payroll',
                description: 'Calculate payroll for a period',
                tags: ['Payroll'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['periodId'],
                                properties: {
                                    periodId: { type: 'string' },
                                    employeeIds: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Calculation results' },
                },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // AI
        // ═══════════════════════════════════════════════════════════════
        '/ai/chat': {
            post: {
                summary: 'AI Chat',
                description: 'Send message to HR Copilot',
                tags: ['AI'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['message'],
                                properties: {
                                    message: { type: 'string' },
                                    conversationId: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'AI response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        intent: { type: 'string' },
                                        actions: { type: 'array', items: { type: 'object' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/ai/insights': {
            get: {
                summary: 'Get AI Insights',
                description: 'Get AI-generated insights',
                tags: ['AI'],
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'List of insights' },
                },
            },
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // COMPONENTS
    // ═══════════════════════════════════════════════════════════════
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            Employee: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    departmentId: { type: 'string' },
                    positionId: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PROBATION'] },
                    hireDate: { type: 'string', format: 'date' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateEmployeeInput: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'departmentId', 'positionId'],
                properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    departmentId: { type: 'string' },
                    positionId: { type: 'string' },
                    hireDate: { type: 'string', format: 'date' },
                },
            },
            UpdateEmployeeInput: {
                type: 'object',
                properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PROBATION'] },
                },
            },
            CreateLeaveRequest: {
                type: 'object',
                required: ['leaveType', 'startDate', 'endDate'],
                properties: {
                    leaveType: { type: 'string', enum: ['ANNUAL', 'SICK', 'MATERNITY', 'PERSONAL', 'UNPAID'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    reason: { type: 'string' },
                },
            },
            LeaveBalance: {
                type: 'object',
                properties: {
                    year: { type: 'integer' },
                    balances: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                total: { type: 'number' },
                                used: { type: 'number' },
                                remaining: { type: 'number' },
                            },
                        },
                    },
                },
            },
            Pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
            },
        },
    },
}

export default openApiSpec
