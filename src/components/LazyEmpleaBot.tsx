"use client";

import dynamic from "next/dynamic";

const EmpleaBotWidget = dynamic(
  () => import("./EmpleaBotWidget").then((m) => m.EmpleaBotWidget),
  { ssr: false }
);

export function LazyEmpleaBot() {
  return <EmpleaBotWidget />;
}
