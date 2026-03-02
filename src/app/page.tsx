'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import {
  ComplaintEntry,
  ExternalServiceEntry,
  FinanceAnomalyEntry,
  FinancialEntry,
  NotificationEntry,
  VisitorLogEntry,
  createComplaint,
  runSecurityScan,
  setComplaintStatus,
  subscribeCommunicationFeed,
  subscribeComplaints,
  subscribeFinanceAnomalies,
  subscribeFinancialEntries,
  subscribeSecurityFeed,
  uploadFinancialEntries,
} from '@/lib/dashboard-data';
import styles from './page.module.css';

type UserRole = 'admin' | 'member' | 'guest';
type AgentId = 'financial' | 'complaint' | 'security' | 'communication';

interface UserModel {
  name: string;
  role: UserRole;
  isRWAMember: boolean;
}

interface ParsedFinancialRow {
  income: number;
  expense: number;
  isAnomaly: boolean;
}

const buildingImages = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&h=1080&fit=crop',
];

const dashboardBackgrounds = {
  resident: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1506728519029-22a4c1198d15?w=1920&h=1080&fit=crop',
  ],
  member: [
    'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1550258987-920a2eeb0991?w=1920&h=1080&fit=crop',
  ],
  admin: [
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&h=1080&fit=crop',
  ],
};

const financialAgents = [
  { id: 'financial', name: 'Financial', icon: 'INR', status: 'online' },
  { id: 'complaint', name: 'Complaint', icon: 'CMP', status: 'online' },
  { id: 'security', name: 'Security', icon: 'SEC', status: 'online' },
  { id: 'communication', name: 'Communication', icon: 'COM', status: 'online' },
] as const;

const currency = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const emptySubscribe = () => () => undefined;

function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function formatMoney(value: number) {
  return `Rs ${currency.format(value)}`;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['yes', 'true', '1', 'anomaly', 'flagged', 'high'].includes(normalized);
  }
  return false;
}

function getAnyValue(row: Record<string, unknown>, keys: string[]): unknown {
  const normalizedMap = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => normalizedMap.set(key.toLowerCase().trim(), value));
  for (const key of keys) {
    if (normalizedMap.has(key)) {
      return normalizedMap.get(key);
    }
  }
  return undefined;
}

function parseFinancialRows(rows: Record<string, unknown>[]): ParsedFinancialRow[] {
  const parsed: ParsedFinancialRow[] = [];

  rows.forEach((row) => {
    const income = toNumber(
      getAnyValue(row, ['income', 'total income', 'inflow', 'credit', 'collection', 'received'])
    );
    const expense = toNumber(
      getAnyValue(row, ['expense', 'total expense', 'outflow', 'debit', 'spent', 'payment'])
    );
    const anomaly = toBoolean(getAnyValue(row, ['anomaly', 'is anomaly', 'flag', 'alert', 'risk']));

    if (income > 0 || expense > 0 || anomaly) {
      parsed.push({
        income,
        expense,
        isAnomaly: anomaly || expense > income * 1.5,
      });
    }
  });

  return parsed;
}

