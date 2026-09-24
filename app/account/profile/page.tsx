"use client";

import { useEffect, useState } from "react";
import { getUser, setUser } from "@/lib/store";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setName(u.name);
      setPhone(u.phone);
      setEmail(u.email);
    }
  }, []);

  return (
    <form
      className="nubo-card grid max-w-lg gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setUser({ name, phone, email });
        setSaved(true);
      }}
    >
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>
      <label className="grid gap-1 text-sm">
        الاسم
        <input className="rounded-2xl border border-line px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        الهاتف
        <input className="rounded-2xl border border-line px-3 py-3" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
      </label>
      <label className="grid gap-1 text-sm">
        الإيميل
        <input className="rounded-2xl border border-line px-3 py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked /> تذكير واتساب قبل الموعد
      </label>
      <button className="nubo-btn nubo-btn-primary">حفظ</button>
      {saved && <p className="text-sm text-palm">انحفظ محلياً على الجهاز.</p>}
    </form>
  );
}
