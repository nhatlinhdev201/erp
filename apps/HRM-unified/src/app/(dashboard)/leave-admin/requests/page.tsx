"use client"

import { useState } from "react"
import { CalendarDays, CheckCircle2, XCircle, Clock, Inbox } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/ui/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface LeaveRequestRow {
  id: string
  requestCode: string
  status: string
  startDate: string
  endDate: string
  totalDays: string
  reason: string
  handoverTo?: string | null
  decisionNotes?: string | null
  employee?: { id: string; fullName: string; employeeCode?: string; department?: { name: string } | null }
  policy?: { id: string; name: string }
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  PENDING: { label: "Chờ duyệt", variant: "outline" },
  APPROVED: { label: "Đã duyệt", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "secondary" },
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("vi-VN")
}

async function fetchRequests(status?: string, search?: string): Promise<{ data: LeaveRequestRow[]; pagination?: { total: number } }> {
  const params = new URLSearchParams({ pageSize: "50" })
  if (status) params.set("status", status)
  const res = await fetch(`/api/leave/requests?${params.toString()}`)
  if (!res.ok) throw new Error("Không thể tải danh sách đơn nghỉ")
  const json = await res.json()
  const rows = (json.data ?? json) as LeaveRequestRow[]
  const filtered = search
    ? rows.filter(
        (r) =>
          r.requestCode?.toLowerCase().includes(search.toLowerCase()) ||
          r.employee?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : rows
  return { data: filtered, pagination: json.pagination }
}

export default function LeaveRequestsAdminPage() {
  const [status, setStatus] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [rejectTarget, setRejectTarget] = useState<LeaveRequestRow | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["leave-requests-admin", status],
    queryFn: () => fetchRequests(status === "ALL" ? undefined : status),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leave-requests-admin"] })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Duyệt qua màn hình quản lý" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể phê duyệt")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã phê duyệt đơn nghỉ")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/leave/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể từ chối")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã từ chối đơn nghỉ (trả lại số ngày)")
      setRejectTarget(null)
      setRejectReason("")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/requests/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Hủy bởi quản lý" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể hủy đơn")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã hủy đơn nghỉ")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Load all để tính stats
  const { data: all } = useQuery({
    queryKey: ["leave-requests-admin", "ALL"],
    queryFn: () => fetchRequests(),
  })
  const allRows = all?.data ?? []
  const countBy = (s: string) => allRows.filter((r) => r.status === s).length

  const rows = (data?.data ?? []).filter(
    (r) =>
      !search ||
      r.requestCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee?.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Đơn xin nghỉ phép"
        description="Xem và phê duyệt yêu cầu nghỉ của nhân sự"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Tổng đơn" value={allRows.length} icon={<Inbox className="w-5 h-5" />} />
        <MetricCard title="Chờ duyệt" value={countBy("PENDING")} icon={<Clock className="w-5 h-5" />} />
        <MetricCard title="Đã duyệt" value={countBy("APPROVED")} icon={<CheckCircle2 className="w-5 h-5" />} />
        <MetricCard title="Từ chối / Hủy" value={countBy("REJECTED") + countBy("CANCELLED")} icon={<XCircle className="w-5 h-5" />} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm theo mã đơn, tên nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, c]) => (
              <SelectItem key={k} value={k}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Đang tải đơn nghỉ..." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Không có đơn nghỉ nào"
          description="Chưa có yêu cầu nghỉ phép nào khớp bộ lọc. Nhân viên gửi đơn từ mục ESS → Nghỉ phép."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Loại phép</TableHead>
                <TableHead>Thời gian nghỉ</TableHead>
                <TableHead className="text-right">Số ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, variant: "secondary" as const }
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.requestCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.employee?.fullName ?? "—"}</div>
                      {r.employee?.department?.name && (
                        <div className="text-xs text-muted-foreground">{r.employee.department.name}</div>
                      )}
                    </TableCell>
                    <TableCell>{r.policy?.name ?? "—"}</TableCell>
                    <TableCell>
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(r.totalDays)}</TableCell>
                    <TableCell className="max-w-56 truncate text-sm text-muted-foreground" title={r.reason}>
                      {r.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {r.decisionNotes && (
                        <div className="mt-1 max-w-40 truncate text-[11px] text-muted-foreground" title={r.decisionNotes}>
                          {r.decisionNotes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}>
                            Duyệt
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectTarget(r)}>
                            Từ chối
                          </Button>
                        </div>
                      )}
                      {r.status === "DRAFT" && (
                        <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(r.id)} disabled={cancelMutation.isPending}>
                          Hủy nháp
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog từ chối */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn {rejectTarget?.requestCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do từ chối *</Label>
            <Textarea
              id="reject-reason"
              placeholder="VD: Khoảng thời gian này phòng đang cao điểm..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Số ngày đã giữ ({Number(rejectTarget?.totalDays ?? 0)} ngày) sẽ được trả lại cho nhân viên.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Đóng</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
            >
              Từ chối đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
