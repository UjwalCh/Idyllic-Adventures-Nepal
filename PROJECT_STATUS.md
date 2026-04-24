# Idyllic Adv Nepal - Project Status & Site Documentation

## 1. Project Overview
**Idyllic Adv Nepal** is a modern, responsive web application designed for a trekking and adventure agency in Nepal. 
- **Frontend Stack**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend Stack**: Supabase (PostgreSQL, Authentication, Row Level Security, Realtime).
- **Architecture**: A decoupled client-server model where the React frontend communicates directly with the Supabase backend via a secure API client.

---

## 2. What We Have Done (Progress & Features)

We have successfully built and integrated the majority of the application. The local codebase is 100% stable, builds without errors, and is pushed to GitHub.

### Frontend (User Interface)
- **Public Pages**: Built complete pages for Home, About, Contact, Treks listing, and individual Trek Detail pages.
- **Dynamic Content Integration**: Hooked up the frontend to fetch real-time site settings (e.g., Hero text, WhatsApp numbers, Location, Email) directly from the database instead of using hardcoded variables.
- **Admin Dashboard**: Created a secure admin portal (`/admin/*`) featuring:
  - Admin Login
  - Dashboard Overview
  - CMS modules for managing Treks, Images, Notices, and Global Site Settings.
- **Styling**: Fully integrated Tailwind CSS and Shadcn UI components for a clean, accessible, and responsive design across all devices.

### Backend (Database & Supabase)
- **Schema Design**: Established base tables for `treks`, `notices`, `inquiries` (bookings).
- **Security & RLS**: Enforced Row Level Security (RLS) so that public users can only read data (like published treks) and insert inquiries, while only authenticated admins can mutate/delete data.
- **Advanced Spam Protection & Rate Limiting**:
  - **Honeypot Fields**: Hidden fields in the UI that bots naturally fill out, allowing us to silently reject their submissions.
  - **Rate Limiting**: IP-based rate limiting to prevent form abuse.
  - **Content Filtering**: Checks against disposable email providers and blocked keywords to ensure high-quality lead generation.
- **Version Control**: configured `.gitignore` properly to protect secrets (`.env`) and pushed all code securely to the GitHub `main` branch.

---

## 3. Site Architecture & Data Flow

### A. Public User Flow
1. **Visit**: User arrives on the website. React Router handles the routing.
2. **Data Fetch**: The frontend initiates asynchronous calls to Supabase to fetch active configuration (Site Settings) and content (Treks, Notices).
3. **Interaction**: User browses treks and decides to book or contact.
4. **Form Submission**: 
   - User submits the Contact/Booking form.
   - Frontend performs initial validation (length, required fields).
   - Payload is sent to Supabase.
   - Supabase executes a secure RPC (Remote Procedure Call) to evaluate the Honeypot, check rate limits, and scan for spam before inserting the record into the `inquiries` table.
5. **Feedback**: User receives a success notification (or a generic error if marked as a bot).

### B. Admin Flow
1. **Authentication**: Admin logs in via Supabase Auth at `/admin`.
2. **Dashboard Rendering**: The `AdminLayout` wrapper ensures that only authenticated users can view the children routes.
3. **Data Management**: Admin navigates to "Settings" or "Treks". 
4. **Mutation**: When the admin updates a setting (e.g., changes the phone number), the frontend updates the database record. 
5. **Real-time Sync**: Because components use data fetching hooks, the public site instantly reflects the new phone number without requiring a deployment.

---

## 4. What is Remaining to be Done

While the codebase is complete, the infrastructure relies on a few final steps to go live.

### Blocker 1: Final Supabase Database Migration
During our last session, we generated the SQL required to create the `site_settings` and `spam_config` tables along with their RLS policies. 
- **The Issue**: When trying to apply these via automated browser control in the Supabase Dashboard, the SQL Editor hit a syntax error (`42601: syntax error at or near ")"`) and stalled.
- **The Fix**: We need to open the Supabase SQL editor and successfully run the remaining SQL commands. It is safer to do this manually or in smaller blocks (Tables -> RLS -> Policies -> Seed Data).

### Blocker 2: Vercel Deployment
The application needs to be hosted on the internet.
- **Step 1**: Log into Vercel and create a new project by importing your GitHub `Idyllic Adv Nepal` repository.
- **Step 2**: Add the Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel deployment settings.
- **Step 3**: Click deploy. Vercel will run `npm run build` (which we have already verified works locally) and publish the site to a live URL.

### Optional Future Enhancements
- Set up a custom domain (e.g., `www.idyllicadvnepal.com`) via Vercel.
- Configure automated email notifications when a new inquiry is submitted in Supabase (using Edge Functions or Webhooks).
- Add SEO Meta tags and Open Graph images for better social media sharing.

---
*Generated by GitHub Copilot on April 24, 2026*