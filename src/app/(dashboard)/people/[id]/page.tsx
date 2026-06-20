"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PersonForm } from "@/components/people/person-form";

interface Person {
  id: string;
  name: string;
  email: string | null;
  role: string;
  startDate: string;
  endDate: string | null;
}

export default function EditPersonPage() {
  const params = useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPerson() {
      const res = await fetch(`/api/people/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPerson(data.data);
      } else {
        setError("Person not found");
      }
      setLoading(false);
    }
    fetchPerson();
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
  if (!person) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
        <p className="text-muted-foreground mt-1">Update person details</p>
      </div>
      <PersonForm initialData={person} />
    </div>
  );
}
