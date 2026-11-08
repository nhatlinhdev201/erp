# 🔧 HƯỚNG DẪN TRIỂN KHAI AI KERNEL CHO CLAUDE CODE

## Mục đích

Tài liệu này hướng dẫn cách tích hợp L-ERP MRP AI Kernel vào workflow với Claude Code, đảm bảo mọi AI instance đều tuân theo cùng một nguồn sự thật.

---

## 1. CẤU TRÚC FILES

```
lerp-mrp/
├── CLAUDE.md                              # ← Claude Code đọc file này tự động
├── docs/
│   ├── RTR_MRP_AI_KERNEL_MASTER_PROMPT.md # ← Master prompt đầy đủ
│   ├── ai-prompts/
│   │   ├── code-review.md                 # ← Prompt cho code review
│   │   ├── architecture.md                # ← Prompt cho architecture decisions
│   │   ├── debugging.md                   # ← Prompt cho debugging
│   │   └── documentation.md               # ← Prompt cho documentation
│   └── ...
└── ...
```

---

## 2. CÁCH SỬ DỤNG

### 2.1 Với Claude Code CLI

```bash
# Claude Code tự động đọc CLAUDE.md ở root
claude "Thêm tính năng export PDF cho báo cáo NCR"

# Hoặc reference master prompt trực tiếp
claude --context docs/RTR_MRP_AI_KERNEL_MASTER_PROMPT.md "Review kiến trúc của module MRP"
```

### 2.2 Với Claude.ai Web

Copy nội dung CLAUDE.md hoặc Master Prompt vào đầu conversation:

```
[Paste CLAUDE.md content here]

---

Yêu cầu: Thêm tính năng export PDF cho báo cáo NCR
```

### 2.3 Với API Integration

```typescript
// lib/ai/system-prompts.ts
import { readFileSync } from 'fs';
import path from 'path';

export function getSystemPrompt(type: 'full' | 'concise' = 'concise') {
  const filename = type === 'full' 
    ? 'RTR_MRP_AI_KERNEL_MASTER_PROMPT.md'
    : 'CLAUDE.md';
    
  const promptPath = type === 'full'
    ? path.join(process.cwd(), 'docs', filename)
    : path.join(process.cwd(), filename);
    
  return readFileSync(promptPath, 'utf-8');
}

// Usage in API
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: getSystemPrompt('concise'),
  messages: [{ role: 'user', content: userMessage }],
});
```

---

## 3. TASK-SPECIFIC PROMPTS

### 3.1 Code Review Prompt

```markdown
# Code Review Task

Bạn là Senior Code Reviewer cho dự án L-ERP MRP.

## Context
[Reference CLAUDE.md for project standards]

## Your Task
Review code sau và cung cấp feedback về:

1. **Security Issues** (P0)
   - SQL injection risks
   - XSS vulnerabilities
   - Auth/authz issues
   - Data exposure

2. **Performance Issues** (P1)
   - N+1 queries
   - Missing indexes
   - Unnecessary re-renders
   - Memory leaks

3. **Code Quality** (P2)
   - TypeScript best practices
   - React patterns
   - Error handling
   - Code duplication

4. **Maintainability** (P3)
   - Naming conventions
   - Documentation
   - Test coverage
   - Code organization

## Output Format
```
## Summary
[1-2 sentences overall assessment]

## Critical Issues (Must Fix)
- [Issue with location and fix suggestion]

## Recommendations
- [Non-critical improvements]

