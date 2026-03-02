import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import type {
  ComplaintEntry,
  ComplaintSeverity,
  ComplaintStatus,
  ExternalServiceEntry,
  FinanceAnomalyEntry,
  FinancialEntry,
  NotificationChannel,
  NotificationEntry,
  NotificationSource,
  VisitorLogEntry,
} from "@/lib/dashboard-data";

interface DashboardData {
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

interface SecurityAnomaly {
  visitor: VisitorLogEntry;
  hoursInside: number;
  thresholdHours: number;
}

const dataPath = path.join(process.cwd(), "data", "dashboard.json");

declare global {
  var __dashboardEmitter: EventEmitter | undefined;
  var __dashboardWriteQueue: Promise<void> | undefined;
}

const emitter = globalThis.__dashboardEmitter ?? new EventEmitter();
globalThis.__dashboardEmitter = emitter;

function sanitizeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function sortByCreatedAtDesc<T extends { createdAtMs: number }>(items: T[]): T[] {
  return items.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

function getSeedVisitors(): VisitorLogEntry[] {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      visitorName: "Ravi Courier",
      visitorType: "Delivery",
      hostFlat: "A-302",
      contactNumber: "+91-9890010101",
      entryTimeIso: new Date(now - 14 * 60 * 60 * 1000).toISOString(),
      exitTimeIso: null,
    },
    {
      id: randomUUID(),
      visitorName: "Suman Bai",
      visitorType: "Maid",
      hostFlat: "B-204",
      contactNumber: "+91-9890010102",
      entryTimeIso: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      exitTimeIso: null,
    },
    {
      id: randomUUID(),
      visitorName: "Rahul Verma",
      visitorType: "Guest",
      hostFlat: "C-106",
      contactNumber: "+91-9890010103",
      entryTimeIso: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      exitTimeIso: null,
    },
  ];
}

function getSeedFinancialEntries(): FinancialEntry[] {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      income: 250000,
      expense: 140000,
      isAnomaly: false,
      source: "manual",
      uploadedBy: "SeedData",
      createdAtMs: now - 4 * 60 * 60 * 1000,
    },
    {
      id: randomUUID(),
      income: 180000,
      expense: 320000,
      isAnomaly: true,
      source: "manual",
      uploadedBy: "SeedData",
      createdAtMs: now - 2 * 60 * 60 * 1000,
    },
  ];
}

function getSeedComplaints(): ComplaintEntry[] {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      residentName: "Aman Gupta",
      unitNumber: "D-101",
      category: "Plumbing",
      description: "Water leakage from kitchen pipe.",
      status: "pending",
      severity: "medium",
      createdBy: "Resident",
      createdAtMs: now - 90 * 60 * 1000,
    },
    {
      id: randomUUID(),
      residentName: "Neha Singh",
      unitNumber: "A-808",
      category: "Electrical",
      description: "Smoke and spark from meter panel in corridor.",
      status: "pending",
      severity: "emergency",
      dispatchSummary: "Dispatched Saket (VoltCare Electric).",
      createdBy: "Resident",
      createdAtMs: now - 30 * 60 * 1000,
    },
  ];
}

function getSeedFinanceAnomalies(): FinanceAnomalyEntry[] {
  return [
    {
      id: randomUUID(),
      category: "Budget",
      amount: 320000,
      description: "Seed anomaly: expense is >150% of income.",
      expenseDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      detectedAtMs: Date.now() - 2 * 60 * 60 * 1000,
    },
  ];
}

function getSeedServices(): ExternalServiceEntry[] {
  return [
    {
      id: randomUUID(),
      serviceCategory: "Plumbing",
      vendorName: "AquaFix Services",
      contactPerson: "Mahesh",
      phoneNumber: "+91-9890011001",
      email: "mahesh@aquafix.local",
      isOnCall: true,
    },
    {
      id: randomUUID(),
      serviceCategory: "Electrical",
      vendorName: "VoltCare Electric",
      contactPerson: "Saket",
      phoneNumber: "+91-9890011002",
      email: "saket@voltcare.local",
      isOnCall: true,
    },
    {
      id: randomUUID(),
      serviceCategory: "Security",
      vendorName: "SecureGrid Response",
      contactPerson: "Iqbal",
      phoneNumber: "+91-9890011003",
      email: "iqbal@securegrid.local",
      isOnCall: true,
    },
  ];
}

