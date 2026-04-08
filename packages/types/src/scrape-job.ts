export type JobStatus = "pending" | "running" | "completed" | "failed";

export type JobPhase =
  | "collecting"
  | "extracting"
  | "enriching"
  | "scoring"
  | "done";

export interface ScrapeOptions {
  strict: boolean;
  maxResults: number;
  enrich: boolean;
}

export interface ScrapeJob {
  id: string;
  userId: string;
  query: string;
  location: string;
  options: ScrapeOptions;
  status: JobStatus;
  phase: JobPhase | null;
  progressCurrent: number;
  progressTotal: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
