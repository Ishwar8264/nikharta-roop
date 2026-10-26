import type { ReactNode } from "react";

/** Keeps the staff profile visible beneath intercepted schedule navigation. */
export default function StaffLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return <>{children}{modal}</>;
}
