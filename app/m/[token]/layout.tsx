import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة الموعد",
  description: "عرض موعدك وتعديله أو إلغاؤه من رابط واتساب، بدون تسجيل دخول.",
  robots: { index: false, follow: false },
};

export default function ManageAppointmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