function normalizeData(parsed: Partial<DashboardData>): DashboardData {
  const financialEntries =
    Array.isArray(parsed.financialEntries) && parsed.financialEntries.length > 0
      ? parsed.financialEntries
      : getSeedFinancialEntries();
  const complaints =
    Array.isArray(parsed.complaints) && parsed.complaints.length > 0
      ? parsed.complaints
      : getSeedComplaints();
  const financeAnomalies =
    Array.isArray(parsed.financeAnomalies) && parsed.financeAnomalies.length > 0
      ? parsed.financeAnomalies
      : getSeedFinanceAnomalies();
  const visitorLogs = Array.isArray(parsed.visitorLogs) && parsed.visitorLogs.length > 0
    ? parsed.visitorLogs
    : getSeedVisitors();
  const externalServices = Array.isArray(parsed.externalServices) && parsed.externalServices.length > 0
    ? parsed.externalServices
    : getSeedServices();
  const notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];

  return {
    financialEntries: sortByCreatedAtDesc(financialEntries),
    complaints: sortByCreatedAtDesc(
      complaints.map((item) => ({
        ...item,
        severity:
          item.severity === "low" || item.severity === "medium" || item.severity === "emergency"
            ? item.severity
            : "medium",
      }))
    ),
    financeAnomalies: financeAnomalies.sort((a, b) => b.detectedAtMs - a.detectedAtMs),
    visitorLogs,
    externalServices,
    notifications: sortByCreatedAtDesc(notifications),
    revision: typeof parsed.revision === "number" ? parsed.revision : Date.now(),
  };
}

function shouldPersistSeedData(parsed: Partial<DashboardData>) {
  return (
    !Array.isArray(parsed.financialEntries) ||
    parsed.financialEntries.length === 0 ||
    !Array.isArray(parsed.complaints) ||
    parsed.complaints.length === 0 ||
    !Array.isArray(parsed.financeAnomalies) ||
    parsed.financeAnomalies.length === 0 ||
    !Array.isArray(parsed.visitorLogs) ||
    parsed.visitorLogs.length === 0 ||
    !Array.isArray(parsed.externalServices) ||
    parsed.externalServices.length === 0
  );
}

async function readData(): Promise<DashboardData> {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<DashboardData>;
    const normalized = normalizeData(parsed);
    if (shouldPersistSeedData(parsed)) {
      await writeData(normalized);
    }
    return normalized;
  } catch {
    const seeded = normalizeData({ financialEntries: [], complaints: [], revision: Date.now() });
    await writeData(seeded);
    return seeded;
  }
}

async function writeData(next: DashboardData): Promise<void> {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf8");
}

async function enqueueWrite(
  updater: (current: DashboardData) => DashboardData | Promise<DashboardData>
): Promise<DashboardData> {
  const run = async () => {
    const current = await readData();
    const updated = await updater(current);
    updated.revision = Date.now();
    await writeData(updated);
    emitter.emit("update", updated.revision);
    return updated;
  };

  const previous = globalThis.__dashboardWriteQueue ?? Promise.resolve();
  let result: DashboardData = await readData();

  const nextQueue = previous.then(async () => {
    result = await run();
  });

  globalThis.__dashboardWriteQueue = nextQueue.catch(() => undefined);
  await nextQueue;
  return result;
}

export function getDashboardEmitter() {
  return emitter;
}

export async function getDashboardData(): Promise<DashboardData> {
  return readData();
}

