const { AppCard, StatCard, FeatureCard, AdvantageBand, Kicker, Button, Icon, Field, FieldRow, Input, Select, Textarea } = window.PolecatDesignSystem_dd3c05;

const FLEET_TILES = [
  { app: 'chat', glyph: 'chat', name: 'Chat', host: 'chat.polecat.live', tagline: 'Ask once. Hear from everyone — multi-model consensus.', version: 'v1.4.2', shipped: 'today' },
  { app: 'jobtracker', glyph: 'briefcase', name: 'JobTracker', host: 'jobtracker.polecat.live', tagline: 'Creative-work tracking with saved views, boards, and joy.', version: 'v3.1.0', shipped: 'yesterday' },
  { app: 'analytics', glyph: 'chart', name: 'Analytics', host: 'analytics.polecat.live', tagline: 'Connect your data, build dashboards, share anywhere.', version: 'v2.9.1', shipped: '2 days ago' },
  { app: 'autoselector', glyph: 'car', name: 'AutoSelector', host: 'autoselector.polecat.live', tagline: 'The joyful way to find your car.', version: 'v1.2.7', shipped: '4 days ago' },
  { app: 'relay', glyph: 'network', name: 'Relay', host: 'relay.polecat.live', tagline: 'Serverless peer-to-peer tables and chat.', version: 'v0.8.3', shipped: '6 days ago' },
  { app: 'games', glyph: 'gamepad', name: 'Games', host: 'games.polecat.live', tagline: 'An ever-growing neon arcade of story-driven retro games.', version: 'v0.9.4', shipped: '5 days ago', fun: 'fun' },
  { app: 'manager', glyph: 'gauge', name: 'Manager', host: 'manager.polecat.live', tagline: 'Mission control for the fleet.', version: 'v1.8.0', shipped: 'today' },
  { app: 'modelserver', glyph: 'terminal', name: 'Model Server', host: 'modelserver.polecat.live', tagline: 'Your own OpenAI- & Anthropic-compatible model server.', version: 'v0.5.0', shipped: '9 days ago' },
];

const METHOD = [
  ['01', 'A shared platform, not eight snowflakes', "Every app runs on one open shell library — design tokens, navigation, theming, changelogs — vendored with integrity hashes. Improve it once, the whole fleet gets better."],
  ['02', 'Agents build; gates decide', "AI agents work in branches and open pull requests. Nothing ships until the app's own test gate passes on mobile and desktop — and if something bad ever lands, the site auto-reverts itself within a minute."],
  ['03', 'Shipped daily, in public', "Every change lands with an honest changelog entry, every repo is public, and every app tells you exactly what's new. Software you can watch being made."],
  ['04', 'Local-first, yours-first', "Apps work fully without an account; your data lives in your browser unless you connect a backend — including your own, because it's all GPL-3 and self-hostable end to end."],
];

const XP = [
  ['Data integration & pipelines', 'Enterprise-scale ETL/ELT design and optimization, metadata-driven frameworks, migrations off legacy platforms, data quality, lineage, and the unglamorous performance work that makes it all hold.'],
  ['Data, end to end', 'The whole chain, ingestion to insight — with deep open-source roots: full-platform Pentaho depth, Mondrian and the wider open-source data stack, plus generative-AI extensions built for the platform itself.'],
  ['Cloud & modern data platforms', 'AWS, Azure and GCP architecture; Kubernetes and containers; Snowflake, Databricks, BigQuery, Redshift; migrations sized honestly, with cost and operability treated as features.'],
  ['Analytics & BI', 'Semantic models, dimensional modeling, governed metrics, embedded and OEM analytics, dashboard modernization — turning business questions into data products people actually use.'],
  ['AI & intelligent automation', 'Generative AI for real data workflows: document AI, vector search and matching, prompt and evaluation frameworks, and agent-driven development — practiced daily, not read about.'],
  ['Architecture, strategy & delivery', 'Assessments, modernization roadmaps, proofs of concept, build-vs-buy calls with no software quota behind them — plus the delivery leadership to land it.'],
];

