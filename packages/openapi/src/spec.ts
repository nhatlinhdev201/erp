/**
 * @linkk/openapi — Spec Generator
 *
 * Creates and manages OpenAPI 3.1 specification objects.
 */

// ─── Types ───────────────────────────────────────────────────

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: Record<string, any>;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: {
    'application/json'?: {
      schema: Record<string, any>;
    };
    [key: string]: any;
  };
}

export interface OpenAPIResponse {
  description: string;
  content?: {
    'application/json'?: {
      schema: Record<string, any>;
    };
    [key: string]: any;
  };
}

export interface EndpointConfig {
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: {
    [statusCode: string]: OpenAPIResponse;
  };
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: {
    [path: string]: {
      [method: string]: any;
    };
  };
  components?: {
    schemas?: {
      [name: string]: Record<string, any>;
    };
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface CreateOpenAPISpecConfig {
  title: string;
  version: string;
  description?: string;
  basePath?: string;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

// ─── Factory Function ────────────────────────────────────────

/**
 * Create a base OpenAPI 3.1 specification object
 */
export function createOpenAPISpec(config: CreateOpenAPISpecConfig): OpenAPISpec {
  const servers = config.servers || [];

  if (config.basePath) {
    servers.unshift({
      url: config.basePath,
      description: 'Base URL',
    });
  }

  return {
    openapi: '3.1.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description,
    },
    servers: servers.length > 0 ? servers : undefined,
    paths: {},
    components: {
      schemas: {},
    },
    tags: [],
  };
}

// ─── Endpoint Management ──────────────────────────────────────

/**
 * Add an endpoint to the OpenAPI spec
 */
export function addEndpoint(
  spec: OpenAPISpec,
  path: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options',
  config: EndpointConfig
): void {
  const methodLower = method.toLowerCase();

  // Initialize path if it doesn't exist
  if (!spec.paths[path]) {
    spec.paths[path] = {};
  }

  // Build the operation object
  const operation: any = {
    summary: config.summary,
    description: config.description,
  };

  // Add tags if provided
  if (config.tags && config.tags.length > 0) {
    operation.tags = config.tags;
  }

  // Add parameters if provided
  if (config.parameters && config.parameters.length > 0) {
    operation.parameters = config.parameters;
  }

  // Add request body if provided
  if (config.requestBody) {
    operation.requestBody = config.requestBody;
  }

  // Add responses (required)
  operation.responses = config.responses;

  // Add deprecated flag if provided
  if (config.deprecated) {
    operation.deprecated = true;
  }

  // Add security if provided
  if (config.security) {
    operation.security = config.security;
  }

  // Assign operation to the path and method
  spec.paths[path][methodLower] = operation;
}

// ─── Schema Management ────────────────────────────────────────

/**
 * Add a data schema/component to the OpenAPI spec
 */
export function addSchema(
  spec: OpenAPISpec,
  name: string,
  schema: Record<string, any>
): void {
  if (!spec.components) {
    spec.components = {
      schemas: {},
    };
  }

  if (!spec.components.schemas) {
    spec.components.schemas = {};
  }

  spec.components.schemas[name] = schema;
}

// ─── Tag Management ──────────────────────────────────────────

/**
 * Add a tag group for organizing endpoints
 */
export function addTagGroup(
  spec: OpenAPISpec,
  name: string,
  description?: string
): void {
  if (!spec.tags) {
    spec.tags = [];
  }

  // Avoid duplicates
  if (!spec.tags.find((tag) => tag.name === name)) {
    spec.tags.push({
      name,
      description,
    });
  }
}
