// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Listings from './components/Listings';
import Bookings from './components/Bookings';
import Insights from './components/Insights';
import Profile from './components/Profile';
import Menu from './components/Menu';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { Store, Demo } from './utils/storage';
import { AppStateContext } from './context/AppStateContext';

function App() {
  const [appState, setAppState] = useState({
    session: null,
    users: [],
    offers: [],
    events: [],
    bookings: [],
    profile: null,
    menu: [],
    currentView: 'dashboard',
    offerFilter: 'all',
    eventFilter: 'all',
    bookingFilter: 'all',
    insightRange: 30,
    editingOfferId: null,
    editingEventId: null,
    editingDishId: null,
    charts: {}
  });

  const [isAppReady, setIsAppReady] = useState(false);

  const updateAppState = useCallback((updates) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  const setCurrentView = useCallback((view) => {
    setAppState(prev => ({ ...prev, currentView: view }));
  }, []);

  const refreshData = useCallback(async (customUserId) => {
    const userId = customUserId || appState.session?.userId;
    if (!userId) return;
    const [users, offers, events, bookings, profile, menu] = await Promise.all([
      Store.get('users', []),
      Store.get('offers:' + userId, []),
      Store.get('events:' + userId, []),
      Store.get('bookings:' + userId, []),
      Store.get('profile:' + userId, null),
      Store.get('menu:' + userId, [])
    ]);
    updateAppState({ users, offers, events, bookings, profile, menu });
  }, [appState.session, updateAppState]);

  const enterApp = useCallback(async (customSession) => {
    const activeSession = customSession || appState.session;
    if (!activeSession || !activeSession.userId) {
      setIsAppReady(true);
      return;
    }
    const userId = activeSession.userId;
    const [users, offers, events, bookings, profile, menu] = await Promise.all([
      Store.get('users', []),
      Store.get('offers:' + userId, []),
      Store.get('events:' + userId, []),
      Store.get('bookings:' + userId, []),
      Store.get('profile:' + userId, null),
      Store.get('menu:' + userId, [])
    ]);
    updateAppState({ session: activeSession, users, offers, events, bookings, profile, menu });
    setIsAppReady(true);
  }, [appState.session, updateAppState]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const session = await Store.get('session', null);
        const users = await Store.get('users', []);
        if (session && session.userId) {
          const userId = session.userId;
          const [offers, events, bookings, profile, menu] = await Promise.all([
            Store.get('offers:' + userId, []),
            Store.get('events:' + userId, []),
            Store.get('bookings:' + userId, []),
            Store.get('profile:' + userId, null),
            Store.get('menu:' + userId, [])
          ]);
          setAppState(prev => ({
            ...prev,
            session,
            users,
            offers,
            events,
            bookings,
            profile,
            menu
          }));
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      } finally {
        setIsAppReady(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (appState.session?.userId && appState.offers.length === 0 && appState.events.length === 0 && appState.bookings.length === 0) {
      Demo.seed(appState.session.userId, updateAppState);
    }
  }, [appState.session, appState.offers, appState.events, appState.bookings, updateAppState]);

  const value = {
    appState,
    updateAppState,
    setCurrentView,
    refreshData,
    enterApp,
    isAppReady
  };

  return (
    <AppStateContext.Provider value={value}>
      <div id="app">
        <Toast />
        <ConfirmModal />
        {!isAppReady ? (
          <div className="loading-screen">Loading...</div>
        ) : !appState.session ? (
          <Auth />
        ) : (
          <div className="shell">
            <Sidebar />
            <div className="main">
              <Topbar />
              <main className="viewport">
                <Dashboard />
                <Listings />
                <Bookings />
                <Insights />
                <Profile />
                <Menu />
              </main>
            </div>
          </div>
        )}
      </div>
    </AppStateContext.Provider>
  );
}

export default App;