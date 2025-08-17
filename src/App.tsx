import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import NotFound from "./pages/NotFound";
import MenuBar from "@/components/MenuBar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Services from "./pages/Services";
import Employees from "./pages/Employees";
import AddService from "./pages/AddService"; // import your new page

import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * React Query client configuration
 * Provides data fetching, caching, and state management capabilities.
 */
const queryClient = new QueryClient();

/**
 * RedirectIfAuthenticated
 * Wrapper component that redirects authenticated users away from public auth pages.
 * Prevents logged-in users from accessing login/signup pages unnecessarily.
 */
const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * App
 * 
 * Root application component that sets up:
 * - Provider context for React Query, tooltips, toasts, and authentication
 * - React Router for client-side routing
 * - Global navigation via MenuBar
 * - Route protection and authentication-based redirects
 * 
 * Route organization:
 * - Public routes with auth redirect: / (home), /login, /signup
 * - Always public: /book/:bus_id (customer booking flow)
 * - Protected routes: /dashboard, /services, /employees, /add-service
 * - Catch-all: NotFound component for unmatched routes
 * 
 * Authentication flow:
 * - AuthProvider manages global auth state
 * - ProtectedRoute wrapper ensures auth for admin pages
 * - RedirectIfAuthenticated prevents auth page access when logged in
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <MenuBar />
          <Routes>
            {/* Public routes but redirect if logged in */}
            <Route
              path="/"
              element={
                <RedirectIfAuthenticated>
                  <Index />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfAuthenticated>
                  <Signup />
                </RedirectIfAuthenticated>
              }
            />

            {/* Public (always available) */}
            <Route path="/book/:bus_id" element={<BookingPage />} />

            {/* Protected routes */}
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-service"
              element={
                <ProtectedRoute>
                  <AddService />
                </ProtectedRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
