// =============================================================================
// RAG KNOWLEDGE SERVICE
// Retrieval-Augmented Generation for intelligent context-aware responses
// =============================================================================

import { prisma } from '../prisma';
import { logger } from '@/lib/logger';
import { getEmbeddingService, EmbeddingVector, SemanticSearchResult } from './embedding-service';

// =============================================================================
// TYPES
// =============================================================================

export type KnowledgeType =
  | 'part'
  | 'supplier'
  | 'customer'
  | 'product'
  | 'order'
  | 'bom'
  | 'document'
  | 'sop'
  | 'compliance'
  | 'note'
  | 'history';

export interface KnowledgeChunk {
  id: string;
  type: KnowledgeType;
  source: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGContext {
  query: string;
  chunks: KnowledgeChunk[];
  totalRelevance: number;
  sources: string[];
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: number;
  suggestedActions?: RAGAction[];
}

export interface RAGAction {
  type: 'view' | 'create' | 'update' | 'navigate';
  label: string;
  target: string;
  params?: Record<string, any>;
}

export interface KnowledgeStats {
  totalChunks: number;
  byType: Record<KnowledgeType, number>;
  lastIndexed: Date | null;
  indexHealth: 'healthy' | 'stale' | 'empty';
}

// =============================================================================
// KNOWLEDGE CHUNK STORE (In-memory with persistence)
// =============================================================================

class KnowledgeStore {
  private chunks: Map<string, KnowledgeChunk> = new Map();
  private embeddingService = getEmbeddingService();

  // ===========================================================================
  // CHUNK MANAGEMENT
  // ===========================================================================

