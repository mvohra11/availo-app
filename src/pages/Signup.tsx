import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Signup
 *
 * Registration page for new business users to create accounts.
 * 
 * Features:
 * - Two-step registration process (auth user + business record)
 * - Form validation for required fields and password confirmation
 * - Business information collection (name, owner details, phone)
 * - Integration with Supabase Auth and database
 * - Error handling with user feedback
 * - Automatic redirect to dashboard on success
 *
 * Registration flow:
 * 1. Collect business and owner information
 * 2. Validate form inputs (required fields, password match)
 * 3. Create Supabase Auth user with email/password
 * 4. Insert business record using the new user's ID
 * 5. Redirect to dashboard for immediate use
 *
 * Database design notes:
 * - Uses auth user ID as business ID for 1:1 relationship
 * - Stores business email separately for easy business lookup
 * - Owner name fields are optional (business-only accounts supported)
 */
const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busName, setBusName] = useState("");
  const [busOwnerFname, setBusOwnerFname] = useState("");
  const [busOwnerLname, setBusOwnerLname] = useState("");
  const [busPhone, setBusPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(""); // <--- Added

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); // reset error

    // Basic validation
    if (!email || !password || !busName || !busPhone) {
      setFormError("Please fill out all required fields.");
      return;
    }
    if (!busOwnerFname && !busOwnerLname) {
      setFormError("Please provide either first name or last name.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setLoading(false);
      setFormError(authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      setFormError("Error creating user.");
      return;
    }

    // Step 2: Insert business info into `business` table
    const { error: businessError } = await supabase.from("business").insert([
      {
        bus_name: busName,
        bus_owner_fname: busOwnerFname || null,
        bus_owner_lname: busOwnerLname || null,
        bus_phone: busPhone,
        bus_id: userId,
        bus_email: email
      },
    ]);

    setLoading(false);

    if (businessError) {
      setFormError(businessError.message);
      return;
    }

    // Redirect user
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Sign up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Business Name</label>
            <Input value={busName} onChange={(e) => setBusName(e.target.value)} required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">First Name</label>
              <Input value={busOwnerFname} onChange={(e) => setBusOwnerFname(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Last Name</label>
              <Input value={busOwnerLname} onChange={(e) => setBusOwnerLname(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <Input
              type="tel"
              value={busPhone}
              onChange={(e) => setBusPhone(e.target.value)}
              pattern="^\+?[0-9]*$"
              placeholder="+1234567890"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {formError && (
          <p className="text-red-600 mt-4">{formError}</p>
        )}
      </div>
    </div>
  );
};

export default Signup;
