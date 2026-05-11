/* RecordFormDrawer — create/edit a record */
const { useState: useStateF, useEffect: useEffectF, useMemo: useMemoF, useRef: useRefF } = React;

function emptyReturn(priority) {
  return {
    priority: priority || 'P1',
    returnCustomer: '',
    lane: '',
    monthlyLoad: '',
    distanceLoaded: '',
    distanceEmpty: '',
    totalDistance: '',
    yieldPct: '',
    blend: '',
  };
}

function emptyRecord() {
  return {
    forward: {
      customer: '',
      lane: '',
      febLoad: '',
      distanceKms: '',
      yieldPct: '',
      minKms: '',
      maxKms: '',
    },
    returns: [emptyReturn('P1')],
  };
}

function NumInput({ value, onChange, placeholder, suffix, step }) {
  return (
    <div className={'field-suffix' + (suffix ? '' : '')}>
      <input
        type="number"
        className="num"
        value={value ?? ''}
        step={step || 'any'}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value === '' ? '' : +e.target.value)}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  );
}

function RecordFormDrawer({ initial, isNew, onSave, onCancel, currentUser }) {
  const [rec, setRec] = useStateF(() => {
    if (initial) return JSON.parse(JSON.stringify(initial));
    return emptyRecord();
  });

  const setF = (key, val) => setRec(r => ({ ...r, forward: { ...r.forward, [key]: val } }));
  const setR = (i, key, val) => setRec(r => ({
    ...r,
    returns: r.returns.map((x, idx) => idx === i ? { ...x, [key]: val } : x),
  }));

  // auto-fill total distance if loaded+empty present and total missing/derived
  useEffectF(() => {
    setRec(r => ({
      ...r,
      returns: r.returns.map(ret => {
        const l = +ret.distanceLoaded || 0;
        const e = +ret.distanceEmpty || 0;
        if (ret.distanceLoaded !== '' && ret.distanceEmpty !== '' && (ret.totalDistance === '' || +ret.totalDistance === (l + e) || ret._autoTotal)) {
          return { ...ret, totalDistance: l + e, _autoTotal: true };
        }
        return ret;
      }),
    }));
    // eslint-disable-next-line
  }, [JSON.stringify(rec.returns.map(r => [r.distanceLoaded, r.distanceEmpty]))]);

  const addReturn = () => setRec(r => {
    const nextP = 'P' + (r.returns.length + 1);
    return { ...r, returns: [...r.returns, emptyReturn(nextP)] };
  });

  const removeReturn = (i) => setRec(r => ({
    ...r,
    returns: r.returns.filter((_, idx) => idx !== i).map((ret, idx) => ({ ...ret, priority: 'P' + (idx + 1) })),
  }));

  const moveReturn = (i, dir) => setRec(r => {
    const next = [...r.returns];
    const j = i + dir;
    if (j < 0 || j >= next.length) return r;
    [next[i], next[j]] = [next[j], next[i]];
    return { ...r, returns: next.map((x, idx) => ({ ...x, priority: 'P' + (idx + 1) })) };
  });

  const canSave = !!(rec.forward.customer && rec.forward.customer.trim());

  const handleSave = () => {
    // strip empty trailing returns where everything's blank
    const cleanRets = rec.returns
      .map(r => {
        const { _autoTotal, ...rest } = r;
        return rest;
      })
      .filter(r => Object.values(r).some(v => v !== '' && v !== null));
    const payload = {
      ...rec,
      returns: cleanRets,
    };
    onSave(payload);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onCancel} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div className="drawer-title-block">
            <div className="drawer-eyebrow">{isNew ? 'New record' : 'Edit record'}</div>
            <div className="drawer-title">
              {rec.forward.customer || (isNew ? 'Add Forward Lane' : 'Untitled lane')}
              {rec.forward.lane && <span style={{ color: 'var(--text-mut)', fontWeight: 400, marginLeft: 8 }}> · {rec.forward.lane}</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel} title="Close"><Icon.X/></button>
        </div>

        <div className="drawer-body">
          {/* Forward */}
          <div className="section">
            <div className="section-head">
              <div className="section-marker"/>
              <div className="section-title">Forward Lane — Customer Origin</div>
              <div className="section-sub">The originating customer & route</div>
            </div>
            <div className="field-grid">
              <div className="field col-6">
                <label>Customer <span className="req">*</span></label>
                <input type="text" value={rec.forward.customer} onChange={e => setF('customer', e.target.value)} placeholder="e.g. Silox India" autoFocus />
              </div>
              <div className="field col-6">
                <label>Lane</label>
                <input type="text" value={rec.forward.lane} onChange={e => setF('lane', e.target.value)} placeholder="e.g. Chanderiya — Silvassa" />
              </div>
              <div className="field col-3">
                <label>Feb Load <span className="hint">MT</span></label>
                <NumInput value={rec.forward.febLoad} onChange={v => setF('febLoad', v)} suffix="MT"/>
              </div>
              <div className="field col-3">
                <label>Distance (Actuals) <span className="hint">KM</span></label>
                <NumInput value={rec.forward.distanceKms} onChange={v => setF('distanceKms', v)} suffix="km"/>
              </div>
              <div className="field col-2">
                <label>Yield</label>
                <NumInput value={rec.forward.yieldPct} onChange={v => setF('yieldPct', v)} suffix="%"/>
              </div>
              <div className="field col-2">
                <label>Min-KMS</label>
                <NumInput value={rec.forward.minKms} onChange={v => setF('minKms', v)} suffix="km"/>
              </div>
              <div className="field col-2">
                <label>Max-KMS</label>
                <NumInput value={rec.forward.maxKms} onChange={v => setF('maxKms', v)} suffix="km"/>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="section">
            <div className="section-head">
              <div className="section-marker accent"/>
              <div className="section-title">Return Lanes — Backhaul Priorities</div>
              <div className="section-sub">{rec.returns.length} priorit{rec.returns.length === 1 ? 'y' : 'ies'}</div>
            </div>
            <div className="returns-editor">
              {rec.returns.map((r, i) => (
                <div key={i} className="return-card">
                  <div className="return-card-head">
                    <PriBadge p={r.priority}/>
                    <input type="text" value={r.returnCustomer} onChange={e => setR(i, 'returnCustomer', e.target.value)} placeholder="Return customer (e.g. Apar + Chauhan)" />
                    <button className="btn btn-xs" onClick={() => moveReturn(i, -1)} disabled={i === 0} title="Move up">↑</button>
                    <button className="btn btn-xs" onClick={() => moveReturn(i, 1)} disabled={i === rec.returns.length - 1} title="Move down">↓</button>
                    <button className="btn btn-xs btn-danger" onClick={() => removeReturn(i)} title="Remove"><Icon.Trash/></button>
                  </div>
                  <div className="field-grid">
                    <div className="field col-12">
                      <label>Return Lane</label>
                      <input type="text" value={r.lane} onChange={e => setR(i, 'lane', e.target.value)} placeholder="e.g. Silvassa — Khavda — Mundra — Chittorgarh" />
                    </div>
                    <div className="field col-2">
                      <label>Monthly Load <span className="hint">MT</span></label>
                      <NumInput value={r.monthlyLoad} onChange={v => setR(i, 'monthlyLoad', v)} suffix="MT"/>
                    </div>
                    <div className="field col-2">
                      <label>Loaded KMS</label>
                      <NumInput value={r.distanceLoaded} onChange={v => { setR(i, 'distanceLoaded', v); setR(i, '_autoTotal', true); }} suffix="km"/>
                    </div>
                    <div className="field col-2">
                      <label>Empty KMS</label>
                      <NumInput value={r.distanceEmpty} onChange={v => { setR(i, 'distanceEmpty', v); setR(i, '_autoTotal', true); }} suffix="km"/>
                    </div>
                    <div className={`field col-2 ${r._autoTotal ? 'derived' : ''}`}>
                      <label>Total KMS {r._autoTotal && <span className="hint">auto</span>}</label>
                      <NumInput value={r.totalDistance} onChange={v => { setR(i, 'totalDistance', v); setR(i, '_autoTotal', false); }} suffix="km"/>
                    </div>
                    <div className="field col-2">
                      <label>Yield</label>
                      <NumInput value={r.yieldPct} onChange={v => setR(i, 'yieldPct', v)} suffix="%"/>
                    </div>
                    <div className="field col-2">
                      <label>Blend</label>
                      <NumInput value={r.blend} onChange={v => setR(i, 'blend', v)} suffix="%"/>
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-priority" onClick={addReturn}>
                <Icon.Plus/> Add another priority (P{rec.returns.length + 1})
              </button>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <div className="footer-meta">
            {initial?.createdAt ? (
              <>
                <span>Created {fmt.date(initial.createdAt)} · by {initial.createdBy}</span>
                {initial.updatedAt && initial.updatedAt !== initial.createdAt && (
                  <span>Last edited {fmt.date(initial.updatedAt)} · by {initial.updatedBy}</span>
                )}
              </>
            ) : (
              <span>Will be saved as <b>{currentUser?.name}</b> · {new Date().toLocaleString('en-IN')}</span>
            )}
          </div>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>
            <Icon.Check/> {isNew ? 'Create record' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  );
}

window.RecordFormDrawer = RecordFormDrawer;
