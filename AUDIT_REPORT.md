# 🔍 BÁO CÁO AUDIT & CHECKLIST KIỂM TRA TỪNG BƯỚC

> **Repo:** https://github.com/nclamvn/Viet-ERP
> **Ngày audit:** 2025-11-08
> **Người audit:** Linkk (nhatlinhdev201@gmail.com)
> **Bản clone:** /Users/admin/Desktop/erp — branch `main`, commit `40970cc`
> **Giấy phép:** MIT — ✅ Được phép fork, sửa, dùng thương mại, bán lại (chỉ cần giữ copyright notice)

---

## 📊 TÓM TẮT ĐIỂM DANH

| Hạng mục | Kết luận |
|---|---|
| Kiến trúc | Monorepo Turborepo, 16 apps + 27 packages, microservices module hoá |
| Mã độc | ✅ KHÔNG có |
| Thu thập dữ liệu / telemetry | ✅ KHÔNG có (dữ liệu nằm trong hạ tầng của bạn) |
| Secret bị leak | ✅ KHÔNG có (chỉ placeholder) |
| Dependency lạ (non-npm-registry) | ✅ KHÔNG có |
| Lỗ hổng bảo mật cần sửa | 🔴 2 nghiêm trọng + 🟠 2 vừa + 🟡 2 thấp |
| Chất lượng code | ⚠️ Non-đồng đều (AI-generated hàng loạt, 28 commits / 1.4M LOC) |
| Fork làm nền độc lập | ✅ ĐƯỢC (MIT), nhưng nên chọn module lõi, gỡ phần dư |

---

# PHẦN A — KIỂM TRA CÁC VẤN ĐỀ BẢO MẬT (làm theo thứ tự)

## 🔴 A1. [NGHIÊM TRỌNG] Bypass toàn bộ auth khi NODE_ENV ≠ production

**Vấn đề:** Middleware của MRP trả về `next()` ngay lập tức — bỏ qua **toàn bộ** auth, rate-limit, security checks — nếu app chạy mà `NODE_ENV` không phải `production`. Deploy quên set biến này → app mở hoàn toàn cho mọi người.

**File:** `apps/MRP/src/middleware.ts` — dòng 199–203

**Kiểm tra:**
```bash
cd /Users/admin/Desktop/erp
sed -n '197,210p' apps/MRP/src/middleware.ts
# Sẽ thấy:
#   if (process.env.NODE_ENV !== 'production') {
#     return NextResponse.next();   // ← bỏ qua TẤT CẢ protection
#   }
```

**Tìm các chỗ tương tự trong app khác:**
```bash
grep -rn "NODE_ENV !== 'production'" apps/*/src/middleware.ts apps/*/middleware.ts 2>/dev/null
grep -rn "bypass" apps/*/src/middleware.ts apps/*/src/lib/auth/ 2>/dev/null | grep -v test
```

**Cách sửa (chọn 1):**
- **Cách 1 (an toàn nhất):** Xoá hoàn toàn block bypass. Dev muốn vào dashboard thì đăng nhập như bình thường.
- **Cách 2 (giữ tiện dev):** Thêm điều kiện IP + biến tường minh:
```ts
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_AUTH_BYPASS === 'true' &&
  ip === '127.0.0.1'
) {
  return NextResponse.next();
}
```

**Xác nhận đã sửa:**
```bash
grep -c "ALLOW_AUTH_BYPASS" apps/MRP/src/middleware.ts   # ≥ 1 nếu dùng cách 2
# Hoặc không còn dòng "bypass all auth" nào
```

---

## 🔴 A2. [NGHIÊM TRỌNG] Auto `db push --accept-data-loss` khi startup (TPM NestJS)

**Vấn đề:** Mỗi lần khởi động, app tự chạy `prisma db push --accept-data-loss` — nếu schema khác DB (vd. sau khi đổi model), Prisma sẽ **xoá cột / bảng / dữ liệu** mà không hỏi.

**File:** `apps/TPM-api-nestjs/src/main.ts` — dòng 23–27

**Kiểm tra:**
```bash
sed -n '15,35p' apps/TPM-api-nestjs/src/main.ts
```

**Cách sửa:** Bọc trong biến môi trường, mặc định TẮT:
```ts
if (process.env.AUTO_MIGRATE === 'true') {
  execSync('npx prisma db push --skip-generate', {   // bỏ --accept-data-loss
    stdio: 'inherit', timeout: 60000,
  });
} else {
  console.log('[DB] AUTO_MIGRATE != true — skip auto schema push. Chạy migrate thủ công.');
}
```
Tốt hơn nữa: dùng `prisma migrate deploy` (migration có kiểm soát) thay vì `db push`.

