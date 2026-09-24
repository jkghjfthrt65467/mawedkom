export type City = {
  slug: string;
  name: string;
  nameEn: string;
};

export type Category = {
  slug: string;
  name: string;
  nameEn: string;
  icon: string;
  blurb: string;
};

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceIqd: number;
  /** Show "الأكثر طلباً" and keep near the top. */
  popular?: boolean;
  /** Discounted price while the offer is on. */
  offerPriceIqd?: number;
  /** Lower number = higher priority in lists. */
  sortOrder?: number;
  /** Laser / physio style packages. */
  sessionCount?: number;
  /** Days between sessions in a package. */
  intervalDays?: number;
};

export type Staff = {
  id: string;
  name: string;
  role: string;
  initials: string;
  serviceIds: string[];
  photo?: string;
  bio?: string;
  galleryPhotos?: string[];
  reviews?: Review[];
  bookingPaused?: boolean;
  calendarColor?: string;
  /** Default ON: staff can reschedule/cancel their own appointments. */
  canEditOwnAppointments?: boolean;
  /** Default OFF: staff can see and edit other employees' appointments. */
  canEditOtherStaffAppointments?: boolean;
  /** If set, overrides the business weekday hours for this person. */
  weekdayHours?: DaySchedule[];
  weeklyOffDays?: number[];
  /** Minutes blocked after each of this staff's appointments. */
  bufferMin?: number;
  /** Optional WhatsApp number for new-appointment alerts. */
  phone?: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  reply?: string;
};

export type WorkingHours = {
  days: string;
  open: string;
  close: string;
};

export type DaySchedule = {
  weekday: number;
  closed: boolean;
  open: string;
  close: string;
};

export type PlanId = "free" | "own_1" | "own_3" | "own_unlimited" | "meta_usage";
export type NotifyChannel = "owner" | "meta";

export type ApprovalMode = "AUTO" | "MANUAL";

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show";

export type BookingSource = "public" | "walkin" | "phone" | "staff";

export type Business = {
  slug: string;
  name: string;
  category: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  about: string;
  rating: number;
  reviewCount: number;
  accent: string;
  coverTone: string;
  hours: WorkingHours[];
  services: Service[];
  staff: Staff[];
  reviews: Review[];
  galleryLabels: string[];
  featured?: boolean;
  /** Admin hide from public catalog and sitemap. Direct links still work. */
  hidden?: boolean;
  /** Cover / hero image. */
  photo?: string;
  /** Circular profile image. Falls back to initials when empty. */
  avatar?: string;
  coverPhoto?: string;
  galleryPhotos?: string[];
  lat?: number;
  lng?: number;
  weekdayHours?: DaySchedule[];
  weeklyOffDays?: number[];
  holidayDates?: string[];
  approvalMode?: ApprovalMode;
  whatsappLink?: string;
  bookingIntakePaused?: boolean;
  showStaffPicker?: boolean;
  reminderEnabled?: boolean;
  /** Customer + staff alerts from the owner's linked WhatsApp, or Meta Cloud API. */
  notifyChannel?: NotifyChannel;
  /** When false, skip staff WhatsApp alerts (customer + owner still send). */
  staffWhatsAppEnabled?: boolean;
  /** Prepaid Meta credit in USD. Charged 0.05 per booking on meta_usage. */
  metaWalletUsd?: number;
  metaMonthKey?: string;
  metaMonthBookings?: number;
  metaMinChargedMonth?: string;
  /** Minutes blocked after every appointment unless the staff sets their own. */
  bufferMin?: number;
  /** Optional second WhatsApp number for owner alerts when the linked sender is the project phone. */
  ownerNotifyPhone?: string;
  /** Subscription tier. New projects start on a one-time 30-day free trial. */
  planId?: PlanId;
  /** When the one-time 30-day free trial started. */
  freeStartedAt?: string;
  /** After the trial is used or left, free cannot be activated again. */
  freeUsed?: boolean;
  /** Plan the owner asked for. Support activates it onto planId. */
  requestedPlanId?: PlanId;
  /** Owner dashboard / team notification language. */
  locale?: "ar" | "ckb";
  /** Last time the owner's Android app reached the outbox. */
  waDeviceSeenAt?: string;
};

export type BookingRecord = {
  id: string;
  manageToken: string;
  businessSlug: string;
  businessName: string;
  serviceName: string;
  serviceNames?: string[];
  staffId?: string;
  staffName: string;
  date: string;
  time: string;
  durationMin: number;
  priceIqd: number;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  source?: BookingSource;
  createdAt: string;
  reminderSentAt?: string;
  reminder24SentAt?: string;
  notes?: string;
  seriesId?: string;
  sessionIndex?: number;
  sessionTotal?: number;
  /** Customer UI language when the booking was made. */
  locale?: "ar" | "ckb";
};

export type CustomerProfile = {
  phone: string;
  name: string;
  notes: string;
  updatedAt: string;
  visitCount?: number;
};

export type WaitlistEntry = {
  id: string;
  businessSlug: string;
  serviceId?: string;
  serviceName?: string;
  staffId?: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
};

export type UserAccount = {
  name: string;
  phone: string;
  email: string;
};
