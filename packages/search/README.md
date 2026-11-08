# @linkk/search - Global Search Service

Dịch vụ tìm kiếm toàn cục cho L-ERP sử dụng Meilisearch.

## English

Global search service for L-ERP powered by Meilisearch with Vietnamese language optimization.

### Features

- **Cross-module federated search** - Search across all ERP modules simultaneously
- **Multi-entity support** - Search customers, products, orders, invoices, employees, tasks, and more
- **Vietnamese optimization** - Native Vietnamese text support with diacritics and stopwords
- **Real-time sync** - Automatic indexing with Prisma middleware
- **Autocomplete** - Smart suggestions for search queries
- **Flexible filtering** - Filter results by entity, module, and custom fields
- **High performance** - Lightweight Meilisearch engine optimized for production

### Installation

The package is already installed as part of the L-ERP monorepo.

### Quick Start

```typescript
import {
  createSearchClient,
  createIndexer,
  createSearchSync,
  getAllIndexConfigs,
  SearchableEntity,
  SearchModule,
} from '@linkk/search';

// Initialize the search client
const searchClient = createSearchClient(
  'http://localhost:7700',
  'your-master-key'
);

// Initialize the indexer
const indexer = createIndexer(
  { host: 'http://localhost:7700', apiKey: 'your-master-key' },
  getAllIndexConfigs()
);

// Create search sync for automatic indexing
const searchSync = createSearchSync(indexer);

// Use with Prisma
prisma.$use(searchSync.getPrismaMiddleware());
```

### Basic Usage

#### Search

```typescript
// Global search
const results = await searchClient.search({
  query: 'khách hàng',
  limit: 20,
  offset: 0,
});

// Search by entity
const customerResults = await searchClient.search({
  query: 'Acme Corp',
  entities: [SearchableEntity.CUSTOMER],
  limit: 10,
  offset: 0,
});

// Search with filters
const results = await searchClient.search({
  query: 'product',
  filters: [
    { field: 'status', value: 'active' },
    { field: 'price', value: [0, 1000000] },
  ],
  limit: 20,
  offset: 0,
});
```

#### Search by Module

```typescript
// Search within CRM module
const crmResults = await searchClient.searchModule(
  SearchModule.CRM,
  'customer name'
);

// Search within Sales module
const salesResults = await searchClient.searchModule(
  SearchModule.SALES,
  'order number'
);
```

#### Autocomplete Suggestions

```typescript
// Get suggestions for a query
const suggestions = await searchClient.suggest('khách', 5);
// Returns: [
//   { query: 'Khách hàng Acme', entity: 'customer', module: 'crm', count: 5 },
//   ...
// ]
```

#### Manual Indexing

```typescript
// Index a single document
await indexer.indexDocument(SearchableEntity.CUSTOMER, {
  id: 'cust-001',
  entity: SearchableEntity.CUSTOMER,
  module: SearchModule.CRM,
  title: 'Công ty Acme',
  description: 'Nhà cung cấp hàng đầu',
  url: '/crm/customers/cust-001',
  metadata: { status: 'active' },
});

// Batch index documents
await indexer.indexBatch(SearchableEntity.PRODUCT, [
  {
    id: 'prod-001',
    entity: SearchableEntity.PRODUCT,
    module: SearchModule.INVENTORY,
    title: 'Laptop Dell',
    description: 'Máy tính xách tay cao cấp',
    url: '/inventory/products/prod-001',
    metadata: { sku: 'DELL-001', price: 15000000 },
  },
  // ... more products
]);

// Full reindex from database
await indexer.reindexAll(SearchableEntity.CUSTOMER, async () => {
  const customers = await db.customer.findMany();
  return customers.map((c) => ({
    id: c.id,
    entity: SearchableEntity.CUSTOMER,
    module: SearchModule.CRM,
    title: c.name,
    description: c.description || '',
    url: `/crm/customers/${c.id}`,
    metadata: { status: c.status, email: c.email },
  }));
});
```

### Supported Entities

