# Daily Occupancy Dashboard

A modern web application built with Next.js 15+ that helps you visualize your time commitment across multiple Google Calendars. Track your work-life balance by seeing exactly how much of your day is "occupied" by meetings and tasks across different areas of your life (e.g., Work, Personal, Side Projects).

![Dashboard Preview](public/next.svg) <!-- Placeholder for actual screenshot -->

## 🚀 Features

- **Multi-Calendar Support**: View occupancy data for all your connected Google Calendars simultaneously.
- **Visual Progress Bars**: Each day shows color-coded bars representing the occupancy of individual calendars relative to a target business day.
- **Infinite Scrolling**: Effortlessly navigate through your schedule with a smooth, infinite-loading calendar view.
- **Server-Side Security**: Leveraging Next.js Server Actions and Auth.js (NextAuth.js v5) to keep your Google API tokens and data processing secure.
- **Smart Event Filtering**: Automatically filters out non-occupancy events like "Lunch" or "Out of Office" and merges overlapping events for accurate duration calculations.
- **Debug Mode**: Test the UI without a Google connection using built-in mock data.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Authentication**: [Auth.js v5 (NextAuth)](https://authjs.dev/)
- **API Integration**: [Google APIs Node.js Client](https://github.com/googleapis/google-api-python-client)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Management**: [date-fns](https://date-fns.org/)
- **Animation/UX**: [react-intersection-observer](https://www.npmjs.com/package/react-intersection-observer) for infinite scroll.

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- A Google Cloud Project with the **Google Calendar API** enabled.
- OAuth 2.0 Credentials (Client ID and Secret) from the [Google Cloud Console](https://console.cloud.google.com/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/daily-occupance-dashboard.git
   cd daily-occupance-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp env_example.txt .env.local
   ```
   Edit `.env.local` with your specific values:
   - `AUTH_SECRET`: A random string for session encryption (generate with `npx auth secret`).
   - `AUTH_GOOGLE_ID`: Your Google OAuth Client ID.
   - `AUTH_GOOGLE_SECRET`: Your Google OAuth Client Secret.
   - `DEBUG`: Set to `1` to enable mock data mode.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 🏗️ Architecture

The project follows a secure, server-centric architecture:
1. **Frontend**: React Server Components (RSC) and Client Components for a responsive calendar UI.
2. **Server Actions**: Handles complex occupancy calculations and Google API calls server-side.
3. **Auth.js**: Manages OAuth flows and automatically refreshes Google access tokens.
4. **Library Layer**: `src/lib/google-calendar.ts` contains the core logic for event merging and occupancy math.

For a detailed breakdown, see [project_architecture.md](./project_architecture.md).

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BIZ_START` | Business day start hour (0-23) | `8` (8 AM) |
| `NEXT_PUBLIC_BIZ_END` | Business day end hour (0-23) | `18` (6 PM) |
| `NEXT_PUBLIC_ALERT_THRESHOLD` | Hours threshold for "over-occupied" warnings | `8` |

## 🛡️ Security

A security analysis has been performed on this project. Key measures include:
- Server-side token handling (tokens never reach the client).
- Use of environment variables for all secrets.
- CSRF protection via Auth.js.

See [reports/security_analysis.md](./reports/security_analysis.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
