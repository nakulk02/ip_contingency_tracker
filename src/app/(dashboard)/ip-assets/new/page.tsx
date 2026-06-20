"use client";

import { IpAssetForm } from "@/components/ip-assets/ip-asset-form";

export default function NewIpAssetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New IP Asset</h1>
        <p className="text-muted-foreground mt-1">Register a patent or trademark</p>
      </div>
      <IpAssetForm />
    </div>
  );
}
