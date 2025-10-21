import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RecruiterPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Recruiter</h1>
      <p className="text-sm text-muted-foreground">
        Centralized pipeline insights and structured candidate data. This is a
        placeholder page; we’ll connect real data flows later.
      </p>
      <div className="grid gap-4 max-w-md">
        <Input placeholder="Search candidates, skills, or roles" />
        <div className="flex gap-2">
          <Button>Search</Button>
          <Button variant="secondary">Create Job</Button>
        </div>
      </div>
    </div>
  );
}
