# ═══════════════════════════════════════════════════════════════════════════════
#
#                    L-ERP MRP AI-FIRST ROADMAP
#                    CHIẾN LƯỢC PHÁT TRIỂN "INTELLIGENT MRP"
#
#                    Version: 1.0
#                    Date: 2026-01-13
#
# ═══════════════════════════════════════════════════════════════════════════════

# 1. TẦM NHÌN CHIẾN LƯỢC

## Vision Statement

```
L-ERP MRP sẽ trở thành "AI-NATIVE MRP" đầu tiên cho SMB Manufacturing
tại Việt Nam - không cạnh tranh trực tiếp với SAP/Oracle về độ sâu
chức năng, mà CHIẾN THẮNG bằng:

🎯 Trải nghiệm người dùng vượt trội (UX 90% vs SAP 50%)
🤖 AI được tích hợp sâu từ core (không phải add-on)
⚡ Triển khai nhanh, chi phí hợp lý
```

## Evolution Path

```
PHASE 1 (Now)     →    PHASE 2 (6mo)    →    PHASE 3 (12mo)   →    PHASE 4 (18mo)
TRANSACTIONAL          ASSISTED              PREDICTIVE            AUTONOMOUS
SYSTEM                 INTELLIGENCE          INTELLIGENCE          INTELLIGENCE

• Data Entry           • AI Chat Bot         • Demand Forecast     • Self-healing
• CRUD                 • Smart Search        • Anomaly Detection   • Auto-reorder
• Reports              • Doc Processing      • Risk Prediction     • Optimization
• Basic MRP            • RAG Knowledge       • What-if Sim         • AI Scheduler
```

## 3 Strategic Pillars

```
1. CONVERSATIONAL FIRST
   └── Mọi tương tác có thể qua AI chat
       "Tồn kho part ABC còn bao nhiêu? Đủ cho đơn hàng tuần sau không?"

2. PREDICTIVE BY DEFAULT
   └── Hệ thống chủ động cảnh báo, không chờ user hỏi
       "⚠️ Safety stock sẽ breach sau đơn này. Đề xuất: Tạo PR 500 units"

3. AUTONOMOUS READY
   └── Tự động hóa có kiểm soát với human-in-the-loop
       "AI đề xuất → User approve → System execute"
```

---

# 2. HIỆN TRẠNG & GAP ANALYSIS

## Current Capabilities

```
TECH STACK:                              STATUS:
├── Next.js 15, React 19                 ✅ Modern (vượt SAP GUI)
├── 347 E2E tests passed                 ✅ Solid foundation
├── Socket.io real-time                  ✅ Collaboration ready
└── Gemini/OpenAI integration            ✅ AI foundation

CORE MODULES:
├── Parts, BOM, Inventory                ✅ Complete
├── Orders (PO, SO, WO)                  ✅ Complete
├── Purchasing, Production               ✅ Complete
└── Quality Control                      ✅ Complete

CONTEXTUAL FEATURES (Phase 0-4):
├── Chat System (Socket.io)              ✅ Complete
├── Screenshot Capture                   ✅ Complete
├── Audit Trail                          ✅ Complete
└── AI Integration (Basic)               ✅ Complete
```

## Gap Analysis vs SAP/Oracle

| Feature | L-ERP MRP | SAP/Oracle | Gap | Strategy |
|---------|---------|------------|-----|----------|
| Core MRP | 80% | 100% | APS, Multi-level | Phase 3 |
| Financial | 20% | 100% | GL, AP/AR | Partner |
| Supply Chain | 40% | 90% | SCM | Phase 2 |
| Analytics/BI | 30% | 85% | Embedded BI | Phase 2 |
| **AI/ML** | **15%** | **40%** | **OPPORTUNITY!** ⭐ | **Focus** |
| User Experience | 90% | 50% | ✅ ADVANTAGE | Maintain |
| Cloud Native | 95% | 60% | ✅ ADVANTAGE | Maintain |

**KEY INSIGHT:**
- Không cần đuổi kịp SAP về Financial (20% → 100% = waste)
- FOCUS vào AI/ML (15% → 60% = differentiation)
- MAINTAIN UX advantage (90%)

---

# 3. ROADMAP TIMELINE

