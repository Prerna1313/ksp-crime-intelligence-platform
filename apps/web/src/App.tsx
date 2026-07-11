import { useState, useEffect, useCallback } from 'react';
import { CREST_SRC } from './assets/crest';
import {
  api,
  clearAuthTokens,
  getStoredToken,
  storeAuthTokens,
  streamConversationMessage,
  type AlertItem,
  type ApiStatus,
  type ApiUser,
  type AuditEvent,
  type CaseItem,
  type ChatMessage,
  type EntityDetail,
  type Hotspot,
  type MapIncident,
  type NetworkGraph,
  type ReportItem,
  type SearchResultItem,
  type TimelineEvent,
} from './api';
import './App.css';

/* ============================================================
   ICONS — consistent stroke system, 24px grid, 1.75 stroke
   ============================================================ */
const ICONS = {
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><line x1="20.5" y1="20.5" x2="15.3" y2="15.3"/></>,
  bell: <><path d="M6 16.5v-5a6 6 0 1 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 20.5c0-4.2 4-6.5 8-6.5s8 2.3 8 6.5"/></>,
  chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
  chevronRight: <><polyline points="9 6 15 12 9 18"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c3 3.6 3 14.4 0 18M12 3c-3 3.6-3 14.4 0 18"/></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  workspace: <><path d="M4 5h16v11H8l-4 4V5z"/></>,
  network: <><circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><line x1="8.1" y1="7.1" x2="15.9" y2="7.1"/><line x1="7" y1="8.1" x2="10.8" y2="15.8"/><line x1="17" y1="8.1" x2="13.2" y2="15.8"/></>,
  map: <><path d="M12 22s7-7.6 7-12.6A7 7 0 1 0 5 9.4C5 14.4 12 22 12 22z"/><circle cx="12" cy="9.4" r="2.2"/></>,
  cases: <><path d="M3 6.5h6l2 2h10v10.5H3V6.5z"/></>,
  reports: <><path d="M6.5 2h9l5 5v15h-14V2z"/><line x1="9" y1="12" x2="16.5" y2="12"/><line x1="9" y1="16" x2="16.5" y2="16"/></>,
  admin: <><path d="M12 2.2l8 3v6c0 5-3.5 8.7-8 11-4.5-2.3-8-6-8-11v-6l8-3z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.3 7.3 0 0 0-2-1.2L14.6 3H9.4l-.6 2.6a7.3 7.3 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L9.4 21h5.2l.6-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></>,
  menu: <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>,
  x: <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>,
  filter: <><polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4"/></>,
  download: <><path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M5 19h14"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="15" y1="4" x2="15" y2="20"/></>,
  zoomIn: <><circle cx="10.5" cy="10.5" r="6.5"/><line x1="20.5" y1="20.5" x2="15.3" y2="15.3"/><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></>,
  zoomOut: <><circle cx="10.5" cy="10.5" r="6.5"/><line x1="20.5" y1="20.5" x2="15.3" y2="15.3"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></>,
  layers: <><polygon points="12 3 21 8 12 13 3 8 12 3"/><polyline points="3 15 12 20 21 15"/><polyline points="3 11.5 12 16.5 21 11.5"/></>,
};

export function Ic({ name, cls = 'ic' }: { name: keyof typeof ICONS; cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

/* ============================================================
   REUSABLE UI COMPONENTS
   ============================================================ */

interface PanelBlockProps {
  label: string;
  head?: string;
  headRight?: React.ReactNode;
  cls?: string;
  children?: React.ReactNode;
}

function PanelBlock({ label, head, headRight, cls = '', children }: PanelBlockProps) {
  return (
    <div className={`panel-block ${cls}`}>
      <span className="structure-tag">{label}</span>
      {head && (
        <div className="block-head">
          <h4>{head}</h4>
          {headRight}
        </div>
      )}
      {children}
    </div>
  );
}

function Badge({ text, kind = 'neutral' }: { text: string; kind?: string }) {
  return (
    <span className={`badge badge-${kind}`}>
      <span className="dot"></span>
      {text}
    </span>
  );
}

function Chip({ text }: { text: React.ReactNode }) {
  return <span className="chip" dangerouslySetInnerHTML={{ __html: String(text) }}></span>;
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  kind?: 'primary' | 'secondary' | 'ghost';
  extra?: React.ReactNode;
}

function Btn({ text, kind = 'secondary', extra, ...props }: BtnProps) {
  const cls = kind === 'primary' ? 'btn btn-primary' : kind === 'ghost' ? 'btn btn-ghost' : 'btn';
  return (
    <button className={cls} {...props}>
      {extra}
      {text}
    </button>
  );
}

function Confidence({ n, labelText }: { n: number; labelText?: string }) {
  const segs = [];
  for (let i = 1; i <= 5; i++) {
    segs.push(<span key={i} className={`seg ${i <= n ? 'on' : ''}`}></span>);
  }
  return (
    <span className="confidence">
      <span className="segs">{segs}</span>
      {labelText && <span className="lbl">{labelText}</span>}
    </span>
  );
}

interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
}

function Table({ headers, rows }: TableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ text }: { text: string }) {
  return (
    <div className="pagination">
      <span>{text}</span>
      <div className="pg-btns">
        <button><Ic name="chevronRight" cls="ic-sm" /></button>
        <button className="on">1</button>
        <button>2</button>
        <button style={{ transform: 'scaleX(-1)' }}><Ic name="chevronRight" cls="ic-sm" /></button>
      </div>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder: string;
}

function Field({ label, placeholder, type = 'text', ...props }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <input className="input" type={type} placeholder={placeholder} {...props} />
    </div>
  );
}

