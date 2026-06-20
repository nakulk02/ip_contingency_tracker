"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssignmentForm } from "@/components/assignments/assignment-form";

interface Assignment {
  id: string; personId: string; ipAssetId: string | null; scope: string;
  signedDate: string | null; fileReference: string | null; status: string; notes: string | null;
}

export default function EditAssignmentPage() {
  const params = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/v1/assignments/${params.id}`, { signal: controller.signal });
        if (res.ok) { setAssignment((await res.json()).data); }
        else { setError("Assignment not found"); }
      } catch (e) { if (e instanceof Error && e.name !== "AbortError") setError("Failed to load"); }
      finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, [params.id]);

  if (loading) return (<div className="space-y-6"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>);
  if (error) return <div className="text-destructive">{error}</div>;
  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Edit Assignment</h1><p className="text-muted-foreground mt-1">Update assignment details</p></div>
      <AssignmentForm initialData={assignment} />
    </div>
  );
}
