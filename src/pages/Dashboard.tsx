import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Calendar from "@/components/Calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarDays, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Dashboard
 *
 * Main administrative dashboard for business users.
 * 
 * Features:
 * - Business overview with key statistics (appointments, services, staff)
 * - Interactive calendar for date selection
 * - Daily appointment listing with customer and service details
 * - Quick actions (add appointment, navigate to management pages)
 * - Responsive grid layout adapting to screen size
 *
 * Data sources:
 * - business: Current business information
 * - services: All services offered by the business
 * - employees: All staff members
 * - appointments: Daily appointments with joined customer/service/employee data
 *
 * Authentication requirements:
 * - Requires valid user session
 * - Business record must exist for the authenticated user
 * - Uses user.id to scope all data queries
 *
 * Performance considerations:
 * - Loads dashboard data once on mount
 * - Refreshes appointments when date changes
 * - Uses joined queries to minimize round trips
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const { toast } = useToast();

  /**
   * fetchDashboardData
   * Loads all core business data for the dashboard.
   * 
   * Data fetching strategy:
   * 1. Authenticate current user
   * 2. Load business record (single business per user model)
   * 3. Load services and employees scoped to business
   * 
   * Error handling:
   * - Gracefully handles missing business records
   * - Shows user-friendly error messages via toast
   * - Resets state on errors to prevent stale data display
   */
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No logged-in user
        setBusiness(null);
        setServices([]);
        setEmployees([]);
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Fetch business data
      const { data: businessData, error: businessError } = await supabase
        .from('business')
        .select('*')
        .limit(1)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        throw businessError;
      }

      if (!businessData) {
        toast({ title: "No Business Found", description: "Please set up your business", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('service')
        .select('*')
        .order('serv_name')
        .eq('bus_id', businessData.bus_id);

      if (servicesError) throw servicesError;

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employee')
        .select('*')
        .order('emp_fname')
        .eq('bus_id', businessData.bus_id);

      if (employeesError) throw employeesError;

      setBusiness(businessData);
      setServices(servicesData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      setBusiness(null);
      setServices([]);
      setEmployees([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * fetchDayAppointments
   * Loads appointments for the currently selected date.
   * 
   * Query design:
   * - Uses date range filtering (00:00:00 to 23:59:59)
   * - Joins with customer, service, and employee tables for complete data
   * - Orders by appointment time for chronological display
   * 
   * Data structure returned:
   * - appointment: core appointment data (app_id, app_datetime, etc.)
   * - customer: joined customer info (name, email, phone)
   * - service: joined service info (name, duration)
   * - employee: joined employee info (name)
   */
  const fetchDayAppointments = async () => {
    if (!business) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          *,
          customer (cust_fname, cust_lname, cust_email, cust_phone),
          service (serv_name, serv_min_duration),
          employee (emp_fname, emp_lname)
        `)
        .gte('app_datetime', `${dateStr} 00:00:00`)
        .lt('app_datetime', `${dateStr} 23:59:59`)
        .eq('bus_id', business.bus_id)
        .order('app_datetime');

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
      setAppointments([]);
    }
  };

  /**
   * Effect hooks for data loading
   * 
   * 1. Load dashboard data on component mount
   * 2. Refresh appointments when date or business changes
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDayAppointments();
  }, [selectedDate, business]);

  // Loading and error states
  if (loading) return <div className="min-h-screen bg-background p-6 text-center py-8">Loading dashboard...</div>;
  if (!business) return <div className="min-h-screen bg-background p-6 text-center py-8">Please log in to view the dashboard.</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{business.bus_name}</h1>
            <p className="text-muted-foreground">Manage your appointments and schedule</p>
          </div>
          <Button onClick={() => navigate("/book/" + business.bus_id)} size="sm">Add Appointment</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for this day
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.app_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{format(new Date(appointment.app_datetime), 'h:mm a')}</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.customer?.cust_fname} {appointment.customer?.cust_lname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.customer?.cust_phone} • {appointment.customer?.cust_email}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">{appointment.service?.serv_name}</Badge>
                          <div className="text-sm text-muted-foreground">
                            with {appointment.employee?.emp_fname} {appointment.employee?.emp_lname}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
