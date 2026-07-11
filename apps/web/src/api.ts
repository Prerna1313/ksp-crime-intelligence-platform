export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

const TOKEN_KEY = 'ksp_access_token';
const REFRESH_TOKEN_KEY = 'ksp_refresh_token';
const DEMO_ACCESS_TOKEN = 'demo-access-token';
const DEMO_REFRESH_TOKEN = 'demo-refresh-token';
const DEMO_BADGE = 'KSP-ADMIN-001';
const DEMO_PASSWORD = 'KspAdmin@2026';

const DEMO_USER: ApiUser = {
  id: 'demo-admin-user',
  badge_number: DEMO_BADGE,
  full_name: 'Demo Administrator',
  role: 'ADMIN',
  rank: 'Administrator',
  station_id: 'SCRB',
  district_id: 'Bengaluru',
};

const DEMO_CASES: CaseItem[] = [
  {
    id: 'CR-2024-04471',
    case_number: 'CR-2024-04471',
    case_type: 'Robbery',
    status: 'ACTIVE',
    station_id: 'Koramangala P.S.',
    assigned_officer_id: 'SI Ravi Kumar',
    incident_date: '2024-09-15',
    incident_address: 'Koramangala',
    narrative: 'Robbery incident with matching MO markers and linked suspect aliases.',
    created_at: '2024-09-15T08:30:00Z',
    updated_at: '2024-09-30T12:00:00Z',
    entities: [
      { id: 'ent-raju', canonical_name: 'Raju Kumar', entity_type: 'PERSON', role: 'ACCUSED', confidence: 0.86 },
      { id: 'ent-suresh', canonical_name: 'Suresh M.', entity_type: 'PERSON', role: 'ASSOCIATE', confidence: 0.72 },
      { id: 'ent-phone', canonical_name: '9880-XXXX', entity_type: 'PHONE', role: 'USED', confidence: 0.91 },
    ],
    exhibits: [],
  },
  {
    id: 'CR-2023-11201',
    case_number: 'CR-2023-11201',
    case_type: 'Robbery',
    status: 'CLOSED',
    station_id: 'Tumkur P.S.',
    assigned_officer_id: 'SI Ravi Kumar',
    incident_date: '2023-11-18',
    incident_address: 'Tumkur',
    created_at: '2023-11-18T10:00:00Z',
    updated_at: '2023-12-20T10:00:00Z',
  },
  {
    id: 'CR-2024-00892',
    case_number: 'CR-2024-00892',
    case_type: 'Robbery',
    status: 'ACTIVE',
    station_id: 'Mysuru P.S.',
    assigned_officer_id: 'SI Ravi Kumar',
    incident_date: '2024-02-04',
    incident_address: 'Mysuru',
    created_at: '2024-02-04T10:00:00Z',
    updated_at: '2024-02-08T10:00:00Z',
  },
];

const DEMO_TIMELINE: TimelineEvent[] = [
  { id: 'evt-demo-1', case_id: 'CR-2024-04471', event_type: 'INCIDENT_REPORTED', description: 'Incident reported, Koramangala', event_date: '2024-09-15T00:00:00Z' },
  { id: 'evt-demo-2', case_id: 'CR-2024-04471', event_type: 'SUSPECT_IDENTIFIED', description: 'Suspect Raju K. identified through witness statement', event_date: '2024-09-18T00:00:00Z' },
  { id: 'evt-demo-3', case_id: 'CR-2024-04471', event_type: 'CONFLICT', description: 'Phone CDR conflicts with witness placement', event_date: '2024-09-22T00:00:00Z', has_conflict: true },
  { id: 'evt-demo-4', case_id: 'CR-2024-04471', event_type: 'ARREST', description: 'Arrest recorded in case diary', event_date: '2024-09-30T00:00:00Z' },
];

const DEMO_GRAPH: NetworkGraph = {
  nodes: [
    { data: { id: 'CR-2024-04471', label: 'CR-2024-04471', type: 'CASE' } },
    { data: { id: 'ent-raju', label: 'Raju Kumar', type: 'PERSON' } },
    { data: { id: 'ent-suresh', label: 'Suresh M.', type: 'PERSON' } },
    { data: { id: 'ent-phone', label: '9880-XXXX', type: 'PHONE' } },
  ],
  edges: [
    { data: { id: 'edge-1', source: 'ent-raju', target: 'CR-2024-04471', label: 'ACCUSED_IN' } },
    { data: { id: 'edge-2', source: 'ent-raju', target: 'ent-suresh', label: 'ASSOCIATE' } },
    { data: { id: 'edge-3', source: 'ent-raju', target: 'ent-phone', label: 'USED' } },
  ],
};

