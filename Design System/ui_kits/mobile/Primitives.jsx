/* eslint-disable */
// AutoDamage UI kit — primitives
// Tokens read live via Proxy so the dark/light toggle works mid-render.

const T_LIGHT = {
  mode: 'light',
  // brand
  primary:        '#2562ee',
  primaryHover:   '#1d4ed8',
  primaryFg:      '#ffffff',
  primarySubtle:  '#eef3ff',
  primarySubtleFg:'#1d4ed8',
  cobalt400:      '#5b94ff',
  // status
  severe:         '#ef4444',
  severeSoft:     '#fee2e2',
  warning:        '#f59e0b',
  warningSoft:    '#fef3c7',
  success:        '#22c55e',
  successSoft:    '#dcfce7',
  // surfaces
  bg:        '#f7f8fb',
  surface1:  '#ffffff',
  surface2:  '#f1f3f8',
  surface3:  '#e8ecf3',
  hairline:  '#e6e9f0',
  border:    '#d9dde6',
  // text
  fg1:       '#0b1220',
  fg2:       '#1c2434',
  fg3:       '#404a5e',
  fg4:       '#5d6577',
  fg5:       '#8c93a5',
  fg6:       '#b3b9c8',
  // overlays
  scrim:     'rgba(15,22,40,0.55)',
  // typography
  font: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  // elevation
  shadow1: '0 1px 2px rgba(15,22,40,0.04), 0 1px 3px rgba(15,22,40,0.04)',
  shadow2: '0 4px 14px rgba(15,22,40,0.06), 0 1px 3px rgba(15,22,40,0.04)',
  shadowPop:'0 14px 36px rgba(15,22,40,0.12), 0 2px 6px rgba(15,22,40,0.05)',
  // scan tile gradient
  scanGrad: 'linear-gradient(135deg, #2562ee 0%, #1d4ed8 100%)',
};

const T_DARK = {
  mode: 'dark',
  primary:        '#3b7bff',
  primaryHover:   '#5b94ff',
  primaryFg:      '#ffffff',
  primarySubtle:  '#0f1a35',
  primarySubtleFg:'#90b4ff',
  cobalt400:      '#5b94ff',
  severe:         '#f87171',
  severeSoft:     '#3b1d1d',
  warning:        '#fbbf24',
  warningSoft:    '#3a2a13',
  success:        '#34d399',
  successSoft:    '#163325',
  bg:        '#0a0e16',
  surface1:  '#121823',
  surface2:  '#1a2230',
  surface3:  '#232b3b',
  hairline:  '#232b3a',
  border:    '#2c3447',
  fg1:       '#f1f4fa',
  fg2:       '#dbe0eb',
  fg3:       '#b8becc',
  fg4:       '#8a91a4',
  fg5:       '#6a7184',
  fg6:       '#424a5d',
  scrim:     'rgba(0,0,0,0.7)',
  font: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  shadow1: '0 1px 2px rgba(0,0,0,0.35)',
  shadow2: '0 6px 18px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
  shadowPop:'0 18px 44px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
  scanGrad: 'linear-gradient(135deg, #3b7bff 0%, #1d4ed8 100%)',
};

if (typeof window.AD_DARK === 'undefined') window.AD_DARK = true;  // dark default

const T = new Proxy({}, {
  get(_, k) { return (window.AD_DARK ? T_DARK : T_LIGHT)[k]; },
});

// ---------- severity helpers ----------
function scoreColor(s) {
  if (s >= 0.66) return T.severe;
  if (s >= 0.33) return T.warning;
  return T.success;
}
function scoreSoft(s) {
  if (s >= 0.66) return T.severeSoft;
  if (s >= 0.33) return T.warningSoft;
  return T.successSoft;
}
function severityLabel(s) {
  if (s >= 0.66) return 'Significant';
  if (s >= 0.33) return 'Moderate';
  if (s > 0) return 'Minor';
  return 'None';
}

