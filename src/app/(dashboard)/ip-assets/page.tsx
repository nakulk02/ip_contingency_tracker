"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Plus, Trash2 } from "lucide-react";

interface IpAsset {
  id: string;
  type: string;
  title: string;
  jurisdiction: string;
  filingDate: string | null;
  status: string;
  registrationNumber: string | null;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  FILED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
  REGISTERED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  ABANDONED: "bg-red-100 text-red-700",
};

const typeColors: Record<string, string> = {
  PATENT: "bg-indigo-100 text-indigo-700",
  TRADEMARK: "bg-violet-100 text-violet-700",
};

export default function IpAssetsPage() {
  const [assets, setAssets] = useState<IpAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchAssets() {
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    const res = await fetch(`/api/ip-assets?${params}`);
    const data = await res.json();
    setAssets(data.data || []);
    setLoading(false);
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this IP asset?")) return;
    const res = await fetch(`/api/ip-assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("IP Asset deleted");
    }
  }

  useEffect(() => {
    fetchAssets();
  }, [typeFilter, statusFilter]);

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
          <h1 className="text-3xl font-bold tracking-tight">IP Assets</h1>
          <p className="text-muted-foreground mt-1">Patents, trademarks, and other IP</p>
        </div>
        <Link href="/ip-assets/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Asset
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PATENT">Patent</SelectItem>
            <SelectItem value="TRADEMARK">Trademark</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="FILED">Filed</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="REGISTERED">Registered</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="ABANDONED">Abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assets.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No IP assets found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add your first intellectual property asset</p>
            <Link href="/ip-assets/new" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Asset
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filing Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/ip-assets/${asset.id}`} className="text-primary hover:underline font-medium">
                        {asset.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[asset.type] || ""}`}>
                        {asset.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-mono font-medium">
                        {asset.jurisdiction}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[asset.status] || ""}`}>
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {asset.filingDate ? new Date(asset.filingDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteAsset(asset.id)}
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
