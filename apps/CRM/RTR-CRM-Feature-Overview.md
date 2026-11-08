# L-ERP CRM — Tổng quan tính năng cho Chủ đầu tư

> **Phiên bản:** 1.0 Production Ready | **Cập nhật:** 03/03/2026
> **Tech Stack:** Next.js 14, TypeScript, PostgreSQL, Supabase Auth

---

## Thống kê dự án

| Chỉ số | Giá trị |
|--------|---------|
| Tổng file TypeScript | 322 |
| Tổng dòng code (src/) | ~21,300 LOC |
| Trang giao diện (pages) | 45 |
| API endpoints | 77 |
| Components | 59 |
| Database models | 37 |
| Custom hooks | 23 |
| Unit tests | 16 files (~189 tests) |
| E2E tests | 16 files |
| Ngôn ngữ | Tiếng Việt + English (425+ keys) |
| Prisma schema | 940 dòng |

---

## 1. Quản lý Liên hệ (Contacts)

**Mục đích:** Quản lý toàn bộ thông tin khách hàng cá nhân.

| Tính năng | Mô tả |
|-----------|--------|
| Danh sách liên hệ | Bảng dữ liệu với tìm kiếm, lọc theo trạng thái, công ty, phân trang |
| Tạo/Sửa/Xóa | Form đầy đủ: họ tên, email, SĐT, chức vụ, phòng ban, nguồn |
| Chi tiết liên hệ | Trang chi tiết với timeline hoạt động, deals liên quan, ghi chú |
| Import CSV | Upload file CSV, mapping cột tự động, xử lý batch |
| Export CSV | Xuất danh sách ra file CSV |
| Gắn tag | Hệ thống tag màu để phân loại (VIP, Hot Lead, Enterprise...) |
| Tìm kiếm tiếng Việt | Tìm kiếm không dấu (vd: "nguyen" tìm được "Nguyễn") |
| Xác thực SĐT VN | Validate định dạng số điện thoại Việt Nam (+84, 09xx...) |

**Trạng thái liên hệ:** Active, Inactive, Lead, Customer, Churned

---

## 2. Quản lý Công ty (Companies)

**Mục đích:** Quản lý thông tin doanh nghiệp đối tác/khách hàng.

| Tính năng | Mô tả |
|-----------|--------|
| Danh sách công ty | Bảng + tìm kiếm theo tên, ngành, quy mô, mã số thuế |
| Tạo/Sửa/Xóa | Form: tên, domain, ngành, quy mô, SĐT, email, website, địa chỉ, MST |
| Chi tiết công ty | Xem contacts, deals, orders thuộc công ty |
| Import/Export CSV | Nhập/xuất hàng loạt |
| Gắn tag | Phân loại công ty theo tag |

**Quy mô:** Solo, Small, Medium, Large, Enterprise

---

## 3. Pipeline & Deals (Quản lý cơ hội bán hàng)

**Mục đích:** Theo dõi toàn bộ quy trình bán hàng từ lead đến close.

| Tính năng | Mô tả |
|-----------|--------|
| Kanban Board | Kéo thả deal giữa các giai đoạn (drag & drop) |
| Pipeline tùy chỉnh | Cấu hình tên, thứ tự, màu sắc, xác suất thắng cho từng stage |
| Tạo deal | Tiêu đề, giá trị (VND), ngày dự kiến close, gắn contacts + company |
| Chi tiết deal | Timeline hoạt động, báo giá liên quan, ghi chú |
| Phân quyền | Member chỉ thấy deal của mình, Manager/Admin thấy tất cả |

**Giai đoạn mặc định:** New Lead → Qualification → Proposal → Negotiation → Closed Won / Closed Lost

---

## 4. Báo giá (Quotes)

**Mục đích:** Tạo và gửi báo giá chuyên nghiệp cho khách hàng.

| Tính năng | Mô tả |
|-----------|--------|
| Quote Builder | Thêm sản phẩm, số lượng, đơn giá, chiết khấu — tính tự động |
| Xuất PDF | Tạo PDF báo giá có logo, thông tin công ty, điều khoản |
| Gửi email | Gửi báo giá qua email trực tiếp từ hệ thống |
| Theo dõi trạng thái | Draft → Sent → Viewed → Accepted/Rejected/Expired |
| Tự động hết hạn | Kiểm tra và đánh dấu báo giá quá hạn |
| Hỗ trợ số VN | Nhập số thập phân bằng dấu phẩy (1.500.000 / 1,5) |

**Tích hợp:** Liên kết với Contact, Company, Deal, Product catalog

---

## 5. Đơn hàng (Orders)

**Mục đích:** Quản lý đơn hàng từ tạo đến giao hàng.

| Tính năng | Mô tả |
|-----------|--------|
| Tạo đơn hàng | Từ báo giá hoặc tạo mới, thêm sản phẩm |
| State Machine | Quy trình trạng thái có kiểm soát: Pending → Confirmed → In Production → Shipped → Delivered |
| Lịch sử trạng thái | Ghi lại mọi thay đổi trạng thái (ai, lúc nào, ghi chú) |
| Xuất PDF | Tạo PDF đơn hàng |
| Hủy/Hoàn tiền | Hỗ trợ Cancel, Refund với lý do |
| Tracking | Mã vận đơn, nhà vận chuyển |

