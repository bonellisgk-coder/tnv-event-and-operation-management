# Tamil Nadu Volunteer Management Platform

A production-grade, containerized web application designed for managing and coordinating volunteer events for the Government of Tamil Nadu.

## Features
- **Continuous Google-Style Login**: Screen 1 (email/phone verify) -> Screen 2 (profile preview with role badge) -> Screen 3 (password verify) -> Screen 4 (profile completion).
- **Role-Based Routing & Controls**: Scoped permissions for Super Admin, Department Admin, and Volunteer/Coordinators.
- **Event Lifecycle Coordination**: CRUD operations, statuses (Draft, Published, Ongoing, Completed, Cancelled).
- **Public Event Registrations**: Group member additions, confirmation emails, signed edit-registration links.
- **Dynamic QR Code Check-In**: Persistent event check-in cards (PNG), scanner camera checking (`html5-qrcode`), and browser-based self check-in confirmation pages.
- **Attendance & Reporting**: Mark attendance, download stylized Excel lists (`exceljs`) and PDF reports (`pdfkit`).
- **Absence Warnings**: Automatic grace-period check marking missing attendees as ABSENT and dispatching notices.
- **Visual Certificate Designer**: Upload certificate backgrounds, adjust Name and QR coordinates visually via sliders, and bulk download Present attendee credentials in a compiled ZIP file (`node-canvas`).
- **Docker Orchestration**: Single-command workspace launch.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, html5-qrcode
- **Backend**: Node.js, Express, TypeScript, node-canvas, pdfkit, exceljs, archiver
- **Database**: PostgreSQL, Prisma ORM
- **Email**: Nodemailer with HTML templates and CID logo embedding

---

## Getting Started

### Prerequisites
Make sure you have [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Installation & Run

1. Clone or navigate to the repository directory.
2. Build and start all services using a single command:
   ```bash
   docker compose up --build
   ```
3. The orchestration script will automatically:
   - Compile TypeScript files.
   - Start the PostgreSQL database.
   - Run Prisma push to apply the schema.
   - Run the seed script to pre-populate departments, events, users, and tasks.
   - Launch Nginx serving the React frontend on `http://localhost:5173`.
   - Launch the Node backend api on `http://localhost:4000`.
   - Launch Adminer (visual database explorer) on `http://localhost:8080`.

---

## Seeded Demo Credentials

| Role | Username / Email | Password | Phone |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `ChangeMe123!` | `9876543210` |
| **Dept Admin (Disaster Mgmt)** | `disaster.admin@example.com` | `ChangeMe123!` | `9876543211` |
| **Volunteer (Environment)** | `karthik@example.com` | `ChangeMe123!` | `9876543213` |

---

## Development Notes

### Local Sandbox Mode (Without Docker)

If you prefer to run services individually for inspection:

1. **Start Postgres** locally and set your connection string in `.env` (copy from `.env.example`).
2. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

### Email Previews
When SMTP details are omitted in `.env`, the system saves all outgoing email notifications (registration confirmations, invitations, tasks, absences) locally inside `backend/sent_emails/` folder as `.html` files. Open them in any browser to verify layouts, fonts, and inline logos.
