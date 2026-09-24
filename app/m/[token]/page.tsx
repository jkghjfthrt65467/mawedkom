import { ManageAppointment } from "@/components/ManageAppointment";
import { getServerBookingByToken } from "@/lib/booking-server";

export default async function ManageAppointmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const initial = await getServerBookingByToken(decoded);
  return <ManageAppointment token={decoded} initial={initial} />;
}
