export type UserPlan = "free" | "pro" | "agency";

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  searchesUsed: number;
  searchesLimit: number;
  createdAt: string;
}
