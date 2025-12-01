import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle } from "lucide-react";

interface LeavesApprovalProps {
  hrId: number;
}

const LeavesApproval = ({ hrId }: LeavesApprovalProps) => {
  const [requestId, setRequestId] = useState("");
  const [leaveType, setLeaveType] = useState<"annual-accidental" | "unpaid" | "compensation">("annual-accidental");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleProcess = async () => {
    if (!requestId) {
      setError("Please enter a request ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`http://localhost:5001/api/hr/leaves/${leaveType}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: parseInt(requestId), hrId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process leave");
      }
      
      setSuccess(`Leave request ${requestId} processed successfully`);
      setRequestId("");
    } catch (err: any) {
      setError(err.message || "Failed to process leave request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Leave Requests</CardTitle>
        <CardDescription>Enter request ID to process leave (the system will automatically approve or reject based on the criteria)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={leaveType} onValueChange={(value: any) => setLeaveType(value)}>
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual-accidental">Annual/Accidental</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="compensation">Compensation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestId">Request ID</Label>
            <Input
              id="requestId"
              type="number"
              placeholder="Enter request ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleProcess}
            disabled={loading || !requestId}
            className="w-full gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Processing..." : "Process Leave"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeavesApproval;
