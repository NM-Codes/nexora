import type { ReactNode } from "react";

export type IconName =
  | "people" | "briefcase" | "building" | "chevron-down" | "chevron-right"
  | "panel" | "logout" | "help" | "bell" | "close" | "plus" | "search"
  | "filter" | "grid" | "list" | "external" | "pin" | "mail" | "phone"
  | "send" | "file" | "download" | "upload" | "check"
  | "reset" | "shield" | "more" | "arrow-left" | "arrow-right" | "sparkles" | "eye" | "eye-off";

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  let shape: ReactNode;

  switch (name) {
    case "people":
      shape = <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h1a5.5 5.5 0 0 1 5.5 5.5V20" /><path d="M16 5.2a3 3 0 0 1 0 5.7M17 13.2a5 5 0 0 1 4 4.8v2" /></>;
      break;
    case "briefcase":
      shape = <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>;
      break;
    case "building":
      shape = <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 21v-5h8v5M7 7h2m6 0h2M7 11h2m6 0h2M11 7v2m0 2v2" /></>;
      break;
    case "chevron-down":
      shape = <path d="m6 9 6 6 6-6" />;
      break;
    case "chevron-right":
      shape = <path d="m9 18 6-6-6-6" />;
      break;
    case "panel":
      shape = <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18m6-13-3 3 3 3" /></>;
      break;
    case "logout":
      shape = <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>;
      break;
    case "help":
      shape = <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1.1 1.1-1.9 1.4-1.9 3M12 17h.01" /></>;
      break;
    case "bell":
      shape = <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /><circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" /></>;
      break;
    case "close":
      shape = <path d="m6 6 12 12M18 6 6 18" />;
      break;
    case "plus":
      shape = <path d="M12 5v14M5 12h14" />;
      break;
    case "search":
      shape = <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>;
      break;
    case "filter":
      shape = <><path d="M4 6h16M7 12h10m-7 6h4" /><path d="M8 4v4m8 2v4m-4 2v4" /></>;
      break;
    case "grid":
      shape = <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>;
      break;
    case "list":
      shape = <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r=".7" fill="currentColor" /><circle cx="4" cy="12" r=".7" fill="currentColor" /><circle cx="4" cy="18" r=".7" fill="currentColor" /></>;
      break;
    case "external":
      shape = <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>;
      break;
    case "pin":
      shape = <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>;
      break;
    case "mail":
      shape = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>;
      break;
    case "phone":
      shape = <path d="M7 3H5a2 2 0 0 0-2 2 16 16 0 0 0 16 16 2 2 0 0 0 2-2v-2l-5-2-2 3a13 13 0 0 1-8-8l3-2-2-5Z" />;
      break;
    case "send":
      shape = <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>;
      break;
    case "file":
      shape = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6m-10 4h4m-4 4h4" /></>;
      break;
    case "download":
      shape = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>;
      break;
    case "upload":
      shape = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></>;
      break;
    case "check":
      shape = <path d="m5 12 4 4L19 6" />;
      break;
    case "reset":
      shape = <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>;
      break;
    case "shield":
      shape = <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>;
      break;
    case "more":
      shape = <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>;
      break;
    case "arrow-left":
      shape = <path d="M19 12H5m7 7-7-7 7-7" />;
      break;
    case "arrow-right":
      shape = <path d="M5 12h14m-7-7 7 7-7 7" />;
      break;
    case "sparkles":
      shape = <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>;
      break;
    case "eye":
      shape = <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>;
      break;
    case "eye-off":
      shape = <><path d="M3 3 21 21M10.6 6.2A11.3 11.3 0 0 1 12 6c6.4 0 10 6 10 6a15.7 15.7 0 0 1-3.1 3.5M6.2 6.8C3.5 8.4 2 12 2 12s3.6 6 10 6c1.2 0 2.3-.2 3.3-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>;
      break;
  }

  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shape}
    </svg>
  );
}
