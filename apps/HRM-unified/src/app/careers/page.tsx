'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  ChevronRight,
} from 'lucide-react'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default'

interface JobListing {
  id: string
  slug: string
  title: string
  department: string
  location: string
  jobType: string
  workMode: string
  salaryDisplay: string | null
  publishedAt: string
  expiresAt: string | null
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERNSHIP: 'Thực tập',
  TEMPORARY: 'Tạm thời',
}

const WORK_MODE_LABELS: Record<string, string> = {
  ONSITE: 'Onsite',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    async function fetchJobs() {
      try {
        const params = new URLSearchParams({ tenantId: TENANT_ID })
        if (search) params.set('search', search)
        if (departmentFilter) params.set('department', departmentFilter)
        if (locationFilter) params.set('location', locationFilter)

        const res = await fetch(`/api/public/careers?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setJobs(json.data || json)
        }
      } catch {
        // Silent fail for public page
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [search, departmentFilter, locationFilter])

  const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))
  const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Cơ hội nghề nghiệp
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Tham gia đội ngũ của chúng tôi và cùng nhau xây dựng tương lai.
              Khám phá các vị trí đang tuyển dụng.
            </p>
            <div className="flex items-center gap-6 justify-center pt-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>Môi trường chuyên nghiệp</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span>Phát triển sự nghiệp</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm vị trí, kỹ năng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6 sticky top-6">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>

              {departments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phòng ban</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {locations.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Địa điểm</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  {jobs.length} vị trí đang tuyển
                </p>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có vị trí phù hợp
                </h3>
                <p className="text-gray-500">
                  Hiện tại chưa có vị trí nào phù hợp với tiêu chí tìm kiếm.
                  Hãy thử lại với từ khóa khác.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/careers/${job.slug}`}>
                    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {WORK_MODE_LABELS[job.workMode] || job.workMode}
                            </span>
                          </div>
                          {job.salaryDisplay && (
                            <p className="text-sm font-medium text-green-600">
                              {job.salaryDisplay}
                            </p>
                          )}
                          {job.expiresAt && (
                            <p className="text-xs text-gray-400">
                              Hạn nộp: {new Date(job.expiresAt).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>Powered by L-ERP HRM</p>
        </div>
      </footer>
    </div>
  )
}
