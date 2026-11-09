"use client"

import { useState } from "react"
import { Settings2, ListOrdered, Plus, Trash2, Save, RotateCcw } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MetricCard } from "@/components/ui/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface WorkflowStep {
  id: string
  stepOrder: number
  name: string
  approverType: string
  specificRole?: string | null
  slaHours?: number | null
  canSkip: boolean
  approvalMode: string
}

interface WorkflowDefinition {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
  version: number
  steps: WorkflowStep[]
  _count?: { instances: number }
}

const APPROVER_LABELS: Record<string, string> = {
  DIRECT_MANAGER: "Quản lý trực tiếp",
  DEPARTMENT_HEAD: "Trưởng phòng",
  HR_MANAGER: "HR Manager",
  SPECIFIC_USER: "Người chỉ định",
  ROLE_BASED: "Theo vai trò",
}

const MODE_LABELS: Record<string, string> = {
  SEQUENTIAL: "Tuần tự",
  PARALLEL: "Song song",
  QUORUM: "Đa số",
}

const BLANK_STEP = {
  name: "",
  approverType: "HR_MANAGER",
  slaHours: 24,
  canSkip: false,
  approvalMode: "SEQUENTIAL",
}

type EditableStep = typeof BLANK_STEP & { id?: string }

async function fetchWorkflows(): Promise<WorkflowDefinition[]> {
  const res = await fetch("/api/leave/workflow")
  if (!res.ok) throw new Error("Không thể tải cấu hình workflow")
  const json = await res.json()
  return json.data ?? json
}

export default function LeaveSettingsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<WorkflowDefinition | null>(null)
  const [editSteps, setEditSteps] = useState<EditableStep[]>([])
  const [creating, setCreating] = useState(false)
  const [newDef, setNewDef] = useState({ name: "", code: "", description: "" })

  const { data, isLoading } = useQuery({ queryKey: ["leave-workflows"], queryFn: fetchWorkflows })
  const workflows = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leave-workflows"] })

  const patchMutation = useMutation({
    mutationFn: async ({ id, ...body }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/leave/workflow/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể lưu cấu hình")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã lưu cấu hình workflow")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const createMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await fetch("/api/leave/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể tạo workflow")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã tạo workflow mới")
      setCreating(false)
      setNewDef({ name: "", code: "", description: "" })
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/workflow/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể xoá workflow")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã xoá workflow")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openEdit = (wf: WorkflowDefinition) => {
    setEditing(wf)
    setEditSteps(
      wf.steps.map((s) => ({
        id: s.id,
        name: s.name,
        approverType: s.approverType,
        slaHours: s.slaHours ?? 24,
        canSkip: s.canSkip,
        approvalMode: s.approvalMode,
      }))
    )
  }

  const saveSteps = () => {
    if (!editing) return
    if (editSteps.some((s) => !s.name.trim())) {
      toast.error("Mỗi bước cần có tên")
      return
    }
    patchMutation.mutate({ id: editing.id, steps: editSteps })
    setEditing(null)
  }

  const totalSteps = workflows.reduce((a, w) => a + w.steps.length, 0)
  const activeCount = workflows.filter((w) => w.isActive).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cấu hình nghỉ phép"
        description="Quy trình phê duyệt đơn nghỉ theo từng bước"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Số quy trình" value={workflows.length} icon={<ListOrdered className="w-5 h-5" />} />
        <MetricCard title="Đang kích hoạt" value={activeCount} icon={<Settings2 className="w-5 h-5" />} />
        <MetricCard title="Tổng số bước duyệt" value={totalSteps} icon={<ListOrdered className="w-5 h-5" />} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Thêm quy trình
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Đang tải cấu hình..." />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="Chưa có quy trình duyệt nào"
          description="Tạo quy trình để định tuyến đơn nghỉ qua các cấp phê duyệt."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{wf.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {wf.code} · v{wf.version}
                      {wf._count ? ` · ${wf._count.instances} lần chạy` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={wf.isActive ? "default" : "secondary"}>
                      {wf.isActive ? "Đang chạy" : "Tắt"}
                    </Badge>
                    <Switch
                      checked={wf.isActive}
                      onCheckedChange={(v) => patchMutation.mutate({ id: wf.id, isActive: v })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {wf.description && <p className="text-sm text-muted-foreground">{wf.description}</p>}
                <ol className="space-y-2">
                  {wf.steps.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {s.stepOrder}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {APPROVER_LABELS[s.approverType] ?? s.approverType}
                            {s.slaHours ? ` · SLA ${s.slaHours}h` : ""}
                            {s.canSkip ? " · được bỏ qua" : ""}
                            {` · ${MODE_LABELS[s.approvalMode] ?? s.approvalMode}`}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-between pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(wf)}>
                    Sửa các bước
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(wf.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Xoá
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog sửa steps */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa bước duyệt — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-auto">
            {editSteps.map((s, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_170px_90px_auto] items-center gap-2 rounded-md border p-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                <Input
                  placeholder="Tên bước"
                  value={s.name}
                  onChange={(e) => setEditSteps((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <Select
                  value={s.approverType}
                  onValueChange={(v) => setEditSteps((arr) => arr.map((x, j) => (j === i ? { ...x, approverType: v } : x)))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPROVER_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="h-8 w-16"
                    value={s.slaHours ?? ""}
                    onChange={(e) => setEditSteps((arr) => arr.map((x, j) => (j === i ? { ...x, slaHours: Number(e.target.value) } : x)))}
                    title="SLA (giờ)"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={s.canSkip}
                    onCheckedChange={(v) => setEditSteps((arr) => arr.map((x, j) => (j === i ? { ...x, canSkip: v } : x)))}
                    title="Cho phép bỏ qua"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setEditSteps((arr) => arr.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditSteps((arr) => [...arr, { ...BLANK_STEP }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Thêm bước
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              <RotateCcw className="mr-1 h-4 w-4" /> Huỷ
            </Button>
            <Button onClick={saveSteps} disabled={patchMutation.isPending}>
              <Save className="mr-1 h-4 w-4" /> Lưu {editSteps.length} bước
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tạo mới */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo quy trình duyệt nghỉ phép</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tên quy trình *</Label>
              <Input value={newDef.name} onChange={(e) => setNewDef((d) => ({ ...d, name: e.target.value }))} placeholder="VD: Duyệt nghỉ phép chuẩn" />
            </div>
            <div>
              <Label>Mã (code) *</Label>
              <Input
                value={newDef.code}
                onChange={(e) => setNewDef((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
                placeholder="VD: LEAVE_V2"
                className="font-mono"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input value={newDef.description} onChange={(e) => setNewDef((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">
              Quy trình mới bắt đầu với 1 bước "HR Manager duyệt" — bấm "Sửa các bước" sau khi tạo để thêm cấp duyệt.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Đóng</Button>
            <Button
              disabled={!newDef.name.trim() || !newDef.code.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  ...newDef,
                  steps: [{ name: "HR Manager duyệt", approverType: "HR_MANAGER", slaHours: 24, canSkip: false, approvalMode: "SEQUENTIAL" }],
                })
              }
            >
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
