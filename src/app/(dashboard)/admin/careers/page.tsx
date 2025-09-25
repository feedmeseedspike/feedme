import { Suspense } from "react";
import CareersClient from "./CareersClient";

export default function CareersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Careers Management</h1>
        <p className="text-gray-600 mt-1">Manage job postings and applications</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CareersClient />
      </Suspense>
    </div>
  );
}