  async addChunk(chunk: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeChunk> {
    const embedding = await this.embeddingService.generateEmbedding(
      `${chunk.title} ${chunk.content}`
    );

    const fullChunk: KnowledgeChunk = {
      ...chunk,
      embedding,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chunks.set(chunk.id, fullChunk);
    return fullChunk;
  }

  async addChunks(chunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    let added = 0;
    for (const chunk of chunks) {
      await this.addChunk(chunk);
      added++;
      // Rate limiting
      if (added % 50 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    return added;
  }

  getChunk(id: string): KnowledgeChunk | undefined {
    return this.chunks.get(id);
  }

  getAllChunks(): KnowledgeChunk[] {
    return Array.from(this.chunks.values());
  }

  getChunksByType(type: KnowledgeType): KnowledgeChunk[] {
    return this.getAllChunks().filter(c => c.type === type);
  }

  deleteChunk(id: string): boolean {
    return this.chunks.delete(id);
  }

  clear(): void {
    this.chunks.clear();
  }

  // ===========================================================================
  // SIMILARITY SEARCH
  // ===========================================================================

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  async search(
    query: string,
    options: {
      types?: KnowledgeType[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<{ chunk: KnowledgeChunk; score: number }[]> {
    const { types, limit = 10, threshold = 0.25 } = options;

    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    let chunks = this.getAllChunks();

    if (types && types.length > 0) {
      chunks = chunks.filter(c => types.includes(c.type));
    }

    const results = chunks
      .filter(c => c.embedding && c.embedding.length > 0)
      .map(chunk => ({
        chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
      }))
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }
}

// =============================================================================
// RAG KNOWLEDGE SERVICE
// =============================================================================

export class RAGKnowledgeService {
  private store: KnowledgeStore;
  private embeddingService = getEmbeddingService();
  private lastIndexTime: Date | null = null;

  constructor() {
    this.store = new KnowledgeStore();
  }

  // ===========================================================================
  // KNOWLEDGE INDEXING - Structured Data
  // ===========================================================================

  async indexParts(): Promise<number> {
    const parts = await prisma.part.findMany({
      select: {
        id: true,
        partNumber: true,
        name: true,
        description: true,
        category: true,
        partType: true,
        unitCost: true,
        reorderPoint: true,
        safetyStock: true,
        unit: true,
        status: true,
        partSuppliers: {
          include: { supplier: { select: { name: true } } },
          take: 3,
        },
        inventory: {
          select: { quantity: true, reservedQty: true },
        },
      },
    });

    const chunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = parts.map(part => {
      const totalStock = part.inventory.reduce((sum, inv) => sum + inv.quantity - inv.reservedQty, 0);
      const suppliers = part.partSuppliers.map(ps => ps.supplier.name).join(', ');

      return {
        id: `part:${part.id}`,
        type: 'part' as KnowledgeType,
        source: 'database',
        title: `${part.partNumber} - ${part.name}`,
        content: [
          `Part number: ${part.partNumber}`,
          `Name: ${part.name}`,
          part.description && `Description: ${part.description}`,
          `Category: ${part.category || 'N/A'}`,
          `Type: ${part.partType || 'N/A'}`,
          `Current stock: ${totalStock} ${part.unit || 'units'}`,
          `Reorder point: ${part.reorderPoint || 0}`,
          `Safety stock: ${part.safetyStock || 0}`,
          `Unit cost: $${part.unitCost || 0}`,
          suppliers && `Suppliers: ${suppliers}`,
          `Status: ${part.status}`,
        ].filter(Boolean).join('. '),
        metadata: {
          partNumber: part.partNumber,
          category: part.category,
          partType: part.partType,
          currentStock: totalStock,
          reorderPoint: part.reorderPoint,
          safetyStock: part.safetyStock,
          unitCost: part.unitCost,
          status: part.status,
        },
      };
    });

    return await this.store.addChunks(chunks);
  }

  async indexSuppliers(): Promise<number> {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        country: true,
        contactName: true,
        contactEmail: true,
        leadTimeDays: true,
        rating: true,
        status: true,
        paymentTerms: true,
        _count: { select: { partSuppliers: true, purchaseOrders: true } },
      },
    });

    const chunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = suppliers.map(supplier => ({
      id: `supplier:${supplier.id}`,
      type: 'supplier' as KnowledgeType,
      source: 'database',
      title: `${supplier.code} - ${supplier.name}`,
      content: [
        `Supplier code: ${supplier.code}`,
        `Name: ${supplier.name}`,
        `Country: ${supplier.country}`,
        supplier.contactName && `Contact: ${supplier.contactName}`,
        supplier.contactEmail && `Email: ${supplier.contactEmail}`,
        `Lead time: ${supplier.leadTimeDays} days`,
        supplier.rating && `Rating: ${supplier.rating}`,
        `Payment terms: ${supplier.paymentTerms || 'N/A'}`,
        `Parts supplied: ${supplier._count.partSuppliers}`,
        `Purchase orders: ${supplier._count.purchaseOrders}`,
        `Status: ${supplier.status}`,
      ].filter(Boolean).join('. '),
      metadata: {
        code: supplier.code,
        country: supplier.country,
        leadTimeDays: supplier.leadTimeDays,
        rating: supplier.rating,
        partsCount: supplier._count.partSuppliers,
        posCount: supplier._count.purchaseOrders,
        status: supplier.status,
      },
    }));

    return await this.store.addChunks(chunks);
  }

  async indexCustomers(): Promise<number> {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        country: true,
        type: true,
        contactName: true,
        contactEmail: true,
        paymentTerms: true,
        creditLimit: true,
        status: true,
        _count: { select: { salesOrders: true } },
      },
    });

    const chunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = customers.map(customer => ({
      id: `customer:${customer.id}`,
      type: 'customer' as KnowledgeType,
      source: 'database',
      title: `${customer.code} - ${customer.name}`,
      content: [
        `Customer code: ${customer.code}`,
        `Name: ${customer.name}`,
        customer.country && `Country: ${customer.country}`,
        customer.type && `Type: ${customer.type}`,
        customer.contactName && `Contact: ${customer.contactName}`,
        customer.contactEmail && `Email: ${customer.contactEmail}`,
        `Payment terms: ${customer.paymentTerms || 'N/A'}`,
        customer.creditLimit && `Credit limit: $${customer.creditLimit}`,
        `Total orders: ${customer._count.salesOrders}`,
        `Status: ${customer.status}`,
      ].filter(Boolean).join('. '),
      metadata: {
        code: customer.code,
        country: customer.country,
        type: customer.type,
        creditLimit: customer.creditLimit,
        ordersCount: customer._count.salesOrders,
        status: customer.status,
      },
    }));

    return await this.store.addChunks(chunks);
  }

  async indexBOMs(): Promise<number> {
    const boms = await prisma.bomHeader.findMany({
      select: {
        id: true,
        version: true,
        status: true,
        effectiveDate: true,
        product: { select: { sku: true, name: true } },
        bomLines: {
          select: {
            quantity: true,
            part: { select: { partNumber: true, name: true } },
          },
          take: 10,
        },
      },
    });

    const chunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = boms.map(bom => {
      const components = bom.bomLines.map(l => `${l.part.partNumber} (${l.quantity})`).join(', ');

      return {
        id: `bom:${bom.id}`,
        type: 'bom' as KnowledgeType,
        source: 'database',
        title: `BOM: ${bom.product.name} v${bom.version}`,
        content: [
          `Product: ${bom.product.sku} - ${bom.product.name}`,
          `Version: ${bom.version}`,
          `Effective date: ${bom.effectiveDate.toISOString().split('T')[0]}`,
          `Components: ${components || 'None'}`,
          `Total components: ${bom.bomLines.length}`,
          `Status: ${bom.status}`,
        ].filter(Boolean).join('. '),
        metadata: {
          productSku: bom.product.sku,
          productName: bom.product.name,
          version: bom.version,
          componentCount: bom.bomLines.length,
          status: bom.status,
        },
      };
    });

    return await this.store.addChunks(chunks);
  }

  async indexOrders(): Promise<number> {
    // Index recent sales orders
    const salesOrders = await prisma.salesOrder.findMany({
      take: 500,
      orderBy: { orderDate: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        requiredDate: true,
        status: true,
        totalAmount: true,
        priority: true,
        customer: { select: { code: true, name: true } },
        lines: {
          select: {
            quantity: true,
            product: { select: { sku: true, name: true } },
          },
          take: 5,
        },
      },
    });

    const soChunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = salesOrders.map(so => ({
      id: `sales-order:${so.id}`,
      type: 'order' as KnowledgeType,
      source: 'database',
      title: `Sales Order ${so.orderNumber}`,
      content: [
        `Sales order: ${so.orderNumber}`,
        `Customer: ${so.customer.code} - ${so.customer.name}`,
        `Order date: ${so.orderDate.toISOString().split('T')[0]}`,
        `Required date: ${so.requiredDate.toISOString().split('T')[0]}`,
        `Status: ${so.status}`,
        `Priority: ${so.priority}`,
        so.totalAmount && `Total: $${so.totalAmount}`,
        `Items: ${so.lines.map(l => l.product.sku).join(', ')}`,
      ].filter(Boolean).join('. '),
      metadata: {
        orderNumber: so.orderNumber,
        customerCode: so.customer.code,
        customerName: so.customer.name,
        status: so.status,
        totalAmount: so.totalAmount,
        itemCount: so.lines.length,
      },
    }));

    // Index recent purchase orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      take: 500,
      orderBy: { orderDate: 'desc' },
      select: {
        id: true,
        poNumber: true,
        orderDate: true,
        expectedDate: true,
        status: true,
        totalAmount: true,
        supplier: { select: { code: true, name: true } },
        lines: {
          select: {
            quantity: true,
            part: { select: { partNumber: true, name: true } },
          },
          take: 5,
        },
      },
    });