// ---------- Icon (Ionicons-style line set) ----------
function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.8, style }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'inline-block', flex: '0 0 auto', ...style },
  };
  switch (name) {
    case 'camera':
      return (<svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
    case 'images': case 'image-outline':
      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>);
    case 'scan':
      return (<svg {...props}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/></svg>);
    case 'time': case 'history':
      return (<svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
    case 'settings':
      return (<svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
    case 'car':
      return (<svg {...props}><path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5"/><path d="M2 13h20v4a2 2 0 0 1-2 2h-1.5a1.5 1.5 0 0 1-1.5-1.5V17H7v.5A1.5 1.5 0 0 1 5.5 19H4a2 2 0 0 1-2-2v-4z"/><circle cx="7" cy="15.5" r="1.2"/><circle cx="17" cy="15.5" r="1.2"/></svg>);
    case 'add': case 'plus':
      return (<svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
    case 'close': case 'x':
      return (<svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
    case 'chevron-forward': case 'chevron-right':
      return (<svg {...props}><polyline points="9 18 15 12 9 6"/></svg>);
    case 'chevron-back': case 'chevron-left':
      return (<svg {...props}><polyline points="15 18 9 12 15 6"/></svg>);
    case 'trash':
      return (<svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>);
    case 'check':
      return (<svg {...props}><polyline points="5 12 10 17 19 8"/></svg>);
    case 'sparkles':
      return (<svg {...props}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8L16.5 18.5l1.8-.7z"/></svg>);
    case 'shield':
      return (<svg {...props}><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/><polyline points="9 12 11 14 15 10"/></svg>);
    case 'sun':
      return (<svg {...props}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></svg>);
    case 'moon':
      return (<svg {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>);
    case 'flash':
      return (<svg {...props} fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
    case 'camera-reverse':
      return (<svg {...props}><path d="M3 9a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 13a4 4 0 0 1 7-2.6"/><path d="M16 14a4 4 0 0 1-7 2.6"/></svg>);
    case 'alert':
      return (<svg {...props}><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>);
    default:
      return (<svg {...props}><circle cx="12" cy="12" r="9"/></svg>);
  }
}

// ---------- Buttons ----------
function PrimaryButton({ children, leftIcon, onClick, disabled, large, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', minHeight: large ? 56 : 48,
      padding: large ? '16px 20px' : '12px 18px',
      borderRadius: 12, border: 0,
      background: disabled ? T.surface2 : T.primary,
      color: disabled ? T.fg5 : T.primaryFg,
      fontFamily: T.font, fontWeight: 600, fontSize: large ? 16 : 15,
      letterSpacing: -0.005, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'transform 80ms ease, background 120ms ease, box-shadow 120ms ease',
      boxShadow: disabled ? 'none' : '0 4px 14px rgba(37,98,238,0.25)',
      ...style,
    }}
    onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {leftIcon ? <Icon name={leftIcon} size={20} color="currentColor" strokeWidth={2.2} /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({ children, leftIcon, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', minHeight: 48, padding: '12px 18px',
      borderRadius: 12, border: `1px solid ${T.border}`,
      background: 'transparent',
      color: disabled ? T.fg5 : T.fg2,
      fontFamily: T.font, fontWeight: 600, fontSize: 15,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 120ms ease',
      ...style,
    }}>
      {leftIcon ? <Icon name={leftIcon} size={20} color="currentColor" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

function DangerButton({ children, leftIcon, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', minHeight: 48, padding: '12px 18px',
      borderRadius: 12, border: `1px solid ${T.severe}`,
      background: 'transparent', color: T.severe,
      fontFamily: T.font, fontWeight: 600, fontSize: 15,
      cursor: 'pointer',
      ...style,
    }}>
      {leftIcon ? <Icon name={leftIcon} size={20} color="currentColor" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

function LinkButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 4, color: T.primary,
      fontFamily: T.font, fontWeight: 600, fontSize: 14, ...style,
    }}>{children}</button>
  );
}

// ---------- Card ----------
function Card({ children, padding = 16, elevated, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface1,
      border: `1px solid ${T.hairline}`,
      borderRadius: 16,
      padding,
      boxShadow: elevated ? T.shadow2 : T.shadow1,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ---------- Status badge ----------
function StatusBadge({ score, label, style }) {
  const useScore = typeof score === 'number';
  const color = useScore ? scoreColor(score) : T.primary;
  const soft  = useScore ? scoreSoft(score) : T.primarySubtle;
  const text  = label || (useScore ? severityLabel(score) : '');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: soft, color,
      padding: '4px 10px', borderRadius: 999,
      fontFamily: T.font, fontWeight: 600, fontSize: 11,
      letterSpacing: 0.04, textTransform: 'uppercase',
      ...style,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      {text}
    </span>
  );
}

// ---------- Empty state ----------
function EmptyState({ icon = 'images', title, body, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
      background: T.surface2,
      border: `1.5px dashed ${T.border}`,
      borderRadius: 16,
      textAlign: 'center', gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: T.surface1, color: T.fg4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: T.shadow1,
      }}>
        <Icon name={icon} size={26} color="currentColor" strokeWidth={1.6} />
      </div>
      {title && <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>{title}</div>}
      {body && <div style={{ fontFamily: T.font, fontSize: 13, color: T.fg4, lineHeight: 1.5, maxWidth: 260 }}>{body}</div>}
      {action}
    </div>
  );
}

// ---------- Estimate line item ----------
function EstimateLineItem({ label, value, total, sub }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0',
      borderTop: total ? `1px solid ${T.hairline}` : 0,
      marginTop: total ? 4 : 0,
    }}>
      <div>
        <div style={{ fontFamily: T.font, fontWeight: total ? 700 : 500, fontSize: total ? 15 : 14, color: total ? T.fg1 : T.fg2 }}>{label}</div>
        {sub && <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{
        fontFamily: T.font, fontWeight: total ? 700 : 600,
        fontSize: total ? 18 : 14,
        color: total ? T.primary : T.fg2,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// ---------- Form ----------
function Field({ label, optional, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 13, color: T.fg2 }}>{label}</div>
        {optional && <div style={{ fontFamily: T.font, fontSize: 11, color: T.fg5 }}>optional</div>}
      </div>
      {children}
    </div>
  );
}
function Input(props) {
  return (
    <input {...props} style={{
      width: '100%', borderRadius: 12, border: `1px solid ${T.border}`,
      padding: '14px 14px', fontSize: 15, color: T.fg1, background: T.surface1,
      fontFamily: T.font, outline: 'none', boxSizing: 'border-box', ...(props.style || {}),
    }}
    onFocus={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.primarySubtle}`; }}
    onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', padding: 4, background: T.surface2,
      borderRadius: 12, gap: 2,
    }}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, padding: '10px 0', textAlign: 'center', border: 0, cursor: 'pointer',
            background: selected ? T.surface1 : 'transparent',
            color: selected ? T.fg1 : T.fg4,
            boxShadow: selected ? T.shadow1 : 'none',
            fontFamily: T.font, fontWeight: 600, fontSize: 13,
            borderRadius: 8, transition: 'all 120ms ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ---------- App header (in-screen, not the device status bar) ----------
function AppHeader({ title, subtitle, onBack, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 16px',
      gap: 8,
      background: T.bg,
      borderBottom: `1px solid ${T.hairline}`,
      minHeight: 52,
    }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 10, border: 0, cursor: 'pointer',
          background: T.surface1, color: T.fg2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: T.shadow1,
        }}>
          <Icon name="chevron-back" size={20} color="currentColor" strokeWidth={2.2} />
        </button>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.fg1, letterSpacing: -0.01, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {subtitle && <div style={{ fontFamily: T.font, fontSize: 11, color: T.fg5, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.06, fontWeight: 600 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{right}</div>
    </div>
  );
}

// ---------- Tab bar ----------
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'analyze',  label: 'Analyze',  icon: 'scan' },
    { id: 'history',  label: 'History',  icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <div style={{
      display: 'flex',
      paddingTop: 6, paddingBottom: 10,
      background: T.surface1,
      borderTop: `1px solid ${T.hairline}`,
      boxShadow: window.AD_DARK ? 'none' : '0 -1px 0 rgba(15,22,40,0.03)',
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 0',
            color: on ? T.primary : T.fg5,
            fontFamily: T.font, fontSize: 10.5, fontWeight: 600,
            letterSpacing: 0.01,
          }}>
            <div style={{
              padding: '4px 12px', borderRadius: 999,
              background: on ? T.primarySubtle : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms ease',
            }}>
              <Icon name={t.icon} size={20} color={on ? T.primary : T.fg5} strokeWidth={on ? 2.2 : 1.8} />
            </div>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- AutoDamage brand stamp ----------
function BrandStamp({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: T.scanGrad,
        boxShadow: '0 4px 12px rgba(37,98,238,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: T.font, fontWeight: 800,
        fontSize: size * 0.45, letterSpacing: -0.5,
      }}>AD</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: 15, color: T.fg1, letterSpacing: -0.01 }}>AutoDamage</span>
        <span style={{ fontFamily: T.font, fontWeight: 500, fontSize: 10, color: T.fg5, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.08 }}>by MEVA AI</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  AD_T: T,
  scoreColor, scoreSoft, severityLabel,
  Icon,
  PrimaryButton, SecondaryButton, DangerButton, LinkButton,
  Card, StatusBadge, EmptyState, EstimateLineItem,
  Field, Input, Segmented,
  AppHeader, TabBar, BrandStamp,
});
