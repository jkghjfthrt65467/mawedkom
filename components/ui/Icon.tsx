"use client";

import type { ComponentType, SVGProps } from "react";
import UilHome from "@iconscout/react-unicons/icons/uil-home";
import UilSearch from "@iconscout/react-unicons/icons/uil-search";
import UilCalendarAlt from "@iconscout/react-unicons/icons/uil-calendar-alt";
import UilUser from "@iconscout/react-unicons/icons/uil-user";
import UilBars from "@iconscout/react-unicons/icons/uil-bars";
import UilTimes from "@iconscout/react-unicons/icons/uil-times";
import UilCheck from "@iconscout/react-unicons/icons/uil-check";
import UilMapMarker from "@iconscout/react-unicons/icons/uil-map-marker";
import UilStar from "@iconscout/react-unicons/icons/uil-star";
import UilPhone from "@iconscout/react-unicons/icons/uil-phone";
import UilHeart from "@iconscout/react-unicons/icons/uil-heart";
import UilFavorite from "@iconscout/react-unicons/icons/uil-favorite";
import UilClock from "@iconscout/react-unicons/icons/uil-clock";
import UilSetting from "@iconscout/react-unicons/icons/uil-setting";
import UilCommentAlt from "@iconscout/react-unicons/icons/uil-comment-alt";
import UilSun from "@iconscout/react-unicons/icons/uil-sun";
import UilMoon from "@iconscout/react-unicons/icons/uil-moon";
import UilAngleRight from "@iconscout/react-unicons/icons/uil-angle-right";
import UilPlus from "@iconscout/react-unicons/icons/uil-plus";
import UilFilter from "@iconscout/react-unicons/icons/uil-filter";
import UilImage from "@iconscout/react-unicons/icons/uil-image";
import UilWhatsapp from "@iconscout/react-unicons/icons/uil-whatsapp";

export type IconName =
  | "home"
  | "search"
  | "calendar"
  | "user"
  | "menu"
  | "close"
  | "check"
  | "map"
  | "star"
  | "phone"
  | "heart"
  | "spark"
  | "clock"
  | "settings"
  | "message"
  | "sun"
  | "moon"
  | "chevron"
  | "plus"
  | "filter"
  | "image"
  | "whatsapp";

type Unicon = ComponentType<{ color?: string; size?: string | number; className?: string } & SVGProps<SVGSVGElement>>;

const ICONS: Record<IconName, Unicon> = {
  home: UilHome,
  search: UilSearch,
  calendar: UilCalendarAlt,
  user: UilUser,
  menu: UilBars,
  close: UilTimes,
  check: UilCheck,
  map: UilMapMarker,
  star: UilStar,
  phone: UilPhone,
  heart: UilHeart,
  spark: UilFavorite,
  clock: UilClock,
  settings: UilSetting,
  message: UilCommentAlt,
  sun: UilSun,
  moon: UilMoon,
  chevron: UilAngleRight,
  plus: UilPlus,
  filter: UilFilter,
  image: UilImage,
  whatsapp: UilWhatsapp,
};

export function Icon({
  name,
  className = "h-5 w-5",
  size,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  const Glyph = ICONS[name];
  return <Glyph size={size ?? 20} color="currentColor" className={`shrink-0 ${className}`} aria-hidden />;
}
