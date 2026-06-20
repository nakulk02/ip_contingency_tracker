"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssignmentForm } from "@/components/assignments/assignment-form";

interface Assignment {
  id: string;
  personId: string;
  ipAssetId: string | null;
  scope: string;
  signedDate: string | null;
  fileReference: string | null;
  status: string;
  notes: string | null;
}

export default function EditAssignmentPage() {
  const params = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAssignment() {
      const res = await fetch(`/api/assignments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.data);
      } else {
        setError("Assignment not found");
      }
      setLoading(false);
    }
    fetchAssignment();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }
  if (error) return <div className="text-destructive">{error}</div>;
  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Assignment</h1>
        <p className="text-muted-foreground mt-1">Update assignment details</p>
      </div>
      <AssignmentForm initialData={assignment} />
    </div>
  );
}
