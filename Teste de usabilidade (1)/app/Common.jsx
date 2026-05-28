/* eslint-disable */
// Reusable bits shared between Dashboard and Editor.

const { useState, useEffect, useRef, useCallback } = React;

// Lucide icon — uses the lucide-static CDN to render an inline SVG.
function Icon({ name, size = 16, color }) {
  const [svg, setSvg] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    if (window.lucide && window.lucide.icons && window.lucide.icons[name]) {
      // Use static SVG renderer
    }
    fetch(`https://unpkg.com/lucide-static@latest/icons/${name}.svg`)
      .then(r => r.text())
      .then(t => { if (!cancelled) setSvg(t); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [name]);
  if (!svg) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return (
    <span
      style={{ width: size, height: size, display: 'inline-flex', color: color || 'currentColor' }}
      dangerouslySetInnerHTML={{ __html: svg.replace('<svg', `<svg width="${size}" height="${size}" stroke="currentColor"`) }}
    />
  );
}

function Topbar({ left, right }) {
  return (
    <header className="ut-topbar">
      <div className="ut-topbar__left">{left}</div>
      <div className="ut-topbar__right">{right}</div>
    </header>
  );
}

function Brand({ subtitle }) {
  return (
    <div className="ut-brand">
      <div className="ut-logo">U</div>
      <div>
        <div className="ut-brand__word">Usabilidade · Elite</div>
        {subtitle && <div className="ut-brand__sub">{subtitle}</div>}
      </div>
    </div>
  );
}

function SavedIndicator({ pending }) {
  return (
    <span className="ut-saved" title="Salvo automaticamente no navegador">
      <span className={'ut-saved__dot' + (pending ? ' is-pending' : '')} />
      {pending ? 'Salvando…' : 'Salvo'}
    </span>
  );
}

// Sync status badge: offline / connecting / online / error
function SyncBadge({ status, onClick }) {
  const map = {
    offline:    { label: 'Offline',      icon: 'cloud-off',    color: 'rgb(115,115,115)', bg: 'rgb(var(--muted))' },
    connecting: { label: 'Conectando…',  icon: 'loader',       color: 'rgb(133,86,0)',    bg: 'rgba(234,179,8,0.12)' },
    online:     { label: 'Sincronizado', icon: 'cloud',        color: 'rgb(20,100,50)',   bg: 'rgba(34,197,94,0.12)' },
    error:      { label: 'Erro de sync', icon: 'cloud-off',    color: 'rgb(var(--destructive))', bg: 'rgba(220,38,38,0.08)' },
  };
  const cfg = map[status] || map.offline;
  return (
    <button
      onClick={onClick}
      title="Configurar Supabase"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 999,
        background: cfg.bg, color: cfg.color,
        fontSize: 11.5, fontWeight: 500,
        border: 0, cursor: 'pointer',
      }}
    >
      <Icon name={cfg.icon} size={12} />
      {cfg.label}
    </button>
  );
}

// Modal — controlled by parent open/onClose.
function Modal({ open, onClose, title, description, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {title && <h2 className="modal__title">{title}</h2>}
        {description && <p className="modal__desc">{description}</p>}
        {children}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

// Dropdown menu — closes on outside-click.
function Menu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="btn btn--outline btn--sm" onClick={() => setOpen(o => !o)}>
        {trigger}
      </button>
      {open && (
        <div className="menu" style={{ [align]: 0 }} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Icon, Topbar, Brand, SavedIndicator, SyncBadge, Modal, Menu });
