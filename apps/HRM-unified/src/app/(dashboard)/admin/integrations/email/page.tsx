'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig>({ host: '', port: 587, secure: false, user: '', pass: '', from: '' })
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [templates, setTemplates] = useState<{ id: string; code: string; name: string; isActive: boolean }[]>([])

  useEffect(() => {
    fetch('/api/admin/email/config').then(r => r.json()).then(r => { if (r.data) setConfig(r.data) })
    fetch('/api/admin/email/templates').then(r => r.json()).then(r => setTemplates(r.data || []))
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    await fetch('/api/admin/email/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, testConnection: true }),
    })
    setSaving(false)
    alert('Đã lưu cấu hình!')
  }

  const sendTest = async () => {
    if (!testEmail) return
    const res = await fetch('/api/admin/email/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmail }),
    })
    const data = await res.json()
    alert(data.success ? 'Gửi thành công!' : `Lỗi: ${data.error}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cấu hình Email</h1>

      <Card>
        <CardHeader><CardTitle>SMTP Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input type="number" value={config.port} onChange={e => setConfig({ ...config, port: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={config.pass} onChange={e => setConfig({ ...config, pass: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">From</label>
              <Input value={config.from} onChange={e => setConfig({ ...config, from: e.target.value })} placeholder="L-ERP HRM <noreply@your-domain.com>" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={config.secure} onChange={e => setConfig({ ...config, secure: e.target.checked })} />
            <label className="text-sm">SSL/TLS</label>
          </div>
          <Button onClick={saveConfig} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu & Test Connection'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Test Email</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="email@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          <Button onClick={sendTest}>Gửi test</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({t.code})</span>
                </div>
                <Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
