// components/Sidebar.jsx
import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';

const Sidebar = () => {
  const { appState, updateAppState, setCurrentView } = useAppState();
  const { session, profile, currentView, bookings = [] } = appState;

  const handleLogout = async () => {
    const { Store } = await import('../utils/storage');
    updateAppState({ session: null });
    await Store.set('session', null);
    window.location.reload();
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const planName = profile?.subscriptionPlan || 'Growth Partner';

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sb-brand">
        <span className="dot"></span> destiny <span style={{ color: 'var(--mustard)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Partners</span>
      </div>

      <div className="sb-store">
        <div className="avatar" id="sbAvatar">{profile?.name?.slice(0, 1).toUpperCase() || 'R'}</div>
        <div className="meta">
          <b id="sbStoreName" style={{ fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            {profile?.name || 'Your Venue'}
          </b>
          <span id="sbStorePlan" style={{ color: 'var(--mustard-deep)', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ✨ {planName}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
            Live on Destiny
          </span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>App Active</span>
        </div>
      </div>

      <div className="nav-group">
        <button className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
          <span dangerouslySetInnerHTML={{ __html: ic('home') }} />
          <span>Dashboard Overview</span>
        </button>
        <button className={`nav-item ${currentView === 'listings' ? 'active' : ''}`} onClick={() => setCurrentView('listings')}>
          <span dangerouslySetInnerHTML={{ __html: ic('tag') }} />
          <span>Offers &amp; Events</span>
        </button>
        <button className={`nav-item ${currentView === 'bookings' ? 'active' : ''}`} onClick={() => setCurrentView('bookings')}>
          <span dangerouslySetInnerHTML={{ __html: ic('list') }} />
          <span>Table Bookings</span>
          {pendingCount > 0 && <span className="nav-badge" id="pendingBadge">{pendingCount}</span>}
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">Analytics &amp; Growth</div>
        <button className={`nav-item ${currentView === 'insights' ? 'active' : ''}`} onClick={() => setCurrentView('insights')}>
          <span dangerouslySetInnerHTML={{ __html: ic('chart') }} />
          <span>Diner Insights</span>
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">Culinary &amp; Profile</div>
        <button className={`nav-item ${currentView === 'menu' ? 'active' : ''}`} onClick={() => setCurrentView('menu')}>
          <span dangerouslySetInnerHTML={{ __html: ic('menu_card') }} />
          <span>Menu Card Manager</span>
        </button>
        <button className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setCurrentView('profile')}>
          <span dangerouslySetInnerHTML={{ __html: ic('store') }} />
          <span id="sbProfileLink">Venue &amp; AI Engine Profile</span>
        </button>
      </div>

      <div className="sidebar-foot">
        <button className="nav-item" onClick={handleLogout}>
          <span dangerouslySetInnerHTML={{ __html: ic('logout') }} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;