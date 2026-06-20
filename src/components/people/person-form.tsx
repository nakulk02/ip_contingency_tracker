"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const PERSON_ROLES = ["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"] as const;

interface PersonFormProps {
  initialData?: { id: string; name: string; email: string | null; role: string; startDate: string; endDate: string | null };
}

export function PersonForm({ initialData }: PersonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(initialData?.role || "EMPLOYEE");
  const isEdit = !!initialData;
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => { submitTimer.current = null; }, 1000);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const endDate = (formData.get("endDate") as string) || null;

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.get("name") as string, email: (formData.get("email") as string) || null,
      role, startDate, endDate,
    };

    const url = isEdit ? `/api/v1/people/${initialData.id}` : "/api/v1/people";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(isEdit ? "Person updated" : "Person added"); router.push("/people"); router.refresh(); }
      else { const data = await res.json(); toast.error(data.error || "Something went wrong"); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [loading, role, isEdit, initialData, router]);

  return (
    <Card className="max-w-2xl shadow-md border-0">
      <CardHeader><CardTitle>{isEdit ? "Edit Person" : "Add Person"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required defaultValue={initialData?.name} placeholder="Full name" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={initialData?.email || ""} placeholder="email@example.com" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PERSON_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" name="startDate" type="date" required defaultValue={initialData?.startDate ? initialData.startDate.split("T")[0] : ""} /></div>
            <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" name="endDate" type="date" defaultValue={initialData?.endDate ? initialData.endDate.split("T")[0] : ""} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Add Person"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/people")}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
