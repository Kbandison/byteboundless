export type ContactStatus = "saved" | "contacted" | "responded" | "closed";

export interface SavedList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedListItem {
  listId: string;
  businessId: string;
  status: ContactStatus;
  notes: string | null;
  contactedAt: string | null;
  createdAt: string;
}
