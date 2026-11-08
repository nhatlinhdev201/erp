/**
 * Campaign Email Tracking
 *
 * - Open tracking via 1x1 transparent GIF pixel
 * - Click tracking via URL redirect rewriting
 */

// 1x1 transparent GIF (43 bytes)
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

/**
 * Inject an open-tracking pixel into HTML content.
 * Appends a 1x1 invisible image before </body> or at the end.
 */
export function injectOpenTracker(html: string, sendId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
  const pixelUrl = `${appUrl}/api/track/open?id=${sendId}`
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`

  // Insert before </body> if present, otherwise append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  return html + pixel
}

/**
 * Rewrite all <a href="..."> links in HTML for click tracking.
 * Each link is wrapped through the click tracking redirect endpoint.
 */
export function rewriteLinksForTracking(html: string, sendId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'

  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (_match, before: string, url: string, after: string) => {
      // Skip unsubscribe links (already special) and mailto/tel links
      if (
        url.includes('/api/unsubscribe') ||
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('#')
      ) {
        return _match
      }

      const trackUrl = `${appUrl}/api/track/click?id=${sendId}&url=${encodeURIComponent(url)}`
      return `<a ${before}href="${trackUrl}"${after}>`
    }
  )
}
