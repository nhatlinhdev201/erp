"use client"

import { useState } from "react"
import { FileText, Search, CheckCircle2, XCircle, Clock, CalendarClock } from "lucide-react"
import { useContracts, useUpdateContractStatus, useDeleteContract, type ContractFilters } from "@/hooks/use-contracts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/ui/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

const CONTRACT_TYPES: Record<string, string> = {
  PROBATION: "Thử việc",
  DEFINITE_TERM: "Xác định thời hạn",
  INDEFINITE_TERM: "Không xác định thời hạn",
  SEASONAL: "Thời vụ",
  PART_TIME: "Bán thời gian",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  ACTIVE: { label: "Hiệu lực", variant: "default" },
  EXPIRED: { label: "Hết hạn", variant: "outline" },
  TERMINATED: { label: "Chấm dứt", variant: "destructive" },
}

function formatDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("vi-VN")
}

function formatSalary(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v
  if (Number.isNaN(n)) return "—"
  return n.toLocaleString("vi-VN") + " ₫"
}

function daysUntil(d: string | null): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

export default function ContractsPage() {
  const [filters, setFilters] = useState<ContractFilters>({})
  const [searchInput, setSearchInput] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [onlyExpiring, setOnlyExpiring] = useState(false)

  const effectiveFilters: ContractFilters = {
    ...filters,
    search: searchInput || undefined,
    expiringInDays: onlyExpiring ? 30 : undefined,
  }

  const { data, isLoading } = useContracts(effectiveFilters)
  const updateStatus = useUpdateContractStatus()
  const deleteContract = useDeleteContract()

  const contracts = data?.data ?? []
  const stats = data?.meta?.statusCounts ?? {}
  const total = data?.pagination?.total ?? contracts.length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Hợp đồng lao động"
        description={`Quản lý hợp đồng của nhân sự — ${total} hợp đồng`}
      />

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Tổng hợp đồng"
          value={Object.values(stats).reduce((a, b) => a + b, 0)}
          icon={FileText}
        />
        <MetricCard title="Đang hiệu lực" value={stats.ACTIVE ?? 0} icon={CheckCircle2} />
        <MetricCard title="Sắp hết hạn (30 ngày)" value={data?.meta?.expiringCount ?? 0} icon={CalendarClock} />
        <MetricCard title="Đã chấm dứt / hết hạn" value={(stats.TERMINATED ?? 0) + (stats.EXPIRED ?? 0)} icon={XCircle} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo số HĐ, mã NV, tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status || "ALL"}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "ALL" ? undefined : v }))}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, c]) => (
              <SelectItem key={k} value={k}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type || "ALL"}
          onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "ALL" ? undefined : v }))}
        >
          <SelectTrigger className="w-56"><SelectValue placeholder="Loại hợp đồng" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            {Object.entries(CONTRACT_TYPES).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={onlyExpiring ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyExpiring((v) => !v)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Chỉ sắp hết hạn
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner label="Đang tải hợp đồng..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Không có hợp đồng"
          description="Không tìm thấy hợp đồng nào khớp bộ lọc hiện tại."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số HĐ</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Hiệu lực</TableHead>
                <TableHead>Ngày hết hạn</TableHead>
                <TableHead className="text-right">Lương cơ bản</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const days = daysUntil(c.endDate)
                const expiringSoon = c.status === "ACTIVE" && days !== null && days >= 0 && days <= 30
                const statusCfg = STATUS_CONFIG[c.status] ?? { label: c.status, variant: "secondary" as const }
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.contractNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{c.employee?.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.employee?.employeeCode}
                        {c.employee?.position?.name ? ` · ${c.employee.position.name}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{CONTRACT_TYPES[c.contractType] ?? c.contractType}</TableCell>
                    <TableCell>{formatDate(c.startDate)}</TableCell>
                    <TableCell>
                      {formatDate(c.endDate)}
                      {expiringSoon && (
                        <span className="ml-2 text-xs font-medium text-amber-500">
                          còn {days} ngày
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatSalary(c.baseSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.status !== "ACTIVE" && (
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: c.id, status: "ACTIVE" })}>
                              Kích hoạt hiệu lực
                            </DropdownMenuItem>
                          )}
                          {c.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus.mutate({
                                  id: c.id,
                                  status: "TERMINATED",
                                  terminationReason: "Chấm dứt qua màn hình Hợp đồng",
                                })
                              }
                            >
                              Chấm dứt hợp đồng
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}>
                            Xoá hợp đồng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xoá hợp đồng?"
        description="Hành động này không thể hoàn tác. Hợp đồng sẽ bị xoá vĩnh viễn."
        onConfirm={() => {
          if (deleteId) deleteContract.mutate(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
