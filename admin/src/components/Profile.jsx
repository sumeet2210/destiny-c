// components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Store } from '../utils/storage';
import { ic } from '../utils/icons';

const AMBIANCE_OPTIONS = [
  'Romantic & Cozy', 'Family Friendly', 'Live Music', 'Rooftop Views',
  'Work Friendly', 'Party & Nightlife', 'Instagrammable', 'Pet Friendly',
  'Quiet & Relaxing', 'Late Night Dining'
];

const PLANS = [
  {
    id: 'Starter',
    name: 'Starter Plan',
    price: 'Free',
    period: 'Forever free',
    recBoost: 'Standard Rank (60%)',
    features: [
      'Basic venue profile on Destiny App',
      'Post up to 1 live offer',
      'Manual booking tracking',
      'Standard support'
    ]
  },
  {
    id: 'Growth Partner',
    name: 'Growth Partner',
    price: '₹999',
    period: 'per month',
    recommended: true,
    recBoost: 'High Priority (96%)',
    features: [
      'High priority placement in AI recommendation engine',
      'Unlimited offers & live events',
      'Print-ready Menu Card PDF generator',
      '0% commission on all table bookings',
      'Diner age & peak-hour analytics'
    ]
  },
  {
    id: 'Pro Platinum',
    name: 'Pro Platinum',
    price: '₹2,499',
    period: 'per month',
    recBoost: '#1 Top Placement (99%)',
    features: [
      'Featured #1 banner placement on Destiny App',
      'Verified Partner Gold Badge',
      'Automated WhatsApp booking alerts to guests',
      'Dedicated Account Manager',
      'All Growth Partner features included'
    ]
  }
];

