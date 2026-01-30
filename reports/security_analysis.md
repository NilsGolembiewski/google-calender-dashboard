# Security Analysis Report: Daily Occupancy Dashboard

**Date:** January 29, 2026  
**Status:** Completed  
**Project:** daily-occupance-dashboard

---

## 1. Executive Summary

A security analysis was performed on the Daily Occupancy Dashboard project. The application uses a modern Next.js 15+ (App Router) stack with NextAuth.js v5 for authentication and the Google Calendar API for data.

The overall security posture is **Strong** for a personal dashboard application, leveraging modern framework protections. However, several configuration-level risks and best-practice improvements were identified, primarily revolving around the "Debug Mode" and input validation in Server Actions.

---

## 2. Authentication & Authorization

### 2.1 NextAuth.js Implementation
- **Strengths**: Uses Auth.js (NextAuth.js v5), which follows modern security standards for JWT and session management.
- **Refresh Token Logic**: The implementation in `src/auth.ts` correctly handles Google OAuth2 token rotation, ensuring sessions remain valid without frequent re-authentications.
- **Risk**: The project uses a beta version of `next-auth` (`^5.0.0-beta.30`). Beta versions may contain undiscovered vulnerabilities or breaking changes.
- **Recommendation**: Monitor for stable releases of `next-auth` and update promptly.

### 2.2 Debug Mode (Bypass Risk)
- **Risk**: The `APP_CONFIG.isDebug` flag (controlled by the `DEBUG` environment variable) allows the application to bypass authentication and display mock data.
- **Observation**: If `DEBUG=1` is accidentally enabled in a production environment, unauthenticated users can access the dashboard UI and mock occupancy data.
- **Recommendation**: Ensure the `DEBUG` environment variable is strictly excluded from production environments. Consider adding a check for `NODE_ENV === 'production'` to force-disable debug mode.

---

## 3. Data Security & Privacy

### 3.1 Google Calendar Access
- **Scope**: The app requests `https://www.googleapis.com/auth/calendar.readonly`. This follows the **Principle of Least Privilege** as it does not request write access.
- **Token Storage**: Access tokens and refresh tokens are stored in the encrypted JWT/Session. While standard, if the `AUTH_SECRET` is compromised, all user tokens could be exposed.

### 3.2 Sensitive Information
- **Observation**: No hardcoded secrets were found in the codebase. All credentials (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`) are correctly managed via environment variables.
- **Observation**: `env_example.txt` is provided, which is good for developer onboarding without exposing real secrets.

---

## 4. API & Server-Side Security

### 4.1 Server Actions (`"use server"`)
- **Strengths**: Next.js Server Actions include built-in CSRF (Cross-Site Request Forgery) protection.
- **Input Validation**: 
    - **Issue**: The server action `getOccupancyData` in `src/app/actions.ts` accepts `startDateStr`, `endDateStr`, and `calendarIds` without strict validation.
    - **Risk**: A malicious user (or an accidental bug) could pass extremely large date ranges or thousands of `calendarIds`, potentially causing a Denial of Service (DoS) by overloading the server or hitting Google API rate limits.
- **Recommendation**: Implement validation (e.g., using `zod`) to limit the date range (e.g., max 1 year) and the number of selected calendars (e.g., max 20).

### 4.2 Error Handling
- **Observation**: Server-side errors in `src/lib/google-calendar.ts` are logged using `console.error`. 
- **Recommendation**: In a production environment, ensure that sensitive error details (like internal API keys or stack traces) are not leaked to the client. Next.js does this by default for Server Actions, but manual error messages should be kept generic.

---

## 5. Client-Side Security

### 5.1 Cross-Site Scripting (XSS)
- **Status**: **Low Risk**.
- **Analysis**: User-controlled data (calendar summaries) is rendered using React's standard curly-brace syntax (e.g., `{cal.summary}`), which automatically escapes HTML content.

### 5.2 External Assets
- **Observation**: User profile images are loaded directly from Google (`session.user.image`).
- **Recommendation**: Consider adding a Content Security Policy (CSP) to restrict image sources to trusted domains like `*.googleusercontent.com`.

---

## 6. Dependency Analysis

| Package | Version | Security Note |
| :--- | :--- | :--- |
| `next` | `16.1.6` | Modern version, likely secure. |
| `next-auth` | `5.0.0-beta.30` | Beta version; requires monitoring. |
| `googleapis` | `^170.1.0` | Standard library. |

---

## 7. Recommendations Summary

1.  **Strict Debug Control**: Disable `DEBUG` mode automatically if `NODE_ENV` is `production`.
2.  **Input Validation**: Use a library like `zod` to validate Server Action arguments (`getOccupancyData`).
3.  **Rate Limiting**: Monitor Google Calendar API usage to prevent rate-limiting issues when many calendars are selected.
4.  **CSP Header**: Implement a Content Security Policy to further mitigate XSS and unauthorized asset loading.
5.  **Audit Dependencies**: Run `npm audit` regularly to identify known vulnerabilities in third-party packages.

---

## 8. Todoist Integration Analysis (Added 2026-01-30)

### 8.1 Server-Side Request Forgery (SSRF)
- **Status**: **Resolved** (Implemented 2026-01-30)
- **Risk**: The server action `getTodoistData` in `src/app/actions.ts` accepts an arbitrary `icalUrl` and fetches it via `fetchTodoistTasks`. An attacker could provide internal URLs (e.g., `http://localhost:3000`, `http://169.254.169.254`) to probe or exploit internal services.
- **Location**: `src/lib/todoist.ts` and `src/app/actions.ts`.
- **Implementation**: 
    - Added prefix validation (`https://ext.todoist.com/`).
    - Added DNS resolution check to ensure the hostname resolves to a public IP address before fetching.
    - Implemented in `src/lib/todoist.ts` via `validateTodoistUrl`.

### 8.2 Unauthenticated Server Action Access
- **Status**: **Resolved** (Implemented 2026-01-30)
- **Risk**: Unlike other actions, `getTodoistData` does not check for a valid session. This allow unauthenticated users to trigger the server to fetch external or internal URLs, potentially leading to abuse or resource exhaustion.
- **Location**: `src/app/actions.ts`.
- **Implementation**: Added `await auth()` and `session.accessToken` check at the start of the `getTodoistData` action.

### 8.3 Insecure Storage of Sensitive iCal URL
- **Risk**: The Todoist iCal URL contains a secret token that grants access to the user's tasks. Storing this in `localStorage` in `src/components/Dashboard.tsx` makes it vulnerable to theft via Cross-Site Scripting (XSS).
- **Location**: `src/components/Dashboard.tsx`.
- **Recommendation**: 
    - Consider storing the URL in a server-side session or a database.
    - If `localStorage` must be used, implement a strict Content Security Policy (CSP) to mitigate XSS risks.

### 8.4 Error Handling & Information Leakage
- **Status**: **Resolved** (Implemented 2026-01-30)
- **Risk**: In `src/lib/todoist.ts`, throwing `response.statusText` might leak internal server details or status information about the target URL to the client.
- **Implementation**: 
    - Server-side logging of detailed error messages (status code and text).
    - Client-side generic error message ("Failed to fetch tasks").

### 8.5 Parsing Robustness
- **Risk**: iCal parsing using `ts-ics` is complex. Maliciously crafted iCal files could potentially exploit vulnerabilities in the parser.
- **Recommendation**: Keep the `ts-ics` dependency updated and consider sandboxing the parsing logic.
