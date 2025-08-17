🚀 Project Dashboard App

A modern React + Vite + Supabase application for managing businesses, customers, and appointments. Built with TypeScript, shadcn-ui, and TailwindCSS for a clean and responsive UI.

🔑 Features

📋 Authentication (Supabase Auth)

🗂️ Business & Services Management

👤 Customer Records

📅 Appointments Scheduling

📊 Dashboard with Sorting & Filtering

🎨 UI with shadcn-ui + Tailwind

⚡ Fast builds with Vite

🛠️ Tech Stack

Frontend: React + Vite + TypeScript

Backend: Supabase (Postgres + Auth + Storage)

UI: Tailwind CSS + shadcn/ui

Hosting: Lovable (with option for custom domain)

📦 Getting Started
1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

2. Install dependencies
npm install

3. Set up environment variables

Create a .env file in the root:

VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>


⚠️ Important: Do not expose the service_role key — only the anon key is used in client apps.

4. Run locally
npm run dev


Your app will be available at http://localhost:8080.


📂 Project Structure
src/
 ├─ components/       # UI components (shadcn-ui, custom UI)
 ├─ pages/            # App pages (Dashboard, Login, etc.)
 ├─ integrations/     # Supabase client setup
 ├─ styles/           # Tailwind CSS styles
 └─ App.tsx           # Root component

🔒 Security Notes

Uses Supabase RLS (Row Level Security) policies for data protection

JWT tokens stored in localStorage for session persistence

Never expose service keys in frontend code

Do you want me to also add step-by-step setup for the Supabase database schema (tables: business, services, customers, appointments) inside the README? That way new devs can bootstrap the backend too.
