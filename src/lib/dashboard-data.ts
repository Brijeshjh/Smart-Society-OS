export type ComplaintStatus = "pending" | "resolved";
export type ComplaintSeverity = "low" | "medium" | "emergency";
export type NotificationSource = "security" | "communication" | "finance";
export type NotificationChannel = "sms" | "email" | "system";

export interface FinancialEntry {
  id: string;
  income: number;
  expense: number;
  isAnomaly: boolean;
  source: "excel" | "manual";
  uploadedBy: string;
  createdAtMs: number;
}

export interface ComplaintEntry {
  id: string;
  residentName: string;
  unitNumber: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  createdBy: string;
  dispatchSummary?: string;
  createdAtMs: number;
}

export interface FinanceAnomalyEntry {
  id: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  detectedAtMs: number;
}

export interface VisitorLogEntry {
  id: string;
  visitorName: string;
  visitorType: string;
  hostFlat: string;
  contactNumber: string;
  entryTimeIso: string;
  exitTimeIso: string | null;
}

export interface ExternalServiceEntry {
  id: string;
  serviceCategory: string;
  vendorName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  isOnCall: boolean;
}

export interface NotificationEntry {
  id: string;
  source: NotificationSource;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  message: string;
  createdAtMs: number;
}

interface DashboardSnapshot {
  financialEntries: FinancialEntry[];
  complaints: ComplaintEntry[];
  financeAnomalies: FinanceAnomalyEntry[];
  visitorLogs: VisitorLogEntry[];
  externalServices: ExternalServiceEntry[];
  notifications: NotificationEntry[];
  revision: number;
}

interface NewFinancialEntry {
  income: number;
  expense: number;
  isAnomaly: boolean;
}

interface NewComplaintEntry {
  residentName: string;
  unitNumber: string;
  category: string;
  description: string;
  createdBy: string;
}

interface SecurityScanBody {
  guardPhone: string;
  guardEmail: string;
}

let cache: DashboardSnapshot | null = null;
let loadingPromise: Promise<DashboardSnapshot> | null = null;
const subscribers = new Set<(snapshot: DashboardSnapshot) => void>();
let stream: EventSource | null = null;

async function readSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load dashboard data.");
  }
  return (await response.json()) as DashboardSnapshot;
}

async function refreshSnapshot(): Promise<DashboardSnapshot> {
  if (!loadingPromise) {
    loadingPromise = readSnapshot()
      .then((data) => {
        cache = data;
        subscribers.forEach((subscriber) => subscriber(data));
        return data;
      })
      .finally(() => {
        loadingPromise = null;
      });
  }
  return loadingPromise;
}

function ensureStream(onError: (message: string) => void) {
  if (typeof window === "undefined" || stream) {
    return;
  }

  stream = new EventSource("/api/stream");

  stream.addEventListener("update", () => {
    void refreshSnapshot();
  });

  stream.onerror = () => {
    onError("Realtime link interrupted. Retrying...");
  };
}

function subscribe(
  selector: (snapshot: DashboardSnapshot) => void,
  onError: (message: string) => void
) {
  ensureStream(onError);

  const listener = (snapshot: DashboardSnapshot) => selector(snapshot);
  subscribers.add(listener);

  if (cache) {
    selector(cache);
  } else {
    void refreshSnapshot().catch(() => onError("Could not load dashboard data."));
  }

  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0 && stream) {
      stream.close();
      stream = null;
    }
  };
}

export function subscribeFinancialEntries(
  onData: (entries: FinancialEntry[]) => void,
  onError: (message: string) => void
) {
  return subscribe((snapshot) => onData(snapshot.financialEntries), onError);
}

export function subscribeComplaints(
  onData: (entries: ComplaintEntry[]) => void,
  onError: (message: string) => void
) {
  return subscribe((snapshot) => onData(snapshot.complaints), onError);
}

export function subscribeFinanceAnomalies(
  onData: (entries: FinanceAnomalyEntry[]) => void,
  onError: (message: string) => void
) {
  return subscribe((snapshot) => onData(snapshot.financeAnomalies), onError);
}

export function subscribeSecurityFeed(
  onData: (payload: { visitorLogs: VisitorLogEntry[]; notifications: NotificationEntry[] }) => void,
  onError: (message: string) => void
) {
  return subscribe(
    (snapshot) =>
      onData({
        visitorLogs: snapshot.visitorLogs,
        notifications: snapshot.notifications,
      }),
    onError
  );
}

export function subscribeCommunicationFeed(
  onData: (payload: {
    complaints: ComplaintEntry[];
    externalServices: ExternalServiceEntry[];
    notifications: NotificationEntry[];
  }) => void,
  onError: (message: string) => void
) {
  return subscribe(
    (snapshot) =>
      onData({
        complaints: snapshot.complaints,
        externalServices: snapshot.externalServices,
        notifications: snapshot.notifications,
      }),
    onError
  );
}

export async function uploadFinancialEntries(entries: NewFinancialEntry[], uploadedBy: string) {
  const response = await fetch("/api/financial-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, uploadedBy }),
  });

  if (!response.ok) {
    throw new Error("Unable to upload financial entries.");
  }

  await refreshSnapshot();
}

export async function runSecurityScan(payload: SecurityScanBody) {
  const response = await fetch("/api/security/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to run security scan.");
  }

  await refreshSnapshot();
  return (await response.json()) as {
    status: string;
    anomaliesFound: number;
    summary: string;
  };
}

export async function createComplaint(entry: NewComplaintEntry) {
  const response = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error("Unable to create complaint.");
  }

  await refreshSnapshot();
}

export async function setComplaintStatus(id: string, status: ComplaintStatus) {
  const response = await fetch(`/api/complaints/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Unable to update complaint status.");
  }

  await refreshSnapshot();
}
