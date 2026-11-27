export type Mode = "home" | "online";
export interface Tutor {
  id: string; name: string; photo: string; whatsapp: string; area: string; subjects: string[];
  levels: string[]; mode: Mode[]; rate: number; radiusKm: number; education: string; years: number;
  bio: string; rating: number; reviews: number; verified: boolean; plan: boolean;
}
export interface Req {
  id: string; parentId: string; parentName: string; whatsapp: string; subject: string; level: string;
  area: string; note: string; tutorIds: string[]; createdAt: number; expiresAt: number; contacted: string[];
}
export interface LedgerEntry { id: string; tutorId: string; delta: number; reason: string; ref: string; expiresAt?: number; at: number }
export interface Order { id: string; tutorId: string; product: string; amount: number; leads: number; status: "pending" | "paid" | "expired"; key: string; expiresAt: number; plan: boolean }
export interface Lesson { id: string; tutorId: string; parentId: string; child: string; subject: string; day: string; time: string; notes: Note[] }
export interface Note { id: string; at: number; topic: string; understanding: 1 | 2 | 3 | 4 | 5 }
export const MASKED = { name: "Tutor terverifikasi", photo: null, whatsapp: null } as const;
