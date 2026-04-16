/**
 * Dashboard Widgets Component
 * Contains stat cards, charts, and dashboard UI elements
 */

import React from 'react';
import { 
  Building, 
  People, 
  CashCoin, 
  GraphUp,
  ArrowUp,
  ArrowDown
} from 'react-bootstrap-icons';

// Stat Card Component
export function StatCard({ title, value, icon, color, change, changeType }) {
  const IconComponent = icon;

  return (
    <div className="dashboard-card dashboard-stat-card">
      <div className={`dashboard-stat-icon ${color}`}>
        <IconComponent size={24} />
      </div>
      <div className="dashboard-stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
        {change && (
          <span className={`dashboard-stat-change ${changeType}`}>
            {changeType === 'positive' ? <ArrowUp /> : <ArrowDown />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

// Chart Card Component
export function ChartCard({ title, children }) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4 className="chart-title">{title}</h4>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
}

// Simple Bar Chart Component (placeholder)
export function SimpleBarChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted mb-0">No chart data available.</p>;
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);
  
  return (
    <div className="simple-bar-chart" style={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      gap: '8px', 
      height: '200px',
      padding: '1rem 0'
    }}>
      {data.map((item, index) => (
        <div key={index} style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '40px',
            height: `${Math.max((Number(item.value || 0) / maxValue) * 150, 4)}px`,
            background: 'linear-gradient(135deg, #2563eb 0%, #1a365d 100%)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s ease'
          }} />
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#64748b',
            textAlign: 'center'
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Simple Line Chart Component (placeholder)
export function SimpleLineChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted mb-0">No chart data available.</p>;
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);
  const denominator = Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({
    x: (i / denominator) * 100,
    y: 100 - ((Number(d.value || 0) / maxValue) * 80)
  }));
  
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div style={{ height: '200px', padding: '1rem 0' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line 
            key={y}
            x1="0" 
            y1={y} 
            x2="100" 
            y2={y} 
            stroke="#e2e8f0" 
            strokeWidth="0.5"
          />
        ))}
        
        {/* Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#d4af37" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle 
            key={i}
            cx={p.x} 
            cy={p.y} 
            r="3" 
            fill="#d4af37"
          />
        ))}
      </svg>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '0.5rem'
      }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Pie Chart Component (placeholder)
export function SimplePieChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted mb-0">No chart data available.</p>;
  }

  const total = data.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const normalizedData = total > 0
    ? data.map((item) => ({ ...item, value: Number(item.value || 0) }))
    : data.map((item) => ({ ...item, value: 1 }));

  const normalizedTotal = normalizedData.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#2563eb', '#d4af37', '#10b981', '#ef4444', '#8b5cf6'];
  const segmentState = normalizedData.reduce((acc, d, i) => {
    const angle = (d.value / normalizedTotal) * 360;
    const startAngle = acc.currentAngle;
    const endAngle = startAngle + angle;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      currentAngle: endAngle,
      segments: [
        ...acc.segments,
        {
          path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
          color: colors[i % colors.length],
          label: d.label,
          percentage: ((d.value / normalizedTotal) * 100).toFixed(1)
        }
      ]
    };
  }, { currentAngle: 0, segments: [] });
  const segments = segmentState.segments;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem' }}>
      <svg viewBox="0 0 100 100" style={{ width: '150px', height: '150px' }}>
        {segments.map((seg, i) => (
          <path 
            key={i} 
            d={seg.path} 
            fill={seg.color}
            style={{ transition: 'transform 0.3s ease' }}
          />
        ))}
      </svg>
      <div>
        {segments.map((seg, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: seg.color,
              borderRadius: '2px'
            }} />
            <span style={{ fontSize: '0.875rem', color: '#475569' }}>
              {seg.label}: {seg.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard Overview Stats
export function DashboardOverview({ stats }) {
  const defaultStats = {
    totalProperties: stats?.totalProperties || 0,
    totalAgents: stats?.totalAgents || 0,
    totalSales: stats?.totalSales || 0,
    totalRevenue: stats?.totalRevenue || 0
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="row g-4 mb-4">
      <div className="col-lg-3 col-md-6">
        <StatCard 
          title="Total Properties"
          value={defaultStats.totalProperties}
          icon={Building}
          color="blue"
          change="+12%"
          changeType="positive"
        />
      </div>
      <div className="col-lg-3 col-md-6">
        <StatCard 
          title="Active Agents"
          value={defaultStats.totalAgents}
          icon={People}
          color="gold"
          change="+5%"
          changeType="positive"
        />
      </div>
      <div className="col-lg-3 col-md-6">
        <StatCard 
          title="Total Sales"
          value={defaultStats.totalSales}
          icon={GraphUp}
          color="green"
          change="+18%"
          changeType="positive"
        />
      </div>
      <div className="col-lg-3 col-md-6">
        <StatCard 
          title="Revenue"
          value={formatCurrency(defaultStats.totalRevenue)}
          icon={CashCoin}
          color="red"
          change="+8%"
          changeType="positive"
        />
      </div>
    </div>
  );
}

export default {
  StatCard,
  ChartCard,
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
  DashboardOverview
};
