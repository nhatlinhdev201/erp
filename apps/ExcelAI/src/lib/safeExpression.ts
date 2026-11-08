// ═══════════════════════════════════════════════════════════════════════════
// SAFE EXPRESSION EVALUATION
// Replaces raw `new Function(expr)` calls that allowed arbitrary JavaScript
// execution from user-supplied formulas.
//
// Strategy:
//  1. Extract double-quoted string literals first (their content is inert
//     once quotes are balanced and control chars are absent).
//  2. Everything OUTSIDE string literals must be only numbers,
//     arithmetic/comparison operators, parentheses, and whitespace.
//     No identifiers, function calls, member access, or template literals —
//     so injected code cannot execute.
// ═══════════════════════════════════════════════════════════════════════════

/** Allowed outside string literals: digits, operators, parens, quotes, space */
const OUTSIDE_STRING = /^[0-9+\-*/%.()<>=!&|"\s]*$/;

/** Numeric-only expression (no quotes at all) */
const NUMERIC_ONLY = /^[0-9+\-*/%.()<>=!&|\s]*$/;

/** Matches a complete, balanced double-quoted literal (with escapes) */
const STRING_LITERAL = /"(?:[^"\\\r\n]|\\.)*"/g;

/**
 * Escape a raw string value so it is safe to embed inside double quotes
 * in an expression (blocks quote-breakout injection).
 */
export function escapeForExprString(v: string): string {
  // Reject values containing control chars / line breaks outright
  if (/[\r\n\u0000-\u001f]/.test(v)) return '';
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Validate that an expression contains only safe characters/operators.
 * @param expr the expression AFTER all field references have been substituted
 * @param allowStrings permit double-quoted string literals (default true)
 */
export function isSafeExpression(expr: string, allowStrings = true): boolean {
  if (expr.length > 500) return false;

  if (!allowStrings) {
    return NUMERIC_ONLY.test(expr) && /[0-9()]/.test(expr);
  }

  // Extract string literals; validate the remainder without them
  const literals = expr.match(STRING_LITERAL);
  if (literals) {
    // Control characters must never appear inside literals
    if (literals.some((s) => /[\u0000-\u001f]/.test(s))) return false;
  }
  const remainder = expr.replace(STRING_LITERAL, '""');
  if (!OUTSIDE_STRING.test(remainder)) return false;

  // Must contain at least one number, literal, or grouping paren
  return /[0-9"()]/.test(expr);
}

/**
 * Safely evaluate an arithmetic/string-concat expression.
 * Returns `fallback` when the expression is unsafe or fails to evaluate.
 * Field references must already be substituted to numbers/strings.
 */
export function safeEvaluate<T>(expr: string, fallback: T): T {
  if (!isSafeExpression(expr)) return fallback;
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr});`)();
    if (
      typeof result === 'number' ||
      typeof result === 'string' ||
      typeof result === 'boolean'
    ) {
      return result as unknown as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
