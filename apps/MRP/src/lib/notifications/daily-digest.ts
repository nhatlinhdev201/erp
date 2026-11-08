// src/lib/notifications/daily-digest.ts
// Daily Digest Email Generator
// Collects yesterday's activities and unread notifications into a summary email

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

interface DigestUser {
  id: string;
  email: string;
  name: string | null;
}

interface DigestData {
  user: DigestUser;
  unreadNotifications: number;
  activeSessions: number;
  recentActivities: {
    action: string;
    description: string;
    timestamp: Date;
  }[];
  pendingPOs: number;
  lowStockCount: number;
}

async function collectDigestData(user: DigestUser): Promise<DigestData> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [unreadNotifications, activeSessions, recentActivities, pendingPOs, lowStockCount] =
    await Promise.all([
      // Unread notifications count
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),

      // Active work sessions
      prisma.workSession.count({
        where: { userId: user.id, status: 'ACTIVE' },
      }),

      // Recent activities (last 24h)
      prisma.sessionActivity.findMany({
        where: {
          session: { userId: user.id },
          timestamp: { gt: yesterday },
        },
        select: {
          action: true,
          description: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),

      // Pending PO approvals
      prisma.purchaseOrder.count({
        where: { status: { in: ['pending_approval', 'pending'] } },
      }),

      // Low stock items
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM (
          SELECT p.id
          FROM parts p
          LEFT JOIN inventory i ON i."partId" = p.id
          WHERE p."safetyStock" > 0
          GROUP BY p.id
          HAVING COALESCE(SUM(i.quantity), 0) < p."safetyStock"
        ) sub
      `.then((r) => Number(r[0]?.count ?? 0)),
    ]);

  return {
    user,
    unreadNotifications,
    activeSessions,
    recentActivities,
    pendingPOs,
    lowStockCount,
  };
}

function buildDigestHtml(data: DigestData): string {
  const activityRows = data.recentActivities
    .map(
      (a) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${a.description}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${a.action}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${new Date(a.timestamp).toLocaleTimeString('vi-VN')}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
    <!-- Header -->
    <div style="background:#1a1a2e;color:white;padding:24px;text-align:center;">
      <h1 style="margin:0;font-size:20px;">L-ERP MRP Daily Digest</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Greeting -->
    <div style="padding:20px 24px 0;">
      <p style="margin:0;font-size:14px;color:#333;">Xin chao <strong>${data.user.name || 'User'}</strong>,</p>
      <p style="margin:8px 0 0;font-size:13px;color:#666;">Day la tom tat hoat dong cua ban trong 24 gio qua.</p>
    </div>

    <!-- Stats Cards -->
    <div style="padding:16px 24px;display:flex;gap:12px;">
      <div style="flex:1;background:#f0f9ff;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#0369a1;">${data.unreadNotifications}</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">Thong bao chua doc</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#15803d;">${data.activeSessions}</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">Phien dang mo</div>
      </div>
      <div style="flex:1;background:#fefce8;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#a16207;">${data.pendingPOs}</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">PO cho duyet</div>
      </div>
    </div>

    ${data.lowStockCount > 0 ? `
    <!-- Low Stock Alert -->
    <div style="margin:0 24px;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;">
      <strong style="font-size:13px;color:#991b1b;">Canh bao ton kho:</strong>
      <span style="font-size:13px;color:#991b1b;"> ${data.lowStockCount} san pham duoi safety stock</span>
    </div>
    ` : ''}

    <!-- Recent Activities -->
    ${data.recentActivities.length > 0 ? `
    <div style="padding:16px 24px;">
      <h3 style="margin:0 0 12px;font-size:14px;color:#333;">Hoat dong gan day</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Entity</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Hanh dong</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Thoi gian</th>
          </tr>
        </thead>
        <tbody>${activityRows}</tbody>
      </table>
    </div>
    ` : `
    <div style="padding:16px 24px;text-align:center;color:#999;font-size:13px;">
      Khong co hoat dong nao trong 24 gio qua.
    </div>
    `}

    <!-- Footer -->
    <div style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:11px;color:#999;">
        L-ERP MRP System &bull; Email tu dong &bull; Cau hinh thong bao tai Settings
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildDigestText(data: DigestData): string {
  const lines = [
    `L-ERP MRP Daily Digest - ${new Date().toLocaleDateString('vi-VN')}`,
    '',
    `Xin chao ${data.user.name || 'User'},`,
    '',
    `Thong bao chua doc: ${data.unreadNotifications}`,
    `Phien dang mo: ${data.activeSessions}`,
    `PO cho duyet: ${data.pendingPOs}`,
  ];

  if (data.lowStockCount > 0) {
    lines.push(`CANH BAO: ${data.lowStockCount} san pham duoi safety stock`);
  }

  if (data.recentActivities.length > 0) {
    lines.push('', 'Hoat dong gan day:');
    for (const a of data.recentActivities) {
      lines.push(`  - ${a.description}: ${a.action}`);
    }
  }

  return lines.join('\n');
}

/**
 * Send daily digest emails to all eligible users
 */
export async function sendDailyDigests(): Promise<{ sent: number; skipped: number; errors: number }> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get users with email digest enabled
    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        notifyByEmail: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    for (const user of users) {
      try {
        const data = await collectDigestData(user);

        // Skip if no activity and no unread notifications
        if (
          data.unreadNotifications === 0 &&
          data.recentActivities.length === 0 &&
          data.activeSessions === 0
        ) {
          skipped++;
          continue;
        }

        const html = buildDigestHtml(data);
        const text = buildDigestText(data);

        await emailService.send({
          to: user.email,
          subject: `[L-ERP MRP] Daily Digest - ${new Date().toLocaleDateString('vi-VN')}`,
          html,
          text,
        });

        sent++;
      } catch (error) {
        logger.error(`[DailyDigest] Failed for user ${user.email}`, { error: String(error) });
        errors++;
      }
    }
  } catch (error) {
    logger.error('[DailyDigest] Failed to send digests', { error: String(error) });
    throw error;
  }

  return { sent, skipped, errors };
}
