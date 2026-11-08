'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  DollarSign,
  Share2,
} from 'lucide-react'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default'

interface JobDetail {
  id: string
  slug: string
  title: string
  department: string
  location: string
  jobType: string
  workMode: string
  description: string
  requirements: string
  benefits: string
  salaryMin: number | null
  salaryMax: number | null
  showSalary: boolean
  publishedAt: string
  closingDate: string | null
  companyName: string
  companyDescription: string
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERNSHIP: 'Thực tập',
  TEMPORARY: 'Tạm thời',
}

const WORK_MODE_LABELS: Record<string, string> = {
  ONSITE: 'Làm việc tại văn phòng',
  REMOTE: 'Làm việc từ xa',
  HYBRID: 'Kết hợp',
}

export default function JobDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/public/careers/${slug}?tenantId=${TENANT_ID}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const json = await res.json()
        setJob(json)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchJob()
  }, [slug])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép đường dẫn!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Briefcase className="h-16 w-16 text-gray-300 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">
            Không tìm thấy vị trí
          </h1>
          <p className="text-gray-500">
            Vị trí này có thể đã hết hạn hoặc không tồn tại.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/careers"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Tất cả vị trí</span>
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Chia sẻ</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Title Section */}
            <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                {job.department && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {job.department}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {WORK_MODE_LABELS[job.workMode] || job.workMode}
                </span>
              </div>
              {job.showSalary && job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <DollarSign className="h-5 w-5" />
                  <span>
                    {job.salaryMin.toLocaleString('vi-VN')} - {job.salaryMax.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
              <div className="mt-6">
                <Link
                  href={`/careers/apply/${job.slug}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Ứng tuyển ngay
                </Link>
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Mô tả công việc
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Yêu cầu ứng viên
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Quyền lợi
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
                  {job.benefits}
                </div>
              </div>
            )}

            {/* Apply CTA */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bạn quan tâm vị trí này?
              </h3>
              <p className="text-gray-600 mb-4">
                Hãy gửi hồ sơ ứng tuyển của bạn ngay hôm nay!
              </p>
              <Link
                href={`/careers/apply/${job.slug}`}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Ứng tuyển ngay
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* Job Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Tóm tắt</h3>
                <div className="space-y-3 text-sm">
                  {job.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Phòng ban</span>
                      <span className="font-medium">{job.department}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Loại hình</span>
                    <span className="font-medium">
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Hình thức</span>
                    <span className="font-medium">
                      {WORK_MODE_LABELS[job.workMode] || job.workMode}
                    </span>
                  </div>
                  {job.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Địa điểm</span>
                      <span className="font-medium">{job.location}</span>
                    </div>
                  )}
                  {job.publishedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Ngày đăng</span>
                      <span className="font-medium">
                        {new Date(job.publishedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {job.closingDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Hạn nộp</span>
                      <span className="font-medium text-orange-600">
                        {new Date(job.closingDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info */}
              {(job.companyName || job.companyDescription) && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    {job.companyName || 'Về công ty'}
                  </h3>
                  {job.companyDescription && (
                    <p className="text-sm text-gray-600">{job.companyDescription}</p>
                  )}
                </div>
              )}

              {/* Apply Button */}
              <Link
                href={`/careers/apply/${job.slug}`}
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Ứng tuyển ngay
              </Link>
            </div>
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
