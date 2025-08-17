import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/**
 * MenuBar
 *
 * Top navigation component that adapts based on authentication state.
 * 
 * Authenticated state:
 * - Shows business dashboard links (Dashboard, Services, Employees)
 * - Provides logout functionality
 * - Hides public auth links
 *
 * Unauthenticated state:
 * - Shows public navigation (Home, Login, Sign Up)
 * - Encourages user registration/authentication
 *
 * Features:
 * - Brand logo linking to homepage
 * - Responsive button sizing and spacing
 * - Authentication context integration
 * - Client-side routing with React Router
 * - Consistent styling with UI component library
 */
const MenuBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img
              src="/availo.svg"
              alt="Availo Logo"
              className="h-8 w-auto" // adjust size as needed
            />
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Protected links only visible when logged in */}
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/services">Services</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/employees">Employees</Link>
              </Button>

              {/* Logout button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* Home, Login & Signup only show if not logged in */}
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default MenuBar;
