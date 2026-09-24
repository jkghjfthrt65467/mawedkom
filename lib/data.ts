import { addDaysIso, isoInBaghdad } from "./calendar";
import { IRAQ_TZ } from "./booking-message";
import { formatDateLatn, formatNumber } from "./latin-digits";
import { AR_IQ_LATN } from "./locale";
import { categoryLabel, cityLabel } from "./i18n";
import { includesFold } from "./search-text";
import type { Business, Category, City } from "./types";

export const CITIES: City[] = [
  { slug: "baghdad", name: "بغداد", nameEn: "Baghdad" },
  { slug: "basra", name: "البصرة", nameEn: "Basra" },
  { slug: "erbil", name: "أربيل", nameEn: "Erbil" },
  { slug: "najaf", name: "النجف", nameEn: "Najaf" },
  { slug: "karbala", name: "كربلاء", nameEn: "Karbala" },
  { slug: "mosul", name: "الموصل", nameEn: "Mosul" },
  { slug: "sulaymaniyah", name: "السليمانية", nameEn: "Sulaymaniyah" },
  { slug: "kirkuk", name: "كركوك", nameEn: "Kirkuk" },
  { slug: "hillah", name: "الحلة", nameEn: "Hillah" },
  { slug: "nasiriyah", name: "الناصرية", nameEn: "Nasiriyah" },
  { slug: "diwaniyah", name: "الديوانية", nameEn: "Diwaniyah" },
  { slug: "amarah", name: "العمارة", nameEn: "Amarah" },
  { slug: "ramadi", name: "الرمادي", nameEn: "Ramadi" },
  { slug: "dohuk", name: "دهوك", nameEn: "Dohuk" },
  { slug: "kut", name: "الكوت", nameEn: "Kut" },
];

export const CATEGORIES: Category[] = [
  { slug: "salon", name: "صالونات", nameEn: "Salon", icon: "✿", blurb: "شعر، صبغ، تسريح ومناسبات. كابينة وخصوصية للسيدات." },
  { slug: "barber", name: "حلاقة رجالية", nameEn: "Barber", icon: "✂", blurb: "قص شعر ولحية بموعد، بدون انتظار في الدكان." },
  { slug: "beauty", name: "أخصائيو التجميل", nameEn: "Beautician", icon: "✦", blurb: "بشرة، حواجب، رموش ومكياج. الجلسة بسعر ومدة واضحة." },
  { slug: "nails", name: "أظافر", nameEn: "Nails", icon: "◆", blurb: "مانيكير وبدكير وتصميم. الموعد على الطاولة مو بالطابور." },
  { slug: "clinic", name: "عيادات", nameEn: "Clinic", icon: "✚", blurb: "أسنان، جلدية، كشف واستشارة. الموعد محجوز للطبيب." },
  { slug: "doctor", name: "أطباء", nameEn: "Doctor", icon: "⚕", blurb: "كشف عام واختصاص. الساعة محجوزة للدكتور، بدون ازدحام انتظار." },
  { slug: "psychology", name: "علماء النفس", nameEn: "Psychologist", icon: "◉", blurb: "جلسة إرشاد أو علاج نفسي بموعد خاص وسرية." },
  { slug: "physio", name: "علاج طبيعي", nameEn: "Physio", icon: "↺", blurb: "جلسة علاج طبيعي وإعادة تأهيل. الكرسي أو الطاولة محجوزة إلك." },
  { slug: "laser", name: "ليزر", nameEn: "Laser", icon: "✧", blurb: "إزالة شعر وكشف جلدي. السلسلة ما تضيع إذا الموعد ثابت." },
  { slug: "fitness", name: "رياضة ولياقة", nameEn: "Fitness", icon: "▸", blurb: "تمرين شخصي وكوتش. الساعة لك، مو مشتركين زيادة." },
  { slug: "carwash", name: "غسيل سيارات", nameEn: "Car wash", icon: "▢", blurb: "غسيل وتلميع بموعد. توصل والسيارة تدخل مباشرة." },
  { slug: "vet", name: "بيطرة", nameEn: "Vet", icon: "🐾", blurb: "كشف وتلقيح لحيوانك. الموعد مع الطبيب البيطري." },
  { slug: "petgroom", name: "تزيين حيوانات", nameEn: "Pet grooming", icon: "❀", blurb: "قص فرو واستحمام وتزيين. الموعد لحيوانك بدون انتظار." },
  { slug: "home", name: "تنظيف منازل", nameEn: "Home cleaning", icon: "⌂", blurb: "فريق تنظيف بساعة محددة. تعرف من يجي ومتى يخلص." },
];

const WEEK = [
  { days: "السبت — الخميس", open: "09:00", close: "22:00" },
  { days: "الجمعة", open: "14:00", close: "22:00" },
];