```
2026 ROADMAP:

JAN    FEB    MAR    APR    MAY    JUN    JUL    AUG    SEP    OCT    NOV
 │      │      │      │      │      │      │      │      │      │      │
 ├──────┴──────┴──────┼──────┴──────┴──────┼──────┴──────┴──────┼──────┤
 │                    │                    │                    │      │
 │   PHASE 1          │   PHASE 2          │   PHASE 3          │ P4   │
 │   AI-Assisted      │   Predictive       │   Autonomous       │      │
 │   Operations       │   Intelligence     │   Operations       │      │
 │                    │                    │                    │      │
 │ • AI Chatbot       │ • Demand Forecast  │ • Self-optimizing  │ Full │
 │ • Smart Search     │ • Quality Predict  │   Inventory        │  AI  │
 │ • Doc OCR          │ • Supplier Risk    │ • AI Scheduler     │      │
 │ • RAG Setup        │ • What-if Sim      │ • Anomaly Response │      │

QUICK WINS (30 Days):
├── Week 1-2: AI Chatbot for inventory queries
├── Week 2-3: Smart Search across all modules
└── Week 3-4: AI-suggested reorder alerts
```

---

# 4. QUICK WINS (30 NGÀY)

## Priority Matrix

| Priority | Feature | Effort | Impact | Week |
|----------|---------|--------|--------|------|
| **P0** ⭐ | AI Chatbot for inventory queries | 2 weeks | High | Week 1-2 |
| **P0** ⭐ | Smart Search (semantic) | 1 week | High | Week 2-3 |
| P1 | AI-suggested reorder alerts | 1 week | Medium | Week 3-4 |
| P1 | PO/Invoice OCR processing | 2 weeks | Medium | Week 4+ |

## Quick Win #1: AI Chatbot

**Vision:**
```
User: "Tồn kho part ABC-123 còn bao nhiêu? Có đủ cho đơn hàng tuần sau không?"

AI: Part ABC-123 hiện có 450 units tại WH-01.
    Đơn hàng SO-2024-0156 cần 200 units vào 25/01.
    
    ✅ Đủ stock, không cần tạo PO.
    
    Tuy nhiên, tôi phát hiện:
    ⚠️ Safety stock sẽ breach sau đơn này (còn 250 < 300)
    
    📋 Đề xuất: Tạo PR cho 500 units từ Supplier A
       (Lead time: 7 ngày, Unit price: $12.50)
    
    [Tạo PR]  [Xem chi tiết]  [Bỏ qua]
```

**Timeline: Week 1-2**
```
Week 1:
├── Day 1-2: Intent parsing với Gemini
├── Day 3-4: Database queries cho inventory context
└── Day 5: Basic response generation

Week 2:
├── Day 1-2: Action suggestions (Create PR, etc.)
├── Day 3: UI component (ChatWidget)
├── Day 4: Integration với existing chat system
└── Day 5: Testing & refinement
```

## Quick Win #2: Smart Search

**Vision:**
```
Traditional Search:              Smart Search:
Query: "bearing"                 Query: "vòng bi cho motor"
Results: Parts with              Results:
"bearing" in name                • SKF 6205 (Bearing, deep groove)
                                 • NSK 6205 (Similar)
                                 • Related BOM: Motor Assembly
                                 • Suppliers: ABC Bearing Co.

Features:
• Vietnamese ↔ English understanding
• Synonym matching (vòng bi = bearing)
• Cross-module search (Parts + BOM + Suppliers)
• Contextual ranking
```

**Timeline: Week 2-3 (1 week)**

## Quick Win #3: Reorder Alerts

**Vision:**
```
🔔 AI Alert: Reorder Recommended

Part: ABC-123 (Bearing SKF 6205)

Current Stock:     250 units
Safety Stock:      300 units
Incoming PO:       0 units
Committed (SO):    180 units (next 7 days)

⚠️ Projected Stockout: Jan 28, 2026

📋 AI Recommendation:
Order 500 units from Supplier A
• Lead time: 7 days
• Unit price: $12.50 (best price)
• Arrival: Jan 25 (before stockout)

[Create PR]  [Create PO]  [Snooze 3 days]  [Dismiss]
```

**Timeline: Week 3-4 (1 week)**

---

# 5. PHASE 1: AI-ASSISTED (Q1-Q2)

## Overview

```
GOAL: Transform user experience with AI assistance
TARGET AI MATURITY: 15% → 35%
TIMELINE: 3-4 months

DELIVERABLES:
1. Conversational AI Interface (from Quick Wins)
2. Smart Search (from Quick Wins)
3. Document OCR Processing
4. RAG Knowledge Base
5. Email Parsing for Orders

KPIs:
• 50% of queries via AI chat
• 80% document auto-processing
• 30% reduction in data entry time
```

