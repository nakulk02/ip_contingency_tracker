"use client";

import { PersonForm } from "@/components/people/person-form";

export default function NewPersonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Person</h1>
        <p className="text-muted-foreground mt-1">Add a team member, contractor, or advisor</p>
      </div>
      <PersonForm />
    </div>
  );
}
