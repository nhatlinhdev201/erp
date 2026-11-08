# L-ERP — Task Graph Phase 1: Nền tảng Vững chắc

> Vibecode Kit v6.0 | Chủ thầu: Claude Chat | Thợ thi công: Claude Code Agents

```
TIP-001: CI/CD ──────► TIP-002: Dev Experience ──► TIP-003: @linkk/metrics
                                                  ├──► TIP-004: @linkk/openapi
                                                  └──► TIP-005: Monitoring Stack
                                                              └──► TIP-006: Helm Chart
                                                                        └──► VERIFY
```

## TIP-001: CI/CD Nâng cấp
- **Ưu tiên**: P0 | **Effort**: 1h
- **Dependencies**: Không
- **Deliverables**: .github/workflows/ci.yml (nâng cấp), release.yml (mới)

## TIP-002: Developer Experience
- **Ưu tiên**: P0 | **Effort**: 1h
- **Dependencies**: Không
- **Deliverables**: scripts/setup.sh, Makefile, .husky/, .lintstagedrc.json, commitlint.config.js

## TIP-003: Package @linkk/metrics
- **Ưu tiên**: P0 | **Effort**: 1.5h
- **Dependencies**: TIP-001 (CI phải chạy được)
- **Deliverables**: packages/metrics/ (Prometheus client)

## TIP-004: Package @linkk/openapi
- **Ưu tiên**: P1 | **Effort**: 1.5h
- **Dependencies**: TIP-001
- **Deliverables**: packages/openapi/ (OpenAPI generator + Swagger UI)

## TIP-005: Monitoring Stack
- **Ưu tiên**: P1 | **Effort**: 1h
- **Dependencies**: TIP-003 (metrics package phải có)
- **Deliverables**: infrastructure/monitoring/ (Prometheus, Grafana, Loki)

## TIP-006: Helm Chart Cơ bản
- **Ưu tiên**: P2 | **Effort**: 1.5h
- **Dependencies**: TIP-005
- **Deliverables**: charts/lerp/ (Helm chart cho 14 apps)
