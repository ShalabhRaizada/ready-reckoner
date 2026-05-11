/* App — main entry */
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useRef: useRefA, useCallback: useCallbackA } = React;

const STORAGE_KEY = 'rr.records.v1';
const USER_KEY = 'rr.user.v1';

function uid() {
  return 'r_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function persistRecords(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (e) {}
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function persistUser(u) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch (e) {}
}

/* Seed once */
async function fetchSeed() {
  try {
    const r = await fetch('seed-data.json');
    if (!r.ok) return [];
    const data = await r.json();
    const now = new Date();
    return data.map((rec, i) => {
      const t = new Date(now.getTime() - (data.length - i) * 1000 * 60 * 60 * 6).toISOString();
      const seedUser = SEED_USERS[i % SEED_USERS.length];
      return {
        ...rec,
        id: uid(),
        createdAt: t,
        createdBy: seedUser.name,
        updatedAt: t,
        updatedBy: seedUser.name,
      };
    });
  } catch (e) {
    return [];
  }
}

/* ───────────────── Import view ─────────────── */
function ImportView({ onImport, currentUser, pushToast, recordsCount }) {
  const [drag, setDrag] = useStateA(false);
  const [preview, setPreview] = useStateA(null); // { records, filename }
  const [mode, setMode] = useStateA('append'); // append | replace
  const inputRef = useRefA(null);

  const onFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const records = await window.ExcelIO.parseFile(file);
      setPreview({ records, filename: file.name });
    } catch (e) {
      console.error(e);
      pushToast({ kind: 'error', msg: `Could not parse "${file.name}": ${e.message}` });
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onImport(preview.records, mode);
    pushToast({ kind: 'success', msg: `Imported ${preview.records.length} records (${mode === 'replace' ? 'replaced' : 'appended'})` });
    setPreview(null);
  };

  return (
    <div className="import-pane">
      <div className="import-card">
        <div className="import-card-head">
          <h3>Import an Excel spreadsheet</h3>
          <p>Drop a .xlsx file matching the Ready Reckoner schema. Records will be tagged with your user id and timestamp.</p>
        </div>
        <div className="import-card-body">
          <div
            className={`dropzone ${drag ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <Icon.Upload width="28" height="28"/>
            <h4>Drop Ready_Reckoner.xlsx here</h4>
            <p>or click to browse · .xlsx, .xls</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => onFiles(e.target.files)} />
          </div>

          {preview && (
            <div className="import-preview">
              <h4>Preview · {preview.filename}</h4>
              <div className="import-summary">
                <div className="stat">
                  <div className="stat-label">Forward lanes</div>
                  <div className="stat-val">{preview.records.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Return priorities</div>
                  <div className="stat-val">{preview.records.reduce((a, r) => a + (r.returns?.length || 0), 0)}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Unique customers</div>
                  <div className="stat-val">{new Set(preview.records.map(r => r.forward?.customer).filter(Boolean)).size}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="mode" checked={mode === 'append'} onChange={() => setMode('append')} />
                  Append to existing ({recordsCount} records)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                  Replace all existing
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setPreview(null)}>Discard</button>
                <button className="btn btn-primary" onClick={handleConfirm}><Icon.Check/> Confirm import</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="import-card">
        <div className="import-card-head">
          <h3>Expected schema</h3>
          <p>Two row headers: <i>Forward Lane (Customer Origin)</i> spanning A–G, <i>Return Lane (Backhaul)</i> spanning H–P.</p>
        </div>
        <div className="import-card-body">
          <div className="schema-grid">
            <div className="schema-col">
              <h5 className="fwd">Forward Lane · columns A–G</h5>
              <ul className="schema-list">
                {window.ExcelIO.FWD_COLS.map((c, i) => (
                  <li key={c.key}><span>{c.label}</span><span className="col-letter">{String.fromCharCode(65 + i)}</span></li>
                ))}
              </ul>
            </div>
            <div className="schema-col">
              <h5 className="ret">Return Lane · columns H–P</h5>
              <ul className="schema-list">
                {window.ExcelIO.RET_COLS.map((c, i) => (
                  <li key={c.key}><span>{c.label}</span><span className="col-letter">{String.fromCharCode(72 + i)}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-mut)' }}>
            Multiple return rows can share one forward lane — leave A–G blank to continue the previous forward lane (same as the original sheet).
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── App ─────────────── */
function App() {
  const [user, setUser] = useStateA(() => loadUser());
  const [records, setRecords] = useStateA(null); // null = not loaded yet
  const [tab, setTab] = useStateA('records');
  const [query, setQuery] = useStateA('');
  const [editing, setEditing] = useStateA(null); // { record, isNew }
  const [toasts, setToasts] = useStateA([]);
  const toastIdRef = useRefA(0);

  // Bootstrap records
  useEffectA(() => {
    (async () => {
      const stored = loadRecords();
      if (stored && stored.length) {
        setRecords(stored);
        return;
      }
      const seed = await fetchSeed();
      setRecords(seed);
      persistRecords(seed);
    })();
  }, []);

  // Persist on change
  useEffectA(() => {
    if (records) persistRecords(records);
  }, [records]);

  const pushToast = useCallbackA((t) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 2800);
  }, []);

  if (!user) {
    return <LoginModal onLogin={(u) => { setUser(u); persistUser(u); }} />;
  }

  if (records === null) {
    return <div style={{ padding: 40, color: 'var(--text-mut)' }}>Loading…</div>;
  }

  const handleSave = (payload) => {
    const now = new Date().toISOString();
    if (editing.isNew) {
      const rec = {
        ...payload,
        id: uid(),
        createdAt: now,
        createdBy: user.name,
        createdById: user.id,
        updatedAt: now,
        updatedBy: user.name,
        updatedById: user.id,
      };
      setRecords(prev => [rec, ...prev]);
      pushToast({ kind: 'success', msg: `Created record for ${rec.forward.customer}` });
    } else {
      setRecords(prev => prev.map(r => r.id === editing.record.id
        ? { ...r, ...payload, updatedAt: now, updatedBy: user.name, updatedById: user.id }
        : r));
      pushToast({ kind: 'success', msg: `Saved changes to ${payload.forward.customer}` });
    }
    setEditing(null);
  };

  const handleDelete = (rec) => {
    setRecords(prev => prev.filter(r => r.id !== rec.id));
    pushToast({ kind: 'success', msg: `Deleted ${rec.forward.customer}` });
  };

  const handleExport = () => {
    const filename = `Ready_Reckoner_${new Date().toISOString().slice(0,10)}.xlsx`;
    window.ExcelIO.exportRecords(records, filename);
    pushToast({ kind: 'success', msg: `Exported ${records.length} records → ${filename}` });
  };

  const handleImport = (incoming, mode) => {
    const now = new Date().toISOString();
    const stamped = incoming.map(rec => ({
      ...rec,
      id: uid(),
      createdAt: now,
      createdBy: user.name,
      createdById: user.id,
      updatedAt: now,
      updatedBy: user.name,
      updatedById: user.id,
      _imported: true,
    }));
    if (mode === 'replace') setRecords(stamped);
    else setRecords(prev => [...stamped, ...prev]);
    setTab('records');
  };

  const totalReturns = records.reduce((a, r) => a + (r.returns?.length || 0), 0);
  const uniqCust = new Set(records.map(r => r.forward?.customer).filter(Boolean)).size;
  const avgYield = (() => {
    const ys = records.map(r => r.forward?.yieldPct).filter(v => v != null && v !== '');
    if (!ys.length) return null;
    return ys.reduce((a, b) => a + +b, 0) / ys.length;
  })();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">RR</div>
          <div>
            <div className="brand-name">Ready Reckoner</div>
            <div className="brand-sub">Lane Yield Tracker</div>
          </div>
        </div>
        <div className="topbar-divider"/>
        <nav className="topbar-tabs">
          <button className={`tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>
            Records <span className="tab-count">{records.length}</span>
          </button>
          <button className={`tab ${tab === 'import' ? 'active' : ''}`} onClick={() => setTab('import')}>
            Import / Export
          </button>
        </nav>
        <button className="user-pill" onClick={() => {
          if (confirm(`Sign out ${user.name}?`)) { localStorage.removeItem(USER_KEY); setUser(null); }
        }}>
          <div className="user-avatar">{initials(user.name)}</div>
          <span className="user-name">{user.name}</span>
          <span className="user-role">· {user.role}</span>
        </button>
      </header>

      <main className="main">
        {tab === 'records' && (
          <>
            <div className="actionbar">
              <div className="stat-group">
                <div className="stat">
                  <span className="stat-label">Forward lanes</span>
                  <span className="stat-val">{records.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Return priorities</span>
                  <span className="stat-val">{totalReturns}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Customers</span>
                  <span className="stat-val">{uniqCust}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg forward yield</span>
                  <span className="stat-val">{avgYield != null ? avgYield.toFixed(1) : '—'}<span className="unit">%</span></span>
                </div>
              </div>
              <div className="search-input">
                <Icon.Search/>
                <input placeholder="Search customer, lane, priority…" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <button className="btn" onClick={handleExport}><Icon.Download/> Export .xlsx</button>
              <button className="btn btn-primary" onClick={() => setEditing({ record: null, isNew: true })}>
                <Icon.Plus/> New record
              </button>
            </div>
            <RecordsTable
              records={records}
              onEdit={(r) => setEditing({ record: r, isNew: false })}
              onDelete={handleDelete}
              onAdd={() => setEditing({ record: null, isNew: true })}
              query={query}
            />
          </>
        )}
        {tab === 'import' && (
          <ImportView
            onImport={handleImport}
            currentUser={user}
            pushToast={pushToast}
            recordsCount={records.length}
          />
        )}
      </main>

      {editing && (
        <RecordFormDrawer
          initial={editing.record}
          isNew={editing.isNew}
          currentUser={user}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      <ToastStack toasts={toasts}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
