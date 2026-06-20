"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PersonForm } from "@/components/people/person-form";

interface Person { id: string; name: string; email: string | null; role: string; startDate: string; endDate: string | null }

export default function EditPersonPage() {
  const params = useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/v1/people/${params.id}`, { signal: controller.signal });
        if (res.ok) { setPerson((await res.json()).data); }
        else { setError("Person not found"); }
      } catch (e) { if (e instanceof Error && e.name !== "AbortError") setError("Failed to load"); }
      finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, [params.id]);

  if (loading) return (<div className="space-y-6"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>);
  if (error) return <div className="text-destructive">{error}</div>;
  if (!person) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Edit Person</h1><p className="text-muted-foreground mt-1">Update person details</p></div>
      <PersonForm initialData={person} />
    </div>
  );
}