---

## 6. Chiến dịch Marketing (Campaigns)

**Mục đích:** Gửi email/SMS marketing hàng loạt với tracking đầy đủ.

| Tính năng | Mô tả |
|-----------|--------|
| Tạo chiến dịch | Email, SMS, Push — soạn nội dung rich text |
| A/B Testing | Tạo nhiều variant với tỷ lệ split |
| Audience Builder | Tạo nhóm đối tượng Static hoặc Dynamic (rule-based) |
| Rule Engine | Lọc theo trạng thái, tag, ngành, quy mô, điểm score... |
| Lên lịch gửi | Đặt thời gian gửi tự động |
| Tracking | Theo dõi: Sent, Opened, Clicked, Bounced, Unsubscribed |
| Email Templates | Thư viện template có thể tái sử dụng |
| Test Send | Gửi thử trước khi phát hành chiến dịch |
| Unsubscribe | Link hủy đăng ký tự động trong mỗi email |

---

## 7. Hỗ trợ khách hàng (Support Tickets)

**Mục đích:** Hệ thống ticket hỗ trợ khách hàng với SLA.

| Tính năng | Mô tả |
|-----------|--------|
| Tạo ticket | Từ CRM hoặc từ Customer Portal |
| Mức ưu tiên | Low, Medium, High, Urgent |
| SLA Engine | Tự động tính thời gian phản hồi, thời gian giải quyết theo priority |
| Cảnh báo SLA | Đánh dấu ticket vi phạm SLA |
| Trao đổi tin nhắn | Hội thoại giữa nhân viên và khách hàng |
| Tin nhắn nội bộ | Ghi chú nội bộ không hiển thị cho khách |
| Phân công tự động | Auto-assign ticket cho nhân viên |

**Trạng thái:** Open → In Progress → Waiting Customer → Resolved → Closed

---

## 8. Customer Portal (Cổng khách hàng)

**Mục đích:** Cho phép khách hàng tự phục vụ — xem báo giá, đơn hàng, tạo ticket.

| Tính năng | Mô tả |
|-----------|--------|
| Đăng nhập Magic Link | Khách hàng nhận link đăng nhập qua email (không cần mật khẩu) |
| Xem báo giá | Khách xem và accept/reject báo giá |
| Xem đơn hàng | Theo dõi trạng thái đơn hàng |
| Tạo ticket hỗ trợ | Gửi yêu cầu hỗ trợ trực tiếp |
| Hồ sơ cá nhân | Cập nhật thông tin liên hệ |

**URL riêng:** `/portal/` — giao diện tách biệt khỏi CRM nội bộ

---

## 9. Dashboard & Analytics

**Mục đích:** Tổng quan KPI và phân tích dữ liệu kinh doanh.

| Tính năng | Mô tả |
|-----------|--------|
| KPI Cards | Tổng doanh thu, Deals active, Contacts mới, Conversion rate, Tickets mở, SLA breached |
| Pipeline Funnel | Biểu đồ phễu theo giai đoạn deal |
| Deals Over Time | Biểu đồ deal theo thời gian |
| Quotes by Status | Biểu đồ tròn trạng thái báo giá |
| Top Contacts | Xếp hạng liên hệ tương tác nhiều nhất |
| Campaign Performance | Thống kê hiệu quả chiến dịch |
| Activity by Type | Phân bổ hoạt động theo loại (Call, Email, Meeting...) |
| Date Range Filter | Lọc theo: 7 ngày, 30 ngày, 90 ngày, Năm nay, Tùy chỉnh |

---

## 10. Hoạt động (Activities)

**Mục đích:** Ghi nhận và theo dõi mọi hoạt động tương tác với khách hàng.

| Loại hoạt động | Mô tả |
|----------------|--------|
| Call | Ghi nhận cuộc gọi |
| Email | Ghi nhận email đã gửi |
| Meeting | Cuộc họp, demo |
| Task | Công việc cần làm |
| Note | Ghi chú nội bộ |
| Demo | Demo sản phẩm |
| Follow-up | Theo dõi, nhắc nhở |
| Lunch | Bữa ăn với khách hàng |

**Tính năng:** Đặt deadline, đánh dấu hoàn thành, gắn với Contact/Company/Deal, đo thời lượng

---

## 11. Quản lý Sản phẩm (Products)

**Mục đích:** Catalog sản phẩm/dịch vụ để sử dụng trong báo giá và đơn hàng.

| Tính năng | Mô tả |
|-----------|--------|
| CRUD | Tên, SKU, mô tả, đơn giá, đơn vị, danh mục |
| Trạng thái | Active/Inactive |
| Tích hợp | Dùng trong Quote Builder và Order |

---

## 12. Thông báo (Notifications)

**Mục đích:** Hệ thống thông báo real-time trong app.