| Entity | Module | Use Case |
|--------|--------|----------|
| CUSTOMER | CRM | Customer management |
| LEAD | CRM | Sales leads |
| PRODUCT | INVENTORY | Product catalog |
| ORDER | SALES | Customer orders |
| INVOICE | ACCOUNTING | Billing documents |
| EMPLOYEE | HR | Employee directory |
| PROJECT | PROJECT_MANAGEMENT | Project tracking |
| TASK | PROJECT_MANAGEMENT | Task management |
| PRODUCTION_ORDER | PRODUCTION | Manufacturing orders |
| DOCUMENT | DOCUMENT_MANAGEMENT | Document storage |

### Vietnamese Text Search

This package includes Vietnamese-specific optimizations:

- **Diacritics preservation** - Correctly handles Vietnamese tone marks (á, à, ả, ã, ạ, etc.)
- **Vietnamese stopwords** - Common Vietnamese words are excluded from search (và, là, được, có, của, etc.)
- **Synonyms** - Vietnamese synonyms for common business terms:
  - khách hàng → customer, client, buyer
  - sản phẩm → product, item, goods
  - hóa đơn → invoice, bill, receipt
  - đơn hàng → order, purchase, request
  - nhân viên → employee, staff, worker

### API Reference

#### SearchClient

```typescript
class SearchClient {
  // Federated search across all indices
  search(options: SearchOptions): Promise<SearchResult[]>;

  // Search within a specific module
  searchModule(
    module: SearchModule,
    query: string,
    options?: Partial<SearchOptions>
  ): Promise<SearchResult[]>;

  // Get autocomplete suggestions
  suggest(query: string, limit?: number): Promise<SuggestOption[]>;

  // Access underlying Meilisearch client
  getClient(): MeiliSearch;
}
```

#### Indexer

```typescript
class Indexer {
  // Create or update an index
  createIndex(
    entity: SearchableEntity,
    config: IndexConfig,
    vietnameseSettings?: VietnamesesSettings
  ): Promise<Index>;

  // Index a single document
  indexDocument(
    entity: SearchableEntity,
    data: DocumentIndexPayload
  ): Promise<void>;

  // Batch index documents
  indexBatch(
    entity: SearchableEntity,
    documents: DocumentIndexPayload[]
  ): Promise<void>;

  // Remove a document from index
  removeDocument(entity: SearchableEntity, documentId: string): Promise<void>;

  // Full reindex from data source
  reindexAll(
    entity: SearchableEntity,
    dataSource: () => Promise<DocumentIndexPayload[]>
  ): Promise<void>;

  // Clear all documents without deleting index
  clearIndex(entity: SearchableEntity): Promise<void>;

  // Get index statistics
  getIndexStats(entity: SearchableEntity): Promise<IndexStats>;
}
```

#### SearchSync

```typescript
class SearchSync {
  // Queue a sync operation
  queueSync(payload: SearchSyncPayload): Promise<void>;

  // Manually flush queued operations
  flush(): Promise<void>;

  // Immediately sync a single operation
  syncImmediate(payload: SearchSyncPayload): Promise<void>;

  // Get Prisma middleware for automatic syncing
  getPrismaMiddleware(): PrismaMiddlewareFn;

  // Shutdown and flush pending operations
  shutdown(): Promise<void>;

  // Get current queue size
  getQueueSize(): number;

  // Clear queue without flushing
  clearQueue(): void;
}
```

### Configuration

#### Environment Variables

```bash
# Meilisearch configuration
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=your-secure-master-key
MEILI_ENV=development
MEILI_PORT=7700
```

#### Index Configuration

Each entity has a pre-configured `IndexConfig` with:
- **searchableAttributes** - Fields included in full-text search
- **filterableAttributes** - Fields that can be used for filtering
- **sortableAttributes** - Fields that support sorting
- **displayedAttributes** - Fields returned in search results
- **synonyms** - Vietnamese synonyms for business terms
- **stopWords** - Vietnamese common words excluded from indexing

### Docker Setup

Start Meilisearch with Docker Compose:

```bash
cd infrastructure/search
docker-compose -f docker-compose.search.yml up -d
```

Access Meilisearch dashboard at `http://localhost:7700`

### Performance Tips

1. **Batch Operations** - Use `indexBatch()` for multiple documents
2. **Debounced Sync** - SearchSync debounces updates (default 2s) to reduce database load
3. **Selective Search** - Specify entities or modules to reduce search scope
4. **Pagination** - Use limit and offset for large result sets
5. **Filtering** - Use filters to narrow results before search

### Troubleshooting

