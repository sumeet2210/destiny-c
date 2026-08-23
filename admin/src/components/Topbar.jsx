// components/Topbar.jsx
import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';

const Topbar = () => {
  const { appState, setCurrentView } = useAppState();
  const { profile, currentView } = appState;

  const titles = {
    dashboard: ['Culinary Overview', 'Real-time footfall, active promotions, and table booking performance'],
    listings: ['Offers & Events Workspace', 'Create enticing discounts and live events with real-time side-by-side preview'],
    bookings: ['Reservation Desk', 'Seamless table reservations linked directly to your active offers and events'],
    insights: ['Diner Intelligence & Analytics', 'Deep analytics on diner demographics, peak reservation hours, and top culinary offerings'],
    profile: ['Venue & AI Recommendation Engine Profile', 'Customize your venue parameters, ambiance tags, and subscription growth plan'],
    menu: ['Curated Menu Card', 'Build a digital menu card with dietary badges and instant print-ready PDF export']
  };

  const [title, sub] = titles[currentView] || ['Dashboard', ''];

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="icon-btn hamburger" onClick={() => document.getElementById('sidebar').classList.toggle('open')}>
          <span dangerouslySetInnerHTML={{ __html: ic('menu') }} />
        </button>
        <div>
          <h2 id="topTitle" style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', letterSpacing: '-0.2px' }}>{title}</h2>
          <div className="path" id="topSub" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</div>
        </div>
      </div>
      <div className="top-actions">
        <div
          onClick={() => setCurrentView('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--mustard-pale)', border: '1px solid rgba(232,185,77,0.3)', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '11px', color: 'var(--mustard-deep)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ✦ {profile?.subscriptionPlan || 'Growth Partner'}
          </span>
        </div>

        <button className="icon-btn" title="Notifications">
          <span dangerouslySetInnerHTML={{ __html: ic('bell') }} />
          <span className="ping" id="notifPing"></span>
        </button>

        <div className="top-user" onClick={() => setCurrentView('profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar" id="topAvatar">{profile?.name?.slice(0, 1).toUpperCase() || 'R'}</div>
          <span id="topUserName" style={{ fontWeight: 600 }}>{profile?.name || 'Owner'}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;