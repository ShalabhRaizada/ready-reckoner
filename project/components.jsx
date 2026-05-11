/* Components: icons, table, return rows, etc. */
const { useState, useMemo, useRef, useEffect, useCallback } = React;

/* ───────────────── icons (inline SVG) ─────────────── */
const Icon = {
  Chevron: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Plus: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Search: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  Edit: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  Trash: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  ),
  Upload: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  ),
  Download: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  X: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  File: (p) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
  ),
  Drag: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
  ),
  Check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>
  ),
};

/* ───────────────── formatters ─────────────── */
const fmt = {
  num(v, dp = 0) {
    if (v === null || v === undefined || v === '') return '—';
    const n = +v;
    if (isNaN(n)) return String(v);
    return n.toLocaleString('en-IN', { maximumFractionDigits: dp, minimumFractionDigits: dp });
  },
  pct(v) {
    if (v === null || v === undefined || v === '') return null;
    return +v;
  },
  range(min, max) {
    if (!min && !max) return '—';
    if (min == null) return `≤ ${fmt.num(max)}`;
    if (max == null) return `≥ ${fmt.num(min)}`;
    if (+min === +max) return fmt.num(min);
    return `${fmt.num(min)} – ${fmt.num(max)}`;
  },
  date(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  dateShort(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  },
};

function yieldTone(v) {
  if (v == null) return 'mid';
  if (v >= 78) return 'high';
  if (v >= 68) return 'mid';
  return 'low';
}

function YieldChip({ value }) {
  if (value == null || value === '') return <span className="num">—</span>;
  return (
    <span className={`yield-chip ${yieldTone(value)}`}>
      <span className="mono">{(+value).toFixed(1)}</span><span className="pct">%</span>
    </span>
  );
}

function PriBadge({ p }) {
  const k = String(p || '').toLowerCase();
  return <span className={`pri-badge ${k}`}>{p || '–'}</span>;
}

/* ───────────────── records table ─────────────── */
function RecordsTable({ records, onEdit, onDelete, onAdd, query }) {
  const [expanded, setExpanded] = useState(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => {
      const hay = [
        r.forward?.customer, r.forward?.lane,
        ...(r.returns || []).flatMap(x => [x.returnCustomer, x.lane, x.priority])
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [records, query]);

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (!records.length) {
    return (
      <div className="empty">
        <Icon.File />
        <h3>No records yet</h3>
        <p>Add a record or import an existing Ready Reckoner spreadsheet.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onAdd}><Icon.Plus/> New record</button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="records-table">
        <thead>
          <tr>
            <th colSpan="4" className="group-fwd" style={{ borderBottom: '1px solid var(--border-soft)' }}>Forward Lane — Customer Origin</th>
            <th colSpan="3" className="group-ret" style={{ borderBottom: '1px solid var(--border-soft)' }}>Return Lane summary</th>
            <th></th>
          </tr>
          <tr>
            <th>Customer / Lane</th>
            <th className="num">Feb Load</th>
            <th className="num">Distance</th>
            <th className="num">Yield</th>
            <th>Priorities</th>
            <th className="num">Top blend</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((rec) => {
            const isOpen = expanded.has(rec.id);
            const topBlend = (rec.returns || []).reduce((b, r) => r.blend != null && (b == null || r.blend > b) ? r.blend : b, null);
            return (
              <React.Fragment key={rec.id}>
                <tr className={`fwd-row ${isOpen ? 'expanded' : ''}`} onClick={() => toggle(rec.id)}>
                  <td>
                    <div className="fwd-customer">
                      <span className="chevron"><Icon.Chevron /></span>
                      <div className="fwd-customer-text">
                        <div className="fwd-customer-name">{rec.forward.customer || '—'}</div>
                        <div className="fwd-lane">{rec.forward.lane || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num num-strong">{fmt.num(rec.forward.febLoad)}</td>
                  <td className="num range-cell">
                    <div>{fmt.num(rec.forward.distanceKms)} <span style={{ color: 'var(--text-faint)' }}>km</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmt.range(rec.forward.minKms, rec.forward.maxKms)}</div>
                  </td>
                  <td className="num"><YieldChip value={rec.forward.yieldPct} /></td>
                  <td>
                    <span className="priority-count">{(rec.returns || []).length} priorit{(rec.returns || []).length === 1 ? 'y' : 'ies'}</span>
                  </td>
                  <td className="num"><YieldChip value={topBlend} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-mut)' }}>
                    <div>{fmt.dateShort(rec.updatedAt || rec.createdAt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>by {rec.updatedBy || rec.createdBy || '—'}</div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(rec); }} title="Edit"><Icon.Edit/> Edit</button>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete record for ${rec.forward.customer}?`)) onDelete(rec); }} title="Delete"><Icon.Trash/></button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="returns-wrap">
                    <td colSpan="8">
                      <div className="returns-inner">
                        <ReturnsTable returns={rec.returns || []} />
                        <div className="meta-row">
                          <span><b>Created</b> {fmt.date(rec.createdAt)} · <b>by</b> {rec.createdBy || '—'}</span>
                          {rec.updatedAt && rec.updatedAt !== rec.createdAt && (
                            <span><b>Updated</b> {fmt.date(rec.updatedAt)} · <b>by</b> {rec.updatedBy || '—'}</span>
                          )}
                          <span style={{ marginLeft: 'auto', fontFamily: 'Geist Mono, monospace', color: 'var(--text-faint)' }}>#{rec.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="empty">
          <p>No records match “{query}”.</p>
        </div>
      )}
    </div>
  );
}

function ReturnsTable({ returns }) {
  if (!returns.length) {
    return <div style={{ color: 'var(--text-mut)', fontSize: 12, padding: '8px 4px' }}>No return priorities defined.</div>;
  }
  return (
    <table className="returns-table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>Pri</th>
          <th>Return Customer</th>
          <th>Lane</th>
          <th className="num">Monthly Load</th>
          <th className="num">Loaded</th>
          <th className="num">Empty</th>
          <th className="num">Total KMS</th>
          <th className="num">Yield</th>
          <th className="num">Blend</th>
        </tr>
      </thead>
      <tbody>
        {returns.map((r, i) => (
          <tr key={i}>
            <td><PriBadge p={r.priority}/></td>
            <td style={{ fontWeight: 500 }}>{r.returnCustomer || '—'}</td>
            <td style={{ color: 'var(--text-mid)' }}>{r.lane || '—'}</td>
            <td className="num">{fmt.num(r.monthlyLoad)} <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>MT</span></td>
            <td className="num">{fmt.num(r.distanceLoaded)}</td>
            <td className="num">{fmt.num(r.distanceEmpty)}</td>
            <td className="num num-strong">{fmt.num(r.totalDistance)}</td>
            <td className="num"><YieldChip value={r.yieldPct} /></td>
            <td className="num"><YieldChip value={r.blend} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ───────────────── login / user picker ─────────────── */
const SEED_USERS = [
  { id: 'u-rashmi',  name: 'Rashmi Bhat',   role: 'Logistics Manager' },
  { id: 'u-arjun',   name: 'Arjun Mehra',   role: 'Yield Analyst' },
  { id: 'u-priya',   name: 'Priya Iyer',    role: 'Ops Lead' },
  { id: 'u-vikram',  name: 'Vikram Shah',   role: 'Regional Head' },
];

function initials(name) {
  return (name || '').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
}

function LoginModal({ onLogin }) {
  const [selected, setSelected] = useState(SEED_USERS[0].id);
  const [custom, setCustom] = useState('');
  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">RR</div>
          <div>
            <div className="brand-name">Ready Reckoner</div>
            <div className="brand-sub">Lane Yield Tracker</div>
          </div>
        </div>
        <h2>Sign in to continue</h2>
        <p>Pick a profile to track who creates and edits records.</p>
        <div className="user-picker">
          {SEED_USERS.map(u => (
            <div key={u.id} className={`user-option ${selected === u.id ? 'selected' : ''}`} onClick={() => { setSelected(u.id); setCustom(''); }}>
              <div className="user-avatar">{initials(u.name)}</div>
              <div className="user-option-meta">
                <div className="user-option-name">{u.name}</div>
                <div className="user-option-role">{u.role}</div>
              </div>
              {selected === u.id && !custom && <div style={{ marginLeft: 'auto', color: 'var(--primary)' }}><Icon.Check/></div>}
            </div>
          ))}
        </div>
        <div className="field">
          <label>Or enter your name <span className="hint">(custom user id)</span></label>
          <input type="text" placeholder="e.g. Aman Verma" value={custom} onChange={e => { setCustom(e.target.value); setSelected(''); }} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
          onClick={() => {
            if (custom.trim()) {
              const u = { id: 'u-' + custom.trim().toLowerCase().replace(/\s+/g, '-'), name: custom.trim(), role: 'User' };
              onLogin(u);
            } else {
              onLogin(SEED_USERS.find(x => x.id === selected));
            }
          }}>
          Continue
        </button>
      </div>
    </div>
  );
}

/* ───────────────── toast ─────────────── */
function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind || ''}`}>
          {t.kind === 'success' && <Icon.Check />}
          {t.kind === 'error' && <Icon.X />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Icon, fmt, yieldTone, YieldChip, PriBadge,
  RecordsTable, ReturnsTable,
  LoginModal, ToastStack,
  SEED_USERS, initials,
});