| Tính năng | Mô tả |
|-----------|--------|
| In-app | Chuông thông báo trên header, badge đếm chưa đọc |
| Tùy chỉnh | User chọn nhận thông báo theo loại sự kiện |
| Email | Gửi thông báo qua email (tùy chọn) |
| Đánh dấu đã đọc | Từng cái hoặc tất cả |
| Hủy đăng ký | Link unsubscribe trong email thông báo |

---

## 13. Webhooks

**Mục đích:** Gửi event tự động đến hệ thống bên ngoài khi có thay đổi dữ liệu.

| Tính năng | Mô tả |
|-----------|--------|
| Tạo webhook | URL đích, chọn events muốn nhận, secret key |
| Events | deal.created, contact.updated, order.shipped, ticket.resolved... |
| Delivery logs | Ghi lại mọi lần gửi: status code, response, thời gian, retry |
| Test webhook | Gửi thử payload mẫu |
| Retry | Tự động retry khi thất bại |

---

## 14. Tích hợp hệ sinh thái RTR

**Mục đích:** Kết nối CRM với các module ERP khác trong hệ sinh thái RTR.

| Module | Mô tả | Port |
|--------|--------|------|
| MRP | Quản lý sản xuất | :3011 |
| OTB | Quản lý ngân sách (Open-to-Buy) | :3012 |
| HRM | Quản lý nhân sự | :3013 |
| TPM | Quản lý khuyến mại | :3014 |
| Sheets | Bảng tính thông minh | :3015 |
| Mail | Email thông minh | :3007 |

**Dashboard:** Hiển thị trạng thái kết nối (Online/Offline) của từng module

---

## 15. Cài đặt hệ thống (Settings)

| Tính năng | Mô tả |
|-----------|--------|
| Pipeline Config | Tùy chỉnh giai đoạn, thứ tự, màu sắc, xác suất |
| Team Management | Quản lý users, phân quyền RBAC |
| SLA Config | Cấu hình thời gian phản hồi/giải quyết theo priority |
| Company Info | Logo, tên, địa chỉ, SĐT — hiển thị trên PDF |
| Webhooks | Quản lý webhook endpoints |

---

## 16. Bảo mật & Phân quyền (RBAC)

| Vai trò | Quyền hạn |
|---------|-----------|
| **Admin** | Toàn quyền: CRUD tất cả, cài đặt hệ thống, quản lý team |
| **Manager** | Xem tất cả dữ liệu, tạo/sửa/xóa, quản lý campaigns |
| **Member** | Chỉ thấy dữ liệu do mình tạo, CRUD cơ bản |
| **Viewer** | Chỉ xem, không tạo/sửa/xóa |

**Bảo mật bổ sung:**
- Content Security Policy (CSP) headers
- XSS sanitization cho mọi input
- CSRF protection qua Supabase Auth
- Rate limiting cho API
- Validate file upload (chỉ CSV)
- Không lưu secrets hardcoded

---

## 17. Tính năng UI/UX nổi bật

| Tính năng | Mô tả |
|-----------|--------|
| Dark/Light Mode | Chuyển đổi giao diện tối/sáng |
| Glass-morphism | Hiệu ứng kính mờ cao cấp |
| Responsive Mobile | Sidebar overlay, bảng scroll ngang trên mobile |
| Command Palette | Ctrl+K tìm kiếm nhanh, điều hướng |
| Song ngữ VI/EN | Chuyển đổi ngôn ngữ tức thì, 425+ keys |
| Virtual Table | Bảng ảo cho dữ liệu lớn |
| Toast Notifications | Thông báo hành động (thành công, lỗi) |
| Rich Text Editor | Soạn nội dung email có định dạng |

---

## 18. Testing & Chất lượng

| Loại test | Số lượng | Công cụ |
|-----------|----------|---------|
| Unit tests | 189 tests / 16 files | Vitest |
| E2E tests | 45+ tests / 16 files | Playwright |
| TypeScript | Strict mode, 0 errors | tsc --noEmit |

**Coverage:** API routes, validation schemas, state machines, SLA engine, CSV import, event bus, webhook delivery

---

## 19. API Documentation

- **OpenAPI/Swagger spec** tự sinh tại `/api/docs/openapi`
- **Trang API Docs** tại `/api-docs` — giao diện interactive
- **77 endpoints** được document đầy đủ

---

## Tóm tắt giá trị

L-ERP CRM là hệ thống CRM **production-ready** với đầy đủ chức năng quản lý khách hàng, bán hàng, marketing, và hỗ trợ. Hệ thống được thiết kế để:

1. **Tích hợp ERP:** Sẵn sàng kết nối với 6 module RTR (MRP, OTB, HRM, TPM, Sheets, Mail)
2. **Tự phục vụ:** Customer Portal cho phép khách hàng tương tác trực tiếp
3. **Tự động hóa:** Event-driven architecture, auto-assign tickets, SLA monitoring, scheduled campaigns
4. **Mở rộng:** Webhook system, API docs, modular architecture
5. **Bản địa hóa:** Hoàn toàn song ngữ Việt-Anh, validate SĐT VN, tìm kiếm tiếng Việt không dấu
6. **Bảo mật:** RBAC 4 cấp, CSP headers, input sanitization, rate limiting