export async function addFinancialEntries(entries: NewFinancialEntry[], uploadedBy: string) {
  return enqueueWrite((current) => {
    const now = Date.now();
    const duplicateMap = new Map<string, number>();
    entries.forEach((entry) => {
      const key = `${sanitizeNumber(entry.income)}|${sanitizeNumber(entry.expense)}`;
      duplicateMap.set(key, (duplicateMap.get(key) ?? 0) + 1);
    });

    const anomalies: FinanceAnomalyEntry[] = [];
    const nextRows: FinancialEntry[] = entries.map((entry, index) => {
      const income = sanitizeNumber(entry.income);
      const expense = sanitizeNumber(entry.expense);
      const duplicateKey = `${income}|${expense}`;
      const highSpend = expense >= 100000;
      const overBudget = income > 0 && expense > income * 1.5;
      const duplicate = (duplicateMap.get(duplicateKey) ?? 0) > 1;
      const anomaly = Boolean(entry.isAnomaly) || highSpend || overBudget || duplicate;

      if (anomaly) {
        const reasons = [
          highSpend ? "high expense value" : "",
          overBudget ? "expense is >150% of income" : "",
          duplicate ? "possible duplicate entry" : "",
          Boolean(entry.isAnomaly) ? "flagged in uploaded sheet" : "",
        ]
          .filter(Boolean)
          .join(", ");

        anomalies.push({
          id: randomUUID(),
          category: overBudget || highSpend ? "Budget" : "Data Quality",
          amount: expense,
          description: reasons || "Potential anomaly detected by finance agent.",
          expenseDate: new Date(now + index).toISOString(),
          detectedAtMs: now + index,
        });
      }

      return {
        id: randomUUID(),
        income,
        expense,
        isAnomaly: anomaly,
        source: "excel",
        uploadedBy: uploadedBy.trim() || "Admin",
        createdAtMs: now + index,
      };
    });

    const nextNotifications = [...current.notifications];
    if (anomalies.length > 0) {
      nextNotifications.unshift({
        id: randomUUID(),
        source: "finance",
        channel: "system",
        recipient: "RWA Admin",
        subject: "Finance anomalies detected",
        message: `${anomalies.length} anomaly entries detected in latest upload.`,
        createdAtMs: Date.now(),
      });
    }

    return {
      ...current,
      financialEntries: sortByCreatedAtDesc([...nextRows, ...current.financialEntries]),
      financeAnomalies: [...anomalies, ...current.financeAnomalies].sort(
        (a, b) => b.detectedAtMs - a.detectedAtMs
      ),
      notifications: sortByCreatedAtDesc(nextNotifications),
    };
  });
}

function classifyComplaint(description: string, fallbackCategory: string): {
  category: string;
  severity: ComplaintSeverity;
} {
  const text = description.toLowerCase();

  const emergencyKeywords = [
    "fire",
    "smoke",
    "gas leak",
    "short circuit",
    "spark",
    "intruder",
    "theft",
    "burst pipe",
    "flood",
    "lift stuck",
    "elevator stuck",
  ];
  if (emergencyKeywords.some((keyword) => text.includes(keyword))) {
    const category = text.includes("fire") || text.includes("smoke") || text.includes("short")
      ? "Electrical"
      : text.includes("intruder") || text.includes("theft")
      ? "Security"
      : "Plumbing";
    return { category, severity: "emergency" };
  }

  if (text.includes("water") || text.includes("pipe") || text.includes("leak")) {
    return { category: "Plumbing", severity: "medium" };
  }
  if (text.includes("electric") || text.includes("switch") || text.includes("power")) {
    return { category: "Electrical", severity: "medium" };
  }
  if (text.includes("noise")) {
    return { category: "Noise", severity: "low" };
  }
  if (text.includes("parking")) {
    return { category: "Parking", severity: "low" };
  }

  return { category: fallbackCategory || "Other", severity: "medium" };
}

function logNotification(
  notifications: NotificationEntry[],
  source: NotificationSource,
  channel: NotificationChannel,
  recipient: string,
  subject: string,
  message: string
) {
  notifications.unshift({
    id: randomUUID(),
    source,
    channel,
    recipient,
    subject,
    message,
    createdAtMs: Date.now(),
  });
}

