import type { Metadata } from "next";
import { User, Building, Bell, Warehouse, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Settings | L-ERP MRP',
  description: 'System settings for account, security, notifications, and warehouse configuration - Cài đặt hệ thống, tài khoản, bảo mật, thông báo và kho hàng',
};

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and system preferences"
      />

      <div className="grid gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{session?.user?.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{session?.user?.role || "User"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company
            </CardTitle>
            <CardDescription>Organization settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">L-ERP (L-ERP)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">Machine Manufacturing</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">USD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Settings */}
        <Link href="/settings/warehouse">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Warehouse Flow
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Configure WIP, FG, and Shipping warehouse flows with feature flags</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
