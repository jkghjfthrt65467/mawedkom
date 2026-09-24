import { AdminGate } from "@/components/admin/AdminGate";
import { AdminPhotos } from "@/components/admin/AdminPhotos";
import { AdminPlans } from "@/components/admin/AdminPlans";

export const metadata = { title: "أدمن الموقع" };

export default function AdminPage() {
  return (
    <AdminGate>
      <div className="space-y-10">
        <AdminPlans />
        <AdminPhotos />
      </div>
    </AdminGate>
  );
}
