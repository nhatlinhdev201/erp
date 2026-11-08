// ============================================================
// @linkk/branding — UI Labels Song ngữ Vi-En
// ============================================================
//
// Quy ước hiển thị: "Tiếng Việt / English"
// Convention: "Vietnamese / English"
//
// Doanh nghiệp có thể override bằng cách gọi setUILabels()
// Businesses can override by calling setUILabels()
// ============================================================

import { getBrand } from './config';

export type Locale = 'vi' | 'en' | 'vi-en';

export interface UILabels {
  // ─── Navigation / Điều hướng ───────────────────────
  nav: {
    dashboard: string;
    home: string;
    settings: string;
    profile: string;
    logout: string;
    search: string;
    notifications: string;
    help: string;
  };

  // ─── Modules / Phân hệ ────────────────────────────
  modules: {
    hrm: string;
    crm: string;
    mrp: string;
    accounting: string;
    ecommerce: string;
    tpm: string;
    otb: string;
    pm: string;
    excelai: string;
    docs: string;
    admin: string;
  };

  // ─── Common Actions / Hành động chung ──────────────
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    print: string;
    refresh: string;
    back: string;
    next: string;
    submit: string;
    approve: string;
    reject: string;
    close: string;
    upload: string;
    download: string;
    copy: string;
    view: string;
    detail: string;
  };

  // ─── Common Labels / Nhãn chung ────────────────────
  labels: {
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    date: string;
    amount: string;
    quantity: string;
    price: string;
    total: string;
    subtotal: string;
    tax: string;
    discount: string;
    description: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    active: string;
    inactive: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    loading: string;
    noData: string;
    error: string;
    success: string;
    warning: string;
  };

  // ─── HRM / Nhân sự ────────────────────────────────
  hrm: {
    employee: string;
    employees: string;
    department: string;
    position: string;
    salary: string;
    payroll: string;
    attendance: string;
    leave: string;
    contract: string;
    recruitment: string;
    kpi: string;
    onboarding: string;
    offboarding: string;
  };

  // ─── CRM / Khách hàng ─────────────────────────────
  crm: {
    customer: string;
    customers: string;
    contact: string;
    company: string;
    deal: string;
    pipeline: string;
    quote: string;
    order: string;
    campaign: string;
    ticket: string;
    activity: string;
  };

  // ─── Accounting / Kế toán ──────────────────────────
  accounting: {
    account: string;
    journal: string;
    invoice: string;
    payment: string;
    receipt: string;
    budget: string;
    period: string;
    reconciliation: string;
    taxReturn: string;
    report: string;
    debit: string;
    credit: string;
    balance: string;
  };

  // ─── E-commerce / Thương mại điện tử ──────────────
  ecommerce: {
    product: string;
    category: string;
    cart: string;
    checkout: string;
    shipping: string;
    paymentMethod: string;
    orderStatus: string;
    storefront: string;
    promotion: string;
    review: string;
  };

  // ─── MRP / Sản xuất ───────────────────────────────
  mrp: {
    bom: string;
    workOrder: string;
    production: string;
    inventory: string;
    warehouse: string;
    supplier: string;
    purchaseOrder: string;
    quality: string;
    capacity: string;
    scheduling: string;
  };

  // ─── Auth / Xác thực ──────────────────────────────
  auth: {
    login: string;
    register: string;
    forgotPassword: string;
    resetPassword: string;
    changePassword: string;
    twoFactor: string;
    role: string;
    permission: string;
  };

  // ─── Messages / Thông báo ──────────────────────────
  messages: {
    saveSuccess: string;
    saveFailed: string;
    deleteConfirm: string;
    deleteSuccess: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
    networkError: string;
    validationError: string;
    sessionExpired: string;
  };

  // ─── Page Titles / Tiêu đề trang ──────────────────
  pages: {
    loginTitle: string;
    dashboardTitle: string;
    settingsTitle: string;
    profileTitle: string;
    notFoundTitle: string;
  };
}

