import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CandidatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Candidate</h1>
      <p className="text-sm text-muted-foreground">
        Welcome to your unified job application workspace. This is a placeholder
        page; we’ll wire in real data and flows later.
      </p>
      <div className="grid gap-4 max-w-md">
        <Input placeholder="Search roles, companies, or keywords" />
        <div className="flex gap-2">
          <Button>Search</Button>
          <Button variant="secondary">Save Search</Button>
        </div>
      </div>
    </div>
  );
}
