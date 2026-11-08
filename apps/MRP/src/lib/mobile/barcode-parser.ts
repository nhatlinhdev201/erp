// Barcode parsing utilities for L-ERP MRP

export type EntityType =
  | "PART"
  | "LOCATION"
  | "WORK_ORDER"
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "LOT"
  | "SERIAL"
  | "CONTAINER"
  | "LABEL"
  | "UNKNOWN";

export interface ParsedBarcode {
  entityType: EntityType;
  entityId?: string;
  partNumber?: string;
  locationCode?: string;
  workOrderNumber?: string;
  purchaseOrderNumber?: string;
  salesOrderNumber?: string;
  lotNumber?: string;
  serialNumber?: string;
  quantity?: number;
  raw: string;
  format: string;
  confidence: number; // 0-1
}

// L-ERP MRP barcode prefix conventions
const PREFIXES: Record<EntityType, string> = {
  PART: "PRT-",
  LOCATION: "LOC-",
  WORK_ORDER: "WO-",
  PURCHASE_ORDER: "PO-",
  SALES_ORDER: "SO-",
  LOT: "LOT-",
  SERIAL: "SN-",
  CONTAINER: "CTN-",
  LABEL: "LBL-",
  UNKNOWN: "",
};

// GS1 Application Identifiers
const GS1_AI = {
  "01": { name: "GTIN", length: 14 },
  "10": { name: "BATCH/LOT", variable: true },
  "11": { name: "PROD_DATE", length: 6 },
  "13": { name: "PACK_DATE", length: 6 },
  "15": { name: "BEST_BEFORE", length: 6 },
  "17": { name: "EXPIRY", length: 6 },
  "21": { name: "SERIAL", variable: true },
  "30": { name: "VAR_COUNT", variable: true },
  "37": { name: "COUNT", variable: true },
  "91": { name: "INTERNAL", variable: true },
  "92": { name: "INTERNAL", variable: true },
  "400": { name: "ORDER_NUMBER", variable: true },
  "410": { name: "SHIP_TO_LOC", length: 13 },
  "420": { name: "SHIP_TO_POSTAL", variable: true },
};

export function parseBarcode(text: string, format: string): ParsedBarcode {
  const trimmedText = text.trim();

  // Try L-ERP MRP format first
  const rtrResult = parseRTRFormat(trimmedText);
  if (rtrResult.confidence > 0.5) {
    return { ...rtrResult, format };
  }

  // Try GS1-128 format
  const gs1Result = parseGS1Format(trimmedText);
  if (gs1Result.confidence > 0.5) {
    return { ...gs1Result, format };
  }

  // Try to infer from content
  const inferredResult = inferBarcodeType(trimmedText);
  return { ...inferredResult, format };
}

function parseRTRFormat(text: string): Omit<ParsedBarcode, "format"> {
  // Check for L-ERP MRP prefixes
  for (const [type, prefix] of Object.entries(PREFIXES)) {
    if (text.startsWith(prefix)) {
      const value = text.substring(prefix.length);
      const result: Omit<ParsedBarcode, "format"> = {
        entityType: type as EntityType,
        entityId: value,
        raw: text,
        confidence: 0.9,
      };

      // Set specific field based on type
      switch (type) {
        case "PART":
          result.partNumber = value;
          break;
        case "LOCATION":
          result.locationCode = value;
          break;
        case "WORK_ORDER":
          result.workOrderNumber = text;
          break;
        case "PURCHASE_ORDER":
          result.purchaseOrderNumber = text;
          break;
        case "SALES_ORDER":
          result.salesOrderNumber = text;
          break;
        case "LOT":
          result.lotNumber = value;
          break;
        case "SERIAL":
          result.serialNumber = value;
          break;
      }

      return result;
    }
  }

  return {
    entityType: "UNKNOWN",
    raw: text,
    confidence: 0,
  };
}

