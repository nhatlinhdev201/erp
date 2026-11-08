'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default'

interface JobInfo {
  id: string
  slug: string
  title: string
  department: string
  location: string
}

export default function ApplyPage() {
  const params = useParams()
  const slug = params.slug as string

  const [job, setJob] = useState<JobInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    expectedSalary: '',
    yearsOfExperience: '',
  })
  const [cvFileName, setCvFileName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/public/careers/${slug}?tenantId=${TENANT_ID}`)
        if (!res.ok) {
          setError('Không tìm thấy vị trí tuyển dụng')
          return
        }
        const json = await res.json()
        setJob(json)
      } catch {
        setError('Có lỗi xảy ra')
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchJob()
  }, [slug])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCvFileName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/public/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          jobSlug: slug,
          ...formData,
          expectedSalary: formData.expectedSalary
            ? parseInt(formData.expectedSalary)
            : null,
          yearsOfExperience: formData.yearsOfExperience
            ? parseInt(formData.yearsOfExperience)
            : null,
          cvFileName: cvFileName,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Không thể gửi hồ sơ')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {error || 'Không tìm thấy vị trí'}
          </h1>
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4 p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nộp hồ sơ thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã ứng tuyển vị trí <strong>{job.title}</strong>.
            Chúng tôi sẽ xem xét hồ sơ và liên hệ với bạn trong thời gian sớm nhất.
          </p>
          <div className="pt-4">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Xem các vị trí khác
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/careers/${slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Quay lại chi tiết</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Job Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Ứng tuyển: {job.title}
          </h1>
          <p className="text-gray-500 mt-1">
            {job.department} {job.location && `- ${job.location}`}
          </p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Thông tin cá nhân
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0912 345 678"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  Số năm kinh nghiệm
                </label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700">
                Mức lương mong muốn (VND)
              </label>
              <input
                id="expectedSalary"
                type="number"
                value={formData.expectedSalary}
                onChange={(e) => handleChange('expectedSalary', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: 20000000"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Hồ sơ ứng tuyển
            </h2>

            {/* CV Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CV / Resume
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  {cvFileName ? (
                    <p className="text-sm font-medium text-blue-600">{cvFileName}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">
                        Kéo thả hoặc click để tải lên
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX (tối đa 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                Thư xin việc
              </label>
              <textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => handleChange('coverLetter', e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Giới thiệu bản thân, kinh nghiệm liên quan và lý do bạn phù hợp với vị trí này..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-xs text-gray-500">
              Bằng việc nộp hồ sơ, bạn đồng ý cho phép chúng tôi xử lý thông tin cá nhân của bạn
              cho mục đích tuyển dụng.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {submitting ? 'Đang gửi...' : 'Nộp hồ sơ'}
            </button>
          </div>
        </form>
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
