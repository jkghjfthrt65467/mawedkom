"use client";

import type { ReactNode } from "react";

function Glyph({
  size,
  className,
  children,
}: {
  size: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={`shrink-0 ${className ?? ""}`} aria-hidden>
      {children}
    </svg>
  );
}

function Scissors({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path fillRule="evenodd" d="M6.2 3.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm0 2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
      <path fillRule="evenodd" d="M6.2 14.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm0 2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
      <path d="M8.8 8.6 20.6 4a1.2 1.2 0 1 1 1.1 2.2L10.6 11l-1.8-2.4Z" />
      <path d="M8.8 15.4 20.6 20a1.2 1.2 0 1 0 1.1-2.2L10.6 13l-1.8 2.4Z" />
      <circle cx="10.2" cy="12" r="1.3" />
    </Glyph>
  );
}

function Lipstick({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M2 12.2c2.6-4.8 6.6-7 10-4.6 3.4-2.4 7.4-.2 10 4.6-3 1.6-6.6 2.4-10 2.4S5 13.8 2 12.2Z" />
      <path d="M3.2 14.2c2.6 5.8 15 5.8 17.6 0-3 3.2-6.8 4.6-8.8 4.6s-5.8-1.4-8.8-4.6Z" />
    </Glyph>
  );
}

function Syringe({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M1.8 8.6h2.6v6.8H1.8c-.6 0-1-.4-1-1V9.6c0-.6.4-1 1-1Z" />
      <path d="M4.4 10.4h3.2v3.2H4.4z" />
      <path d="M7.6 7.6h10.2c.9 0 1.6.7 1.6 1.6v5.6c0 .9-.7 1.6-1.6 1.6H7.6c-.9 0-1.6-.7-1.6-1.6V9.2c0-.9.7-1.6 1.6-1.6Z" />
      <path d="M17.8 10.8h3.6v2.4h-3.6z" />
      <path d="M21.2 9.8h1.4L23.8 12l-1.2 2.2h-1.4L22.4 12 21.2 9.8Z" />
    </Glyph>
  );
}

function AlmondNail({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path
        fillRule="evenodd"
        d="M12 1.1c1.2 0 4.2 3.6 5.1 9.2.9 5.6-.6 10.2-3.2 12-1 .6-1.7.9-1.9.9s-.9-.3-1.9-.9c-2.6-1.8-4.1-6.4-3.2-12C7.8 4.7 10.8 1.1 12 1.1Zm-2 3c.6-1.1 1.4-1.7 2-1.7s1.4.6 2 1.7c.5.9.2 1.6-.5 1.9L12.7 7.3c-.2.3-.8.3-1 0L10.5 6c-.7-.3-1-.1-.5-1.9Z"
      />
    </Glyph>
  );
}

function MedicalCross({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M9.4 3h5.2c.8 0 1.4.6 1.4 1.4v3.8h3.8c.8 0 1.4.6 1.4 1.4v5.2c0 .8-.6 1.4-1.4 1.4h-3.8v3.8c0 .8-.6 1.4-1.4 1.4H9.4c-.8 0-1.4-.6-1.4-1.4v-3.8H4.2c-.8 0-1.4-.6-1.4-1.4V9.6c0-.8.6-1.4 1.4-1.4h3.8V4.4C8 3.6 8.6 3 9.4 3Z" />
    </Glyph>
  );
}

function Stethoscope({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M7.2 2.8c.7 0 1.2.5 1.2 1.2v6.2c0 1.6 1.3 2.8 2.8 2.8h1.6c1.5 0 2.8-1.2 2.8-2.8V4c0-.7.5-1.2 1.2-1.2S18 3.3 18 4v6.2c0 2.8-2.1 5.1-4.8 5.5v1.1c2.8.5 5 2.9 5 5.8 0 .7-.5 1.2-1.2 1.2s-1.2-.5-1.2-1.2c0-1.9-1.6-3.4-3.6-3.4h-.4c-2 0-3.6 1.5-3.6 3.4 0 .7-.5 1.2-1.2 1.2S6 21.9 6 21.2c0-2.9 2.2-5.3 5-5.8v-1.1C8.3 13.9 6 11.6 6 8.8V4c0-.7.5-1.2 1.2-1.2Z" />
      <circle cx="18.6" cy="20.8" r="2.2" />
    </Glyph>
  );
}

function Brain({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path
        fillRule="evenodd"
        d="M8.8 4.2c1.1 0 2.1.4 2.8 1.1h.8c.7-.7 1.7-1.1 2.8-1.1 2.4 0 4.4 1.8 4.6 4.1 1.4.8 2.2 2.2 2.2 3.8 0 1.5-.8 2.9-2 3.7.1.4.2.8.2 1.2 0 2.3-1.9 4.2-4.2 4.2-.7 0-1.3-.2-1.9-.4-.7.7-1.6 1.1-2.5 1.1s-1.8-.4-2.5-1.1c-.6.2-1.2.4-1.9.4-2.3 0-4.2-1.9-4.2-4.2 0-.4.1-.8.2-1.2-1.2-.8-2-2.2-2-3.7 0-1.6.8-3 2.2-3.8.2-2.3 2.2-4.1 4.6-4.1ZM11.1 7.4h1.8v10h-1.8z"
      />
    </Glyph>
  );
}