function useReveal() {
  React.useEffect(() => {
    const els = document.querySelectorAll('.pc-reveal');
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function Idea() {
  return (
    <section id="idea" style={BAND}><div style={WRAP}>
      <SectionHead kicker="The idea" title={<>Most organizations don't need another platform.<br />They need their actual problems solved.</>} />
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontSize: 17, color: 'var(--text-2)' }}>
        <p style={{ margin: 0, lineHeight: 1.75 }}>Enterprise software is priced for armies — armies to build it, armies to sell it, armies to sit through the rollout. So targeted problems go unsolved, because no one can justify the overhead for a tool that does one thing well.</p>
        <p style={{ margin: 0, lineHeight: 1.75 }}>Polecat works from the other direction. Thirty years of enterprise data experience sets the architecture, the standards, and the taste; AI agents do the building, testing, and shipping — continuously, in public, with every change gated and reversible. That changes the cost of software so much that "a precise tool for your exact problem" becomes the cheap option, not the extravagant one.</p>
        <p style={{ margin: 0, lineHeight: 1.75 }}>The goal is simple: elevate how organizations work, operate, and analyze — by streamlining and simplifying, not by adding another layer. Fewer moving parts, clearer data, tools people actually enjoy using.</p>
      </div>
      <div className="pc-g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, maxWidth: 880, margin: '44px auto 0' }}>
        <StatCard value="7" label="live apps" href="#apps" className="pc-lift" />
        <StatCard value="900+" label="releases shipped" href="#apps" className="pc-lift" />
        <StatCard value="100%" label="open source" href="https://github.com/kevinrhaas" className="pc-lift" />
        <StatCard value="0" label="meetings held" href="#work" className="pc-lift" />
      </div>
    </div></section>
  );
}

function Launcher() {
  return (
    <section id="apps" style={{ ...WRAP, paddingTop: 80, paddingBottom: 80 }}>
      <SectionHead kicker="Proof, not promises" title="The apps" narrowLead
        lead="Every tile is live and free — versions and ship dates come straight from each app's changelog. This is what agent-scale development looks like in production." />
      <div className="pc-g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {FLEET_TILES.map(t => <AppCard key={t.app} {...t} className="pc-lift" />)}
      </div>
    </section>
  );
}

function Method() {
  return (
    <section id="method" style={BAND}><div style={WRAP}>
      <SectionHead kicker="How we build" title="A factory that never sleeps" />
      <div className="pc-g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, maxWidth: 880, margin: '0 auto' }}>
        {METHOD.map(([n, t, b]) => <FeatureCard key={n} num={n} title={t} className="pc-reveal pc-lift">{b}</FeatureCard>)}
      </div>
      <p style={{ maxWidth: 640, margin: '34px auto 0', fontSize: 15, color: 'var(--text-2)', textAlign: 'center' }}>
        The same factory is available for <em style={{ color: 'var(--brand-b)', fontStyle: 'normal', fontWeight: 700 }}>your</em> targeted problem. That's the pitch, and the site you're reading is the proof.
      </p>
    </div></section>
  );
}

function Work() {
  return (
    <section id="work" style={{ ...WRAP, paddingTop: 80, paddingBottom: 80 }}>
      <SectionHead kicker="What I do" title="Independent data, analytics & AI consulting" narrowLead
        lead="I help organizations design, modernize, and improve data platforms, analytics environments, and AI-enabled solutions — moving fluidly from executive strategy to architecture to hands-on implementation and delivery. You don't have to choose between a strategist who can't build and a builder who can't see the business." />
      <div className="pc-g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {XP.map(([t, b]) => <FeatureCard key={t} title={t} className="pc-reveal pc-lift">{b}</FeatureCard>)}
      </div>
      <AdvantageBand kicker="Why this works"
        lead="The unusual part isn't any single skill — it's operating credibly at four levels at once:"
        pills={['Executive strategy', 'Enterprise architecture', 'Hands-on implementation', 'Delivery leadership']}
        foot="Assess → strategize → roadmap → prototype → implement → troubleshoot → enable your team to run it. Start anywhere in that chain; I've done every link of it for thirty years." />
    </section>
  );
}

function About() {
  return (
    <section id="about" style={BAND}><div style={{ ...WRAP, maxWidth: 880 }}>
      <SectionHead kicker="About" title="Kevin R. Haas" center={false} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16.5, color: 'var(--text-2)' }}>
        <p style={{ margin: 0, lineHeight: 1.75 }}>I've spent thirty years in enterprise data — from building predictive models in the '90s, through senior partner at Inquidia Consulting and director roles at FICO, to leading Pentaho Professional Services globally at Hitachi Vantara: large-scale data and analytics delivery, cloud migrations, GenAI product extensions, and the escalations nobody else wanted. Florida, then Northwestern, before all of it. Chicago ever since.</p>
        <p style={{ margin: 0, lineHeight: 1.75 }}>Polecat is what happens when all of that meets agent-scale development: an independent practice and an open-source software collective — of one — building the kind of precise, joyful tools I always wished every company could have. Enterprise-grade elegance, finally cost-effective for everyone from the smallest startup to the largest enterprise. The agents don't sleep. I occasionally do.</p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
        <Button variant="primary" className="pc-btn" href="https://www.linkedin.com/in/kevinrhaas/">Connect on LinkedIn</Button>
        <Button variant="ghost" className="pc-btn" href="mailto:kevin.haas@polecat.live">Email</Button>
      </div>
    </div></section>
  );
}

