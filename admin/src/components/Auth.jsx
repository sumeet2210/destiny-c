// components/Auth.jsx
import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Store, uid, DEFAULT_PROFILE } from '../utils/storage';

const AMBIANCE_OPTIONS = [
  'Romantic & Cozy', 'Family Friendly', 'Live Music', 'Rooftop Views',
  'Work Friendly', 'Party & Nightlife', 'Instagrammable', 'Pet Friendly',
  'Quiet & Relaxing', 'Late Night Dining'
];

const Auth = () => {
  const { appState, updateAppState, enterApp } = useAppState();
  const [tab, setTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suPassword2, setSuPassword2] = useState('');
  const [errors, setErrors] = useState({});

  const [surveyStep, setSurveyStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    cuisine: 'Café & Bakery',
    cuisineOther: '',
    seats: '45',
    environment: 'AC',
    diet: 'Both (Veg & Non-Veg)',
    parking: 'Valet Parking',
    wifi: 'Free High-Speed Wi-Fi',
    costForTwo: '₹500 - ₹1000 (Moderate)',
    alcohol: 'Beer & Wine Only',
    outdoor: 'Yes - Rooftop & Garden',
    ambiance: ['Cozy & Warm', 'Work Friendly', 'Rooftop Views', 'Instagrammable'],
    subscriptionPlan: 'Growth Partner'
  });

  const clearErrors = () => setErrors({});

  const toggleAmbianceTag = (tag) => {
    setSurveyData(prev => {
      const current = prev.ambiance || [];
      const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      return { ...prev, ambiance: updated };
    });
  };

  const handleLogin = async () => {
    clearErrors();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);
    if (!emailOk) {
      setErrors({ loginEmail: true });
      return;
    }
    const users = await Store.get('users', []);
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    if (!user) {
      setErrors({ loginPass: true });
      return;
    }
    const session = { userId: user.id, email: user.email };
    updateAppState({ session });
    await Store.set('session', session);

    let profile = await Store.get('profile:' + user.id, null);
    if (!profile || !profile.surveyCompleted) {
      if (!profile) {
        const hours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, open: '11:00', close: '23:00', closed: false }));
        profile = { ...DEFAULT_PROFILE, name: user.restaurantName || 'My Venue', email: user.email, hours, surveyCompleted: false };
        await Store.set('profile:' + user.id, profile);
      }
      updateAppState({ profile });
      setTab('survey');
      setSurveyStep(1);
      if (window.showToast) window.showToast('Please complete your recommendation survey', 'info');
      return;
    }

    if (window.showToast) window.showToast('Welcome back, ' + (profile.name || user.restaurantName) + '!', 'success');
    await enterApp(session);
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@spiceroute.com';
    const demoPass = 'password123';
    let users = await Store.get('users', []);
    let user = users.find(u => u.email === demoEmail);
    if (!user) {
      user = { id: 'demo_user_1', email: demoEmail, password: demoPass, restaurantName: 'The Spice Route Café', createdAt: Date.now() };
      users.push(user);
      await Store.set('users', users);
    }
    const session = { userId: user.id, email: user.email };
    updateAppState({ session });
    await Store.set('session', session);

    let profile = await Store.get('profile:' + user.id, null);
    if (!profile) {
      const hours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, open: '11:00', close: '23:00', closed: false }));
      profile = { ...DEFAULT_PROFILE, name: 'The Spice Route Café', email: demoEmail, hours, surveyCompleted: true };
      await Store.set('profile:' + user.id, profile);
    }
    updateAppState({ profile });

    if (window.showToast) window.showToast('Logged in as The Spice Route Café!', 'success');
    await enterApp(session);
  };

  const handleSignup = async () => {
    clearErrors();
    let ok = true;
    const newErrors = {};
    if (!suName) { newErrors.suName = true; ok = false; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail);
    const users = await Store.get('users', []);
    if (!emailOk || users.some(u => u.email.toLowerCase() === suEmail.toLowerCase())) { newErrors.suEmail = true; ok = false; }
    if (suPassword.length < 6) { newErrors.suPass = true; ok = false; }
    if (suPassword !== suPassword2) { newErrors.suPass2 = true; ok = false; }
    if (!ok) { setErrors(newErrors); return; }

    const newUser = { id: uid(), email: suEmail, password: suPassword, restaurantName: suName, createdAt: Date.now() };
    users.push(newUser);
    await Store.set('users', users);
    const session = { userId: newUser.id, email: newUser.email };
    updateAppState({ session });
    await Store.set('session', session);

    const hours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, open: '11:00', close: '23:00', closed: false }));
    const profile = {
      ...DEFAULT_PROFILE,
      name: suName,
      email: suEmail,
      hours,
      surveyCompleted: false
    };
    await Store.set('profile:' + newUser.id, profile);
    await Store.set('offers:' + newUser.id, []);
    await Store.set('events:' + newUser.id, []);
    await Store.set('bookings:' + newUser.id, []);

    updateAppState({ profile });
    setTab('survey');
    setSurveyStep(1);
  };

  const completeSurvey = async () => {
    const cuisine = surveyData.cuisine === '__custom__' ? (surveyData.cuisineOther || 'Custom Venue') : surveyData.cuisine;
    const userId = appState?.session?.userId;
    if (userId) {
      let profile = await Store.get('profile:' + userId, {}) || {};
      profile = {
        ...profile,
        cuisine,
        seats: surveyData.seats,
        environment: surveyData.environment,
        diet: surveyData.diet,
        parking: surveyData.parking,
        wifi: surveyData.wifi,
        costForTwo: surveyData.costForTwo,
        alcohol: surveyData.alcohol,
        outdoor: surveyData.outdoor,
        ambiance: surveyData.ambiance,
        subscriptionPlan: surveyData.subscriptionPlan,
        subscriptionStatus: 'Active',
        surveyCompleted: true
      };
      await Store.set('profile:' + userId, profile);
      updateAppState({ profile });
    }
    if (window.showToast) window.showToast('Recommendation profile & venue setup complete!', 'success');
    await enterApp();
  };

  const isSurvey = tab === 'survey';

  return (
    <div id="authScreen">
      <div className="auth-brand">
        <div className="brand-mark">
          <span className="dot"></span> destiny <span style={{ opacity: 0.5, fontWeight: 500 }}>for business</span>
        </div>
        <div>
          <h1>Fill your tables.<br />Not just your feed with <em>ads.</em></h1>
          <p>List offers and live events, build your AI recommendation profile, get discovered by local diners, and receive table reservations seamlessly.</p>
        </div>
        <div className="auth-stub">
          <div><b>12,400+</b><span>Partner venues</span></div>
          <div><b>3.1M</b><span>Monthly diners reached</span></div>
          <div><b>98%</b><span>Recommendation accuracy</span></div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card" style={isSurvey ? { maxWidth: '580px' } : {}}>
          <div className="tabbar" style={{ display: isSurvey ? 'none' : 'flex' }}>
            <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Log in</button>
            <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Create account</button>
          </div>

          {tab === 'login' && (
            <div id="loginForm">
              <h2>Welcome back</h2>
              <p className="sub">Log in to manage your recommendation engine, offers, events and bookings.</p>
              
              <button
                className="btn btn-ghost btn-block"
                onClick={handleDemoLogin}
                style={{ marginBottom: '20px', border: '1.5px solid var(--mustard)', color: 'var(--mustard-deep)', background: 'var(--mustard-pale)' }}
              >
                ✨ Quick Demo Login (1-Click)
              </button>

              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', margin: '-10px 0 16px', position: 'relative' }}>
                <span style={{ background: 'var(--paper)', padding: '0 10px', position: 'relative', zIndex: 1 }}>OR ENTER YOUR CREDENTIALS</span>
                <div style={{ borderBottom: '1px solid var(--border)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
              </div>

              <div className="field">
                <label>Email address</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@yourcafe.com" />
                {errors.loginEmail && <div className="err">Enter a valid email address.</div>}
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
                {errors.loginPass && <div className="err" style={{ display: 'block' }}>Incorrect email or password. Use "Create account" tab to register a new venue.</div>}
              </div>
              <button className="btn btn-mustard btn-block" onClick={handleLogin}>Log in to dashboard</button>
              
              <div className="demo-note" style={{ marginTop: '16px' }}>
                💡 <b>New venue?</b> Click the <b>"Create account"</b> tab above to register your venue and set up your profile, or use <b>"Quick Demo Login"</b> above to explore immediately.
              </div>
            </div>
          )}

          {tab === 'signup' && (
            <div id="signupForm">
              <h2>List your venue</h2>
              <p className="sub">Set up your partner account and recommendation profile in under a minute.</p>
              <div className="field">
                <label>Restaurant / Café name</label>
                <input type="text" value={suName} onChange={e => setSuName(e.target.value)} placeholder="e.g. The Spice Route Café" />
                {errors.suName && <div className="err" style={{ display: 'block' }}>Please enter your venue's name.</div>}
              </div>
              <div className="field">
                <label>Email address</label>
                <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="owner@yourcafe.com" />
                {errors.suEmail && <div className="err" style={{ display: 'block' }}>Enter a valid, unused email address.</div>}
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="At least 6 characters" />
                {errors.suPass && <div className="err" style={{ display: 'block' }}>Password must be at least 6 characters.</div>}
              </div>
              <div className="field">
                <label>Confirm password</label>
                <input type="password" value={suPassword2} onChange={e => setSuPassword2(e.target.value)} placeholder="Re-enter password" />
                {errors.suPass2 && <div className="err" style={{ display: 'block' }}>Passwords don't match.</div>}
              </div>
              <button className="btn btn-mustard btn-block" onClick={handleSignup}>Create free account &amp; setup profile</button>
            </div>
          )}

          {tab === 'survey' && (
            <div id="surveyForm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="pill pill-live" style={{ fontSize: '11px' }}>AI Recommendation Wizard</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Step {surveyStep} of 2</span>
              </div>
              <h2>Build your recommendation profile</h2>
              <p className="sub">Answer these key venue questions so our recommendation algorithm matches your venue to the right diners.</p>

              {surveyStep === 1 && (
                <>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Restaurant Category / Cuisine</label>
                      <select value={surveyData.cuisine} onChange={e => setSurveyData({ ...surveyData, cuisine: e.target.value })}>
                        <option>Café &amp; Bakery</option>
                        <option>Fine Dining</option>
                        <option>Casual Dining</option>
                        <option>Fast Food</option>
                        <option>Restro-Bar &amp; Pub</option>
                        <option>Rooftop Lounge</option>
                        <option>Family Restaurant</option>
                        <option>Street Food &amp; Snacks</option>
                        <option>Cloud Kitchen</option>
                        <option value="__custom__">Other / Custom Category...</option>
                      </select>
                      {surveyData.cuisine === '__custom__' && (
                        <input
                          value={surveyData.cuisineOther}
                          onChange={e => setSurveyData({ ...surveyData, cuisineOther: e.target.value })}
                          placeholder="Type custom category (e.g. Authentic Chettinad, Microbrewery)..."
                          style={{ marginTop: '8px' }}
                        />
                      )}
                    </div>
                    <div className="field">
                      <label>Total Seats Capacity</label>
                      <input type="number" value={surveyData.seats} onChange={e => setSurveyData({ ...surveyData, seats: e.target.value })} placeholder="e.g. 50" />
                    </div>
                  </div>

                  <div className="form-grid2">
                    <div className="field">
                      <label>Air Conditioning (AC / Non-AC)</label>
                      <select value={surveyData.environment} onChange={e => setSurveyData({ ...surveyData, environment: e.target.value })}>
                        <option>AC (Full Air-Conditioned)</option>
                        <option>Non-AC / Fan</option>
                        <option>Outdoor Open Air</option>
                        <option>Both AC &amp; Outdoor Seating</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Dietary Classification</label>
                      <select value={surveyData.diet} onChange={e => setSurveyData({ ...surveyData, diet: e.target.value })}>
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
                      <select value={surveyData.parking} onChange={e => setSurveyData({ ...surveyData, parking: e.target.value })}>
                        <option>Valet Parking Available</option>
                        <option>Dedicated Private Parking</option>
                        <option>Street Parking</option>
                        <option>No Parking</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Free Wi-Fi &amp; Work Facilities</label>
                      <select value={surveyData.wifi} onChange={e => setSurveyData({ ...surveyData, wifi: e.target.value })}>
                        <option>Free High-Speed Wi-Fi</option>
                        <option>Plug Points &amp; Work Friendly</option>
                        <option>No Wi-Fi</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-mustard btn-block" onClick={() => setSurveyStep(2)} style={{ marginTop: '16px' }}>
                    Next: Ambiance &amp; Subscription Plan →
                  </button>
                </>
              )}

              {surveyStep === 2 && (
                <>
                  <div className="form-grid2">
                    <div className="field">
                      <label>Avg. Cost for Two (Price Tier)</label>
                      <select value={surveyData.costForTwo} onChange={e => setSurveyData({ ...surveyData, costForTwo: e.target.value })}>
                        <option>₹200 - ₹500 (Budget)</option>
                        <option>₹500 - ₹1000 (Moderate)</option>
                        <option>₹1000 - ₹2000 (Premium)</option>
                        <option>₹2000+ (Fine Dining)</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Alcohol &amp; Bar License</label>
                      <select value={surveyData.alcohol} onChange={e => setSurveyData({ ...surveyData, alcohol: e.target.value })}>
                        <option>Full Bar &amp; Cocktails</option>
                        <option>Beer &amp; Wine Only</option>
                        <option>No Alcohol Served</option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Ambiance &amp; Vibe Tags (Select all that apply)</label>
                    <div className="chip-group" style={{ flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {AMBIANCE_OPTIONS.map(tag => {
                        const isSel = (surveyData.ambiance || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`chip ${isSel ? 'active' : ''}`}
                            onClick={() => toggleAmbianceTag(tag)}
                            style={{ fontSize: '11.5px', padding: '4px 10px' }}
                          >
                            {isSel ? '✓ ' : '+ '}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: '12px' }}>
                    <label>Partner Subscription Plan</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
                      {[
                        { id: 'Starter', name: 'Starter', price: 'Free', desc: 'Basic listing' },
                        { id: 'Growth Partner', name: 'Growth', price: '₹999/mo', desc: 'Top AI Boost', pop: true },
                        { id: 'Pro Platinum', name: 'Platinum', price: '₹2,499/mo', desc: '#1 Placement' }
                      ].map(plan => (
                        <div
                          key={plan.id}
                          onClick={() => setSurveyData({ ...surveyData, subscriptionPlan: plan.id })}
                          style={{
                            border: surveyData.subscriptionPlan === plan.id ? '2px solid var(--mustard)' : '1px solid var(--border)',
                            background: surveyData.subscriptionPlan === plan.id ? 'var(--mustard-pale)' : 'var(--card-bg)',
                            padding: '10px 8px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>{plan.name}</div>
                          <div style={{ color: 'var(--mustard-deep)', fontWeight: 800, fontSize: '12px', margin: '2px 0' }}>{plan.price}</div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{plan.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn btn-ghost" onClick={() => setSurveyStep(1)}>← Back</button>
                    <button className="btn btn-mustard" style={{ flex: 1 }} onClick={completeSurvey}>
                      Complete setup &amp; launch venue
                    </button>
                  </div>
                </>
              )}

              <div className="auth-foot">
                By completing setup, you agree to Destiny's <a>Partner Terms</a> and <a>Privacy Policy</a>.
              </div>
            </div>
          )}

          {!isSurvey && (
            <div className="auth-foot">
              By continuing you agree to Destiny's <a>Partner Terms</a> and <a>Privacy Policy</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;