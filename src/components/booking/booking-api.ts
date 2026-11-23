export interface BookableService {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
}

export interface BookableProfessional {
  id: string;
  name: string;
  nextSlot: string | null;
}

export interface BookingConfirmation {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  cancelUrl: string;
}

export class BookingApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const OFFLINE_MESSAGE = "Não foi possível falar com a barbearia. Confira sua internet e tente de novo.";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init).catch(() => null);
  if (!response) throw new BookingApiError("NETWORK", OFFLINE_MESSAGE);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new BookingApiError(body?.error?.code ?? "UNKNOWN", body?.error?.message ?? OFFLINE_MESSAGE);
  return body as T;
}

/** Chamadas às rotas públicas da barbearia (o tenant é sempre o do slug). */
export function bookingApi(slug: string) {
  const base = `/api/public/${encodeURIComponent(slug)}`;
  return {
    professionals: async (serviceId: string) =>
      (await request<{ professionals: BookableProfessional[] }>(`${base}/professionals?serviceId=${serviceId}`)).professionals,
    slots: async (params: { serviceId: string; professionalId: string; date: string }) =>
      (await request<{ slots: string[] }>(`${base}/availability?${new URLSearchParams(params)}`)).slots,
    book: (payload: {
      serviceId: string;
      professionalId: string;
      startsAt: string;
      customer: { name: string; phone: string };
      consent: boolean;
      website: string;
    }) =>
      request<BookingConfirmation>(`${base}/appointments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
  };
}