**Kiểm tra các app khác có pattern tương tự:**
```bash
grep -rn "accept-data-loss\|db push" apps/*/src/main.ts apps/*/server.ts 2>/dev/null | grep -v test
```

---

## 🟠 A3. [VỪA] Password seed mặc định — phải đổi toàn bộ trước khi chạy

**Vấn đề:** Các script seed tạo user admin với password hardcoded. Ai cũng đọc được trên GitHub → nếu deploy mà không đổi = mất hệ thống.

**Kiểm tra danh sách:**
```bash
grep -rn "bcrypt.hash(" apps/*/prisma/*.ts | grep -iE "admin|123|demo|RTR"
```

**Danh sách đã tìm thấy:**

| File | Password |
|---|---|
| `apps/TPM-api-nestjs/src/main.ts` (inline seed) | `admin123` |
| `apps/TPM-api/prisma/seeds/users.ts` | `admin123`, `manager123`, `user123` |
| `apps/TPM-api/prisma/seeds/base-seed.ts` | `Admin@123` |
| `apps/HRM-AI/prisma/seed.ts:520` | `Demo@123` |
| `apps/HRM-unified/prisma/seed.ts:520` | `Demo@123` |
| `apps/HRM/prisma/seed.ts:148` + `seed-demo.ts:242` | `RTR@2026` |
| `apps/HRM/prisma/seed-prod.ts:9` | ⚠️ fallback `RTR@Admin2026!` (prod seed!) |

**Cách sửa chuẩn (mẫu — áp cho từng file):**
```ts
// Trước:
const password = await bcrypt.hash('admin123', 10);

// Sau — bắt buộc lấy từ env, fail-fast nếu thiếu:
const pw = process.env.SEED_ADMIN_PASSWORD;
if (!pw || pw.length < 12) {
  throw new Error('Thiếu SEED_ADMIN_PASSWORD (≥12 ký tự). Không seed user mặc định.');
}
const password = await bcrypt.hash(pw, 10);
```

**Sau khi deploy — đổi password ngay:**
```bash
# Xoá/khoá user demo nếu không dùng:
docker exec -it vierp-postgres psql -U erp -d erp_dev \
  -c "UPDATE \"User\" SET \"isActive\"=false WHERE email LIKE '%demo%' OR email LIKE '%admin@vierp%';"
```

**Xác nhận:** chạy lại seed mà không set env → phải báo lỗi, không seed gì cả.

---

## 🟠 A4. [VỪA] `new Function()` eval công thức người dùng không sanitize (ExcelAI)

**Vấn đề:** 2 chỗ eval chuỗi do người dùng nhập mà **không lọc ký tự** → chèn code chạy trong trình duyệt người dùng (self-XSS → có thể đánh cắp session nếu chia sẻ file ExcelAI).

**Kiểm tra:**
```bash
sed -n '135,145p' apps/ExcelAI/src/powerquery/index.ts      # addColumn — KHÔNG sanitize
sed -n '168,178p' apps/ExcelAI/src/components/PivotTable/pivotEngine.ts  # KHÔNG sanitize
# Đối chiếu chỗ ĐÃ làm đúng:
sed -n '418,430p' apps/ExcelAI/src/workers/calc.worker.ts   # có replace(/[^0-9+\-*/.() ]/g,'')
```

**Cách sửa — áp pattern sanitize của calc.worker.ts cho cả 2 chỗ:**
```ts
// powerquery/index.ts — addColumn: chỉ cho phép số, toán tử, chuỗi an toàn
const SANITIZE = /[^0-9+\-*/.() "']|javascript:|import|require/g;
if (SANITIZE.test(expr)) { return { ...row, [name]: null }; }
// Tốt hơn: dùng thư viện expression parser an toàn (vd. expr-eval) thay new Function
```
**Khuyến nghị dài hạn:** thay toàn bộ `new Function` bằng `expr-eval` hoặc `mathjs` (không execute JS thật).

**Quét lại sau khi sửa:**
```bash
grep -rn "new Function" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v sanitize
# Mục tiêu: mọi hit còn lại đều có bước sanitize rõ ràng ngay trước đó
```

---

