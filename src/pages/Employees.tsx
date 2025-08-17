import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * Availability
 * Represents a single availability time slot for an employee.
 * - avail_day: normalized day index as string ('0'='Sunday', '1'='Monday', etc.)
 * - start_time, end_time: time strings in 'HH:mm' format for UI display
 */
type Availability = {
  avail_day: string;
  start_time: string;
  end_time: string;
};

/**
 * Employees
 *
 * Full CRUD page for managing employees within a business. Features:
 * - Scoped to the logged-in business (fetched via user's email)
 * - Create new employees with availability and service assignments
 * - Edit existing employees (name, availability, trainable services)
 * - Delete employees (with confirmation)
 * - Toggleable create form for clean UI
 * - Normalizes different day/time formats from the database
 *
 * Database relationships:
 * - employee table: core employee record (emp_id, emp_fname, emp_lname, bus_id)
 * - employee_availability: availability slots (emp_id, avail_day, start_time, end_time)
 * - employee_service: service training links (emp_id, serv_id)
 *
 * Data normalization notes:
 * - Days stored as various formats ('Monday', '1', '0') are normalized to '0'..'6'
 * - Times stored as 'HH:mm:ss' in DB are converted to 'HH:mm' for form inputs
 * - Edit panel shows weekdays in order (Sunday through Saturday)
 */
