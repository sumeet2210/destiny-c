// components/Insights.jsx
import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ic } from '../utils/icons';
import { genSeries } from '../utils/storage';

const Insights = () => {
  const { appState } = useAppState();
  const { offers = [], events = [], currentView } = appState;
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (currentView !== 'insights' || !window.Chart) return;

    const rng = range;
    const labels = Array.from({ length: rng }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (rng - 1 - i));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });

    // Chart: Covers
    const ctxCovers = document.getElementById('chartCovers');
    if (ctxCovers) {
      const covers = genSeries(rng, 28, 17);
      if (appState.charts?.chartCovers) appState.charts.chartCovers.destroy();
      appState.charts.chartCovers = new window.Chart(ctxCovers, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Covers',
            data: covers,
            borderColor: '#2DD4BF',
            backgroundColor: 'rgba(45,212,191,0.13)',
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

    // Chart: Top
    const ctxTop = document.getElementById('chartTop');
    if (ctxTop) {
      const items = offers.map(o => o.title).concat(events.map(e => e.title)).slice(0, 6);
      const perf = items.map((_, i) => 80 - i * 11 + Math.floor(Math.random() * 10));
      if (appState.charts?.chartTop) appState.charts.chartTop.destroy();
      appState.charts.chartTop = new window.Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: items.length ? items : ['No listings yet'],
          datasets: [{ data: items.length ? perf : [0], backgroundColor: '#22C55E', borderRadius: 6, maxBarThickness: 28 }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { font: { size: 10.5 }, color: '#8D8A94' } },
            y: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: '#8D8A94' } }
          }
        }
      });
    }

    // Chart: Peak
    const ctxPeak = document.getElementById('chartPeak');
    if (ctxPeak) {
      const hourLabels = ['11am', '12pm', '1pm', '2pm', '6pm', '7pm', '8pm', '9pm', '10pm'];
      const hourData = [12, 28, 22, 10, 18, 34, 46, 30, 14];
      if (appState.charts?.chartPeak) appState.charts.chartPeak.destroy();
      appState.charts.chartPeak = new window.Chart(ctxPeak, {
        type: 'bar',
        data: {
          labels: hourLabels,
          datasets: [{ data: hourData, backgroundColor: '#E8B94D', borderRadius: 6, maxBarThickness: 28 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: '#8D8A94' } },
            y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { font: { size: 10.5 }, color: '#8D8A94' } }
          }
        }
      });
    }

    // Chart: Age
    const ctxAge = document.getElementById('chartAge');
    if (ctxAge) {
      if (appState.charts?.chartAge) appState.charts.chartAge.destroy();
      appState.charts.chartAge = new window.Chart(ctxAge, {
        type: 'doughnut',
        data: {
          labels: ['18–24', '25–34', '35–44', '45+'],
          datasets: [{ data: [22, 41, 24, 13], backgroundColor: ['#22C55E', '#2DD4BF', '#E8B94D', '#FF6B61'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }
      });
    }
  }, [range, currentView, offers, events, appState]);

  const stats = [
    { label: 'Total profile views', value: (range * 62).toLocaleString(), trend: '+21%', up: true, icName: 'eye', bg: 'var(--mustard-pale)', col: 'var(--mustard-deep)' },
    { label: 'Total bookings', value: Math.round(range * 3.4).toLocaleString(), trend: '+11%', up: true, icName: 'calCheck', bg: 'var(--teal-pale)', col: 'var(--teal)' },
    { label: 'Avg. party size', value: '3.6 guests', trend: '+0.3', up: true, icName: 'users', bg: 'rgba(155,140,251,0.16)', col: '#9B8CFB' },
    { label: 'Cancellation rate', value: '6.2%', trend: '-1.4%', up: true, icName: 'trendDown', bg: 'var(--coral-pale)', col: 'var(--coral)' }
  ];

  return (
    <section className={`view ${currentView === 'insights' ? 'active' : ''}`} id="view-insights">
      <div className="row-between">
        <div>
          <h1>Insights</h1>
          <p className="sub">Understand how diners are finding and booking your venue.</p>
        </div>
        <div className="chip-group" id="insightsRange">
          <button className={`chip ${range === 7 ? 'active' : ''}`} onClick={() => setRange(7)}>7 days</button>
          <button className={`chip ${range === 30 ? 'active' : ''}`} onClick={() => setRange(30)}>30 days</button>
          <button className={`chip ${range === 90 ? 'active' : ''}`} onClick={() => setRange(90)}>90 days</button>
        </div>
      </div>

      <div className="stat-grid" id="insightStatGrid">
        {stats.map((s, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-top">
              <div className="stat-ic" style={{ background: s.bg, color: s.col }} dangerouslySetInnerHTML={{ __html: ic(s.icName) }} />
              <div className={`stat-trend ${s.up ? 'up' : 'down'}`} dangerouslySetInnerHTML={{ __html: ic(s.up ? 'trendUp' : 'trendDown') + ' ' + s.trend }} />
            </div>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <div className="card-head">
            <h3>Covers &amp; bookings over time</h3>
          </div>
          <div style={{ height: '150px', position: 'relative' }}>
            <canvas id="chartCovers"></canvas>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Top performing listings</h3>
          </div>
          <div style={{ height: '170px', position: 'relative' }}>
            <canvas id="chartTop"></canvas>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Peak booking hours</h3>
          </div>
          <div style={{ height: '160px', position: 'relative' }}>
            <canvas id="chartPeak"></canvas>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Diner age groups</h3>
          </div>
          <div style={{ height: '170px', position: 'relative' }}>
            <canvas id="chartAge"></canvas>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Insights;