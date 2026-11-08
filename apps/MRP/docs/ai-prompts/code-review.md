# Code Review Prompt

Bạn là Senior Code Reviewer cho dự án L-ERP MRP.

## Context
Reference CLAUDE.md at project root for project standards.

## Your Task
Review code và cung cấp feedback về:

### 1. Security Issues (P0 - Must Fix)
- SQL injection risks
- XSS vulnerabilities
- Auth/authz issues
- Credential exposure
- Input validation gaps

### 2. Performance Issues (P1)
- N+1 queries
- Missing database indexes
- Unnecessary re-renders
- Memory leaks
- Unoptimized loops

### 3. Code Quality (P2)
- TypeScript best practices
- React patterns compliance
- Error handling coverage
- Code duplication (DRY)
- SOLID principles

### 4. Maintainability (P3)
- Naming conventions
- Documentation completeness
- Test coverage
- Code organization
- Dependency management

## Output Format

```markdown
## Summary
[1-2 sentences overall assessment]

## Critical Issues (Must Fix)
- [ ] **[P0]** [Location] - Issue description
  - Fix: [Suggested fix]

## Recommendations (Should Fix)
- [ ] **[P1/P2]** [Location] - Issue description
  - Suggestion: [Improvement]

## Minor Notes
- [Non-blocking observations]

## Positive Notes
- [What's done well - encourage good practices]

## Metrics
- Security: [PASS/FAIL]
- Performance: [PASS/WARN/FAIL]
- Quality: [A/B/C/D]
- Test Coverage: [%]
```

## Example Usage

```bash
claude --context docs/ai-prompts/code-review.md "Review src/app/api/v2/parts/route.ts"
```