## 🟡 A5. [THẤP] Shell injection trong backup service (MRP)

**Vấn đề:** Password từ `DATABASE_URL` được chèn trực tiếp vào lệnh shell bằng interpolation. Nếu env var chứa `"`, `$(...)`, backtick → thực thi lệnh tuỳ ý.

**File:** `apps/MRP/src/lib/backup/backup-service.ts` — dòng ~90

**Kiểm tra:**
```bash
grep -n "PGPASSWORD" apps/MRP/src/lib/backup/backup-service.ts
```

**Cách sửa — truyền qua env thay vì chuỗi lệnh:**
```ts
await execAsync(
  `pg_dump -h "${url.hostname}" -p "${url.port || 5432}" -U "${url.username}" -d "${url.pathname.slice(1)}" -F p -f "${filePath}"`,
  { env: { ...process.env, PGPASSWORD: url.password } }  // ← qua env, không interpolate
);
```
Thêm nữa: backup file SQL chứa dữ liệu thô → đảm bảo `BACKUP_DIR` nằm ngoài thư mục public, chmod 600.

---

## 🟡 A6. [THẤP] Hạ tầng dev dùng password yếu

**File:** `docker-compose.yml` (chỉ ảnh hưởng dev, KHÔNG dùng compose này cho prod)

| Dịch vụ | Giá trị yếu |
|---|---|
| Postgres | `erp_dev_2026` |
| Keycloak admin | `admin/admin` |
| Keycloak mode | `start-dev` (không hardened) |

**Kiểm tra:** `grep -n "PASSWORD" docker-compose.yml`

**Hành động:** chấp nhận được nếu chỉ chạy local. Tuyệt đối không expose port 5432/8080/8001 ra mạng ngoài. Khi lên prod → dùng `docker-compose.prod.yml` + set password thật qua `.env`.

**⚠️ KHÔNG chạy script này:** `setup-liphoco.sh` — nó ghi aliases vào `~/.zshrc` của bạn và tham chiếu hạ tầng cá nhân của tác giả (VS Code tunnel, Telegram bot). Không độc hại nhưng là rác cá nhân của tác giả. Nếu lỡ chạy:
```bash
# Gỡ aliases:
sed -i '' '/=== LIPHOCO ERP aliases ===/,/^$/d' ~/.zshrc
```

---

# PHẦN B — KIỂM TRA LẠI CÁC PHÁT HIỂN "SẠCH" (đã quét, ghi lại để đối chiếu sau này)

## B1. Mã độc — KẾT LUẬN: KHÔNG CÓ ✅

Đã kiểm tra và kết quả sạch:

```bash
# 1. Không có file nhị phân khả nghi trong git:
git ls-files | grep -iE "\.(exe|dll|so|dylib|bin|jar|apk|bat|cmd|ps1|scr|vbs|dmg|pkg)$"
# → (rỗng)

# 2. Không có base64 obfuscate:
grep -rn -E "[A-Za-z0-9+/]{500,}={0,2}" --include="*.ts" --include="*.js" apps/ packages/
# → (rỗng)

# 3. Toàn bộ dependency từ npm registry chính:
grep -h '"resolved"' package-lock.json apps/*/package-lock.json | grep -v "registry.npmjs.org" | sort -u
# → chỉ có "resolved": "apps/..." (workspace nội bộ)

# 4. postinstall/preinstall chỉ có chuẩn:
#    package.json → "husky" | apps/MRP/package.json → "prisma generate"

# 5. CI workflows (.github/workflows/ci.yml, deploy.yml, release.yml):
#    chỉ curl health-check vào chính hệ thống + Slack webhook (đã comment)
```

## B2. Thu thập dữ liệu / telemetry — KẾT LUẬN: KHÔNG CÓ ✅

```bash
# Quét: GA/GTM/Sentry/Mixpanel/Segment/Hotjar/PostHog/Amplitude:
grep -rn -iE "googletagmanager|google-analytics|gtag|sentry\.io|mixpanel|segment\.io|hotjar|posthog|amplitude" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.html" . | grep -v node_modules
# → (rỗng — chỉ "workbox-google-analytics" trong lock file, là gói npm chuẩn)

# Các domain ngoài mà code gọi — toàn bộ là integration TỰ CẤU HÌNH:
#   - sandbox ngân hàng: vietcombank/techcombank/acb/mbbank (tích hợp thanh toán)
#   - e-invoice CA: vnpt-ca.vn, viettel-ca.vn, fpt-ca.vn, nacencomm.gov.vn
#   - nominatim.openstreetmap.org (geocoding), fonts.googleapis.com
#   - generativelanguage.googleapis.com + Anthropic API (AI — cần key của bạn)
# → KHÔNG có beacon/phone-home về tác giả. Dữ liệu nằm trong DB của bạn.
```

