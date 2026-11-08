# L-ERP System Architecture / Kiến trúc hệ thống L-ERP

This directory contains comprehensive architecture documentation for L-ERP, including system diagrams, data flow, deployment topology, and event-driven patterns.

Thư mục này chứa tài liệu kiến trúc toàn diện cho L-ERP, bao gồm sơ đồ hệ thống, luồng dữ liệu, cấu trúc triển khai và các mẫu hướng sự kiện.

---

## System Overview / Tổng quan hệ thống

The L-ERP system is built on a modern, cloud-native microservices architecture with the following key layers:

Hệ thống L-ERP được xây dựng dựa trên kiến trúc microservices hiện đại, hướng tới đám mây với các lớp chính sau:

- **Client Layer**: Web apps (Next.js), mobile apps (React Native), desktop clients (Electron)
- **API Gateway**: Kong for routing, rate limiting, authentication
- **Identity & Access**: Keycloak for SSO, OIDC/SAML, multi-tenancy
- **Microservices**: 14+ independent services (CRM, Accounting, Inventory, HRM, etc.)
- **Data Layer**: PostgreSQL (primary), Redis (cache), NATS JetStream (events)
- **Infrastructure**: Kubernetes with Helm deployments, Terraform IaC

**Diagram: System Overview**

See: [system-overview.mermaid](system-overview.mermaid)

```
┌─────────────────────────────────────────────┐
│           Client Layer                      │
│  Web  │ Mobile │ Desktop                    │
└────────────────┬────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────┐
│    Kong API Gateway + Keycloak Auth        │
│  Rate Limiting │ Request Routing │ AuthZ   │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┬──────────────┐
    │                         │              │
┌───▼──────┐  ┌──────────┐ ┌─▼──────────┐  │
│   CRM    │  │Accounting│ │ Inventory  │  │
│ Service  │  │ Service  │ │  Service   │  │
└───┬──────┘  └────┬─────┘ └─┬──────────┘  │
    │              │         │             │
    └──────────────┼─────────┴─────────────┘
                   │
    ┌──────────────┼──────────┐
    │              │          │
┌───▼─────┐  ┌─────▼────┐ ┌──▼──────┐
│PostgreSQL│ │  Redis   │ │  NATS   │
│  (DB)    │ │ (Cache)  │ │(Events) │
└──────────┘ └──────────┘ └─────────┘
```

---

## Module Dependencies / Phụ thuộc mô-đun

L-ERP consists of 14+ services and applications with carefully managed dependencies:

L-ERP bao gồm 14+ dịch vụ và ứng dụng với các phụ thuộc được quản lý cẩn thận:

**Applications (Những ứng dụng)**:
- Admin Dashboard: Unified interface for system administration
- Public Portal: Customer-facing portal for self-service
- Mobile App: React Native for iOS/Android

**Core Services (Dịch vụ lõi)** (7+):
- CRM: Customer relationship management
- Accounting: Financial records and reporting
- Inventory: Stock and warehouse management
- HRM: Human resource management
- Ecommerce: Online store and order management
- MRP: Manufacturing and production planning
- Payroll: Salary and benefits management

**Supporting Services (Các dịch vụ hỗ trợ)** (6+):
- Financial: Cash flow, budgets, financial planning
- Purchasing: Vendors and purchase orders
- Quality: Quality control and inspections
- Project: Project management
- Document Management: File storage and management
- Compliance: Vietnamese regulations (TT200, NĐ123, BHXH)

**Shared Libraries (Thư viện chia sẻ)**:
- Core Types and Constants
- Validation Rules (Zod schemas)
- Event Definitions and Subjects
- UI Components Library

**Diagram: Module Dependencies**

See: [module-dependencies.mermaid](module-dependencies.mermaid)

```
Event Flow Examples:
1. CRM creates customer → crm.customer.created event
   → Accounting subscribes → creates deferred credit account
   → Ecommerce subscribes → unlocks customer portal

2. Ecommerce places order → ecom.order.placed
   → Inventory subscribes → adjusts stock
   → MRP subscribes → checks BOM
   → Accounting subscribes → creates AR invoice
```

---

## Data Flow / Luồng dữ liệu

A typical request flows through multiple layers:

Một yêu cầu điển hình chảy qua nhiều lớp:

1. **Client Request**: Browser/Mobile sends HTTPS request with JWT token
2. **Kong Gateway**: Routes to service, validates headers, applies rate limiting
3. **Keycloak Auth**: Validates JWT, checks scopes and permissions
4. **Service Handler**: Receives request, validates inputs
5. **Cache Check**: Redis stores frequently accessed data (5min TTL)
6. **Database Query**: Prisma ORM generates type-safe SQL
7. **PostgreSQL**: Executes ACID transaction, returns typed rows
8. **Response Building**: Service formats response, publishes event
9. **Event Publishing**: NATS JetStream stores event with 30-day retention
10. **Return Response**: Kong returns JSON to client
11. **Event Consumers**: Durable consumers process events (analytics, audit, notifications)

