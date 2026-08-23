// components/Listings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';
import { Store, uid, todayISO, addDays, fmtDate } from '../utils/storage';

const Listings = () => {
  const { appState, updateAppState } = useAppState();
  const { offers = [], events = [], profile, currentView } = appState;
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(true);
  const [editingKind, setEditingKind] = useState('offer');
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);

  const [formData, setFormData] = useState({
    title: 'Flat 20% Off — Weekday Special',
    description: 'Get 20% off on your total bill Monday through Thursday between 12pm and 4pm.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    active: true,
    discount: '20% OFF',
    category: 'Discount',
    from: todayISO(),
    to: addDays(14),
    date: addDays(3),
    time: '19:00',
    evCategory: 'Live music',
    price: 'Free',
    seats: 30
  });

  useEffect(() => {
    window.openListingEditor = (kind, id) => openEditor(kind, id);
  }, [offers, events]);

  const statusOfListing = (item, kind) => {
    const today = todayISO();
    if (!item.active) return 'ended';
    if (kind === 'offer') {
      if (item.to && item.to < today) return 'ended';
      if (item.from && item.from > today) return 'scheduled';
      return 'live';
    }
    if (item.date < today) return 'ended';
    if (item.date === today) return 'live';
    return 'scheduled';
  };

  const openEditor = (kind, id) => {
    setEditingKind(kind);
    setEditingId(id || null);
    const item = id ? (kind === 'offer' ? offers : events).find(x => x.id === id) : null;
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        image: item.image || '',
        active: item.active !== undefined ? item.active : true,
        discount: item.discount || '',
        category: item.category || 'Discount',
        from: item.from || todayISO(),
        to: item.to || addDays(14),
        date: item.date || addDays(3),
        time: item.time || '19:00',
        evCategory: item.category || 'Live music',
        price: item.price || 'Free',
        seats: item.seats || 30
      });
    } else {
      setFormData({
        title: kind === 'offer' ? 'Flat 20% Off — Weekday Special' : 'Live Music & Jazz Night',
        description: kind === 'offer' ? 'Special discount for diners on all main course orders.' : 'Enjoy acoustic jazz music by local artists with gourmet tapas.',
        image: kind === 'offer' ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80',
        active: true,
        discount: '20% OFF',
        category: 'Discount',
        from: todayISO(),
        to: addDays(14),
        date: addDays(3),
        time: '19:00',
        evCategory: 'Live music',
        price: 'Free Entry',
        seats: 35
      });
    }
    setEditorOpen(true);
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const saveListing = async () => {
    const kind = editingKind;
    const title = formData.title.trim();
    if (!title) {
      if (window.showToast) window.showToast('Please enter a ' + (kind === 'offer' ? 'title' : 'event name'), 'error');
      return;
    }

    if (kind === 'offer') {
      const payload = {
        title,
        description: formData.description.trim(),
        discount: formData.discount.trim(),
        category: formData.category,
        from: formData.from || todayISO(),
        to: formData.to || addDays(14),
        image: formData.image.trim(),
        active: formData.active
      };
      let newOffers;
      if (editingId) {
        const idx = offers.findIndex(o => o.id === editingId);
        newOffers = [...offers];
        newOffers[idx] = { ...offers[idx], ...payload };
        if (window.showToast) window.showToast('Offer updated successfully!', 'success');
      } else {
        newOffers = [{ id: uid(), views: 0, ...payload }, ...offers];
        if (window.showToast) window.showToast('Offer posted — now live on your venue page!', 'success');
      }
      updateAppState({ offers: newOffers });
      await Store.set('offers:' + appState.session.userId, newOffers);
    } else {
      const seats = parseInt(formData.seats) || 10;
      const payload = {
        title,
        description: formData.description.trim(),
        date: formData.date || addDays(3),
        time: formData.time || '19:00',
        category: formData.evCategory,
        price: formData.price.trim() || 'Free',
        seats,
        image: formData.image.trim(),
        active: formData.active
      };
      let newEvents;
      if (editingId) {
        const idx = events.findIndex(e => e.id === editingId);
        newEvents = [...events];
        newEvents[idx] = { ...events[idx], ...payload };
        if (window.showToast) window.showToast('Event updated successfully!', 'success');
      } else {
        newEvents = [{ id: uid(), booked: 0, views: 0, ...payload }, ...events];
        if (window.showToast) window.showToast('Event published successfully!', 'success');
      }
      updateAppState({ events: newEvents });
      await Store.set('events:' + appState.session.userId, newEvents);
    }
    setEditingId(null);
  };

  const removeListing = (kind, id) => {
    const item = (kind === 'offer' ? offers : events).find(x => x.id === id);
    if (!item) return;
    if (window.openConfirm) {
      window.openConfirm('Delete this ' + kind + '?', '"' + item.title + '" will be removed from your venue page.', async () => {
        if (kind === 'offer') {
          const newOffers = offers.filter(x => x.id !== id);
          updateAppState({ offers: newOffers });
          await Store.set('offers:' + appState.session.userId, newOffers);
        } else {
          const newEvents = events.filter(x => x.id !== id);
          updateAppState({ events: newEvents });
          await Store.set('events:' + appState.session.userId, newEvents);
        }
        if (window.showToast) window.showToast((kind === 'offer' ? 'Offer' : 'Event') + ' deleted', 'success');
      });
    }
  };

  // Filter listings
  const q = search.toLowerCase();
  let combined = offers.map(o => ({ item: o, kind: 'offer' }))
    .concat(events.map(e => ({ item: e, kind: 'event' })));
  combined = combined.filter(x => (x.item.title || '').toLowerCase().includes(q));
  if (typeFilter !== 'all') combined = combined.filter(x => x.kind === typeFilter);
  if (statusFilter !== 'all') combined = combined.filter(x => statusOfListing(x.item, x.kind) === statusFilter);

  // Draft item for real-time live preview
  const draftItem = editingKind === 'offer' ? {
    title: formData.title,
    description: formData.description,
    discount: formData.discount,
    category: formData.category,
    from: formData.from || todayISO(),
    to: formData.to || addDays(14),
    image: formData.image,
    active: formData.active,
    views: 142
  } : {
    title: formData.title,
    description: formData.description,
    date: formData.date || addDays(3),
    time: formData.time || '19:00',
    category: formData.evCategory,
    price: formData.price || 'Free',
    seats: parseInt(formData.seats) || 0,
    booked: 0,
    image: formData.image,
    active: formData.active
  };

  const renderCardJSX = (item, kind, isPreview = false) => {
    const status = statusOfListing(item, kind);
    const pillClass = status === 'live' ? 'pill-live' : status === 'scheduled' ? 'pill-scheduled' : 'pill-ended';
    const isOffer = kind === 'offer';
    const bannerStyle = item.image ? { backgroundImage: `url('${item.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
    const bigLabel = isOffer ? (item.discount || '') : (item.price || 'Free');

    const seats = item.seats || 0;
    const booked = item.booked || 0;
    const pct = seats ? Math.min(100, Math.round((booked / seats) * 100)) : 0;
    const isBeingEdited = editingId === item.id;

    return (
      <div
        key={item.id || 'preview'}
        className="item-card"
        style={isBeingEdited ? { border: '2px solid var(--mustard)', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' } : {}}
      >
        <div className={`item-banner ${isOffer ? '' : 'evt'}`} style={bannerStyle}>
          <span className="kind-badge">{isOffer ? 'Offer' : 'Event'}</span>
          <div className="tag-ic" dangerouslySetInnerHTML={{ __html: ic(isOffer ? 'tag' : 'calendar') }} />
          <span className={`status pill ${pillClass}`}>{status}</span>
          <div className="disc" style={isOffer ? {} : { fontSize: '15px' }}>{bigLabel}</div>
        </div>
        <div className="item-body">
          <h4>{item.title || (isOffer ? 'Your offer title' : 'Your event name')}</h4>
          <p>{item.description || 'No description added.'}</p>
          <div className="item-meta">
            <span>
              <span dangerouslySetInnerHTML={{ __html: ic('clock') }} />{' '}
              {isOffer ? `${fmtDate(item.from)} – ${fmtDate(item.to)}` : `${fmtDate(item.date)}, ${item.time || ''}`}
            </span>
            <span>
              <span dangerouslySetInnerHTML={{ __html: ic(isOffer ? 'eye' : 'users') }} />{' '}
              {isOffer ? `${item.views || 120} views` : item.category || ''}
            </span>
          </div>

          {!isOffer && (
            <div className="progress-wrap">
              <div className="progress-labels">
                <span>{booked} of {seats} tables booked</span>
                <span>{pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {!isPreview && (
            <div className="item-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => openEditor(kind, item.id)}>
                <span dangerouslySetInnerHTML={{ __html: ic('edit') }} /> {isBeingEdited ? 'Editing...' : 'Edit on Side'}
              </button>
              <button className="btn btn-danger-ghost btn-sm" onClick={() => removeListing(kind, item.id)}>
                <span dangerouslySetInnerHTML={{ __html: ic('trash') }} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className={`view ${currentView === 'listings' ? 'active' : ''}`} id="view-listings">
      <div className="row-between">
        <div>
          <h1>Offers &amp; Events Workspace</h1>
          <p className="sub">Create and edit promotions with live real-time preview — diners see both instantly on your venue page.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => openEditor('offer')}>
            <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> New offer
          </button>
          <button className="btn btn-mustard" onClick={() => openEditor('event')}>
            <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> New event
          </button>
        </div>
      </div>

      {/* Real-time Side-by-Side Editor & Live Preview Panel */}
      {editorOpen && (
        <div className="card listing-editor" id="listingEditor" ref={editorRef} style={{ marginBottom: '28px', border: '1px solid var(--mustard)' }}>
          <div className="editor-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 id="editorTitle">{editingId ? 'Edit ' + editingKind : 'Create &amp; Preview ' + (editingKind === 'offer' ? 'Offer / Ad' : 'Event')}</h3>
                <span className="pill pill-live" style={{ fontSize: '10.5px' }}>Live Side-by-Side Mode</span>
              </div>
              <p className="sub" style={{ margin: '2px 0 0' }}>Type any details on the left — the preview card on the right updates <b>live on every keystroke</b>.</p>
            </div>
            <button className="icon-btn" onClick={closeEditor} title="Hide Editor">
              <span dangerouslySetInnerHTML={{ __html: ic('x') }} />
            </button>
          </div>

          <div className="editor-type-toggle" id="editorTypeToggle" style={{ opacity: editingId ? 0.7 : 1 }}>
            <button className={`type-tab ${editingKind === 'offer' ? 'active' : ''}`} onClick={() => { setEditingKind('offer'); if (!editingId) openEditor('offer'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('tag') }} /> Offer / Ad
            </button>
            <button className={`type-tab ${editingKind === 'event' ? 'active' : ''}`} onClick={() => { setEditingKind('event'); if (!editingId) openEditor('event'); }}>
              <span dangerouslySetInnerHTML={{ __html: ic('calendar') }} /> Event
            </button>
          </div>

          <div className="editor-grid">
            <div className="editor-form">
              <div className="field">
                <label id="lsTitleLabel">{editingKind === 'offer' ? 'Offer Title' : 'Event Name'}</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={editingKind === 'offer' ? 'e.g. Flat 20% off on weekday lunch' : 'e.g. Live Acoustic Night'}
                />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details diners should know..."
                />
              </div>

              {editingKind === 'offer' && (
                <>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Discount Badge Text</label>
                      <input
                        value={formData.discount}
                        onChange={e => setFormData({ ...formData, discount: e.target.value })}
                        placeholder="e.g. 20% OFF or Buy 1 Get 1"
                      />
                    </div>
                    <div className="field">
                      <label>Category</label>
                      <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                        <option>Discount</option>
                        <option>Combo deal</option>
                        <option>Happy hour</option>
                        <option>Festive special</option>
                        <option>Buffet</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Valid from</label>
                      <input type="date" value={formData.from} onChange={e => setFormData({ ...formData, from: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Valid until</label>
                      <input type="date" value={formData.to} onChange={e => setFormData({ ...formData, to: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {editingKind === 'event' && (
                <>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Event Date</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Event Time</label>
                      <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Event Category</label>
                      <select value={formData.evCategory} onChange={e => setFormData({ ...formData, evCategory: e.target.value })}>
                        <option>Live music</option>
                        <option>Tasting menu</option>
                        <option>Festive special</option>
                        <option>Stand-up</option>
                        <option>Themed night</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Entry / Ticket Charge</label>
                      <input
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Free Entry, or e.g. ₹499"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Total Tables / Seats Available</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.seats}
                      onChange={e => setFormData({ ...formData, seats: e.target.value })}
                      placeholder="e.g. 40"
                    />
                  </div>
                </>
              )}

              <div className="field">
                <label>Banner Image URL</label>
                <input
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="switch-row">
                <div>
                  <div className="lbl">{editingKind === 'offer' ? 'Make offer live' : 'Publish event'}</div>
                  <div className="sub2">Off = saved as draft, hidden from diners</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                  <span className="slider-tog"></span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                {editingId && (
                  <button className="btn btn-ghost" onClick={() => openEditor(editingKind, null)}>
                    Cancel Edit
                  </button>
                )}
                <button className="btn btn-mustard" style={{ flex: 1 }} onClick={saveListing}>
                  <span dangerouslySetInnerHTML={{ __html: ic('check') }} /> {editingId ? `Update ${editingKind}` : `Publish ${editingKind}`}
                </button>
              </div>
            </div>

            <div className="editor-preview">
              <div className="preview-badge">
                <span className="preview-pulse"></span>
                <span dangerouslySetInnerHTML={{ __html: ic('eye') }} /> Real-Time Live Preview
              </div>
              <p className="preview-hint">This is exactly how diners see it on <b>{profile?.name || 'your restaurant'}'s</b> Destiny page.</p>
              <div id="listingPreviewCard">
                {renderCardJSX(draftItem, editingKind, true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Items Grid */}
      <div className="row-between" style={{ margin: '16px 0 12px' }}>
        <h3>Your Published Offers &amp; Events</h3>
        {!editorOpen && (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(true)}>
            <span dangerouslySetInnerHTML={{ __html: ic('edit') }} /> Open Side-by-Side Editor
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span dangerouslySetInnerHTML={{ __html: ic('search') }} />
          <input placeholder="Search offers & events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chip-group" id="listingTypeChips">
          <button className={`chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`chip ${typeFilter === 'offer' ? 'active' : ''}`} onClick={() => setTypeFilter('offer')}>Offers</button>
          <button className={`chip ${typeFilter === 'event' ? 'active' : ''}`} onClick={() => setTypeFilter('event')}>Events</button>
        </div>
        <div className="chip-group" id="listingStatusChips">
          <button className={`chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Any status</button>
          <button className={`chip ${statusFilter === 'live' ? 'active' : ''}`} onClick={() => setStatusFilter('live')}>Live</button>
          <button className={`chip ${statusFilter === 'scheduled' ? 'active' : ''}`} onClick={() => setStatusFilter('scheduled')}>Scheduled</button>
          <button className={`chip ${statusFilter === 'ended' ? 'active' : ''}`} onClick={() => setStatusFilter('ended')}>Ended</button>
        </div>
      </div>

      <div id="listingsContainer">
        {combined.length === 0 ? (
          <div className="empty-state">
            <div className="ic" dangerouslySetInnerHTML={{ __html: ic('tag') }} />
            <h3>Nothing here yet</h3>
            <p>Post an offer or create an event — both appear on your venue page instantly.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => openEditor('offer')}>
                <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> New offer
              </button>
              <button className="btn btn-mustard" onClick={() => openEditor('event')}>
                <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> New event
              </button>
            </div>
          </div>
        ) : (
          <div className="cards-grid">
            {combined.map(x => renderCardJSX(x.item, x.kind, false))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Listings;