#### No results found
- Verify Meilisearch is running: `curl http://localhost:7700/health`
- Check index exists: Access dashboard at `http://localhost:7700`
- Ensure documents are indexed: Check `getIndexStats()`

#### Vietnamese text not displaying correctly
- Verify UTF-8 encoding in database connection
- Check Meilisearch environment: `MEILI_ENV=development`
- Test with simple Vietnamese query

#### Slow searches
- Check Meilisearch memory usage
- Reduce search scope using entities/modules filters
- Use pagination for large result sets

---

## Tiếng Việt

Dịch vụ tìm kiếm toàn cục cho L-ERP được cung cấp bởi Meilisearch với tối ưu hóa ngôn ngữ Tiếng Việt.

### Tính năng

- **Tìm kiếm liên module** - Tìm kiếm đồng thời trên tất cả các module ERP
- **Hỗ trợ nhiều entity** - Tìm kiếm khách hàng, sản phẩm, đơn hàng, hóa đơn, nhân viên, nhiệm vụ và hơn nữa
- **Tối ưu hóa Tiếng Việt** - Hỗ trợ native Tiếng Việt với dấu thanh và stopwords
- **Đồng bộ hóa real-time** - Lập chỉ mục tự động với middleware Prisma
- **Autocomplete** - Gợi ý thông minh cho truy vấn tìm kiếm
- **Lọc linh hoạt** - Lọc kết quả theo entity, module và trường tùy chỉnh
- **Hiệu suất cao** - Engine Meilisearch nhẹ tối ưu hóa cho production

### Cài đặt nhanh

```typescript
import {
  createSearchClient,
  createIndexer,
  createSearchSync,
  getAllIndexConfigs,
  SearchableEntity,
  SearchModule,
} from '@linkk/search';

// Khởi tạo client tìm kiếm
const searchClient = createSearchClient(
  'http://localhost:7700',
  'master-key-của-bạn'
);

// Khởi tạo indexer
const indexer = createIndexer(
  { host: 'http://localhost:7700', apiKey: 'master-key-của-bạn' },
  getAllIndexConfigs()
);

// Tạo search sync cho lập chỉ mục tự động
const searchSync = createSearchSync(indexer);

// Sử dụng với Prisma
prisma.$use(searchSync.getPrismaMiddleware());
```

### Sử dụng cơ bản

#### Tìm kiếm

```typescript
// Tìm kiếm toàn cục
const results = await searchClient.search({
  query: 'khách hàng',
  limit: 20,
  offset: 0,
});

// Tìm kiếm theo entity
const customerResults = await searchClient.search({
  query: 'Acme Corp',
  entities: [SearchableEntity.CUSTOMER],
  limit: 10,
  offset: 0,
});

// Tìm kiếm với bộ lọc
const results = await searchClient.search({
  query: 'sản phẩm',
  filters: [
    { field: 'status', value: 'active' },
    { field: 'price', value: [0, 1000000] },
  ],
  limit: 20,
  offset: 0,
});
```

#### Tìm kiếm theo Module

```typescript
// Tìm kiếm trong module CRM
const crmResults = await searchClient.searchModule(
  SearchModule.CRM,
  'tên khách hàng'
);

// Tìm kiếm trong module Sales
const salesResults = await searchClient.searchModule(
  SearchModule.SALES,
  'số đơn hàng'
);
```

#### Gợi ý Autocomplete

```typescript
// Lấy gợi ý cho truy vấn
const suggestions = await searchClient.suggest('khách', 5);
// Trả về: [
//   { query: 'Khách hàng Acme', entity: 'customer', module: 'crm', count: 5 },
//   ...
// ]
```

#### Lập chỉ mục thủ công