export type ApiStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ApiUser {
  id: string;
  badge_number: string;
  full_name: string;
  role: string;
  rank?: string | null;
  station_id?: string | null;
  district_id?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: ApiUser;
}

export interface CaseItem {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  station_id?: string | null;
  assigned_officer_id?: string | null;
  incident_date?: string | null;
  incident_location?: string | null;
  incident_address?: string | null;
  narrative?: string | null;
  created_at?: string;
  updated_at?: string;
  entities?: CaseEntity[];
  exhibits?: unknown[];
}

export interface CaseEntity {
  id: string;
  canonical_name: string;
  entity_type: string;
  role?: string;
  confidence?: number;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  description: string;
  event_date: string;
  has_conflict?: boolean;
  conflict_details?: string | null;
}

export interface SearchResultItem {
  id: string;
  type: 'CASE' | 'ENTITY' | string;
  title: string;
  description?: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total_results: number;
  page: number;
}

export interface EntityAlias {
  id: string;
  entity_id: string;
  alias_text: string;
  script?: string | null;
  source_case_id?: string | null;
  confidence: number;
  created_at: string;
}

export interface EntityDetail {
  id: string;
  canonical_name: string;
  entity_type: string;
  neo4j_node_id?: string | null;
  aliases?: EntityAlias[];
  case_links?: Record<string, unknown>[];
  relationships?: Record<string, unknown>[];
}

export interface GraphNode {
  data: {
    id: string;
    label: string;
    type?: string;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label?: string;
  };
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface MapIncident {
  id: string;
  case_number: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
}

export interface Hotspot {
  lat: number;
  lng: number;
  intensity: number;
}

export interface ReportItem {
  id: string;
  case_id?: string | null;
  title: string;
  status: string;
  created_by?: string;
  created_at?: string;
  pdf_path?: string | null;
}

export interface AlertItem {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string | null;
  confidence_tier?: string | null;
  acknowledged_at?: string | null;
}

export interface AuditEvent {
  id: string;
  user_id?: string | null;
  event_type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  action?: string | null;
  details?: Record<string, unknown> | null;
  created_at?: string;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  case_id?: string | null;
  created_at: string;
  last_activity: string;
}

export interface ChatMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT' | string;
  content: string;
  confidence_tier?: string | null;
  sources?: Record<string, unknown>[] | null;
  has_conflict?: boolean;
  created_at?: string;
}