export async function addComplaint(entry: NewComplaintEntry) {
  return enqueueWrite((current) => {
    const triage = classifyComplaint(entry.description, entry.category.trim());
    const next: ComplaintEntry = {
      id: randomUUID(),
      residentName: entry.residentName.trim(),
      unitNumber: entry.unitNumber.trim(),
      category: triage.category,
      description: entry.description.trim(),
      status: "pending",
      severity: triage.severity,
      createdBy: entry.createdBy.trim() || "Resident",
      createdAtMs: Date.now(),
    };

    const nextNotifications = [...current.notifications];
    if (next.severity === "emergency") {
      const technician = current.externalServices.find(
        (service) =>
          service.isOnCall &&
          service.serviceCategory.toLowerCase() === next.category.toLowerCase()
      );
      if (technician) {
        const smsBody = `EMERGENCY in unit ${next.unitNumber}: ${next.description}`;
        const emailBody = `Emergency complaint logged by ${next.residentName} (${next.createdBy}). Assigned to ${technician.contactPerson}.`;
        next.dispatchSummary = `Dispatched ${technician.contactPerson} (${technician.vendorName}).`;
        logNotification(
          nextNotifications,
          "communication",
          "sms",
          technician.phoneNumber,
          "Emergency dispatch",
          smsBody
        );
        logNotification(
          nextNotifications,
          "communication",
          "email",
          "rwa_admin@smartsociety.local",
          "Emergency complaint dispatch report",
          emailBody
        );
      } else {
        next.dispatchSummary = "No on-call technician found.";
      }
    }

    return {
      ...current,
      complaints: sortByCreatedAtDesc([next, ...current.complaints]),
      notifications: sortByCreatedAtDesc(nextNotifications),
    };
  });
}

export async function updateComplaintStatus(id: string, status: ComplaintStatus) {
  return enqueueWrite((current) => ({
    ...current,
    complaints: current.complaints.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
  }));
}

function activeVisitors(visitorLogs: VisitorLogEntry[]): VisitorLogEntry[] {
  return visitorLogs.filter((visitor) => !visitor.exitTimeIso);
}

function getThresholdHours(visitorType: string): number {
  const type = visitorType.toLowerCase();
  if (type === "delivery") return 2;
  if (type === "maid") return 10;
  if (type === "staff") return 12;
  if (type === "guest") return 72;
  return 24;
}

function detectSecurityAnomalies(visitorLogs: VisitorLogEntry[]): SecurityAnomaly[] {
  const now = Date.now();
  return activeVisitors(visitorLogs)
    .map((visitor) => {
      const hoursInside = (now - new Date(visitor.entryTimeIso).getTime()) / (1000 * 60 * 60);
      return {
        visitor,
        hoursInside,
        thresholdHours: getThresholdHours(visitor.visitorType),
      };
    })
    .filter((item) => item.hoursInside > item.thresholdHours);
}

export async function runSecurityScan(guardPhone: string, guardEmail: string) {
  return enqueueWrite((current) => {
    const anomalies = detectSecurityAnomalies(current.visitorLogs);
    const nextNotifications = [...current.notifications];

    if (anomalies.length > 0) {
      const brief = anomalies
        .map(
          (item) =>
            `${item.visitor.visitorName} (${item.visitor.visitorType}) in ${item.visitor.hostFlat} for ${item.hoursInside.toFixed(1)}h`
        )
        .join("; ");

      logNotification(
        nextNotifications,
        "security",
        "sms",
        guardPhone,
        "Security anomaly alert",
        `Alert: ${brief}`
      );
      logNotification(
        nextNotifications,
        "security",
        "email",
        guardEmail,
        "Detailed security scan report",
        `Security scan detected ${anomalies.length} anomalies. ${brief}`
      );
    } else {
      logNotification(
        nextNotifications,
        "security",
        "system",
        "Security Console",
        "Scan complete",
        "No anomalies detected in active visitors."
      );
    }

    return {
      ...current,
      notifications: sortByCreatedAtDesc(nextNotifications),
    };
  });
}