## Positive Notes
- [What's done well]
```
```

### 3.2 Architecture Decision Prompt

```markdown
# Architecture Decision Task

Bạn là Chief Architect cho dự án L-ERP MRP.

## Context
[Reference CLAUDE.md for tech stack]

## Your Task
Evaluate và recommend architecture cho yêu cầu:

[USER REQUIREMENT HERE]

## Analysis Framework

1. **Current State**
   - Existing architecture
   - Constraints
   - Technical debt

2. **Options Analysis**
   | Option | Pros | Cons | Effort | Risk |
   |--------|------|------|--------|------|
   | A      |      |      |        |      |
   | B      |      |      |        |      |

3. **Recommendation**
   - Selected option
   - Justification
   - Trade-offs accepted

4. **Implementation Plan**
   - Phase breakdown
   - Dependencies
   - Rollback strategy

## Output
Structured recommendation following the framework above.
```

### 3.3 Debugging Prompt

```markdown
# Debugging Task

Bạn là Senior Debugger cho dự án L-ERP MRP.

## Context
[Reference CLAUDE.md for project structure]

## Error Information
```
[ERROR MESSAGE / STACK TRACE]
```

## Your Task
1. Analyze error và identify root cause
2. Propose fix với explanation
3. Suggest prevention measures

## Analysis Process
1. Parse error message
2. Identify error type (syntax, runtime, logic)
3. Locate source (file, line, function)
4. Trace data flow
5. Form hypothesis
6. Propose fix

## Output Format
```
## Error Analysis
[What the error means]

## Root Cause
[Why it happened]

## Fix
```typescript
// Code fix
```

## Prevention
[How to prevent similar issues]
```
```

### 3.4 Documentation Prompt

```markdown
# Documentation Task

Bạn là Technical Writer cho dự án L-ERP MRP.

## Context
[Reference CLAUDE.md for project context]

## Your Task
Tạo documentation cho:

[FEATURE/MODULE TO DOCUMENT]

## Documentation Standards
1. **Structure**
   - Overview
   - Installation/Setup
   - Usage
   - API Reference
   - Examples
   - Troubleshooting

2. **Style**
   - Clear, concise language
   - Code examples for all features
   - No marketing fluff
   - Practical focus

3. **Format**
   - Markdown
   - Proper headings hierarchy
   - Fenced code blocks with language
   - Tables for comparisons

## Output
Complete documentation following standards above.
```

---

## 4. WORKFLOW INTEGRATION

### 4.1 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Run AI code review on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -n "$STAGED_FILES" ]; then
  echo "Running AI code review..."
  claude --context CLAUDE.md "Review these files for issues: $STAGED_FILES"
fi
```

### 4.2 PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## AI Review
<!-- Claude Code review results -->
```

### 4.3 CI/CD Integration

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Get changed files
        id: changed
        run: |
          echo "files=$(git diff --name-only origin/main)" >> $GITHUB_OUTPUT
          
      - name: AI Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Use Claude API with CLAUDE.md as system prompt
          # Post results as PR comment
```

---

## 5. CUSTOMIZATION

### 5.1 Extending the Kernel

Để thêm domain knowledge mới:

```markdown
<!-- Thêm vào CLAUDE.md -->

## 🆕 NEW FEATURE: [Feature Name]

### Context
[Background information]

### Implementation Details
[Technical details]

### Patterns to Follow
[Code patterns]

### Common Pitfalls
[Things to avoid]
```

### 5.2 Creating Task-Specific Prompts

Template cho task-specific prompt mới:

```markdown
# [Task Name] Task

Bạn là [Role] cho dự án L-ERP MRP.

## Context
[Reference CLAUDE.md]

## Your Task
[Clear task description]

## Guidelines
[Specific guidelines for this task]

## Output Format
[Expected output structure]
```

---

## 6. TROUBLESHOOTING

### Vấn đề thường gặp

| Issue | Solution |
|-------|----------|
| Claude không follow context | Đảm bảo CLAUDE.md ở root và đúng format |
| Response không consistent | Reference master prompt directly |
| Missing domain knowledge | Update CLAUDE.md với context mới |
| Code không match style | Check code standards section |

### Debug Tips

1. **Verify context loading:**
   ```bash
   claude "What project are you working on?"
   # Should mention L-ERP MRP
   ```

2. **Check tech stack awareness:**
   ```bash
   claude "What's our tech stack?"
   # Should list correct technologies
   ```

3. **Test code standards:**
   ```bash
   claude "Generate a sample API route"
   # Should follow project patterns
   ```

---

## 7. MAINTENANCE

### Weekly Review
- [ ] Check if CLAUDE.md reflects current project state
- [ ] Update tech stack if changed
- [ ] Add new patterns discovered
- [ ] Remove deprecated information

### Monthly Review
- [ ] Review master prompt for accuracy
- [ ] Update domain knowledge
- [ ] Collect feedback from team
- [ ] Improve task-specific prompts

### Version Control
- Tag major prompt changes
- Document changes in CHANGELOG
- Test changes before merging

---

## 8. METRICS & MONITORING

### Success Metrics
- Code review accuracy
- Time saved per task
- Consistency of outputs
- Team satisfaction

### Tracking
```typescript
// Log AI interactions for analysis
interface AIInteraction {
  taskType: string;
  promptUsed: string;
  responseQuality: 1 | 2 | 3 | 4 | 5;
  followedStandards: boolean;
  timeToComplete: number;
  userFeedback?: string;
}
```

---

*Hướng dẫn này giúp maximize hiệu quả của AI Kernel trong dự án L-ERP MRP. Luôn cập nhật theo sự phát triển của dự án.*
