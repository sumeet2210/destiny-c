// components/Dashboard.jsx
import React, { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';
import { genSeries, fmtDate } from '../utils/storage';

const Dashboard = () => {
  const { appState, setCurrentView } = useAppState();
  const { offers = [], events = [], bookings = [], profile, currentView } = appState;

  const totalViews = offers.reduce((s, o) => s + (o.views || 120 + Math.floor(Math.random() * 40)), 0) +
                     events.reduce((s, e) => s + (e.views || 150), 0);
  const monthBookings = bookings.length;
  const activeOffers = offers.filter(o => o.active).length + events.filter(e => e.active).length;
  const avgRating = 4.3 + (bookings.length % 5) * 0.08;

  useEffect(() => {
    if (currentView !== 'dashboard') return;

    if (window.Chart) {
      // Line chart: Bookings trend
      const ctxTrend = document.getElementById('chartTrend');
      if (ctxTrend) {
        const days = 14;
        const labels = Array.from({ length: days }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        });
        const data = genSeries(days, 10, 42);

        if (appState.charts?.chartTrend) appState.charts.chartTrend.destroy();
        appState.charts.chartTrend = new window.Chart(ctxTrend, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Bookings',
              data,
              borderColor: '#22C55E',
              backgroundColor: 'rgba(34,197,94,0.13)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 2.5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: '#8D8A94' } },
              y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { font: { size: 10.5 }, color: '#8D8A94' }, beginAtZero: true }
            }
          }
        });
      }

      // Doughnut chart: Source breakdown
      const ctxSource = document.getElementById('chartSource');
      if (ctxSource) {
        const sourceData = [42, 27, 19, 12];
        const sourceLabels = ['AI App recommendation', 'Featured offer', 'Event page', 'Direct venue search'];
        const sourceColors = ['#E8B94D', '#22C55E', '#2DD4BF', '#FF6B61'];

        if (appState.charts?.chartSource) appState.charts.chartSource.destroy();
        appState.charts.chartSource = new window.Chart(ctxSource, {
          type: 'doughnut',
          data: { labels: sourceLabels, datasets: [{ data: sourceData, backgroundColor: sourceColors, borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }
        });
      }
    }
  }, [currentView, appState, offers, events, bookings]);

  const recentBookings = [...bookings].sort((a, b) => b.bookedOn - a.bookedOn).slice(0, 5);

  return (
    <section className={`view ${currentView === 'dashboard' ? 'active' : ''}`} id="view-dashboard">
      {/* Luxury Welcome Hero Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(232,185,77,0.12) 0%, rgba(34,197,94,0.08) 100%)', border: '1px solid rgba(232,185,77,0.3)', marginBottom: '20px', padding: '22px 24px' }}>
        <div className="row-between" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pill pill-live" style={{ fontSize: '11px' }}>🟢 Live Culinary Showcase</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>• AI Match Rate: 98%</span>
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', margin: '4px 0 6px', color: 'var(--ink)' }}>
              Welcome back to {profile?.name || 'Your Venue'} ✨
            </h1>
            <p className="sub" style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
              Here is your venue's real-time guest footfall, active promotions, and table reservation performance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => { setCurrentView('listings'); if (window.openListingEditor) window.openListingEditor('offer'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Post Offer
            </button>
            <button className="btn btn-mustard" onClick={() => { setCurrentView('listings'); if (window.openListingEditor) window.openListingEditor('event'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Create Event
            </button>
          </div>
        </div>
      </div>

      <div className="stat-grid" id="statGrid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-ic" style={{ background: 'var(--mustard-pale)', color: 'var(--mustard-deep)' }} dangerouslySetInnerHTML={{ __html: ic('eye') }} />
            <div className="stat-trend up" dangerouslySetInnerHTML={{ __html: ic('trendUp') + ' +18%' }} />
          </div>
          <div className="stat-num">{(1240 + totalViews).toLocaleString()}</div>
          <div className="stat-label">Profile Impressions (30d)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-ic" style={{ background: 'var(--teal-pale)', color: 'var(--teal)' }} dangerouslySetInnerHTML={{ __html: ic('calCheck') }} />
            <div className="stat-trend up" dangerouslySetInnerHTML={{ __html: ic('trendUp') + ' +9%' }} />
          </div>
          <div className="stat-num">{(monthBookings + 34).toLocaleString()}</div>
          <div className="stat-label">Table Reservations (30d)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-ic" style={{ background: 'rgba(34,197,94,0.16)', color: '#22C55E' }} dangerouslySetInnerHTML={{ __html: ic('tag') }} />
            <div className={`stat-trend ${activeOffers > 0 ? 'up' : 'down'}`}>{activeOffers > 0 ? 'Live now' : 'None live'}</div>
          </div>
          <div className="stat-num">{activeOffers}</div>
          <div className="stat-label">Active Offers &amp; Events</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-ic" style={{ background: 'rgba(155,140,251,0.16)', color: '#9B8CFB' }} dangerouslySetInnerHTML={{ __html: ic('star') }} />
            <div className="stat-trend up" dangerouslySetInnerHTML={{ __html: ic('trendUp') + ' +0.1' }} />
          </div>
          <div className="stat-num">{avgRating.toFixed(1)}</div>
          <div className="stat-label">Average Diner Rating</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <div className="card-head">
            <h3>Reservations Trend — Last 14 Days</h3>
            <span className="muted">Table &amp; event bookings</span>
          </div>
          <div style={{ height: '160px', position: 'relative' }}>
            <canvas id="chartTrend"></canvas>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Guest Discovery Channels</h3>
          </div>
          <div style={{ height: '160px', position: 'relative' }}>
            <canvas id="chartSource"></canvas>
          </div>
          <div id="sourceLegend" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            {[
              { label: 'AI App Recommendation', value: '42%', color: '#E8B94D' },
              { label: 'Featured Offer / Ad', value: '27%', color: '#22C55E' },
              { label: 'Event Showcase', value: '19%', color: '#2DD4BF' },
              { label: 'Direct Venue Search', value: '12%', color: '#FF6B61' }
            ].map((item, idx) => (
              <div key={idx} className="legend-row">
                <span className="legend-dot" style={{ background: item.color }} />
                {item.label}
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--ink)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Recent Guest Reservations</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentView('bookings')}>View Desk</button>
          </div>
          <table className="mini">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Booked For</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>No bookings yet</td>
                </tr>
              ) : (
                recentBookings.map(b => (
                  <tr key={b.id}>
                    <td className="name-cell">
                      <div className="ic" dangerouslySetInnerHTML={{ __html: ic('users') }} />
                      {b.guest}
                    </td>
                    <td>{b.linkedTitle}</td>
                    <td>{fmtDate(b.date)}</td>
                    <td><span className={`pill pill-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Quick Growth Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-mustard" style={{ justifyContent: 'flex-start' }} onClick={() => { setCurrentView('listings'); if (window.openListingEditor) window.openListingEditor('offer'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Post a new offer or promo ad
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { setCurrentView('listings'); if (window.openListingEditor) window.openListingEditor('event'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Host an upcoming culinary event
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setCurrentView('menu')}>
              <span dangerouslySetInnerHTML={{ __html: ic('menu_card') }} /> Update digital menu card
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setCurrentView('profile')}>
              <span dangerouslySetInnerHTML={{ __html: ic('store') }} /> Edit AI recommendation profile
            </button>
          </div>
          <div className="stub-divider"></div>
          <div style={{ paddingTop: '14px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
            💡 <b style={{ color: 'var(--ink)' }}>Hospitality Tip:</b> Venues with active offers &amp; rooftop vibe tags receive <b style={{ color: 'var(--mustard-deep)' }}>2.6× higher guest recommendations</b> on Destiny.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
