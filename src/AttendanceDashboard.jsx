import React, { useEffect, useState } from "react";
import { AlertCircle, Users, Calendar, TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";

export default function AttendanceDashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeView, setActiveView] = useState("overview");

  // Filters
  const [stadiumFilter, setStadiumFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://attendance-predictor.manalmaati8.workers.dev");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      const enriched = data.map((m) => ({
        ...m,
        isAnomaly: m.predicted_attendance > m.capacity * 0.95,
        utilization: (m.predicted_attendance / m.capacity) * 100,
      }));

      setMatches(enriched);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (stadiumFilter && m.stadium !== stadiumFilter) return false;
    if (dateFilter && !m.date.startsWith(dateFilter)) return false;
    if (anomaliesOnly && !m.isAnomaly) return false;
    return true;
  });

  // Analytics
  const stadiums = [...new Set(matches.map((m) => m.stadium))];
  const anomalyCount = matches.filter((m) => m.isAnomaly).length;
  const totalPredicted = matches.reduce((sum, m) => sum + m.predicted_attendance, 0);
  const avgUtilization = matches.length > 0 
    ? matches.reduce((sum, m) => sum + m.utilization, 0) / matches.length 
    : 0;

  const stadiumStats = stadiums.map(stadium => {
    const stadiumMatches = matches.filter(m => m.stadium === stadium);
    return {
      stadium,
      totalMatches: stadiumMatches.length,
      totalAttendance: stadiumMatches.reduce((sum, m) => sum + m.predicted_attendance, 0),
      avgUtilization: stadiumMatches.reduce((sum, m) => sum + m.utilization, 0) / stadiumMatches.length,
      capacity: stadiumMatches[0]?.capacity || 0
    };
  }).sort((a, b) => b.totalAttendance - a.totalAttendance);

  const topMatches = [...matches]
    .sort((a, b) => b.predicted_attendance - a.predicted_attendance)
    .slice(0, 5);

  const capacityDistribution = [
    { range: "0-50%", count: matches.filter(m => m.utilization < 50).length },
    { range: "50-75%", count: matches.filter(m => m.utilization >= 50 && m.utilization < 75).length },
    { range: "75-95%", count: matches.filter(m => m.utilization >= 75 && m.utilization < 95).length },
    { range: "95-100%", count: matches.filter(m => m.utilization >= 95).length },
  ];

  const dateGroups = matches.reduce((acc, m) => {
    const date = m.date;
    if (!acc[date]) acc[date] = { date, total: 0, count: 0 };
    acc[date].total += m.predicted_attendance;
    acc[date].count += 1;
    return acc;
  }, {});

  const trendData = Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={styles.container}>
      {/* Moroccan Pattern Background */}
      <div style={styles.pattern}></div>

      <div style={styles.content}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>🇲🇦 CAN 2025 ATTENDANCE ANALYTICS</h1>
          <p style={styles.subtitle}>Real-time Predictive Intelligence Dashboard</p>
          {lastUpdate && <p style={styles.updated}>Last updated: {lastUpdate}</p>}
        </header>

        {/* Navigation Tabs */}
        <div style={styles.tabs}>
          {["overview", "stadiums", "trends", "details"].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                ...styles.tab,
                ...(activeView === view ? styles.tabActive : {})
              }}
            >
              {view === "overview" && <Activity size={16} />}
              {view === "stadiums" && <BarChart3 size={16} />}
              {view === "trends" && <TrendingUp size={16} />}
              {view === "details" && <PieChart size={16} />}
              <span style={styles.tabText}>{view.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiIcon}><Calendar size={24} /></div>
            <div>
              <div style={styles.kpiLabel}>Total Matches</div>
              <div style={styles.kpiValue}>{matches.length}</div>
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiIcon}><Users size={24} /></div>
            <div>
              <div style={styles.kpiLabel}>Predicted Attendance</div>
              <div style={styles.kpiValue}>{totalPredicted.toLocaleString()}</div>
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={{...styles.kpiIcon, background: 'linear-gradient(135deg, #C1272D 0%, #8B1E22 100%)'}}>
              <Activity size={24} />
            </div>
            <div>
              <div style={styles.kpiLabel}>Avg Utilization</div>
              <div style={styles.kpiValue}>{avgUtilization.toFixed(1)}%</div>
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={{...styles.kpiIcon, background: avgUtilization > 80 ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)' : 'linear-gradient(135deg, #C1272D 0%, #8B1E22 100%)'}}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={styles.kpiLabel}>Anomalies Detected</div>
              <div style={styles.kpiValue}>{anomalyCount}</div>
            </div>
          </div>
        </div>

        {/* Main Content Views */}
        {loading ? (
          <div style={styles.loading}>Loading data...</div>
        ) : error ? (
          <div style={styles.error}>Error: {error}</div>
        ) : (
          <>
            {/* OVERVIEW VIEW */}
            {activeView === "overview" && (
              <div style={styles.viewContainer}>
                <div style={styles.chartGrid}>
                  {/* Top 5 Matches */}
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>🏆 Top 5 Matches by Attendance</h3>
                    <div style={styles.rankingList}>
                      {topMatches.map((m, idx) => (
                        <div key={m.id} style={styles.rankingItem}>
                          <div style={{...styles.rankBadge, background: idx === 0 ? '#D4AF37' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#006233'}}>
                            #{idx + 1}
                          </div>
                          <div style={styles.rankingInfo}>
                            <div style={styles.rankingMatch}>{m.team1} vs {m.team2}</div>
                            <div style={styles.rankingDetails}>{m.stadium} • {m.date}</div>
                          </div>
                          <div style={styles.rankingValue}>
                            {m.predicted_attendance.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Distribution Pie */}
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>📊 Capacity Utilization Distribution</h3>
                    <div style={styles.pieChart}>
                      {capacityDistribution.map((item, idx) => {
                        const colors = ['#C1272D', '#D4AF37', '#006233', '#8B1E22'];
                        const total = capacityDistribution.reduce((sum, i) => sum + i.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <div key={idx} style={styles.pieSegment}>
                            <div style={{...styles.pieColor, background: colors[idx]}}></div>
                            <div style={styles.pieLabel}>{item.range}</div>
                            <div style={styles.pieValue}>{item.count} ({percentage}%)</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Trend Area Chart */}
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>📈 Attendance Trends Over Time</h3>
                  <div style={styles.areaChart}>
                    {trendData.map((item, idx) => {
                      const maxAttendance = Math.max(...trendData.map(d => d.total));
                      const height = (item.total / maxAttendance) * 100;
                      return (
                        <div key={idx} style={styles.areaBar}>
                          <div style={{...styles.areaBarFill, height: `${height}%`}}>
                            <span style={styles.areaValue}>{item.total.toLocaleString()}</span>
                          </div>
                          <div style={styles.areaLabel}>{item.date}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STADIUMS VIEW */}
            {activeView === "stadiums" && (
              <div style={styles.viewContainer}>
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>🏟️ Stadium Performance Analytics</h3>
                  <div style={styles.stadiumList}>
                    {stadiumStats.map((stat, idx) => (
                      <div key={idx} style={styles.stadiumItem}>
                        <div style={styles.stadiumHeader}>
                          <div style={styles.stadiumName}>{stat.stadium}</div>
                          <div style={styles.stadiumStats}>
                            <span>{stat.totalMatches} matches</span>
                            <span>•</span>
                            <span>{stat.totalAttendance.toLocaleString()} total</span>
                          </div>
                        </div>
                        <div style={styles.progressBar}>
                          <div style={{...styles.progressFill, width: `${stat.avgUtilization}%`}}>
                            <span style={styles.progressLabel}>{stat.avgUtilization.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart */}
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>📊 Total Attendance by Stadium</h3>
                  <div style={styles.barChart}>
                    {stadiumStats.map((stat, idx) => {
                      const maxAttendance = Math.max(...stadiumStats.map(s => s.totalAttendance));
                      const width = (stat.totalAttendance / maxAttendance) * 100;
                      return (
                        <div key={idx} style={styles.barItem}>
                          <div style={styles.barLabel}>{stat.stadium}</div>
                          <div style={styles.barContainer}>
                            <div style={{...styles.barFill, width: `${width}%`}}>
                              <span style={styles.barValue}>{stat.totalAttendance.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TRENDS VIEW */}
            {activeView === "trends" && (
              <div style={styles.viewContainer}>
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>📈 Utilization Comparison by Stadium</h3>
                  <div style={styles.lineChart}>
                    {stadiumStats.map((stat, idx) => {
                      const colors = ['#C1272D', '#D4AF37', '#006233', '#8B1E22', '#B8941F'];
                      return (
                        <div key={idx} style={styles.lineItem}>
                          <div style={styles.lineInfo}>
                            <div style={{...styles.lineDot, background: colors[idx % colors.length]}}></div>
                            <div style={styles.lineName}>{stat.stadium}</div>
                          </div>
                          <div style={styles.lineBar}>
                            <div style={{
                              ...styles.lineBarFill,
                              width: `${stat.avgUtilization}%`,
                              background: colors[idx % colors.length]
                            }}>
                              <span style={styles.lineValue}>{stat.avgUtilization.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.chartGrid}>
                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>⚠️ Anomaly Analysis</h3>
                    <div style={styles.anomalyStats}>
                      <div style={styles.anomalyStat}>
                        <div style={styles.anomalyNumber}>{anomalyCount}</div>
                        <div style={styles.anomalyLabel}>Total Anomalies</div>
                      </div>
                      <div style={styles.anomalyStat}>
                        <div style={styles.anomalyNumber}>
                          {((anomalyCount / matches.length) * 100).toFixed(1)}%
                        </div>
                        <div style={styles.anomalyLabel}>Anomaly Rate</div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>🎯 Performance Metrics</h3>
                    <div style={styles.metricsGrid}>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}>Max Attendance</div>
                        <div style={styles.metricValue}>
                          {Math.max(...matches.map(m => m.predicted_attendance)).toLocaleString()}
                        </div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}>Min Attendance</div>
                        <div style={styles.metricValue}>
                          {Math.min(...matches.map(m => m.predicted_attendance)).toLocaleString()}
                        </div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}>Avg per Match</div>
                        <div style={styles.metricValue}>
                          {(totalPredicted / matches.length).toFixed(0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS VIEW */}
            {activeView === "details" && (
              <div style={styles.viewContainer}>
                {/* Filters */}
                <div style={styles.filterCard}>
                  <select
                    value={stadiumFilter}
                    onChange={(e) => setStadiumFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All stadiums</option>
                    {stadiums.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={styles.filterInput}
                  />

                  <label style={styles.filterLabel}>
                    <input
                      type="checkbox"
                      checked={anomaliesOnly}
                      onChange={(e) => setAnomaliesOnly(e.target.checked)}
                      style={styles.filterCheckbox}
                    />
                    <span>Anomalies only</span>
                  </label>
                </div>

                {/* Data Table */}
                <div style={styles.tableCard}>
                  <h3 style={styles.chartTitle}>📋 Complete Match Data</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.tableHeader}>Match</th>
                          <th style={styles.tableHeader}>Stadium</th>
                          <th style={styles.tableHeader}>Date</th>
                          <th style={styles.tableHeader}>Previous</th>
                          <th style={styles.tableHeader}>Predicted</th>
                          <th style={styles.tableHeader}>Capacity</th>
                          <th style={styles.tableHeader}>Utilization</th>
                          <th style={styles.tableHeader}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatches.map((m) => (
                          <tr
                            key={m.id}
                            style={{
                              ...styles.tableRow,
                              ...(m.isAnomaly ? styles.tableRowAnomaly : {})
                            }}
                          >
                            <td style={styles.tableCell}>{m.team1} vs {m.team2}</td>
                            <td style={styles.tableCell}>{m.stadium}</td>
                            <td style={styles.tableCell}>{m.date} {m.time}</td>
                            <td style={styles.tableCell}>{m.previous_attendance.toLocaleString()}</td>
                            <td style={styles.tableCell}>{m.predicted_attendance.toLocaleString()}</td>
                            <td style={styles.tableCell}>{m.capacity.toLocaleString()}</td>
                            <td style={styles.tableCell}>{m.utilization.toFixed(1)}%</td>
                            <td style={styles.tableCell}>
                              <span style={m.isAnomaly ? styles.badgeAnomaly : styles.badgeOk}>
                                {m.isAnomaly ? "⚠️ Anomaly" : "✓ OK"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Refresh Button */}
        <button onClick={fetchMatches} style={styles.refreshBtn}>
          🔄 Refresh Data
        </button>

        {/* Footer */}
        <footer style={styles.footer}>
          CAN 2025 Organizer Dashboard • Powered by Cloudflare Workers & Supabase
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0F1419',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  pattern: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(193, 39, 45, 0.03) 35px, rgba(193, 39, 45, 0.03) 70px),
      repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(0, 98, 51, 0.03) 35px, rgba(0, 98, 51, 0.03) 70px)
    `,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '30px',
    background: 'linear-gradient(135deg, #C1272D 0%, #8B1E22 50%, #006233 100%)',
    borderRadius: '12px',
    border: '2px solid #D4AF37',
    boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '16px',
    color: '#D4AF37',
    margin: '0 0 10px 0',
  },
  updated: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    minWidth: '150px',
    padding: '15px 20px',
    background: '#1A2332',
    border: '2px solid #2A3647',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #C1272D 0%, #8B1E22 100%)',
    border: '2px solid #D4AF37',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
  },
  tabText: {
    letterSpacing: '0.5px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  kpiCard: {
    background: 'linear-gradient(135deg, #1A2332 0%, #0F1419 100%)',
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #2A3647',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  kpiIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #006233 0%, #004D28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#8B9AAF',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewContainer: {
    marginBottom: '30px',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  chartCard: {
    background: 'linear-gradient(135deg, #1A2332 0%, #0F1419 100%)',
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #2A3647',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: '20px',
    borderBottom: '2px solid #2A3647',
    paddingBottom: '12px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#0F1419',
    borderRadius: '8px',
    border: '1px solid #2A3647',
  },
  rankBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '18px',
    flexShrink: 0,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingMatch: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  rankingDetails: {
    fontSize: '12px',
    color: '#8B9AAF',
  },
  rankingValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  pieChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  pieSegment: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pieColor: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  pieLabel: {
    flex: 1,
    fontSize: '14px',
    color: '#FFFFFF',
  },
  pieValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  areaChart: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    height: '250px',
    padding: '20px 10px',
  },
  areaBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  areaBarFill: {
    width: '100%',
    background: 'linear-gradient(180deg, #D4AF37 0%, #C1272D 100%)',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    minHeight: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '8px 4px',
  },
  areaValue: {
    fontSize: '10px',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  areaLabel: {
    fontSize: '10px',
    color: '#8B9AAF',
    marginTop: '8px',
    transform: 'rotate(-45deg)',
    whiteSpace: 'nowrap',
  },
  stadiumList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stadiumItem: {
    padding: '16px',
    background: '#0F1419',
    borderRadius: '8px',
    border: '1px solid #2A3647',
  },
  stadiumHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  stadiumName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stadiumStats: {
    fontSize: '12px',
    color: '#8B9AAF',
    display: 'flex',
    gap: '8px',
  },
  progressBar: {
    width: '100%',
    height: '32px',
    background: '#1A2332',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #2A3647',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #006233 0%, #D4AF37 50%, #C1272D 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    transition: 'width 0.5s ease',
  },
  progressLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  barChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  barItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barLabel: {
    width: '140px',
    fontSize: '13px',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  barContainer: {
    flex: 1,
    height: '36px',
    background: '#0F1419',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #2A3647',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #C1272D 0%, #D4AF37 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    transition: 'width 0.5s ease',
  },
  barValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  lineChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  lineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  lineInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '180px',
    flexShrink: 0,
  },
  lineDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  lineName: {
    fontSize: '13px',
    color: '#FFFFFF',
  },
  lineBar: {
    flex: 1,
    height: '32px',
    background: '#0F1419',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #2A3647',
  },
  lineBarFill: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    transition: 'width 0.5s ease',
  },
  lineValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  anomalyStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  anomalyStat: {
    textAlign: 'center',
    padding: '24px',
    background: '#0F1419',
    borderRadius: '8px',
    border: '1px solid #C1272D',
  },
  anomalyNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#C1272D',
    marginBottom: '8px',
  },
  anomalyLabel: {
    fontSize: '14px',
    color: '#8B9AAF',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#0F1419',
    borderRadius: '8px',
    border: '1px solid #2A3647',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#8B9AAF',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  filterCard: {
    background: 'linear-gradient(135deg, #1A2332 0%, #0F1419 100%)',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #2A3647',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '20px',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '12px 16px',
    background: '#0F1419',
    border: '2px solid #2A3647',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
    minWidth: '200px',
    cursor: 'pointer',
  },
  filterInput: {
    padding: '12px 16px',
    background: '#0F1419',
    border: '2px solid #2A3647',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
    cursor: 'pointer',
  },
  filterCheckbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  tableCard: {
    background: 'linear-gradient(135deg, #1A2332 0%, #0F1419 100%)',
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #2A3647',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    background: '#0F1419',
  },
  tableHeader: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#D4AF37',
    textTransform: 'uppercase',
    borderBottom: '2px solid #2A3647',
  },
  tableRow: {
    borderBottom: '1px solid #2A3647',
    transition: 'background 0.2s ease',
  },
  tableRowAnomaly: {
    background: 'rgba(193, 39, 45, 0.1)',
    borderLeft: '4px solid #C1272D',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#FFFFFF',
  },
  badgeOk: {
    padding: '6px 12px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #006233 0%, #004D28 100%)',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  badgeAnomaly: {
    padding: '6px 12px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #C1272D 0%, #8B1E22 100%)',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  refreshBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #006233 0%, #C1272D 100%)',
    border: '2px solid #D4AF37',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '30px',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
    transition: 'transform 0.2s ease',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#8B9AAF',
    fontSize: '14px',
    borderTop: '2px solid #2A3647',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#D4AF37',
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#C1272D',
  },
}