"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PersonOption { id: string; name: string; role: string }
interface AssetOption { id: string; title: string; type: string }

interface AssignmentFormProps {
  initialData?: {
    id: string; personId: string; ipAssetId: string | null; scope: string;
    signedDate: string | null; fileReference: string | null; status: string; notes: string | null;
  };
}

export function AssignmentForm({ initialData }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [dataError, setDataError] = useState("");
  const [personId, setPersonId] = useState(initialData?.personId || "");
  const [ipAssetId, setIpAssetId] = useState(initialData?.ipAssetId || "NONE");
  const [scope, setScope] = useState(initialData?.scope || "COMPANY_WIDE");
  const [status, setStatus] = useState(initialData?.status || "MISSING");
  const isEdit = !!initialData;
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/v1/people", { signal: controller.signal }).then((r) => r.json()),
      fetch("/api/v1/ip-assets", { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([pData, aData]) => {
        setPeople(pData.data || []);
        setAssets(aData.data || []);
      })
      .catch((e) => {
        if (e instanceof Error && e.name !== "AbortError") {
          setDataError("Failed to load form data");
          toast.error("Failed to load people and assets");
        }
      });
    return () => controller.abort();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => { submitTimer.current = null; }, 1000);

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      personId, ipAssetId: ipAssetId === "NONE" ? null : ipAssetId, scope, status,
      signedDate: (formData.get("signedDate") as string) || null,
      fileReference: (formData.get("fileReference") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const url = isEdit ? `/api/v1/assignments/${initialData.id}` : "/api/v1/assignments";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(isEdit ? "Assignment updated" : "Assignment created"); router.push("/assignments"); router.refresh(); }
      else { const data = await res.json(); toast.error(data.error || "Something went wrong"); }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [loading, personId, ipAssetId, scope, status, isEdit, initialData, router]);

  if (dataError) return <div className="text-destructive">{dataError}</div>;

  return (
    <Card className="max-w-2xl shadow-md border-0">
      <CardHeader><CardTitle>{isEdit ? "Edit Assignment" : "New Assignment Agreement"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Person</Label>
              <Select value={personId} onValueChange={setPersonId} required>
                <SelectTrigger><SelectValue placeholder="Select a person..." /></SelectTrigger>
                <SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IP Asset (optional)</Label>
              <Select value={ipAssetId} onValueChange={setIpAssetId}>
                <SelectTrigger><SelectValue placeholder="Company-wide" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Company-wide (no specific asset)</SelectItem>
                  {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.title} ({a.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={setScope}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="COMPANY_WIDE">Company-wide</SelectItem><SelectItem value="ASSET_SPECIFIC">Asset-specific</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SIGNED">Signed</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="MISSING">Missing</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signedDate">Signed Date</Label>
              <Input id="signedDate" name="signedDate" type="date" defaultValue={initialData?.signedDate ? initialData.signedDate.split("T")[0] : ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileReference">File Reference</Label>
            <Input id="fileReference" name="fileReference" placeholder="e.g. /documents/ip-assignment.pdf" defaultValue={initialData?.fileReference || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Any additional notes..." defaultValue={initialData?.notes || ""} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !personId}>{loading ? "Saving..." : isEdit ? "Update" : "Create Assignment"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/assignments")}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
