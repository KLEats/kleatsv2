// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import './AdminPortal.css';
import { useNavigate } from 'react-router-dom';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const [stats] = useState({
    totalOrders: 156,
    activeCanteens: 12,
    totalUsers: 450,
    revenue: 25600
  });

  const handleLogout = () => {
    // Add any logout logic here (clear tokens, etc.)
    navigate('/admin-login');
  };

  return (
    <div className="admin-portal">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Admin Portal</h2>
        </div>
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button 
            className={`nav-item ${activeTab === 'canteens' ? 'active' : ''}`}
            onClick={() => setActiveTab('canteens')}
          >
            Canteens
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="admin-profile">
            <span>Admin</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p>{stats.totalOrders}</p>
              </div>
              <div className="stat-card">
                <h3>Active Canteens</h3>
                <p>{stats.activeCanteens}</p>
              </div>
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{stats.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3>Revenue (₹)</h3>
                <p>{stats.revenue}</p>
              </div>
            </div>
          )}
          {/* Add other tab content here */}
        </div>
      </main>
    </div>
  );
};

export default AdminPortal; 