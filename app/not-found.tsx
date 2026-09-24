import Link from "next/link";

export default function NotFound() {
  return (
    <div className="nubo-card mx-auto max-w-md nubo-empty">
      <h1 className="text-2xl font-bold">هالصفحة مو موجودة</h1>
      <p className="mt-2 text-sm text-muted">يمكن الرابط تغيّر. ارجع للأعمال أو الرئيسية.</p>
      <Link href="/salons" className="nubo-btn nubo-btn-primary mt-4">
        الأعمال
      </Link>
    </div>
  );
}
