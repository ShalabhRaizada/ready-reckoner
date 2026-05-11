// Excel import/export using SheetJS (window.XLSX)
// Schema mirrors Ready_Reckoner.xlsx exactly.

(function () {
  const FWD_COLS = [
    { key: 'customer',     label: 'Customer' },
    { key: 'lane',         label: 'Lane' },
    { key: 'febLoad',      label: 'Feb Load' },
    { key: 'distanceKms',  label: 'Distance-KMS (Actuals)' },
    { key: 'yieldPct',     label: 'Yield' },
    { key: 'minKms',       label: 'Min-KMS' },
    { key: 'maxKms',       label: 'Max-KMS' },
  ];
  const RET_COLS = [
    { key: 'priority',        label: 'Priority' },
    { key: 'returnCustomer',  label: 'Return Customer' },
    { key: 'lane',            label: 'Lane' },
    { key: 'monthlyLoad',     label: 'Monthly Load - MT' },
    { key: 'distanceLoaded',  label: 'Distance Loaded - KMS' },
    { key: 'distanceEmpty',   label: 'Distance Empty' },
    { key: 'totalDistance',   label: 'Total Distance KMS' },
    { key: 'yieldPct',        label: 'Yield' },
    { key: 'blend',           label: 'Blend' },
  ];

  function nz(v) { return v === undefined || v === null || v === '' ? null : v; }

  // Parse from a workbook (already loaded via XLSX.read)
  function parseWorkbook(wb) {
    const sheet = wb.Sheets[wb.SheetNames[0]];
    // Get array-of-arrays
    const aoa = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    // aoa[0] is the "Forward Lane | Return Lane" superheader; aoa[1] is the column header row.
    // Data starts at aoa[2]
    const records = [];
    let current = null;
    for (let i = 2; i < aoa.length; i++) {
      const row = aoa[i];
      if (!row || row.length === 0) continue;
      const [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P] = row;
      const hasFwd = String(A ?? '').trim() !== '';
      if (hasFwd) {
        if (current) records.push(current);
        current = {
          forward: {
            customer: String(A).trim(),
            lane: String(B ?? '').trim(),
            febLoad: nz(C),
            distanceKms: nz(D),
            yieldPct: nz(E),
            minKms: nz(F),
            maxKms: nz(G),
          },
          returns: []
        };
      }
      if (!current) continue;
      const hasRet = (String(I ?? '').trim() !== '') || (String(J ?? '').trim() !== '') || (String(H ?? '').trim() !== '');
      if (hasRet) {
        current.returns.push({
          priority: String(H ?? '').trim() || null,
          returnCustomer: String(I ?? '').trim() || null,
          lane: String(J ?? '').trim() || null,
          monthlyLoad: nz(K),
          distanceLoaded: nz(L),
          distanceEmpty: nz(M),
          totalDistance: nz(N),
          yieldPct: nz(O),
          blend: nz(P),
        });
      }
    }
    if (current) records.push(current);
    return records;
  }

  async function parseFile(file) {
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: 'array' });
    return parseWorkbook(wb);
  }

  // Build a worksheet AOA matching the original layout
  function recordsToAOA(records) {
    const aoa = [];
    aoa.push(['Forward Lane (Customer Origin)', '', '', '', '', '', '', 'Return Lane (Backhaul)', '', '', '', '', '', '', '', '']);
    aoa.push([
      ...FWD_COLS.map(c => c.label),
      ...RET_COLS.map(c => c.label),
    ]);
    for (const rec of records) {
      const fwd = rec.forward || {};
      const rets = rec.returns && rec.returns.length ? rec.returns : [{}];
      rets.forEach((ret, idx) => {
        const row = idx === 0
          ? FWD_COLS.map(c => fwd[c.key] ?? '')
          : FWD_COLS.map(() => '');
        for (const c of RET_COLS) row.push(ret[c.key] ?? '');
        aoa.push(row);
      });
    }
    return aoa;
  }

  function exportRecords(records, filename) {
    const aoa = recordsToAOA(records);
    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    // Column widths roughly matching original
    ws['!cols'] = [
      { wch: 28 }, { wch: 36 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 11 },
      { wch: 9 },  { wch: 28 }, { wch: 42 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
      { wch: 12 }, { wch: 12 }
    ];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Ready Reckoner');
    window.XLSX.writeFile(wb, filename || 'Ready_Reckoner_Export.xlsx');
  }

  window.ExcelIO = { parseFile, parseWorkbook, exportRecords, FWD_COLS, RET_COLS };
})();