function formatDate(ms: number) {
  if (!ms) return 'Just now';
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getThresholdHours(visitorType: string) {
  const type = visitorType.toLowerCase();
  if (type === 'delivery') return 2;
  if (type === 'maid') return 10;
  if (type === 'staff') return 12;
  if (type === 'guest') return 72;
  return 24;
}

function getHoursInside(entryTimeIso: string) {
  const hours = (Date.now() - new Date(entryTimeIso).getTime()) / (1000 * 60 * 60);
  return Math.max(0, hours);
}

export default function Home() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const isHydrated = useIsHydrated();
  const [activeAgent, setActiveAgent] = useState<AgentId>('financial');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({
    name: '',
    role: 'guest' as UserRole,
    password: '',
  });

  const typedUser = user as UserModel | null;

  const currentDashboardBackgrounds =
    typedUser?.role === 'admin'
      ? dashboardBackgrounds.admin
      : typedUser?.role === 'member'
      ? dashboardBackgrounds.member
      : dashboardBackgrounds.resident;

  useEffect(() => {
    if (!isAuthenticated) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % buildingImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % currentDashboardBackgrounds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [currentDashboardBackgrounds.length, isAuthenticated]);

  const visibleAgents = useMemo(() => {
    if (typedUser?.isRWAMember) {
      return financialAgents;
    }
    return financialAgents.filter((agent) => agent.id === 'financial' || agent.id === 'complaint');
  }, [typedUser?.isRWAMember]);

  const selectedAgent = visibleAgents.some((agent) => agent.id === activeAgent)
    ? activeAgent
    : 'financial';

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div
        className={styles.loginContainer}
        style={{
          backgroundImage: `url('${buildingImages[currentImageIndex]}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.8s ease-in-out',
        }}
      >
        <div className={styles.loginOverlay}></div>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>Smart Society OS</h1>
          <p className={styles.loginSubtitle}>Intelligent Community Management</p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setLoginError('');

              if (!loginForm.name.trim()) {
                setLoginError('Name is required');
                return;
              }

              if ((loginForm.role === 'admin' || loginForm.role === 'member') && !loginForm.password) {
                setLoginError('Password is required for RWA Members and Admins');
                return;
              }

              if (loginForm.role === 'member' && loginForm.password !== 'member123') {
                setLoginError('Invalid password for RWA Member');
                return;
              }

              if (loginForm.role === 'admin' && loginForm.password !== 'admin123') {
                setLoginError('Invalid password for RWA Admin');
                return;
              }

              login(loginForm.name, loginForm.role);
              setLoginForm({ name: '', role: 'guest', password: '' });
            }}
            className={styles.loginForm}
          >
            <div>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={loginForm.name}
                onChange={(event) => setLoginForm({ ...loginForm, name: event.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={loginForm.role}
                onChange={(event) => {
                  setLoginForm({
                    ...loginForm,
                    role: event.target.value as UserRole,
                    password: '',
                  });
                  setLoginError('');
                }}
              >
                <option value="guest">Resident (Guest)</option>
                <option value="member">RWA Member</option>
                <option value="admin">RWA Admin</option>
              </select>
            </div>

            {(loginForm.role === 'member' || loginForm.role === 'admin') && (
              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(event) => {
                    setLoginForm({ ...loginForm, password: event.target.value });
                    setLoginError('');
                  }}
                  required
                />
              </div>
            )}

            {loginError && <p className={styles.loginError}>{loginError}</p>}

            <button type="submit" className={styles.loginButton}>
              Login
            </button>
          </form>

          <p className={styles.loginInfo}>
            <strong>Demo Passwords:</strong> RWA Member: <code>member123</code> | RWA Admin:{' '}
            <code>admin123</code>
          </p>

          <div className={styles.carouselDots}>
            {buildingImages.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>Smart Society OS</h1>
        </div>

        <nav className={styles.agentNav}>
          {visibleAgents.map((agent) => {
            const restricted = agent.id === 'communication' && !typedUser?.isRWAMember;
            return (
              <button
                key={agent.id}
                className={`${styles.agentCard} ${selectedAgent === agent.id ? styles.active : ''} ${
                  restricted ? styles.restricted : ''
                }`}
                onClick={() => !restricted && setActiveAgent(agent.id)}
                disabled={restricted}
                title={restricted ? 'Only accessible to RWA Members' : ''}
              >
                <span className={styles.agentIcon}>{agent.icon}</span>
                <div className={styles.agentInfo}>
                  <h3>{agent.name}</h3>
                  <span>{agent.status}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className={styles.userInfo}>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{typedUser?.name}</p>
            <p className={styles.userRole}>
              {typedUser?.role === 'admin'
                ? 'Admin'
                : typedUser?.role === 'member'
                ? 'RWA Member'
                : 'Resident'}
            </p>
          </div>
          <button className={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main
        className={styles.mainContent}
        style={{
          backgroundImage: `url('${currentDashboardBackgrounds[currentImageIndex]}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className={styles.dashboardOverlay}></div>

        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2>{selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Agent</h2>
          </div>
          <div className={styles.headerRight}>
            <input type="search" placeholder="Search..." className={styles.searchBox} />
          </div>
        </header>

        <div className={styles.contentArea}>
          {selectedAgent === 'financial' && <FinancialAgent user={typedUser} />}
          {selectedAgent === 'complaint' && <ComplaintAgent user={typedUser} />}
          {selectedAgent === 'security' && typedUser?.isRWAMember && <SecurityAgent user={typedUser} />}
          {selectedAgent === 'communication' && typedUser?.isRWAMember && (
            <CommunicationAgent user={typedUser} />
          )}
        </div>
      </main>
    </div>
  );
}

function FinancialAgent({ user }: { user: UserModel | null }) {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [anomalies, setAnomalies] = useState<FinanceAnomalyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const unsubscribe = subscribeFinancialEntries(
      (list) => {
        setEntries(list);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeFinanceAnomalies(
      (list) => {
        setAnomalies(list);
      },
      (message) => {
        setError(message);
      }
    );
    return unsubscribe;
  }, []);

  const summary = useMemo(() => {
    return entries.reduce(
      (accumulator, row) => {
        accumulator.totalIncome += row.income;
        accumulator.totalExpenses += row.expense;
        if (row.isAnomaly) accumulator.anomalies += 1;
        return accumulator;
      },
      { totalIncome: 0, totalExpenses: 0, anomalies: 0 }
    );
  }, [entries]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadState('');
  };

  const handleUpload = async () => {
    if (!isAdmin) return;
    if (!selectedFile) {
      setUploadState('Please select an Excel/CSV file first.');
      return;
    }

    try {
      setUploadState('Uploading and processing file...');
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const parsedRows = parseFinancialRows(rows);

      if (!parsedRows.length) {
        setUploadState(
          'No valid financial rows found. Required columns: income/expense (and optional anomaly).'
        );
        return;
      }

      await uploadFinancialEntries(parsedRows, user?.name ?? 'Admin');
      setUploadState(`Uploaded ${parsedRows.length} rows. Dashboard updated in real time.`);
      setSelectedFile(null);
    } catch {
      setUploadState('Upload failed. Check file format and try again.');
    }
  };

  return (
    <div className="agent-content">
      <div className="stat-card-grid">
        <div className="stat-card">
          <span className="stat-icon">INR</span>
          <p className="stat-label">Total Income</p>
          <h3 className="stat-value">{formatMoney(summary.totalIncome)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">OUT</span>
          <p className="stat-label">Total Expenses</p>
          <h3 className="stat-value">{formatMoney(summary.totalExpenses)}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">ALT</span>
          <p className="stat-label">Anomalies</p>
          <h3 className="stat-value">{summary.anomalies}</h3>
        </div>
      </div>

      {loading && <div className="panel">Loading financial data...</div>}
      {error && <div className="panel">{error}</div>}

      <div className="panel" style={!isAdmin ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
        <h3>Upload Financial Data</h3>
        <p style={{ fontSize: 12 }}>
          {isAdmin
            ? 'Admin can upload Excel/CSV. Required columns: income and expense.'
            : 'Only RWA Admin can upload financial data.'}
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={!isAdmin}
        />
        <button type="button" onClick={handleUpload} disabled={!isAdmin}>
          Analyze and Save
        </button>
        {uploadState && <p style={{ fontSize: 12 }}>{uploadState}</p>}
      </div>

      <div className="panel">
        <h3>Latest Financial Entries</h3>
        {entries.length === 0 ? (
          <p>No financial data yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Anomaly</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 8).map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.createdAtMs)}</td>
                    <td>{formatMoney(entry.income)}</td>
                    <td>{formatMoney(entry.expense)}</td>
                    <td>{entry.isAnomaly ? 'Yes' : 'No'}</td>
                    <td>{entry.uploadedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Detected Finance Anomalies</h3>
        {anomalies.length === 0 ? (
          <p>No anomalies logged yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.detectedAtMs)}</td>
                    <td>{item.category}</td>
                    <td>{formatMoney(item.amount)}</td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ComplaintAgent({ user }: { user: UserModel | null }) {
  const [complaints, setComplaints] = useState<ComplaintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [form, setForm] = useState({
    residentName: '',
    unitNumber: '',
    category: 'Maintenance',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeComplaints(
      (list) => {
        setComplaints(list);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const summary = useMemo(() => {
    return complaints.reduce(
      (accumulator, item) => {
        accumulator.total += 1;
        if (item.status === 'pending') accumulator.pending += 1;
        if (item.status === 'resolved') accumulator.resolved += 1;
        return accumulator;
      },
      { total: 0, pending: 0, resolved: 0 }
    );
  }, [complaints]);

  const canManage = user?.isRWAMember;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');

    if (!form.residentName.trim() || !form.unitNumber.trim() || !form.description.trim()) {
      setSubmitMessage('Resident name, unit number and description are required.');
      return;
    }

    try {
      await createComplaint({
        residentName: form.residentName,
        unitNumber: form.unitNumber,
        category: form.category,
        description: form.description,
        createdBy: user?.name ?? 'Resident',
      });
      setSubmitMessage('Complaint submitted. Dashboard updated in real time.');
      setForm({ residentName: '', unitNumber: '', category: 'Maintenance', description: '' });
    } catch {
      setSubmitMessage('Could not submit complaint.');
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'resolved') => {
    try {
      await setComplaintStatus(id, status);
    } catch {
      setSubmitMessage('Unable to update complaint status.');
    }
  };

  return (
    <div className="agent-content">
      <div className="stat-card-grid">
        <div className="stat-card">
          <span className="stat-icon">CMP</span>
          <p className="stat-label">Total Complaints</p>
          <h3 className="stat-value">{summary.total}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">PND</span>
          <p className="stat-label">Pending</p>
          <h3 className="stat-value">{summary.pending}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">OK</span>
          <p className="stat-label">Resolved</p>
          <h3 className="stat-value">{summary.resolved}</h3>
        </div>
      </div>

      {loading && <div className="panel">Loading complaints...</div>}
      {error && <div className="panel">{error}</div>}

      <div className="panel">
        <h3>Add New Complaint</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Resident Name"
            value={form.residentName}
            onChange={(event) => setForm((prev) => ({ ...prev, residentName: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Unit Number"
            value={form.unitNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, unitNumber: event.target.value }))}
          />
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          >
            <option>Maintenance</option>
            <option>Noise</option>
            <option>Parking</option>
            <option>Security</option>
            <option>Other</option>
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit">
            Submit
          </button>
        </form>
        {submitMessage && <p style={{ fontSize: 12 }}>{submitMessage}</p>}
      </div>

      <div className="panel">
        <h3>Recent Complaints</h3>
        {complaints.length === 0 ? (
          <p>No complaints submitted yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Resident</th>
                  <th>Unit</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Dispatch</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAtMs)}</td>
                    <td>{item.residentName}</td>
                    <td>{item.unitNumber}</td>
                    <td>{item.category}</td>
                    <td>{item.severity}</td>
                    <td>{item.status}</td>
                    <td>{item.dispatchSummary ?? '-'}</td>
                    <td>
                      {canManage ? (
                        item.status === 'resolved' ? (
                          <button type="button" onClick={() => updateStatus(item.id, 'pending')}>
                            Mark Pending
                          </button>
                        ) : (
                          <button type="button" onClick={() => updateStatus(item.id, 'resolved')}>
                            Mark Resolved
                          </button>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityAgent({ user }: { user: UserModel | null }) {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanState, setScanState] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSecurityFeed(
      ({ visitorLogs: logs, notifications: audit }) => {
        setVisitorLogs(logs);
        setNotifications(audit);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const activeVisitors = useMemo(
    () => visitorLogs.filter((item) => !item.exitTimeIso),
    [visitorLogs]
  );
  const anomalies = useMemo(
    () =>
      activeVisitors.filter(
        (item) => getHoursInside(item.entryTimeIso) > getThresholdHours(item.visitorType)
      ),
    [activeVisitors]
  );
  const securityNotifications = useMemo(
    () => notifications.filter((item) => item.source === 'security'),
    [notifications]
  );

  const handleScan = async () => {
    try {
      setScanState('Running security scan...');
      const result = await runSecurityScan({
        guardPhone: '+91-9000000001',
        guardEmail: `${(user?.name ?? 'guard').toLowerCase().replace(/\s+/g, '.')}@smartsociety.local`,
      });
      setScanState(result.summary);
    } catch {
      setScanState('Security scan failed.');
    }
  };

  return (
    <div className="agent-content">
      <div className="stat-card-grid">
        <div className="stat-card">
          <span className="stat-icon">VIS</span>
          <p className="stat-label">Active Visitors</p>
          <h3 className="stat-value">{activeVisitors.length}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">ALT</span>
          <p className="stat-label">Overstay Alerts</p>
          <h3 className="stat-value">{anomalies.length}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">LOG</span>
          <p className="stat-label">Scan Events</p>
          <h3 className="stat-value">{securityNotifications.length}</h3>
        </div>
      </div>

      {loading && <div className="panel">Loading security feed...</div>}
      {error && <div className="panel">{error}</div>}

      <div className="panel">
        <h3>Security Agent Scan</h3>
        <p style={{ fontSize: 12 }}>
          Trigger manual scan to detect overstaying visitors and send alert logs (simulated SMS/Email).
        </p>
        <button type="button" onClick={handleScan}>
          Run Security Scan
        </button>
        {scanState && <p style={{ fontSize: 12 }}>{scanState}</p>}
      </div>

      <div className="panel">
        <h3>Active Visitor Log</h3>
        {activeVisitors.length === 0 ? (
          <p>No active visitors.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Flat</th>
                  <th>Hours Inside</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeVisitors.slice(0, 8).map((item) => {
                  const hoursInside = getHoursInside(item.entryTimeIso);
                  const threshold = getThresholdHours(item.visitorType);
                  const flagged = hoursInside > threshold;
                  return (
                    <tr key={item.id}>
                      <td>{item.visitorName}</td>
                      <td>{item.visitorType}</td>
                      <td>{item.hostFlat}</td>
                      <td>{hoursInside.toFixed(1)}h</td>
                      <td>{flagged ? 'Anomaly' : 'Normal'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunicationAgent({ user }: { user: UserModel | null }) {
  const [complaints, setComplaints] = useState<ComplaintEntry[]>([]);
  const [externalServices, setExternalServices] = useState<ExternalServiceEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeCommunicationFeed(
      ({ complaints: list, externalServices: services, notifications: audit }) => {
        setComplaints(list);
        setExternalServices(services);
        setNotifications(audit);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const emergencyComplaints = useMemo(
    () => complaints.filter((item) => item.severity === 'emergency'),
    [complaints]
  );
  const commNotifications = useMemo(
    () => notifications.filter((item) => item.source === 'communication'),
    [notifications]
  );
  const activeOnCall = useMemo(
    () => externalServices.filter((item) => item.isOnCall),
    [externalServices]
  );

  return (
    <div className="agent-content">
      <div className="stat-card-grid">
        <div className="stat-card">
          <span className="stat-icon">EMR</span>
          <p className="stat-label">Emergency Tickets</p>
          <h3 className="stat-value">{emergencyComplaints.length}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">MSG</span>
          <p className="stat-label">Messages Sent</p>
          <h3 className="stat-value">{commNotifications.length}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-icon">VND</span>
          <p className="stat-label">On-Call Vendors</p>
          <h3 className="stat-value">{activeOnCall.length}</h3>
        </div>
      </div>

      {loading && <div className="panel">Loading communication feed...</div>}
      {error && <div className="panel">{error}</div>}

      <div className="panel">
        <h3>Emergency Dispatch Timeline</h3>
        {emergencyComplaints.length === 0 ? (
          <p>No emergency complaints yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Resident</th>
                  <th>Category</th>
                  <th>Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {emergencyComplaints.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAtMs)}</td>
                    <td>{item.residentName}</td>
                    <td>{item.category}</td>
                    <td>{item.dispatchSummary ?? 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Message Log</h3>
        {commNotifications.length === 0 ? (
          <p>No communication events logged.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {commNotifications.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAtMs)}</td>
                    <td>{item.channel.toUpperCase()}</td>
                    <td>{item.recipient}</td>
                    <td>{item.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, marginTop: 8 }}>Viewing as: {user?.name ?? 'RWA Member'}</p>
      </div>
    </div>
  );
}