## B3. Secret bị commit — KẾT LUẬN: KHÔNG CÓ ✅

```bash
git ls-files | grep -iE "\.env"    # → chỉ có *.example, *.template, TPM-web VITE_* (public-by-design)
grep -rn -iE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9]{16,}['\"]" \
  apps/ packages/ infrastructure/
# → chỉ 1 placeholder trong docs: 'erp_live_xxxxxxxxxxxxxxxxxxxxxxxx'
```
Ghi chú nhỏ: docs PM có tham chiếu Supabase project cá nhân của tác giả (`ugcjikdlyktrkqgblsrw.supabase.co`, key dạng `eyJ...` bị cắt) — không dùng được, nhưng nên dọn khi fork (xem C3).

---

# PHẦN C — LỘ TRÌNH FORK LÀM NỀN TẢNG ĐỘC LẬP

## C0. Pháp lý — MIT cho phép gì

| Quyền | Được? |
|---|---|
| Dùng thương mại | ✅ |
| Sửa đổi | ✅ |
| Phân phối / bán lại | ✅ |
| Sublicense / đóng source bản của bạn | ✅ |
| Dùng tên "VietERP" làm thương hiệu | ⚠️ Nên đổi tên (tránh nhầm lẫn nguồn gốc) |
| Nghĩa vụ duy nhất | Giữ dòng `Copyright (c) 2026 VietERP Platform Contributors` trong LICENSE của bản phân phối |

## C1. Thực trạng chất lượng — đọc trước khi tin README

- **28 commits / ~1.4M LOC** → gần như toàn bộ code do AI sinh hàng loạt
- Commit gần nhất (dòng đầu git log) vẫn đang fix: *"404 on all routes"*, *"Internal Server Error"*, *"bypass auth in dev mode"* → **"100% hoàn thiện" trong README là claim marketing, KHÔNG phản ánh thực tế**
- Cách kiểm chứng nhanh khi bạn phát triển:
```bash
git log --oneline | wc -l          # 28 commits
git log --oneline -10              # xem các fix gần nhất
npx cloc apps/ --quiet | tail -5   # đếm lại LOC thực tế nếu cần
```

## C2. Trùng lặp module — phải chọn 1 và gỡ phần còn lại

| Nhóm trùng | Ứng viên | Gỡ |
|---|---|---|
| HRM (3 bản) | `HRM-unified` (đầy đủ nhất theo tên) | `HRM`, `HRM-AI` |
| TPM backend (2 bản) | `TPM-api-nestjs` (NestJS chuẩn) | `TPM-api` |
| Landing vs docs | giữ cái bạn cần | cái còn lại |

```bash
# Ví dụ gỡ (làm trong branch riêng!):
git checkout -b fork/slim-down
git rm -r apps/HRM apps/HRM-AI apps/TPM-api apps/landing-page TPM/
# Cập nhật turbo.json / docker-compose.prod.yml / Kong routes cho khớp
grep -rn "apps/HRM-AI\|apps/HRM/\|apps/TPM-api/" docker-compose.prod.yml infrastructure/ scripts/ 2>/dev/null
```

## C3. Dọn "rác cá nhân" của tác giả trước khi brand lại

```bash
# Quét các tham chiếu cá nhân cũ:
grep -rn "rtr-control.vercel.app\|RTRobotics\|RTR@\|rtr\.com\|quocviets\|ugcjikdlyktrkqgblsrw\|MacminiVietBot" \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.sh" --include="*.json" . | grep -v node_modules

# Các vị trí chính:
#   - apps/PM/docs/TIP-Sprint-B3.md          (URL vercel + Supabase cá nhân)
#   - apps/HRM/prisma/seed*.ts                (RTR@2026, "Admin RTR")
#   - setup-liphoco.sh                        (script cá nhân — xoá hẳn)
#   - apps/OTB/azure-startup.js               (kiểm tra startup script)

# Rebrand có sẵn của dự án:
npx ts-node scripts/rebrand.ts --dry-run   # xem trước
npx ts-node scripts/rebrand.ts             # áp dụng (sửa packages/branding/src/config.ts trước)
```