// ─── Default: Song ngữ Vi-En ─────────────────────────────────

function biLabel(vi: string, en: string): string {
  return `${vi} / ${en}`;
}

export function createBilingualLabels(): UILabels {
  const brand = getBrand();
  return {
    nav: {
      dashboard: biLabel('Tổng quan', 'Dashboard'),
      home: biLabel('Trang chủ', 'Home'),
      settings: biLabel('Cài đặt', 'Settings'),
      profile: biLabel('Hồ sơ', 'Profile'),
      logout: biLabel('Đăng xuất', 'Logout'),
      search: biLabel('Tìm kiếm', 'Search'),
      notifications: biLabel('Thông báo', 'Notifications'),
      help: biLabel('Trợ giúp', 'Help'),
    },

    modules: {
      hrm: biLabel('Nhân sự', 'Human Resources'),
      crm: biLabel('Khách hàng', 'CRM'),
      mrp: biLabel('Sản xuất', 'Manufacturing'),
      accounting: biLabel('Kế toán', 'Accounting'),
      ecommerce: biLabel('Thương mại điện tử', 'E-commerce'),
      tpm: biLabel('Khuyến mãi thương mại', 'Trade Promotions'),
      otb: biLabel('Ngân sách mua hàng', 'Open-To-Buy'),
      pm: biLabel('Quản lý dự án', 'Project Management'),
      excelai: biLabel('Bảng tính AI', 'AI Spreadsheet'),
      docs: biLabel('Tài liệu', 'Documentation'),
      admin: biLabel('Quản trị hệ thống', 'System Admin'),
    },

    actions: {
      create: biLabel('Tạo mới', 'Create'),
      edit: biLabel('Chỉnh sửa', 'Edit'),
      delete: biLabel('Xóa', 'Delete'),
      save: biLabel('Lưu', 'Save'),
      cancel: biLabel('Hủy', 'Cancel'),
      confirm: biLabel('Xác nhận', 'Confirm'),
      search: biLabel('Tìm kiếm', 'Search'),
      filter: biLabel('Lọc', 'Filter'),
      export: biLabel('Xuất', 'Export'),
      import: biLabel('Nhập', 'Import'),
      print: biLabel('In', 'Print'),
      refresh: biLabel('Làm mới', 'Refresh'),
      back: biLabel('Quay lại', 'Back'),
      next: biLabel('Tiếp theo', 'Next'),
      submit: biLabel('Gửi', 'Submit'),
      approve: biLabel('Duyệt', 'Approve'),
      reject: biLabel('Từ chối', 'Reject'),
      close: biLabel('Đóng', 'Close'),
      upload: biLabel('Tải lên', 'Upload'),
      download: biLabel('Tải xuống', 'Download'),
      copy: biLabel('Sao chép', 'Copy'),
      view: biLabel('Xem', 'View'),
      detail: biLabel('Chi tiết', 'Detail'),
    },

    labels: {
      name: biLabel('Tên', 'Name'),
      email: 'Email',
      phone: biLabel('Điện thoại', 'Phone'),
      address: biLabel('Địa chỉ', 'Address'),
      status: biLabel('Trạng thái', 'Status'),
      date: biLabel('Ngày', 'Date'),
      amount: biLabel('Số tiền', 'Amount'),
      quantity: biLabel('Số lượng', 'Quantity'),
      price: biLabel('Đơn giá', 'Price'),
      total: biLabel('Tổng cộng', 'Total'),
      subtotal: biLabel('Tạm tính', 'Subtotal'),
      tax: biLabel('Thuế', 'Tax'),
      discount: biLabel('Giảm giá', 'Discount'),
      description: biLabel('Mô tả', 'Description'),
      notes: biLabel('Ghi chú', 'Notes'),
      createdAt: biLabel('Ngày tạo', 'Created At'),
      updatedAt: biLabel('Ngày cập nhật', 'Updated At'),
      createdBy: biLabel('Người tạo', 'Created By'),
      active: biLabel('Hoạt động', 'Active'),
      inactive: biLabel('Ngừng hoạt động', 'Inactive'),
      all: biLabel('Tất cả', 'All'),
      none: biLabel('Không có', 'None'),
      yes: biLabel('Có', 'Yes'),
      no: biLabel('Không', 'No'),
      loading: biLabel('Đang tải...', 'Loading...'),
      noData: biLabel('Không có dữ liệu', 'No data'),
      error: biLabel('Lỗi', 'Error'),
      success: biLabel('Thành công', 'Success'),
      warning: biLabel('Cảnh báo', 'Warning'),
    },

    hrm: {
      employee: biLabel('Nhân viên', 'Employee'),
      employees: biLabel('Danh sách nhân viên', 'Employees'),
      department: biLabel('Phòng ban', 'Department'),
      position: biLabel('Chức vụ', 'Position'),
      salary: biLabel('Lương', 'Salary'),
      payroll: biLabel('Bảng lương', 'Payroll'),
      attendance: biLabel('Chấm công', 'Attendance'),
      leave: biLabel('Nghỉ phép', 'Leave'),
      contract: biLabel('Hợp đồng', 'Contract'),
      recruitment: biLabel('Tuyển dụng', 'Recruitment'),
      kpi: biLabel('Đánh giá KPI', 'KPI Review'),
      onboarding: biLabel('Tiếp nhận', 'Onboarding'),
      offboarding: biLabel('Nghỉ việc', 'Offboarding'),
    },

    crm: {
      customer: biLabel('Khách hàng', 'Customer'),
      customers: biLabel('Danh sách khách hàng', 'Customers'),
      contact: biLabel('Liên hệ', 'Contact'),
      company: biLabel('Công ty', 'Company'),
      deal: biLabel('Cơ hội', 'Deal'),
      pipeline: biLabel('Phễu bán hàng', 'Pipeline'),
      quote: biLabel('Báo giá', 'Quote'),
      order: biLabel('Đơn hàng', 'Order'),
      campaign: biLabel('Chiến dịch', 'Campaign'),
      ticket: biLabel('Phiếu hỗ trợ', 'Support Ticket'),
      activity: biLabel('Hoạt động', 'Activity'),
    },

    accounting: {
      account: biLabel('Tài khoản', 'Account'),
      journal: biLabel('Bút toán', 'Journal Entry'),
      invoice: biLabel('Hóa đơn', 'Invoice'),
      payment: biLabel('Thanh toán', 'Payment'),
      receipt: biLabel('Phiếu thu', 'Receipt'),
      budget: biLabel('Ngân sách', 'Budget'),
      period: biLabel('Kỳ kế toán', 'Fiscal Period'),
      reconciliation: biLabel('Đối chiếu ngân hàng', 'Bank Reconciliation'),
      taxReturn: biLabel('Tờ khai thuế', 'Tax Return'),
      report: biLabel('Báo cáo', 'Report'),
      debit: biLabel('Nợ', 'Debit'),
      credit: biLabel('Có', 'Credit'),
      balance: biLabel('Số dư', 'Balance'),
    },

    ecommerce: {
      product: biLabel('Sản phẩm', 'Product'),
      category: biLabel('Danh mục', 'Category'),
      cart: biLabel('Giỏ hàng', 'Cart'),
      checkout: biLabel('Thanh toán', 'Checkout'),
      shipping: biLabel('Vận chuyển', 'Shipping'),
      paymentMethod: biLabel('Phương thức thanh toán', 'Payment Method'),
      orderStatus: biLabel('Trạng thái đơn hàng', 'Order Status'),
      storefront: biLabel('Cửa hàng', 'Storefront'),
      promotion: biLabel('Khuyến mãi', 'Promotion'),
      review: biLabel('Đánh giá', 'Review'),
    },

    mrp: {
      bom: biLabel('Định mức nguyên vật liệu', 'Bill of Materials'),
      workOrder: biLabel('Lệnh sản xuất', 'Work Order'),
      production: biLabel('Sản xuất', 'Production'),
      inventory: biLabel('Tồn kho', 'Inventory'),
      warehouse: biLabel('Kho', 'Warehouse'),
      supplier: biLabel('Nhà cung cấp', 'Supplier'),
      purchaseOrder: biLabel('Đơn mua hàng', 'Purchase Order'),
      quality: biLabel('Chất lượng', 'Quality'),
      capacity: biLabel('Năng lực sản xuất', 'Capacity'),
      scheduling: biLabel('Lịch sản xuất', 'Scheduling'),
    },

    auth: {
      login: biLabel('Đăng nhập', 'Login'),
      register: biLabel('Đăng ký', 'Register'),
      forgotPassword: biLabel('Quên mật khẩu', 'Forgot Password'),
      resetPassword: biLabel('Đặt lại mật khẩu', 'Reset Password'),
      changePassword: biLabel('Đổi mật khẩu', 'Change Password'),
      twoFactor: biLabel('Xác thực 2 bước', 'Two-Factor Auth'),
      role: biLabel('Vai trò', 'Role'),
      permission: biLabel('Quyền hạn', 'Permission'),
    },

    messages: {
      saveSuccess: biLabel('Lưu thành công!', 'Saved successfully!'),
      saveFailed: biLabel('Lưu thất bại. Vui lòng thử lại.', 'Save failed. Please try again.'),
      deleteConfirm: biLabel('Bạn có chắc muốn xóa?', 'Are you sure you want to delete?'),
      deleteSuccess: biLabel('Đã xóa thành công!', 'Deleted successfully!'),
      unauthorized: biLabel('Bạn không có quyền truy cập.', 'You are not authorized.'),
      notFound: biLabel('Không tìm thấy.', 'Not found.'),
      serverError: biLabel('Lỗi hệ thống. Vui lòng thử lại sau.', 'Server error. Please try again later.'),
      networkError: biLabel('Lỗi kết nối mạng.', 'Network error.'),
      validationError: biLabel('Dữ liệu không hợp lệ.', 'Validation error.'),
      sessionExpired: biLabel('Phiên đăng nhập đã hết hạn.', 'Session expired.'),
    },

    pages: {
      loginTitle: `${brand.platform.shortName} — ${biLabel('Đăng nhập', 'Login')}`,
      dashboardTitle: `${brand.platform.shortName} — ${biLabel('Tổng quan', 'Dashboard')}`,
      settingsTitle: `${brand.platform.shortName} — ${biLabel('Cài đặt', 'Settings')}`,
      profileTitle: `${brand.platform.shortName} — ${biLabel('Hồ sơ', 'Profile')}`,
      notFoundTitle: `${brand.platform.shortName} — ${biLabel('Không tìm thấy', '404 Not Found')}`,
    },
  };
}

// ─── Single language labels ──────────────────────────────────

export function createViLabels(): UILabels {
  const bi = createBilingualLabels();
  return mapLabels(bi, label => label.split(' / ')[0] || label);
}

export function createEnLabels(): UILabels {
  const bi = createBilingualLabels();
  return mapLabels(bi, label => label.split(' / ').pop() || label);
}

function mapLabels(obj: any, fn: (s: string) => string): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      result[key] = fn(obj[key]);
    } else if (typeof obj[key] === 'object') {
      result[key] = mapLabels(obj[key], fn);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// ─── Singleton with locale switching ─────────────────────────

let _locale: Locale = 'vi-en';
let _labels: UILabels | null = null;

export function setLocale(locale: Locale): void {
  _locale = locale;
  _labels = null; // Force rebuild
}

export function getLocale(): Locale {
  return _locale;
}

export function getLabels(): UILabels {
  if (!_labels) {
    switch (_locale) {
      case 'vi': _labels = createViLabels(); break;
      case 'en': _labels = createEnLabels(); break;
      case 'vi-en': default: _labels = createBilingualLabels(); break;
    }
  }
  return _labels;
}