function Stretch({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <circle cx="12" cy="4.2" r="2.1" />
      <path d="M5.4 8.4c.4-.6 1.2-.8 1.8-.4L12 10.6l4.8-2.6c.6-.4 1.4-.2 1.8.4s.2 1.4-.4 1.8L14 12.4v3.4l4.2 5c.4.6.4 1.4-.2 1.8s-1.4.4-1.8-.2L12 17.2 7.8 22.4c-.4.6-1.2.6-1.8.2s-.6-1.2-.2-1.8l4.2-5v-3.4L5.8 10.2c-.6-.4-.8-1.2-.4-1.8Z" />
    </Glyph>
  );
}

function LaserBurst({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M12 2.2 13.6 9H21l-5.6 4.2L17.2 21 12 16.8 6.8 21l1.8-7.8L3 9h7.4L12 2.2Z" />
    </Glyph>
  );
}

function Dumbbell({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M2 8.2h2.6v7.6H2A1.2 1.2 0 0 1 .8 14.6V9.4C.8 8.7 1.3 8.2 2 8.2Zm3.4-1.2h3v10h-3v-10ZM15.6 7h3v10h-3V7Zm4.4 1.2h2.6c.7 0 1.2.5 1.2 1.2v5.2c0 .7-.5 1.2-1.2 1.2H20V8.2ZM9.2 10.2h5.6v3.6H9.2z" />
    </Glyph>
  );
}

function Car({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M6.8 9 8.2 6.2A2 2 0 0 1 10 5h4.2c.7 0 1.4.4 1.8 1.1L17.4 9H19c1.3 0 2.4 1.1 2.4 2.4v3.8c0 .9-.7 1.6-1.6 1.6h-.5a2.7 2.7 0 0 1-5.2 0H10a2.7 2.7 0 0 1-5.2 0h-.6c-.9 0-1.6-.7-1.6-1.6v-3.8C2.6 10.1 3.7 9 5 9h1.8Zm1.8-2.6L7.4 9h9.2l-1.2-2.4c-.1-.3-.4-.4-.6-.4h-5.6c-.3 0-.5.1-.6.4ZM6.2 17.2a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm11.6 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" />
      <path d="M8.2 2.6c.2-.4.7-.5 1.1-.3l.6.3c.4.2.5.7.3 1.1s-.7.5-1.1.3l-.6-.3c-.4-.2-.5-.7-.3-1.1Zm3.8-.6c.4 0 .8.4.8.8v.7c0 .4-.4.8-.8.8s-.8-.4-.8-.8v-.7c0-.4.4-.8.8-.8Zm3.8.6.6.3c.4.2.5.7.3 1.1s-.7.5-1.1.3l-.6-.3c-.4-.2-.5-.7-.3-1.1s.7-.5 1.1-.3Z" />
    </Glyph>
  );
}

function Paw({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <circle cx="7.2" cy="6.6" r="2.2" />
      <circle cx="16.8" cy="6.6" r="2.2" />
      <circle cx="4.8" cy="11.4" r="2.1" />
      <circle cx="19.2" cy="11.4" r="2.1" />
      <ellipse cx="12" cy="16.2" rx="5.2" ry="4.2" />
    </Glyph>
  );
}

function Dog({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M5.2 6.4 8.6 8.2 10.4 4.6c.4-.7 1.4-.8 2-.3L14.4 6l2.2-.8c1.4-.5 2.8.6 2.8 2.1v2.4c1.3.7 2.2 2.1 2.2 3.7 0 2.8-3 5-7.2 5.4v1.4c0 .6-.5 1.1-1.1 1.1h-2.6c-.6 0-1.1-.5-1.1-1.1v-1.4C5 18.4 2 16.2 2 13.4c0-1.6.9-3 2.2-3.7V8.2c0-1 .8-1.8 1.8-1.8h.2Zm3.6 7.6a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Zm6.4 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" />
    </Glyph>
  );
}

function Broom({ size, className }: { size: number; className?: string }) {
  return (
    <Glyph size={size} className={className}>
      <path d="M15.6 2.4c.5-.5 1.2-.5 1.7 0l4.3 4.3c.5.5.5 1.2 0 1.7l-1 1-6-6 1-1Z" />
      <path d="M13.8 6.2 17.8 10.2 8.6 19.4c-1.8 1.8-4.4 2.8-6.6 3.1-.6.1-1.1-.4-1-1 0.3-2.2 1.3-4.8 3.1-6.6L13.8 6.2Z" />
      <path d="M7.2 13.2 10.8 16.8" stroke="currentColor" strokeWidth="0" />
    </Glyph>
  );
}

const BY_SLUG: Record<string, (props: { size: number; className?: string }) => ReactNode> = {
  salon: Lipstick,
  barber: Scissors,
  beauty: Syringe,
  nails: AlmondNail,
  clinic: MedicalCross,
  doctor: Stethoscope,
  psychology: Brain,
  physio: Stretch,
  laser: LaserBurst,
  fitness: Dumbbell,
  carwash: Car,
  vet: Paw,
  petgroom: Dog,
  home: Broom,
};

export function CategoryIcon({
  slug,
  className = "h-6 w-6",
  size = 24,
}: {
  slug: string;
  className?: string;
  size?: number;
}) {
  const Icon = BY_SLUG[slug] ?? MedicalCross;
  return <Icon size={size} className={className} />;
}
