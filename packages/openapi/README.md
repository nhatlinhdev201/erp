# @linkk/openapi

OpenAPI 3.1 specification generator and Swagger UI integration for L-ERP applications.

> **Available in**: [English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

### Overview

`@linkk/openapi` provides a simple, type-safe way to generate OpenAPI 3.1 specifications and integrate Swagger UI documentation in Next.js applications.

**Features:**
- OpenAPI 3.1 specification builder
- Type-safe endpoint and schema management
- Swagger UI integration via CDN (no additional dependencies)
- Next.js API route helpers
- L-ERP branding support

### Installation

This package is included in the monorepo. Import it directly:

```typescript
import {
  createOpenAPISpec,
  addEndpoint,
  addSchema,
  addTagGroup,
  createDocsRoute,
  createSwaggerRoute,
} from '@linkk/openapi';
```

### Basic Usage

#### 1. Create a Base Specification

```typescript
import { createOpenAPISpec, addTagGroup, addEndpoint, addSchema } from '@linkk/openapi';

const spec = createOpenAPISpec({
  title: 'L-ERP API',
  version: '1.0.0',
  description: 'Enterprise Resource Planning API',
  basePath: 'https://api.lerp.local',
});

// Add tag groups for organizing endpoints
addTagGroup(spec, 'Users', 'User management endpoints');
addTagGroup(spec, 'Products', 'Product catalog endpoints');
```

#### 2. Define Schemas

```typescript
// Add request/response schemas
addSchema(spec, 'User', {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'name'],
});

addSchema(spec, 'CreateUserRequest', {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['email', 'name', 'password'],
});

addSchema(spec, 'Error', {
  type: 'object',
  properties: {
    code: { type: 'string' },
    message: { type: 'string' },
    requestId: { type: 'string' },
  },
  required: ['code', 'message'],
});
```

#### 3. Add Endpoints

```typescript
// GET /api/users/:id
addEndpoint(spec, '/api/users/{id}', 'get', {
  summary: 'Get user by ID',
  description: 'Retrieve a user by their ID',
  tags: ['Users'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'User ID (UUID)',
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  responses: {
    '200': {
      description: 'User retrieved successfully',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      },
    },
    '404': {
      description: 'User not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
});

// POST /api/users
addEndpoint(spec, '/api/users', 'post', {
  summary: 'Create a new user',
  description: 'Create a new user account',
  tags: ['Users'],
  requestBody: {
    required: true,
    description: 'User creation data',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/CreateUserRequest' },
      },
    },
  },
  responses: {
    '201': {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      },
    },
    '400': {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
});
```

### Next.js Integration

#### 4. Create API Documentation Routes

**app/api/docs/route.ts** — OpenAPI spec endpoint:

```typescript
import { createDocsRoute } from '@linkk/openapi';
import { spec } from '@/lib/openapi'; // Your spec instance

export const GET = createDocsRoute(spec);
```

**app/api/docs/ui/route.ts** — Swagger UI endpoint:

```typescript
import { createSwaggerRoute } from '@linkk/openapi';

export const GET = createSwaggerRoute('/api/docs');
```

#### 5. Access Documentation

- **OpenAPI JSON**: `http://localhost:3000/api/docs`
- **Swagger UI**: `http://localhost:3000/api/docs/ui`

### Complete Example

**lib/openapi.ts:**

```typescript
import {
  createOpenAPISpec,
  addTagGroup,
  addEndpoint,
  addSchema,
} from '@linkk/openapi';

export const spec = createOpenAPISpec({
  title: 'L-ERP API',
  version: '1.0.0',
  description: 'Enterprise Resource Planning System',
  basePath: process.env.API_BASE_URL || 'http://localhost:3000/api',
});

// Setup tags
addTagGroup(spec, 'Users', 'User management');
addTagGroup(spec, 'Products', 'Product management');

// Define schemas
addSchema(spec, 'User', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
  },
  required: ['id', 'email', 'name'],
});

// Add endpoints
addEndpoint(spec, '/users', 'get', {
  summary: 'List users',
  tags: ['Users'],
  parameters: [
    {
      name: 'skip',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 0 },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 50 },
    },
  ],
  responses: {
    '200': {
      description: 'List of users',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
  },
});
```

### API Reference

#### `createOpenAPISpec(config)`

Creates a base OpenAPI 3.1 specification object.

**Parameters:**
- `config.title` (string, required) — API title
- `config.version` (string, required) — API version
- `config.description` (string, optional) — API description
- `config.basePath` (string, optional) — Base URL
- `config.servers` (array, optional) — Server configurations

**Returns:** `OpenAPISpec` object

#### `addEndpoint(spec, path, method, config)`

Adds an endpoint to the OpenAPI specification.

**Parameters:**
- `spec` — OpenAPI spec object
- `path` (string) — URL path (e.g., `/api/users/{id}`)
- `method` (string) — HTTP method (get, post, put, patch, delete, head, options)
- `config.summary` (string) — Brief description
- `config.description` (string, optional) — Detailed description
- `config.tags` (string[], optional) — Tag categories
- `config.parameters` (array, optional) — Query/path/header parameters
- `config.requestBody` (object, optional) — Request body schema
- `config.responses` (object) — Response definitions
- `config.deprecated` (boolean, optional) — Mark as deprecated
- `config.security` (array, optional) — Security schemes

#### `addSchema(spec, name, schema)`

Adds a reusable schema/component to the specification.

**Parameters:**
- `spec` — OpenAPI spec object
- `name` (string) — Schema name
- `schema` (object) — JSON Schema definition

#### `addTagGroup(spec, name, description?)`

Adds a tag group for organizing endpoints.

**Parameters:**
- `spec` — OpenAPI spec object
- `name` (string) — Tag name
- `description` (string, optional) — Tag description

#### `swaggerUIHandler(specUrl)`

Generates HTML for Swagger UI.

**Parameters:**
- `specUrl` (string) — URL to OpenAPI spec JSON

**Returns:** HTML string

#### `specHandler(spec)`

Prepares OpenAPI spec for HTTP response.

**Parameters:**
- `spec` (object) — OpenAPI spec object

**Returns:** Response object with status, headers, and body

#### `createDocsRoute(spec)`

Creates a Next.js GET handler for the OpenAPI spec endpoint.

**Parameters:**
- `spec` (object) — OpenAPI spec object

**Returns:** Next.js route handler function

#### `createSwaggerRoute(specUrl)`

Creates a Next.js GET handler for the Swagger UI endpoint.

**Parameters:**
- `specUrl` (string) — URL to OpenAPI spec JSON

**Returns:** Next.js route handler function

---

## Tiếng Việt

### Tổng Quan

`@linkk/openapi` cung cấp cách đơn giản, an toàn về kiểu để tạo OpenAPI 3.1 và tích hợp tài liệu Swagger UI trong ứng dụng Next.js.

**Tính năng:**
- Trình tạo thông số OpenAPI 3.1
- Quản lý điểm cuối và sơ đồ an toàn về kiểu
- Tích hợp Swagger UI qua CDN (không có phụ thuộc bổ sung)
- Trợ giúp tuyến đường API Next.js
- Hỗ trợ thương hiệu L-ERP

### Cài Đặt

Gói này được bao gồm trong monorepo. Nhập trực tiếp:

```typescript
import {
  createOpenAPISpec,
  addEndpoint,
  addSchema,
  addTagGroup,
  createDocsRoute,
  createSwaggerRoute,
} from '@linkk/openapi';
```

### Sử Dụng Cơ Bản

#### 1. Tạo Thông Số Cơ Sở

```typescript
import { createOpenAPISpec, addTagGroup, addEndpoint, addSchema } from '@linkk/openapi';

const spec = createOpenAPISpec({
  title: 'L-ERP API',
  version: '1.0.0',
  description: 'API Hệ thống Quản lý Tài nguyên Doanh nghiệp',
  basePath: 'https://api.lerp.local',
});

// Thêm nhóm thẻ để tổ chức các điểm cuối
addTagGroup(spec, 'Users', 'Điểm cuối quản lý người dùng');
addTagGroup(spec, 'Products', 'Điểm cuối danh mục sản phẩm');
```

#### 2. Xác Định Sơ Đồ

```typescript
// Thêm sơ đồ yêu cầu/phản hồi
addSchema(spec, 'User', {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'name'],
});

addSchema(spec, 'CreateUserRequest', {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['email', 'name', 'password'],
});

addSchema(spec, 'Error', {
  type: 'object',
  properties: {
    code: { type: 'string' },
    message: { type: 'string' },
    requestId: { type: 'string' },
  },
  required: ['code', 'message'],
});
```

#### 3. Thêm Điểm Cuối

```typescript
// GET /api/users/:id
addEndpoint(spec, '/api/users/{id}', 'get', {
  summary: 'Lấy người dùng theo ID',
  description: 'Truy xuất thông tin người dùng theo ID',
  tags: ['Users'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'ID người dùng (UUID)',
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  responses: {
    '200': {
      description: 'Người dùng được truy xuất thành công',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      },
    },
    '404': {
      description: 'Không tìm thấy người dùng',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
});

// POST /api/users
addEndpoint(spec, '/api/users', 'post', {
  summary: 'Tạo người dùng mới',
  description: 'Tạo tài khoản người dùng mới',
  tags: ['Users'],
  requestBody: {
    required: true,
    description: 'Dữ liệu tạo người dùng',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/CreateUserRequest' },
      },
    },
  },
  responses: {
    '201': {
      description: 'Người dùng được tạo thành công',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      },
    },
    '400': {
      description: 'Phần thân yêu cầu không hợp lệ',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
});
```

### Tích Hợp Next.js

#### 4. Tạo Tuyến Đường Tài Liệu API

**app/api/docs/route.ts** — Điểm cuối thông số OpenAPI:

```typescript
import { createDocsRoute } from '@linkk/openapi';
import { spec } from '@/lib/openapi'; // Thể hiện thông số của bạn

export const GET = createDocsRoute(spec);
```

**app/api/docs/ui/route.ts** — Điểm cuối Swagger UI:

```typescript
import { createSwaggerRoute } from '@linkk/openapi';

export const GET = createSwaggerRoute('/api/docs');
```

#### 5. Truy Cập Tài Liệu

- **OpenAPI JSON**: `http://localhost:3000/api/docs`
- **Swagger UI**: `http://localhost:3000/api/docs/ui`

### Ví Dụ Hoàn Chỉnh

**lib/openapi.ts:**

```typescript
import {
  createOpenAPISpec,
  addTagGroup,
  addEndpoint,
  addSchema,
} from '@linkk/openapi';

export const spec = createOpenAPISpec({
  title: 'L-ERP API',
  version: '1.0.0',
  description: 'Hệ Thống Quản Lý Tài Nguyên Doanh Nghiệp',
  basePath: process.env.API_BASE_URL || 'http://localhost:3000/api',
});

// Thiết lập thẻ
addTagGroup(spec, 'Users', 'Quản lý người dùng');
addTagGroup(spec, 'Products', 'Quản lý sản phẩm');

// Xác định sơ đồ
addSchema(spec, 'User', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
  },
  required: ['id', 'email', 'name'],
});

// Thêm điểm cuối
addEndpoint(spec, '/users', 'get', {
  summary: 'Danh sách người dùng',
  tags: ['Users'],
  parameters: [
    {
      name: 'skip',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 0 },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 50 },
    },
  ],
  responses: {
    '200': {
      description: 'Danh sách người dùng',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
  },
});
```

### Tham Khảo API

#### `createOpenAPISpec(config)`

Tạo đối tượng thông số OpenAPI 3.1 cơ sở.

**Tham số:**
- `config.title` (string, bắt buộc) — Tiêu đề API
- `config.version` (string, bắt buộc) — Phiên bản API
- `config.description` (string, tùy chọn) — Mô tả API
- `config.basePath` (string, tùy chọn) — URL cơ sở
- `config.servers` (array, tùy chọn) — Cấu hình máy chủ

**Trả về:** đối tượng `OpenAPISpec`

#### `addEndpoint(spec, path, method, config)`

Thêm điểm cuối vào thông số OpenAPI.

**Tham số:**
- `spec` — đối tượng thông số OpenAPI
- `path` (string) — Đường dẫn URL (ví dụ: `/api/users/{id}`)
- `method` (string) — Phương thức HTTP (get, post, put, patch, delete, head, options)
- `config.summary` (string) — Mô tả ngắn
- `config.description` (string, tùy chọn) — Mô tả chi tiết
- `config.tags` (string[], tùy chọn) — Danh mục thẻ
- `config.parameters` (array, tùy chọn) — Tham số truy vấn/đường dẫn/tiêu đề
- `config.requestBody` (object, tùy chọn) — Sơ đồ phần thân yêu cầu
- `config.responses` (object) — Định nghĩa phản hồi
- `config.deprecated` (boolean, tùy chọn) — Đánh dấu như đã ngừng sử dụng
- `config.security` (array, tùy chọn) — Sơ đồ bảo mật

#### `addSchema(spec, name, schema)`

Thêm sơ đồ/thành phần có thể tái sử dụng vào thông số.

**Tham số:**
- `spec` — đối tượng thông số OpenAPI
- `name` (string) — Tên sơ đồ
- `schema` (object) — Định nghĩa JSON Schema

#### `addTagGroup(spec, name, description?)`

Thêm nhóm thẻ để tổ chức các điểm cuối.

**Tham số:**
- `spec` — đối tượng thông số OpenAPI
- `name` (string) — Tên thẻ
- `description` (string, tùy chọn) — Mô tả thẻ

#### `swaggerUIHandler(specUrl)`

Tạo HTML cho Swagger UI.

**Tham số:**
- `specUrl` (string) — URL đến JSON thông số OpenAPI

**Trả về:** chuỗi HTML

#### `specHandler(spec)`

Chuẩn bị thông số OpenAPI cho phản hồi HTTP.

**Tham số:**
- `spec` (object) — đối tượng thông số OpenAPI

**Trả về:** đối tượng phản hồi với trạng thái, tiêu đề và phần thân

#### `createDocsRoute(spec)`

Tạo trình xử lý GET Next.js cho điểm cuối thông số OpenAPI.

**Tham số:**
- `spec` (object) — đối tượng thông số OpenAPI

**Trả về:** hàm xử lý tuyến đường Next.js

#### `createSwaggerRoute(specUrl)`

Tạo trình xử lý GET Next.js cho điểm cuối Swagger UI.

**Tham số:**
- `specUrl` (string) — URL đến JSON thông số OpenAPI

**Trả về:** hàm xử lý tuyến đường Next.js
