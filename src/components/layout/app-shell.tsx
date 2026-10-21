import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface WorkspaceOrganization {
  id: string;
  name: string;
  industry: string;
  city: string;
  active: boolean;
}

interface AppShellProps {
  children: ReactNode;
  section: string;
  organizationId: string;
  organizations: WorkspaceOrganization[];
  onOrganizationChange: (id: string) => void;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  isAdmin: boolean;
  user: { name: string; email: string; role: string };
}

const navigation: Array<{ label: string; path: string; icon: IconName }> = [
  { label: "Kandidater", path: "/", icon: "people" },
  { label: "Jobb", path: "/jobb", icon: "briefcase" },
  { label: "Administration", path: "/administration", icon: "building" },
];

export function AppShell({
  children,
  section,
  organizationId,
  organizations,
  onOrganizationChange,
  onNavigate,
  onSignOut,
  isAdmin,
  user,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  function go(path: string) {
    onNavigate(path);
    setShowNotifications(false);
  }

  return (
    <div className="app-shell">
      <aside className={"app-sidebar" + (collapsed ? " is-collapsed" : "")}>
        <button className="brand-lockup" type="button" onClick={() => go("/")} aria-label="Nexora, gå till kandidater">
          <img src="/brand/nexora-favicon.svg" alt="" />
          <span>NEXORA</span>
        </button>

        <div className="workspace-picker">
          <p className="eyebrow sidebar-eyebrow">Arbetsyta</p>
          <div className="workspace-select-wrap">
            <Icon name="building" size={21} />
            {isAdmin ? (
              <>
                <label className="visually-hidden" htmlFor="workspace-select">Välj organisation</label>
                <select id="workspace-select" value={organizationId} onChange={(event) => onOrganizationChange(event.target.value)}>
                  {organizations.filter((organization) => organization.active).map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
                <span className="workspace-role">{user.role}</span>
                <Icon name="chevron-down" size={17} />
              </>
            ) : (
              <span className="workspace-customer-name">
                {organizations.find((organization) => organization.id === organizationId)?.name ?? "Din arbetsyta"}
                <small>{user.role}</small>
              </span>
            )}
          </div>
        </div>

        <nav className="primary-nav" aria-label="Huvudmeny">
          <p className="eyebrow nav-eyebrow">Rekrytering</p>
          {navigation.filter((item) => isAdmin || item.label !== "Administration").map((item) => {
            const active = item.label === section;
            return (
              <button key={item.path} type="button" className={"nav-item" + (active ? " is-active" : "")} aria-label={item.label} aria-current={active ? "page" : undefined} onClick={() => go(item.path)}>
                <Icon name={item.icon} size={21} />
                <span>{item.label}</span>
                {active && <Icon name="chevron-right" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item support-link" type="button" onClick={() => setShowHelp(true)}>
            <Icon name="help" size={20} />
            <span>Hjälp &amp; support</span>
          </button>
          <div className="user-card">
            <div className="avatar avatar-small">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
            <div className="user-copy">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button className="icon-button" type="button" onClick={onSignOut} aria-label="Logga ut" title="Logga ut">
              <Icon name="logout" size={19} />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-context">
            <button className="icon-button sidebar-toggle" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Visa sidomeny" : "Dölj sidomeny"}>
              <Icon name="panel" size={22} />
            </button>
            <span className="muted">Arbetsyta</span>
            <Icon name="chevron-right" size={16} />
            <strong>{section}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">{new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>
            <span className="role-pill">{user.role}</span>
            <div className="notification-anchor">
              <button className={"icon-button notification-button" + (showNotifications ? " is-open" : "")} type="button" onClick={() => setShowNotifications((value) => !value)} aria-label="Visa notiser" aria-expanded={showNotifications}>
                <Icon name="bell" size={22} />
              </button>
              {showNotifications && (
                <div className="popover notification-popover" role="dialog" aria-label="Notiser">
                  <div className="popover-heading">
                    <h2>Notiser</h2>
                    <button className="icon-button" type="button" onClick={() => setShowNotifications(false)} aria-label="Stäng notiser"><Icon name="close" size={20} /></button>
                  </div>
                  <p>3 nya ansökningar till Frontendutvecklare</p>
                  <span className="muted">Idag, 09:42</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Nexora</span>
          <span>{organizations.find((organization) => organization.id === organizationId)?.name} · Rekrytering med omtanke</span>
        </footer>
      </div>

      {showHelp && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}>
          <section className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <h2 id="help-title">Hjälp &amp; support</h2>
              <button className="icon-button" type="button" onClick={() => setShowHelp(false)} aria-label="Stäng"><Icon name="close" /></button>
            </div>
            <p>Kontakta din organisations administratör för frågor om kandidater, jobb eller ditt konto.</p>
            <button className="button button-primary" type="button" onClick={() => setShowHelp(false)}>Stäng</button>
          </section>
        </div>
      )}
    </div>
  );
}