function Kv({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div>
      {rows.map(([k, v], i) => (
        <div className="kv" key={i}>
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </div>
  );
}

function NetworkCanvas({
  graph,
  query = '',
  zoom = 100,
  selectedNodeId,
  onSelect,
  height = '360px',
  compact = false,
}: {
  graph: NetworkGraph;
  query?: string;
  zoom?: number;
  selectedNodeId?: string;
  onSelect?: (id: string) => void;
  height?: string;
  compact?: boolean;
}) {
  const activeGraph = graph.nodes.length ? graph : FALLBACK_GRAPH;
  const normalizedQuery = query.trim().toLowerCase();
  const matchedIds = new Set(
    activeGraph.nodes
      .filter((node) => !normalizedQuery || `${node.data.label} ${node.data.type || ''}`.toLowerCase().includes(normalizedQuery))
      .map((node) => node.data.id)
  );
  const relatedIds = new Set(matchedIds);
  if (normalizedQuery) {
    activeGraph.edges.forEach((edge) => {
      if (matchedIds.has(edge.data.source) || matchedIds.has(edge.data.target)) {
        relatedIds.add(edge.data.source);
        relatedIds.add(edge.data.target);
      }
    });
  }
  const nodes = activeGraph.nodes.filter((node) => !normalizedQuery || relatedIds.has(node.data.id));
  const nodeIds = new Set(nodes.map((node) => node.data.id));
  const edges = activeGraph.edges.filter((edge) => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target));
  const center = { x: 450, y: compact ? 115 : 205 };
  const radiusX = compact ? 260 : 310;
  const radiusY = compact ? 58 : 135;
  const scale = zoom / 100;
  const positions = nodes.reduce<Record<string, { x: number; y: number }>>((acc, node, index) => {
    if (node.data.type === 'CASE' && !compact) {
      acc[node.data.id] = center;
      return acc;
    }
    const ringIndex = activeGraph.nodes.some((item) => item.data.type === 'CASE') && !compact ? index - 1 : index;
    const total = Math.max(1, nodes.filter((item) => item.data.type !== 'CASE' || compact).length);
    const angle = (Math.PI * 2 * Math.max(0, ringIndex)) / total - Math.PI / 2;
    acc[node.data.id] = {
      x: center.x + Math.cos(angle) * radiusX * scale,
      y: center.y + Math.sin(angle) * radiusY * scale,
    };
    return acc;
  }, {});

  const nodeTone = (type?: string) => {
    const normalized = (type || '').toUpperCase();
    if (normalized.includes('CASE')) return 'case';
    if (normalized.includes('PHONE') || normalized.includes('VEHICLE')) return 'object';
    return 'person';
  };

  const caseNode = nodes.find((node) => node.data.type === 'CASE');
  const caseNodeId = caseNode ? caseNode.data.id : null;

  return (
    <div className={`viz-canvas network-viz ${compact ? 'compact' : ''}`} style={{ height }}>
      <svg viewBox={`0 0 900 ${compact ? 230 : 430}`} role="img" aria-label="Network graph">
        <defs>
          <marker id="edge-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const source = positions[edge.data.source];
          const target = positions[edge.data.target];
          if (!source || !target) return null;

          const isSourceCase = edge.data.source === caseNodeId;
          const isTargetCase = edge.data.target === caseNodeId;
          const isCircularEdge = !isSourceCase && !isTargetCase;

          let pathD = '';
          let labelX = 0;
          let labelY = 0;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;

          if (isCircularEdge && !compact) {
            const dx = midX - center.x;
            const dy = midY - center.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ctrlX = midX + (dx / len) * 45;
            const ctrlY = midY + (dy / len) * 45;
            pathD = `M ${source.x} ${source.y} Q ${ctrlX} ${ctrlY} ${target.x} ${target.y}`;
            labelX = 0.5 * midX + 0.5 * ctrlX;
            labelY = 0.5 * midY + 0.5 * ctrlY;
          } else {
            pathD = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
            labelX = midX;
            labelY = midY;
          }

          return (
            <g key={edge.data.id}>
              <path className="graph-edge" d={pathD} markerEnd="url(#edge-arrow)" fill="none" />
              {!compact && (
                <text className="edge-label" x={labelX} y={labelY}>
                  {edge.data.label || 'RELATED'}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((node) => {
          const position = positions[node.data.id] || center;
          const isSelected = selectedNodeId === node.data.id;

          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          let labelX = position.x;
          let labelY = position.y;

          if (node.data.type === 'CASE' && !compact) {
            labelY = position.y + 54;
          } else {
            const dx = position.x - center.x;
            const dy = position.y - center.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const offset = (compact ? 24 : 34) + 12;
            labelX = position.x + ux * offset;
            labelY = position.y + uy * offset;

            if (Math.abs(ux) > 0.6) {
              textAnchor = ux > 0 ? 'start' : 'end';
              labelY = position.y + 4;
            } else {
              textAnchor = 'middle';
              if (uy < 0) {
                labelY = position.y - offset;
              } else {
                labelY = position.y + offset;
              }
            }
          }

          return (
            <g
              className={`graph-node ${nodeTone(node.data.type)} ${isSelected ? 'selected' : ''}`}
              key={node.data.id}
              onClick={() => onSelect?.(node.data.id)}
              tabIndex={0}
              role="button"
            >
              <circle cx={position.x} cy={position.y} r={compact ? 24 : 34} />
              <text className="node-label" style={{ textAnchor }} x={labelX} y={labelY}>{node.data.label}</text>
              {!compact && <text className="node-type" x={position.x} y={position.y + 5}>{node.data.type || 'NODE'}</text>}
            </g>
          );
        })}
        {nodes.length === 0 && <text className="empty-viz-text" x="450" y="210">No matching nodes</text>}
      </svg>
      {!compact && (
        <div className="viz-status">
          {nodes.length} nodes · {edges.length} links · Zoom {zoom}%
        </div>
      )}
    </div>
  );
}

function TimelineCanvas({ events, zoom = 100, height = '240px', compact = false }: { events: TimelineEvent[]; zoom?: number; height?: string; compact?: boolean }) {
  const activeEvents = (events.length ? events : FALLBACK_TIMELINE)
    .slice()
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const viewHeight = compact ? 170 : 250;
  const startX = compact ? 80 : 90;
  const endX = compact ? 820 : 815;
  const axisY = compact ? 78 : 118;
  const available = (endX - startX) * (zoom / 100);

  return (
    <div className={`viz-canvas timeline-viz ${compact ? 'compact' : ''}`} style={{ height }}>
      <svg viewBox={`0 0 900 ${viewHeight}`} role="img" aria-label="Timeline">
        <line className="timeline-axis" x1={startX} y1={axisY} x2={Math.min(850, startX + available)} y2={axisY} />
        {activeEvents.map((event, index) => {
          const x = activeEvents.length === 1 ? startX : startX + ((endX - startX) * index) / (activeEvents.length - 1);
          const isConflict = !!event.has_conflict;
          return (
            <g className={`timeline-event ${isConflict ? 'conflict' : ''}`} key={event.id}>
              <line className="timeline-stem" x1={x} y1={axisY - 28} x2={x} y2={axisY + 28} />
              <circle cx={x} cy={axisY} r={compact ? 8 : 11} />
              <text className="timeline-date" x={x} y={axisY - 42}>{shortDate(event.event_date)}</text>
              {!compact && (
                <>
                  <rect className="timeline-card" x={Math.max(18, Math.min(670, x - 92))} y={axisY + 38} width="190" height="58" rx="6" />
                  <text className="timeline-desc" x={Math.max(36, Math.min(688, x - 74))} y={axisY + 62}>{event.description.slice(0, 30)}</text>
                  <text className="timeline-type" x={Math.max(36, Math.min(688, x - 74))} y={axisY + 82}>{event.event_type.replace(/_/g, ' ')}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {!compact && <div className="viz-status">{activeEvents.length} events · Zoom {zoom}%</div>}
    </div>
  );
}

function CrimeMapCanvas({
  incidents,
  cases,
  hotspots,
  layers,
  typeFilter,
  statusFilter,
  height = '420px',
}: {
  incidents: MapIncident[];
  cases: CaseItem[];
  hotspots: Hotspot[];
  layers: { incidents: boolean; hotspots: boolean; boundaries: boolean };
  typeFilter: string;
  statusFilter: string;
  height?: string;
}) {
  const fallbackIncidents: MapIncident[] = cases.map((item, index) => ({
    id: item.id,
    case_number: item.case_number,
    type: item.case_type,
    status: item.status,
    lat: [12.9352, 13.3409, 12.2958, 12.9698][index % 4],
    lng: [77.6245, 77.1010, 76.6394, 77.7500][index % 4],
  }));
  const activeIncidents = (incidents.length ? incidents : fallbackIncidents)
    .filter((incident) => (!typeFilter || incident.type === typeFilter) && (!statusFilter || incident.status === statusFilter));
  const activeHotspots = hotspots.length ? hotspots : [{ lat: 12.9698, lng: 77.7500, intensity: 0.82 }];
  const project = (lat: number, lng: number, index = 0) => {
    const minLat = 12.05;
    const maxLat = 13.55;
    const minLng = 76.25;
    const maxLng = 78.25;
    const x = 90 + ((lng - minLng) / (maxLng - minLng)) * 700 + (index % 3) * 14;
    const y = 385 - ((lat - minLat) / (maxLat - minLat)) * 310 + (index % 2) * 12;
    return {
      x: Math.max(55, Math.min(850, x)),
      y: Math.max(55, Math.min(395, y)),
    };
  };

  return (
    <div className="viz-canvas map-viz" style={{ height }}>
      <svg viewBox="0 0 900 440" role="img" aria-label="Crime map">
        <rect className="map-base" x="34" y="28" width="832" height="380" rx="8" />
        <path className="map-road major" d="M70 335 C220 280 310 320 450 235 S690 135 835 92" />
        <path className="map-road" d="M105 112 C220 172 322 160 430 205 S640 285 790 248" />
        <path className="map-road" d="M160 378 C250 260 275 188 330 55" />
        <path className="map-road" d="M575 390 C560 290 600 188 740 52" />
        {layers.boundaries && (
          <>
            <path className="station-boundary" d="M95 95 L354 60 L438 190 L318 350 L104 305 Z" />
            <path className="station-boundary" d="M438 190 L690 83 L826 152 L790 342 L558 360 Z" />
          </>
        )}
        {layers.hotspots && activeHotspots.map((hotspot, index) => {
          const position = project(hotspot.lat, hotspot.lng, index);
          return <circle className="hotspot-ring" key={`${hotspot.lat}-${hotspot.lng}-${index}`} cx={position.x} cy={position.y} r={50 + hotspot.intensity * 36} />;
        })}
        {layers.incidents && activeIncidents.map((incident, index) => {
          const position = project(incident.lat, incident.lng, index);
          return (
            <g className={`map-marker ${incident.status === 'ACTIVE' ? 'active' : ''}`} key={incident.id}>
              <circle cx={position.x} cy={position.y} r="13" />
              <text x={position.x} y={position.y + 35}>{incident.case_number}</text>
            </g>
          );
        })}
        {!layers.incidents && !layers.hotspots && <text className="empty-viz-text" x="450" y="220">All map layers are off</text>}
      </svg>
      <div className="viz-status">
        {layers.incidents ? activeIncidents.length : 0} incident markers · {layers.hotspots ? activeHotspots.length : 0} hotspot overlays
      </div>
    </div>
  );
}

/* ============================================================
   NAVIGATION ITEMS
   ============================================================ */
const NAV_ITEMS = [
  { id: 'workspace', label: 'Investigation Workspace', icon: 'workspace' as keyof typeof ICONS },
  { id: 'search', label: 'Search', icon: 'search' as keyof typeof ICONS },
  { id: 'network', label: 'Network Explorer', icon: 'network' as keyof typeof ICONS },
  { id: 'map', label: 'Crime Map', icon: 'map' as keyof typeof ICONS },
  { id: 'cases', label: 'Cases', icon: 'cases' as keyof typeof ICONS },
  { id: 'profiles', label: 'Profiles', icon: 'user' as keyof typeof ICONS },
  { id: 'reports', label: 'Reports', icon: 'reports' as keyof typeof ICONS },
  { id: 'alerts', label: 'Alerts', icon: 'bell' as keyof typeof ICONS },
  { id: 'admin', label: 'Administration', icon: 'admin' as keyof typeof ICONS },
  { id: 'settings', label: 'Settings', icon: 'settings' as keyof typeof ICONS },
];

/* ============================================================
   SCREEN REGISTRY DEFINITIONS
   ============================================================ */
interface ScreenConfig {
  key: string;
  navLabel: string;
  shell: boolean;
  title?: string;
  breadcrumb?: string[];
  activeNav?: string;
  caseLabel?: string | null;
  subtitle?: string;
  actions?: { text: string; kind?: 'primary' | 'secondary' | 'ghost' }[];
  hideHead?: boolean;
}

const SCREENS: ScreenConfig[] = [
  { key: 'login', navLabel: 'Login', shell: false },
  { key: 'workspace', navLabel: 'Investigation Workspace', shell: true, title: 'Investigation Workspace', activeNav: 'workspace', caseLabel: 'CR-2024-04471', hideHead: true },
  { key: 'search', navLabel: 'Search', shell: true, title: 'Search', breadcrumb: ['Search'], activeNav: 'search', caseLabel: null },
  { key: 'case', navLabel: 'Case Profile', shell: true, title: 'Case Profile', breadcrumb: ['Cases', 'CR-2024-04471'], activeNav: 'cases', caseLabel: 'CR-2024-04471', hideHead: true },
  { key: 'entity', navLabel: 'Entity Profile', shell: true, title: 'Entity Profile', breadcrumb: ['Profiles', 'Raju Kumar'], activeNav: 'profiles', caseLabel: null, hideHead: true },
  { key: 'network', navLabel: 'Network Explorer', shell: true, title: 'Network Explorer', breadcrumb: ['Network Explorer', 'Context: CR-2024-04471'], activeNav: 'network', caseLabel: 'CR-2024-04471' },
  { key: 'timeline', navLabel: 'Timeline', shell: true, title: 'Timeline', breadcrumb: ['Cases', 'CR-2024-04471', 'Timeline'], activeNav: 'cases', caseLabel: 'CR-2024-04471', subtitle: 'Reached contextually from a case — not a top-level nav destination.' },
  { key: 'map', navLabel: 'Crime Map', shell: true, title: 'Crime Map', breadcrumb: ['Crime Map'], activeNav: 'map', caseLabel: null },
  { key: 'reports', navLabel: 'Reports', shell: true, title: 'Reports', breadcrumb: ['Reports'], activeNav: 'reports', caseLabel: null },
  { key: 'alerts', navLabel: 'Alerts', shell: true, title: 'Alerts', breadcrumb: ['Alerts'], activeNav: 'alerts', caseLabel: null },
  { key: 'admin', navLabel: 'Administration', shell: true, title: 'Administration', breadcrumb: ['Administration'], activeNav: 'admin', caseLabel: null },
  { key: 'settings', navLabel: 'Settings', shell: true, title: 'Settings', breadcrumb: ['Settings'], activeNav: 'settings', caseLabel: null }
];

const FALLBACK_CASES: CaseItem[] = [
  {
    id: 'CR-2024-04471',
    case_number: 'CR-2024-04471',
    case_type: 'Robbery',
    status: 'ACTIVE',
    station_id: 'Koramangala P.S.',
    assigned_officer_id: 'SI Ravi Kumar',
    incident_date: '2024-09-15',
    incident_address: 'Koramangala',
    narrative: 'Incident reported near Koramangala with linked MO markers.',
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
  },
];

const FALLBACK_GRAPH: NetworkGraph = {
  nodes: [
    { data: { id: 'CR-2024-04471', label: 'Case:4471', type: 'CASE' } },
    { data: { id: 'raju-kumar', label: 'Raju Kumar', type: 'PERSON' } },
    { data: { id: 'suresh-m', label: 'Suresh M.', type: 'PERSON' } },
    { data: { id: 'phone-9945', label: 'Phone:9945', type: 'PHONE' } },
  ],
  edges: [
    { data: { id: 'e1', source: 'raju-kumar', target: 'CR-2024-04471', label: 'ACCUSED_IN' } },
    { data: { id: 'e2', source: 'raju-kumar', target: 'suresh-m', label: 'ASSOCIATE' } },
    { data: { id: 'e3', source: 'suresh-m', target: 'phone-9945', label: 'SHARES_PHONE' } },
  ],
};

const FALLBACK_TIMELINE: TimelineEvent[] = [
  { id: 'evt-1', case_id: 'CR-2024-04471', event_type: 'INCIDENT_REPORTED', description: 'Incident reported, Koramangala', event_date: '2024-09-15T00:00:00Z' },
  { id: 'evt-2', case_id: 'CR-2024-04471', event_type: 'SUSPECT_IDENTIFIED', description: 'Suspect Raju K. identified', event_date: '2024-09-18T00:00:00Z' },
  { id: 'evt-3', case_id: 'CR-2024-04471', event_type: 'CONFLICT', description: 'Conflicting location evidence', event_date: '2024-09-22T00:00:00Z', has_conflict: true },
  { id: 'evt-4', case_id: 'CR-2024-04471', event_type: 'ARREST', description: 'Arrest made', event_date: '2024-09-30T00:00:00Z' },
];

function statusKind(status?: string) {
  const value = (status || '').toUpperCase();
  if (value.includes('ACTIVE') || value.includes('GENERATED')) return 'success';
  if (value.includes('PENDING') || value.includes('MEDIUM') || value.includes('DRAFT')) return 'warning';
  if (value.includes('HIGH') || value.includes('CRITICAL')) return 'critical';
  return 'neutral';
}

function confidenceDots(value?: number | string | null) {
  if (typeof value === 'number') return Math.max(1, Math.min(5, Math.round(value * 5)));
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('high')) return 4;
  if (normalized.includes('low')) return 2;
  if (normalized.includes('critical')) return 5;
  return 3;
}

function shortDate(date?: string | null) {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function App() {
  const [currentScreen, setCurrentScreen] = useState<string>(() => getStoredToken() ? 'workspace' : 'login');
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [loginForm, setLoginForm] = useState({ badge: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseItem[]>(FALLBACK_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(FALLBACK_CASES[0].id);
  const [caseDetail, setCaseDetail] = useState<CaseItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(FALLBACK_TIMELINE);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph>(FALLBACK_GRAPH);
  const [mapIncidents, setMapIncidents] = useState<MapIncident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);
  const [entityCases, setEntityCases] = useState<CaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('robbery');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [queryText, setQueryText] = useState<string>('');
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<string>('');
  const [mapTypeFilter, setMapTypeFilter] = useState<string>('');
  const [mapStatusFilter, setMapStatusFilter] = useState<string>('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('');
  const [networkQuery, setNetworkQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [graphZoom, setGraphZoom] = useState<number>(100);
  const [timelineZoom, setTimelineZoom] = useState<number>(100);
  const [entityQuestion, setEntityQuestion] = useState<string>('');
  const [mapLayers, setMapLayers] = useState({ incidents: true, hotspots: true, boundaries: false });
  const [settings, setSettings] = useState(() => ({
    language: localStorage.getItem('ksp_language') || 'English',
    density: localStorage.getItem('ksp_density') || 'Comfortable',
    hotspotAlerts: localStorage.getItem('ksp_hotspot_alerts') !== 'off',
    matchAlerts: localStorage.getItem('ksp_match_alerts') !== 'off',
  }));
  
  // Scrim and Collapsible Overlays
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  // Expanded reasoning sets
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Active Tab Indices mapping
  const [activeTabs, setActiveTabs] = useState<Record<string, number>>({
    'case-tabs': 0,
    'admin-tabs': 0
  });

  // Selected row state for details drawer
  const [selectedCaseRow, setSelectedCaseRow] = useState<string | null>(null);

  const selectedCase = caseDetail || cases.find((item) => item.id === selectedCaseId || item.case_number === selectedCaseId) || FALLBACK_CASES[0];
  const selectedCaseNumber = selectedCase.case_number || selectedCase.id;
  const selectedEntityId = entityDetail?.id || selectedCase.entities?.[0]?.id || 'raju-kumar';

  const loadCoreData = useCallback(async () => {
    if (!getStoredToken()) return;
    setApiStatus('loading');
    setApiError(null);
    try {
      const [user, caseList, reportList, alertList, incidentList, hotspotList, userList, auditList] = await Promise.all([
        api.me(),
        api.listCases(),
        api.reports().catch(() => []),
        api.alerts().catch(() => []),
        api.mapIncidents().catch(() => []),
        api.hotspots().catch(() => []),
        api.adminUsers().catch(() => []),
        api.adminAudit().catch(() => []),
      ]);

      const liveCases = caseList.length ? caseList : FALLBACK_CASES;
      setCurrentUser(user);
      setCases(liveCases);
      setReports(reportList);
      setAlerts(alertList);
      setMapIncidents(incidentList);
      setHotspots(hotspotList);
      setAdminUsers(userList);
      setAuditEvents(auditList);
      setSelectedCaseId((existing) => {
        const hasExisting = liveCases.some((item) => item.id === existing || item.case_number === existing);
        return hasExisting ? existing : liveCases[0].id;
      });
      setApiStatus('ready');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to connect to backend');
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    if (!getStoredToken() || !selectedCaseId) return;
    let cancelled = false;
    async function loadCaseContext() {
      try {
        const [detail, events, graph] = await Promise.all([
          api.getCase(selectedCaseId).catch(() => null),
          api.getCaseTimeline(selectedCaseId).catch(() => FALLBACK_TIMELINE),
          api.getCaseNetwork(selectedCaseId).catch(() => FALLBACK_GRAPH),
        ]);
        if (cancelled) return;
        setCaseDetail(detail);
        setTimeline(events.length ? events : FALLBACK_TIMELINE);
        setNetworkGraph(graph.nodes.length ? graph : FALLBACK_GRAPH);
        const entityId = detail?.entities?.[0]?.id;
        if (entityId) {
          const [entity, relatedCases] = await Promise.all([
            api.getEntity(entityId).catch(() => null),
            api.getEntityCases(entityId).catch(() => []),
          ]);
          if (!cancelled) {
            setEntityDetail(entity);
            setEntityCases(relatedCases);
          }
        }
      } catch {
        if (!cancelled) {
          setTimeline(FALLBACK_TIMELINE);
          setNetworkGraph(FALLBACK_GRAPH);
        }
      }
    }
    void loadCaseContext();
    return () => {
      cancelled = true;
    };
  }, [selectedCaseId]);

  useEffect(() => {
    if (!getStoredToken() || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await api.search(searchQuery.trim(), searchType || undefined);
        setSearchResults(response.results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, searchType]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Scrim Overlay Controllers
  const closeOverlays = () => {
    setNavOpen(false);
    setPanelOpen(false);
  };

  const handleScreenChange = (key: string) => {
    const aliases: Record<string, string> = {
      cases: 'case',
      profiles: 'entity',
    };
    setCurrentScreen(aliases[key] || key);
    closeOverlays();
    window.scrollTo(0, 0);
  };

  const handleLogin = async () => {
    setLoginError(null);
    setApiStatus('loading');
    try {
      const response = await api.login(loginForm.badge.trim(), loginForm.password);
      storeAuthTokens(response);
      setCurrentUser(response.user);
      await loadCoreData();
      handleScreenChange('workspace');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign in failed');
      setApiStatus('error');
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    setCurrentUser(null);
    setConversationId(null);
    setChatMessages([]);
    setApiStatus('idle');
    setToast('Signed out');
    handleScreenChange('login');
  };

  const refreshAll = async () => {
    await loadCoreData();
    setToast('Live data refreshed');
  };

  const downloadBlob = (filename: string, body: string, type = 'application/json') => {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportJson = (filename: string, payload: unknown) => {
    downloadBlob(filename, JSON.stringify(payload, null, 2));
    setToast(`${filename} exported`);
  };

  const handleCreateReport = async () => {
    const title = window.prompt('Report title', `${selectedCaseNumber} investigation brief`);
    if (!title) return;
    try {
      const report = await api.createReport(selectedCase.id, title, conversationId);
      setReports((prev) => [report, ...prev.filter((item) => item.id !== report.id)]);
      setToast('Report draft created');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to create report');
    }
  };

  const handleReportDownload = async (report: ReportItem) => {
    if (report.id.startsWith('fallback')) {
      exportJson(`${report.title.replace(/\s+/g, '-').toLowerCase()}.json`, report);
      return;
    }
    try {
      const response = await api.downloadReport(report.id);
      if (response.download_url) {
        window.open(response.download_url, '_blank', 'noopener,noreferrer');
      } else {
        exportJson(`${report.title}.json`, report);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to download report');
    }
  };

  const handleAddNote = () => {
    const note = window.prompt('Add investigation note');
    if (!note) return;
    setReasoningSteps((prev) => [...prev, `Investigator note: ${note}`]);
    setToast('Note added to reasoning trace');
  };

  const handleEntityQuestion = async (text: string) => {
    handleScreenChange('workspace');
    window.setTimeout(() => void handleSendQuery(text), 0);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('ksp_language', settings.language);
    localStorage.setItem('ksp_density', settings.density);
    localStorage.setItem('ksp_hotspot_alerts', settings.hotspotAlerts ? 'on' : 'off');
    localStorage.setItem('ksp_match_alerts', settings.matchAlerts ? 'on' : 'off');
    setToast('Settings saved');
  };

  const handleAddUser = async () => {
    const badge = window.prompt('Badge number');
    const fullName = badge ? window.prompt('Full name') : null;
    const role = fullName ? window.prompt('Role', 'SI') : null;
    const password = role ? window.prompt('Temporary password (12+ characters)') : null;
    if (!badge || !fullName || !role || !password) return;
    try {
      const user = await api.createAdminUser({
        badge_number: badge,
        full_name: fullName,
        role,
        rank: role,
        password,
      });
      setAdminUsers((prev) => [user, ...prev]);
      setToast('User created');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to create user');
    }
  };

  const handleEditUser = async (user: ApiUser) => {
    const role = window.prompt('Update role', user.role);
    if (!role || role === user.role) return;
    try {
      const updated = await api.updateAdminUser(user.id, { role, rank: role });
      setAdminUsers((prev) => prev.map((item) => item.id === user.id ? updated : item));
      setToast('User updated');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to update user');
    }
  };

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    const conversation = await api.createConversation(selectedCase.id);
    setConversationId(conversation.id);
    return conversation.id;
  };

  const handleSendQuery = async (directQuery?: string) => {
    const text = (directQuery ?? queryText).trim();
    if (!text || isSendingMessage) return;
    setIsSendingMessage(true);
    setReasoningSteps([]);
    setChatMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'USER', content: text }]);
    setQueryText('');

    try {
      const activeConversationId = await ensureConversation();
      await streamConversationMessage(activeConversationId, text, 'en', (event) => {
        const stage = String(event.stage || '');
        if (stage && stage !== 'COMPOSITION') {
          setReasoningSteps((prev) => [...prev, String(event.content || stage)]);
        }
        if (stage === 'COMPOSITION' || event.response) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'ASSISTANT',
              content: String(event.response || ''),
              confidence_tier: String(event.confidence || 'Moderate'),
              sources: Array.isArray(event.sources) ? event.sources as Record<string, unknown>[] : [],
            },
          ]);
        }
      });
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'ASSISTANT',
          content: error instanceof Error ? error.message : 'Unable to reach reasoning engine.',
          confidence_tier: 'Low',
          has_conflict: true,
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTabChange = (groupId: string, index: number) => {
    setActiveTabs(prev => ({
      ...prev,
      [groupId]: index
    }));
  };

  /* ============================================================
     RENDER REUSABLE INNER WORKSPACE BLOCKS & TEMPLATES
     ============================================================ */
  const renderReasoningToggle = (id: string, text: string) => {
    const isOpen = !!expandedReasoning[id];
    return (
      <>
        <div className={`reasoning-toggle ${isOpen ? 'open' : ''}`} onClick={() => toggleReasoning(id)}>
          <Ic name="chevronRight" cls="ic-sm chev" />
          <span>{isOpen ? 'Collapse reasoning trace' : 'Expand reasoning trace'}</span>
        </div>
        <div className={`reasoning-body ${isOpen ? 'open' : ''}`} id={id}>
          {text}
        </div>
      </>
    );
  };

  const renderTabsBlock = (groupId: string, tabs: string[], panes: React.ReactNode[]) => {
    const activeIndex = activeTabs[groupId] ?? 0;
    return (
      <>
        <div className="tabs">
          {tabs.map((t, idx) => (
            <div
              key={idx}
              className={`tab ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => handleTabChange(groupId, idx)}
            >
              {t}
            </div>
          ))}
        </div>
        {panes.map((p, idx) => (
          <div key={idx} className={`tab-pane ${idx === activeIndex ? 'active' : ''}`}>
            {p}
          </div>
        ))}
      </>
    );
  };

  /* ============================================================
     SCREEN VIEW RENDERERS
     ============================================================ */

  const renderLoginView = () => (
    <div className="login-wrap">
      <div className="login-card">
        <img className="crest" src={CREST_SRC} alt="Karnataka State Police crest" />
        <h1>KSP Crime Intelligence Platform</h1>
        <div className="sub">Karnataka State Police &middot; SCRB</div>
        <Field
          label="Badge / Employee ID"
          placeholder="e.g. KSP-44210"
          value={loginForm.badge}
          onChange={(event) => setLoginForm((prev) => ({ ...prev, badge: event.target.value }))}
        />
        <Field
          label="Password"
          placeholder="••••••••"
          type="password"
          value={loginForm.password}
          onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleLogin();
          }}
        />
        {loginError && <div className="field-error"><span className="conflict-flag" style={{ width: '14px', height: '14px', fontSize: '9px' }}>!</span> {loginError}</div>}
        <Btn text={apiStatus === 'loading' ? 'Signing In...' : 'Sign In'} kind="primary" onClick={() => void handleLogin()} disabled={apiStatus === 'loading'} />
        <div className="login-foot">Authorized personnel only<span className="sep">&middot;</span>All access is logged and audited</div>
      </div>
    </div>
  );

  const renderWorkspaceView = () => {
    const visibleMessages = chatMessages.length
      ? chatMessages
      : [
          { role: 'USER', content: 'Has this MO appeared elsewhere in Karnataka in 2024?' },
          {
            role: 'ASSISTANT',
            content: '3 similar cases found based on modus-operandi similarity: CR-2023-11201 (Tumkur), CR-2024-00892 (Mysuru), CR-2024-03107 (Bengaluru).',
            confidence_tier: 'Moderate',
            sources: [{ label: 'IIF-1 · CR-2023-11201' }, { label: 'IIF-1 · CR-2024-00892' }, { label: 'IIF-1 · CR-2024-03107' }],
          },
        ];

    return (
      <>
        <PanelBlock label="CONVERSATION PANEL">
          {apiError && <div className="conflict-box"><div className="conflict-head"><span className="conflict-flag">!</span> Backend connection</div><p>{apiError}</p></div>}
          {visibleMessages.map((message, index) => {
            const isAi = message.role === 'ASSISTANT';
            const sources = message.sources || [];
            return (
              <div className="msg" style={{ maxWidth: isAi ? '640px' : '520px' }} key={`${message.role}-${index}`}>
                <span className={`avatar ${isAi ? 'ai' : ''}`}>{isAi ? 'AI' : (currentUser?.full_name || 'User').split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <div className="msg-bubble">
                  <div className="msg-meta">
                    {isAi ? 'AI Response' : 'User'} {isAi && <>&nbsp;<Confidence n={confidenceDots(message.confidence_tier)} labelText={message.confidence_tier || 'Moderate'} /></>}
                  </div>
                  <div className="msg-body">{message.content}</div>
                  {sources.length > 0 && (
                    <div className="source-row">
                      {sources.slice(0, 4).map((source, sourceIndex) => (
                        <span className="source-chip" key={sourceIndex}>{String(source.label || source.case_number || source.title || `Source ${sourceIndex + 1}`)}</span>
                      ))}
                    </div>
                  )}
                  {isAi && renderReasoningToggle(
                    `rz_msg_${index}`,
                    reasoningSteps.length ? reasoningSteps.join(' · ') : 'Matched through the backend reasoning pipeline and persisted to the conversation record.'
                  )}
                  {message.has_conflict && (
                    <div className="conflict-box">
                      <div className="conflict-head"><span className="conflict-flag">!</span> Conflicting evidence</div>
                      <p>Review the linked timeline and source records before using this answer operationally.</p>
                      <Btn text="Investigate conflict" kind="secondary" onClick={() => handleScreenChange('timeline')} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isSendingMessage && <div className="source-chip">Reasoning engine is working...</div>}
        </PanelBlock>

        <PanelBlock label="QUERY INPUT">
          <div className="query-bar">
            <div className="icon-btn-inline"><Ic name="mic" /></div>
            <input
              placeholder="Ask anything about this case — English or ಕನ್ನಡ"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSendQuery();
              }}
            />
            <div className="icon-btn-inline primary" onClick={() => void handleSendQuery()}><Ic name="send" /></div>
          </div>
        </PanelBlock>

      <PanelBlock label="VISUALIZATION LAUNCHERS">
        <div className="filter-bar">
          <Btn text="← Timeline" onClick={() => handleScreenChange('timeline')} />
          <Btn text="Network ↗" onClick={() => handleScreenChange('network')} />
          <Btn text="Map ↗" onClick={() => handleScreenChange('map')} />
        </div>
      </PanelBlock>
    </>
    );
  };

  const renderWorkspaceRight = () => (
    <>
      <PanelBlock label="CASE CONTEXT CARD" head="Overview">
        <Kv rows={[
          ['Case No.', selectedCaseNumber],
          ['Type', selectedCase.case_type],
          ['Status', <Badge key="case-status" text={selectedCase.status} kind={statusKind(selectedCase.status)} />],
          ['IO', selectedCase.assigned_officer_id || 'Unassigned']
        ]} />
      </PanelBlock>

      <PanelBlock label="HYPOTHESIS LIST" head="Live Hypotheses">
        <div className="hyp-card">
          <span className="hyp-name">H1 — Known recidivist</span>
          <Confidence n={3} />
        </div>
        <div className="hyp-card">
          <span className="hyp-name">H2 — Organised group</span>
          <Confidence n={2} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <Btn text="+ Add note" kind="ghost" onClick={handleAddNote} />
        </div>
      </PanelBlock>

      <PanelBlock label="OPEN QUESTIONS" head="Open Questions">
        <div className="list">
          <div className="list-item">{timeline.find((event) => event.has_conflict)?.description || 'Weapon source unconfirmed'}</div>
          <div className="list-item">{selectedCase.entities?.length ? `${selectedCase.entities.length} linked entities need review` : 'Third associate unidentified'}</div>
        </div>
      </PanelBlock>
    </>
  );

  const renderSearchView = () => (
    <>
      <PanelBlock label="GLOBAL SEARCH">
        <div className="search-bar">
          <Ic name="search" />
          <input
            placeholder="Search cases, suspects, MO, locations — English or ಕನ್ನಡ"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Ic name="mic" />
        </div>
      </PanelBlock>

      <PanelBlock label="FILTERS">
        <div className="filter-bar">
          <button className={`filter-chip ${searchType === '' ? 'active' : ''}`} onClick={() => setSearchType('')}>All</button>
          <button className={`filter-chip ${searchType === 'CASE' ? 'active' : ''}`} onClick={() => setSearchType('CASE')}>Cases</button>
          <button className={`filter-chip ${searchType === 'PERSON' ? 'active' : ''}`} onClick={() => setSearchType('PERSON')}>Persons</button>
          <button className={`filter-chip ${searchType === 'VEHICLE' ? 'active' : ''}`} onClick={() => setSearchType('VEHICLE')}>Vehicles</button>
          <Btn text="Refresh" kind="ghost" onClick={() => void refreshAll()} />
        </div>
      </PanelBlock>

      <div className="canvas-relative">
        <PanelBlock label="RESULTS">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case No.</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Match Confidence</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(searchResults.length ? searchResults : cases.map((item) => ({
                  id: item.id,
                  type: 'CASE',
                  title: item.case_number,
                  description: item.case_type,
                  relevance_score: 0.75,
                  metadata: { case_number: item.case_number, status: item.status, district: item.incident_address || item.station_id },
                }))).slice(0, 10).map((result) => {
                  const metadata = (result.metadata || {}) as Record<string, unknown>;
                  const caseNumber = String(metadata.case_number || result.title.replace(/^Case\s+/i, ''));
                  const status = String(metadata.status || 'ACTIVE');
                  return (
                    <tr className={selectedCaseRow === result.id ? 'selected' : ''} onClick={() => setSelectedCaseRow(result.id)} key={result.id}>
                      <td>{caseNumber}</td>
                      <td>{result.description || result.type}</td>
                      <td>{String(metadata.district || metadata.station_id || '—')}</td>
                      <td><Badge text={status} kind={statusKind(status)} /></td>
                      <td><Confidence n={confidenceDots(result.relevance_score || 0.6)} /></td>
                      <td><Btn text="Open" kind="ghost" onClick={async (event) => {
                        event.stopPropagation();
                        if (result.type === 'ENTITY') {
                          const entity = await api.getEntity(result.id).catch(() => null);
                          setEntityDetail(entity);
                          handleScreenChange('entity');
                          return;
                        }
                        setSelectedCaseId(result.id);
                        handleScreenChange('case');
                      }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination text={`Showing 1–${Math.min(10, (searchResults.length || cases.length))} of ${searchResults.length || cases.length} results`} />
        </PanelBlock>

        {selectedCaseRow && (
          <div className="drawer" style={{ display: 'block' }}>
            <span className="drawer-eyebrow">Row Detail</span>
            <div className="drawer-head">
              <b style={{ fontSize: '14px' }}>{selectedCaseRow}</b>
              <span className="drawer-close" onClick={() => setSelectedCaseRow(null)}>
                <Ic name="x" cls="ic-sm" />
              </span>
            </div>
            <Kv rows={[
              ['Type', searchResults.find((item) => item.id === selectedCaseRow)?.description || 'Case'],
              ['District', String(searchResults.find((item) => item.id === selectedCaseRow)?.metadata?.district || '—')],
              ['Status', <Badge key="drawer-status" text={String(searchResults.find((item) => item.id === selectedCaseRow)?.metadata?.status || 'ACTIVE')} kind={statusKind(String(searchResults.find((item) => item.id === selectedCaseRow)?.metadata?.status || 'ACTIVE'))} />],
              ['MO Match', searchResults.length ? 'Backend ranked' : 'High']
            ]} />
            <div style={{ marginTop: '14px' }}>
              <Btn text="Open Full Case ↗" kind="primary" onClick={() => {
                setSelectedCaseId(selectedCaseRow);
                handleScreenChange('case');
              }} />
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderCaseProfileView = () => (
    <>
      <PanelBlock label="CASE HEADER">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '16.5px', fontWeight: 700 }}>{selectedCaseNumber} — {selectedCase.case_type}</div>
            <div style={{ color: 'var(--n-500)', marginTop: '3px', fontSize: '12.5px' }}>
              {selectedCase.station_id || selectedCase.incident_address || 'Station pending'} &middot; Assigned: {selectedCase.assigned_officer_id || 'Unassigned'}
            </div>
            <div style={{ marginTop: '9px' }}>
              <Badge text={selectedCase.status} kind={statusKind(selectedCase.status)} />
            </div>
          </div>
          <div className="actions">
            <Btn text="Ask AI about this case" kind="secondary" onClick={() => handleScreenChange('workspace')} />
            <Btn text="Generate Report" kind="primary" onClick={() => void handleCreateReport()} />
          </div>
        </div>
      </PanelBlock>

      {renderTabsBlock(
        'case-tabs',
        ['Overview', 'Evidence', 'Entities', 'Timeline', 'Narrative'],
        [
          <div key="overview">
            <PanelBlock label="FACTS" head="Timeline Facts">
              <div className="list">
                {timeline.slice(0, 3).map((event) => (
                  <div className="list-item" key={event.id}><span>{shortDate(event.event_date)} — {event.description}</span><span className="source-chip">{event.event_type.replace(/_/g, ' ')}</span></div>
                ))}
              </div>
            </PanelBlock>
            <PanelBlock label="LINKED ENTITIES" head="Relationships">
              <div className="filter-bar">
                {(selectedCase.entities?.length ? selectedCase.entities : [
                  { canonical_name: 'Raju Kumar', role: 'Accused', id: 'raju-kumar', entity_type: 'PERSON' },
                  { canonical_name: 'Suresh M.', role: 'Associate', id: 'suresh-m', entity_type: 'PERSON' },
                ]).map((entity) => <Chip key={entity.id} text={`${entity.canonical_name} — ${entity.role || entity.entity_type}`} />)}
              </div>
            </PanelBlock>
          </div>,
          <PanelBlock label="EXHIBITS" head="Artifact Ledger" key="evidence">
            <Table
              headers={['Exhibit ID', 'Type', 'Status', 'Chain of Custody']}
              rows={[
                ['EX-001', 'Weapon', <Badge key="ex1" text="LOGGED" kind="success" />, 'Verified'],
                ['EX-002', 'CCTV Footage', <Badge key="ex2" text="LOGGED" kind="success" />, 'Verified'],
                ['EX-003', 'Phone CDR', <Badge key="ex3" text="PENDING FSL" kind="warning" />, '—']
              ]}
            />
          </PanelBlock>,
          <PanelBlock label="ENTITIES" head="Associated Persons / Objects" key="entities">
            <div className="filter-bar">
              {(selectedCase.entities?.length ? selectedCase.entities : [{ canonical_name: 'Raju Kumar', id: 'raju-kumar' }, { canonical_name: 'Suresh M.', id: 'suresh-m' }, { canonical_name: '9880-XXXX', id: 'phone' }]).map((entity) => <Chip key={entity.id} text={entity.canonical_name} />)}
            </div>
          </PanelBlock>,
          <PanelBlock label="TIMELINE" head="Chronological Chain" key="timeline">
            <TimelineCanvas events={timeline} zoom={100} height="170px" compact />
            <div style={{ marginTop: '12px' }}>
              <Btn text="Open Timeline ↗" kind="ghost" onClick={() => handleScreenChange('timeline')} />
            </div>
          </PanelBlock>,
          <PanelBlock label="NARRATIVE" head="Narrative Record" key="narrative">
            <div style={{ fontSize: '12.5px', color: 'var(--n-700)', lineHeight: '1.7' }}>
              {selectedCase.narrative || 'Full case narrative text renders here, sourced from the case diary and FIR, in the language it was originally recorded.'}
            </div>
          </PanelBlock>
        ]
      )}
    </>
  );

  const renderCaseProfileRight = () => (
    <>
      <PanelBlock label="QUICK STATS" head="Overview">
        <Kv rows={[
          ['Opened', shortDate(selectedCase.created_at || selectedCase.incident_date)],
          ['Days Open', selectedCase.status === 'ACTIVE' && selectedCase.created_at ? String(Math.max(1, Math.round((Date.now() - new Date(selectedCase.created_at).getTime()) / 86400000))) : '—'],
          ['Linked Entities', String(selectedCase.entities?.length || networkGraph.nodes.length - 1 || 0)],
          ['Exhibits', String(selectedCase.exhibits?.length || 0)]
        ]} />
      </PanelBlock>
      <PanelBlock label="RELATED CASES" head="Associations">
        <div className="list">
          {cases.filter((item) => item.id !== selectedCase.id).slice(0, 2).map((item) => (
            <div className="list-item" key={item.id}>{item.case_number} <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>MO match</span></div>
          ))}
        </div>
      </PanelBlock>
    </>
  );

  const renderEntityProfileView = () => (
    <>
      <PanelBlock label="IDENTITY">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '16.5px', fontWeight: 700 }}>
              {entityDetail?.canonical_name || selectedCase.entities?.[0]?.canonical_name || 'Raju Kumar'} <span style={{ fontWeight: 400, color: 'var(--n-500)', fontSize: '12.5px' }}>— {entityDetail?.entity_type || selectedCase.entities?.[0]?.entity_type || 'Person'}</span>
            </div>
            <div style={{ marginTop: '11px' }}>
              {(entityDetail?.aliases?.length ? entityDetail.aliases.map((alias) => alias.alias_text) : ['Raja K', 'Raju Sh', 'ರಾಜು ಕುಮಾರ']).map((alias) => <Chip text={alias} key={alias} />)}
            </div>
            <div style={{ marginTop: '11px', color: 'var(--n-400)', fontSize: '12px' }}>
              DOB: ░░░░░░ &middot; restricted field
            </div>
          </div>
          <div className="actions">
            <Btn text="Export Profile" kind="secondary" onClick={() => exportJson(`${(entityDetail?.canonical_name || 'entity-profile').replace(/\s+/g, '-').toLowerCase()}.json`, { entity: entityDetail, cases: entityCases, network: networkGraph })} />
          </div>
        </div>
      </PanelBlock>

      <div className="two-col">
        <div className="stack">
          <PanelBlock label="CASE HISTORY" head="Case Involvements">
            <Table
              headers={['Case No.', 'Type', 'Role', 'Date']}
              rows={(entityCases.length ? entityCases : cases).slice(0, 5).map((item) => [
                item.case_number,
                item.case_type,
                selectedCase.entities?.find((entity) => entity.id === selectedEntityId)?.role || 'Linked',
                shortDate(item.incident_date),
              ])}
            />
          </PanelBlock>
          <PanelBlock label="ASK ABOUT THIS ENTITY">
            <div className="query-bar">
              <Ic name="mic" />
              <input
                placeholder={`Ask anything about ${entityDetail?.canonical_name || 'Raju Kumar'}`}
                value={entityQuestion}
                onChange={(event) => setEntityQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleEntityQuestion(entityQuestion || `Summarize ${entityDetail?.canonical_name || 'this entity'}`);
                    setEntityQuestion('');
                  }
                }}
              />
              <span onClick={() => {
                void handleEntityQuestion(entityQuestion || `Summarize ${entityDetail?.canonical_name || 'this entity'}`);
                setEntityQuestion('');
              }}><Ic name="send" /></span>
            </div>
          </PanelBlock>
        </div>
        <div className="stack">
          <PanelBlock label="NETWORK PREVIEW" head="Mini Network">
            <NetworkCanvas graph={networkGraph} selectedNodeId={selectedEntityId} onSelect={setSelectedNodeId} height="165px" compact />
            <div style={{ marginTop: '12px' }}>
              <Btn text="Open Full Network ↗" kind="ghost" onClick={() => handleScreenChange('network')} />
            </div>
          </PanelBlock>
          <PanelBlock label="TIMELINE PREVIEW" head="Timeline Summary">
            <TimelineCanvas events={timeline} height="125px" compact />
            <div style={{ marginTop: '12px' }}>
              <Btn text="Open Full Timeline ↗" kind="ghost" onClick={() => handleScreenChange('timeline')} />
            </div>
          </PanelBlock>
        </div>
      </div>
    </>
  );

  const renderEntityProfileRight = () => (
    <PanelBlock label="RELATED" head="Direct Connections">
      <div className="list">
        {(selectedCase.entities?.filter((entity) => entity.id !== selectedEntityId).length ? selectedCase.entities.filter((entity) => entity.id !== selectedEntityId) : [
          { canonical_name: 'Suresh M.', role: 'Associate', id: 'suresh-m' },
          { canonical_name: '9880-XXXX', role: 'Shared phone', id: 'phone' },
        ]).map((entity) => (
          <div className="list-item" key={entity.id}>{entity.canonical_name} <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>{entity.role}</span></div>
        ))}
      </div>
    </PanelBlock>
  );

  const renderNetworkExplorerView = () => (
    <>
      <PanelBlock label="GRAPH TOOLBAR">
        <div className="filter-bar">
          <button className="filter-chip" onClick={() => { setNetworkQuery(''); setSelectedNodeId(''); }}><Ic name="filter" cls="ic-sm" />All nodes</button>
          <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
            <Ic name="search" />
            <input placeholder="Find node" value={networkQuery} onChange={(event) => setNetworkQuery(event.target.value)} />
          </div>
          <Btn text="Fit" kind="ghost" onClick={() => setGraphZoom(100)} />
          <Btn text="" kind="ghost" aria-label="Zoom in network" title="Zoom in" extra={<Ic name="zoomIn" cls="ic-sm" />} onClick={() => setGraphZoom((value) => Math.min(160, value + 10))} />
          <Btn text="" kind="ghost" aria-label="Zoom out network" title="Zoom out" extra={<Ic name="zoomOut" cls="ic-sm" />} onClick={() => setGraphZoom((value) => Math.max(60, value - 10))} />
          <Btn text="Export" kind="secondary" extra={<Ic name="download" cls="ic-sm" />} onClick={() => exportJson(`${selectedCaseNumber}-network.json`, networkGraph)} />
        </div>
      </PanelBlock>

      <PanelBlock label="NETWORK GRAPH">
        <NetworkCanvas
          graph={networkGraph}
          query={networkQuery}
          zoom={graphZoom}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
          height="420px"
        />
      </PanelBlock>

      <PanelBlock label="LEGEND">
        <div className="filter-bar" style={{ color: 'var(--n-500)', fontSize: '12px' }}>
          ● multiple cases &nbsp;&nbsp; — solid edge = confirmed &nbsp;&nbsp; ┄ dashed edge = inferred
        </div>
      </PanelBlock>
    </>
  );

  const renderNetworkExplorerRight = () => (
    <>
      <PanelBlock label="SELECTED NODE" head="Node Details">
        {(() => {
          const node = networkGraph.nodes.find((item) => item.data.id === selectedNodeId) || networkGraph.nodes[1] || networkGraph.nodes[0] || FALLBACK_GRAPH.nodes[1];
          return (
        <Kv rows={[
          ['Name', node.data.label],
          ['Type', node.data.type || 'Entity'],
          ['Cases', String(networkGraph.nodes.filter((item) => item.data.type === 'CASE').length || 1)],
          ['Aliases', String(entityDetail?.aliases?.length || 0)]
        ]} />
          );
        })()}
      </PanelBlock>
      <PanelBlock label="RELATIONSHIPS" head="Links Summary">
        <div className="list">
          {(networkGraph.edges.length ? networkGraph.edges : FALLBACK_GRAPH.edges).slice(0, 4).map((edge) => (
            <div className="list-item" key={edge.data.id}>{edge.data.label || 'RELATED'} <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>×1</span></div>
          ))}
        </div>
        <div style={{ marginTop: '12px' }}>
          <Btn text="View Profile ↗" kind="secondary" onClick={() => handleScreenChange('entity')} />
        </div>
      </PanelBlock>
    </>
  );

  const renderTimelineView = () => (
    <>
      <PanelBlock label="TIMELINE TOOLBAR">
        <div className="filter-bar">
          <button className="filter-chip" onClick={() => setTimelineZoom(100)}>Reset view</button>
          <Btn text="Zoom In" kind="ghost" extra={<Ic name="zoomIn" cls="ic-sm" />} onClick={() => setTimelineZoom((value) => Math.min(160, value + 10))} />
          <Btn text="Zoom Out" kind="ghost" extra={<Ic name="zoomOut" cls="ic-sm" />} onClick={() => setTimelineZoom((value) => Math.max(70, value - 10))} />
          <Btn text="Export" kind="secondary" extra={<Ic name="download" cls="ic-sm" />} onClick={() => exportJson(`${selectedCaseNumber}-timeline.json`, timeline)} />
        </div>
      </PanelBlock>

      <PanelBlock label="TIMELINE">
        <TimelineCanvas events={timeline} zoom={timelineZoom} height="280px" />
      </PanelBlock>

      <PanelBlock label="EVENTS" head="Incidents Ledger">
        <div className="list">
          {timeline.map((event) => (
            <div className="list-item" key={event.id}>
              <span>
                {event.has_conflict && <span className="conflict-flag" style={{ marginRight: '8px' }}>!</span>}
                {shortDate(event.event_date)} — {event.description}
              </span>
              <span className="source-chip">{event.event_type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </PanelBlock>
    </>
  );

  const renderTimelineRight = () => (
    <PanelBlock label="EVENT DETAIL" head="Specific Fact Info">
      {(() => {
        const event = timeline.find((item) => item.has_conflict) || timeline[0] || FALLBACK_TIMELINE[0];
        return (
      <Kv rows={[
        ['Date', shortDate(event.event_date)],
        ['Source', event.event_type.replace(/_/g, ' ')],
        ['Confidence', event.has_conflict ? 'Review needed' : 'High'],
        ['Linked Case', selectedCaseNumber]
      ]} />
        );
      })()}
    </PanelBlock>
  );

  const renderCrimeMapView = () => (
    <>
      <PanelBlock label="MAP TOOLBAR">
        <div className="filter-bar">
          <button className={`filter-chip ${mapTypeFilter === '' ? 'active' : ''}`} onClick={() => setMapTypeFilter('')}>All types</button>
          <button className={`filter-chip ${mapTypeFilter === 'Robbery' ? 'active' : ''}`} onClick={() => setMapTypeFilter('Robbery')}>Robbery</button>
          <button className={`filter-chip ${mapStatusFilter === 'ACTIVE' ? 'active' : ''}`} onClick={() => setMapStatusFilter(mapStatusFilter === 'ACTIVE' ? '' : 'ACTIVE')}>Active only</button>
          <Btn text="Refresh" kind="ghost" onClick={() => void refreshAll()} />
          <Btn text="Export" kind="secondary" extra={<Ic name="download" cls="ic-sm" />} onClick={() => exportJson('crime-map-data.json', { incidents: mapIncidents, hotspots })} />
        </div>
      </PanelBlock>

      <PanelBlock label="CRIME MAP">
        <CrimeMapCanvas
          incidents={mapIncidents}
          cases={cases}
          hotspots={hotspots}
          layers={mapLayers}
          typeFilter={mapTypeFilter}
          statusFilter={mapStatusFilter}
          height="440px"
        />
      </PanelBlock>
    </>
  );

  const renderCrimeMapRight = () => (
    <>
      <PanelBlock label="LAYER TOGGLES" head="Operational Layers">
        <div className="list">
          <div className="list-item" onClick={() => setMapLayers((prev) => ({ ...prev, incidents: !prev.incidents }))}>Incidents <span style={{ color: 'var(--n-500)' }}>{mapLayers.incidents ? 'On' : 'Off'}</span></div>
          <div className="list-item" onClick={() => setMapLayers((prev) => ({ ...prev, hotspots: !prev.hotspots }))}>Hotspots <span style={{ color: 'var(--n-500)' }}>{mapLayers.hotspots ? 'On' : 'Off'}</span></div>
          <div className="list-item" onClick={() => setMapLayers((prev) => ({ ...prev, boundaries: !prev.boundaries }))}>Station Boundaries <span style={{ color: mapLayers.boundaries ? 'var(--n-500)' : 'var(--n-400)' }}>{mapLayers.boundaries ? 'On' : 'Off'}</span></div>
        </div>
      </PanelBlock>
      <PanelBlock label="HOTSPOT ALERT">
        <div className="card-head">
          <h4>Whitefield Area</h4>
          <Badge text="HIGH" kind="critical" />
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--n-600)', marginBottom: '10px' }}>
          {hotspots.length ? `${Math.round(Math.max(...hotspots.map((item) => item.intensity)) * 100)}% hotspot intensity` : '+40% incidents this week'}
        </div>
        <Confidence n={4} labelText="High confidence" />
        <div style={{ marginTop: '12px' }}>
          <Btn text="Investigate ↗" kind="secondary" onClick={() => handleScreenChange('workspace')} />
        </div>
      </PanelBlock>
    </>
  );

  const renderReportsView = () => (
    <>
      <PanelBlock label="REPORT ACTIONS">
        <div className="filter-bar">
          <Btn text="New Report" kind="primary" extra={<Ic name="plus" cls="ic-sm" />} onClick={() => void handleCreateReport()} />
          <Btn text="Refresh" kind="ghost" onClick={() => void refreshAll()} />
          <Btn text="Export List" kind="secondary" extra={<Ic name="download" cls="ic-sm" />} onClick={() => exportJson('reports.json', reports)} />
        </div>
      </PanelBlock>
      <PanelBlock label="REPORTS">
        <Table
          headers={['Title', 'Case No.', 'Status', 'Created By', 'Date', '']}
          rows={(reports.length ? reports : [
            { id: 'fallback-report-1', title: 'Cross-case MO summary', case_id: selectedCase.id, status: 'GENERATED', created_by: currentUser?.full_name || 'S. Ravi Kumar', created_at: '2026-07-02' },
            { id: 'fallback-report-2', title: 'Network analysis brief', case_id: selectedCase.id, status: 'DRAFT', created_by: currentUser?.full_name || 'S. Ravi Kumar', created_at: '2026-07-01' },
          ]).map((report) => [
            report.title,
            cases.find((item) => item.id === report.case_id)?.case_number || selectedCaseNumber,
            <Badge key={`${report.id}-status`} text={report.status} kind={statusKind(report.status)} />,
            report.created_by || currentUser?.full_name || '—',
            shortDate(report.created_at),
            <Btn key={`${report.id}-action`} text={report.status === 'DRAFT' ? 'Continue' : 'Download'} kind="ghost" extra={report.status === 'DRAFT' ? undefined : <Ic name="download" cls="ic-sm" />} onClick={() => report.status === 'DRAFT' ? handleScreenChange('workspace') : void handleReportDownload(report)} />
          ])}
        />
        <Pagination text={`Showing 1–${Math.max(1, reports.length || 2)} of ${Math.max(1, reports.length || 2)} reports`} />
      </PanelBlock>
    </>
  );

  const renderReportsRight = () => (
    <PanelBlock label="IN PROGRESS" head="Active Generation">
      <div style={{ fontSize: '12.5px', color: 'var(--n-600)', marginBottom: '12px' }}>
        {(reports.find((report) => report.status === 'DRAFT')?.title || 'Network analysis brief')} — compiling sourced findings&hellip;
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--n-200)', overflow: 'hidden' }}>
        <div style={{ width: '62%', height: '100%', background: 'var(--navy-600)' }}></div>
      </div>
    </PanelBlock>
  );

  const renderAlertsView = () => {
    const alertRows = (alerts.length ? alerts : [
      { id: 'fallback-alert-1', alert_type: 'HOTSPOT', severity: 'HIGH', title: 'Hotspot threshold crossed — Whitefield', description: '+40% incidents vs. 4-week baseline', confidence_tier: 'High' },
      { id: 'fallback-alert-2', alert_type: 'PATTERN', severity: 'MEDIUM', title: 'Pattern spike — cross-case MO match', description: '3 cases matched in 14 days', confidence_tier: 'Moderate' },
    ]).filter((alert) => !alertSeverityFilter || alert.severity === alertSeverityFilter);

    return (
      <>
        <PanelBlock label="FILTERS">
          <div className="filter-bar">
            <button className={`filter-chip ${alertSeverityFilter === '' ? 'active' : ''}`} onClick={() => setAlertSeverityFilter('')}>All severity</button>
            <button className={`filter-chip ${alertSeverityFilter === 'HIGH' ? 'active' : ''}`} onClick={() => setAlertSeverityFilter('HIGH')}>High</button>
            <button className={`filter-chip ${alertSeverityFilter === 'MEDIUM' ? 'active' : ''}`} onClick={() => setAlertSeverityFilter('MEDIUM')}>Medium</button>
            <Btn text="Refresh" kind="ghost" onClick={() => void refreshAll()} />
          </div>
        </PanelBlock>
        {alertRows.map((alert) => (
          <div className="card" key={alert.id}>
            <div className="card-head">
              <h4>{alert.title}</h4>
              <Badge text={alert.severity} kind={statusKind(alert.severity)} />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--n-600)', marginBottom: '9px' }}>
              {alert.description || alert.alert_type}
            </div>
            <Confidence n={confidenceDots(alert.confidence_tier)} />
            <div style={{ marginTop: '10px' }}>
              <Btn text={alert.acknowledged_at ? 'Acknowledged' : 'Acknowledge'} kind="ghost" disabled={!!alert.acknowledged_at} onClick={async () => {
                if (alert.id.startsWith('fallback')) {
                  setToast('Fallback alert acknowledged locally');
                  return;
                }
                const updated = await api.acknowledgeAlert(alert.id);
                setAlerts((prev) => prev.map((item) => item.id === alert.id ? updated : item));
                setToast('Alert acknowledged');
              }} />
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderAlertsRight = () => (
    <>
      <PanelBlock label="BASIS" head="Detection Parameters">
        <div style={{ fontSize: '12.5px', color: 'var(--n-600)', lineHeight: '1.6' }}>
          Aggregate incident count in a 2km radius exceeded the configured graduated threshold for a sustained 7-day window.
        </div>
      </PanelBlock>
      <PanelBlock label="RELATED CASES" head="Involved Narratives">
        <div className="list">
          <div className="list-item">CR-2024-04471</div>
          <div className="list-item">CR-2024-03107</div>
        </div>
      </PanelBlock>
    </>
  );

  const renderAdminView = () => {
    const users = adminUsers.length ? adminUsers : [
      { id: 'fallback-u1', full_name: 'S. Ravi Kumar', badge_number: 'KSP-44210', role: 'SI', rank: 'SI', station_id: 'Koramangala PS', district_id: null },
      { id: 'fallback-u2', full_name: 'A. Prakash', badge_number: 'KSP-33019', role: 'INSPECTOR', rank: 'INSPECTOR', station_id: 'Whitefield PS', district_id: null },
      { id: 'fallback-u3', full_name: 'M. Lakshmi', badge_number: 'KSP-51002', role: 'ANALYST', rank: 'ANALYST', station_id: 'SCRB', district_id: null },
    ] as ApiUser[];
    const auditRows = auditEvents.length ? auditEvents : [
      { id: 'fallback-a1', created_at: '2026-07-02T14:02:00Z', user_id: 'S. Ravi Kumar', event_type: 'QUERY', action: 'Cross-case MO similarity check' },
      { id: 'fallback-a2', created_at: '2026-07-02T14:02:00Z', user_id: 'System', event_type: 'RESPONSE', action: 'Logged' },
    ] as AuditEvent[];

    return renderTabsBlock(
      'admin-tabs',
      ['Users', 'Roles & Access', 'Audit Log'],
      [
        <div key="users">
          <PanelBlock label="USER MANAGEMENT">
            <Table
              headers={['Name', 'Badge No.', 'Role', 'Station', 'Status', '']}
              rows={users.map((user) => [
                user.full_name,
                user.badge_number,
                <Badge key={`${user.id}-role`} text={user.role} kind="neutral" />,
                user.station_id || user.district_id || '—',
                <Badge key={`${user.id}-status`} text="ACTIVE" kind="success" />,
                <Btn key={`${user.id}-edit`} text="Edit" kind="ghost" onClick={() => user.id.startsWith('fallback') ? setToast('Login as ADMIN to edit live users') : void handleEditUser(user)} />
              ])}
            />
          </PanelBlock>
          <div style={{ marginTop: '14px' }}>
            <Btn text="Add User" kind="primary" extra={<Ic name="plus" cls="ic-sm" />} onClick={() => void handleAddUser()} />
          </div>
        </div>,
        <PanelBlock label="ROLE DEFINITIONS" key="roles">
          <div className="list">
            <div className="list-item">SI <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>Case-level access</span></div>
            <div className="list-item">Inspector <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>Station-level access</span></div>
            <div className="list-item">Analyst <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>Cross-case access</span></div>
            <div className="list-item">Auditor <span style={{ color: 'var(--n-500)', fontSize: '11.5px' }}>Log access only</span></div>
          </div>
        </PanelBlock>,
        <PanelBlock label="AUDIT LOG" key="logs">
          <Table
            headers={['Timestamp', 'User', 'Event', 'Detail']}
            rows={auditRows.map((event) => [
              shortDate(event.created_at || event.timestamp),
              event.user_id || 'System',
              event.event_type,
              event.action || event.resource_type || <Badge key={`${event.id}-logged`} text="LOGGED" kind="success" />
            ])}
          />
        </PanelBlock>
      ]
    );
  };

  const renderAdminRight = () => (
    <PanelBlock label="QUICK REFERENCE" head="Role Summary">
      <div className="list">
        <div className="list-item">4 roles configured</div>
        <div className="list-item">12 active users</div>
      </div>
    </PanelBlock>
  );

  const renderSettingsView = () => (
    <>
      <PanelBlock label="LANGUAGE PREFERENCE">
        <div className="field">
          <label>Default Language</label>
          <select className="input" value={settings.language} onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}>
            <option>English</option>
            <option>ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>
      </PanelBlock>
      <PanelBlock label="DISPLAY DENSITY">
        <div className="field">
          <label>Table &amp; List Density</label>
          <select className="input" value={settings.density} onChange={(event) => setSettings((prev) => ({ ...prev, density: event.target.value }))}>
            <option>Comfortable</option>
            <option>Compact</option>
          </select>
        </div>
      </PanelBlock>
      <PanelBlock label="NOTIFICATION PREFERENCES">
        <div className="list">
          <div className="list-item" onClick={() => setSettings((prev) => ({ ...prev, hotspotAlerts: !prev.hotspotAlerts }))}>Hotspot alerts <span style={{ color: 'var(--n-500)' }}>{settings.hotspotAlerts ? 'On' : 'Off'}</span></div>
          <div className="list-item" onClick={() => setSettings((prev) => ({ ...prev, matchAlerts: !prev.matchAlerts }))}>New cross-case matches <span style={{ color: 'var(--n-500)' }}>{settings.matchAlerts ? 'On' : 'Off'}</span></div>
          <div className="list-item">Current API <span style={{ color: 'var(--n-500)' }}>{apiStatus === 'ready' ? 'Connected' : apiStatus}</span></div>
        </div>
      </PanelBlock>
      <div className="filter-bar">
        <Btn text="Save Changes" kind="primary" onClick={handleSaveSettings} />
        <Btn text="Sign Out" kind="secondary" onClick={handleLogout} />
      </div>
    </>
  );

  // Selector for current view
  const renderScreenContent = () => {
    switch (currentScreen) {
      case 'login':
        return renderLoginView();
      case 'workspace':
        return renderWorkspaceView();
      case 'search':
        return renderSearchView();
      case 'case':
        return renderCaseProfileView();
      case 'entity':
        return renderEntityProfileView();
      case 'network':
        return renderNetworkExplorerView();
      case 'timeline':
        return renderTimelineView();
      case 'map':
        return renderCrimeMapView();
      case 'reports':
        return renderReportsView();
      case 'alerts':
        return renderAlertsView();
      case 'admin':
        return renderAdminView();
      case 'settings':
        return renderSettingsView();
      default:
        return getStoredToken() ? renderWorkspaceView() : renderLoginView();
    }
  };

  // Selector for current view's right panel
  const renderScreenRightPanel = () => {
    switch (currentScreen) {
      case 'workspace':
        return renderWorkspaceRight();
      case 'case':
        return renderCaseProfileRight();
      case 'entity':
        return renderEntityProfileRight();
      case 'network':
        return renderNetworkExplorerRight();
      case 'timeline':
        return renderTimelineRight();
      case 'map':
        return renderCrimeMapRight();
      case 'reports':
        return renderReportsRight();
      case 'alerts':
        return renderAlertsRight();
      case 'admin':
        return renderAdminRight();
      default:
        return null;
    }
  };

  const getScreenConfig = (): ScreenConfig => {
    return SCREENS.find(s => s.key === currentScreen) || SCREENS[0];
  };

  const activeConf = getScreenConfig();
  const hasRightPanel = !!renderScreenRightPanel();

  /* ============================================================
     LAYOUT BUILDERS
     ============================================================ */
  const renderHeader = (caseLabel: string | null | undefined) => {
    return (
      <header className="app-header">
        <div className="hamburger" onClick={() => setNavOpen(!navOpen)}>
          <Ic name="menu" />
        </div>
        <div className="brand" onClick={() => handleScreenChange('workspace')} style={{ cursor: 'pointer' }}>
          <img className="crest" src={CREST_SRC} alt="Karnataka State Police crest" />
          <div className="brand-text">
            <span className="brand-name">KSP Crime Intelligence Platform</span>
            <span className="brand-sub">Karnataka State Police &middot; SCRB</span>
          </div>
        </div>
        <div className="header-divider"></div>
        <div className="case-selector" onClick={() => handleScreenChange('search')}>
          <Ic name="search" cls="ic-sm" />
          <span className="case-text">{caseLabel || 'No case selected'}</span>
          <Ic name="chevronDown" cls="ic-sm" />
        </div>
        <div className="header-spacer"></div>
        <div className="header-right">
          <div className="lang-select">
            <Ic name="globe" cls="ic-sm" />
            <span className="lang-text">EN&nbsp;/&nbsp;<span className="kn">ಕನ</span></span>
            <Ic name="chevronDown" cls="ic-sm" />
          </div>
          {hasRightPanel && (
            <div className="icon-btn panel-toggle-header" style={{ display: 'none' }} onClick={() => setPanelOpen(!panelOpen)}>
              <Ic name="panel" />
            </div>
          )}
          <div className="icon-btn" onClick={() => handleScreenChange('alerts')}>
            <Ic name="bell" />
            <span className="badge-dot">3</span>
          </div>
          <div className="profile-menu" onClick={() => handleScreenChange('settings')}>
            <span className="avatar">{(currentUser?.full_name || 'S. Ravi Kumar').split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
            <span className="who">
              {currentUser?.full_name || 'S. Ravi Kumar'}<b>{currentUser?.rank || currentUser?.role || 'Sub-Inspector'}</b>
            </span>
            <Ic name="chevronDown" cls="ic-sm" />
          </div>
        </div>
      </header>
    );
  };

  const renderNav = (activeNav: string | undefined) => {
    return (
      <nav className={`app-nav ${navOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map((n, idx) => (
          <div
            key={idx}
            className={`nav-item ${n.id === activeNav ? 'active' : ''}`}
            title={n.label}
            onClick={() => handleScreenChange(n.id)}
          >
            <span className="icon-slot"><Ic name={n.icon} /></span>
            <span>{n.label}</span>
          </div>
        ))}
      </nav>
    );
  };

  const breadcrumbHtml = activeConf.breadcrumb ? (
    <div className="breadcrumb">
      {activeConf.breadcrumb.map((b, idx, arr) => (
        <span key={idx}>
          {idx === arr.length - 1 ? <b>{b}</b> : <>{b}<span className="sep"><Ic name="chevronRight" cls="ic-sm" /></span></>}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div>
      {/* Main App Container */}
      <div id="root">
        {activeConf.shell ? (
          <div className="app-shell">
            {renderHeader(selectedCaseNumber)}
            <div className="app-body">
              <div className={`scrim ${navOpen || panelOpen ? 'show' : ''}`} onClick={closeOverlays}></div>
              {renderNav(activeConf.activeNav)}
              <main className="app-main">
                {!activeConf.hideHead && (
                  <div className="page-head">
                    <div>
                      {breadcrumbHtml}
                      <h1>{activeConf.title}</h1>
                      {activeConf.subtitle && <p>{activeConf.subtitle}</p>}
                    </div>
                    {activeConf.actions && (
                      <div className="actions">
                        {activeConf.actions.map((a, i) => (
                          <Btn key={i} text={a.text} kind={a.kind} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {renderScreenContent()}
              </main>
              {hasRightPanel && (
                <aside className={`app-panel ${panelOpen ? 'open' : ''}`}>
                  <div className="panel-title">
                    <h3>{currentScreen === 'workspace' ? 'Case Context Panel' : currentScreen === 'case' ? 'Case Stats' : currentScreen === 'entity' ? 'Related Entities' : currentScreen === 'network' ? 'Node Detail' : currentScreen === 'timeline' ? 'Selected Event' : currentScreen === 'map' ? 'Map Layers' : currentScreen === 'reports' ? 'Generation Status' : currentScreen === 'alerts' ? 'Alert Detail' : currentScreen === 'admin' ? 'Role Legend' : 'Panel'}</h3>
                    <span className="panel-close" onClick={() => setPanelOpen(false)}>
                      <Ic name="x" cls="ic-sm" />
                    </span>
                  </div>
                  {renderScreenRightPanel()}
                </aside>
              )}
            </div>
          </div>
        ) : (
          renderScreenContent()
        )}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
