import type { BookingRecord, Staff } from "./types";

export type BookingActor = {
  role?: "owner" | "staff";
  pin?: string;
  staffId?: string;
};

export function withStaffPermissionDefaults(staff: Staff): Staff {
  return {
    ...staff,
    canEditOwnAppointments: staff.canEditOwnAppointments !== false,
    canEditOtherStaffAppointments: Boolean(staff.canEditOtherStaffAppointments),
  };
}

export function canEditOwnAppointments(staff: Staff | undefined): boolean {
  if (!staff) return false;
  return staff.canEditOwnAppointments !== false;
}

export function canEditOtherStaffAppointments(staff: Staff | undefined): boolean {
  return Boolean(staff?.canEditOtherStaffAppointments);
}

export function isOwnStaffBooking(booking: Pick<BookingRecord, "staffId" | "staffName">, staff: Staff): boolean {
  if (booking.staffId) return booking.staffId === staff.id;
  return Boolean(booking.staffName) && booking.staffName === staff.name;
}

export function isScheduleEdit(
  current: Pick<BookingRecord, "date" | "time" | "durationMin" | "staffId" | "staffName" | "serviceName" | "serviceNames" | "status">,
  next: Pick<BookingRecord, "date" | "time" | "durationMin" | "staffId" | "staffName" | "serviceName" | "serviceNames" | "status">,
): boolean {
  const servicesChanged =
    (current.serviceName || "") !== (next.serviceName || "") ||
    JSON.stringify(current.serviceNames || []) !== JSON.stringify(next.serviceNames || []);
  return (
    current.date !== next.date ||
    current.time !== next.time ||
    Number(current.durationMin || 0) !== Number(next.durationMin || 0) ||
    (current.staffId || "") !== (next.staffId || "") ||
    (current.staffName || "") !== (next.staffName || "") ||
    servicesChanged ||
    (next.status === "cancelled" && current.status !== "cancelled")
  );
}

export function isOperationalStatusChange(currentStatus: BookingRecord["status"], nextStatus: BookingRecord["status"]): boolean {
  if (currentStatus === nextStatus) return false;
  return nextStatus === "completed" || nextStatus === "no_show";
}

export function staffScheduleDeniedReason(staff: Staff, booking: Pick<BookingRecord, "staffId" | "staffName">): string | null {
  const own = isOwnStaffBooking(booking, staff);
  if (own) {
    return canEditOwnAppointments(staff) ? null : "ما عندك صلاحية تعديل مواعيدك. المدير يفعّلها من صفحة الموظفين.";
  }
  return canEditOtherStaffAppointments(staff)
    ? null
    : "ما عندك صلاحية تعديل مواعيد باقي الموظفين.";
}
