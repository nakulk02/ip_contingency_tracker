"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteForm } from "@/components/notes/note-form";

interface Note {
  id: string;
  title: string;
  body: string | null;
}

export default function EditNotePage() {
  const params = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNote() {
      const res = await fetch(`/api/notes/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data.data);
      } else {
        setError("Note not found");
      }
      setLoading(false);
    }
    fetchNote();
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
  if (!note) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Note</h1>
        <p className="text-muted-foreground mt-1">Update your note</p>
      </div>
      <NoteForm initialData={note} />
    </div>
  );
}
