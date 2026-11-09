"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface ContractEmployee {
  id: string
  employeeCode: string
  fullName: string
  position: { name: string } | null
}

export interface ContractRow {
  id: string
  contractNumber: string
  contractType: string
  status: string
  startDate: string
  endDate: string | null
  signedDate: string | null
  baseSalary: string
  notes: string | null
  employee: ContractEmployee
}

export interface ContractsResponse {
  data: ContractRow[]
  pagination?: { total: number; page: number; pageSize: number }
  meta?: { statusCounts: Record<string, number>; expiringCount: number }
}

export interface ContractFilters {
  search?: string
  status?: string
  type?: string
  expiringInDays?: number
}

async function fetchContracts(filters: ContractFilters): Promise<ContractsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.status) params.set("status", filters.status)
  if (filters.type) params.set("type", filters.type)
  if (filters.expiringInDays) params.set("expiringInDays", String(filters.expiringInDays))
  params.set("pageSize", "50")

  const res = await fetch(`/api/contracts?${params.toString()}`)
  if (!res.ok) throw new Error("Không thể tải danh sách hợp đồng")
  return res.json()
}

export function useContracts(filters: ContractFilters) {
  return useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => fetchContracts(filters),
  })
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; status?: string; terminationReason?: string; endDate?: string | null }) => {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Không thể cập nhật hợp đồng")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hợp đồng")
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Không thể xoá hợp đồng")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Đã xoá hợp đồng")
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
