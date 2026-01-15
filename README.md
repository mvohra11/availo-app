<!DOCTYPE html>
<body>

<h1>Availo – Business Management Dashboard</h1>

<p>
  Availo is a modern web application for managing businesses, services, customers, and appointments.
  It was designed and built within a <strong>24-hour hackathon</strong>, with a focus on rapid development,
  clean architecture, and practical real-world functionality.
</p>

<p>
  The application provides authentication, data management, scheduling, and a dashboard interface with
  filtering and sorting capabilities.
</p>

<hr />

<h2>Features</h2>
<ul>
  <li>User authentication using Supabase Auth</li>
  <li>Business and services management</li>
  <li>Customer records management</li>
  <li>Appointment scheduling system</li>
  <li>Dashboard with sorting and filtering</li>
  <li>Responsive UI using Tailwind CSS and shadcn/ui</li>
  <li>Fast development and builds using Vite</li>
</ul>

<h2>Tech Stack</h2>

<h3>Frontend</h3>
<ul>
  <li>React</li>
  <li>Vite</li>
  <li>TypeScript</li>
</ul>

<h3>Backend</h3>
<ul>
  <li>Supabase (PostgreSQL, Authentication, Storage)</li>
</ul>

<h3>UI</h3>
<ul>
  <li>Tailwind CSS</li>
  <li>shadcn/ui</li>
</ul>

<h3>Hosting</h3>
<ul>
  <li>Lovable (supports custom domains)</li>
</ul>

<hr />

<h2>Getting Started</h2>

<h3>1. Clone the repository</h3>
<pre><code>git clone https://github.com/&lt;your-username&gt;/availo.git
cd availo</code></pre>

<h3>2. Install dependencies</h3>
<pre><code>npm install</code></pre>

<h3>3. Configure environment variables</h3>

<p>Create a <code>.env</code> file in the project root:</p>

<pre><code>VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key</code></pre>

<p><strong>Important:</strong><br />
Do not use or expose the Supabase <code>service_role</code> key in client applications.
</p>

<h3>4. Run the development server</h3>

<pre><code>npm run dev</code></pre>

<p>The application will be available at:</p>

<pre><code>http://localhost:8080</code></pre>

<hr />

<h2>Project Structure</h2>

<pre><code>src/
 ├─ components/       Reusable UI components (shadcn-ui and custom)
 ├─ pages/            Application pages (Dashboard, Login, etc.)
 ├─ integrations/     Supabase client configuration
 ├─ styles/           Tailwind CSS styles
 └─ App.tsx           Application root component
</code></pre>

<hr />

<h2>Security Considerations</h2>

<ul>
  <li>Uses Supabase Row Level Security (RLS) policies for data access control</li>
  <li>Authentication handled via JWT tokens stored in localStorage</li>
  <li>Only public (anon) Supabase keys are used on the frontend</li>
  <li>Sensitive keys must remain on the server side</li>
</ul>

</body>
</html>
