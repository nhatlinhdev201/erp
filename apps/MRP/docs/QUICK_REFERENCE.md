# VietERP MRP - Quick Reference Card

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Global Search |
| `Cmd/Ctrl + N` | Create New |
| `Esc` | Close Modal |
| `Enter` | Submit Form |

## Navigation

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | /home | Overview & KPIs |
| Parts | /parts | Part management |
| BOM | /bom | Bill of Materials |
| Inventory | /inventory | Stock levels |
| Production | /production | Work orders |
| Quality | /quality | QC management |
| Purchasing | /purchasing | Purchase orders |
| Sales | /orders | Sales orders |
| MRP | /mrp | Planning |

## Status Colors

| Color | Meaning |
|-------|---------|
| Green | Active, Completed, Pass |
| Yellow | Pending, In Progress, Warning |
| Red | Critical, Overdue, Fail |
| Blue | Info, Draft |
| Gray | Inactive, Cancelled |

## Common Actions

### Create New Record
1. Click **+ Tao** or **+ Create**
2. Fill form
3. Click **Luu** or **Save**

### Edit Record
1. Click record row
2. Click **Edit** / **Sua**
3. Update fields
4. Click **Save**

### Delete Record
1. Click record row
2. Click **Delete** / **Xoa**
3. Confirm deletion

### Export Data
1. Click **Export**
2. Choose format (Excel/PDF)
3. File downloads automatically

### Search
1. Click search box (or Cmd+K)
2. Type keywords
3. Results filter automatically

## Notification Types

| Icon | Type |
|------|------|
| Message | @Mention |
| Mail | Reply |
| Warning | Alert |
| Box | Stock Warning |
| Check | Task Complete |

## Mobile Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select/Open |
| Swipe Left | Quick Actions |
| Pull Down | Refresh |
| Long Press | Context Menu |

## Quality Module Quick Reference

### NCR Status Flow
```
Open -> Under Review -> Pending Disposition -> Approved -> In Rework -> Completed -> Closed
```

### CAPA Status Flow
```
Draft -> Open -> In Progress -> Verification -> Closed
```

### Inspection Types
- **Receiving:** Incoming goods QC
- **In-Process:** Production QC
- **Final:** Outgoing QC

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/parts | GET | List parts |
| /api/parts | POST | Create part |
| /api/parts/[id] | PATCH | Update part |
| /api/bom | GET | List BOMs |
| /api/quality/ncr | GET | List NCRs |
| /api/quality/capa | GET | List CAPAs |

## Emergency Contacts

- **Technical Support:** support@your-domain.com
- **Production URL:** https://mrp.your-domain.com

---

*Version: 1.0 | Updated: 2026-01-17*
