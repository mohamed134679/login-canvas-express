import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Building2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"employee" | "admin">("employee");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // No validation for now as requested
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/3 to-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl flex gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-1 flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  GUC HR System
                </h1>
                <p className="text-sm text-muted-foreground">German University in Cairo</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold leading-tight">
                Welcome to the
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  HR Management Portal
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md">
                Access your employee dashboard, manage attendance, and handle HR operations all in one place.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border/50 shadow-sm">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Active Employees</p>
                  <p className="text-lg font-semibold">1,247</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border/50 shadow-sm">
                <GraduationCap className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Departments</p>
                  <p className="text-lg font-semibold">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 w-full max-w-md mx-auto">
          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex lg:hidden items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">GUC HR System</h1>
                  <p className="text-xs text-muted-foreground">German University in Cairo</p>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                {/* User Type Selection */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUserType("employee")}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      userType === "employee"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("admin")}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      userType === "admin"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Admin
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-sm font-medium">
                      {userType === "admin" ? "Admin ID" : "Employee ID"}
                    </Label>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder={userType === "admin" ? "Enter admin ID" : "Enter employee ID"}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="h-11 bg-background border-border/70 focus-visible:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 bg-background border-border/70 focus-visible:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button type="button" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="login"
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  Sign In
                </Button>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Need help? Contact{" "}
            <a href="mailto:support@guc.edu.eg" className="text-primary hover:text-primary/80 font-medium transition-colors">
              IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;