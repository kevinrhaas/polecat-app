const { Wordmark, Kicker, GradientText, Button, IconButton, Icon, AppCard, StatCard, FeatureCard, Ticker, AdvantageBand, AuroraBackdrop, ScrollCue, SiteFooter, Field, FieldRow, Input, Select, Textarea } = window.PolecatDesignSystem_dd3c05;

const WRAP = { maxWidth: 'var(--maxw)', margin: '0 auto', padding: '0 22px' };
const BAND = { background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 0' };
const H2 = { margin: 0, fontSize: 'var(--t-h2)', fontWeight: 800, letterSpacing: 'var(--t-h2-ls)', lineHeight: 'var(--t-h2-lh)' };
const LEAD = { fontSize: 'var(--t-lead)', color: 'var(--text-2)', marginTop: 12, lineHeight: 1.6 };

function SectionHead({ kicker, title, lead, center = true, narrowLead }) {
  return (
    <div style={{ marginBottom: 40, textAlign: center ? 'center' : 'left' }}>
      <Kicker>{kicker}</Kicker>
      <h2 style={H2}>{title}</h2>
      {lead && <p style={{ ...LEAD, maxWidth: narrowLead ? 720 : undefined, marginInline: 'auto' }}>{lead}</p>}
    </div>
  );
}

function Nav() {
  const [dark, setDark] = React.useState(true);
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light'); }, [dark]);
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '12px 22px', background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
    }}>
      <a href="#top" style={{ textDecoration: 'none' }}><Wordmark mark={dark ? '../../assets/logo-mark-white.png' : '../../assets/logo-mark-alpha.png'} size={17} /></a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="pc-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14, marginRight: 14 }}>
          {[['Apps', '#apps'], ['How we build', '#method'], ['What I do', '#work'], ['About', '#about']].map(([l, h]) => (
            <a key={l} href={h} className="pc-navlink" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <IconButton variant="ghost" label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          icon={<Icon name={dark ? 'sun' : 'moon'} size={18} />} onClick={() => setDark(!dark)}
          style={{ borderColor: 'var(--border)' }} />
        <Button variant="ghost" className="pc-btn">Sign in</Button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header id="top" className="pc-hero" style={{ textAlign: 'center', padding: '70px 22px 80px', maxWidth: 860, margin: '0 auto', position: 'relative' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 680, height: 480,
        background: 'radial-gradient(closest-side, rgba(176,112,240,.16), rgba(224,138,69,.10), transparent 70%)',
        pointerEvents: 'none', zIndex: -1,
      }} />
      <img className="pc-mascot" src="../../assets/logo-mark-white.png" width="96" height="96" alt=""
        style={{ filter: 'var(--shadow-mascot)' }} />
      <h1 style={{ margin: '14px 0 6px', fontSize: 'var(--t-h1)', fontWeight: 800, letterSpacing: 'var(--t-h1-ls)', lineHeight: 'var(--t-h1-lh)' }}>
        Data, analytics &amp; apps<br /><GradientText>— built to fit.</GradientText>
      </h1>
      <p style={{ fontSize: 'var(--t-hero-sub)', color: 'var(--text-2)', maxWidth: 640, margin: '16px auto 0', lineHeight: 1.6 }}>
        Polecat builds data, analytics, and application software for targeted problems — designed by
        thirty years of enterprise data experience, built by a fleet of AI agents that ship and test
        around the clock. All the output of a team. None of the meetings.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
        <Button variant="primary" size="lg" href="#apps" className="pc-btn pc-cta-pulse">See what we've shipped</Button>
        <Button variant="ghost" size="lg" href="#work" className="pc-btn">Work with me →</Button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 18 }}>
        Everything here is open source (GPL-3), local-first, and free to use without an account. Yes, really.
      </p>
      <ScrollCue href="#idea" />
    </header>
  );
}

Object.assign(window, { WRAP, BAND, H2, LEAD, SectionHead, Nav, Hero });