**Diagram: Request & Event Data Flow**

See: [data-flow.mermaid](data-flow.mermaid)

**Key Points / Điểm chính**:
- All database queries are type-safe via Prisma
- Events enable async communication between services
- Redis cache reduces database load
- NATS JetStream enables event replay for debugging
- All requests authenticated via Keycloak
- Rate limiting prevents abuse

---

## Deployment Architecture / Kiến trúc triển khai

L-ERP is deployed to Kubernetes clusters managed by Terraform:

L-ERP được triển khai cho các cụm Kubernetes được quản lý bởi Terraform:

**Infrastructure Layers / Lớp cơ sở hạ tầng**:
1. **Cloud Provider**: AWS, GCP, Azure, or on-premises
2. **Kubernetes Cluster**: EKS, GKE, AKS, or self-managed
3. **Ingress**: TLS termination, DNS routing
4. **Kong Gateway**: LoadBalancer service with 3+ replicas
5. **Keycloak**: StatefulSet with 3 replicas for HA
6. **Microservices**: Deployments with HPA (Horizontal Pod Autoscaling)
7. **Data Stores**: StatefulSets with PersistentVolumes
8. **ConfigMaps & Secrets**: Environment-specific configuration
9. **Monitoring & Logging**: Prometheus, Grafana, Loki/ELK

**Diagram: Kubernetes Deployment**

See: [deployment.mermaid](deployment.mermaid)

**Scaling Strategy / Chiến lược mở rộng**:
- Services autoscale based on CPU (70% threshold)
- Database uses streaming replication (primary + 2 standby)
- Redis uses primary + replica for HA
- NATS JetStream runs 3-node cluster
- StatefulSets maintain persistent data across pod restarts

**Environments / Môi trường**:
- **dev**: Minimal replicas, 1 database replica, daily backups
- **staging**: 2 replicas per service, production-like load
- **production**: 3+ replicas, HA database, hourly backups, disaster recovery

**Environment Configuration / Cấu hình môi trường**:
- Terraform defines cloud infrastructure (VPC, security groups, k8s cluster)
- Helm defines service deployments (replicas, resources, env vars)
- ConfigMaps store non-sensitive app config per environment
- Secrets store sensitive data (DB credentials, API keys, JWT keys)
- GitOps pipeline: Git → CI/CD → Terraform → Helm → Kubernetes

---

## Event-Driven Architecture / Kiến trúc hướng sự kiện

L-ERP uses NATS JetStream for event streaming between microservices:

L-ERP sử dụng NATS JetStream để phát trực tuyến sự kiện giữa các microservices:

**Event Categories / Danh mục sự kiện**:
1. **Domain Events**: Business events (invoice.created, order.shipped)
2. **Integration Events**: Cross-module communication (inventory.stock.low)
3. **Notification Events**: Trigger alerts (payroll.processed → send email)
4. **Compliance Events**: Audit trail for regulations (invoice.submitted for TT200)

**Event Subject Naming / Đặt tên chủ đề sự kiện**:
- Format: `{service}.{entity}.{action}`
- Examples: `crm.customer.created`, `acc.invoice.submitted`, `inv.stock.adjusted`
- Hierarchical subjects enable wildcard subscriptions: `acc.*` matches all accounting events

**Durable Consumers / Người tiêu dùng bền vững**:
- Each subscriber has durable consumer tracking offset
- At-least-once delivery: events never lost
- Replay capability: reprocess events from past
- Consumer groups: multiple instances consume same event

**Diagram: Event Flows Between Modules**

See: [event-flows.mermaid](event-flows.mermaid)

**Example Event Flow: Order to Invoice / Ví dụ luồng sự kiện: Đặt hàng để lập hóa đơn**:
```
1. Ecommerce: Customer places order
   → Publish: ecom.order.placed

2. Inventory Service:
   → Subscribe to: ecom.order.*
   → Adjust stock, publish: inv.stock.adjusted

3. MRP Service:
   → Subscribe to: inv.stock.adjusted
   → Check BOM, publish: mrp.production.triggered

4. Accounting Service:
   → Subscribe to: ecom.order.placed
   → Create AR invoice, publish: acc.invoice.created

5. Analytics Consumer:
   → Subscribe to: *.*.* (all events)
   → Aggregate metrics, update data warehouse

6. Audit Consumer:
   → Subscribe to: *.*.* (all events)
   → Log to compliance database per TT200
```

---

## Architecture Decision Records / Hồ sơ quyết định kiến trúc

All major architectural decisions are documented in the [ADR directory](../adr/).

