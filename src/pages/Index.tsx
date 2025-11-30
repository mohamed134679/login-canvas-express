import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="text-center max-w-2xl space-y-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold leading-tight">
            German University in Cairo
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              HR Management System
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            A comprehensive solution for managing university human resources, attendance, and employee operations.
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Link to="/login">
            <Button variant="login" size="lg" className="gap-2 h-12 px-8">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-12 px-8">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;