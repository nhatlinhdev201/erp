# L-ERP MRP — X-RAY REPORT
## Hệ Thống Quản Lý Hoạch Định Nhu Cầu Vật Tư & Sản Xuất Thông Minh

> **Ngày phân tích:** 04/03/2026
> **Phiên bản:** Production v1.0
> **Loại hệ thống:** Full-stack Manufacturing Intelligence Platform

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Kỹ Thuật](#2-kiến-trúc-kỹ-thuật)
3. [Module Chức Năng Chi Tiết](#3-module-chức-năng-chi-tiết)
4. [Mô Hình Dữ Liệu](#4-mô-hình-dữ-liệu)
5. [Tính Năng AI / Machine Learning](#5-tính-năng-ai--machine-learning)
6. [Bảo Mật & Tuân Thủ](#6-bảo-mật--tuân-thủ)
7. [Thống Kê Quy Mô Dự Án](#7-thống-kê-quy-mô-dự-án)
8. [Đánh Giá Mức Độ Hoàn Thiện](#8-đánh-giá-mức-độ-hoàn-thiện)
9. [Roadmap & Đề Xuất](#9-roadmap--đề-xuất)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Giới thiệu

L-ERP MRP là hệ thống **Quản Lý Hoạch Định Nhu Cầu Vật Tư & Sản Xuất (Material Requirements Planning)** cấp doanh nghiệp, tích hợp AI/ML. Hệ thống bao phủ toàn bộ vòng đời sản xuất:

```
Đơn hàng → Hoạch định → Mua hàng → Nhận hàng → Kiểm tra chất lượng
    → Sản xuất → Kiểm tra thành phẩm → Xuất kho → Giao hàng
```

### 1.2 Đối tượng sử dụng

| Vai trò | Chức năng chính |
|---------|----------------|
| **Admin** | Quản lý toàn hệ thống, cấu hình, phân quyền |
| **Manager** | Phê duyệt, báo cáo tổng hợp, ra quyết định |
| **Supervisor** | Giám sát sản xuất, chất lượng |
| **Planner** | Hoạch định MRP, lập kế hoạch sản xuất |
| **Quality** | Kiểm tra chất lượng, NCR, CAPA |
| **Operator** | Thao tác sản xuất, ghi nhận kết quả |
| **Viewer** | Xem báo cáo, theo dõi |

### 1.3 Ngôn ngữ hỗ trợ

- **Tiếng Việt** (ngôn ngữ chính)
- **Tiếng Anh** (đầy đủ)
- Chuyển đổi tức thì, không cần reload trang

---

## 2. KIẾN TRÚC KỸ THUẬT

### 2.1 Technology Stack

| Lớp | Công nghệ | Ghi chú |
|-----|-----------|---------|
| **Frontend** | React 19, TypeScript 5.x, Tailwind CSS | Single Page Application |
| **UI Framework** | Shadcn/UI + Radix UI (18 packages) | Thiết kế kiểu "Bloomberg Terminal" |
| **Backend** | Next.js 15 (App Router) | Server-Side Rendering + API Routes |
| **Database** | PostgreSQL | Prisma ORM, 156 bảng dữ liệu |
| **Authentication** | NextAuth.js 5 | MFA/TOTP, RBAC 8 cấp |
| **AI/ML** | OpenAI GPT-4 + Anthropic Claude | Auto-failover, circuit breaker |
| **Cache** | Redis / In-memory LRU | 5000-item capacity, TTL-based |
| **Queue** | BullMQ pattern | Background job processing |
| **Real-time** | Server-Sent Events (SSE) | 24 loại event, 7 danh mục |
| **File Storage** | AWS S3 | Tenant-isolated, pre-signed URLs |
| **Monitoring** | Sentry + Prometheus metrics | Error tracking, performance |
| **Charts** | Recharts (lazy-loaded) | Giảm bundle ~500KB |
| **PDF/Excel** | pdfkit, jspdf, xlsx | Export đa định dạng |
| **Mobile** | PWA (Progressive Web App) | Offline-capable, barcode scan |

### 2.2 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────┐ │
│  │ Web App  │  │ Mobile   │  │ Customer  │  │Supplier│ │
│  │ (React)  │  │ PWA      │  │ Portal    │  │Portal  │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───┬───┘ │
└───────┼──────────────┼──────────────┼────────────┼─────┘
        │              │              │            │
┌───────┼──────────────┼──────────────┼────────────┼─────┐
│       ▼              ▼              ▼            ▼     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API LAYER (519 endpoints)           │   │
│  │  Rate Limiting → Auth → Validation → Handler    │   │
│  └────────────────────┬────────────────────────────┘   │
│                       │                                 │
│  ┌────────────────────┼────────────────────────────┐   │
│  │            BUSINESS LOGIC LAYER                  │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌───────┐ ┌────────┐ │   │
│  │  │ MRP │ │ AI  │ │ QMS │ │Finance│ │Workflow│ │   │
│  │  │Engine│ │Core │ │     │ │Engine │ │Engine  │ │   │
│  │  └─────┘ └─────┘ └─────┘ └───────┘ └────────┘ │   │
│  └────────────────────┬────────────────────────────┘   │
│                       │                                 │
│  ┌────────────────────┼────────────────────────────┐   │
│  │            DATA LAYER                            │   │
│  │  ┌──────────┐  ┌───────┐  ┌────────┐  ┌──────┐ │   │
│  │  │PostgreSQL│  │ Redis │  │ AWS S3 │  │Sentry│ │   │
│  │  │156 tables│  │ Cache │  │Storage │  │ Logs │ │   │
│  │  └──────────┘  └───────┘  └────────┘  └──────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                    SERVER LAYER                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 API Architecture

| Nhóm | Số Routes | HTTP Methods |
|------|-----------|-------------|
| **Auth & Security** | 8 | GET, POST |
| **AI / Machine Learning** | 45 | GET, POST, PATCH |
| **Analytics & Reports** | 20 | GET, POST |
| **BOM** | 7 | GET, POST, PUT, DELETE |
| **Customers** | 4 | GET, POST, PUT, DELETE |
| **Finance** | 12 | GET, POST, PUT |
| **Inventory** | 12 | GET, POST, PUT, DELETE |
| **MRP** | 18 | GET, POST, PATCH |
| **Mobile** | 16 | GET, POST |
| **Production** | 22 | GET, POST, PUT, PATCH |
| **Purchase Orders** | 4 | GET, POST, PUT, DELETE |
| **Quality** | 22 | GET, POST, PUT, PATCH |
| **Sales Orders** | 8 | GET, POST, PUT, DELETE |
| **Suppliers** | 5 | GET, POST, PUT, DELETE |
| **Warehouse** | 6 | GET, POST, PUT |
| **Workflow** | 8 | GET, POST, PATCH |
| **Khác** | 72 | Mixed |
| **Tổng** | **~289 route files / ~519 handlers** | |

---

## 3. MODULE CHỨC NĂNG CHI TIẾT

### 3.1 QUẢN LÝ ĐƠN HÀNG (Sales Orders)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Tạo/Sửa/Xóa đơn hàng | Form đầy đủ với nhiều dòng sản phẩm |
| Quản lý trạng thái | draft → pending → confirmed → in_progress → shipped → received → cancelled |
| Liên kết khách hàng | Tự động fill thông tin từ master data |
| Backorder management | Theo dõi & xử lý đơn giao thiếu |
| Tạo Work Order từ SO | Chuyển đổi đơn hàng thành lệnh sản xuất |
| Xuất kho & giao hàng | Shipment management, pick list |
| Export Excel | Xuất báo cáo đơn hàng |

### 3.2 QUẢN LÝ MUA HÀNG (Purchasing)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Purchase Orders | Tạo/sửa/xóa PO với nhiều line items |
| Auto-fill từ MRP | Tự động điền NCC, số lượng, đơn giá khi tạo PO từ MRP |
| PO Consolidation | Tự động gộp PO cùng nhà cung cấp (draft) |
| Quản lý nhà cung cấp | Hồ sơ NCC đầy đủ: rating A-D, lead time, payment terms |
| Preferred Supplier | Ưu tiên NCC theo part, tự động chọn khi tạo PO |
| Nhận hàng | Warehouse receipt + chuyển sang kiểm tra chất lượng |
| Multi-currency | Hỗ trợ USD, VND |
| Deep link | Tạo PO trực tiếp từ MRP shortage notification |

### 3.3 QUẢN LÝ TỒN KHO (Inventory)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Quản lý nhiều kho | 8 loại kho: RECEIVING, QUARANTINE, MAIN, WIP, FINISHED_GOODS, SHIPPING, HOLD, SCRAP |
| Lot tracking | Theo dõi lô hàng xuyên suốt chuỗi cung ứng |
| ABC Classification | Phân loại tồn kho theo giá trị (Pareto) |
| Cycle Count | Kiểm kê theo chu kỳ |
| Expiry Alerts | Cảnh báo hàng sắp hết hạn |
| Material Issue | Xuất kho vật tư cho sản xuất |
| Stock Alerts | Cảnh báo tồn kho thấp/hết hàng real-time |
| Inventory Adjust | Điều chỉnh tồn kho (thừa/thiếu/hỏng) |
| Chuyển kho tự động | Tự động di chuyển hàng sau kiểm tra chất lượng |

### 3.4 QUẢN LÝ SẢN XUẤT (Production)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Work Orders | Tạo/quản lý lệnh sản xuất đầy đủ |
| Gantt Scheduling | Biểu đồ Gantt kéo-thả, xung đột tự động detect |
| Shop Floor Control | Theo dõi real-time trạng thái work center (30s refresh) |
| OEE Dashboard | Overall Equipment Effectiveness: Availability × Performance × Quality |
| Capacity Planning | Hoạch định công suất |
| Routing | Định tuyến sản xuất multi-operation |
| Work Centers | Quản lý trung tâm sản xuất, thiết bị |
| Material Allocation | Phân bổ vật tư cho Work Order |
| Partial Release | Phát hành từng phần lệnh sản xuất |
| Subcontracting | Quản lý gia công ngoài |
| Production Receipt | Nhận thành phẩm + cập nhật tồn kho |

### 3.5 HOẠCH ĐỊNH VẬT TƯ — MRP (Material Requirements Planning)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| MRP Engine | Thuật toán MRP-I đầy đủ: BOM explosion, netting, lot sizing |
| Horizon Planning | 30/60/90/180 ngày |
| Safety Stock | Tính toán an toàn kho dựa trên demand history |
| AI Forecast Integration | Tích hợp dự báo AI với trọng số tuỳ chỉnh (30-100%) |
| Vietnamese Calendar | Nhận diện Tết, lễ Việt Nam trong forecast |
| Suggestion Cards | Đề xuất Purchase/Expedite/Defer với BOM children display |
| Shared Stock Detection | Phát hiện stock chia sẻ giữa nhiều sản phẩm |
| Approve → Create PO | Duyệt → Tự động tạo PO (với auto-consolidation) |
| Multi-level BOM | Hiển thị BOM đa cấp trong suggestion card |
| ATP / CTP | Available-to-Promise / Capable-to-Promise |
| Demand Pegging | Truy vết nhu cầu từ đơn hàng đến vật tư |
| Exception Messages | Cảnh báo bất thường trong hoạch định |
| Firm Planned Orders | Đơn hàng đã xác nhận, không bị MRP ghi đè |
| Multi-site Planning | Hoạch định đa nhà máy |
| MRP Simulation | Chạy thử nghiệm what-if |
| MRP Wizard | Hướng dẫn từng bước cho người mới |

### 3.6 BOM (Bill of Materials)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| BOM Header | Quản lý BOM theo sản phẩm, version, status |
| BOM Lines | Chi tiết vật tư: số lượng, đơn vị, scrap %, lead time offset |
| Multi-level BOM | Hiển thị cây BOM nhiều cấp (parent → child → grandchild) |
| BOM Explosion | Tính toán vật tư theo BOM đa cấp |
| BOM Versioning | Quản lý phiên bản BOM |
| Create Sub-BOM | Tạo BOM con trực tiếp từ cây BOM |
| BOM Types | ENGINEERING, MANUFACTURING, CONFIGURABLE, PLANNING, SERVICE |
| Alternate Parts | Quản lý vật tư thay thế |
| Tạo PO từ BOM | Tạo Purchase Order trực tiếp từ BOM shortage |

### 3.7 QUẢN LÝ CHẤT LƯỢNG (Quality Management System)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Receiving Inspection | Kiểm tra hàng nhập: PASS/FAIL/CONDITIONAL |
| In-Process Inspection | Kiểm tra trong quá trình sản xuất |
| Final Inspection | Kiểm tra thành phẩm cuối |
| Inspection Plans | Kế hoạch kiểm tra theo tiêu chuẩn |
| NCR | Non-Conformance Report: ghi nhận, phân loại, xử lý |
| CAPA | Corrective & Preventive Actions: hành động khắc phục/phòng ngừa |
| Lot Traceability | Truy vết lô hàng xuyên suốt chuỗi |
| SPC | Statistical Process Control — biểu đồ kiểm soát |
| Hold / Quarantine | Quản lý hàng tạm giữ / cách ly |
| Rework | Quản lý tái chế |
| Scrap | Ghi nhận phế liệu |
| CoC Certificate | Chứng nhận phù hợp (Certificate of Conformance) |
| Auto-NCR Creation | Tự động tạo NCR khi inspection FAIL |
| Inventory Auto-move | Tự động chuyển kho theo kết quả kiểm tra |
| Quality Alerts | Cảnh báo chất lượng |
| Process Capability | Tính Cpk/Cp |

### 3.8 TÀI CHÍNH / KẾ TOÁN (Finance)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| General Ledger | Sổ cái tổng hợp, bút toán |
| Cost Rollup | Tính giá thành sản phẩm (material + labor + overhead) |
| Sales Invoicing | Hóa đơn bán hàng (AR) |
| Purchase Invoicing | Hóa đơn mua hàng (AP) |
| MISA Export | Xuất dữ liệu sang phần mềm kế toán MISA (Việt Nam) |
| Financial Reports | Báo cáo tài chính tổng hợp |
| Vietnam Tax | Hỗ trợ thuế GTGT, thuế TNDN Việt Nam |
| Multi-currency | USD, VND với tỷ giá |
| Cost Variance | Phân tích chênh lệch giá thành |

### 3.9 KHO HÀNG (Warehouse Management)

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| 8 loại kho | RECEIVING, QUARANTINE, MAIN, WIP, FINISHED_GOODS, SHIPPING, HOLD, SCRAP |
| Dashboard kho | Tổng SKU, tổng số lượng, cảnh báo |
| Color-coded | Mã màu theo loại kho |
| Pick List | Danh sách lấy hàng cho đơn hàng |
| Transfer Order | Chuyển kho giữa các site |
| Warehouse Receipt | Xác nhận nhận hàng |

### 3.10 BÁO CÁO & ANALYTICS

**Trạng thái:** Hoàn thiện cơ bản

| Tính năng | Mô tả |
|-----------|--------|
| Dashboard KPI | 8+ KPI cards: Pending Orders, Critical Stock, Active POs, OEE%, Quality Rate% |
| Report Templates | Templates sẵn theo từng module |
| Export PDF/Excel | Download báo cáo đa định dạng |
| Analytics Dashboard | Tabs: Overview, Inventory, Sales, Production, Quality |
| Scheduled Reports | Lập lịch gửi báo cáo tự động |
| Custom Dashboards | Tự tạo dashboard với widget builder |
| KPI Definitions | Định nghĩa KPI tùy chỉnh |

### 3.11 CỔNG THÔNG TIN (Portals)

**Trạng thái:** Có cấu trúc

| Portal | Routes |
|--------|--------|
| **Customer Portal** | Đơn hàng, Giao hàng, Hóa đơn, Hỗ trợ |
| **Supplier Portal** | Đơn hàng, Giao hàng, Hóa đơn, Đánh giá hiệu suất |

### 3.12 ỨNG DỤNG MOBILE (PWA)

**Trạng thái:** Có cấu trúc

| Tính năng | Mô tả |
|-----------|--------|
| Barcode Scan | Quét mã vạch bằng camera |
| Inventory Count | Kiểm kê tồn kho trên mobile |
| Inventory Adjust | Điều chỉnh tồn kho |
| Inventory Transfer | Chuyển kho |
| Receiving | Nhận hàng |
| Quality Check | Kiểm tra chất lượng |
| Work Order | Xem/cập nhật lệnh sản xuất |
| Picking | Lấy hàng theo pick list |
| Offline Support | Hoạt động offline, tự đồng bộ |
| Technician Mode | Bảo trì thiết bị, ghi nhận downtime |

### 3.13 CỘNG TÁC & THẢO LUẬN

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Threaded Discussions | Thảo luận theo chủ đề trên mọi entity |
| @Mentions | Gắn thẻ người dùng trong thảo luận |
| Attachments | Đính kèm file, ảnh |
| Screenshot Capture | Chụp màn hình trực tiếp |
| Typing Indicator | Hiển thị đang gõ |
| Entity Linking | Liên kết thảo luận với Work Order, Part, BOM, PO... |

### 3.14 WORKFLOW & PHÊ DUYỆT

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Workflow Engine | Định nghĩa quy trình phê duyệt tùy chỉnh |
| Multi-step Approval | Phê duyệt nhiều bước |
| Delegate | Ủy quyền phê duyệt |
| Bulk Approval | Phê duyệt hàng loạt |
| Notification | Thông báo khi có phê duyệt mới |
| Dashboard Widget | Widget phê duyệt chờ trên Home |

### 3.15 NHẬP/XUẤT DỮ LIỆU

**Trạng thái:** Hoàn thiện

| Tính năng | Mô tả |
|-----------|--------|
| Excel Import | Wizard nhập dữ liệu từ Excel nhiều bước |
| AI-powered Mapping | AI tự động nhận diện cột dữ liệu |
| Smart Import | Import thông minh với validation |
| Duplicate Detection | Phát hiện trùng lặp tự động |
| Excel Export | Xuất dữ liệu ra Excel |
| PDF Export | Xuất báo cáo PDF |
| Data Migration | Công cụ chuyển đổi dữ liệu từ hệ thống cũ |
| Templates | Mẫu Excel sẵn cho từng loại dữ liệu |

---

## 4. MÔ HÌNH DỮ LIỆU

### 4.1 Tổng quan

| Thông số | Giá trị |
|----------|---------|
| Tổng số bảng (Models) | **156** |
| Tổng số Enums | **25** |
| Schema lines | **5,837** |
| Database | PostgreSQL |

### 4.2 Phân nhóm theo domain

| Domain | Số Models | Models chính |
|--------|-----------|-------------|
| **Core / Auth** | 10 | User (52 fields), PasswordResetToken, MFADevice, UserSession, PasswordHistory, PasswordPolicy |
| **Parts / Items** | 12 | Part (110 fields!), PartPlanning, PartCost, PartSpecs, PartCompliance, PartSupplier, PartAlternate, PartDocument, PartRevision, PartCostHistory, PartCertification, PartSubstitute |
| **BOM** | 3 | Product, BomHeader, BomLine (34 fields) |
| **Inventory** | 5 | Warehouse, Inventory, LotTransaction, PickList, PickListLine |
| **Sales** | 5 | Customer, SalesOrder, SalesOrderLine, Shipment, ShipmentLine |
| **Purchasing** | 4 | Supplier (24 fields), PurchaseOrder, PurchaseOrderLine |
| **Production** | 14 | WorkOrder (34 fields), WorkCenter (39 fields), Routing, RoutingOperation, WorkOrderOperation, ScheduledOperation, CapacityRecord, LaborEntry, DowntimeRecord, ProductionReceipt, MaterialAllocation |
| **Quality** | 12 | InspectionPlan, InspectionCharacteristic, Inspection (35 fields), InspectionResult, NCR (49 fields), NCRHistory, CAPA (41 fields), CAPAAction, CAPAHistory, ScrapDisposal, CertificateOfConformance, DefectCode, QualityAlert |
| **MRP / Planning** | 10 | MrpRun, MrpSuggestion (24 fields), PeggingRecord, PlannedOrder, MRPException, Simulation, SimulationResult, ATPRecord, PlanningSettings |
| **Finance** | 14 | GLAccount, CostType, PartCostComponent, PartCostRollup, WorkOrderCost, PurchaseInvoice, PurchaseInvoiceLine, PurchasePayment, SalesInvoice (35 fields), SalesInvoiceLine, SalesPayment, JournalEntry, JournalLine, CostVariance, Currency, ExchangeRate |
| **AI / ML** | 5 | DemandForecast, LeadTimePrediction, SupplierRiskScore, AiRecommendation, AiModelLog |
| **Workflow** | 6 | WorkflowDefinition, WorkflowStep, WorkflowInstance, WorkflowApproval, WorkflowHistory, WorkflowNotification |
| **Discussion** | 7 | ConversationThread, Message, ThreadParticipant, Mention, MessageAttachment, MessageEditHistory, EntityLink |
| **Analytics** | 6 | AnalyticsDashboard, DashboardWidget, KPIDefinition, ReportSchedule, ReportInstance, DashboardTemplate |
| **Compliance** | 7 | ElectronicSignature, AuditTrailEntry, DataRetentionPolicy, ITARControlledItem, ITARAccessLog |
| **Maintenance** | 3 | Equipment (43 fields), MaintenanceSchedule, MaintenanceOrder |
| **HR** | 5 | Employee, Skill, EmployeeSkill, Shift, ShiftAssignment |
| **Mobile** | 5 | BarcodeDefinition, ScanLog, OfflineOperation, MobileDevice, LabelTemplate |
| **Multi-site** | 4 | Site, InventorySite, TransferOrder, TransferOrderLine |
| **Multi-tenancy** | 6 | Tenant, TenantSubscription, TenantInvitation, TenantApiKey, TenantWebhook, TenantUsageLog |
| **Import/Export** | 8 | ImportJob, ImportRow, ExportJob, ExcelTemplate, ImportSession, ImportLog, ImportMapping, MigrationBatch, SyncSchedule |
| **Notifications** | 3 | Notification, NotificationSetting |
| **Audit** | 3 | AuditLog, ActivityLog, SavedReport |
| **Other** | 4 | SystemSetting, SavedView, Backup, BackupSchedule, ReportHistory |

### 4.3 Enums đáng chú ý

| Enum | Giá trị | Ý nghĩa |
|------|---------|---------|
| `ManufacturingStrategy` | MTS, MTO, ATO | Make-to-Stock, Make-to-Order, Assemble-to-Order |
| `MakeOrBuy` | MAKE, BUY, BOTH | Tự sản xuất / Mua ngoài / Cả hai |
| `LifecycleStatus` | DEVELOPMENT → PROTOTYPE → ACTIVE → PHASE_OUT → OBSOLETE → EOL | Vòng đời sản phẩm |
| `BomType` | ENGINEERING, MANUFACTURING, CONFIGURABLE, PLANNING, SERVICE | 5 loại BOM |
| `CertificationType` | ROHS, REACH, CE, UL, ISO, AS9100, ITAR, NDAA, COC, COA | Chứng nhận tuân thủ |
| `InvoiceStatus` | DRAFT → PENDING_APPROVAL → APPROVED → SENT → PARTIALLY_PAID → PAID | Quy trình hóa đơn |

---

## 5. TÍNH NĂNG AI / MACHINE LEARNING

### 5.1 AI Copilot

| Tính năng | Mô tả |
|-----------|--------|
| **Chat Interface** | Floating panel (Cmd/Ctrl+J), 3 modes: Chat, Insights, Settings |
| **Intent Detection** | Tự động nhận diện ý định người dùng trước khi gọi LLM |
| **Context-aware Actions** | Hành động thông minh với risk level classification |
| **RAG** | Retrieval-Augmented Generation — truy vấn database trước khi trả lời |
| **Failover** | Auto-switch OpenAI ↔ Anthropic (circuit breaker: 3 lỗi → 60s cooldown) |

### 5.2 Demand Forecasting

| Tính năng | Mô tả |
|-----------|--------|
| **Thuật toán** | Linear regression + seasonal adjustment (Q1-Q4) |
| **AI Enhancement** | Google Gemini / OpenAI forecast enhancement |
| **Vietnamese Calendar** | Nhận diện Tết Nguyên Đán, lễ lớn |
| **Safety Stock Optimizer** | Tối ưu mức an toàn kho |
| **Accuracy Metrics** | MAPE, RMSE, MAE tracking |
| **Batch Processing** | Dự báo hàng loạt cho tất cả sản phẩm |

### 5.3 Autonomous AI

| Module | Mô tả |
|--------|--------|
| **Auto-PO** | Tự động đề xuất đơn mua hàng dựa trên MRP |
| **Auto-Schedule** | Tự động lập lịch sản xuất (genetic algorithm) |
| **Conflict Detector** | Phát hiện xung đột lịch/tài nguyên |
| **Approval Queue** | Hàng đợi phê duyệt AI actions |

### 5.4 Monte Carlo Simulation

| Tính năng | Mô tả |
|-----------|--------|
| **Distributions** | Normal, Uniform, Triangular, Lognormal |
| **Iterations** | 1000 (mặc định), tùy chỉnh |
| **Output** | Mean, Median, StdDev, Skewness, Kurtosis |
| **Risk Metrics** | VaR (p95, p99), CVaR |
| **Sensitivity** | Phân tích nhạy cảm theo từng biến |
| **Convergence** | Theo dõi hội tụ kết quả |

### 5.5 Supplier Risk Intelligence

| Dimension | Mô tả |
|-----------|--------|
| **Performance Scoring** | Delivery, Quality, Pricing history |
| **Dependency Analysis** | Single-source parts, concentration risk |
| **Geographic Risk** | Rủi ro địa lý, đa dạng hóa |
| **Early Warning** | Hệ thống cảnh báo sớm |
| **Risk Grading** | A-F scoring, VaR calculation |

### 5.6 Quality AI

| Tính năng | Mô tả |
|-----------|--------|
| **Anomaly Detection** | Phát hiện bất thường (Isolation Forest) |
| **Quality Prediction** | Dự đoán chất lượng sản phẩm |
| **NCR Analysis** | Phân tích NCR bằng AI |
| **SPC Intelligence** | SPC thông minh |

### 5.7 Other AI Features

| Tính năng | Mô tả |
|-----------|--------|
| **Natural Language Query** | Truy vấn dữ liệu bằng ngôn ngữ tự nhiên |
| **Email Parser** | Phân tích email thành structured data |
| **Document OCR** | Nhận diện văn bản từ ảnh/PDF |
| **Lead Time Prediction** | Dự đoán thời gian giao hàng (XGBoost) |
| **Recommendation Engine** | 5 loại: REORDER, SUPPLIER_CHANGE, SAFETY_STOCK, EXPEDITE, CONSOLIDATE |
| **Scenario Planning** | Lập kế hoạch kịch bản what-if |

---

## 6. BẢO MẬT & TUÂN THỦ

### 6.1 Authentication & Authorization

| Tính năng | Mô tả |
|-----------|--------|
| **Password Policy** | Min 12 ký tự, uppercase + lowercase + số + ký tự đặc biệt |
| **Password History** | Không cho phép dùng lại 5 mật khẩu gần nhất |
| **Password Expiry** | Hết hạn sau 90 ngày |
| **Account Lockout** | Khóa sau 5 lần đăng nhập sai (15 phút) |
| **MFA / TOTP** | Xác thực 2 yếu tố |
| **RBAC** | 8 cấp phân quyền: admin > manager > supervisor > planner > quality > operator > viewer > user |
| **Session Management** | JWT, maxAge 8 giờ, secure cookies |
| **Route-level Protection** | Middleware kiểm tra quyền theo route |

### 6.2 Security Hardening

| Tính năng | Mô tả |
|-----------|--------|
| **XSS Prevention** | HTML escape, tag stripping, URL sanitization |
| **SQL Injection** | Prisma ORM parameterized queries |
| **CSRF** | Next.js built-in protection |
| **CSP Headers** | Content Security Policy đầy đủ |
| **HSTS** | HTTP Strict Transport Security (production) |
| **Rate Limiting** | 3 tầng: Heavy (60/min), Write (120/min), Read (300/min) |
| **Request ID** | UUID tracing cho mọi request |
| **Input Validation** | Zod schemas cho tất cả API input |

### 6.3 Compliance

| Tiêu chuẩn | Hỗ trợ |
|-------------|--------|
| **ITAR** | International Traffic in Arms Regulations controls |
| **NDAA** | National Defense Authorization Act compliance |
| **RoHS** | Restriction of Hazardous Substances |
| **REACH** | EU Chemical Regulation |
| **ISO 9001** | Quality Management System (QMS framework) |
| **AS9100** | Aerospace Quality Management |
| **Electronic Signatures** | 21 CFR Part 11 ready |
| **Audit Trail** | Full audit logging: CREATE, UPDATE, DELETE, VIEW, EXPORT, IMPORT |

---

## 7. THỐNG KÊ QUY MÔ DỰ ÁN

### 7.1 Code Metrics

| Thông số | Giá trị |
|----------|---------|
| **Tổng dòng code (src/)** | **~378,547 LOC** |
| **TypeScript/TSX files** | **20,489 files** |
| **CSS files** | 37 |
| **Prisma schema** | 5,837 lines |

### 7.2 Frontend Metrics

| Thông số | Giá trị |
|----------|---------|
| **Tổng page routes** | **~155 routes** |
| **Component directories** | **67** |
| **Component files** | **413** |
| **Custom hooks** | **28** |
| **UI primitives (Shadcn)** | 62 components |
| **Radix UI packages** | 18 |

### 7.3 Backend Metrics

| Thông số | Giá trị |
|----------|---------|
| **API route files** | **289** |
| **API HTTP handlers** | **~519** |
| **Prisma models** | **156** |
| **Prisma enums** | **25** |
| **Lib utility files** | **335** |
| **Lib directories** | **70+** |

### 7.4 Dependencies

| Loại | Số lượng |
|------|----------|
| **Production packages** | 89 |
| **Dev packages** | 18 |
| **Tổng** | **107** |

---

## 8. ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN

### 8.1 Module Maturity Matrix

| Module | Hoàn thiện | Production Ready | Ghi chú |
|--------|:----------:|:----------------:|---------|
| **Sales Orders** | 95% | ✅ | Đầy đủ CRUD, status flow, shipment |
| **Purchase Orders** | 95% | ✅ | Auto-consolidation, deep link, multi-currency |
| **Inventory** | 95% | ✅ | 8 kho, lot tracking, ABC, cycle count |
| **Parts Master** | 95% | ✅ | 110 fields, compliance, certifications |
| **BOM** | 95% | ✅ | Multi-level, versioning, explosion |
| **MRP Engine** | 95% | ✅ | Full MRP-I, ATP/CTP, pegging, simulation |
| **Production** | 90% | ✅ | WO, Gantt, OEE, shop floor, routing |
| **Quality (QMS)** | 90% | ✅ | Inspection, NCR, CAPA, SPC, traceability |
| **Warehouse** | 90% | ✅ | Multi-warehouse, receipt, pick list |
| **Finance** | 85% | ✅ | GL, invoicing, costing, MISA export |
| **AI / ML** | 85% | ✅ | Copilot, forecast, risk, simulation |
| **Reports** | 80% | ✅ | Templates, PDF/Excel, scheduled |
| **Discussions** | 85% | ✅ | Threads, mentions, attachments |
| **Workflow** | 80% | ✅ | Multi-step approval, delegation |
| **Auth / Security** | 90% | ✅ | MFA, RBAC, audit trail, rate limiting |
| **i18n** | 95% | ✅ | EN/VI đầy đủ |
| **Import/Export** | 85% | ✅ | AI mapping, smart import, templates |
| **Notifications** | 80% | ✅ | Real-time, bell widget, preferences |
| **Analytics** | 60% | ⚠️ | Dashboard builder có, nhưng một số dùng mock data |
| **Customer Portal** | 50% | ⚠️ | Cấu trúc có, chưa hoàn thiện giao diện |
| **Supplier Portal** | 50% | ⚠️ | Cấu trúc có, chưa hoàn thiện giao diện |
| **Mobile PWA** | 50% | ⚠️ | Cấu trúc đầy đủ, cần polish |
| **Multi-tenancy** | 40% | ⚠️ | Schema có, middleware có, chưa test đầy đủ |

### 8.2 Overall Assessment

```
╔══════════════════════════════════════════════════════════════╗
║                    OVERALL SCORE: 85/100                     ║
║                                                              ║
║  Architecture:     ██████████████████░░  90%                 ║
║  Core Features:    ██████████████████░░  92%                 ║
║  AI/ML:            █████████████████░░░  85%                 ║
║  Security:         ██████████████████░░  90%                 ║
║  Code Quality:     █████████████████░░░  85%                 ║
║  Documentation:    ████████████░░░░░░░░  60%                 ║
║  Testing:          ██████████░░░░░░░░░░  50%                 ║
║  Portals/Mobile:   ██████████░░░░░░░░░░  50%                 ║
║                                                              ║
║  Status: PRODUCTION READY (Core Modules)                     ║
╚══════════════════════════════════════════════════════════════╝
```

### 8.3 Điểm mạnh

1. **Kiến trúc enterprise-grade** — 156 data models, 519 API endpoints, phủ trọn vòng đời sản xuất
2. **MRP Engine mạnh mẽ** — Full MRP-I + ATP/CTP + Demand Pegging + Multi-site + Simulation
3. **AI tích hợp sâu** — Copilot, Forecast, Auto-PO, Auto-Schedule, Supplier Risk, Monte Carlo
4. **Quality Management System đầy đủ** — Inspection → NCR → CAPA → Traceability → SPC
5. **Bilingual (EN/VI)** — Chuyển đổi tức thì, UX tối ưu cho người dùng Việt Nam
6. **Security toàn diện** — MFA, RBAC 8 cấp, rate limiting 3 tầng, ITAR/NDAA compliance
7. **Bloomberg Terminal UI** — Giao diện chuyên nghiệp, compact, hiệu quả cao

### 8.4 Cần cải thiện

1. **Analytics** — Một số dashboard dùng mock data, cần kết nối real data
2. **Testing** — Chưa đủ unit/integration test coverage
3. **Customer & Supplier Portal** — Có cấu trúc nhưng chưa hoàn thiện UI
4. **Mobile PWA** — Cần polish và test offline flow
5. **Documentation** — Cần thêm user guide và API documentation

---

## 9. ROADMAP & ĐỀ XUẤT

### Phase 1: Stabilization (Hiện tại)
- [ ] Hoàn thiện Analytics với real data (thay mock data)
- [ ] Tăng test coverage (unit + integration)
- [ ] Performance optimization cho large dataset
- [ ] Bug fixes & UX polish

### Phase 2: Portal Enhancement
- [ ] Hoàn thiện Customer Portal UI
- [ ] Hoàn thiện Supplier Portal UI
- [ ] Mobile PWA testing & offline sync
- [ ] Push notifications

### Phase 3: Advanced Features
- [ ] Multi-tenancy full testing & deployment
- [ ] Advanced AI models (production ML service)
- [ ] Real-time WebSocket (thay SSE polling)
- [ ] Barcode/QR printing integration
- [ ] API documentation (Swagger/OpenAPI)

### Phase 4: Scale & Enterprise
- [ ] Kubernetes deployment
- [ ] Multi-region database
- [ ] Advanced audit & compliance reporting
- [ ] Third-party integrations (ERP, CRM)
- [ ] White-label / customization framework

---

## PHỤ LỤC

### A. Cấu trúc thư mục chính

```
lerp-mrp/
├── prisma/
│   └── schema.prisma          # 5,837 lines, 156 models
├── src/
│   ├── app/
│   │   ├── (auth)/            # 3 auth pages
│   │   ├── (dashboard)/       # ~43 feature directories, ~155 routes
│   │   ├── (portal)/          # Customer & Supplier portals
│   │   ├── api/               # 289 API route files
│   │   └── mobile/            # 16 mobile routes
│   ├── components/            # 67 directories, 413 files
│   │   ├── ui/                # 62 Shadcn/UI primitives
│   │   ├── ui-v2/             # 19 enhanced components
│   │   ├── ai-copilot/        # 9 AI chat components
│   │   ├── mrp/               # 11 MRP components
│   │   ├── quality/           # 8 quality components
│   │   ├── production/        # 10 production components
│   │   ├── discussions/       # 11 collaboration components
│   │   └── ...                # 60+ more directories
│   ├── lib/                   # 335 files, 70+ directories
│   │   ├── ai/                # AI core + 6 sub-modules
│   │   ├── mrp/               # MRP engines (core + execution)
│   │   ├── quality/           # QMS engine
│   │   ├── production/        # Production scheduling
│   │   ├── finance/           # Financial engine
│   │   ├── cache/             # Cache layer
│   │   ├── security/          # Security utilities
│   │   ├── i18n/              # Internationalization
│   │   └── ...                # 60+ more directories
│   └── hooks/                 # 28 custom React hooks
├── public/                    # Static assets
├── docs/                      # Documentation
└── package.json               # 89 prod + 18 dev dependencies
```

### B. Supported Environments

| Environment | Configuration |
|-------------|--------------|
| **Development** | SQLite/PostgreSQL, in-memory cache, hot reload |
| **Staging** | PostgreSQL, Redis, S3 |
| **Production** | PostgreSQL, Redis, S3, Sentry, CDN |
| **Docker** | docker-compose with all services |

### C. Key External Services

| Service | Purpose | Required |
|---------|---------|----------|
| PostgreSQL | Primary database | Yes |
| Redis | Cache, queue, rate limiting | Recommended |
| AWS S3 | File storage, backups | Optional |
| OpenAI / Anthropic | AI features | Optional |
| Google Gemini | Forecasting, email parsing | Optional |
| Sentry | Error tracking | Optional |
| SMTP / SendGrid / SES | Email notifications | Optional |

---

> **Prepared by:** Claude Code AI Assistant
> **Date:** 04/03/2026
> **Classification:** Confidential — For Client Review Only
