"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export default function StatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Statut de la commande"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => updateOrderStatus(orderId, e.target.value))}
      className={`field !w-auto !py-2 !text-sm ${status === "annulee" ? "!border-alert/50" : ""}`}
    >
      {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
