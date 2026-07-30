const { Button, IconButton, Icon, Chip, Input, EmptyState, Kbd, Field } = window.PolecatDesignSystem_dd3c05;

/* Studio — the dashboard builder's three-pane workspace: query library on the
   left, live preview in the middle, inspector on the right, with a dashbar
   above the preview (dashboard-scoped actions live above the thing they act on,
   never in the app topbar) and the status bar underneath. */
function Studio({ onClose }) {
  const [sel, setSel] = React.useState('KPI · Total acres');
  const [empty, setEmpty] = React.useState(false);
  const pane = { background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minWidth: 0 };
  const paneH = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)' };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ ...pane, width: 232, flex: 'none' }}>
          <div style={paneH}>
            <span style={{ flex: 1 }}>Data</span>
            <Button surface="app" variant="ghost" size="sm">＋ New ▾</Button>
          </div>
          <div style={{ padding: 10 }}><Input placeholder="Search datasets, columns, tables…" /></div>
          <div className="ax-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
            {[['county_yield_2026', 'DuckDB'], ['huc8_water_balance', 'Snowflake'], ['soil_moisture_daily', 'BigQuery'], ['fleet_changelog', 'SQLite']].map(([n, s]) => (
              <div key={n} className="ax-row" style={{ padding: '9px 10px', borderRadius: 9, cursor: 'grab' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: 'var(--text-2)' }}><Icon name="db" size={16} /></span>
                  <b style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</b>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 25, fontFamily: 'var(--mono)' }}>{s}</span>
              </div>
            ))}
          </div>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ minWidth: 0 }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 14.5, fontWeight: 700, padding: 0, cursor: 'text', fontFamily: 'inherit' }}>Crop yield by CRD</button>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>crop-yield-crd · Agronomy</div>
            </div>
            <span style={{ flex: 1 }} />
            <Button surface="app" variant="secondary" className="ax-btn" size="sm">Examples ▾</Button>
            <IconButton size="sm" label="Undo" icon="↶" />
            <IconButton size="sm" label="Redo" icon="↷" />
            <Button surface="app" variant="secondary" size="sm" className="ax-btn">Save</Button>
            <Button surface="app" variant="primary" size="sm">Export ▾</Button>
            <Button surface="app" variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
            <b style={{ color: 'var(--text-2)', fontWeight: 700 }}>Live preview</b>
            <span>click to edit · drag the header to reorder · drag the right edge to resize · drop a query to add</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setEmpty(!empty)} style={{ background: 'none', border: 'none', color: 'var(--brand-2)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              {empty ? 'show sample dashboard' : 'show empty canvas'}
            </button>
          </div>
          <div className="ax-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {empty ? (
              <EmptyState icon={<Icon name="grid" size={28} />} title="Canvas is empty"
                description="Drag a dataset or sample query from the Data panel onto the canvas, or drop a CSV/JSON file here to build a dashboard instantly."
                actions={<><Button surface="app" size="sm">Open data panel</Button>
                  <Button surface="app" variant="ghost" size="sm">¶ Add a text View</Button>
                  <Button surface="app" variant="ghost" size="sm">Import a file</Button></>} />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[['Total acres', '4.81M', '+2.4%'], ['Avg yield', '181 bu/ac', '+0.9%'], ['Counties', '1,043', '—'], ['Anomalies', '17', '-3']].map(([l, v, d]) => (
                    <div key={l} onClick={() => setSel('KPI · ' + l)} style={{
                      background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '14px 16px', cursor: 'pointer',
                      border: '1px solid ' + (sel === 'KPI · ' + l ? 'color-mix(in srgb, var(--brand) 55%, var(--border))' : 'var(--border)'),
                    }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-3)', fontWeight: 700 }}>{l}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.6px', marginTop: 4 }}>{v}</div>
                      <div style={{ fontSize: 12, color: d.startsWith('+') ? 'var(--success)' : 'var(--text-3)' }}>{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
                  <Panel title="Yield by CRD" onClick={() => setSel('View · Yield by CRD')} selected={sel === 'View · Yield by CRD'}>
                    <Bars values={[52, 78, 41, 88, 63, 95, 70, 58, 82, 47, 74, 66]} />
                  </Panel>
                  <Panel title="Moisture anomaly" onClick={() => setSel('View · Moisture anomaly')} selected={sel === 'View · Moisture anomaly'}>
                    <Line />
                  </Panel>
                </div>
              </div>
            )}
          </div>
          <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
              Analytics · analytics.polecat.live
            </span>
            <span style={{ flex: 1 }} />
            <button style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Icon name="clock" size={14} /> Changelog ⌃
            </button>
            <span style={{ fontFamily: 'var(--mono)' }}>built 2026-07-28 06:14 UTC</span>
          </footer>
        </section>

        <aside style={{ ...pane, width: 268, flex: 'none', borderRight: 'none', borderLeft: '1px solid var(--border)' }}>
          <div style={paneH}><span style={{ flex: 1 }}>{sel}</span><span style={{ color: 'var(--text-3)' }}>?</span></div>
          <div className="ax-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <Field label="Title"><Input defaultValue={sel.split(' · ')[1]} /></Field>
            <Field label="Dataset"><Input defaultValue="county_yield_2026" /></Field>
            <Field label="Chart" hint="Bar, line, area, map, table and 40 more."><Input defaultValue="Bar — vertical" /></Field>
            <Field label="Aggregate" hint="Acreage-weighted mean keeps State/CRD/HUC8 rollups honest."><Input defaultValue="Weighted mean" /></Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Chip tone="feature">saved</Chip><Chip>local</Chip>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children, onClick, selected }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 14, cursor: 'pointer',
      border: '1px solid ' + (selected ? 'color-mix(in srgb, var(--brand) 55%, var(--border))' : 'var(--border)'),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <b style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{title}</b>
        <span style={{ color: 'var(--text-3)' }}><Icon name="grip" size={15} /></span>
      </div>
      {children}
    </div>
  );
}

function Bars({ values }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
      {values.map((v, i) => (
        <span key={i} style={{
          flex: 1, height: `${v}%`, borderRadius: '4px 4px 0 0',
          background: 'linear-gradient(180deg,var(--brand-2),color-mix(in srgb,var(--brand) 35%,transparent))',
        }} />
      ))}
    </div>
  );
}

function Line() {
  return (
    <svg viewBox="0 0 220 150" style={{ width: '100%', height: 150, display: 'block' }}>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        points="6,110 30,86 54,96 78,58 102,70 126,40 150,52 174,28 198,44 214,20" />
      <polyline fill="none" stroke="var(--brand-2)" strokeWidth="2.2" strokeDasharray="4 5" strokeLinecap="round"
        points="6,124 30,118 54,112 78,104 102,100 126,92 150,88 174,78 198,72 214,64" />
    </svg>
  );
}

Object.assign(window, { Studio, Panel, Bars, Line });
