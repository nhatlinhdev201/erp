# Your Company HR

Hệ thống Quản lý Nhân sự Thông minh cho doanh nghiệp Việt Nam.

An intelligent Human Resource Management System (HRMS) built with Next.js 14, featuring AI-powered insights, modern UI, and comprehensive HR functionality.

## Features

### Core HR Modules
- **Employee Management** - Complete employee lifecycle management
- **Attendance Tracking** - Check-in/check-out with geolocation support
- **Leave Management** - Leave requests, approvals, and balance tracking
- **Payroll Processing** - Salary calculation with Vietnamese tax compliance
- **Performance Reviews** - Goal setting and performance evaluation
- **Recruitment** - Job postings, applications, and candidate tracking
- **Training & Development** - Course management and certifications
- **Onboarding** - Structured onboarding workflows

### AI-Powered Features
- **HR Copilot** - Natural language assistant for HR queries
- **Turnover Prediction** - ML-based employee retention risk analysis
- **Smart Insights** - Automated dashboard recommendations
- **Anomaly Detection** - Unusual pattern alerts for attendance/payroll
- **Workflow Automation** - Smart form filling and process suggestions
- **Weekly AI Summary** - Automated HR intelligence reports

### Technical Features
- Modern Next.js 14 App Router architecture
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- NextAuth.js authentication
- Responsive Tailwind CSS design
- Role-based access control
- Real-time notifications
- Vietnamese language support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude API
- **State**: React Context + Hooks

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/lerp-hrm.git
cd lerp-hrm
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lerp_hr"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

4. **Set up the database**
```bash
# Run migrations
npx prisma migrate dev

# Seed with demo data
npx prisma db seed
```

5. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials
```
Email: admin@your-domain.com
Password: Admin@123
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ai/               # AI feature components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives (shadcn)
├── lib/                   # Utilities and business logic
│   ├── ai/               # AI modules
│   ├── api/              # API utilities
│   ├── db/               # Database utilities
│   ├── monitoring/       # Logging and metrics
│   └── security/         # Security utilities
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services (development)
docker compose up db

# Start all services (production)
docker compose --profile production up -d
```

### Environment Variables for Production

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Session encryption key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI features | Yes |

## API Documentation

### Authentication
All API endpoints require authentication via session cookie or Bearer token.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees |
| GET | `/api/employees/[id]` | Get employee details |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/[id]` | Update employee |
| DELETE | `/api/employees/[id]` | Delete employee |
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance/check-in` | Record check-in |
| POST | `/api/attendance/check-out` | Record check-out |
| GET | `/api/leaves` | List leave requests |
| POST | `/api/leaves` | Submit leave request |
| GET | `/api/payroll` | List payroll records |
| GET | `/api/dashboard` | Dashboard statistics |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | HR Copilot chat |
| GET | `/api/ai/insights` | Get AI insights |
| GET | `/api/ai/predictions/turnover` | Turnover predictions |
| GET | `/api/ai/anomalies` | Anomaly detection |
| GET | `/api/ai/reports/weekly` | Weekly AI summary |
| POST | `/api/ai/automation/suggest` | Workflow suggestions |

### Health Check
```
GET /api/health
```

Returns system health status including database connectivity and memory usage.

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check
npx prisma studio    # Open Prisma database GUI
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Security

- HTTPS enforced in production
- Secure session cookies
- Rate limiting on API endpoints
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection headers
- CSRF protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@your-domain.com or open an issue on GitHub.
