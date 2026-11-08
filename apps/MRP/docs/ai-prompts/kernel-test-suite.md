# AI Kernel Test Suite
# Kiểm chứng năng lực AI sau khi áp dụng L-ERP MRP Kernel

## Test Categories

### 1. Context Awareness (5 tests)
### 2. Code Standards (5 tests)
### 3. Domain Knowledge (5 tests)
### 4. Security Awareness (5 tests)
### 5. Architecture Knowledge (5 tests)

---

## Scoring

- **PASS**: Response đúng và đầy đủ
- **PARTIAL**: Response đúng nhưng thiếu chi tiết
- **FAIL**: Response sai hoặc không liên quan

**Target: 80%+ PASS rate**

---

## Test Execution Instructions

Chạy từng test question và đánh giá response:

```bash
cd /Users/mac/AnhQuocLuong/lerp-mrp
claude "[TEST QUESTION]"
```

Ghi lại kết quả vào bảng scoring.
