import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Calendar from "@/components/Calendar";
import Timetable from "@/components/Timetable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useParams } from "react-router-dom";

/**
 * BookingStep
 * Enumerates the steps of the booking wizard used by this page.
 */
type BookingStep = 'service' | 'datetime' | 'customer' | 'confirmation';

/**
 * TimeSlot
 * Local representation of a selectable slot returned by Timetable.
 */
interface TimeSlot {
  time: string;
  available: boolean;
  employeeId?: number;
  employeeName?: string;
}

/**
 * BookingPage
 *
 * Top-level page component that implements a simple 4-step booking flow:
 *  1) service selection — loads services for the business via `bus_id` route param
 *  2) date & time selection — uses the `Calendar` + `Timetable` components
 *  3) customer information — collects basic contact fields
 *  4) confirmation — inserts the appointment (and customer) into the DB
 *
 * Important notes:
 *  - This component performs simple client-side validation and inserts.
 *  - For production, consider an atomic server-side RPC that creates the
 *    customer and the appointment in a single transaction and prevents
 *    double-booking race conditions.
 */
const BookingPage = () => {
  // Route param containing the business id for which we're booking
  const { bus_id } = useParams<{ bus_id: string }>();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');

  // Loaded services for the current business
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Date & selected timeslot
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Customer form state
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load services when the business id changes.
  // This function reads the `service` table scoped to `bus_id`.
  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus_id]);

  /**
   * fetchServices
   * Fetches services for the current business and stores them in state.
   * Errors are reported via the toast mechanism.
   */
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service')
        .select('*')
        .order('serv_name')
        .eq('bus_id', bus_id);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      // Log and notify the user — keep the UI responsive if services fail to load.
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    }
  };

  /**
   * handleServiceSelect
   * Simple handler to store the selected service and advance the wizard to
   * the datetime selection step.
   */
  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setCurrentStep('datetime');
  };

  // Date and slot selection handlers used by Calendar/Timetable
  const handleDateSelect = (date: Date) => setSelectedDate(date);
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('customer');
  };

  /**
   * handleCustomerSubmit
   * Validate required customer fields and advance to confirmation step.
   * Uses lightweight client-side checks — the server insert will do final
   * validation.
   */
  const handleCustomerSubmit = () => {
    if (!customerData.firstName || !customerData.email || !customerData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('confirmation');
  };

  /**
   * handleBookingConfirm
   * Performs the DB inserts to record the booking. Current behavior:
   *  - inserts a customer row (non-atomic)
   *  - computes a datetime string and inserts an appointment row
   *
   * Notes / caveats:
   *  - This is intentionally simple but can introduce race conditions if
   *    multiple users book the same slot at the same time. Prefer a server
   *    side RPC that checks availability and inserts atomically.
   */
  const handleBookingConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setLoading(true);

    try {
      // Insert customer (simple insert, we don't rely on returned id here)
      await supabase.from('customer').insert({
        cust_fname: customerData.firstName,
        cust_lname: customerData.lastName,
        cust_email: customerData.email,
        cust_phone: customerData.phone
      });

      // Parse selected slot time (HH:mm) and combine with selectedDate
      const [hours, minutes] = selectedSlot.time.split(':').map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Format as YYYY-MM-DD HH:MM:SS for the DB
      const formattedDateTime = `${appointmentDateTime.getFullYear()}-${(appointmentDateTime.getMonth()+1)
        .toString().padStart(2, '0')}-${appointmentDateTime.getDate().toString().padStart(2, '0')} ${hours
        .toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Insert appointment row tied to the selected service/employee
      await supabase.from('appointment').insert({
        app_datetime: formattedDateTime,
        cust_phone: customerData.phone,
        bus_id,
        serv_id: selectedService.serv_id,
        emp_id: selectedSlot.employeeId
      } as any);

      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });

      // Reset wizard state on success
      setCurrentStep('service');
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setCustomerData({ firstName: '', lastName: '', email: '', phone: '' });

    } catch (error) {
      // Surface errors to the user and keep state intact for retry
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * goBack
   * Helper to navigate the stepper backwards while preserving appropriate
   * state for each step.
   */
  const goBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('service');
        setSelectedService(null);
        break;
      case 'customer':
        setCurrentStep('datetime');
        setSelectedSlot(null);
        break;
      case 'confirmation':
        setCurrentStep('customer');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['service', 'datetime', 'customer', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step ? 'bg-primary text-primary-foreground' :
                    ['service', 'datetime', 'customer', 'confirmation'].indexOf(currentStep) > index ?
                    'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {['service', 'datetime', 'customer', 'confirmation'].indexOf(currentStep) > index ?
                    <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="ml-2 text-sm">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                {index < 3 && <ArrowRight className="w-4 h-4 ml-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentStep === 'service' && 'Select a Service'}
                {currentStep === 'datetime' && 'Choose Date & Time'}
                {currentStep === 'customer' && 'Your Information'}
                {currentStep === 'confirmation' && 'Confirm Booking'}
              </CardTitle>
              {currentStep !== 'service' && (
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>

            {/* Service Selection */}
            {currentStep === 'service' && (
              <div className="grid gap-4">
                {services.map(service => (
                  <Card key={service.serv_id} className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{service.serv_name}</h3>
                          {service.serv_desc && <p className="text-sm text-muted-foreground mt-1">{service.serv_desc}</p>}
                          <p className="text-sm text-muted-foreground mt-2">Duration: {service.serv_min_duration} minutes</p>
                        </div>
                        {service.serv_price && <div className="text-lg font-semibold">${service.serv_price}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Date & Time Selection */}
            {currentStep === 'datetime' && selectedService && (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Selected service: <strong>{selectedService.serv_name}</strong>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
                  {selectedDate && (
                    <Timetable
                      selectedDate={selectedDate}
                      selectedService={selectedService}
                      onSlotSelect={handleSlotSelect}
                      businessId={bus_id}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Customer Information */}
            {currentStep === 'customer' && (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  {selectedService?.serv_name} on {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedSlot?.time}
                  {selectedSlot?.employeeName && ` with ${selectedSlot.employeeName}`}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={customerData.firstName} onChange={e => setCustomerData(prev => ({ ...prev, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={customerData.lastName} onChange={e => setCustomerData(prev => ({ ...prev, lastName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={customerData.email} onChange={e => setCustomerData(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerData.phone}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^\+?\d*$/.test(val)) {
                          setCustomerData(prev => ({ ...prev, phone: val }));
                        }
                      }}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <Button onClick={handleCustomerSubmit} className="w-full">Continue to Confirmation</Button>
              </div>
            )}

            {/* Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-4">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Service:</strong> {selectedService?.serv_name}</div>
                    <div><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</div>
                    <div><strong>Time:</strong> {selectedSlot?.time}</div>
                    {selectedSlot?.employeeName && <div><strong>Staff:</strong> {selectedSlot.employeeName}</div>}
                    {selectedService?.serv_price && <div><strong>Price:</strong> ${selectedService.serv_price}</div>}
                    <div><strong>Customer:</strong> {customerData.firstName} {customerData.lastName}</div>
                    <div><strong>Email:</strong> {customerData.email}</div>
                    <div><strong>Phone:</strong> {customerData.phone}</div>
                  </div>
                </div>
                <Button onClick={handleBookingConfirm} className="w-full" disabled={loading}>
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingPage;
