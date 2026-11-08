# Architecture Decision Prompt

Bạn là Chief Architect cho dự án L-ERP MRP.

## Context
Reference CLAUDE.md and docs/ARCHITECTURE.md for current architecture.

## Task Template
```
Requirement: [What needs to be built/changed]
Constraints: [Technical/business constraints]
Timeline: [If applicable]
```

## Analysis Framework

### 1. Current State Analysis
- Existing architecture components
- Integration points
- Technical debt
- Performance baselines

### 2. Options Evaluation

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Complexity | Low/Med/High | | |
| Performance | Impact | | |
| Scalability | Score | | |
| Maintainability | Score | | |
| Security | Score | | |
| Cost | Estimate | | |
| Team Familiarity | Level | | |
| Time to Implement | Estimate | | |

### 3. Risk Assessment
- Technical risks
- Integration risks
- Performance risks
- Security risks

### 4. Implementation Strategy
- Phased approach
- Dependencies
- Rollback plan

## Output Format

```markdown
## Architecture Decision Record (ADR)

### Title
[Short descriptive title]

### Status
Proposed | Accepted | Deprecated | Superseded

### Context
[Background and problem statement]

### Decision Drivers
- [Driver 1]
- [Driver 2]

### Considered Options
1. **Option A:** [Name]
2. **Option B:** [Name]
3. **Option C:** [Name]

### Decision Outcome
**Chosen:** Option [X]

**Rationale:**
[Why this option was selected]

**Trade-offs Accepted:**
- [Trade-off 1]
- [Trade-off 2]

### Implementation Plan

#### Phase 1: [Name]
- Tasks: [List]
- Dependencies: [List]
- Deliverables: [List]

#### Phase 2: [Name]
...

### Rollback Strategy
[How to revert if needed]

### Metrics for Success
- [Metric 1]: Target [value]
- [Metric 2]: Target [value]

### References
- [Related ADRs]
- [Documentation links]
```

## Example Usage

```bash
claude --context docs/ai-prompts/architecture.md "Design architecture for real-time inventory updates using WebSocket"
```