function Connect() {
  const [sent, setSent] = React.useState(false);
  return (
    <section id="connect" style={BAND}><div style={{ ...WRAP, maxWidth: 640 }}>
      <SectionHead kicker="Connect" title="Connect with us"
        lead={<>Want a key to a private app like the <a href="#" style={{ color: 'var(--brand-b)' }}>Model Server</a>, curious about a build, or have a problem worth solving? Leave a note — it comes straight to us.</>} />
      {sent ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '22px 24px', background: 'var(--surface)',
          border: '1px solid color-mix(in srgb, var(--ok) 40%, var(--border))', borderRadius: 'var(--r)',
        }}>
          <span style={{ color: 'var(--ok)' }}><Icon name="check" size={26} /></span>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 15 }}>Got it — thanks. You'll hear back from a human, usually same day.</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FieldRow>
            <Field label="Name" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}><Input placeholder="Your name" /></Field>
            <Field label="Email" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}><Input type="email" placeholder="you@example.com" /></Field>
          </FieldRow>
          <Field label="I'm interested in" style={{ marginBottom: 0 }}>
            <Select options={['Model Server access', 'A specific app', 'Consulting', 'Just saying hi']} />
          </Field>
          <Field label="Message" style={{ marginBottom: 0 }}>
            <Textarea rows={4} placeholder="A sentence or two about what you're after…" />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" className="pc-btn" as="button">Send it</Button>
          </div>
        </form>
      )}
    </div></section>
  );
}

function FinalCta() {
  return (
    <section style={{ textAlign: 'center', padding: '90px 22px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', left: '50%', top: '50%', width: 640, height: 640, transform: 'translate(-50%,-50%)',
        zIndex: -1, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(224,138,69,.10), rgba(176,112,240,.06) 45%, transparent 68%)',
        animation: 'pcHalo 6s ease-in-out infinite',
      }} />
      <h2 style={{ ...H2, marginBottom: 24 }}>Have a targeted problem?</h2>
      <p style={{ ...LEAD, marginBottom: 24 }}>We'd like to hear about it — a direct, jargon-proof conversation, no pitch.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" size="lg" className="pc-btn" href="https://www.linkedin.com/in/kevinrhaas/">Let's talk</Button>
        <Button variant="ghost" size="lg" className="pc-btn" href="https://games.polecat.live">Or just play the arcade →</Button>
      </div>
    </section>
  );
}

Object.assign(window, { useReveal, Idea, Launcher, Method, Work, About, Connect, FinalCta, FLEET_TILES });
