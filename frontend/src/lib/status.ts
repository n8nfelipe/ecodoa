import type { Listing } from "../types";

export const STATUS_STYLES: Record<Listing["status"], string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const STATUS_LABELS: Record<Listing["status"], string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  COMPLETED: "Concluído",
  REJECTED: "Recusado",
};