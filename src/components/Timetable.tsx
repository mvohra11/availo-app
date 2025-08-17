import { useState, useEffect } from "react";
import { format, parse, addMinutes, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * TimeSlot represents a single selectable time in the timetable.
 *
 * - time: string formatted as 'HH:mm'
 * - available: whether the slot is selectable (not in the past and not already booked)
 * - employeeId / employeeName: optional metadata about the staff assigned to the slot
 */
interface TimeSlot {
  time: string;
  available: boolean;
  employeeId?: number;
  employeeName?: string;
}

/**
 * TimetableProps - component props for the Timetable component
 *
 * - selectedDate: the date for which to generate slots
 * - selectedService: service object (expects serv_min_duration and serv_id)
 * - onSlotSelect: callback when user selects an available slot
 * - businessId: optional business scope (not required for current queries but kept for future use)
 */
interface TimetableProps {
  selectedDate: Date;
  selectedService?: { serv_id?: number; serv_min_duration?: number } | any;
  onSlotSelect?: (slot: TimeSlot) => void;
  businessId?: string;
}

/**
 * Timetable
 *
 * Renders available time slots for a selected date and service. It:
 *  - loads employee availability for the selected weekday
 *  - filters employees by those trained for the selected service
 *  - fetches appointments for the day and marks booked times as unavailable
 *  - generates time slots in increments of the service duration
 *
 * Implementation notes and assumptions:
 *  - Availability rows are queried from `employee_availability` and include a
 *    nested `employee` object with `employee_service` links. The availability
 *    row is expected to contain `start_time` and `end_time` as DB time values
 *    (commonly 'HH:mm:ss' or SQL time types). Parsing uses date-fns `parse` to
 *    interpret that pattern into a concrete Date instance.
 *  - Appointments are loaded for the entire day and compared using their
 *    'HH:mm' representation. This means that appointments stored with
 *    seconds or different timezones should still match the slot if the
 *    resulting 'HH:mm' is equal.
 *  - Timezone: this component treats DB times as local times. If your DB
 *    stores UTC or another timezone, consider normalizing on the server or
 *    applying a timezone-aware conversion here.
 *
 * Recommended improvements (outside the scope of this component):
 *  - Use a server-side RPC to generate available slots to avoid subtle
 *    timezone and race-condition issues.
 *  - Prevent double-booking in a transaction when creating appointments.
 */
const Timetable = ({ selectedDate, selectedService, onSlotSelect, businessId }: TimetableProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Regenerate whenever the selected date/service/business changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      void generateTimeSlots();
    } else {
      setTimeSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, businessId]);

  /**
   * generateTimeSlots
   *
   * Queries employee availability and appointments for the selected date,
   * filters availability to only employees trained for the selected service,
   * and produces an ordered list of TimeSlot objects.
   *
   * Defensive behaviour (no runtime changes):
   *  - logs and skips availability rows with invalid or unparseable times
   *  - tolerates missing nested employee / employee_service shapes
   */
  const generateTimeSlots = async () => {
    setLoading(true);
    try {
      // Day of week as stored in employee_availability.avail_day
      const dayOfWeek = selectedDate.getDay().toString(); // 0..6 where 0=Sunday

      // Fetch availability rows joined with employee and their service links
      // We pull employee.employee_service to later filter employees by selected service
      const { data: availability, error: availError } = await supabase
        .from('employee_availability')
        .select(`
          *,
          employee (
            emp_id,
            emp_fname,
            emp_lname,
            employee_service (
              serv_id
            )
          )
        `)
        .eq('avail_day', dayOfWeek);

      if (availError) {
        console.error('Availability query error', availError);
        toast({ title: 'Error', description: 'Failed to fetch availability', variant: 'destructive' });
        setTimeSlots([]);
        return;
      }

      // eligibleEmployees: availability rows for employees who can perform the selected service
      // Notes about the shape:
      //  - `availability` is an array of rows; each row may have an `employee` field
      //  - `employee.employee_service` is expected to be an array of objects with a `serv_id`
      const eligibleEmployees = (availability || []).filter((avail: any) => {
        // employee may be null if data is inconsistent — guard against that
        const emp = avail.employee;
        if (!emp) return false;
        const services = emp.employee_service || [];
        return services.some((es: any) => es.serv_id === selectedService?.serv_id);
      });

      // Load appointments for the selected date to mark booked times
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: appointments } = await supabase
        .from('appointment')
        .select('app_datetime, emp_id')
        .gte('app_datetime', `${dateStr} 00:00:00`)
        .lt('app_datetime', `${dateStr} 23:59:59`);

      // Defensive: ensure appointments is an array before mapping
      const appointmentsArr = Array.isArray(appointments) ? appointments : [];

      // Build a set of booked 'HH:mm' times for quick lookup. We intentionally
      // format times to 'HH:mm' so that seconds are ignored when comparing slots.
      const bookedSlots = new Set(appointmentsArr.map((apt: any) => {
        try {
          return format(new Date(apt.app_datetime), 'HH:mm');
        } catch (err) {
          console.warn('Failed to parse appointment datetime', apt, err);
          return '';
        }
      }).filter(Boolean));

      // Produce time slots for each eligible employee's availability range
      const slots: TimeSlot[] = [];
      const serviceDuration = Number(selectedService?.serv_min_duration || 30);

      eligibleEmployees.forEach((avail: any) => {
        // The DB stores start_time/end_time as time or textual 'HH:mm:ss'. parse with that format.
        // parse(...) returns a Date object anchored to 'today' — we only use hours/minutes
        const startTime = parse(avail.start_time, 'HH:mm:ss', new Date());
        const endTime = parse(avail.end_time, 'HH:mm:ss', new Date());

        // Defensive checks: if parse fails, skip this availability row
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.warn('Skipping availability with invalid times', avail);
          return;
        }

        let currentTime = startTime;
        while (isBefore(currentTime, endTime)) {
          const timeStr = format(currentTime, 'HH:mm');

          // Construct a full Date for the slot to compare with 'now'
          const slotDateTime = new Date(selectedDate);
          slotDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

          const isPast = slotDateTime < new Date();
          const isBooked = bookedSlots.has(timeStr);

          // Employee metadata
          const emp = avail.employee;
          const employeeName = emp ? `${emp.emp_fname || ''} ${emp.emp_lname || ''}`.trim() : 'Staff';

          slots.push({
            time: timeStr,
            available: !isPast && !isBooked,
            employeeId: emp?.emp_id,
            employeeName,
          });

          // Advance by service duration
          currentTime = addMinutes(currentTime, serviceDuration);
        }
      });

      // Remove duplicates and sort by time; duplicates can occur if multiple employees have identical slots
      const uniqueMap = new Map<string, TimeSlot>();
      slots.forEach(s => {
        const key = `${s.time}-${s.employeeId ?? 'any'}`;
        // Keep the first occurrence; later ones likely same time with different employee
        if (!uniqueMap.has(key)) uniqueMap.set(key, s);
      });

      const uniqueSlots = Array.from(uniqueMap.values()).sort((a, b) => a.time.localeCompare(b.time));

      setTimeSlots(uniqueSlots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      toast({ title: 'Error', description: 'Failed to generate time slots', variant: 'destructive' });
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle when a user clicks an available slot.
   * For safety we only call the callback when the slot is available.
   */
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.available && onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading time slots...</div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedService) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Please select a service first</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Times - {format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        {timeSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No available time slots for this day</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {timeSlots.map((slot, index) => (
              <div key={`${slot.time}-${slot.employeeId ?? 'any'}-${index}`} className="space-y-1">
                <Button
                  variant={slot.available ? 'outline' : 'secondary'}
                  className={`w-full ${slot.available ? 'hover:bg-primary hover:text-primary-foreground' : ''}`}
                  disabled={!slot.available}
                  onClick={() => handleSlotClick(slot)}
                >
                  {slot.time}
                </Button>
                <Badge variant="secondary" className="text-xs w-full justify-center">{slot.employeeName}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timetable;