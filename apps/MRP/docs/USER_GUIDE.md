# L-ERP MRP - Huong Dan Su Dung

## Muc Luc

1. [Dang nhap](#1-dang-nhap)
2. [Quan ly Parts](#2-quan-ly-parts)
3. [Quan ly BOM](#3-quan-ly-bom)
4. [Work Orders](#4-work-orders)
5. [Quality Module](#5-quality-module)
6. [Discussions](#6-discussions)
7. [Mobile App](#7-mobile-app)

---

## 1. Dang Nhap

### Buoc 1: Truy cap he thong
- Mo trinh duyet va vao: https://mrp.your-domain.com

### Buoc 2: Nhap thong tin
- Email: [email da duoc cap]
- Password: [mat khau da duoc cap]

### Buoc 3: Nhan "Dang nhap"

---

## 2. Quan Ly Parts

### 2.1 Xem danh sach Parts
1. Click menu **Parts** o sidebar
2. Danh sach parts hien thi dang bang
3. Su dung **Search** de tim kiem
4. Su dung **Filter** de loc theo loai

### 2.2 Tao Part moi
1. Click nut **+ Tao Part**
2. Dien thong tin:
   - Part Number (bat buoc)
   - Ten (bat buoc)
   - Loai (Finished Good, Raw Material, etc.)
   - Gia
   - Mo ta
3. Click **Luu**

### 2.3 Chinh sua Part
1. Click vao row Part can sua
2. Click **Edit**
3. Cap nhat thong tin
4. Click **Luu**

### 2.4 Import tu Excel
1. Click **Import**
2. Tai template Excel
3. Dien data vao template
4. Upload file
5. Review va confirm

---

## 3. Quan Ly BOM

### 3.1 Tao BOM moi
1. Click menu **BOM**
2. Click **+ Tao BOM**
3. Nhap thong tin header:
   - BOM Number
   - Product Name
   - Revision
4. Them components:
   - Click **+ Them dong**
   - Chon Part
   - Nhap so luong
5. Click **Luu**

### 3.2 Xem chi phi BOM
- Total cost duoc tinh tu dong
- Xem breakdown theo component

### 3.3 Export BOM
- Click **Export Excel** hoac **Export PDF**

---

## 4. Work Orders

### 4.1 Tao Work Order
1. Click menu **Production**
2. Click **+ Tao WO**
3. Chon Product (tu BOM)
4. Nhap so luong
5. Chon ngay due date
6. Click **Tao**

### 4.2 Cap nhat tien do
1. Click vao Work Order
2. Click **Start** de bat dau
3. Cap nhat % hoan thanh
4. Click **Complete** khi xong

### 4.3 Work Order Status Flow
```
Draft -> Released -> In Progress -> Completed
                  -> On Hold ->
```

---

## 5. Quality Module

### 5.1 Tao NCR (Non-Conformance Report)
1. Click menu **Quality** -> **NCR**
2. Click **+ Tao NCR**
3. Dien thong tin:
   - Tieu de
   - Mo ta van de
   - Severity (Critical/Major/Minor)
   - Source (Receiving/In-Process/Final)
4. Click **Tao**

### 5.2 Tao CAPA
1. Tu NCR, click **Create CAPA**
2. Hoac vao **Quality** -> **CAPA** -> **+ Tao**
3. Dien:
   - Root Cause Analysis
   - Corrective Action
   - Preventive Action
   - Due date
4. Assign cho nguoi phu trach
5. Track tien do

### 5.3 Inspection Flow
```
Receiving Inspection -> In-Process Inspection -> Final Inspection -> Certificate
```

### 5.4 Tao Certificate (COC)
1. Sau khi Final Inspection Pass
2. Click **Generate COC**
3. Review va approve
4. Download PDF

---

## 6. Discussions

### 6.1 Tham gia thao luan
1. Mo bat ky entity (Part, BOM, WO...)
2. Click tab **Discussions**
3. Go message
4. Click **Gui**

### 6.2 @Mention nguoi khac
1. Go **@** trong message
2. Chon user tu dropdown
3. User se nhan notification

### 6.3 Dinh kem
- **Screenshot:** Click icon camera
- **File:** Click icon paperclip
- **Entity Link:** Click icon link

---

## 7. Mobile App

### 7.1 Truy cap tren dien thoai
- Mo browser va vao URL nhu binh thuong
- Giao dien tu dong responsive

### 7.2 Bottom Navigation
- **Home:** Dashboard
- **Orders:** Sales Orders
- **Inventory:** Stock levels
- **Production:** Work Orders
- **More:** Cac module khac

### 7.3 Chuyen doi Table/Card view
- Tren mobile, data hien thi dang Cards
- Click toggle de chuyen ve Table view

---

## Ho Tro

Lien he khi can ho tro:
- Email: support@your-domain.com

---

*Tai lieu cap nhat: 2026-01-17*
