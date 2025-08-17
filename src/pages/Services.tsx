import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * Services
 *
 * Admin page for managing services within a business. Features:
 * - List all services for the current business (based on session user ID)
 * - Click to edit service details inline
 * - Delete services with confirmation
 * - Navigate to add new service page
 *
 * Database table: `service`
 * Fields: serv_id, serv_name, serv_desc, serv_min_duration, serv_price, serv_emp_no, bus_id
 *
 * Note: Currently uses session.user.id as bus_id. This assumes a 1:1 mapping
 * between auth users and businesses. For multi-business support, consider
 * fetching business records by user email instead.
 */
const Services = () => {
  // Core data state
  const [services, setServices] = useState<any[]>([]);
  const [busId, setBusId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Edit form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [minDuration, setMinDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(1);

  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Load business ID and services on component mount.
   * Uses the current session user ID as the business ID.
   */
  useEffect(() => {
    const fetchBusIdAndServices = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setBusId(session.user.id);
        fetchServices(session.user.id);
      }
    };
    fetchBusIdAndServices();
  }, []);

  /**
   * fetchServices
   * Loads all services for the given business ID, ordered by creation (newest first).
   */
  const fetchServices = async (currentBusId: string) => {
    const { data, error } = await supabase
      .from("service")
      .select("*")
      .eq("bus_id", currentBusId)
      .order("serv_id", { ascending: false });

    if (error) return console.error(error);
    setServices(data || []);
  };

  /**
   * handleDelete
   * Deletes a service after user confirmation.
   * Note: This may fail if the service has related records (appointments, employee_service).
   * Consider adding cascade deletes or soft deletes for production.
   */
  const handleDelete = async (serviceId: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      const { error } = await supabase.from("service").delete().eq("serv_id", serviceId);
      if (error) throw error;
      toast({ title: "Service deleted" });
      if (busId) fetchServices(busId);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  /**
   * handleEditClick
   * Loads service data into edit form and scrolls to the edit panel.
   */
  const handleEditClick = (s: any) => {
    setEditingService(s);
    setName(s.serv_name);
    setDesc(s.serv_desc);
    setMinDuration(s.serv_min_duration);
    setPrice(s.serv_price);
    setEmployeeCount(s.serv_emp_no);
    setTimeout(() => {
      const el = document.getElementById(`edit-service-${s.serv_id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  /**
   * handleUpdate
   * Updates the currently edited service with form data.
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !busId) return;

    try {
      const { error } = await supabase
        .from("service")
        .update({
          serv_name: name,
          serv_desc: desc,
          serv_min_duration: minDuration,
          serv_price: price,
          serv_emp_no: employeeCount,
        })
        .eq("serv_id", editingService.serv_id);
      if (error) throw error;

      toast({ title: "Service updated" });
      setEditingService(null);
      if (busId) fetchServices(busId);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Services</h2>
      <Button onClick={() => navigate("/add-service")} className="mb-4">
        Add New Service
      </Button>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div
            key={s.serv_id}
            id={`edit-service-${s.serv_id}`}
            className="p-4 border rounded bg-card cursor-pointer"
            onClick={() => handleEditClick(s)}
          >
            <div className="font-semibold">{s.serv_name}</div>
            <div className="text-sm text-muted-foreground">{s.serv_desc}</div>
            <div className="text-sm mt-2">
              Duration: {s.serv_min_duration} min — Price: {s.serv_price} — Employees: {s.serv_emp_no}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              onClick={(e) => { e.stopPropagation(); handleDelete(s.serv_id); }}
            >
              Delete
            </Button>
          </div>
        ))}
        {services.length === 0 && <p className="text-sm text-muted-foreground">No services yet.</p>}
      </div>

      {/* Edit Service Form */}
      {editingService && (
        <div className="mt-8 p-4 border rounded bg-card">
          <h3 className="text-xl font-semibold mb-4">Edit Service</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Service Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Min Duration (minutes)</label>
              <Input type="number" value={minDuration} onChange={(e) => setMinDuration(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Price</label>
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Employee Count</label>
              <Input type="number" value={employeeCount} min={1} onChange={(e) => setEmployeeCount(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="ghost" onClick={() => setEditingService(null)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Services;