const Employees = () => {
  // Core state: business context and loaded data
  const [business, setBusiness] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // UI state: show/hide create form for cleaner interface
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Day name constants and helpers for consistent weekday handling
  const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  
  /**
   * getWeekdayName
   * Converts a day index or string back to a readable weekday name.
   */
  const getWeekdayName = (d: string) => {
    if (!d) return '';
    if (/^\d+$/.test(d)) {
      const idx = Number(d);
      return weekdayNames[idx] ?? d;
    }
    return d;
  };

  /**
   * normalizeDayIndex
   * Converts various day representations to a standard '0'..'6' string.
   * Handles numeric strings, full day names, and different DB conventions.
   * 
   * Examples:
   * - 'Monday' -> '1'
   * - '1' (if 1=Monday convention) -> '1'
   * - '7' (if 7=Sunday convention) -> '0'
   */
  const normalizeDayIndex = (raw: any) => {
    if (raw === null || raw === undefined) return "";
    const s = String(raw).trim();
    // already numeric string
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      // if DB used 1=Monday..7=Sunday convert to 0=Sunday
      if (n >= 1 && n <= 7 && weekdayNames[n % 7]) {
        // DB 1->Monday (1) should map to 1, DB 7->Sunday should map to 0
        // If DB uses 1..7 with Monday=1, we want 0..6 with Sunday=0
        // assume convention: 1=Monday => index = (n % 7)
        return String(n % 7);
      }
      // otherwise just use n (if already 0..6)
      return String(n);
    }
    // if stored as full day name like 'Monday'
    const idx = weekdayNames.findIndex(w => w.toLowerCase() === s.toLowerCase());
    if (idx >= 0) return String(idx);
    // fallback: return original
    return s;
  };

  /**
   * Time formatting helpers for DB storage vs. UI display
   * - fmtTimeForDb: ensures 'HH:mm:ss' format for database storage
   * - fmtTimeForInput: extracts 'HH:mm' for HTML time inputs
   */
  const fmtTimeForDb = (t?: string) => {
    if (!t) return t;
    const s = String(t).trim();
    if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    return s;
  };
  const fmtTimeForInput = (t?: string) => {
    if (!t) return "";
    const s = String(t).trim();
    const m = s.match(/^(\d{2}:\d{2})/);
    return m ? m[1] : s;
  };

  // Create form state
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [availDay, setAvailDay] = useState("");
  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  // Edit state for the currently selected employee
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const { toast } = useToast();

  /**
   * Main effect: load business and associated data on mount
   * Fetches the business record based on the logged-in user's email,
   * then loads services and employees for that business.
   */
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user || !user.email) return;

      const { data: bus, error: busErr } = await supabase
        .from("business")
        .select("*")
        .eq("bus_email", user.email)
        .limit(1)
        .maybeSingle();

      if (busErr) {
        console.error("Error fetching business:", busErr);
        toast({ title: "Error", description: "Failed to fetch business", variant: "destructive" });
        return;
      }

      if (!bus) {
        setBusiness(null);
        setEmployees([]);
        setServices([]);
        return;
      }

      setBusiness(bus);
      await fetchServices(bus.bus_id);
      await fetchEmployees(bus.bus_id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * fetchServices
   * Loads all services for the given business ID, ordered by name.
   */
  const fetchServices = async (busId: string) => {
    const { data, error } = await supabase.from("service").select("*").eq("bus_id", busId).order("serv_name");
    if (error) {
      console.error(error);
      return;
    }
    setServices(data || []);
  };

  /**
   * fetchEmployees
   * Loads employees with their availability and service links.
   * Normalizes day/time data and pre-computes service names for card display.
   */
  const fetchEmployees = async (busId: string) => {
    // Fetch employees and include their availability and service links so cards can show a quick summary
    const { data, error } = await supabase
      .from("employee")
      .select("*, employee_availability(*), employee_service(*)")
      .eq("bus_id", busId)
      .order("emp_fname");
    if (error) {
      console.error(error);
      return;
    }
    
    // Also fetch current services to ensure we have them for mapping
    const { data: currentServices } = await supabase
      .from("service")
      .select("*")
      .eq("bus_id", busId);
    
    // Map availabilities into a friendly shape on each employee object (normalize day and time)
    const mapped = (data || []).map((e: any) => {
      const serviceIds = (e.employee_service || []).map((es: any) => es.serv_id);
      // Use currentServices from this query instead of relying on state
      const serviceNames = serviceIds.map((id: number) => 
        (currentServices || []).find((s: any) => s.serv_id === id)?.serv_name
      ).filter(Boolean);
      return ({
        ...e,
        serviceIds,
        serviceNames,
        availabilities: (e.employee_availability || []).map((a: any) => ({
          avail_day: normalizeDayIndex(a.avail_day),
          start_time: fmtTimeForInput(a.start_time),
          end_time: fmtTimeForInput(a.end_time),
        })),
      });
    });
    setEmployees(mapped);
  };

  /**
   * addAvailabilityToList
   * Adds a new availability entry to the create form's availability list.
   * Clears the input fields after adding.
   */
  const addAvailabilityToList = () => {
    if (!availDay || !availStart || !availEnd) return;
    setAvailabilities(prev => [...prev, { avail_day: availDay, start_time: availStart, end_time: availEnd }]);
    setAvailDay("");
    setAvailStart("");
    setAvailEnd("");
  };

  /**
   * toggleServiceSelection
   * Toggles a service ID in the selected services list for the create form.
   */
  const toggleServiceSelection = (id: number) => {
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /**
   * handleCreate
   * Creates a new employee with availability and service assignments.
   * Performs three separate DB operations:
   * 1. Insert employee record
   * 2. Insert availability records (if any)
   * 3. Insert service assignment records (if any)
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return toast({ title: "No business", description: "You must be logged in as a business to create employees", variant: "destructive" });
    if (!fname) return toast({ title: "Validation", description: "First name required", variant: "destructive" });

    try {
      const { data: empData, error: empErr } = await supabase.from("employee").insert([{ emp_fname: fname, emp_lname: lname, bus_id: business.bus_id }]).select("emp_id").single();
      if (empErr) throw empErr;
      const empId = empData.emp_id;

      if (availabilities.length) {
        const rows = availabilities.map(a => ({ emp_id: empId, avail_day: a.avail_day, start_time: fmtTimeForDb(a.start_time), end_time: fmtTimeForDb(a.end_time) }));
        const { error: availErr } = await supabase.from("employee_availability").insert(rows);
        if (availErr) throw availErr;
      }

      if (selectedServiceIds.length) {
        const rows = selectedServiceIds.map(sid => ({ emp_id: empId, serv_id: sid }));
        const { error: servErr } = await supabase.from("employee_service").insert(rows);
        if (servErr) throw servErr;
      }

      toast({ title: "Employee created" });
      setFname("");
      setLname("");
      setSelectedServiceIds([]);
      setAvailabilities([]);
      await fetchEmployees(business.bus_id);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  /**
   * handleClickEmployee
   * Loads employee details for editing and scrolls to the edit panel.
   * Fetches fresh data to ensure we have current availability and service links.
   */
  const handleClickEmployee = async (emp: any) => {
    const { data, error } = await supabase
      .from("employee")
      .select(`*, employee_availability(*), employee_service(*)`)
      .eq("emp_id", emp.emp_id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load employee details", variant: "destructive" });
      return;
    }

    setEditingEmployee({
      ...data,
      availabilities: (data?.employee_availability || []).map((a: any) => ({
        avail_day: normalizeDayIndex(a.avail_day),
        start_time: fmtTimeForInput(a.start_time),
        end_time: fmtTimeForInput(a.end_time),
      })),
      serviceIds: (data?.employee_service || []).map((es: any) => es.serv_id),
    });

    // scroll edit panel into view so the user can edit right away
    setTimeout(() => {
      const el = document.getElementById(`edit-employee-${emp.emp_id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  /**
   * toggleEditingService
   * Toggles a service ID in the editing employee's service list.
   */
  const toggleEditingService = (sid: number) => {
    if (!editingEmployee) return;
    const has = editingEmployee.serviceIds?.includes(sid);
    const newList = has ? editingEmployee.serviceIds.filter((x: number) => x !== sid) : [...(editingEmployee.serviceIds || []), sid];
    setEditingEmployee((prev: any) => ({ ...prev, serviceIds: newList }));
  };

  /**
   * handleUpdate
   * Updates an existing employee's information.
   * Uses delete-and-reinsert pattern for availability and service links
   * to handle additions/removals cleanly.
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !business) return;

    try {
      const { error: upErr } = await supabase.from("employee").update({ emp_fname: editingEmployee.emp_fname, emp_lname: editingEmployee.emp_lname }).eq("emp_id", editingEmployee.emp_id);
      if (upErr) throw upErr;

      const { error: delAvailErr } = await supabase.from("employee_availability").delete().eq("emp_id", editingEmployee.emp_id);
      if (delAvailErr) throw delAvailErr;
      if ((editingEmployee.availabilities || []).length) {
        const rows = editingEmployee.availabilities.map((a: Availability) => ({ emp_id: editingEmployee.emp_id, avail_day: a.avail_day, start_time: fmtTimeForDb(a.start_time), end_time: fmtTimeForDb(a.end_time) }));
        const { error: insAvailErr } = await supabase.from("employee_availability").insert(rows);
        if (insAvailErr) throw insAvailErr;
      }

      const { error: delServErr } = await supabase.from("employee_service").delete().eq("emp_id", editingEmployee.emp_id);
      if (delServErr) throw delServErr;
      if ((editingEmployee.serviceIds || []).length) {
        const rows = editingEmployee.serviceIds.map((sid: number) => ({ emp_id: editingEmployee.emp_id, serv_id: sid }));
        const { error: insServErr } = await supabase.from("employee_service").insert(rows);
        if (insServErr) throw insServErr;
      }

      toast({ title: "Employee updated" });
      setEditingEmployee(null);
      await fetchEmployees(business.bus_id);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  /**
   * handleDelete
   * Deletes an employee after user confirmation.
   * Cascading deletes should handle availability and service links automatically.
   */
  const handleDelete = async (empId: number) => {
    if (!confirm("Delete this employee? This will remove their availabilities and service links.")) return;
    try {
      const { error } = await supabase.from("employee").delete().eq("emp_id", empId);
      if (error) throw error;
      toast({ title: "Employee deleted" });
      if (business) await fetchEmployees(business.bus_id);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Employees</h2>
        <p className="text-muted-foreground">No business found for the logged-in user. Please login as a business owner.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Employees for {business.bus_name}</h2>

      {/* Toggle create form button */}
      <div className="mb-4">
        {!showCreateForm ? (
          <Button onClick={() => setShowCreateForm(true)}>Add Employee</Button>
        ) : (
          <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Hide Form</Button>
        )}
      </div>

      {/* Create Employee (toggleable) */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded bg-card">
          <div>
            <label className="block text-sm mb-1">First name</label>
            <Input value={fname} onChange={(e) => setFname(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Last name</label>
            <Input value={lname} onChange={(e) => setLname(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label className="block mb-2">Trainable Services</Label>
            <div className="grid md:grid-cols-2 gap-2">
              {services.map((s: any) => (
                <label key={s.serv_id} className="flex items-center gap-2">
                  <Checkbox checked={selectedServiceIds.includes(s.serv_id)} onCheckedChange={() => toggleServiceSelection(s.serv_id)} />
                  <span>{s.serv_name}</span>
                </label>
              ))}
              {services.length === 0 && <div className="text-sm text-muted-foreground">No services for this business yet.</div>}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="block mb-2">Availability (add one or more)</Label>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                {/* disable days already added to avoid duplicates */}
                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-base md:text-sm" value={availDay} onChange={(e) => setAvailDay(e.target.value)}>
                  <option value="">Select day</option>
                  {weekdayNames.map((name, idx) => {
                    const disabled = availabilities.some(a => String(a.avail_day) === String(idx));
                    return <option key={idx} value={String(idx)} disabled={disabled}>{name}</option>;
                  })}
                </select>
              </div>
              <div>
                <Input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
              </div>
              <div>
                <Input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
              </div>
              <div className="flex items-end justify-end">
                <Button type="button" onClick={addAvailabilityToList}>Add availability</Button>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {availabilities
                .slice()
                .sort((a, b) => Number(a.avail_day) - Number(b.avail_day))
                .map((a, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center p-2">
                    <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm items-center">{getWeekdayName(a.avail_day)}</div>
                    <div>
                      {/* allow quick edits to start/end while creating so users can correct mistakes */}
                      <Input type="time" value={a.start_time} onChange={(e) => setAvailabilities(prev => prev.map((p, i) => i === idx ? { ...p, start_time: e.target.value } : p))} />
                    </div>
                    <div>
                      <Input type="time" value={a.end_time} onChange={(e) => setAvailabilities(prev => prev.map((p, i) => i === idx ? { ...p, end_time: e.target.value } : p))} />
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setAvailabilities(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Create Employee</Button>
            <Button type="button" variant="ghost" className="ml-2" onClick={() => setShowCreateForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Existing Employees */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Employees</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp.emp_id} className="p-4 border rounded bg-card cursor-pointer" onClick={() => handleClickEmployee(emp)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{emp.emp_fname} {emp.emp_lname}</div>
                  {/* Trainable services */}
                  <div className="text-sm mt-2">
                    <div className="font-medium text-sm">Trainable services:</div>
                    {(emp.serviceNames && emp.serviceNames.length) ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {emp.serviceNames.map((s: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 border rounded bg-muted/60">{s}</span>
                        ))}
                      </div>
                    ) : <div className="text-xs text-muted-foreground mt-1">None</div>}
                  </div>

                  {/* Availability label + quick summary; clicking an item opens the edit panel */}
                  <div className="text-sm mt-3">
                    <div className="font-medium text-sm">Availability:</div>
                    {(emp.availabilities || []).length ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(emp.availabilities || []).slice().sort((a:any, b:any) => Number(a.avail_day) - Number(b.avail_day)).map((a: any, i: number) => (
                          <button key={i} onClick={(e) => { e.stopPropagation(); handleClickEmployee(emp); }} className="text-xs px-2 py-1 border rounded bg-muted hover:bg-muted/80">
                            {getWeekdayName(a.avail_day)} {a.start_time}–{a.end_time}
                          </button>
                        ))}
                      </div>
                    ) : <div className="text-xs text-muted-foreground mt-1">No availability</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(emp.emp_id); }}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Employee Panel */}
      {editingEmployee && (
        <div id={`edit-employee-${editingEmployee.emp_id}`} className="mt-8 p-4 border rounded bg-card">
          <h3 className="text-xl font-semibold mb-4">Edit Employee</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <Input value={editingEmployee.emp_fname} onChange={(e) => setEditingEmployee((prev: any) => ({ ...prev, emp_fname: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <Input value={editingEmployee.emp_lname} onChange={(e) => setEditingEmployee((prev: any) => ({ ...prev, emp_lname: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <Label className="block mb-2">Trainable Services</Label>
              <div className="grid md:grid-cols-2 gap-2">
                {services.map((s: any) => (
                  <label key={s.serv_id} className="flex items-center gap-2">
                    <Checkbox checked={(editingEmployee.serviceIds || []).includes(s.serv_id)} onCheckedChange={() => toggleEditingService(s.serv_id)} />
                    <span>{s.serv_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="block mb-2">Availability</Label>

              {editingEmployee.availabilities && (
                <>
                  {weekdayNames.map((dayName, dayIdx) => {
                    const avail = editingEmployee.availabilities.find((av: any) => String(av.avail_day) === String(dayIdx));
                    if (!avail) return null;
                    const idx = editingEmployee.availabilities.findIndex((av: any) => String(av.avail_day) === String(dayIdx));
                    return (
                      <div key={dayIdx} className="grid grid-cols-4 gap-2 items-center mb-2">
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm items-center">{dayName}</div>
                        <div>
                          <Input type="time" value={avail.start_time} onChange={(e) => setEditingEmployee((prev: any) => { const copy = { ...prev }; const list = [...(copy.availabilities || [])]; list[idx] = { ...list[idx], start_time: e.target.value }; copy.availabilities = list; return copy; })} />
                        </div>
                        <div>
                          <Input type="time" value={avail.end_time} onChange={(e) => setEditingEmployee((prev: any) => { const copy = { ...prev }; const list = [...(copy.availabilities || [])]; list[idx] = { ...list[idx], end_time: e.target.value }; copy.availabilities = list; return copy; })} />
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); setEditingEmployee((prev: any) => ({ ...prev, availabilities: prev.availabilities.filter((_: any) => String(_.avail_day) !== String(dayIdx)) })); }}>Remove</Button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div className="mt-2 grid grid-cols-4 gap-2 items-end">
                <div>
                  <select className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-base md:text-sm" value={availDay} onChange={(e) => setAvailDay(e.target.value)}>
                    <option value="">Select day</option>
                    {weekdayNames.map((name, idx) => {
                      const disabled = editingEmployee.availabilities?.some((a: any) => String(a.avail_day) === String(idx));
                      return <option key={idx} value={String(idx)} disabled={disabled}>{name}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <Input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
                </div>
                <div>
                  <Input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
                </div>
                <div className="flex items-end justify-end">
                  <Button type="button" onClick={(e) => {
                    e.preventDefault();
                    if (!editingEmployee) return;
                    const newList = [...(editingEmployee.availabilities || []), { avail_day: availDay, start_time: availStart, end_time: availEnd }];
                    setEditingEmployee((prev: any) => ({ ...prev, availabilities: newList }));
                    setAvailDay(""); setAvailStart(""); setAvailEnd("");
                  }}>Add availability</Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="ghost" onClick={() => setEditingEmployee(null)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Employees;