Tất cả các quyết định kiến trúc chính được ghi lại trong [thư mục ADR](../adr/).

Key ADRs:
- [ADR-001: Monorepo with npm Workspaces + Turborepo](../adr/001-monorepo-with-npm-workspaces.md)
- [ADR-002: Next.js 14+ for Web Applications](../adr/002-nextjs-for-web-apps.md)
- [ADR-003: Prisma ORM for Data Access](../adr/003-prisma-orm.md)
- [ADR-004: NATS JetStream for Events](../adr/004-nats-jetstream-events.md)
- [ADR-005: Keycloak for Identity](../adr/005-keycloak-sso.md)
- [ADR-006: Kong API Gateway](../adr/006-kong-api-gateway.md)
- [ADR-007: PostgreSQL Database](../adr/007-postgresql-primary-database.md)
- [ADR-008: Terraform for Infrastructure](../adr/008-terraform-multi-cloud.md)
- [ADR-009: Helm for Kubernetes Deployments](../adr/009-helm-kubernetes-deployment.md)
- [ADR-010: Vietnamese Market Compliance](../adr/010-vietnamese-market-compliance.md)

---

## Key Technologies / Công nghệ chính

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 14+ | Web applications, SSR, API routes |
| **Mobile** | React Native | 0.73+ | iOS/Android applications |
| **Backend** | Node.js | 20 LTS | Microservices runtime |
| **ORM** | Prisma | 5.x | Type-safe data access, migrations |
| **Database** | PostgreSQL | 16 | Relational data, ACID, full-text search |
| **Cache** | Redis | 7+ | Session storage, query caching |
| **Events** | NATS JetStream | 2.10+ | Async messaging, event streaming |
| **API Gateway** | Kong | 3.4+ | Request routing, rate limiting, auth |
| **Identity** | Keycloak | 24+ | Authentication, authorization, SSO |
| **Orchestration** | Kubernetes | 1.27+ | Container orchestration, auto-scaling |
| **IaC** | Terraform | 1.6+ | Infrastructure provisioning |
| **Deployment** | Helm | 3.12+ | Kubernetes package management |
| **Monitoring** | Prometheus | Latest | Metrics collection |
| **Visualization** | Grafana | Latest | Metrics dashboards |

---

## Performance Targets / Mục tiêu hiệu suất

| Metric | Target | Notes |
|--------|--------|-------|
| API Latency (p99) | <200ms | Including network round-trip |
| Database Query | <50ms | For 95% of queries |
| Cache Hit Rate | >80% | Redis for frequently accessed data |
| Pod Startup | <30s | Service readiness time |
| Deployment Time | <5min | Full rollout time |
| Event Latency | <100ms | NATS message to consumer |
| Availability | 99.5% | 3.6 hours downtime/month |

---

## Security Considerations / Xem xét bảo mật

1. **Network Security**: TLS 1.3 for all communication, VPC isolation
2. **Authentication**: JWT tokens from Keycloak, OIDC/SAML support
3. **Authorization**: Role-based access control (RBAC) per service, row-level security in database
4. **Data Encryption**: Secrets encrypted at rest, transit encryption
5. **Audit Logging**: All events logged for TT200 compliance
6. **Supply Chain**: Vulnerability scanning, signed container images
7. **Rate Limiting**: Kong enforces per-API-key limits

---

## Disaster Recovery / Phục hồi thảm họa

1. **Database Backups**: Hourly in production, 30-day retention
2. **Multi-Region Replicas**: Optional setup for geographic failover
3. **Event Replay**: NATS JetStream enables reprocessing from any point
4. **Blue-Green Deployments**: Helm enables zero-downtime upgrades
5. **Secrets Rotation**: Regular key rotation, automatic in future

---

## Developer Workflow / Quy trình nhà phát triển

1. Clone monorepo: `git clone viertp && npm install`
2. Start local services: `docker-compose up` (PostgreSQL, Redis, NATS)
3. Run services: `npm run dev` in service directory
4. Test changes: `npm test`
5. Commit and push: Husky hooks run linting, type-checking
6. CI/CD: GitHub Actions runs tests, builds Docker images
7. Deploy: Terraform + Helm deploy to staging/production

---

## Related Documentation / Tài liệu liên quan

- [Architecture Decision Records (ADR)](../adr/README.md)
- [Deployment Guide](./DEPLOYMENT.md) *(coming soon)*
- [API Documentation](./API.md) *(coming soon)*
- [Event Catalog](./EVENTS.md) *(coming soon)*
- [Monitoring & Observability](./OBSERVABILITY.md) *(coming soon)*

---

**Last Updated / Cập nhật cuối**: 2026-03-29
**Maintained by / Được duy trì bởi**: L-ERP Core Team
**Contact / Liên hệ**: architecture@viertp.dev
