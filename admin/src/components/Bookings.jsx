// components/Bookings.jsx
import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';
import { Store, fmtDate } from '../utils/storage';

const Bookings = () => {
  const { appState, updateAppState } = useAppState();
  const { bookings = [], currentView } = appState;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();
  let list = bookings.filter(b => (b.guest || '').toLowerCase().includes(q));
  if (filter !== 'all') list = list.filter(b => b.status === filter);
  list.sort((a, b) => b.bookedOn - a.bookedOn);

  const updateBookingStatus = async (id, status) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    updateAppState({ bookings: updated });
    await Store.set('bookings:' + appState.session.userId, updated);
    if (window.showToast) window.showToast(`Booking for ${bookings.find(b => b.id === id)?.guest || 'guest'} marked ${status}`, 'success');
  };

  const exportCsv = () => {
    const rows = [['Guest Name', 'Contact Phone', 'Booked For', 'Listing Type', 'Date', 'Guest Count', 'Status']];
    bookings.forEach(b => rows.push([b.guest, b.phone, b.linkedTitle, b.linkedType, b.date, b.guests, b.status]));
    const csv = rows.map(r => r.map(v => '"' + (v + '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'destiny_reservations.csv';
    a.click();
    if (window.showToast) window.showToast('Reservation manifest exported to CSV', 'success');
  };

  return (
    <section className={`view ${currentView === 'bookings' ? 'active' : ''}`} id="view-bookings">
      <div className="row-between">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif" }}>Reservation Desk</h1>
          <p className="sub">Every table reservation made by local diners against your active offers, tasting menus, and events.</p>
        </div>
        <button className="btn btn-ghost" onClick={exportCsv}>
          <span dangerouslySetInnerHTML={{ __html: ic('download') }} /> Export Manifest (CSV)
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span dangerouslySetInnerHTML={{ __html: ic('search') }} />
          <input placeholder="Search guest name or contact..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chip-group" id="bookingFilterChips">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Reservations</button>
          <button className={`chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>⏳ Pending</button>
          <button className={`chip ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>🟢 Confirmed</button>
          <button className={`chip ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>✨ Seated &amp; Served</button>
          <button className={`chip ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>🔴 Cancelled</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="full" id="bookingsTable">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Contact Phone</th>
              <th>Booked For</th>
              <th>Reservation Date</th>
              <th>Party Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍽️</div>
                  No reservations match this filter criteria.
                </td>
              </tr>
            ) : (
              list.map(b => (
                <tr key={b.id}>
                  <td className="name-cell">
                    <div className="ic" dangerouslySetInnerHTML={{ __html: ic('users') }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{b.guest}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{b.phone}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{b.linkedTitle}</span>{' '}
                    <span className={`pill ${b.linkedType === 'event' ? 'pill-scheduled' : 'pill-live'}`} style={{ marginLeft: '6px', fontSize: '10px' }}>
                      {b.linkedType}
                    </span>
                  </td>
                  <td>{fmtDate(b.date)}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--mustard-deep)' }}>{b.guests} Guests</span>
                  </td>
                  <td>
                    <select className="status-select" value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}>
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">🟢 Confirmed</option>
                      <option value="completed">✨ Seated &amp; Served</option>
                      <option value="cancelled">🔴 Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Bookings;