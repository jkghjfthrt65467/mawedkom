import { getManagedBusinessFromDisk } from "./business-server";
import {
  canEditOtherStaffAppointments,
  canEditOwnAppointments,
  isOperationalStatusChange,
  isOwnStaffBooking,
  isScheduleEdit,
  staffScheduleDeniedReason,
  withStaffPermissionDefaults,
  type BookingActor,
} from "./staff-permissions";
import { MANAGED_SLUG, MANAGER_PIN, STAFF_PIN } from "./store-constants";
import type { BookingRecord, Staff } from "./types";

export type AuthResult = { ok: true } | { ok: false; status: number; error: string };

const CUSTOMER_STATUSES = new Set(["cancelled"]);

export function parseBookingActor(body: unknown): BookingActor | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { actor?: unknown }).actor;
  if (!raw || typeof raw !== "object") return null;
  const actor = raw as BookingActor;
  if (actor.role !== "owner" && actor.role !== "staff") return null;
  return {
    role: actor.role,
    pin: typeof actor.pin === "string" ? actor.pin : "",
    staffId: typeof actor.staffId === "string" ? actor.staffId : undefined,
  };
}

function rosterStaff(staff: Staff[], id?: string): Staff | undefined {
  if (!id) return undefined;
  return staff.map(withStaffPermissionDefaults).find((s) => s.id === id);
}

export async function authorizeBookingWrite(opts: {
  actor: BookingActor | null;
  current: BookingRecord | null;
  next: BookingRecord;
}): Promise<AuthResult> {
  const actor = opts.actor;
  const biz = await getManagedBusinessFromDisk(opts.next.businessSlug || MANAGED_SLUG);
  const staffList = (biz?.staff || []).map(withStaffPermissionDefaults);

  if (actor?.role === "owner") {
    if (actor.pin?.trim() !== MANAGER_PIN) {
      return { ok: false, status: 401, error: "رمز المدير غلط." };
    }
    return { ok: true };
  }

  if (actor?.role === "staff") {
    if (actor.pin?.trim() !== STAFF_PIN) {
      return { ok: false, status: 401, error: "رمز الموظف غلط." };
    }
    const me = rosterStaff(staffList, actor.staffId);
    if (!me) {
      return { ok: false, status: 401, error: "جلسة الموظف باطلة." };
    }
    return authorizeStaffWrite(me, opts.current, opts.next);
  }

  return authorizeCustomerWrite(opts.current, opts.next);
}

function authorizeStaffWrite(me: Staff, current: BookingRecord | null, next: BookingRecord): AuthResult {
  const target = current || next;
  const ownTarget = isOwnStaffBooking(target, me);
  const movingToOther = Boolean(next.staffId || next.staffName) && !isOwnStaffBooking(next, me);

  if (!current) {
    if (movingToOther && !canEditOtherStaffAppointments(me)) {
      return { ok: false, status: 403, error: "ما عندك صلاحية إضافة مواعيد لباقي الموظفين." };
    }
    if (!movingToOther && !canEditOwnAppointments(me)) {
      return { ok: false, status: 403, error: "ما عندك صلاحية إضافة مواعيد على تقويمك." };
    }
    return { ok: true };
  }

  if (next.status === "confirmed" && current.status === "pending") {
    return { ok: false, status: 403, error: "تأكيد المواعيد المعلّقة للمدير فقط." };
  }

  if (isScheduleEdit(current, next)) {
    const fromDenied = staffScheduleDeniedReason(me, current);
    if (fromDenied) return { ok: false, status: 403, error: fromDenied };
    if (movingToOther && !canEditOtherStaffAppointments(me)) {
      return { ok: false, status: 403, error: "ما عندك صلاحية تحويل الموعد لموظف ثاني." };
    }
  }

  if (isOperationalStatusChange(current.status, next.status)) {
    if (ownTarget) return { ok: true };
    if (!canEditOtherStaffAppointments(me)) {
      return { ok: false, status: 403, error: "ما عندك صلاحية تحديث مواعيد باقي الموظفين." };
    }
  }

  return { ok: true };
}

function authorizeCustomerWrite(current: BookingRecord | null, next: BookingRecord): AuthResult {
  if (!current) return { ok: true };
  if (next.status !== current.status && !CUSTOMER_STATUSES.has(next.status)) {
    return { ok: false, status: 403, error: "ما تكدر تغيّر حالة الموعد بهالطريقة." };
  }
  return { ok: true };
}
