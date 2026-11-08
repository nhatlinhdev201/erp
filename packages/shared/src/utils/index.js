// ============================================================
// @linkk/shared - Utility Functions
// ============================================================
// ==================== API Response Helpers ====================
export function successResponse(data, meta) {
    return { success: true, data, meta };
}
export function errorResponse(code, message, details) {
    return { success: false, error: { code, message, details } };
}
export function paginationMeta(page, pageSize, total) {
    return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
// ==================== Event Helpers ====================
export function createEvent(type, source, data, context) {
    return {
        id: generateId(),
        type,
        source,
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId,
        userId: context.userId,
        data,
    };
}
// ==================== ID Generation ====================
export function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
export function generateCode(prefix, sequence, padLength = 6) {
    return `${prefix}-${String(sequence).padStart(padLength, '0')}`;
}
// ==================== Tier Helpers ====================
export function isTierAllowed(requiredTiers, userTier) {
    return requiredTiers.includes(userTier);
}
export function getTierLevel(tier) {
    const levels = { basic: 0, pro: 1, enterprise: 2 };
    return levels[tier];
}
export function isAtLeastTier(userTier, requiredTier) {
    return getTierLevel(userTier) >= getTierLevel(requiredTier);
}
// ==================== Formatting ====================
export function formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
export function formatDate(date, locale = 'vi-VN') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}
export function formatNumber(num, locale = 'vi-VN') {
    return new Intl.NumberFormat(locale).format(num);
}
// ==================== Validation ====================
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isValidTaxCode(taxCode) {
    // Vietnam tax code: 10 or 13 digits
    return /^\d{10}(\d{3})?$/.test(taxCode);
}
export function isValidPhone(phone) {
    // Vietnam phone: starts with 0, 10-11 digits
    return /^0\d{9,10}$/.test(phone);
}
// ==================== String Helpers ====================
export function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
export function truncate(text, maxLength, suffix = '...') {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}
//# sourceMappingURL=index.js.map