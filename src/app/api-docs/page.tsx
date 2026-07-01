import { ApiDocsViewer } from "./api-docs-viewer";

export const metadata = {
  title: "API Docs — IP Contingency Tracker",
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ApiDocsViewer />
    </div>
  );
}
