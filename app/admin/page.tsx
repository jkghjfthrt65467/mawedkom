import { AdminConsole } from "@/components/admin/AdminConsole";
import { AdminGate } from "@/components/admin/AdminGate";

export const metadata = { title: "أدمن الموقع" };

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminConsole />
    </AdminGate>
  );
}