function parseGS1Format(text: string): Omit<ParsedBarcode, "format"> {
  // GS1-128 uses FNC1 (ASCII 29) as separator, often represented as ]C1 or just parsed
  const result: Omit<ParsedBarcode, "format"> = {
    entityType: "UNKNOWN",
    raw: text,
    confidence: 0,
  };

  // Check if it looks like GS1
  if (!text.match(/^\d{2}/)) {
    return result;
  }

  let pos = 0;
  const parsed: Record<string, string> = {};

  while (pos < text.length) {
    // Try 3-digit AIs first
    let ai = text.substring(pos, pos + 3);
    let aiInfo = GS1_AI[ai as keyof typeof GS1_AI];

    if (!aiInfo) {
      // Try 2-digit AIs
      ai = text.substring(pos, pos + 2);
      aiInfo = GS1_AI[ai as keyof typeof GS1_AI];
    }

    if (!aiInfo) {
      break;
    }

    pos += ai.length;

    let value: string;
    if ("length" in aiInfo && aiInfo.length) {
      value = text.substring(pos, pos + aiInfo.length);
      pos += aiInfo.length;
    } else {
      // Variable length - look for FNC1 (GS char) or end
      const gsPos = text.indexOf("\x1D", pos);
      if (gsPos !== -1) {
        value = text.substring(pos, gsPos);
        pos = gsPos + 1;
      } else {
        value = text.substring(pos);
        pos = text.length;
      }
    }

    parsed[ai] = value;
  }

  // Map GS1 data to our format
  if (Object.keys(parsed).length > 0) {
    result.confidence = 0.8;

    if (parsed["01"]) {
      result.partNumber = parsed["01"];
      result.entityType = "PART";
    }
    if (parsed["10"]) {
      result.lotNumber = parsed["10"];
      if (result.entityType === "UNKNOWN") {
        result.entityType = "LOT";
      }
    }
    if (parsed["21"]) {
      result.serialNumber = parsed["21"];
      if (result.entityType === "UNKNOWN") {
        result.entityType = "SERIAL";
      }
    }
    if (parsed["30"] || parsed["37"]) {
      result.quantity = parseInt(parsed["30"] || parsed["37"], 10);
    }
    if (parsed["400"]) {
      result.purchaseOrderNumber = parsed["400"];
      result.entityType = "PURCHASE_ORDER";
    }
  }

  return result;
}

function inferBarcodeType(text: string): Omit<ParsedBarcode, "format"> {
  const result: Omit<ParsedBarcode, "format"> = {
    entityType: "UNKNOWN",
    raw: text,
    confidence: 0.3,
  };

  // Try to match patterns
  // Work Order pattern: WO-YYYY-NNN
  if (/^WO-\d{4}-\d{3,}$/i.test(text)) {
    result.entityType = "WORK_ORDER";
    result.workOrderNumber = text;
    result.confidence = 0.8;
    return result;
  }

  // Purchase Order pattern: PO-YYYY-NNN
  if (/^PO-\d{4}-\d{3,}$/i.test(text)) {
    result.entityType = "PURCHASE_ORDER";
    result.purchaseOrderNumber = text;
    result.confidence = 0.8;
    return result;
  }

  // Sales Order pattern: SO-YYYY-NNN or numeric
  if (/^SO-\d{4}-\d{3,}$/i.test(text) || /^\d{5,}$/.test(text)) {
    result.entityType = "SALES_ORDER";
    result.salesOrderNumber = text;
    result.confidence = 0.6;
    return result;
  }

  // Location pattern: often alphanumeric like A-01-02-03
  if (/^[A-Z]-\d{2}-\d{2}(-\d{2})?$/i.test(text)) {
    result.entityType = "LOCATION";
    result.locationCode = text;
    result.confidence = 0.7;
    return result;
  }

  // Lot number pattern: often has date component
  if (/^L\d{6,}$/i.test(text) || /^LOT\d+$/i.test(text)) {
    result.entityType = "LOT";
    result.lotNumber = text;
    result.confidence = 0.7;
    return result;
  }

  // Serial number pattern: alphanumeric, often long
  if (/^[A-Z0-9]{10,}$/i.test(text) && text.match(/[A-Z]/i) && text.match(/\d/)) {
    result.entityType = "SERIAL";
    result.serialNumber = text;
    result.confidence = 0.5;
    return result;
  }

  // Part number: default fallback for alphanumeric
  if (/^[A-Z0-9-]+$/i.test(text) && text.length >= 3) {
    result.entityType = "PART";
    result.partNumber = text;
    result.confidence = 0.4;
    return result;
  }

  return result;
}

// Generate barcode value for an entity
export function generateBarcodeValue(
  entityType: EntityType,
  entityId: string,
  options?: {
    lotNumber?: string;
    serialNumber?: string;
    quantity?: number;
  }
): string {
  const prefix = PREFIXES[entityType] || "";
  let value = `${prefix}${entityId}`;

  // For QR codes, we can embed more data
  if (options?.lotNumber) {
    value += `|LOT:${options.lotNumber}`;
  }
  if (options?.serialNumber) {
    value += `|SN:${options.serialNumber}`;
  }
  if (options?.quantity) {
    value += `|QTY:${options.quantity}`;
  }

  return value;
}

// Parse a complex barcode value with embedded data
export function parseComplexBarcode(text: string): ParsedBarcode {
  const parts = text.split("|");
  const mainPart = parts[0];
  const format = "COMPLEX";

  // Parse main part
  const result = parseBarcode(mainPart, format);

  // Parse additional data
  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split(":");
    if (key && value) {
      switch (key.toUpperCase()) {
        case "LOT":
          result.lotNumber = value;
          break;
        case "SN":
          result.serialNumber = value;
          break;
        case "QTY":
          result.quantity = parseInt(value, 10);
          break;
      }
    }
  }

  return result;
}
