'use client';

import { useState, useEffect } from 'react';
import { Win, User, Bet } from '@/lib/types';

interface Statistics {
  totalUsers: number;
  totalBets: number;
  winningBets: number;
  losingBets: number;
  winRate: number;
  totalWins: number;
  pendingWins: number;
  processingWins: number;
  orderedWins: number;
  shippedWins: number;
  deliveredWins: number;
  totalStakesCollected: number;
  totalValuePaidOut: number;
  profitLoss: number;
}

export default function AdminDashboard() {
  const [wins, setWins] = useState<Win[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedWin, setSelectedWin] = useState<Win | null>(null);
  const [viewMode, setViewMode] = useState<'wins' | 'all'>('wins');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    }
  };

  const fetchData = async () => {
    try {
      // Fetch wins, bets, and stats in parallel
      const [winsResponse, betsResponse, statsResponse] = await Promise.all([
        fetch('/api/wins'),
        fetch('/api/bets'),
        fetch('/api/stats')
      ]);

      const winsData = await winsResponse.json();
      const betsData = await betsResponse.json();
      const statsData = await statsResponse.json();

      if (winsData.success) {
        setWins(winsData.data);
      }

      if (betsData.success) {
        setBets(betsData.data);
      }

      // Collect all unique user IDs from both wins and bets
      const allUserIds = new Set<string>();
      if (winsData.success) {
        winsData.data.forEach((win: Win) => allUserIds.add(win.userId));
      }
      if (betsData.success) {
        betsData.data.forEach((bet: Bet) => allUserIds.add(bet.userId));
      }

      // Fetch user details for each unique userId
      const userMap = new Map();
      for (const userId of allUserIds) {
        try {
          const userResponse = await fetch(`/api/users?id=${userId}`);
          const userData = await userResponse.json();
          if (userData.success && userData.data) {
            userMap.set(userId, userData.data);
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }
      
      setUsers(userMap);

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWinStatus = async (winId: string, newStatus: Win['status'], orderDetails?: any) => {
    try {
      const response = await fetch(`/api/wins/${winId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          orderDetails
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data
        setSelectedWin(null);
      } else {
        alert('Error updating win status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating win:', error);
      alert('Error updating win status');
    }
  };

  const resetDashboard = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        await fetchData(); // Refresh data
        alert('Dashboard cleared successfully');
      } else {
        alert('Error clearing dashboard: ' + data.error);
      }
    } catch (error) {
      console.error('Error clearing dashboard:', error);
      alert('Error clearing dashboard');
    }
  };

  const getStatusColor = (status: Win['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'ordered': return '#8b5cf6';
      case 'shipped': return '#06b6d4';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const LoginForm = () => {
    const [password, setPassword] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin(password);
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          width: '400px',
          maxWidth: '90%'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1f2937' }}>🎰 ShopSpin Admin</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Admin Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#1f2937' }}>🎰 ShopSpin Admin Dashboard</h1>

      {/* Statistics Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Total Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.totalUsers}</p>
          </div>
          <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Total Bets</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#78350f' }}>{stats.totalBets}</p>
            <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#92400e', opacity: 0.8 }}>
              {stats.winningBets} wins, {stats.losingBets} losses
            </p>
          </div>
          <div style={{ background: '#e0f2fe', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0277bd' }}>Win Rate</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#01579b' }}>{stats.winRate}%</p>
          </div>
          <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>Pending Fulfillment</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#7f1d1d' }}>{stats.pendingWins}</p>
          </div>
          <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#166534' }}>Delivered</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>{stats.deliveredWins}</p>
          </div>
          <div style={{ background: '#dbeafe', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Total Value Paid Out</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e3a8a' }}>${stats.totalValuePaidOut.toFixed(2)}</p>
          </div>
          <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#3730a3' }}>Total Stakes Collected</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#312e81' }}>${stats.totalStakesCollected.toFixed(2)}</p>
          </div>
          <div style={{ 
            background: stats.profitLoss >= 0 ? '#dcfce7' : '#fee2e2', 
            padding: '20px', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: stats.profitLoss >= 0 ? '#166534' : '#991b1b' 
            }}>
              Total P/L
            </h3>
            <p style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: 0, 
              color: stats.profitLoss >= 0 ? '#14532d' : '#7f1d1d' 
            }}>
              {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
            </p>
            <p style={{ 
              fontSize: '12px', 
              margin: '5px 0 0 0', 
              color: stats.profitLoss >= 0 ? '#166534' : '#991b1b',
              opacity: 0.8
            }}>
              {stats.profitLoss >= 0 ? 'Profit' : 'Loss'} (Stakes - Payouts)
            </p>
          </div>
        </div>
      )}

      {/* Activity Table */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Activity</h2>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'wins' | 'all')}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="wins">Recent Wins</option>
              <option value="all">All Activity</option>
            </select>
          </div>
          <button
            onClick={resetDashboard}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear Dashboard
          </button>
        </div>
        
{(() => {
          const dataToShow = viewMode === 'wins' ? wins : bets;
          const hasData = dataToShow.length > 0;
          
          return !hasData ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              {viewMode === 'wins' ? 'No wins recorded yet. Waiting for users to win!' : 'No activity recorded yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Value</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Stake</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      {viewMode === 'wins' ? 'Status' : 'Result'}
                    </th>
                    {viewMode === 'wins' && (
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viewMode === 'wins' 
                    ? wins.map((win) => {
                        const user = users.get(win.userId);
                        return (
                          <tr key={win.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px' }}>
                              {new Date(win.winTimestamp).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {user ? (
                                <div>
                                  <div style={{ fontWeight: '500' }}>{user.name}</div>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                                </div>
                              ) : (
                                <span style={{ color: '#6b7280' }}>Loading...</span>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ maxWidth: '200px' }}>
                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{win.product.name}</div>
                                <a 
                                  href={win.product.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                                >
                                  View Product →
                                </a>
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>
                              ${win.product.price.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              ${win.stakeAmount.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: getStatusColor(win.status) + '20',
                                color: getStatusColor(win.status),
                                border: `1px solid ${getStatusColor(win.status)}40`
                              }}>
                                {win.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => setSelectedWin(win)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    : bets.map((bet) => {
                        const user = users.get(bet.userId);
                        return (
                          <tr key={bet.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px' }}>
                              {new Date(bet.betTimestamp).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {user ? (
                                <div>
                                  <div style={{ fontWeight: '500' }}>{user.name}</div>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                                </div>
                              ) : (
                                <span style={{ color: '#6b7280' }}>Loading...</span>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ maxWidth: '200px' }}>
                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{bet.product.name}</div>
                                <a 
                                  href={bet.product.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                                >
                                  View Product →
                                </a>
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>
                              ${bet.product.price.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              ${bet.stakeAmount.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: bet.won ? '#dcfce7' : '#fee2e2',
                                color: bet.won ? '#166534' : '#991b1b',
                                border: bet.won ? '1px solid #16653440' : '1px solid #991b1b40'
                              }}>
                                {bet.won ? 'WON' : 'LOST'}
                              </span>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                                {(bet.probability * 100).toFixed(1)}% chance
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Win Management Modal */}
      {selectedWin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Manage Win</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>Product:</strong> {selectedWin.product.name}<br/>
              <strong>Value:</strong> ${selectedWin.product.price.toFixed(2)}<br/>
              <strong>User:</strong> {users.get(selectedWin.userId)?.name}<br/>
              <strong>Current Status:</strong> {selectedWin.status}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Update Status:
              </label>
              <select
                onChange={(e) => {
                  const newStatus = e.target.value as Win['status'];
                  updateWinStatus(selectedWin.id, newStatus);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
                defaultValue={selectedWin.status}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ordered">Ordered</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {users.get(selectedWin.userId) && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                <strong>Shipping Address:</strong><br/>
                {users.get(selectedWin.userId)!.address.street}<br/>
                {users.get(selectedWin.userId)!.address.city}, {users.get(selectedWin.userId)!.address.state} {users.get(selectedWin.userId)!.address.zipCode}<br/>
                {users.get(selectedWin.userId)!.address.country}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedWin(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}