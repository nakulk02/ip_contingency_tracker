"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface NoteFormProps {
  initialData?: { id: string; title: string; body: string | null };
}

export function NoteForm({ initialData }: NoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => { submitTimer.current = null; }, 1000);

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = { title: formData.get("title") as string, body: formData.get("body") as string };

    const url = isEdit ? `/api/v1/notes/${initialData.id}` : "/api/v1/notes";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(isEdit ? "Note updated" : "Note created"); router.push("/notes"); router.refresh(); }
      else { const data = await res.json(); toast.error(data.error || "Something went wrong"); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [loading, isEdit, initialData, router]);

  return (
    <Card className="max-w-2xl shadow-md border-0">
      <CardHeader><CardTitle>{isEdit ? "Edit Note" : "New Note"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" required defaultValue={initialData?.title} placeholder="Note title" /></div>
          <div className="space-y-2"><Label htmlFor="body">Body</Label><Textarea id="body" name="body" rows={8} defaultValue={initialData?.body || ""} placeholder="Write your note..." /></div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Create Note"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/notes")}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
