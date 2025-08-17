import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Index
 *
 * Landing page component that serves as the main marketing/homepage.
 * 
 * Features:
 * - Hero section with gradient background and animated elements
 * - Feature cards highlighting key product capabilities
 * - Call-to-action sections directing users to signup/login
 * - Statistics display (uptime, support, bookings, industries)
 * - Responsive design with mobile-first approach
 *
 * Design patterns:
 * - Uses Tailwind CSS utility classes for styling
 * - Implements subtle animations (fade-in, pulse, hover effects)
 * - Decorative elements positioned absolutely for visual appeal
 * - Grid-based layout for features section
 * - Gradient backgrounds and text effects for modern look
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="text-center max-w-5xl mx-auto relative">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <Calendar className="w-4 h-4" />
              Trusted by 1000+ businesses
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-foreground leading-tight animate-fade-in">
              Effortless
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"> Appointment </span>
              Booking
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in">
              Transform your business with our powerful scheduling platform. 
              <br className="hidden md:block" />
              Perfect for salons, clinics, consultants, and service providers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in">
              <Button asChild size="lg" className="text-lg px-10 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Link to="/signup">
                  Get Started Free
                  <CheckCircle className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-10 py-6 h-auto border-2 hover:bg-primary/5">
                <Link to="/login">
                  View Demo
                  <Users className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-in">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">99%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">1M+</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Industries</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          Everything You Need to Manage Appointments
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Smart Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intuitive month and day views with real-time availability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Flexible scheduling with customizable time slots and durations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Staff Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage multiple staff members and their individual availability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Easy Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Simple booking flow for customers with instant confirmation
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start managing appointments more efficiently today
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
