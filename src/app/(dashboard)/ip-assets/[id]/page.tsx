"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IpAssetForm } from "@/components/ip-assets/ip-asset-form";

interface IpAsset {
  id: string; type: string; title: string; jurisdiction: string;
  filingDate: string | null; status: string; registrationNumber: string | null; description: string | null;
}

export default function EditIpAssetPage() {
  const params = useParams();
  const [asset, setAsset] = useState<IpAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/v1/ip-assets/${params.id}`, { signal: controller.signal });
        if (res.ok) { setAsset((await res.json()).data); }
        else { setError("IP Asset not found"); }
      } catch (e) { if (e instanceof Error && e.name !== "AbortError") setError("Failed to load"); }
      finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, [params.id]);

  if (loading) return (<div className="space-y-6"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>);
  if (error) return <div className="text-destructive">{error}</div>;
  if (!asset) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Edit IP Asset</h1><p className="text-muted-foreground mt-1">Update asset details</p></div>
      <IpAssetForm initialData={asset} />
    </div>
  );
}