interface StandardResponse<T> {
  status: string;
  data: T;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function isDemoMode() {
  return getStoredToken() === DEMO_ACCESS_TOKEN;
}

export function storeAuthTokens(response: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, response.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function demoResponse<T>(path: string, init: RequestInit = {}, unwrap = true): T {
  const method = (init.method || 'GET').toUpperCase();
  const now = new Date().toISOString();

  if (path === '/api/v1/auth/me') return DEMO_USER as T;
  if (path === '/api/v1/cases/') return DEMO_CASES as T;
  if (path.startsWith('/api/v1/cases/') && path.endsWith('/timeline')) return DEMO_TIMELINE as T;
  if (path.startsWith('/api/v1/network/cases/')) return DEMO_GRAPH as T;
  if (path.startsWith('/api/v1/cases/')) return (DEMO_CASES.find((item) => path.includes(item.id)) || DEMO_CASES[0]) as T;
  if (path.startsWith('/api/v1/search/')) {
    const url = new URL(`${API_BASE_URL}${path}`);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const type = url.searchParams.get('type');
    const caseResults = DEMO_CASES
      .filter((item) => !query || `${item.case_number} ${item.case_type} ${item.incident_address}`.toLowerCase().includes(query))
      .map((item) => ({
        id: item.id,
        type: 'CASE',
        title: `Case ${item.case_number}`,
        description: item.case_type,
        relevance_score: 0.9,
        metadata: { case_number: item.case_number, status: item.status, district: item.incident_address || item.station_id },
      }));
    const entityResults = [
      { id: 'ent-raju', type: 'ENTITY', title: 'Raju Kumar', description: 'PERSON', relevance_score: 0.84, metadata: { entity_type: 'PERSON' } },
      { id: 'ent-suresh', type: 'ENTITY', title: 'Suresh M.', description: 'PERSON', relevance_score: 0.73, metadata: { entity_type: 'PERSON' } },
    ].filter((item) => !query || `${item.title} ${item.description}`.toLowerCase().includes(query));
    const results = type === 'CASE' ? caseResults : type ? entityResults.filter((item) => item.description === type) : [...caseResults, ...entityResults];
    return { query, results, total_results: results.length, page: 1 } as T;
  }
  if (path.startsWith('/api/v1/entities/') && path.endsWith('/cases')) return DEMO_CASES as T;
  if (path.startsWith('/api/v1/network/entities/')) return DEMO_GRAPH as T;
  if (path.startsWith('/api/v1/entities/')) {
    return {
      id: 'ent-raju',
      canonical_name: 'Raju Kumar',
      entity_type: 'PERSON',
      aliases: [
        { id: 'alias-1', entity_id: 'ent-raju', alias_text: 'Raja K', confidence: 0.8, created_at: now },
        { id: 'alias-2', entity_id: 'ent-raju', alias_text: 'ರಾಜು ಕುಮಾರ', confidence: 0.76, created_at: now },
      ],
      case_links: [],
      relationships: [],
    } as T;
  }
  if (path === '/api/v1/map/incidents') {
    return DEMO_CASES.map((item) => ({ id: item.id, case_number: item.case_number, type: item.case_type, lat: 12.9716, lng: 77.5946, status: item.status })) as T;
  }
  if (path === '/api/v1/map/hotspots') return [{ lat: 12.9716, lng: 77.5946, intensity: 0.82 }] as T;
  if (path === '/api/v1/reports/') {
    if (method === 'POST') {
      const body = JSON.parse(String(init.body || '{}'));
      return { id: `demo-report-${Date.now()}`, case_id: body.case_id, title: body.title, status: 'DRAFT', created_by: DEMO_USER.full_name, created_at: now } as T;
    }
    return [
      { id: 'demo-report-1', case_id: DEMO_CASES[0].id, title: 'Cross-case MO summary', status: 'GENERATED', created_by: DEMO_USER.full_name, created_at: now },
      { id: 'demo-report-2', case_id: DEMO_CASES[0].id, title: 'Network analysis brief', status: 'DRAFT', created_by: DEMO_USER.full_name, created_at: now },
    ] as T;
  }
  if (path.includes('/download')) return { status: 'success', download_url: '' } as T;
  if (path === '/api/v1/alerts/') {
    return [
      { id: 'demo-alert-1', alert_type: 'HOTSPOT_THRESHOLD', severity: 'HIGH', title: 'Hotspot threshold crossed - Whitefield', description: '+40% incidents vs. 4-week baseline', confidence_tier: 'High' },
      { id: 'demo-alert-2', alert_type: 'PATTERN_SPIKE', severity: 'MEDIUM', title: 'Pattern spike - cross-case MO match', description: '3 cases matched in 14 days', confidence_tier: 'Moderate' },
    ] as T;
  }
  if (path.includes('/acknowledge')) return { id: path.split('/')[4], alert_type: 'ACK', severity: 'MEDIUM', title: 'Acknowledged', acknowledged_at: now } as T;
  if (path === '/api/v1/admin/users') {
    if (method === 'POST') return { id: `demo-user-${Date.now()}`, ...JSON.parse(String(init.body || '{}')) } as T;
    return [DEMO_USER] as T;
  }
  if (path.startsWith('/api/v1/admin/users/')) return { ...DEMO_USER, ...JSON.parse(String(init.body || '{}')) } as T;
  if (path === '/api/v1/admin/audit') return [{ id: 'audit-1', user_id: DEMO_USER.full_name, event_type: 'LOGIN', action: 'Demo session', created_at: now }] as T;
  if (path === '/api/v1/conversations/') return { id: `demo-conv-${Date.now()}`, user_id: DEMO_USER.id, case_id: DEMO_CASES[0].id, created_at: now, last_activity: now } as T;

  if (!unwrap) return { status: 'success', data: null } as T;
  return null as T;
}

async function request<T>(path: string, init: RequestInit = {}, unwrap = true): Promise<T> {
  if (isDemoMode()) return demoResponse<T>(path, init, unwrap);

  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = payload?.detail || response.statusText || 'API request failed';
    throw new Error(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail);
  }

  if (!unwrap) return payload as T;
  return (payload as StandardResponse<T>).data;
}

export const api = {
  login: (badge_number: string, password: string) =>
    badge_number === DEMO_BADGE && password === DEMO_PASSWORD
      ? Promise.resolve({
          access_token: DEMO_ACCESS_TOKEN,
          refresh_token: DEMO_REFRESH_TOKEN,
          token_type: 'bearer',
          user: DEMO_USER,
        })
      : request<LoginResponse>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ badge_number, password }),
        }, false),
  me: () => request<ApiUser>('/api/v1/auth/me', {}, false),
  listCases: () => request<CaseItem[]>('/api/v1/cases/'),
  getCase: (caseId: string) => request<CaseItem>(`/api/v1/cases/${encodeURIComponent(caseId)}`),
  getCaseTimeline: (caseId: string) => request<TimelineEvent[]>(`/api/v1/cases/${encodeURIComponent(caseId)}/timeline`),
  getCaseNetwork: (caseId: string) => request<NetworkGraph>(`/api/v1/network/cases/${encodeURIComponent(caseId)}`),
  search: (q: string, type?: string) => request<SearchResponse>(`/api/v1/search/?q=${encodeURIComponent(q)}${type ? `&type=${encodeURIComponent(type)}` : ''}`),
  getEntity: (entityId: string) => request<EntityDetail>(`/api/v1/entities/${encodeURIComponent(entityId)}`),
  getEntityCases: (entityId: string) => request<CaseItem[]>(`/api/v1/entities/${encodeURIComponent(entityId)}/cases`),
  getEntityNetwork: (entityId: string) => request<NetworkGraph>(`/api/v1/network/entities/${encodeURIComponent(entityId)}`),
  mapIncidents: () => request<MapIncident[]>('/api/v1/map/incidents'),
  hotspots: () => request<Hotspot[]>('/api/v1/map/hotspots'),
  reports: () => request<ReportItem[]>('/api/v1/reports/'),
  createReport: (caseId: string | null | undefined, title: string, conversationId?: string | null) =>
    request<ReportItem>('/api/v1/reports/', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId || null, title, conversation_id: conversationId || null }),
    }),
  downloadReport: (reportId: string) => request<{ download_url: string }>(`/api/v1/reports/${encodeURIComponent(reportId)}/download`, {}, false),
  alerts: () => request<AlertItem[]>('/api/v1/alerts/'),
  acknowledgeAlert: (alertId: string) => request<AlertItem>(`/api/v1/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'PATCH' }),
  adminUsers: () => request<ApiUser[]>('/api/v1/admin/users'),
  createAdminUser: (user: { badge_number: string; full_name: string; role: string; rank?: string; station_id?: string; district_id?: string; password: string }) =>
    request<ApiUser>('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  updateAdminUser: (userId: string, user: Partial<Pick<ApiUser, 'full_name' | 'role' | 'rank' | 'station_id' | 'district_id'> & { is_active: boolean }>) =>
    request<ApiUser>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    }),
  adminAudit: () => request<AuditEvent[]>('/api/v1/admin/audit'),
  createConversation: (caseId?: string | null) =>
    request<Conversation>('/api/v1/conversations/', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId || null }),
    }),
};

export async function streamConversationMessage(
  conversationId: string,
  query: string,
  language: string,
  onEvent: (event: Record<string, unknown>) => void,
) {
  if (isDemoMode()) {
    const steps = [
      { stage: 'INTENT', content: 'Analyzing query intent...' },
      { stage: 'RETRIEVAL', content: 'Reading demo case, entity, timeline and network records...' },
      { stage: 'HYPOTHESIS', content: 'Formulating evidence-grounded investigative hypotheses...' },
      { stage: 'EVALUATION', content: 'Checking confidence and source coverage...' },
      {
        stage: 'COMPOSITION',
        status: 'success',
        confidence: 'Moderate',
        confidence_dots: 3,
        response: `Demo analysis for "${query}": CR-2024-04471 links Raju Kumar, Suresh M. and phone 9880-XXXX through accused/associate/phone-use relationships. Review the timeline conflict before treating the location evidence as settled.`,
        sources: [{ label: 'Demo case record · CR-2024-04471' }, { label: 'Demo network graph' }],
      },
    ];
    for (const step of steps) {
      onEvent(step);
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return;
  }

  const token = getStoredToken();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, language }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Conversation request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const line = chunk.split('\n').find((entry) => entry.startsWith('data: '));
      if (!line) continue;
      onEvent(JSON.parse(line.slice(6)));
    }
  }
}
