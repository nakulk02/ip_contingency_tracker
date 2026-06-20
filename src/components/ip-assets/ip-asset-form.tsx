"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ASSET_TYPES = ["PATENT", "TRADEMARK"] as const;
const ASSET_STATUSES = ["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"] as const;

interface IpAssetFormProps {
  initialData?: {
    id: string;
    type: string;
    title: string;
    jurisdiction: string;
    filingDate: string | null;
    status: string;
    registrationNumber: string | null;
    description: string | null;
  };
}

export function IpAssetForm({ initialData }: IpAssetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(initialData?.type || "PATENT");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      type,
      title: formData.get("title") as string,
      jurisdiction: formData.get("jurisdiction") as string,
      filingDate: (formData.get("filingDate") as string) || null,
      status,
      registrationNumber: (formData.get("registrationNumber") as string) || null,
      description: (formData.get("description") as string) || null,
    };

    const url = isEdit ? `/api/ip-assets/${initialData.id}` : "/api/ip-assets";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(isEdit ? "IP Asset updated" : "IP Asset created");
      router.push("/ip-assets");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Something went wrong");
    }
  }

  return (
    <Card className="max-w-2xl shadow-md border-0">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit IP Asset" : "New IP Asset"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initialData?.title} placeholder="e.g. AI-Powered Search Engine" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input id="jurisdiction" name="jurisdiction" required defaultValue={initialData?.jurisdiction} placeholder="e.g. US, EU, JP" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filingDate">Filing Date</Label>
              <Input
                id="filingDate"
                name="filingDate"
                type="date"
                defaultValue={initialData?.filingDate ? initialData.filingDate.split("T")[0] : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input id="registrationNumber" name="registrationNumber" defaultValue={initialData?.registrationNumber || ""} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={initialData?.description || ""} placeholder="Describe the IP asset..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create Asset"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/ip-assets")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
