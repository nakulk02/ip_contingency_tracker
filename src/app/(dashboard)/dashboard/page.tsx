"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, UserX, AlertTriangle, TrendingUp,
  Shield, Users, FileText, ArrowRight,
} from "lucide-react";

interface GapData {
  assetsAtRisk: number;
  peopleWithoutAgreements: number;
  highPriorityPeople: number;
  assets: Array<{ id: string; title: string; type: string; jurisdiction: string; status: string }>;
  people: Array<{ id: string; name: string; role: string; email: string | null; endDate: string | null; priority: string }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", FILED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-purple-100 text-purple-700", REGISTERED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-orange-100 text-orange-700", ABANDONED: "bg-red-100 text-red-700",
};
const roleColors: Record<string, string> = {
  FOUNDER: "bg-purple-100 text-purple-700", EMPLOYEE: "bg-blue-100 text-blue-700",
  CONTRACTOR: "bg-amber-100 text-amber-700", ADVISOR: "bg-emerald-100 text-emerald-700",
};

export default function DashboardPage() {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/v1/dashboard/ownership-gaps?limit=5", { signal: controller.signal });
        if (res.ok) { setData((await res.json()).data); }
        else { setError("Failed to load dashboard"); }
      } catch (e) { if (e instanceof Error && e.name !== "AbortError") setError("Network error"); }
      finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  if (error) return <div className="text-destructive">{error}</div>;

  const gaps = data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ownership gap overview and risk summary</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Assets at Risk</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg"><ShieldAlert className="w-4 h-4 text-red-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{gaps.assetsAtRisk}</div>
            <p className="text-xs text-red-600/70 mt-1">No signed agreements</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">People Without Agreements</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg"><UserX className="w-4 h-4 text-amber-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{gaps.peopleWithoutAgreements}</div>
            <p className="text-xs text-amber-600/70 mt-1">Need IP assignments</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">High Priority</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-orange-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{gaps.highPriorityPeople}</div>
            <p className="text-xs text-orange-600/70 mt-1">Current team, no agreements</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Coverage</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              {gaps.assetsAtRisk === 0 && gaps.peopleWithoutAgreements === 0 ? "100%" : "Gaps found"}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1">
              {gaps.assetsAtRisk === 0 && gaps.peopleWithoutAgreements === 0 ? "All clear" : "Action required"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/assignments/new"><Button className="gap-2"><FileText className="w-4 h-4" />New Assignment</Button></Link>
        <Link href="/ip-assets"><Button variant="outline" className="gap-2"><Shield className="w-4 h-4" />View Assets</Button></Link>
        <Link href="/people"><Button variant="outline" className="gap-2"><Users className="w-4 h-4" />View People</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Assets Without Agreements</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">IP assets with no signed assignment</p>
            </div>
            <Link href="/ip-assets"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ArrowRight className="w-3 h-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            {gaps.assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-8 h-8 mx-auto mb-2 text-emerald-400" /><p className="text-sm font-medium">All assets covered</p>
              </div>
            ) : (
              <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{gaps.assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell><Link href={`/ip-assets/${asset.id}`} className="text-primary hover:underline font-medium text-sm">{asset.title}</Link></TableCell>
                    <TableCell className="text-sm">{asset.type}</TableCell>
                    <TableCell><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status] || ""}`}>{asset.status}</span></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">People Without Agreements</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Team members missing IP assignments</p>
            </div>
            <Link href="/people"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ArrowRight className="w-3 h-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            {gaps.people.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 text-emerald-400" /><p className="text-sm font-medium">Everyone has agreements</p>
              </div>
            ) : (
              <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader>
                <TableBody>{gaps.people.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell><Link href={`/people/${person.id}`} className="text-primary hover:underline font-medium text-sm">{person.name}</Link></TableCell>
                    <TableCell><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[person.role] || ""}`}>{person.role}</span></TableCell>
                    <TableCell><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${person.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{person.priority}</span></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
