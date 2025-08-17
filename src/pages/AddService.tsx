import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * AddService
 *
 * Form page for creating new services within a business.
 * 
 * Features:
 * - Simple form for service creation with validation
 * - Auto-fetches business ID from current session
 * - Redirects back to services list on successful creation
 * - Responsive grid layout for form fields
 *
 * Database table: `service`
 * Fields collected:
 * - serv_name: Service name (required)
 * - serv_desc: Service description (optional)
 * - serv_min_duration: Duration in minutes (default: 30)
 * - serv_price: Service price (default: 0)
 * - serv_emp_no: Required employee count (default: 1)
 * - bus_id: Business ID from auth session
 *
 * Navigation flow:
 * - Accessed via Services page "Add New Service" button
 * - Returns to /services on successful creation
 */
const AddService = () => {
  // Form state for service creation
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [minDuration, setMinDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [empNo, setEmpNo] = useState(1);
  const [busId, setBusId] = useState<string | null>(null);

  const navigate = useNavigate();

  /**
   * Load business ID from current auth session on component mount.
   * Uses session.user.id as the business identifier.
   */
  useEffect(() => {
    const fetchBusId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setBusId(session.user.id);
    };
    fetchBusId();
  }, []);

  /**
   * handleCreate
   * Handles form submission to create a new service.
   * 
   * Validation:
   * - Requires business ID (from auth session)
   * - Form-level required fields handled by HTML validation
   * 
   * Error handling:
   * - Uses browser alert for simplicity (consider replacing with toast)
   * - Returns early on validation failure
   * 
   * Success flow:
   * - Inserts service record with all form data
   * - Navigates back to services listing page
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId) return;

    const { error } = await supabase.from('service').insert([{
      serv_name: name,
      serv_desc: desc,
      serv_min_duration: minDuration,
      serv_price: price,
      serv_emp_no: empNo,
      bus_id: busId
    }]);
    if (error) return alert(error.message);

    navigate("/services"); // go back to services listing after creation
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Add Service</h2>
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Input type="number" value={String(minDuration)} onChange={(e) => setMinDuration(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Price</label>
          <Input type="number" value={String(price)} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Employee Count</label>
          <Input type="number" value={String(empNo)} onChange={(e) => setEmpNo(Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Create Service</Button>
        </div>
      </form>
    </div>
  );
};

export default AddService;
