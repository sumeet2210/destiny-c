// components/Menu.jsx
import React, { useState, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';
import { Store, uid } from '../utils/storage';

const MENU_CAT_COLORS = { Starters: '#22C55E', Mains: '#E8B94D', Breads: '#D2914E', Desserts: '#9B8CFB', Drinks: '#2DD4BF', Specials: '#FF6B61' };

const Menu = () => {
  const { appState, updateAppState } = useAppState();
  const { menu = [], profile, currentView } = appState;
  const [catFilter, setCatFilter] = useState('All');
  const [dietFilter, setDietFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    desc: '',
    category: 'Starters',
    type: 'Veg',
    offer: '',
    available: true,
    image: ''
  });
  const fileInputRef = useRef(null);

  const q = search.toLowerCase();
  let allDishes = menu.filter(d => (d.name || '').toLowerCase().includes(q));
  if (dietFilter !== 'All') allDishes = allDishes.filter(d => d.type === dietFilter);
  const list = catFilter === 'All' ? allDishes : allDishes.filter(d => d.category === catFilter);

  const availableCount = menu.filter(d => d.available !== false).length;
  const prices = menu.map(d => parseFloat(d.price) || 0).filter(p => p > 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const catsUsed = new Set(menu.map(d => d.category)).size;

  const openDishForm = (id) => {
    setEditingDishId(id || null);
    const d = id ? menu.find(x => x.id === id) : null;
    setFormData({
      name: d?.name || '',
      price: d?.price || '',
      desc: d?.desc || '',
      category: d?.category || 'Starters',
      type: d?.type || 'Veg',
      offer: d?.offer || '',
      available: d?.available !== false,
      image: d?.image || ''
    });
    setDishModalOpen(true);
  };

  const closeDishForm = () => {
    setDishModalOpen(false);
    setEditingDishId(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveDish = async () => {
    const name = formData.name.trim();
    if (!name) { if (window.showToast) window.showToast('Please enter a dish name', 'error'); return; }
    const payload = {
      name,
      price: formData.price.trim() || '0',
      desc: formData.desc.trim(),
      category: formData.category,
      type: formData.type,
      offer: formData.offer.trim(),
      available: formData.available,
      image: formData.image || ''
    };
    let newMenu;
    if (editingDishId) {
      const idx = menu.findIndex(d => d.id === editingDishId);
      newMenu = [...menu];
      newMenu[idx] = { ...menu[idx], ...payload };
      if (window.showToast) window.showToast('Dish updated', 'success');
    } else {
      newMenu = [{ id: uid(), ...payload }, ...menu];
      if (window.showToast) window.showToast('Dish added to menu', 'success');
    }
    updateAppState({ menu: newMenu });
    await Store.set('menu:' + appState.session.userId, newMenu);
    closeDishForm();
  };

  const removeDish = (id) => {
    const d = menu.find(x => x.id === id);
    if (!d) return;
    if (window.openConfirm) {
      window.openConfirm('Remove "' + d.name + '"?', 'This dish will be removed from your menu.', async () => {
        const newMenu = menu.filter(x => x.id !== id);
        updateAppState({ menu: newMenu });
        await Store.set('menu:' + appState.session.userId, newMenu);
        if (window.showToast) window.showToast('Dish removed', 'success');
      });
    }
  };

  const cats = ['Starters', 'Mains', 'Breads', 'Desserts', 'Drinks', 'Specials'];
  const grouped = {};
  list.forEach(d => { if (!grouped[d.category]) grouped[d.category] = []; grouped[d.category].push(d); });
  const catOrder = catFilter === 'All' ? cats.filter(c => grouped[c] && grouped[c].length) : [catFilter];

  const buildMenuHtml = () => {
    const p = profile || {};
    const availDishes = menu.filter(d => d.available !== false);
    const grp = {};
    availDishes.forEach(d => { if (!grp[d.category]) grp[d.category] = []; grp[d.category].push(d); });
    const usedCats = cats.filter(c => grp[c] && grp[c].length);
    const ink = '#2B2417';
    const gold = '#B67D1A';
    const goldSoft = '#C9A85E';
    const rule = '#E4D6B8';
    const monogram = (p.name || 'D').trim().slice(0, 1).toUpperCase();

    const vegBox = (type) => {
      const col = type === 'Veg' ? '#1E7A3E' : type === 'Vegan' ? '#1B7A82' : '#A13A2E';
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border:1.6px solid ${col};border-radius:3px;flex-shrink:0;margin-top:3px;"><span style="display:block;width:5px;height:5px;background:${col};border-radius:50%;"></span></span>`;
    };

    let html = `<div style="text-align:center;padding-bottom:26px;">
      <div style="width:54px;height:54px;border-radius:50%;border:1.5px solid ${gold};display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:${gold};">${monogram}</div>
      <div style="font-family:'Fraunces',serif;font-size:36px;font-weight:700;color:${ink};letter-spacing:-0.3px;">${p.name || 'Our Menu'}</div>
      ${p.cuisine ? `<div style="font-size:11.5px;color:${gold};margin-top:8px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;">${p.cuisine}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:5px;font-size:11.5px;color:#8A7A5A;">
        ${p.address ? `<span>${p.address}</span>` : ''}
        ${p.address && p.phone ? '<span>·</span>' : ''}
        ${p.phone ? `<span>${p.phone}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;">
        <span style="width:60px;height:1px;background:${rule};"></span>
        <span style="color:${goldSoft};font-size:11px;">✦</span>
        <span style="width:60px;height:1px;background:${rule};"></span>
      </div></div>`;

    if (usedCats.length === 0) {
      html += `<div style="text-align:center;padding:48px 20px;color:#9A8B6A;font-size:13.5px;">No dishes added yet.</div>`;
    } else {
      usedCats.forEach(cat => {
        html += `<div style="margin-top:30px;page-break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <span style="color:${goldSoft};font-size:10px;">❖</span>
            <span style="font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:${ink};letter-spacing:0.16em;text-transform:uppercase;">${cat}</span>
            <span style="height:1px;flex:1;background:${rule};"></span>
          </div>
          ${grp[cat].map(d => `
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:18px;page-break-inside:avoid;">
              <div style="display:flex;gap:10px;align-items:flex-start;flex:1;">
                ${vegBox(d.type)}
                <div style="flex:1;">
                  ${d.image ? `<div style="width:100%;max-width:220px;height:120px;margin:6px 0 10px;border-radius:8px;overflow:hidden;border:1px solid #E4D6B8;box-shadow:0 2px 8px rgba(0,0,0,0.06);"><img src="${d.image}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" /></div>` : ''}
                  <span style="font-size:14px;font-weight:700;color:${ink};">${d.name}</span>
                  ${d.desc ? `<div style="font-size:11px;color:#8A7A5A;margin-top:2px;font-style:italic;">${d.desc}</div>` : ''}
                  ${d.offer ? `<div style="font-size:10.5px;color:${gold};margin-top:4px;font-weight:700;">★ ${d.offer}</div>` : ''}
                </div>
              </div>
              <span style="flex:1;border-bottom:1.5px dotted ${rule};transform:translateY(-4px);min-width:20px;"></span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:14.5px;font-weight:700;color:${ink};">₹${d.price}</span>
            </div>
          `).join('')}
        </div>`;
      });
    }

    html += `<div style="margin-top:40px;text-align:center;padding-top:22px;">
      <div style="font-size:11px;color:#8A7A5A;letter-spacing:0.14em;text-transform:uppercase;">Thank you for dining with us</div>
      <div style="font-size:9.5px;color:#C4B79A;letter-spacing:0.16em;text-transform:uppercase;margin-top:14px;">Curated on Destiny</div>
    </div>`;
    return html;
  };

  const downloadMenu = () => {
    const content = buildMenuHtml();
    const p = profile || {};
    const printWin = window.open('', '_blank', 'width=800,height=900');
    printWin.document.write(`<!DOCTYPE html><html><head><title>${p.name || 'Menu'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#FFF8F0;padding:48px 40px;max-width:680px;margin:auto;color:#2B2417;}@media print{body{padding:28px;background:#fff;}}</style>
      </head><body>${content}</body></html>`);
    printWin.document.close();
    printWin.onload = function () { printWin.focus(); printWin.print(); };
  };

  return (
    <section className={`view ${currentView === 'menu' ? 'active' : ''}`} id="view-menu">
      <div className="row-between">
        <div>
          <h1>Menu Card</h1>
          <p className="sub">Add and manage your dishes. Diners see your menu; you can download a premium print-ready card.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setPreviewOpen(true)}>
            <span dangerouslySetInnerHTML={{ __html: ic('eye') }} /> Preview &amp; Download
          </button>
          <button className="btn btn-mustard" onClick={() => openDishForm()}>
            <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Add dish
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card">
          <div className="stat-top"><div className="stat-ic" style={{ background: 'rgba(34,197,94,0.16)', color: '#22C55E' }} dangerouslySetInnerHTML={{ __html: ic('menu_card') }} /></div>
          <div className="stat-num">{menu.length}</div>
          <div className="stat-label">Total dishes</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><div className="stat-ic" style={{ background: 'var(--teal-pale)', color: 'var(--teal)' }} dangerouslySetInnerHTML={{ __html: ic('check') }} /></div>
          <div className="stat-num">{availableCount}</div>
          <div className="stat-label">Available now</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><div className="stat-ic" style={{ background: 'var(--gold-pale)', color: 'var(--gold)' }} dangerouslySetInnerHTML={{ __html: ic('tag') }} /></div>
          <div className="stat-num">{catsUsed}</div>
          <div className="stat-label">Categories used</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><div className="stat-ic" style={{ background: 'rgba(155,140,251,0.16)', color: '#9B8CFB' }} dangerouslySetInnerHTML={{ __html: ic('star') }} /></div>
          <div className="stat-num">{avgPrice ? '₹' + avgPrice : '—'}</div>
          <div className="stat-label">Average price</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: '18px' }}>
        <div className="search-box">
          <span dangerouslySetInnerHTML={{ __html: ic('search') }} />
          <input placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chip-group">
          <button className={`chip ${dietFilter === 'All' ? 'active' : ''}`} onClick={() => setDietFilter('All')}>All types</button>
          <button className={`chip ${dietFilter === 'Veg' ? 'active' : ''}`} onClick={() => setDietFilter('Veg')}>🟢 Veg</button>
          <button className={`chip ${dietFilter === 'Non-Veg' ? 'active' : ''}`} onClick={() => setDietFilter('Non-Veg')}>🔴 Non-Veg</button>
          <button className={`chip ${dietFilter === 'Vegan' ? 'active' : ''}`} onClick={() => setDietFilter('Vegan')}>🔵 Vegan</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="chip-group">
          <button className={`chip ${catFilter === 'All' ? 'active' : ''}`} onClick={() => setCatFilter('All')}>All categories</button>
          {cats.map(c => (
            <button key={c} className={`chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div id="menuContainer">
        {menu.length === 0 ? (
          <div className="empty-state">
            <div className="ic" dangerouslySetInnerHTML={{ __html: ic('menu_card') }} />
            <h3>Your menu is empty</h3>
            <p>Add your first dish to start building your menu card. It only takes a few seconds.</p>
            <button className="btn btn-mustard" onClick={() => openDishForm()}>
              <span dangerouslySetInnerHTML={{ __html: ic('plus') }} /> Add first dish
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="ic" dangerouslySetInnerHTML={{ __html: ic('search') }} />
            <h3>No dishes match</h3>
            <p>Try a different search term or filter.</p>
          </div>
        ) : (
          catOrder.map(cat => {
            const items = grouped[cat] || [];
            if (!items.length) return null;
            const catColor = MENU_CAT_COLORS[cat] || 'var(--mustard)';
            return (
              <div key={cat} className="menu-cat-block">
                <div className="menu-cat-header">
                  <h3>
                    <span className="menu-cat-dot" style={{ background: catColor }} />
                    {cat}
                  </h3>
                  <span className="muted" style={{ fontSize: '12px' }}>{items.length} item{items.length === 1 ? '' : 's'}</span>
                </div>
                <div className="menu-items-grid">
                  {items.map(d => {
                    const vegColor = d.type === 'Veg' ? '#22C55E' : d.type === 'Vegan' ? '#2DD4BF' : '#FF6B61';
                    return (
                      <div key={d.id} className={`menu-item-card ${d.available === false ? 'menu-item-unavail' : ''}`} style={{ borderLeft: `3px solid ${catColor}` }}>
                        <div className="menu-item-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span className="veg-dot" style={{ borderColor: vegColor }}>
                              <span style={{ background: vegColor }} />
                            </span>
                            <span className="menu-item-name">{d.name}</span>
                            {d.available === false && <span className="pill pill-ended" style={{ fontSize: '10px', padding: '2px 7px' }}>Unavailable</span>}
                          </div>
                          <span className="menu-item-price">₹{d.price}</span>
                        </div>
                        {d.image && (
                          <div className="menu-item-image">
                            <img src={d.image} alt={d.name} />
                          </div>
                        )}
                        {d.desc && <p className="menu-item-desc">{d.desc}</p>}
                        {d.offer && (
                          <div className="menu-item-offer">
                            <span dangerouslySetInnerHTML={{ __html: ic('tag') }} /> {d.offer}
                          </div>
                        )}
                        <div className="menu-item-foot">
                          <button className="btn btn-ghost btn-sm" onClick={() => openDishForm(d.id)}>
                            <span dangerouslySetInnerHTML={{ __html: ic('edit') }} /> Edit
                          </button>
                          <button className="btn btn-danger-ghost btn-sm" onClick={() => removeDish(d.id)}>
                            <span dangerouslySetInnerHTML={{ __html: ic('trash') }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dish Modal */}
      {dishModalOpen && (
        <div className="modal-overlay open" id="dishModal">
          <div className="modal">
            <div className="modal-head">
              <h3>{editingDishId ? 'Edit dish' : 'Add dish'}</h3>
              <button className="icon-btn" onClick={closeDishForm}>
                <span dangerouslySetInnerHTML={{ __html: ic('x') }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid2">
                <div className="field"><label>Dish name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Paneer Tikka" /></div>
                <div className="field"><label>Price (₹)</label><input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="299" /></div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows="2" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} placeholder="Short description for the menu..." />
              </div>
              <div className="form-grid2">
                <div className="field">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option>Starters</option>
                    <option>Mains</option>
                    <option>Breads</option>
                    <option>Desserts</option>
                    <option>Drinks</option>
                    <option>Specials</option>
                  </select>
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Veg</option>
                    <option>Non-Veg</option>
                    <option>Vegan</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Dish Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} style={{ flex: 1 }} />
                  {formData.image && (
                    <button className="btn btn-sm btn-ghost" onClick={() => setFormData({ ...formData, image: '' })}>Clear</button>
                  )}
                </div>
                {formData.image && (
                  <div style={{ marginTop: '8px', width: '100%', maxWidth: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={formData.image} alt="Dish preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div className="field">
                <label>Offer / Discount on this item (optional)</label>
                <input value={formData.offer} onChange={e => setFormData({ ...formData, offer: e.target.value })} placeholder="e.g. Buy 1 Get 1, 15% off, Chef's special" />
              </div>
              <div className="switch-row">
                <div>
                  <div className="lbl">Available today</div>
                  <div className="sub2">Switch off to temporarily hide from menu</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} />
                  <span className="slider-tog"></span>
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={closeDishForm}>Cancel</button>
              <button className="btn btn-mustard" onClick={saveDish}>
                <span dangerouslySetInnerHTML={{ __html: ic('check') }} /> Save dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Preview Modal */}
      {previewOpen && (
        <div className="modal-overlay open" id="menuPreviewModal" style={{ zIndex: 150, padding: 0, alignItems: 'stretch' }}>
          <div style={{ background: '#FFF8F0', width: '100%', maxWidth: '700px', margin: 'auto', minHeight: '100vh', position: 'relative', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,248,240,0.92)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #E8DCC8' }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: '17px', fontWeight: 600, color: '#3A3120' }}>Menu Preview</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-mustard btn-sm" onClick={downloadMenu}>
                  <span dangerouslySetInnerHTML={{ __html: ic('download') }} /> Download PDF
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOpen(false)}>
                  <span dangerouslySetInnerHTML={{ __html: ic('x') }} /> Close
                </button>
              </div>
            </div>
            <div id="menuCardContent" style={{ padding: '32px 28px 48px' }} dangerouslySetInnerHTML={{ __html: buildMenuHtml() }} />
          </div>
        </div>
      )}
    </section>
  );
};

export default Menu;