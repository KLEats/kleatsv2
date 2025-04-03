import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import BottomNav from '../../components/BottomNav/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    fetchUserData();
    const darkModeEnabled = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeEnabled);
    if (darkModeEnabled) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`profile-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="profile-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Profile</h1>
        <button className="edit-profile">Edit Profile</button>
      </div>

      <div className="profile-content">
        {/* User Info */}
        <div className="user-info-section">
          <div className="avatar">R</div>
          <div className="user-details">
            <h2>{userData?.name || "Raunit"}</h2>
            <p>{userData?.email || "2300033572@KLUNIVERSITY.in"}</p>
          </div>
        </div>

        {/* Current Order */}
        <div className="order-status">
          <h3>Current Order</h3>
          <p className="order-details">Chicken Biryani • ₹249</p>
          <span className="status-badge">Ready for pickup</span>
        </div>

        {/* Membership */}
        <button className="membership-card">
          <span className="primary-text">Become a Member</span>
          <span className="secondary-text">Get exclusive benefits and offers</span>
        </button>

        {/* Quick Actions */}
        <div className="actions-section">
          {/* Orders Section */}
          <div className="action-group">
            <button 
              className="action-button"
              onClick={() => setShowOrders(!showOrders)}
            >
              <div className="action-content">
                <i className="fas fa-receipt"></i>
                <span>Orders</span>
              </div>
              <i className={`fas fa-chevron-${showOrders ? 'down' : 'right'}`}></i>
            </button>
            {showOrders && (
              <div className="recent-preview">
                <div className="recent-item">
                  <img src="/food-image.jpg" alt="Food" className="item-image" />
                  <div className="item-details">
                    <div className="item-main-info">
                      <h4>Chicken Biryani</h4>
                      <span className="item-price">₹249</span>
                    </div>
                    <div className="item-sub-info">
                      <p>KL ADDA • Today, 2:30 PM</p>
                      <span className="status delivered">Delivered</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/orders')}
                >
                  View All Orders
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}
          </div>

          {/* Favorites Button */}
          <button className="action-button">
            <div className="action-content">
              <i className="fas fa-heart"></i>
              <span>Favorites</span>
            </div>
            <i className="fas fa-chevron-right"></i>
          </button>

          {/* Payments Section */}
          <div className="action-group">
            <button 
              className="action-button"
              onClick={() => setShowPayments(!showPayments)}
            >
              <div className="action-content">
                <i className="fas fa-credit-card"></i>
                <span>Payments</span>
              </div>
              <i className={`fas fa-chevron-${showPayments ? 'down' : 'right'}`}></i>
            </button>
            {showPayments && (
              <div className="recent-preview">
                <div className="recent-item">
                  <div className="payment-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div className="item-details">
                    <div className="item-main-info">
                      <h4>Last Payment</h4>
                      <span className="item-price">₹249</span>
                    </div>
                    <div className="item-sub-info">
                      <p>•••• 4242 • Today, 2:30 PM</p>
                      <span className="status success">Successful</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/payments')}
                >
                  View All Payments
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="settings-section">
          <div className="setting-item">
            <span className="setting-label"><i className="fas fa-leaf"></i> Veg Only</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isVegOnly}
                onChange={() => setIsVegOnly(!isVegOnly)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <span className="setting-label"><i className="fas fa-moon"></i> Dark Mode</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={() => setIsDarkMode(!isDarkMode)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Account Actions */}
        <div className="account-actions">
          <button className="logout-btn">Logout</button>
          <button className="switch-account-btn">Login Another Account</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
