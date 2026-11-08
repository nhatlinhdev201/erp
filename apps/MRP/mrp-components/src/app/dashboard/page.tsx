'use client'

import React, { useState } from 'react'
import { Download, RefreshCw, Plus } from 'lucide-react'
import {
  MainLayout,
  Toolbar,
  Button,
  KPICard,
  Card,
  CardHeader,
  CardBody,
  StatusDot,
  Badge,
  ProgressBar,
  AlertItem,
  DataTable,
  type Column,
  type SortDirection,
} from '@/components'

/* ═══════════════════════════════════════════════════════════════════════════════
   L-ERP MRP DASHBOARD PAGE
   Industrial Precision Theme
   ═══════════════════════════════════════════════════════════════════════════════ */

// Work Order type
interface WorkOrder {
  id: string
  code: string
  product: string
  quantity: number
  progress: number
  status: 'active' | 'pending' | 'overdue' | 'completed'
  dueDate: string
}

// Sample data
const workOrders: WorkOrder[] = [
  {
    id: '1',
    code: 'WO-2024-0892',
    product: 'Bearing Assembly A1',
    quantity: 500,
    progress: 85,
    status: 'active',
    dueDate: '15/01/2026',
  },
  {
    id: '2',
    code: 'WO-2024-0891',
    product: 'Shaft Component B2',
    quantity: 1200,
    progress: 45,
    status: 'pending',
    dueDate: '18/01/2026',
  },
  {
    id: '3',
    code: 'WO-2024-0890',
    product: 'Housing Unit C3',
    quantity: 300,
    progress: 20,
    status: 'overdue',
    dueDate: '10/01/2026',
  },
  {
    id: '4',
    code: 'WO-2024-0889',
    product: 'Gear Set D4',
    quantity: 800,
    progress: 100,
    status: 'completed',
    dueDate: '12/01/2026',
  },
  {
    id: '5',
    code: 'WO-2024-0888',
    product: 'Motor Assembly E5',
    quantity: 150,
    progress: 60,
    status: 'active',
    dueDate: '20/01/2026',
  },
]

// Alert data
const alerts = [
  {
    id: '1',
    severity: 'critical' as const,
    title: 'Ton kho thap: PN-2024-0234',
    description: 'Bearing 6205 · Con 23 units',
    timestamp: '5 phut truoc',
  },
  {
    id: '2',
    severity: 'critical' as const,
    title: 'WO-2024-0890 tre han',
    description: 'Housing Unit C3 · Tre 4 ngay',
    timestamp: '1 gio truoc',
  },
  {
    id: '3',
    severity: 'warning' as const,
    title: 'QC can xac nhan',
    description: 'LOT-2024-0567 · 3 items cho kiem',
    timestamp: '2 gio truoc',
  },
  {
    id: '4',
    severity: 'info' as const,
    title: 'PO-2024-0123 da giao',
    description: 'Supplier ABC · 500 units',
    timestamp: '3 gio truoc',
  },
]

// Table columns - PRESERVE EXCEL-LIKE STRUCTURE
const columns: Column<WorkOrder>[] = [
  {
    key: 'code',
    header: 'Ma lenh',
    sortable: true,
    className: 'font-mono',
  },
  {
    key: 'product',
    header: 'San pham',
    sortable: true,
  },
  {
    key: 'quantity',
    header: 'So luong',
    align: 'right',
    sortable: true,
    render: (value) => value.toLocaleString(),
  },
  {
    key: 'progress',
    header: 'Tien do',
    width: 140,
    render: (value) => <ProgressBar value={value} size="sm" />,
  },
  {
    key: 'status',
    header: 'Trang thai',
    render: (value, row) => {
      if (value === 'completed') {
        return <Badge variant="success">Hoan thanh</Badge>
      }
      const statusLabels: Record<string, string> = {
        active: 'Dang SX',
        pending: 'Cho NVL',
        overdue: 'Tre han',
      }
      return <StatusDot status={value} label={statusLabels[value]} />
    },
  },
  {
    key: 'dueDate',
    header: 'Han',
    sortable: true,
  },
]

export default function DashboardPage() {
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set())
  const [sortColumn, setSortColumn] = useState<string>()
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return workOrders

    return [...workOrders].sort((a, b) => {
      const aValue = a[sortColumn as keyof WorkOrder]
      const bValue = b[sortColumn as keyof WorkOrder]

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [sortColumn, sortDirection])

  return (
    <MainLayout
      activeNavId="dashboard"
      userName="Admin"
      userInitials="AD"
      notificationCount={3}
      statusBarProps={{
        status: 'online',
        statusText: 'He thong hoat dong binh thuong',
        lastUpdate: '14/01/2026 15:42',
        version: 'v1.0.0',
      }}
    >
      {/* Toolbar */}
      <Toolbar title="Tong quan san xuat">
        <Button variant="ghost" icon={Download} size="sm">
          Xuat bao cao
        </Button>
        <Button variant="secondary" icon={RefreshCw} size="sm">
          Lam moi
        </Button>
      </Toolbar>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Lenh san xuat"
            value="234"
            delta={{ value: '+12 so voi tuan truoc', type: 'positive' }}
          />
          <KPICard
            label="Ty le dung han"
            value="94.2%"
            delta={{ value: '-1.3% so voi tuan truoc', type: 'negative' }}
          />
          <KPICard
            label="Gia tri ton kho"
            value="D2.4B"
            delta={{ value: '+5.2% so voi tuan truoc', type: 'positive' }}
          />
          <KPICard
            label="Canh bao"
            value="12"
            delta={{ value: '3 nghiem trong', type: 'negative' }}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 flex-1">
          {/* Work Orders Table */}
          <Card>
            <CardHeader
              title="Lenh san xuat gan day"
              action={
                <Button variant="primary" icon={Plus} size="sm">
                  Tao lenh
                </Button>
              }
            />
            <CardBody noPadding>
              <DataTable
                columns={columns}
                data={sortedData}
                keyField="id"
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </CardBody>
          </Card>

          {/* Alerts Panel */}
          <Card>
            <CardHeader
              title="Canh bao he thong"
              action={<Badge variant="danger">12 moi</Badge>}
            />
            <CardBody noPadding>
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  severity={alert.severity}
                  title={alert.title}
                  description={alert.description}
                  timestamp={alert.timestamp}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