## Document OCR Processing

```
📄 Input              🤖 AI Processing         📊 Output

Supplier Quote  ───►  Extract: Part, Price,   ───►  Auto-create
(PDF/Email)           MOQ, Lead time                RFQ Response

Customer PO     ───►  Validate: Part#, Qty,   ───►  Auto-create
(PDF/Email)           Price, Date                   Sales Order

Invoice (PDF)   ───►  Match: PO, GRN, Amount  ───►  3-way match
                                                     & flag diff

COC/Test Cert   ───►  Extract specs,          ───►  Link to Lot
(PDF)                 validate                       & Part

TECHNOLOGY: Gemini Vision + Document AI
CONFIDENCE: Show score, require approval if < 90%
```

## RAG Knowledge Base

```
KNOWLEDGE SOURCES:

STRUCTURED DATA:              UNSTRUCTURED KNOWLEDGE:
┌──────────────────┐         ┌──────────────────┐
│ Parts (specs,    │         │ SOPs, Work       │
│ history)         │         │ Instructions     │
├──────────────────┤         ├──────────────────┤
│ Suppliers        │         │ Compliance       │
│ (performance,    │         │ Requirements     │
│ contracts)       │         │ (ISO, AS9100)    │
├──────────────────┤         ├──────────────────┤
│ Orders           │         │ Email history,   │
│ (patterns)       │         │ Notes            │
└──────────────────┘         └──────────────────┘
         │                            │
         └──────────────┬─────────────┘
                        ▼
           ┌───────────────────────┐
           │    VECTOR STORE       │
           │    (Embeddings)       │
           └───────────────────────┘
                        │
                        ▼
           ┌───────────────────────┐
           │    RAG ENGINE         │
           │ Query → Retrieve →    │
           │ Augment → Generate    │
           └───────────────────────┘
```

---

# 6. PHASE 2: PREDICTIVE (Q2-Q3)

## Overview

```
GOAL: Proactive insights & predictions
TARGET AI MATURITY: 35% → 50%
TIMELINE: 3-4 months

DELIVERABLES:
1. Demand Forecasting Engine
2. Quality Prediction & Anomaly Detection
3. Supplier Risk Intelligence
4. What-if Simulation

KPIs:
• 20% improvement in forecast accuracy
• 15% reduction in quality cost
• 10% reduction in supplier risk incidents
```

## Demand Forecasting

```typescript
interface DemandForecastAI {
  factors: {
    historical: SalesHistory[];      // 2+ years data
    seasonal: SeasonalPattern[];     // VN holidays, Q2/Q4 peaks
    market: ExternalSignal[];        // Industry trends
    customer: CustomerBehavior[];    // Order patterns
  };

  outputs: {
    forecast: TimeSeriesForecast;    // Weekly/Monthly
    confidence: number;              // 0-100%
    scenarios: Scenario[];           // Best/Worst/Most Likely
    recommendations: Action[];       // MRP adjustments
  };
}

// Differentiator vs SAP APO:
// - Real-time learning từ actual vs forecast
// - Incorporate unstructured data (emails, news)
// - Explainable AI: "Dự báo tăng 20% vì: Tết + Customer A confirmed"
```

## Quality Prediction

```
DATA SOURCES:                AI ANALYSIS:

In-Process      ─────────►   Pattern Recognition
Inspections                  • Drift detection
                            • Cpk trending
SPC Data        ─────────►   
                            Root Cause Correlation
                            • Supplier lot link
NCR History     ─────────►   • Machine/operator link
                            
                            Predictive Alerts
                            • "Lot X likely to fail"
                            • "Machine Y needs maint"

OUTPUT:
"Supplier B's last 3 lots show declining specs.
 Recommend: Increase inspection or switch supplier"
```

## Supplier Risk Intelligence

```typescript
interface SupplierRiskAI {
  riskFactors: {
    delivery: DeliveryPerformance;    // On-time %, lead time variance
    quality: QualityMetrics;          // PPM, NCR rate, CAPA closure
    financial: FinancialHealth;       // Credit score, news sentiment
    geopolitical: GeoRisk;            // Country risk, trade policies
    concentration: DependencyRisk;    // Single source, volume %
  };

  aiCapabilities: {
    earlyWarning: Alert[];            // "Supplier X financial distress"
    alternativeFind: Supplier[];      // Auto-suggest alternatives
    negotiationInsight: Insight[];    // "Supplier has 15% margin room"
  };
}
```