export const BUSINESSES: Business[] = [
  {
    slug: "rafidain-barber",
    name: "حلاقة الرافدين",
    category: "barber",
    city: "baghdad",
    district: "الكرادة",
    address: "شارع أبو نؤاس، قرب جسر الأحرار، الكرادة، بغداد",
    phone: "07701234567",
    about: "صالون حلاقة رجالي بهوية بغدادية هادئة. قص كلاسيك وفييد، عناية لحية، ومواعيد بلا انتظار على الرصيف.",
    lat: 33.3247,
    lng: 44.4215,
    approvalMode: "AUTO",
    whatsappLink: "https://wa.me/9647701234567",
    rating: 4.9,
    reviewCount: 186,
    accent: "#ff7802",
    coverTone: "from-[#2a1810] to-[#ff7802]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["واجهة الصالون", "كرسي الحلاقة", "زاوية العناية"],
    services: [
      { id: "cut", name: "قص شعر", durationMin: 30, priceIqd: 15000, popular: true, sortOrder: 0 },
      { id: "combo", name: "شعر + لحية", durationMin: 45, priceIqd: 20000, offerPriceIqd: 16000, popular: true, sortOrder: 1 },
      { id: "beard", name: "تهذيب لحية", durationMin: 20, priceIqd: 8000, sortOrder: 2 },
      { id: "kids", name: "قص أطفال", durationMin: 25, priceIqd: 10000, sortOrder: 3 },
      { id: "royal", name: "حلاقة ملكية", durationMin: 60, priceIqd: 35000, sortOrder: 4 },
    ],
    staff: [
      {
        id: "hassan",
        name: "حسن العبودي",
        role: "حلاق أول",
        initials: "ح ع",
        serviceIds: ["cut", "beard", "combo", "kids", "royal"],
        bio: "قص كلاسيك وفييد منذ 15 سنة. يحب الموعد ينضبط بالدقيقة.",
        reviews: [
          { id: "sh1", author: "مرتضى ح.", rating: 5, date: "2 أيلول 2026", text: "قص نظيف وموعد بالضبط. ما ضيّعت وقت بالانتظار." },
          { id: "sh2", author: "سامر ق.", rating: 5, date: "28 آب 2026", text: "حسن شغله مرتب واللحية طلعت مضبوطة." },
        ],
      },
      {
        id: "ali",
        name: "علي الجبوري",
        role: "حلاق",
        initials: "ع ج",
        serviceIds: ["cut", "beard", "combo", "kids"],
        bio: "متخصص بلحية الأطفال والشباب.",
        reviews: [{ id: "sa1", author: "ياسر ن.", rating: 4, date: "20 آب 2026", text: "علي هادي ومرتب ويا الأطفال." }],
      },
      { id: "omar", name: "عمر الكاظمي", role: "حلاق", initials: "ع ك", serviceIds: ["cut", "beard", "combo"], bio: "قص سريع للمناسبات ومساء الجمعة." },
    ],
    reviews: [
      { id: "r1", author: "مرتضى ح.", rating: 5, date: "2 أيلول 2026", text: "قص نظيف وموعد بالضبط. ما ضيّعت وقت بالانتظار.", reply: "نورتنا أبو مرتضى، منور الرافدين." },
      { id: "r2", author: "سامر ق.", rating: 5, date: "28 آب 2026", text: "حسن شغله مرتب واللحية طلعت مضبوطة." },
      { id: "r3", author: "ياسر ن.", rating: 4, date: "20 آب 2026", text: "المكان نظيف والقهوة زينة. أنصح بالحجز قبل الجمعة." },
    ],
  },
  {
    slug: "dijla-gold-salon",
    name: "صالون دجلة الذهبي",
    category: "salon",
    city: "baghdad",
    district: "المنصور",
    address: "شارع 14 رمضان، المنصور، بغداد",
    phone: "07801112233",
    about: "صالون نسائي للمناسبات والعناية الأسبوعية: صبغ، تسريح، عناية شعر، وخصوصية كاملة للكابينة.",
    rating: 4.8,
    reviewCount: 142,
    accent: "#7A3E2B",
    coverTone: "from-[#5c2e22] to-[#7A3E2B]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["الاستقبال", "كابينة الصبغ", "زاوية التسريح"],
    services: [
      { id: "blow", name: "تسريح وفون", durationMin: 45, priceIqd: 25000 },
      { id: "color", name: "صبغ شعر", durationMin: 120, priceIqd: 85000 },
      { id: "keratin", name: "كيراتين", durationMin: 150, priceIqd: 150000 },
      { id: "bridal", name: "تسريحة عروس", durationMin: 180, priceIqd: 250000 },
      { id: "trim", name: "قص أطراف", durationMin: 30, priceIqd: 18000 },
    ],
    staff: [
      { id: "zainab", name: "زينب الربيعي", role: "خبيرة شعر", initials: "ز ر", serviceIds: ["blow", "color", "keratin", "bridal", "trim"] },
      { id: "noor", name: "نور الياسري", role: "مصففة", initials: "ن ي", serviceIds: ["blow", "trim", "bridal"] },
    ],
    reviews: [
      { id: "r1", author: "هدى س.", rating: 5, date: "5 أيلول 2026", text: "تسريحة العرس طلعت أحلى من الصورة. زينب دقيقة بالموعد." },
      { id: "r2", author: "إسراء م.", rating: 5, date: "1 أيلول 2026", text: "الكابينة خاصة والصبغ ثابت. حجز أونلاين وفّر عليّ واتساب." },
    ],
  },
  {
    slug: "baghdad-touch",
    name: "لمسة بغداد للتجميل",
    category: "beauty",
    city: "baghdad",
    district: "العرصات",
    address: "العرصات، شارع المتنبي الفرعي، بغداد",
    phone: "07719998877",
    about: "مركز عناية بشرة وفلتر وإجراءات تجميل خفيفة، بجلسات واضحة المدة والسعر قبل ما تحجزين.",
    rating: 4.9,
    reviewCount: 98,
    accent: "#8B5A2B",
    coverTone: "from-[#3d2a1c] to-[#8B5A2B]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["غرفة العناية", "الاستشارة", "الانتظار"],
    services: [
      { id: "facial", name: "عناية بشرة", durationMin: 60, priceIqd: 45000 },
      { id: "brow", name: "تشذيب حواجب", durationMin: 20, priceIqd: 12000 },
      { id: "lash", name: "رموش", durationMin: 75, priceIqd: 55000 },
      { id: "peel", name: "تقشير لطيف", durationMin: 40, priceIqd: 40000 },
    ],
    staff: [
      { id: "sara", name: "سارة الحسني", role: "أخصائية بشرة", initials: "س ح", serviceIds: ["facial", "peel", "brow"] },
      { id: "lina", name: "لينا محمد", role: "خبيرة رموش", initials: "ل م", serviceIds: ["lash", "brow"] },
    ],
    reviews: [
      { id: "r1", author: "فاطمة ع.", rating: 5, date: "3 أيلول 2026", text: "الجلسة مرتبة وما في استعجال. السعر ظاهر قبل الحجز." },
    ],
  },
  {
    slug: "basra-royal",
    name: "حلاق البصرة الملكي",
    category: "barber",
    city: "basra",
    district: "العشار",
    address: "العشار، شارع الكويت، البصرة",
    phone: "07825554433",
    about: "حلاقة رجالية بحرية المزاج: فييد نظيف، عطر خفيف، وموعد ينحجز من الجوال قبل ما توصل.",
    rating: 4.8,
    reviewCount: 121,
    accent: "#ff7802",
    coverTone: "from-[#181410] to-[#c45e02]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["الكراسي", "المرايا", "الانتظار"],
    services: [
      { id: "cut", name: "قص شعر", durationMin: 30, priceIqd: 12000 },
      { id: "combo", name: "شعر + لحية", durationMin: 45, priceIqd: 18000 },
      { id: "shave", name: "حلاقة سكين", durationMin: 25, priceIqd: 10000 },
    ],
    staff: [
      { id: "karrar", name: "كرار الشريفي", role: "حلاق أول", initials: "ك ش", serviceIds: ["cut", "combo", "shave"] },
      { id: "hussein", name: "حسين الموسوي", role: "حلاق", initials: "ح م", serviceIds: ["cut", "combo"] },
    ],
    reviews: [
      { id: "r1", author: "أحمد ب.", rating: 5, date: "30 آب 2026", text: "من أفضل الحلاقات بالعشار. الموعد انضبط." },
    ],
  },
  {
    slug: "erbil-style",
    name: "صالون أربيل ستايل",
    category: "salon",
    city: "erbil",
    district: "عنكاوا",
    address: "عنكاوا، شارع 60 متر، أربيل",
    phone: "07504443322",
    about: "صالون مختلط الأقسام بفريق كردي وعربي. قص عصري وصبغ للمناسبات في أربيل.",
    rating: 4.7,
    reviewCount: 76,
    accent: "#8B5A2B",
    coverTone: "from-[#2a1810] to-[#8B5A2B]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["الاستقبال", "قسم الرجال", "قسم السيدات"],
    services: [
      { id: "cut-m", name: "قص رجالي", durationMin: 30, priceIqd: 18000 },
      { id: "cut-w", name: "قص نسائي", durationMin: 45, priceIqd: 28000 },
      { id: "color", name: "صبغ", durationMin: 90, priceIqd: 70000 },
    ],
    staff: [
      { id: "dara", name: "دارا أحمد", role: "حلاق", initials: "د أ", serviceIds: ["cut-m"] },
      { id: "shilan", name: "شيلان عثمان", role: "مصففة", initials: "ش ع", serviceIds: ["cut-w", "color"] },
    ],
    reviews: [
      { id: "r1", author: "ريبين ك.", rating: 5, date: "25 آب 2026", text: "حجزت من موعدكم ووصلت بدقيقة. شغل نظيف." },
    ],
  },
  {
    slug: "najaf-star",
    name: "نجمة النجف للسيدات",
    category: "salon",
    city: "najaf",
    district: "حي الأمير",
    address: "حي الأمير، قرب شارع الكوفة، النجف الأشرف",
    phone: "07816667788",
    about: "صالون نسائي بكابينة مغلقة، مناسب للزيارات العائلية ومواسم الزيارات والمناسبات.",
    rating: 4.9,
    reviewCount: 64,
    accent: "#6B4F2A",
    coverTone: "from-[#3d3018] to-[#6B4F2A]",
    hours: WEEK,
    galleryLabels: ["الكابينة", "التسريح", "الانتظار الخاص"],
    services: [
      { id: "blow", name: "تسريح", durationMin: 40, priceIqd: 20000 },
      { id: "hijab", name: "تسريحة محجّبة", durationMin: 50, priceIqd: 28000 },
      { id: "henna", name: "حناء", durationMin: 70, priceIqd: 22000 },
    ],
    staff: [
      { id: "ban", name: "بان العلوي", role: "مصففة", initials: "ب ع", serviceIds: ["blow", "hijab", "henna"] },
    ],
    reviews: [
      { id: "r1", author: "زهراء ف.", rating: 5, date: "18 آب 2026", text: "خصوصية ممتازة والموعد ما يتأخر." },
    ],
  },
  {
    slug: "karbala-beauty",
    name: "كربلاء بيوتي",
    category: "beauty",
    city: "karbala",
    district: "الحسين",
    address: "حي الحسين، كربلاء المقدسة",
    phone: "07723334455",
    about: "عناية بشرة وأظافر بمواعيد مرنة قبل المواسم والزيارات.",
    rating: 4.6,
    reviewCount: 41,
    accent: "#7A3E2B",
    coverTone: "from-[#4a2418] to-[#7A3E2B]",
    hours: WEEK,
    galleryLabels: ["العناية", "الأظافر"],
    services: [
      { id: "facial", name: "عناية بشرة", durationMin: 50, priceIqd: 35000 },
      { id: "nails", name: "مانيكير", durationMin: 40, priceIqd: 18000 },
    ],
    staff: [
      { id: "haya", name: "هيا عبد الأمير", role: "تجميل", initials: "ه ع", serviceIds: ["facial", "nails"] },
    ],
    reviews: [
      { id: "r1", author: "نور ق.", rating: 5, date: "12 آب 2026", text: "المركز هادي والحجز سهل من الجوال." },
    ],
  },
  {
    slug: "mosul-barber",
    name: "موصل باربر شوب",
    category: "barber",
    city: "mosul",
    district: "الحدباء",
    address: "الحدباء، الموصل",
    phone: "07770001122",
    about: "حلاقة شبابية في الموصل مع تقويم واضح لكل حلاق بالفريق.",
    rating: 4.8,
    reviewCount: 88,
    accent: "#ff7802",
    coverTone: "from-[#2a1c12] to-[#d96400]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["الصالون", "الفريق"],
    services: [
      { id: "cut", name: "قص شعر", durationMin: 30, priceIqd: 10000 },
      { id: "combo", name: "شعر + لحية", durationMin: 40, priceIqd: 15000 },
      { id: "skin", name: "عناية بشرة سريعة", durationMin: 20, priceIqd: 12000 },
    ],
    staff: [
      { id: "mahmoud", name: "محمود الطائي", role: "حلاق أول", initials: "م ط", serviceIds: ["cut", "combo", "skin"] },
      { id: "saad", name: "سعد الحمداني", role: "حلاق", initials: "س ح", serviceIds: ["cut", "combo"] },
    ],
    reviews: [
      { id: "r1", author: "عبد الله م.", rating: 5, date: "9 أيلول 2026", text: "بعد التعب من الانتظار، الحجز أونلاين فرّجها." },
    ],
  },
  {
    slug: "sulay-nails",
    name: "أظافر السليمانية",
    category: "nails",
    city: "sulaymaniyah",
    district: "سالم",
    address: "شارع سالم، السليمانية",
    phone: "07715556677",
    about: "استوديو أظافر وتصميم، مواعيد دقيقة حتى ما ينكسر الجدول.",
    rating: 4.9,
    reviewCount: 53,
    accent: "#8B5A2B",
    coverTone: "from-[#4a3420] to-[#8B5A2B]",
    hours: WEEK,
    galleryLabels: ["طاولة الأظافر", "التصاميم"],
    services: [
      { id: "man", name: "مانيكير", durationMin: 45, priceIqd: 22000 },
      { id: "ped", name: "بدكير", durationMin: 50, priceIqd: 25000 },
      { id: "art", name: "تصميم أظافر", durationMin: 70, priceIqd: 40000 },
    ],
    staff: [
      { id: "lana", name: "لانا كريم", role: "فنانة أظافر", initials: "ل ك", serviceIds: ["man", "ped", "art"] },
    ],
    reviews: [
      { id: "r1", author: "شاخة و.", rating: 5, date: "2 أيلول 2026", text: "التصميم يثبت أسبوعين. حجز الساعة كان فاضي فعلاً." },
    ],
  },
  {
    slug: "baghdad-smile",
    name: "عيادة ابتسامة بغداد",
    category: "clinic",
    city: "baghdad",
    district: "الجادرية",
    address: "الجادرية، قرب جامعة بغداد",
    phone: "07901239876",
    about: "عيادة أسنان بجلسات كشف وعلاج وتبييض. الموعد محجوز للطبيب المحدد.",
    rating: 4.7,
    reviewCount: 110,
    accent: "#181410",
    coverTone: "from-[#181410] to-[#ff7802]",
    hours: [
      { days: "السبت — الخميس", open: "10:00", close: "20:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    featured: true,
    galleryLabels: ["الاستقبال", "غرفة الكشف"],
    services: [
      { id: "check", name: "كشف أسنان", durationMin: 30, priceIqd: 25000 },
      { id: "clean", name: "تنظيف", durationMin: 45, priceIqd: 50000 },
      { id: "white", name: "تبييض", durationMin: 60, priceIqd: 120000 },
    ],
    staff: [
      { id: "drn", name: "د. ندى الشمري", role: "طبيبة أسنان", initials: "ن ش", serviceIds: ["check", "clean", "white"] },
      { id: "dra", name: "د. أحمد الراوي", role: "طبيب أسنان", initials: "أ ر", serviceIds: ["check", "clean"] },
    ],
    reviews: [
      { id: "r1", author: "ليث ع.", rating: 5, date: "7 أيلول 2026", text: "ما انقطعت بالانتظار. الدكتورة واضحة بالشرح." },
    ],
  },
  {
    slug: "yasmin-laser",
    name: "عيادة ليزر الياسمين",
    category: "laser",
    city: "baghdad",
    district: "اليرموك",
    address: "اليرموك، شارع الأميرات، بغداد",
    phone: "07718880099",
    about: "عيادة ليزر وكشف جلدي بجلسات واضحة المدة. الموعد محجوز للأخصائية، حتى ما تضيع السلسلة.",
    rating: 4.8,
    reviewCount: 72,
    accent: "#6B4F2A",
    coverTone: "from-[#3a2c18] to-[#6B4F2A]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["جهاز الليزر", "الاستشارة"],
    services: [
      { id: "face", name: "ليزر وجه", durationMin: 30, priceIqd: 40000 },
      { id: "full", name: "ليزر جسم", durationMin: 75, priceIqd: 90000 },
      { id: "consult", name: "استشارة", durationMin: 20, priceIqd: 10000 },
    ],
    staff: [
      { id: "rasha", name: "رشا نعمة", role: "أخصائية ليزر", initials: "ر ن", serviceIds: ["face", "full", "consult"] },
    ],
    reviews: [
      { id: "r1", author: "ميس ح.", rating: 5, date: "29 آب 2026", text: "الجلسة بالموعد والتذكير وصل واتساب." },
    ],
  },
  {
    slug: "erbil-clinic",
    name: "عيادة شفا أربيل",
    category: "clinic",
    city: "erbil",
    district: "عنكاوا",
    address: "عنكاوا، شارع 60 متر، أربيل",
    phone: "07501112200",
    about: "عيادة جلدية وكشف عام. الموعد مع الطبيب المحدد، بدون ازدحام في الانتظار.",
    rating: 4.8,
    reviewCount: 61,
    accent: "#181410",
    coverTone: "from-[#181410] to-[#ff7802]",
    hours: [
      { days: "السبت — الخميس", open: "09:00", close: "20:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    featured: true,
    galleryLabels: ["الاستقبال", "غرفة الكشف"],
    services: [
      { id: "exam", name: "كشف عام", durationMin: 20, priceIqd: 25000 },
      { id: "skin", name: "كشف جلدية", durationMin: 30, priceIqd: 35000 },
      { id: "follow", name: "مراجعة", durationMin: 15, priceIqd: 15000 },
    ],
    staff: [
      { id: "drk", name: "د. كاروان علي", role: "طبيب جلدية", initials: "ك ع", serviceIds: ["exam", "skin", "follow"] },
      { id: "drs", name: "د. شيلان محمد", role: "طبيبة عامة", initials: "ش م", serviceIds: ["exam", "follow"] },
    ],
    reviews: [
      { id: "r1", author: "هيمن ر.", rating: 5, date: "4 أيلول 2026", text: "الكشف بالموعد والدكتور واضح بالشرح." },
    ],
  },
  {
    slug: "hillah-clinic",
    name: "عيادة الفرات للأسنان",
    category: "clinic",
    city: "hillah",
    district: "الجمهورية",
    address: "حي الجمهورية، الحلة",
    phone: "07812223344",
    about: "كشف وتنظيف وحشوات بموعد ثابت. الكرسي محجوز إلك وما ينباع لغيرك.",
    rating: 4.7,
    reviewCount: 47,
    accent: "#181410",
    coverTone: "from-[#2c2418] to-[#ff7802]",
    hours: [
      { days: "السبت — الخميس", open: "10:00", close: "19:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    galleryLabels: ["الاستقبال", "كرسي الأسنان"],
    services: [
      { id: "check", name: "كشف أسنان", durationMin: 25, priceIqd: 20000 },
      { id: "clean", name: "تنظيف", durationMin: 40, priceIqd: 40000 },
      { id: "fill", name: "حشوة", durationMin: 45, priceIqd: 55000 },
    ],
    staff: [
      { id: "drm", name: "د. مصطفى العنزي", role: "طبيب أسنان", initials: "م ع", serviceIds: ["check", "clean", "fill"] },
    ],
    reviews: [
      { id: "r1", author: "كاظم ر.", rating: 5, date: "22 آب 2026", text: "ما انتظرت بالطابور. الموعد كان مضبوط." },
    ],
  },
  {
    slug: "mansour-fit",
    name: "كوتش المنصور",
    category: "fitness",
    city: "baghdad",
    district: "المنصور",
    address: "المنصور، شارع 14 رمضان، بغداد",
    phone: "07807778899",
    about: "تمرين شخصي بموعد ثابت مع الكوتش. الساعة لك، مو مجموعة زيادة على الجهاز.",
    rating: 4.7,
    reviewCount: 39,
    accent: "#ff7802",
    coverTone: "from-[#181410] to-[#c45e02]",
    hours: WEEK,
    galleryLabels: ["قاعة التمرين", "الأوزان"],
    services: [
      { id: "pt", name: "تمرين شخصي", durationMin: 60, priceIqd: 25000 },
      { id: "assess", name: "تقييم لياقة", durationMin: 40, priceIqd: 20000 },
      { id: "box", name: "ملاكمة خفيفة", durationMin: 45, priceIqd: 22000 },
    ],
    staff: [
      { id: "mustafa", name: "مصطفى الربيعي", role: "كوتش", initials: "م ر", serviceIds: ["pt", "assess", "box"] },
    ],
    reviews: [
      { id: "r1", author: "عمار ن.", rating: 5, date: "31 آب 2026", text: "حجزت الساعة وما انتظرت الكوتش. الجدول واضح." },
    ],
  },
  {
    slug: "karrada-wash",
    name: "غسيل الكرادة السريع",
    category: "carwash",
    city: "baghdad",
    district: "الكرادة",
    address: "الكرادة الداخلية، قرب ساحة الواثق، بغداد",
    phone: "07712223300",
    about: "غسيل وتلميع بموعد. توصل والسيارة تدخل المسار، بدون طابور بالشارع.",
    rating: 4.6,
    reviewCount: 84,
    accent: "#ff7802",
    coverTone: "from-[#101820] to-[#ff7802]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["المسار", "التلميع"],
    services: [
      { id: "out", name: "غسيل خارجي", durationMin: 20, priceIqd: 8000 },
      { id: "full", name: "غسيل كامل", durationMin: 40, priceIqd: 15000 },
      { id: "wax", name: "تلميع وشمع", durationMin: 50, priceIqd: 25000 },
    ],
    staff: [
      { id: "qais", name: "قيس المالكي", role: "مشرف المسار", initials: "ق م", serviceIds: ["out", "full", "wax"] },
      { id: "nabil", name: "نبيل حسن", role: "تلميع", initials: "ن ح", serviceIds: ["full", "wax"] },
    ],
    reviews: [
      { id: "r1", author: "وسام ع.", rating: 5, date: "8 أيلول 2026", text: "حجزت من الجوال ودخلت مباشرة. الشمع زين." },
    ],
  },
  {
    slug: "basra-paw",
    name: "عيادة باو البيطرية",
    category: "vet",
    city: "basra",
    district: "العشار",
    address: "العشار، شارع الكويت، البصرة",
    phone: "07829990011",
    about: "كشف وتلقيح وعناية لحيوانك الأليف. الموعد مع الطبيب، حتى ما تزحم العيادة.",
    rating: 4.9,
    reviewCount: 44,
    accent: "#181410",
    coverTone: "from-[#1a1612] to-[#8B5A2B]",
    hours: [
      { days: "السبت — الخميس", open: "10:00", close: "20:00" },
      { days: "الجمعة", open: "16:00", close: "20:00" },
    ],
    galleryLabels: ["غرفة الكشف", "الاستقبال"],
    services: [
      { id: "exam", name: "كشف عام", durationMin: 25, priceIqd: 20000 },
      { id: "vax", name: "تلقيح", durationMin: 15, priceIqd: 15000 },
      { id: "groom", name: "تنظيف فرو", durationMin: 40, priceIqd: 18000 },
    ],
    staff: [
      { id: "drv", name: "د. وسن الشريفي", role: "طبيبة بيطرية", initials: "و ش", serviceIds: ["exam", "vax", "groom"] },
    ],
    reviews: [
      { id: "r1", author: "علي ب.", rating: 5, date: "27 آب 2026", text: "القطة انكشفت بالموعد والدكتورة واضحة." },
    ],
  },
  {
    slug: "najaf-clean",
    name: "نجف كلين",
    category: "home",
    city: "najaf",
    district: "حي الأمير",
    address: "حي الأمير، النجف الأشرف",
    phone: "07814445500",
    about: "تنظيف شقق ومنازل بفريق وموعد. تعرف من يجي، كم يطول، وبكم قبل ما تفتح الباب.",
    rating: 4.7,
    reviewCount: 33,
    accent: "#6B4F2A",
    coverTone: "from-[#222018] to-[#6B4F2A]",
    hours: WEEK,
    galleryLabels: ["فريق العمل", "قبل وبعد"],
    services: [
      { id: "apt", name: "تنظيف شقة", durationMin: 120, priceIqd: 45000 },
      { id: "deep", name: "تنظيف عميق", durationMin: 180, priceIqd: 70000 },
      { id: "win", name: "شبابيك", durationMin: 60, priceIqd: 25000 },
    ],
    staff: [
      { id: "husam", name: "حسام الموسوي", role: "مشرف فريق", initials: "ح م", serviceIds: ["apt", "deep", "win"] },
    ],
    reviews: [
      { id: "r1", author: "زينب ع.", rating: 5, date: "19 آب 2026", text: "اجوا بالساعة المكتوبة وخلّصوا قبل ما أرجع من الشغل." },
    ],
  },
  {
    slug: "karrada-doctor",
    name: "عيادة د. باسم الباطنية",
    category: "doctor",
    city: "baghdad",
    district: "الكرادة",
    address: "الكرادة الداخلية، شارع أبو نؤاس، بغداد",
    phone: "07903334455",
    about: "كشف باطنية ومراجعة بموعد ثابت. الساعة محجوزة للدكتور، وما ينباع كرسيك لغيرك.",
    rating: 4.8,
    reviewCount: 92,
    accent: "#181410",
    coverTone: "from-[#181410] to-[#ff7802]",
    hours: [
      { days: "السبت — الخميس", open: "16:00", close: "21:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    featured: true,
    galleryLabels: ["غرفة الكشف", "الاستقبال"],
    services: [
      { id: "exam", name: "كشف باطنية", durationMin: 20, priceIqd: 30000 },
      { id: "follow", name: "مراجعة", durationMin: 15, priceIqd: 20000 },
      { id: "bp", name: "قياس ضغط وسكر", durationMin: 10, priceIqd: 10000 },
    ],
    staff: [
      { id: "drb", name: "د. باسم العزاوي", role: "طبيب باطنية", initials: "ب ع", serviceIds: ["exam", "follow", "bp"] },
    ],
    reviews: [
      { id: "r1", author: "أبو علي", rating: 5, date: "11 أيلول 2026", text: "دخلت على الموعد والدكتور ما استعجل." },
    ],
  },
  {
    slug: "baghdad-mind",
    name: "مركز سكينة للإرشاد",
    category: "psychology",
    city: "baghdad",
    district: "المنصور",
    address: "المنصور، شارع 14 رمضان، بغداد",
    phone: "07726667788",
    about: "جلسات إرشاد وعلاج نفسي بموعد خاص. الغرفة إلك، والسرية جزء من الجدول مو بس الكلام.",
    rating: 4.9,
    reviewCount: 41,
    accent: "#6B4F2A",
    coverTone: "from-[#1c1814] to-[#6B4F2A]",
    hours: [
      { days: "السبت — الخميس", open: "10:00", close: "20:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    galleryLabels: ["غرفة الجلسة", "الانتظار الهادئ"],
    services: [
      { id: "session", name: "جلسة إرشاد", durationMin: 50, priceIqd: 40000 },
      { id: "couple", name: "جلسة زوجية", durationMin: 70, priceIqd: 55000 },
      { id: "first", name: "جلسة أولى", durationMin: 60, priceIqd: 45000 },
    ],
    staff: [
      { id: "drl", name: "د. لبنى الشمري", role: "عالمة نفس", initials: "ل ش", serviceIds: ["session", "couple", "first"] },
    ],
    reviews: [
      { id: "r1", author: "م. ك.", rating: 5, date: "3 أيلول 2026", text: "الموعد انضبط والغرفة هادية. ما انقطعت الجلسة." },
    ],
  },
  {
    slug: "erbil-physio",
    name: "علاج طبيعي شفا أربيل",
    category: "physio",
    city: "erbil",
    district: "عنكاوا",
    address: "عنكاوا، شارع 60 متر، أربيل",
    phone: "07502221133",
    about: "جلسات علاج طبيعي وإعادة تأهيل. الطاولة محجوزة باسمك، والجلسة ما تتداخل ويا غيرك.",
    rating: 4.8,
    reviewCount: 55,
    accent: "#ff7802",
    coverTone: "from-[#181410] to-[#c45e02]",
    hours: [
      { days: "السبت — الخميس", open: "09:00", close: "19:00" },
      { days: "الجمعة", open: "مغلق", close: "مغلق" },
    ],
    galleryLabels: ["قاعة العلاج", "الأجهزة"],
    services: [
      { id: "back", name: "جلسة ظهر", durationMin: 40, priceIqd: 25000 },
      { id: "sport", name: "إصابة رياضية", durationMin: 45, priceIqd: 30000 },
      { id: "rehab", name: "إعادة تأهيل", durationMin: 50, priceIqd: 32000 },
    ],
    staff: [
      { id: "karo", name: "كارو حسن", role: "أخصائي علاج طبيعي", initials: "ك ح", serviceIds: ["back", "sport", "rehab"] },
      { id: "lana", name: "لانا عثمان", role: "أخصائية علاج طبيعي", initials: "ل ع", serviceIds: ["back", "rehab"] },
    ],
    reviews: [
      { id: "r1", author: "ريبين أ.", rating: 5, date: "29 آب 2026", text: "الجلسة بالموعد والجهاز كان فاضي فعلاً." },
    ],
  },
  {
    slug: "mansour-pet",
    name: "صالون باو للحيوانات",
    category: "petgroom",
    city: "baghdad",
    district: "المنصور",
    address: "المنصور، قرب بارك الزوراء، بغداد",
    phone: "07815550022",
    about: "قص فرو واستحمام وتزيين للكلاب والقطط. الموعد لحيوانك، بدون ازدحام بالمحل.",
    rating: 4.9,
    reviewCount: 37,
    accent: "#8B5A2B",
    coverTone: "from-[#2a1c12] to-[#8B5A2B]",
    hours: WEEK,
    featured: true,
    galleryLabels: ["طاولة التزيين", "الاستحمام"],
    services: [
      { id: "bath", name: "استحمام", durationMin: 40, priceIqd: 20000 },
      { id: "cut", name: "قص فرو", durationMin: 50, priceIqd: 28000 },
      { id: "full", name: "تزيين كامل", durationMin: 70, priceIqd: 40000 },
    ],
    staff: [
      { id: "rania", name: "رانيا جاسم", role: "مزيّنة حيوانات", initials: "ر ج", serviceIds: ["bath", "cut", "full"] },
    ],
    reviews: [
      { id: "r1", author: "هدى م.", rating: 5, date: "7 أيلول 2026", text: "الكلب طلع نظيف والموعد ما تأخّر." },
    ],
  },
];

export function cityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function businessBySlug(slug: string) {
  return BUSINESSES.find((b) => b.slug === slug);
}

export function filterBusinesses(
  list: Business[],
  opts: {
    city?: string;
    category?: string;
    q?: string;
    locale?: "ar" | "ckb";
  },
) {
  const q = (opts.q || "").trim();
  return list.filter((b) => {
    if (opts.city && b.city !== opts.city) return false;
    if (opts.category && b.category !== opts.category) return false;
    if (!q) return true;
    const city = cityBySlug(b.city);
    const cat = categoryBySlug(b.category);
    const hay = [
      b.name,
      b.district,
      b.address,
      b.about,
      city?.name,
      city?.nameEn,
      cityLabel("ar", b.city),
      cityLabel("ckb", b.city),
      cat?.name,
      cat?.nameEn,
      categoryLabel("ar", b.category),
      categoryLabel("ckb", b.category),
      ...(b.services || []).map((s) => s.name),
      ...(b.staff || []).flatMap((s) => [s.name, s.role]),
    ]
      .filter(Boolean)
      .join(" ");
    return includesFold(hay, q);
  });
}

export function businessesFiltered(opts: {
  city?: string;
  category?: string;
  q?: string;
}) {
  return filterBusinesses(BUSINESSES, opts);
}

export const FAQ = [
  {
    q: "موعدكم لمن؟",
    a: "لموعدكم كل مجالات الموعد: عيادات، أطباء، علماء نفس، علاج طبيعي، صالونات، أخصائيو تجميل، تزيين حيوانات، حلاقة، أظافر، ليزر، رياضة، غسيل سيارات، بيطرة، وتنظيف منازل.",
  },
  {
    q: "موعدكم مجاني؟",
    a: "الحجز للزبون مجاني دائماً وماكو عمولة. صاحب المشروع يبدأ بتجربة مجانية مرة واحدة لمدة 30 يوم: موظف واحد و100 حجز. بعد هالفترة يختار خطة مدفوعة. خطط رقمك 5$ و10$ و20$. إشعارات المنصة: 10$ بالشهر + تكلفة كل حجز.",
  },
  {
    q: "الزبون لازم ينزّل تطبيق؟",
    a: "لا. الزبون يفتح الرابط أو صفحة الصالون من المتصفح، يختار الخدمة والموظف والساعة، ويأكد الموعد.",
  },
  {
    q: "الدفع داخل موعدكم؟",
    a: "حالياً الدفع عند الصالون بالطريقة اللي يعتمدها المحل. زين كاش وآسيا حوالة وكي كارد راح تنربط لاحقاً.",
  },
  {
    q: "الموافقة على الموعد تلقائية؟",
    a: "صاحب المحل يختار موافقة تلقائية أو مراجعة يدوية. بالحالة اليدوية يبقى الموعد معلّق إلى أن يأكد.",
  },
  {
    q: "أكدر ألغي أو أغيّر الموعد؟",
    a: "من حسابك في «مواعيدي» تكدر تلغي أو تعيد الجدولة حسب سياسة المحل. المقعد ينفتح لغيرك فوراً.",
  },
  {
    q: "رقم الهاتف ليش مطلوب؟",
    a: "للتأكيد وتذكير واتساب قبل الموعد. ما نبيع الأرقام، واستخدامها مذكور في سياسة الخصوصية.",
  },
  {
    q: "عندي أكثر من فرع؟",
    a: "تكدر تسجّل كل فرع بصفحة وتقويم مستقل، بروابط حجز منفصلة.",
  },
];

export const BLOG = [
  {
    slug: "whatsapp-mowaeed-mo-ykfi",
    title: "ليش واتساب وحده ما يكفي لإدارة المواعيد؟",
    excerpt: "الرسائل تضيع، الساعة تنحجز مرتين، والزبون يجي وما يلقى محل. نظام المواعيد يفرز الجدول قبل ما يوصل أحد.",
    date: "2 أيلول 2026",
    body: [
      "أكثر الصالونات العراقية تدير يومها من واتساب: «عندك مكان الساعة 4؟» وبعدين رسالة ثانية تلغي، وثالثة تسأل على الحلاق الثاني. هذي الطريقة تشتغل وأيامك خفيفة، وتنهار أول ما يصير عندك ضغط جمعة أو موسم أعراس.",
      "موعدكم ما يلغي واتساب. بالعكس: التذكير يبقى على واتساب لأن الناس هنا تعيش عليه. اللي يتغيّر هو مصدر الحقيقة: التقويم، مو الشات. الزبون يشوف الساعات الفارغة ويحجز، والنظام يمنع التعارض.",
      "النتيجة المعتادة بعد أسبوعين: أقل رسائل «ساعتك انحجزت»، أقل زبائن واقفين، وأكثر كراسي مشغولة بالوقت الصحيح.",
    ],
  },
  {
    slug: "hajz-min-baghdad",
    title: "كيف تحجز صالون ببغداد من الجوال خلال دقيقة",
    excerpt: "مدينة، حي، خدمة، حلاق، ساعة. بلا ما ترن وبلا ما تنتظر رد الرسالة.",
    date: "28 آب 2026",
    body: [
      "افتح موعدكم، اختار بغداد، اختار حلاقة أو صالون نسائي أو عيادة. شوف التقييم والقرب والمدة والسعر بالدينار.",
      "ادخل الصفحة، اختار الخدمة، اختار الموظف إذا يهمك شخص معيّن، وبعدين اليوم والساعة. اكتبلنا اسمك ورقم +964.",
      "يجيك تأكيد، وتذكير واتساب قبل الموعد. إذا انشغلت، ألغي من حسابك حتى غيرك يستفيد من الساعة.",
    ],
  },
  {
    slug: "no-show-fil-iraq",
    title: "الزبون ما يجي: شلون تقلل الغياب بالمحل",
    excerpt: "كل كرسي فاضي بجمعة هو فلوس ضاعت. التذكير والوضوح بالسعر والمدة يغيّران العادة.",
    date: "15 آب 2026",
    body: [
      "الغياب (ما يجي وما يعتذر) يضرب الصالونات أكثر من التسعيرة الغلط. السبب غالباً مو سوء نية: الزبون نسى، أو حسب إن الرسالة مو تأكيد.",
      "ثلاث عادات تقلل الغياب: موعد مكتوب بساعة واضحة، تذكير واتساب قبلها، وإلغاء سهل حتى الساعة ترجع للجدول.",
      "موعدكم يخلي التذكير جاهز من أول يوم: الموعد مكتوب، والرسالة توصل قبلها، والإلغاء يرجع الساعة للجدول.",
    ],
  },
];

export function formatIqd(n: number) {
  return `${formatNumber(Number(n) || 0)} د.ع`;
}

export function slotsForDate(dateIso: string, durationMin: number) {
  const d = new Date(`${dateIso}T12:00:00`);
  const friday = d.getDay() === 5;
  const startHour = friday ? 14 : 9;
  const endHour = 22;
  const out: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (const m of [0, 30]) {
      if (h === endHour - 1 && m === 30 && durationMin > 30) continue;
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const seed = `${dateIso}-${label}-${durationMin}`.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      if (seed % 7 !== 0) out.push(label);
    }
  }
  return out;
}

export function upcomingDates(count = 14) {
  const start = isoInBaghdad();
  const out: { iso: string; label: string; sub: string }[] = [];
  for (let i = 0; i < count; i++) {
    const iso = addDaysIso(start, i);
    const d = new Date(`${iso}T12:00:00+03:00`);
    out.push({
      iso,
      label: formatDateLatn(d, { weekday: "long", timeZone: IRAQ_TZ }, AR_IQ_LATN),
      sub: formatDateLatn(d, { day: "numeric", month: "short", timeZone: IRAQ_TZ }, AR_IQ_LATN),
    });
  }
  return out;
}
