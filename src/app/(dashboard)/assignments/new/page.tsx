"use client";

import { AssignmentForm } from "@/components/assignments/assignment-form";

export default function NewAssignmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Assignment</h1>
        <p className="text-muted-foreground mt-1">Create an IP assignment agreement</p>
      </div>
      <AssignmentForm />
    </div>
  );
}