---

# 7. PHASE 3: AUTONOMOUS (Q3-Q4)

## Overview

```
GOAL: Automated decision-making with human oversight
TARGET AI MATURITY: 50% → 60%
TIMELINE: 3-4 months

DELIVERABLES:
1. Self-Optimizing Inventory
2. AI Production Scheduler (APS competitor)
3. Anomaly Auto-Response
4. Intelligent Workflows

KPIs:
• 30% inventory reduction
• 25% reduction in planning time
• 40% reduction in manual work

PRINCIPLE: AI suggests → Human approves → System executes
```

## Self-Optimizing Inventory

```
TRADITIONAL MRP:                 AI-ENHANCED MRP:

┌─────────────────────┐         ┌─────────────────────────────────┐
│ Fixed Safety Stock  │         │ Dynamic Safety Stock             │
│ = 100 units         │   ───►  │ = f(demand variance,             │
│                     │         │     supplier reliability,         │
│                     │         │     current market)               │
└─────────────────────┘         │ Today: 85 | Next week: 120       │
                                └─────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────────────────┐
│ Fixed Reorder Point │         │ Intelligent Reorder              │
│ = 200 units         │   ───►  │ • Consider: price trends         │
│                     │         │ • Consider: supplier promo       │
│                     │         │ • Consider: cash flow            │
└─────────────────────┘         │ "Order now: 10% discount"        │
                                └─────────────────────────────────┘

AUTONOMOUS ACTIONS (with approval):
• Auto-create PR when conditions met
• Auto-select best supplier
• Auto-expedite when risk detected
• Auto-adjust safety stock based on learning
```

## AI Production Scheduler

```typescript
interface AIScheduler {
  objectives: {
    primary: 'minimize_lateness' | 'maximize_throughput' | 'minimize_cost';
    constraints: Constraint[];  // Capacity, materials, skills
  };

  algorithms: {
    geneticOptimization: GeneticAlgorithm;
    reinforcementLearning: RLModel;  // Learn from actual vs planned
    constraintSatisfaction: CSPSolver;
  };

  features: {
    whatIfSimulation: Scenario[];     // "What if Machine 3 down?"
    dynamicRescheduling: boolean;     // Real-time adjustment
    humanInTheLoop: ApprovalWorkflow; // AI suggests, human approves
  };
}

// Key differentiator: Learning from actual vs planned
// "Last time similar order, setup took 2h not 1h. Adjusting estimate."
```

---

# 8. COMPETITIVE POSITIONING

## Market Position

```
                     MARKET POSITIONING MATRIX

Complexity                                              
     ▲                                                  
     │                   ┌─────────┐                    
High │                   │   SAP   │                    
     │                   │ S/4HANA │                    
     │                   └─────────┘                    
     │                        ┌─────────┐               
     │                        │ Oracle  │               
     │                        └─────────┘               
     │      ┌──────────────────────┐                    
     │      │       L-ERP MRP        │ ◄── TARGET         
Med  │      │    "AI-Native MRP"   │     • SMB Mfg VN   
     │      └──────────────────────┘     • AI-first     
     │                   ┌─────────┐     • Modern UX    
Low  │                   │  Odoo   │     • Affordable   
     │                   └─────────┘                    
     │                                                  
     └──────────────────────────────────────────────►   
           Low        Medium        High     AI Capability
```

## Key Differentiators

| Aspect | SAP/Oracle | L-ERP MRP AI-Native |
|--------|------------|-------------------|
| AI Integration | Bolt-on, expensive | Native, embedded |
| Implementation | 6-18 months, $500K+ | 2-4 weeks, subscription |
| User Experience | Complex, training-heavy | Intuitive, AI-guided |
| Target Market | Enterprise | SMB Manufacturing VN |

## Sustainable Advantages

```
1. DATA MOAT
   └── Càng dùng, AI càng thông minh

2. NETWORK EFFECT
   └── AI models improve across all customers

3. MODERN STACK
   └── Dễ iterate, không legacy burden

4. LOCAL EXPERTISE
   └── Vietnamese-first, local context
```

---

# 9. KPIs & SUCCESS METRICS

## Phase-by-Phase KPIs

