import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const CREDS = "mawedkom-owner-creds";

function waUrl(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function App() {
  const [server, setServer] = useState("");
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("1234");
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState([]);
  const [status, setStatus] = useState("سجّل دخول حتى التطبيق يرسل من واتساب جهازك.");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CREDS).then((raw) => {
      if (raw) {
        try {
          const c = JSON.parse(raw);
          setServer(c.server || "");
          setSlug(c.slug || "");
          setPin(c.pin || "1234");
        } catch {
          /* ignore */
        }
      }
      setReady(true);
    });
  }, []);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-nubo-role": "owner",
      "x-nubo-pin": pin,
    }),
    [pin],
  );

  const pull = useCallback(async () => {
    if (!server || !slug) return;
    const base = server.replace(/\/$/, "");
    const res = await fetch(`${base}/api/whatsapp/outbox?slug=${encodeURIComponent(slug)}`, {
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "فشل قراءة الطابور");
    setPending(data.pending || []);
    await fetch(`${base}/api/whatsapp/outbox`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ slug, action: "heartbeat" }),
    });
    return data.pending || [];
  }, [headers, server, slug]);

  const flush = useCallback(
    async (rows) => {
      if (sending.current || !rows?.length) return;
      sending.current = true;
      setBusy(true);
      const base = server.replace(/\/$/, "");
      try {
        for (const item of rows) {
          const url = waUrl(item.phone, item.text);
          const opened = await Linking.canOpenURL(url);
          if (!opened) {
            setStatus("واتساب مو مثبت على الجهاز.");
            break;
          }
          await Linking.openURL(url);
          await fetch(`${base}/api/whatsapp/outbox`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ slug, action: "sent", ids: [item.id] }),
          });
        }
        setStatus("فرّغنا الطابور من جهازك.");
        await pull();
      } catch (err) {
        setStatus(err.message || "ما قدرنا نرسل. نعيد المحاولة لما يرجع النت.");
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [headers, pull, server, slug],
  );

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      const on = Boolean(state.isConnected);
      setOnline(on);
      if (on && slug && server) {
        pull()
          .then((rows) => {
            if (rows?.length) return flush(rows);
          })
          .catch(() => setStatus("الجهاز أونلاين، بس السيرفر ما رد. نعيد المحاولة."));
      }
    });
    return () => sub();
  }, [flush, pull, server, slug]);

  useEffect(() => {
    if (!slug || !server) return;
    const id = setInterval(() => {
      if (!online) return;
      pull().catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [online, pull, server, slug]);

  async function save() {
    const next = { server: server.trim(), slug: slug.trim(), pin: pin.trim() || "1234" };
    if (!next.server || !next.slug) {
      setStatus("اكتب رابط الموقع ورمز المشروع.");
      return;
    }
    await AsyncStorage.setItem(CREDS, JSON.stringify(next));
    setServer(next.server);
    setSlug(next.slug);
    setPin(next.pin);
    setStatus("محفوظ. أول ما يصير نت، الرسائل تنرسل من واتسابك.");
    try {
      const rows = await pull();
      if (rows?.length) await flush(rows);
    } catch (err) {
      setStatus(err.message || "ما قدرنا نتصل.");
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.wrap}>
        <ActivityIndicator color="#ff7802" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.kicker}>موعدكم · أندرويد</Text>
        <Text style={styles.title}>رسائل واتساب من جهازك</Text>
        <Text style={styles.p}>
          السيرفر ما يرسل. الرسائل تنتظر هني، وجهازك يفتح واتسابك ويرسل. إذا ماكو نت، أول ما يرجع النت نكمل الإرسال.
        </Text>
        <View style={[styles.badge, { backgroundColor: online ? "#fff3e8" : "#ffece8" }]}>
          <Text style={styles.badgeText}>{online ? "الجهاز متصل" : "بلا نت — الطابور محفوظ إلى أن يرجع"}</Text>
        </View>
        <Text style={styles.label}>رابط الموقع</Text>
        <TextInput
          style={styles.input}
          value={server}
          onChangeText={setServer}
          placeholder="https://mawedkom.onrender.com"
          placeholderTextColor="#999"
          autoCapitalize="none"
          textAlign="left"
        />
        <Text style={styles.label}>رمز المشروع</Text>
        <TextInput style={styles.input} value={slug} onChangeText={setSlug} autoCapitalize="none" textAlign="left" />
        <Text style={styles.label}>رمز المدير</Text>
        <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="number-pad" textAlign="left" />
        <Pressable style={styles.btn} onPress={save} disabled={busy}>
          <Text style={styles.btnText}>{busy ? "نرسل…" : "حفظ وفرّغ الطابور"}</Text>
        </Pressable>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.count}>بالانتظار: {pending.length}</Text>
        {pending.slice(0, 8).map((item) => (
          <Text key={item.id} style={styles.row}>
            {item.kind} · {item.phone}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#ffffff" },
  inner: { padding: 24, gap: 10 },
  kicker: { color: "#ff7802", fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "800", color: "#111", writingDirection: "rtl" },
  p: { color: "#666", lineHeight: 24, writingDirection: "rtl" },
  badge: { borderRadius: 16, padding: 12 },
  badgeText: { color: "#111", fontWeight: "600", writingDirection: "rtl" },
  label: { color: "#111", fontWeight: "600", marginTop: 6, writingDirection: "rtl" },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111",
  },
  btn: { backgroundColor: "#ff7802", borderRadius: 18, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "800" },
  status: { color: "#666", lineHeight: 22, writingDirection: "rtl" },
  count: { fontWeight: "700", color: "#111" },
  row: { color: "#666", fontSize: 13 },
});
