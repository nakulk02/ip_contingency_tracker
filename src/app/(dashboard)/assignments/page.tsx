"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";

interface Assignment {
  id: string;
  personId: string;
  ipAssetId: string | null;
  scope: string;
  signedDate: string | null;
  status: string;
  fileReference: string | null;
  notes: string | null;
  person: { id: string; name: string; role: string };
  ipAsset: { id: string; title: string; type: string } | null;
}

const statusColors: Record<string, string> = {
  SIGNED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  MISSING: "bg-red-100 text-red-700",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchAssignments() {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    const res = await fetch(`/api/assignments?${params}`);
    const data = await res.json();
    setAssignments(data.data || []);
    setLoading(false);
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assignment deleted");
    }
  }

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">IP assignment agreements</p>
        </div>
        <Link href="/assignments/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SIGNED">Signed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="MISSING">Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No assignments found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Create your first assignment agreement</p>
            <Link href="/assignments/new" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>IP Asset</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/assignments/${a.id}`} className="text-primary hover:underline font-medium">
                        {a.person.name}
                      </Link>
                      <span className="text-xs text-muted-foreground ml-2">{a.person.role}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.ipAsset ? (
                        <span>{a.ipAsset.title}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Company-wide</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{a.scope.replace("_", " ")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.signedDate ? new Date(a.signedDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteAssignment(a.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
