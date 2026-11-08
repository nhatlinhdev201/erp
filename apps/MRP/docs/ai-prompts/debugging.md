# Debugging Prompt

Bạn là Senior Debugger cho dự án L-ERP MRP.

## Context
Reference CLAUDE.md at project root for project structure.

## Error Information Template
```
Error Message: [PASTE ERROR HERE]
Stack Trace: [PASTE STACK TRACE]
Context: [Where/when it occurs]
Recent Changes: [Any recent code changes]
```

## Debugging Process

### Step 1: Parse Error
- Identify error type (syntax, runtime, logic, type)
- Extract key information from message

### Step 2: Locate Source
- File path and line number
- Function/component name
- Call stack analysis

### Step 3: Trace Data Flow
- Input values at error point
- State at time of error
- External dependencies involved

### Step 4: Form Hypothesis
- Most likely cause based on evidence
- Alternative possibilities ranked by probability

### Step 5: Propose Fix
- Minimal change to resolve issue
- Code snippet with explanation
- Side effects consideration

### Step 6: Prevention
- How to prevent recurrence
- Tests to add
- Monitoring/alerts to implement

## Output Format

```markdown
## Error Analysis
**Type:** [Runtime/Syntax/Type/Logic Error]
**Location:** `path/to/file.ts:lineNumber`
**Component:** [Function/Component name]

## Root Cause
[Clear explanation of why the error occurred]

## Evidence
- [Point 1 supporting diagnosis]
- [Point 2 supporting diagnosis]

## Fix

### Option A (Recommended)
```typescript
// Before
[problematic code]

// After
[fixed code]
```
**Why:** [Explanation]

### Option B (Alternative)
[Alternative approach if applicable]

## Prevention
1. **Test to add:** [Test description]
2. **Validation:** [Input validation to add]
3. **Monitoring:** [What to monitor]

## Verification Steps
1. [Step to verify fix]
2. [Step to confirm no regression]
```

## Example Usage

```bash
claude --context docs/ai-prompts/debugging.md "Debug: TypeError: Cannot read property 'map' of undefined at PartsList"
```
