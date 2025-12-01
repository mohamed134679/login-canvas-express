import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface DeductionsManagementProps {
  hrId: number;
}

const DeductionsManagement = ({ hrId }: DeductionsManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeIdDays, setEmployeeIdDays] = useState("");

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setWarning("");

      const response = await fetch("http://localhost:5001/api/hr/deductions/missing-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process deduction");
        return;
      }

      // Check if it's an "already exists" message
      if (data.message.includes("already exists")) {
        setWarning(data.message);
      } else {
        setSuccess(data.message);
      }
      setEmployeeId("");
    } catch (err) {
      setError("Failed to process deduction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDays = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setWarning("");

      const response = await fetch("http://localhost:5001/api/hr/deductions/missing-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employeeIdDays }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process deduction");
        return;
      }

      // Check if it's an "already exists" message
      if (data.message.includes("already exists")) {
        setWarning(data.message);
      } else {
        setSuccess(data.message);
      }
      setEmployeeIdDays("");
    } catch (err) {
      setError("Failed to process deduction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="missing-hours" className="space-y-4">
      <TabsList>
        <TabsTrigger value="missing-hours">Missing Hours</TabsTrigger>
        <TabsTrigger value="missing-days">Missing Days</TabsTrigger>
      </TabsList>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {warning && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{warning}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      <TabsContent value="missing-hours">
        <Card>
          <CardHeader>
            <CardTitle>Process Missing Hours Deduction</CardTitle>
            <CardDescription>
              Enter employee ID to process deduction for missing hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitHours} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-id-hours">Employee ID</Label>
                <Input
                  id="employee-id-hours"
                  type="number"
                  placeholder="Enter employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Process Deduction"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="missing-days">
        <Card>
          <CardHeader>
            <CardTitle>Process Missing Days Deduction</CardTitle>
            <CardDescription>
              Enter employee ID to process deduction for missing days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitDays} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-id-days">Employee ID</Label>
                <Input
                  id="employee-id-days"
                  type="number"
                  placeholder="Enter employee ID"
                  value={employeeIdDays}
                  onChange={(e) => setEmployeeIdDays(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Process Deduction"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DeductionsManagement;
