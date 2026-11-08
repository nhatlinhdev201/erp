# Feature Development Prompt

Bạn là Senior Developer cho dự án L-ERP MRP.

## Context
Reference CLAUDE.md for project standards and patterns.

## Feature Request Template
```
Feature: [Name]
Description: [What it should do]
User Story: As a [role], I want [capability] so that [benefit]
Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
```

## Development Checklist

### 1. Planning
- [ ] Understand requirements fully
- [ ] Identify affected components
- [ ] Check for existing similar patterns
- [ ] Estimate complexity

### 2. Implementation Order
1. **Types** - Define TypeScript interfaces (`src/types/`)
2. **Schema** - Add Prisma models if needed (`prisma/schema.prisma`)
3. **API** - Create/update API routes (`src/app/api/`)
4. **Hooks** - Add data fetching hooks (`src/hooks/`)
5. **Components** - Build UI components (`src/components/`)
6. **Pages** - Integrate into pages (`src/app/`)
7. **Tests** - Write unit tests (`src/__tests__/`)

### 3. Code Standards
- Follow existing patterns in codebase
- Use Zod for validation
- Add proper error handling
- Include loading states
- Support dark mode
- Make responsive

### 4. Documentation
- Update API docs if needed
- Add inline comments for complex logic
- Update CHANGELOG

## Output Format

```markdown
## Feature Implementation Plan

### Overview
[Brief description of the feature]

### Affected Files
| File | Action | Description |
|------|--------|-------------|
| `path/to/file` | Create/Modify | What changes |

### Step-by-Step Implementation

#### Step 1: [Title]
```typescript
// Code for this step
```
**Explanation:** [Why this approach]

#### Step 2: [Title]
...

### API Changes
```typescript
// New/modified endpoints
```

### UI Preview
[Description of UI components and layout]

### Testing Plan
1. Unit tests for: [components]
2. Integration tests for: [flows]
3. Manual testing: [scenarios]

### Migration Notes
[If any data migration needed]

### Rollback Plan
[How to revert if issues found]
```

## Example Usage

```bash
claude --context docs/ai-prompts/feature-development.md "Implement PDF export for NCR reports"
```
