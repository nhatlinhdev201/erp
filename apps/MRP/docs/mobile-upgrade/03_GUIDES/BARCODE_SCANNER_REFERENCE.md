# 📷 BARCODE SCANNER - QUICK REFERENCE
## L-ERP MRP Mobile

---

## 🎯 SUPPORTED FORMATS

| Format | Example | Use Case |
|--------|---------|----------|
| CODE128 | `RTR-PART-001` | Parts, Locations |
| CODE39 | `*WO-2024-001*` | Work Orders |
| QR Code | JSON/URL | Multi-field data |
| EAN-13 | `5901234123457` | Commercial products |

---

## 🔧 IMPLEMENTATION

### 1. Install Dependencies
```bash
npm install @zxing/library @zxing/browser
```

### 2. Scanner Component Template

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export function BarcodeScanner({ onScan }: { onScan: (data: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      readerRef.current?.reset();
    };
  }, []);

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current) return;
    
    try {
      setIsScanning(true);
      
      await readerRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            // Vibrate on success
            if ('vibrate' in navigator) {
              navigator.vibrate(100);
            }
            onScan(result.getText());
          }
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    readerRef.current?.reset();
    setIsScanning(false);
  };

  return (
    <div className="relative">
      <video 
        ref={videoRef}
        className="w-full h-64 object-cover rounded-lg"
      />
      
      {/* Scanning Frame Overlay */}
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-blue-500 rounded-lg">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="mt-4 flex gap-2">
        {!isScanning ? (
          <button 
            onClick={startScanning}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium"
          >
            Bắt đầu quét
          </button>
        ) : (
          <button 
            onClick={stopScanning}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium"
          >
            Dừng quét
          </button>
        )}
      </div>
    </div>
  );
}
```

### 3. Barcode Parser

```typescript
// lib/mobile/barcode-parser.ts

export type BarcodeType = 'PART' | 'LOCATION' | 'WORK_ORDER' | 'PO' | 'UNKNOWN';

export interface ParsedBarcode {
  type: BarcodeType;
  value: string;
  raw: string;
}

export function parseBarcode(data: string): ParsedBarcode {
  // Remove whitespace
  const cleaned = data.trim().toUpperCase();
  
  // Part number pattern: RTR-xxx-xxx or P-xxxxx
  if (/^(RTR-|P-)\w+/.test(cleaned)) {
    return { type: 'PART', value: cleaned, raw: data };
  }
  
  // Work Order pattern: WO-yyyy-xxxxx
  if (/^WO-\d{4}-\d+/.test(cleaned)) {
    return { type: 'WORK_ORDER', value: cleaned, raw: data };
  }
  
  // Purchase Order pattern: PO-yyyy-xxxxx
  if (/^PO-\d{4}-\d+/.test(cleaned)) {
    return { type: 'PO', value: cleaned, raw: data };
  }
  
  // Location pattern: WH-xx-Rxx-Cxx-Sxx
  if (/^WH-\w+-R\d+-C\d+-S\d+/.test(cleaned)) {
    return { type: 'LOCATION', value: cleaned, raw: data };
  }
  
  // Unknown
  return { type: 'UNKNOWN', value: cleaned, raw: data };
}
```

### 4. Haptic Feedback

```typescript
// lib/mobile/haptics.ts

export const Haptics = {
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100); // Short vibration
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Double vibration
    }
  },
  
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]); // Triple short
    }
  }
};

export const Sounds = {
  beepSuccess: () => {
    const audio = new Audio('/sounds/beep-success.mp3');
    audio.play().catch(() => {}); // Ignore errors
  },
  
  beepError: () => {
    const audio = new Audio('/sounds/beep-error.mp3');
    audio.play().catch(() => {});
  }
};
```

---

## 📱 MOBILE UI PATTERNS

### Scan Result Card

```tsx
interface ScanResultProps {
  type: BarcodeType;
  value: string;
  entity?: {
    name: string;
    description: string;
    quantity?: number;
  };
  onAction: (action: string) => void;
}

export function ScanResultCard({ type, value, entity, onAction }: ScanResultProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      {/* Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          type === 'PART' && "bg-blue-100 text-blue-700",
          type === 'LOCATION' && "bg-green-100 text-green-700",
          type === 'WORK_ORDER' && "bg-purple-100 text-purple-700",
          type === 'PO' && "bg-orange-100 text-orange-700",
        )}>
          {type}
        </span>
        <span className="font-mono text-sm">{value}</span>
      </div>
      
      {/* Entity Info */}
      {entity && (
        <div className="mb-4">
          <h3 className="font-medium">{entity.name}</h3>
          <p className="text-sm text-gray-500">{entity.description}</p>
          {entity.quantity !== undefined && (
            <p className="text-lg font-bold mt-1">
              Tồn kho: {entity.quantity}
            </p>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {type === 'PART' && (
          <>
            <button onClick={() => onAction('adjust')} className="btn-action">
              Điều chỉnh
            </button>
            <button onClick={() => onAction('transfer')} className="btn-action">
              Chuyển vị trí
            </button>
          </>
        )}
        {type === 'WORK_ORDER' && (
          <>
            <button onClick={() => onAction('start')} className="btn-action">
              Bắt đầu
            </button>
            <button onClick={() => onAction('complete')} className="btn-action">
              Hoàn thành
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### Touch-Friendly Quantity Input

```tsx
export function QuantityInput({ 
  value, 
  onChange, 
  min = 0, 
  max = 9999 
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-14 h-14 rounded-full bg-gray-200 text-2xl font-bold"
      >
        -
      </button>
      
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 h-14 text-center text-2xl font-bold border-2 rounded-lg"
        min={min}
        max={max}
      />
      
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-14 h-14 rounded-full bg-blue-500 text-white text-2xl font-bold"
      >
        +
      </button>
    </div>
  );
}
```

---

## 🔌 API INTEGRATION

### Scan Endpoint

```typescript
// app/api/mobile/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBarcode } from '@/lib/mobile/barcode-parser';

export async function POST(req: NextRequest) {
  const { barcode, context } = await req.json();
  
  const parsed = parseBarcode(barcode);
  let entity = null;
  
  switch (parsed.type) {
    case 'PART':
      entity = await prisma.part.findFirst({
        where: { partNumber: parsed.value },
        include: {
          inventory: true,
          category: true
        }
      });
      break;
      
    case 'LOCATION':
      entity = await prisma.location.findFirst({
        where: { code: parsed.value }
      });
      break;
      
    case 'WORK_ORDER':
      entity = await prisma.workOrder.findFirst({
        where: { woNumber: parsed.value },
        include: {
          part: true,
          operations: true
        }
      });
      break;
  }
  
  // Log scan
  await prisma.scanLog.create({
    data: {
      barcodeValue: barcode,
      barcodeType: parsed.type,
      resolvedType: entity ? parsed.type : null,
      resolvedId: entity?.id,
      scanContext: context,
      scannedBy: 'current-user', // Get from session
    }
  });
  
  return NextResponse.json({
    success: true,
    type: parsed.type,
    value: parsed.value,
    entity
  });
}
```

---

## ⚠️ TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Camera không mở | Kiểm tra HTTPS (required for camera) |
| Scanner chậm | Giảm resolution, limit scan area |
| Không đọc được CODE39 | Thêm hints cho reader |
| Haptic không hoạt động | iOS cần user gesture first |
| Audio không phát | Cần user interaction trước |

---

## 📚 RESOURCES

- ZXing Library: https://github.com/zxing-js/library
- MDN MediaDevices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
- Barcode Types: https://www.barcodefaq.com/barcode-types/
