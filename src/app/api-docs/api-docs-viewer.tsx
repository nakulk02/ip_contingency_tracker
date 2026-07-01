"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react touches `window` at import time, so it must be loaded
// client-side only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function ApiDocsViewer() {
  return <SwaggerUI url="/api/openapi" docExpansion="list" defaultModelsExpandDepth={1} />;
}