```typescript
// Lập chỉ mục cho một tài liệu
await indexer.indexDocument(SearchableEntity.CUSTOMER, {
  id: 'cust-001',
  entity: SearchableEntity.CUSTOMER,
  module: SearchModule.CRM,
  title: 'Công ty Acme',
  description: 'Nhà cung cấp hàng đầu',
  url: '/crm/customers/cust-001',
  metadata: { status: 'active' },
});

// Lập chỉ mục hàng loạt
await indexer.indexBatch(SearchableEntity.PRODUCT, [
  {
    id: 'prod-001',
    entity: SearchableEntity.PRODUCT,
    module: SearchModule.INVENTORY,
    title: 'Laptop Dell',
    description: 'Máy tính xách tay cao cấp',
    url: '/inventory/products/prod-001',
    metadata: { sku: 'DELL-001', price: 15000000 },
  },
  // ... thêm sản phẩm
]);

// Lập chỉ mục lại từ cơ sở dữ liệu
await indexer.reindexAll(SearchableEntity.CUSTOMER, async () => {
  const customers = await db.customer.findMany();
  return customers.map((c) => ({
    id: c.id,
    entity: SearchableEntity.CUSTOMER,
    module: SearchModule.CRM,
    title: c.name,
    description: c.description || '',
    url: `/crm/customers/${c.id}`,
    metadata: { status: c.status, email: c.email },
  }));
});
```

### Các Entity được hỗ trợ

| Entity | Module | Mục đích |
|--------|--------|---------|
| CUSTOMER | CRM | Quản lý khách hàng |
| LEAD | CRM | Cơ hội bán hàng |
| PRODUCT | INVENTORY | Danh mục sản phẩm |
| ORDER | SALES | Đơn hàng khách hàng |
| INVOICE | ACCOUNTING | Hóa đơn |
| EMPLOYEE | HR | Danh bạ nhân viên |
| PROJECT | PROJECT_MANAGEMENT | Theo dõi dự án |
| TASK | PROJECT_MANAGEMENT | Quản lý nhiệm vụ |
| PRODUCTION_ORDER | PRODUCTION | Đơn đặt hàng sản xuất |
| DOCUMENT | DOCUMENT_MANAGEMENT | Lưu trữ tài liệu |

### Tìm kiếm Tiếng Việt

Gói này bao gồm các tối ưu hóa cụ thể cho Tiếng Việt:

- **Bảo tồn dấu thanh** - Xử lý chính xác các dấu thanh Tiếng Việt (á, à, ả, ã, ạ, v.v.)
- **Stopwords Tiếng Việt** - Loại trừ các từ phổ biến trong Tiếng Việt (và, là, được, có, của, v.v.)
- **Từ đồng nghĩa** - Từ đồng nghĩa Tiếng Việt cho các thuật ngữ kinh doanh:
  - khách hàng → customer, client, buyer
  - sản phẩm → product, item, goods
  - hóa đơn → invoice, bill, receipt
  - đơn hàng → order, purchase, request
  - nhân viên → employee, staff, worker

### Thiết lập Docker

Khởi động Meilisearch với Docker Compose:

```bash
cd infrastructure/search
docker-compose -f docker-compose.search.yml up -d
```

Truy cập bảng điều khiển Meilisearch tại `http://localhost:7700`

### Mẹo cải thiện hiệu suất

1. **Hoạt động hàng loạt** - Sử dụng `indexBatch()` cho nhiều tài liệu
2. **Đồng bộ hóa được debounced** - SearchSync debounces các cập nhật (mặc định 2s) để giảm tải cơ sở dữ liệu
3. **Tìm kiếm lựa chọn** - Chỉ định entities hoặc modules để giảm phạm vi tìm kiếm
4. **Phân trang** - Sử dụng limit và offset cho các tập kết quả lớn
5. **Lọc** - Sử dụng bộ lọc để thu hẹp kết quả trước khi tìm kiếm

### Khắc phục sự cố

#### Không tìm thấy kết quả
- Xác minh Meilisearch đang chạy: `curl http://localhost:7700/health`
- Kiểm tra index tồn tại: Truy cập bảng điều khiển tại `http://localhost:7700`
- Đảm bảo các tài liệu đã được lập chỉ mục: Kiểm tra `getIndexStats()`

#### Văn bản Tiếng Việt không hiển thị đúng
- Xác minh mã hóa UTF-8 trong kết nối cơ sở dữ liệu
- Kiểm tra môi trường Meilisearch: `MEILI_ENV=development`
- Kiểm tra với truy vấn Tiếng Việt đơn giản

#### Tìm kiếm chậm
- Kiểm tra mức sử dụng bộ nhớ Meilisearch
- Giảm phạm vi tìm kiếm bằng cách sử dụng bộ lọc entities/modules
- Sử dụng phân trang cho các tập kết quả lớn

### Liên hệ hỗ trợ

Để báo cáo lỗi hoặc đề xuất tính năng, vui lòng mở issue trên repository của dự án.