| Milestone | KPIs | AI Maturity |
|-----------|------|-------------|
| **Quick Wins (30 Days)** | >30% users try AI Chat, >50 searches/day | 20% |
| **Phase 1 (Q1-Q2)** | 50% queries via AI, 80% doc auto-process, 30% less data entry | 35% |
| **Phase 2 (Q2-Q3)** | 20% forecast accuracy↑, 15% quality cost↓, 10% supplier risk↓ | 50% |
| **Phase 3 (Q3-Q4)** | 30% inventory↓, 25% planning time↓, 40% manual work↓ | 60% |

---

# 10. RESOURCE REQUIREMENTS

## Team Structure

| Role | FTE | Responsibility |
|------|-----|----------------|
| AI/ML Engineer | 1 | Gemini, RAG, ML models |
| Full-stack Developer | 2 | Next.js, React, API |
| QA Engineer | 1 | Testing, quality |
| Product Manager | 0.5 | Roadmap, priorities |
| DevOps Engineer | 0.5 | Infrastructure |
| UI/UX Designer | 0.5 | AI interfaces |
| **TOTAL** | **~6 FTE** | |

## Technology Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Google Gemini API | $500-2,000 | Based on usage |
| OpenAI API (backup) | $200-500 | Fallback |
| Vector Store (Pinecone) | $70-250 | Embeddings |
| Hosting (Render) | $100-300 | Infrastructure |
| Database | $50-100 | PostgreSQL |
| Cache (Redis) | $30-50 | Performance |
| **TOTAL** | **$950-3,200/month** | |

## Budget Summary

| Phase | Duration | Team Cost | Tech Cost | Total |
|-------|----------|-----------|-----------|-------|
| Quick Wins | 1 month | $15K | $2K | $17K |
| Phase 1 | 3 months | $45K | $6K | $51K |
| Phase 2 | 3 months | $45K | $8K | $53K |
| Phase 3 | 3 months | $45K | $10K | $55K |
| **TOTAL** | **10 months** | **$150K** | **$26K** | **$176K** |

---

# 11. RISK MANAGEMENT

## Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI API costs exceed budget | Medium | Medium | Usage monitoring, caching, fallbacks |
| AI accuracy issues | High | Medium | Human-in-the-loop, confidence thresholds |
| User adoption slow | Medium | Low | Training, UX focus, champion users |
| Data quality issues | High | Medium | Validation, cleanup processes |
| Competitor catches up | Medium | Low | Speed of execution, data moat |
| Key person dependency | High | Medium | Documentation, knowledge sharing |

## AI Safety Principles

```
⚠️ CRITICAL: AI SUGGESTS, HUMAN DECIDES

1. NO AUTO-EXECUTION of critical actions
   └── Create PO, Approve, Delete → Always require human confirmation

2. ALWAYS SHOW CONFIDENCE
   └── "85% confident" helps user decide how much to trust

3. EXPLAINABLE AI
   └── "I recommend this because..." not just "Do this"

4. GRACEFUL DEGRADATION
   └── System works without AI (just less smart)

5. AUDIT EVERYTHING
   └── All AI suggestions logged for review
```

---

# SUMMARY

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   L-ERP MRP AI-FIRST ROADMAP                                                ║
║                                                                            ║
║   VISION: "AI-Native MRP" - First in Vietnam                              ║
║   TIMELINE: 10 months (Q1-Q4 2026)                                        ║
║   BUDGET: ~$176K total                                                     ║
║   TEAM: ~6 FTE                                                             ║
║                                                                            ║
║   ════════════════════════════════════════════════════════════════════    ║
║                                                                            ║
║   QUICK WINS (30 Days):                                                    ║
║   • AI Chatbot for inventory queries                                       ║
║   • Smart Search (semantic)                                                ║
║   • Reorder alerts                                                         ║
║                                                                            ║
║   PHASE 1: AI-Assisted (Q1-Q2) → 35% AI Maturity                          ║
║   PHASE 2: Predictive (Q2-Q3) → 50% AI Maturity                           ║
║   PHASE 3: Autonomous (Q3-Q4) → 60% AI Maturity                           ║
║                                                                            ║
║   COMPETITIVE ADVANTAGE:                                                   ║
║   UX (90%) + AI Native + Fast Implementation + Affordable                 ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

# ═══════════════════════════════════════════════════════════════════════════════
#                              END OF ROADMAP DOCUMENT
# ═══════════════════════════════════════════════════════════════════════════════
