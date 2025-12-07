// Dashboard Step 1: Stats Only
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Shield, Activity, Zap } from 'lucide-react';
// import { TrendChart, TypeDistributionChart } from '../components/Analytics/Charts'; // Commented out for now

const Dashboard = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return;
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        console.log("Fetching stats...");
        const statsRes = await fetch(getApiUrl('/api/analytics/stats'), { headers });
        if (statsRes.ok) {
          const data = await statsRes.json();
          console.log("Stats fetched:", data);
          setAnalyticsData(data);
        } else {
          console.error("Stats fetch error:", statsRes.status);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="text-cyber-primary" />
          SafeChat360 Dashboard
        </h1>
        <p className="text-cyber-muted">Real-time content moderation and threat detection.</p>
      </div>

      {!analyticsData ? (
        <div className="flex h-64 items-center justify-center text-white">
          <span className="w-8 h-8 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin mr-3"></span>
          Loading Analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={48} />
            </div>
            <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">System Status</h3>
            <div className="text-2xl font-bold text-cyber-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></span>
              Operational
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={48} />
            </div>
            <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">Total Scanned</h3>
            <div className="text-2xl font-bold text-white">{analyticsData?.overview?.total_scanned || '...'}</div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield size={48} />
            </div>
            <h3 className="text-cyber-muted text-sm font-medium uppercase tracking-wider mb-1">Flag Rate</h3>
            <div className="text-2xl font-bold text-white">{analyticsData?.overview?.flag_rate || 0}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
