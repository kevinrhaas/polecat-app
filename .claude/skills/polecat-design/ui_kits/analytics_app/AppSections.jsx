const { Button, IconButton, Icon, Chip, Pill, Input, EmptyState, Kbd } = window.PolecatDesignSystem_dd3c05;

/* The section blurb every Analytics repository view opens with (.repo-hero). */
function RepoHero({ blurb, search, actions }) {
  return (
    <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', maxWidth: 780, lineHeight: 1.6 }}>{blurb}</p>
      {search && <Input type="search" placeholder={search} style={{ maxWidth: 420 }} />}
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

function ObjectTile({ icon, name, meta, tag }) {
  return (
    <div className="ax-card" style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', flex: 'none',
          color: 'var(--brand-2)', background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
        }}><Icon name={icon} size={18} /></span>
        <b style={{ fontSize: 13.5, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</b>
        {tag && <Chip tone={tag.tone}>{tag.label}</Chip>}
      </div>
      <div style={{
        height: 64, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-end', gap: 4, padding: 8,
      }}>
        {[38, 62, 30, 74, 50, 84, 44].map((h, i) => (
          <span key={i} style={{
            flex: 1, height: `${h}%`, borderRadius: 3,
            background: 'linear-gradient(180deg,var(--brand-2),color-mix(in srgb,var(--brand) 40%,transparent))',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{meta}</span>
    </div>
  );
}

function ObjectRow({ icon, name, meta, right }) {
  return (
    <div className="ax-row" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
    }}>
      <span style={{ color: 'var(--text-2)', display: 'inline-flex' }}><Icon name={icon} size={18} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{name}</b>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{meta}</span>
      </span>
      {right}
    </div>
  );
}

const DASHBOARDS = [
  ['Crop yield by CRD', 'v14 · updated 2 days ago', { label: 'shared', tone: 'polish' }],
  ['Irrigation demand — HUC8', 'v3 · updated today', null],
  ['Fleet release velocity', 'v27 · updated 6 hours ago', { label: 'pinned', tone: 'feature' }],
  ['Soil moisture anomalies', 'v9 · updated yesterday', null],
  ['Acreage-weighted rainfall', 'v2 · updated 4 days ago', null],
  ['Cost per query — Snowflake', 'v11 · updated 3 days ago', null],
];

const DATASETS = [
  ['county_yield_2026', 'DuckDB-Wasm · 41 columns · 128k rows'],
  ['huc8_water_balance', 'Snowflake · 22 columns · 4.1M rows'],
  ['fleet_changelog', 'SQLite-HTTP · 9 columns · 940 rows'],
  ['soil_moisture_daily', 'BigQuery · 17 columns · 88M rows'],
];

const CONNECTIONS = [
  ['Warehouse — prod', 'Snowflake · us-east-1 · credentials in this browser', 'ok'],
  ['Lakehouse', 'Databricks · SQL warehouse · serverless', 'ok'],
  ['Ad-hoc files', 'DuckDB-Wasm · local, no server', 'ok'],
  ['Legacy marts', 'Generic SQL · via PostgREST', 'warn'],
];

function DashboardsSection() {
  const [list, setList] = React.useState(false);
  return (
    <div>
      <RepoHero
        blurb="Every dashboard you've saved — searchable, filterable by workbook, as tiles or a list. Searching also finds dashboards by the columns their datasets use."
        search="Search dashboards…"
        actions={<>
          <Button surface="app" variant="secondary" className="ax-btn" onClick={() => setList(!list)}>{list ? 'Tile view' : 'List view'}</Button>
          <Button surface="app" variant="secondary" className="ax-btn">Compare dashboards…</Button>
          <Button surface="app" variant="secondary" className="ax-btn">Export dashboards…</Button>
          <Button surface="app" variant="secondary" className="ax-btn">Import dashboards…</Button>
        </>} />
      {list ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 6 }}>
          {DASHBOARDS.map(([n, m, t]) => (
            <ObjectRow key={n} icon="layers" name={n} meta={m} right={t ? <Chip tone={t.tone}>{t.label}</Chip> : null} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
          {DASHBOARDS.map(([n, m, t]) => <ObjectTile key={n} icon="layers" name={n} meta={m} tag={t} />)}
        </div>
      )}
    </div>
  );
}

function DatasetsSection() {
  return (
    <div>
      <RepoHero
        blurb="Named, parameterizable queries defined on top of your connections — the reusable building blocks dashboards are made of."
        search="Search datasets…"
        actions={<>
          <Button surface="app" variant="secondary" className="ax-btn">Tile view</Button>
          <Button surface="app" variant="primary">+ New dataset</Button>
        </>} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 6 }}>
        {DATASETS.map(([n, m]) => (
          <ObjectRow key={n} icon="db" name={n} meta={m}
            right={<span style={{ display: 'flex', gap: 6 }}><IconButton size="sm" variant="ghost" label="Preview" icon={<Icon name="eye" size={15} />} /><IconButton size="sm" variant="ghost" label="Edit" icon={<Icon name="edit" size={15} />} /></span>} />
        ))}
      </div>
    </div>
  );
}

function ConnectionsSection() {
  return (
    <div>
      <RepoHero
        blurb="Where your dashboards' data lives — reusable connections to warehouses, files and APIs, one adapter each. Credentials stay in this browser."
        search="Search connections…"
        actions={<>
          <Button surface="app" variant="secondary" className="ax-btn">Tile view</Button>
          <Button surface="app" variant="primary">+ New connection</Button>
        </>} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 6 }}>
        {CONNECTIONS.map(([n, m, s]) => (
          <ObjectRow key={n} icon="link" name={n} meta={m}
            right={<span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'ok' ? 'var(--success)' : 'var(--warning)' }} />
              {s === 'ok' ? 'connected' : 'needs credentials'}
            </span>} />
        ))}
      </div>
    </div>
  );
}

function HomeSection() {
  return (
    <div>
      <RepoHero blurb="Your pinned analyses and the workspace's recent activity. Everything works logged-out; your data stays in this browser until you connect a backend." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
        {DASHBOARDS.slice(0, 3).map(([n, m, t]) => <ObjectTile key={n} icon="chart" name={n} meta={m} tag={t} />)}
      </div>
      <div style={{ marginTop: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 6 }}>
        {[['Job run finished', 'acreage_weighted_rollup · 2.4s · 128k rows'],
          ['Dashboard saved', 'Fleet release velocity · v27'],
          ['Connection tested', 'Warehouse — prod · ok']].map(([n, m]) => (
          <ObjectRow key={n} icon="clock" name={n} meta={m} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { RepoHero, ObjectTile, ObjectRow, DashboardsSection, DatasetsSection, ConnectionsSection, HomeSection });