    const poChunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = purchaseOrders.map(po => ({
      id: `purchase-order:${po.id}`,
      type: 'order' as KnowledgeType,
      source: 'database',
      title: `Purchase Order ${po.poNumber}`,
      content: [
        `Purchase order: ${po.poNumber}`,
        `Supplier: ${po.supplier.code} - ${po.supplier.name}`,
        `Order date: ${po.orderDate.toISOString().split('T')[0]}`,
        po.expectedDate && `Expected date: ${po.expectedDate.toISOString().split('T')[0]}`,
        `Status: ${po.status}`,
        po.totalAmount && `Total: $${po.totalAmount}`,
        `Parts: ${po.lines.map(l => l.part.partNumber).join(', ')}`,
      ].filter(Boolean).join('. '),
      metadata: {
        poNumber: po.poNumber,
        supplierCode: po.supplier.code,
        supplierName: po.supplier.name,
        status: po.status,
        totalAmount: po.totalAmount,
        itemCount: po.lines.length,
      },
    }));

    await this.store.addChunks(soChunks);
    await this.store.addChunks(poChunks);

    return soChunks.length + poChunks.length;
  }

  // ===========================================================================
  // KNOWLEDGE INDEXING - Compliance & SOPs
  // ===========================================================================

  async indexComplianceKnowledge(): Promise<number> {
    // Add built-in compliance knowledge
    const complianceChunks: Omit<KnowledgeChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'compliance:iso9001',
        type: 'compliance',
        source: 'system',
        title: 'ISO 9001 Quality Management',
        content: `ISO 9001 is the international standard for quality management systems (QMS).
          Key requirements include: documented procedures, quality policy, management review,
          internal audits, corrective actions, customer focus, continuous improvement.
          L-ERP MRP supports ISO 9001 through: NCR tracking, CAPA management, audit trails,
          document control, training records, supplier evaluation.`,
        metadata: { standard: 'ISO 9001', category: 'Quality' },
      },
      {
        id: 'compliance:as9100',
        type: 'compliance',
        source: 'system',
        title: 'AS9100 Aerospace Quality',
        content: `AS9100 is the quality management standard for aerospace industry.
          Additional requirements beyond ISO 9001: product safety, counterfeit parts prevention,
          configuration management, risk management, special processes, first article inspection.
          L-ERP MRP supports AS9100 through: lot traceability, COC management, FAI records,
          supplier approval process, NDAA compliance tracking.`,
        metadata: { standard: 'AS9100', category: 'Aerospace' },
      },
      {
        id: 'compliance:ndaa',
        type: 'compliance',
        source: 'system',
        title: 'NDAA Compliance',
        content: `National Defense Authorization Act (NDAA) Section 889 prohibits use of
          telecommunications equipment from certain manufacturers (Huawei, ZTE, etc.).
          L-ERP MRP tracks NDAA compliance at supplier and part level.
          Mark suppliers and parts as NDAA compliant or non-compliant.
          Filter searches and orders to ensure NDAA compliance.`,
        metadata: { standard: 'NDAA', category: 'Defense' },
      },
      {
        id: 'sop:receiving',
        type: 'sop',
        source: 'system',
        title: 'Receiving Inspection Procedure',
        content: `Standard receiving inspection process:
          1. Verify PO number and quantity against shipping documents
          2. Visual inspection for damage
          3. Check lot/batch numbers and certificates
          4. Perform sampling inspection per inspection plan
          5. Create GRN (Goods Receipt Note)
          6. Update inventory
          7. File COC and inspection records
          Quality hold if: damaged, wrong quantity, failed inspection, missing documents.`,
        metadata: { process: 'Receiving', type: 'SOP' },
      },
      {
        id: 'sop:ncr',
        type: 'sop',
        source: 'system',
        title: 'Non-Conformance Report (NCR) Process',
        content: `NCR process steps:
          1. Identify non-conformance (internal or supplier)
          2. Quarantine affected material
          3. Document defect details with photos
          4. Determine root cause (5 Why analysis)
          5. Disposition: Use As-Is, Rework, Scrap, Return to Supplier
          6. Implement corrective action
          7. Verify effectiveness
          8. Close NCR with approval
          Escalate to CAPA if: repeat issue, safety concern, customer impact.`,
        metadata: { process: 'Quality', type: 'SOP' },
      },
      {
        id: 'sop:mrp',
        type: 'sop',
        source: 'system',
        title: 'MRP Planning Process',
        content: `Material Requirements Planning (MRP) process:
          1. Review sales forecast and firm orders
          2. Check current inventory levels
          3. Explode BOM requirements
          4. Calculate net requirements
          5. Consider lead times and safety stock
          6. Generate planned orders (PR/PO/WO)
          7. Review and approve suggestions
          8. Release orders to suppliers/production
          Run MRP: daily for critical items, weekly for standard items.`,
        metadata: { process: 'Planning', type: 'SOP' },
      },
    ];

    return await this.store.addChunks(complianceChunks);
  }

  // ===========================================================================
  // FULL INDEX
  // ===========================================================================

  async indexAll(): Promise<{
    parts: number;
    suppliers: number;
    customers: number;
    boms: number;
    orders: number;
    compliance: number;
  }> {
    logger.info('[RAG] Starting full knowledge index...');
    this.store.clear();

    const parts = await this.indexParts();
    logger.info(`[RAG] Indexed ${parts} parts`);

    const suppliers = await this.indexSuppliers();
    logger.info(`[RAG] Indexed ${suppliers} suppliers`);

    const customers = await this.indexCustomers();
    logger.info(`[RAG] Indexed ${customers} customers`);

    const boms = await this.indexBOMs();
    logger.info(`[RAG] Indexed ${boms} BOMs`);

    const orders = await this.indexOrders();
    logger.info(`[RAG] Indexed ${orders} orders`);

    const compliance = await this.indexComplianceKnowledge();
    logger.info(`[RAG] Indexed ${compliance} compliance docs`);

    this.lastIndexTime = new Date();

    return { parts, suppliers, customers, boms, orders, compliance };
  }

  // ===========================================================================
  // RAG QUERY ENGINE
  // ===========================================================================

  async retrieveContext(
    query: string,
    options: {
      types?: KnowledgeType[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<RAGContext> {
    const { limit = 5, threshold = 0.25 } = options;

    const results = await this.store.search(query, {
      types: options.types,
      limit,
      threshold,
    });

    const chunks = results.map(r => r.chunk);
    const totalRelevance = results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1);
    const sources = [...new Set(chunks.map(c => c.source))];

    return {
      query,
      chunks,
      totalRelevance,
      sources,
    };
  }

  buildContextPrompt(context: RAGContext): string {
    if (context.chunks.length === 0) {
      return '';
    }

    const contextText = context.chunks
      .map((chunk, i) => `[${i + 1}] ${chunk.title}\n${chunk.content}`)
      .join('\n\n');

    return `
RELEVANT KNOWLEDGE CONTEXT:
${contextText}

Use this context to provide accurate, specific answers. Reference specific data when available.
If the context doesn't contain relevant information, say so and provide general guidance.
`;
  }

  // ===========================================================================
  // STATS & UTILITIES
  // ===========================================================================

  getStats(): KnowledgeStats {
    const chunks = this.store.getAllChunks();
    const byType: Record<KnowledgeType, number> = {
      part: 0,
      supplier: 0,
      customer: 0,
      product: 0,
      order: 0,
      bom: 0,
      document: 0,
      sop: 0,
      compliance: 0,
      note: 0,
      history: 0,
    };

    chunks.forEach(chunk => {
      byType[chunk.type] = (byType[chunk.type] || 0) + 1;
    });

    const hoursSinceIndex = this.lastIndexTime
      ? (Date.now() - this.lastIndexTime.getTime()) / (1000 * 60 * 60)
      : Infinity;

    let indexHealth: 'healthy' | 'stale' | 'empty' = 'empty';
    if (chunks.length > 0) {
      indexHealth = hoursSinceIndex < 24 ? 'healthy' : 'stale';
    }

    return {
      totalChunks: chunks.length,
      byType,
      lastIndexed: this.lastIndexTime,
      indexHealth,
    };
  }

  async searchKnowledge(
    query: string,
    options?: {
      types?: KnowledgeType[];
      limit?: number;
    }
  ): Promise<SemanticSearchResult[]> {
    const results = await this.store.search(query, options);

    return results.map(r => ({
      id: r.chunk.id,
      type: r.chunk.type,
      title: r.chunk.title,
      subtitle: r.chunk.content.substring(0, 150) + '...',
      link: this.getChunkLink(r.chunk),
      score: r.score,
      metadata: r.chunk.metadata,
    }));
  }

  private getChunkLink(chunk: KnowledgeChunk): string {
    const [type, id] = chunk.id.split(':');
    switch (type) {
      case 'part': return `/inventory/${id}`;
      case 'supplier': return `/suppliers/${id}`;
      case 'customer': return `/customers/${id}`;
      case 'bom': return `/bom/${id}`;
      case 'sales-order': return `/orders/sales/${id}`;
      case 'purchase-order': return `/purchasing/${id}`;
      case 'compliance':
      case 'sop':
        return `/help?topic=${chunk.id}`;
      default: return '#';
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let ragServiceInstance: RAGKnowledgeService | null = null;

export function getRAGKnowledgeService(): RAGKnowledgeService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGKnowledgeService();
  }
  return ragServiceInstance;
}

export function resetRAGKnowledgeService(): void {
  ragServiceInstance = null;
}

export default RAGKnowledgeService;