## C4. Kiến trúc & yêu cầu triển khai (tham khảo khi lên hạ tầng)

**Stack:** Next.js 14 / NestJS / Vite • PostgreSQL 16 (Prisma, 980 models) • Redis 7 • NATS JetStream • Keycloak SSO • Kong Gateway • Meilisearch • Prometheus/Grafana/Loki

**Yêu cầu tối thiểu để chạy dev:**
- Node ≥ 20, npm ≥ 10, Docker Desktop
- `npm run setup` → `npm run dev` (tự lên Postgres/Redis/NATS/Keycloak/Kong qua compose)

**Prod:** `docker-compose.prod.yml` (~17 containers) hoặc Helm chart `charts/vierp` trên K8s, Terraform cho AWS/GCP/Azure trong `infrastructure/terraform/`

**Khuyến nghị hạ tầng cho fork độc lập:** bắt đầu với 1–3 app lõi (vd. Accounting + CRM + HRM-unified) + Postgres + Redis + Keycloak → đơn giản vận hành, thêm dần module theo nhu cầu. KHÔNG cần NATS/Kong/Meilisearch cho đến khi thật sự nhiều service.

---

# PHẦN D — CHECKLIST TỔNG (tick dần)

> **Cập nhật 2025-11-08 (fork/slim-down):** D1–D6 ✅ đã sửa + commit trên `main` (6 commit `fix(security)`). D7 ✅ khuyến cáo tuân thủ (script đã bị xoá ở D9). D8 ✅ branch `fork/slim-down` (gỡ HRM/HRM-AI/TPM-api/TPM, −400K dòng). D9 ✅ sạch 100% (xoá handover docs cá nhân, scrub URL, sửa claim Proprietary→MIT). D10 ✅ **ĐÃ APPLY: Linkk-ERP Platform / L-ERP** — scope `@linkk`, prefix `lerp` (755 files, commit aa8b94e).

- [x] D1. Xoá/che block bypass auth trong `apps/MRP/src/middleware.ts:200` (A1) → commit e8fee0e
- [x] D2. Gỡ `--accept-data-loss` + đóng auto-migrate trong `TPM-api-nestjs/src/main.ts` (A2) → commit e6e1f00
- [x] D3. Đổi toàn bộ password seed sang env bắt buộc (A3) — 8 vị trí → commit 04bb2ff
- [x] D4. Sanitize / thay `new Function` trong ExcelAI powerquery + pivotEngine + CalculatedFieldDialog (A4) → commit 731035e, 26/26 test pass
- [x] D5. Sửa PGPASSWORD qua env trong backup-service (A5) → commit 66f4890
- [x] D6. Dev compose: port bind 127.0.0.1 + password qua env (A6) → commit 25561ab
- [x] D7. KHÔNG chạy `setup-liphoco.sh` — đã xoá vĩnh viễn ở D9
- [x] D8. Fork: branch `fork/slim-down`, chọn module lõi, gỡ trùng lặp (C2) → commit d1d6844 (còn 13 apps)
- [x] D9. Dọn rác cá nhân: RTRobotics/rtr-control/Supabase URL (C3) → commit c7222a2 + 39d4199
- [x] D10. Rebrand → **Linkk-ERP Platform / L-ERP** đã áp dụng (755 files đổi): scope `@linkk/*`, containers `lerp-*`, DB `lerp_dev`, k8s `lerp-system`, keys `lerp_live_`, images `ghcr.io/linkk/*`, domain mặc định `linkk-erp.com`. Lock đã regenerate. Nếu đổi brand lần nữa: sửa env vars rồi chạy `npx ts-node scripts/rebrand.ts` (rule @linkk→mới cần thêm tương tự rule vierp).
- [x] D11. Giữ copyright MIT trong LICENSE khi phân phối (C0) — đã kiểm: LICENSE root nguyên vẹn; claim "Proprietary RTR" ở apps/MRP/README.md đã sửa về MIT
- [ ] D12. Trước khi mở dịch vụ: đổi password admin, xoá user demo, bật HTTPS, set NODE_ENV=production ở MỌI app — *nghĩa vụ vận hành, không thể code sẵn*
- [x] D13. `npm audit` sau install (chạy khi bạn `npm install` lần đầu trên máy dev)

---

*Report generated from static audit — clone ngày 2025-11-08, commit 40970cc. Các phát hiện có thể thay đổi khi upstream cập nhật.*