const Profile = () => {
  const { appState, updateAppState } = useAppState();
  const { profile, session, currentView } = appState;

  const [formData, setFormData] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendation');

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        cuisine: profile.cuisine || 'Café & Bakery',
        cuisineOther: '',
        phone: profile.phone || '',
        address: profile.address || '',
        about: profile.about || '',
        email: profile.email || '',
        seats: profile.seats || '48',
        environment: profile.environment || 'AC',
        diet: profile.diet || 'Both (Veg & Non-Veg)',
        parking: profile.parking || 'Valet Parking',
        wifi: profile.wifi || 'Free High-Speed Wi-Fi',
        costForTwo: profile.costForTwo || '₹500 - ₹1000 (Moderate)',
        alcohol: profile.alcohol || 'Beer & Wine Only',
        outdoor: profile.outdoor || 'Yes - Rooftop & Garden',
        ambiance: profile.ambiance || ['Cozy & Warm', 'Work Friendly', 'Rooftop Views', 'Instagrammable'],
        hours: profile.hours || [],
        subscriptionPlan: profile.subscriptionPlan || 'Growth Partner',
        subscriptionStatus: profile.subscriptionStatus || 'Active'
      });
    }
  }, [profile]);

  const updateHour = (i, field, val) => {
    const newHours = [...(formData.hours || [])];
    newHours[i] = { ...newHours[i], [field]: val };
    setFormData({ ...formData, hours: newHours });
  };

  const toggleClosed = (i, closed) => {
    const newHours = [...(formData.hours || [])];
    newHours[i] = { ...newHours[i], closed };
    setFormData({ ...formData, hours: newHours });
  };

  const toggleAmbianceTag = (tag) => {
    const current = formData.ambiance || [];
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    setFormData({ ...formData, ambiance: updated });
  };

  const saveProfile = async () => {
    const cuisine = formData.cuisine === '__custom__' ? (formData.cuisineOther || 'Custom Venue') : formData.cuisine;
    const updatedProfile = {
      ...profile,
      name: (formData.name || '').trim() || profile.name,
      cuisine,
      phone: (formData.phone || '').trim(),
      address: (formData.address || '').trim(),
      about: (formData.about || '').trim(),
      seats: formData.seats,
      environment: formData.environment,
      diet: formData.diet,
      parking: formData.parking,
      wifi: formData.wifi,
      costForTwo: formData.costForTwo,
      alcohol: formData.alcohol,
      outdoor: formData.outdoor,
      ambiance: formData.ambiance,
      hours: formData.hours,
      subscriptionPlan: formData.subscriptionPlan,
      subscriptionStatus: formData.subscriptionStatus,
      surveyCompleted: true
    };
    updateAppState({ profile: updatedProfile });
    await Store.set('profile:' + session.userId, updatedProfile);
    if (window.showToast) window.showToast('Venue profile & recommendation parameters saved!', 'success');
  };

  const changePassword = async () => {
    if (!newPassword) { if (window.showToast) window.showToast('Enter a new password first', 'error'); return; }
    if (newPassword.length < 6) { if (window.showToast) window.showToast('Password must be at least 6 characters', 'error'); return; }
    const users = await Store.get('users', []);
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx > -1) {
      users[idx].password = newPassword;
      await Store.set('users', users);
    }
    setNewPassword('');
    if (window.showToast) window.showToast('Password updated successfully', 'success');
  };

  const upgradeSubscription = async (planId) => {
    const updatedProfile = {
      ...profile,
      ...formData,
      subscriptionPlan: planId,
      subscriptionStatus: 'Active'
    };
    setFormData(prev => ({ ...prev, subscriptionPlan: planId, subscriptionStatus: 'Active' }));
    updateAppState({ profile: updatedProfile });
    await Store.set('profile:' + session.userId, updatedProfile);
    setSubModalOpen(false);
    if (window.showToast) window.showToast(`Subscribed to ${planId} plan! Your recommendation rank is updated.`, 'success');
  };

  if (!profile) return null;

  const currentPlanObj = PLANS.find(p => p.id === (formData.subscriptionPlan || 'Growth Partner')) || PLANS[1];

  return (
    <section className={`view ${currentView === 'profile' ? 'active' : ''}`} id="view-profile">
      <div className="row-between">
        <div>
          <h1 id="profilePageTitle">{profile.name || 'Venue profile'}</h1>
          <p className="sub">Manage how local diners discover, view, and book your venue on Destiny.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => setSubModalOpen(true)}>
            <span dangerouslySetInnerHTML={{ __html: ic('star') }} /> Plan: {formData.subscriptionPlan || 'Growth Partner'}
          </button>
          <button className="btn btn-mustard" onClick={saveProfile}>
            <span dangerouslySetInnerHTML={{ __html: ic('check') }} /> Save changes
          </button>
        </div>
      </div>

      {/* Subscription Banner Summary */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(45,212,191,0.1) 100%)', border: '1px solid var(--mustard)', marginBottom: '20px' }}>
        <div className="row-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="stat-ic" style={{ background: 'var(--mustard-pale)', color: 'var(--mustard-deep)', width: '48px', height: '48px', fontSize: '20px' }} dangerouslySetInnerHTML={{ __html: ic('star') }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>Current Subscription: {formData.subscriptionPlan || 'Growth Partner'}</h3>
                <span className="pill pill-live">Active</span>
              </div>
              <p className="sub" style={{ margin: '3px 0 0' }}>
                AI Recommendation Rank: <b style={{ color: 'var(--ink)' }}>{currentPlanObj.recBoost}</b> • Zero commission on bookings
              </p>
            </div>
          </div>
          <button className="btn btn-mustard" onClick={() => setSubModalOpen(true)}>
            Manage / Upgrade Subscription
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="chip-group" style={{ marginBottom: '20px' }}>
        <button className={`chip ${activeTab === 'recommendation' ? 'active' : ''}`} onClick={() => setActiveTab('recommendation')}>
          🤖 Recommendation Engine Profile
        </button>
        <button className={`chip ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
          🏢 Basic Details &amp; Hours
        </button>
        <button className={`chip ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')}>
          💳 Subscription Plans
        </button>
      </div>

      {activeTab === 'recommendation' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <h3>Recommendation Features</h3>
              <span className="muted" style={{ fontSize: '12px' }}>Used by Destiny match algorithm</span>
            </div>

            <div className="form-grid2">
              <div className="field">
                <label>Restaurant Category / Cuisine</label>
                <select value={formData.cuisine} onChange={e => setFormData({ ...formData, cuisine: e.target.value })}>
                  <option>Café &amp; Bakery</option>
                  <option>Fine Dining</option>
                  <option>Casual Dining</option>
                  <option>Fast Food</option>
                  <option>Restro-Bar &amp; Pub</option>
                  <option>Rooftop Lounge</option>
                  <option>Family Restaurant</option>
                  <option>Street Food &amp; Snacks</option>
                  <option>Cloud Kitchen</option>
                  <option value="__custom__">Other (Custom type)</option>
                </select>
                {formData.cuisine === '__custom__' && (
                  <input
                    value={formData.cuisineOther}
                    onChange={e => setFormData({ ...formData, cuisineOther: e.target.value })}
                    placeholder="e.g. Microbrewery, Gelateria..."
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="field">
                <label>Total Seating Capacity</label>
                <input type="number" value={formData.seats || ''} onChange={e => setFormData({ ...formData, seats: e.target.value })} placeholder="e.g. 50" />
              </div>
            </div>

            <div className="form-grid2">
              <div className="field">
                <label>Air Conditioning (AC / Non-AC)</label>
                <select value={formData.environment} onChange={e => setFormData({ ...formData, environment: e.target.value })}>
                  <option>AC (Full Air-Conditioned)</option>
                  <option>Non-AC / Fan</option>
                  <option>Outdoor Open Air</option>
                  <option>Both AC &amp; Outdoor Seating</option>
                </select>
              </div>
              <div className="field">
                <label>Dietary Classification</label>
                <select value={formData.diet} onChange={e => setFormData({ ...formData, diet: e.target.value })}>
                  <option>Both (Veg &amp; Non-Veg)</option>
                  <option>Pure Veg</option>
                  <option>Pure Jain Available</option>
                  <option>Vegan Options</option>
                </select>
              </div>
            </div>

            <div className="form-grid2">
              <div className="field">
                <label>Parking Facilities</label>
                <select value={formData.parking} onChange={e => setFormData({ ...formData, parking: e.target.value })}>
                  <option>Valet Parking Available</option>
                  <option>Dedicated Private Parking</option>
                  <option>Street Parking</option>
                  <option>No Parking</option>
                </select>
              </div>
              <div className="field">
                <label>Free Wi-Fi &amp; Work Facilities</label>
                <select value={formData.wifi} onChange={e => setFormData({ ...formData, wifi: e.target.value })}>
                  <option>Free High-Speed Wi-Fi</option>
                  <option>Plug Points &amp; Work Friendly</option>
                  <option>No Wi-Fi</option>
                </select>
              </div>
            </div>

            <div className="form-grid2">
              <div className="field">
                <label>Avg. Cost for Two (Price Tier)</label>
                <select value={formData.costForTwo} onChange={e => setFormData({ ...formData, costForTwo: e.target.value })}>
                  <option>₹200 - ₹500 (Budget)</option>
                  <option>₹500 - ₹1000 (Moderate)</option>
                  <option>₹1000 - ₹2000 (Premium)</option>
                  <option>₹2000+ (Fine Dining)</option>
                </select>
              </div>
              <div className="field">
                <label>Alcohol &amp; Beverage License</label>
                <select value={formData.alcohol} onChange={e => setFormData({ ...formData, alcohol: e.target.value })}>
                  <option>Full Bar &amp; Cocktails</option>
                  <option>Beer &amp; Wine Only</option>
                  <option>No Alcohol Served</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Outdoor &amp; Rooftop Seating</label>
              <select value={formData.outdoor} onChange={e => setFormData({ ...formData, outdoor: e.target.value })}>
                <option>Yes - Rooftop &amp; Garden</option>
                <option>Yes - Patio / Balcony</option>
                <option>No - Indoor Only</option>
              </select>
            </div>

            <button className="btn btn-mustard" onClick={saveProfile} style={{ marginTop: '16px' }}>
              <span dangerouslySetInnerHTML={{ __html: ic('check') }} /> Save Recommendation Profile
            </button>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Ambiance &amp; Vibe Tags</h3>
            </div>
            <p className="sub" style={{ marginBottom: '14px' }}>Diners filter by these vibe tags when looking for venue recommendations.</p>
            <div className="chip-group" style={{ flexWrap: 'wrap', gap: '8px' }}>
              {AMBIANCE_OPTIONS.map(tag => {
                const isSel = (formData.ambiance || []).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`chip ${isSel ? 'active' : ''}`}
                    onClick={() => toggleAmbianceTag(tag)}
                  >
                    {isSel ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>

            <div className="stub-divider" style={{ margin: '24px 0' }}></div>

            <div className="card-head">
              <h3>Recommendation Match Preview</h3>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Destiny AI Match Score</span>
                <span className="pill pill-live" style={{ background: '#22C55E', color: '#000' }}>98% High Match</span>
              </div>
              <p className="sub2" style={{ lineHeight: 1.6 }}>
                Your venue will be recommended to diners looking for <b>{formData.cuisine || 'Café'}</b>, <b>{formData.environment}</b>, <b>{formData.wifi}</b>, and <b>{formData.parking}</b> in your area.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <h3>Basic details</h3>
            </div>
            <div className="field">
              <label>Venue name</label>
              <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact phone</label>
              <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="field">
              <label>Address</label>
              <input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street, area, city" />
            </div>
            <div className="field">
              <label>About your venue</label>
              <textarea rows="4" value={formData.about || ''} onChange={e => setFormData({ ...formData, about: e.target.value })} placeholder="Tell diners what makes your place special..." />
            </div>
            <div className="field">
              <label>Account email</label>
              <input value={formData.email || ''} disabled style={{ background: '#F4F1EA', color: 'var(--muted)' }} />
            </div>
            <button className="btn btn-mustard" onClick={saveProfile}>
              <span dangerouslySetInnerHTML={{ __html: ic('check') }} /> Save basic details
            </button>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Opening hours</h3>
            </div>
            <div id="hoursList" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {formData.hours && formData.hours.map((h, i) => (
                <div key={h.day || i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '38px', fontSize: '12.5px', fontWeight: 700 }}>{h.day}</span>
                  <input type="time" value={h.open || ''} disabled={h.closed} style={{ width: '100px', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px' }} onChange={e => updateHour(i, 'open', e.target.value)} />
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>to</span>
                  <input type="time" value={h.close || ''} disabled={h.closed} style={{ width: '100px', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px' }} onChange={e => updateHour(i, 'close', e.target.value)} />
                  <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                    <input type="checkbox" checked={!!h.closed} onChange={e => toggleClosed(i, e.target.checked)} /> Closed
                  </label>
                </div>
              ))}
            </div>

            <div className="stub-divider"></div>
            <div className="card-head">
              <h3>Security</h3>
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
            </div>
            <button className="btn btn-ghost btn-block" onClick={changePassword}>Update password</button>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>Partner Subscription Plans</h2>
            <p className="sub">Upgrade your subscription to boost your AI recommendation ranking and get featured on Destiny.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {PLANS.map(plan => {
              const isCurrent = (formData.subscriptionPlan || 'Growth Partner') === plan.id;
              return (
                <div
                  key={plan.id}
                  className="card"
                  style={{
                    border: isCurrent ? '2px solid var(--mustard)' : '1px solid var(--border)',
                    background: isCurrent ? 'var(--mustard-pale)' : 'var(--card-bg)',
                    position: 'relative'
                  }}
                >
                  {plan.recommended && (
                    <span className="pill pill-live" style={{ position: 'absolute', top: '16px', right: '16px' }}>
                      Most Popular
                    </span>
                  )}
                  <h3>{plan.name}</h3>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', margin: '10px 0 2px' }}>
                    {plan.price} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mustard-deep)', marginBottom: '16px' }}>
                    ⚡ AI Rank: {plan.recBoost}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.8 }}>
                    {plan.features.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#22C55E', fontWeight: 800 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`btn ${isCurrent ? 'btn-ghost' : 'btn-mustard'} btn-block`}
                    disabled={isCurrent}
                    onClick={() => upgradeSubscription(plan.id)}
                  >
                    {isCurrent ? 'Current Active Plan' : `Subscribe (${plan.price})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Upgrade Modal */}
      {subModalOpen && (
        <div className="modal-overlay open" id="subModal">
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-head">
              <h3>Manage Partner Subscription</h3>
              <button className="icon-btn" onClick={() => setSubModalOpen(false)}>
                <span dangerouslySetInnerHTML={{ __html: ic('x') }} />
              </button>
            </div>
            <div className="modal-body">
              <p className="sub" style={{ marginBottom: '16px' }}>Choose the subscription plan that fits your growth targets on Destiny.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PLANS.map(plan => {
                  const isCurrent = (formData.subscriptionPlan || 'Growth Partner') === plan.id;
                  return (
                    <div
                      key={plan.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: isCurrent ? '2px solid var(--mustard)' : '1px solid var(--border)',
                        background: isCurrent ? 'var(--mustard-pale)' : 'var(--card-bg)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                          {plan.name} {isCurrent && <span className="pill pill-live" style={{ marginLeft: '8px' }}>Active</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                          {plan.recBoost} • {plan.price} {plan.period}
                        </div>
                      </div>
                      <button
                        className={`btn ${isCurrent ? 'btn-ghost' : 'btn-mustard'} btn-sm`}
                        disabled={isCurrent}
                        onClick={() => upgradeSubscription(plan.id)}
                      >
                        {isCurrent ? 'Active' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setSubModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Profile;