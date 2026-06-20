"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Trash2 } from "lucide-react";

interface Person { id: string; name: string; email: string | null; role: string; startDate: string; endDate: string | null }

const roleColors: Record<string, string> = {
  FOUNDER: "bg-purple-100 text-purple-700", EMPLOYEE: "bg-blue-100 text-blue-700",
  CONTRACTOR: "bg-amber-100 text-amber-700", ADVISOR: "bg-emerald-100 text-emerald-700",
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const controllerRef = useRef<AbortController | null>(null);

  async function fetchPeople() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/v1/people?${params}`, { signal: controller.signal });
      if (res.ok) { setPeople((await res.json()).data || []); }
      else { toast.error("Failed to load people"); }
    } catch (e) { if (e instanceof Error && e.name !== "AbortError") toast.error("Network error"); }
    finally { setLoading(false); }
  }

  async function deletePerson(id: string) {
    if (!confirm("Delete this person? Their assignment history will be preserved.")) return;
    const res = await fetch(`/api/v1/people/${id}`, { method: "DELETE" });
    if (res.ok) { setPeople((prev) => prev.filter((p) => p.id !== id)); toast.success("Person archived"); }
    else { toast.error("Failed to delete person"); }
  }

  useEffect(() => { fetchPeople(); return () => controllerRef.current?.abort(); }, [roleFilter]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold tracking-tight">People</h1><p className="text-muted-foreground mt-1">Team members, contractors, and advisors</p></div>
        <Link href="/people/new"><Button className="gap-2"><Plus className="w-4 h-4" />Add Person</Button></Link>
      </div>
      <div className="flex gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All Roles</SelectItem><SelectItem value="FOUNDER">Founder</SelectItem><SelectItem value="EMPLOYEE">Employee</SelectItem><SelectItem value="CONTRACTOR">Contractor</SelectItem><SelectItem value="ADVISOR">Advisor</SelectItem></SelectContent>
        </Select>
      </div>
      {people.length === 0 ? (
        <Card className="border-0 shadow-md"><CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/40 mb-4" /><p className="text-lg font-medium text-muted-foreground">No people found</p>
          <Link href="/people/new" className="mt-4"><Button variant="outline" className="gap-2"><Plus className="w-4 h-4" />Add Person</Button></Link>
        </CardContent></Card>
      ) : (
        <Card className="border-0 shadow-md"><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{people.map((person) => (
            <TableRow key={person.id} className="hover:bg-muted/50">
              <TableCell><Link href={`/people/${person.id}`} className="text-primary hover:underline font-medium">{person.name}</Link></TableCell>
              <TableCell className="text-sm text-muted-foreground">{person.email || "—"}</TableCell>
              <TableCell><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[person.role] || ""}`}>{person.role}</span></TableCell>
              <TableCell className="text-sm">{new Date(person.startDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-sm">{person.endDate ? new Date(person.endDate).toLocaleDateString() : <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Current</span>}</TableCell>
              <TableCell><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deletePerson(person.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></CardContent></Card>
      )}
    </div>
  );
}
