// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your admin authentication logic here
    // For demo purposes, using a simple check
    if (formData.username === 'admin' && formData.password === 'admin123') {
      navigate('/admin-portal');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="login-header">
          <i className="fas fa-user-shield"></i>
          <h2>Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user"></i> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="admin-login-btn">
            <i className="fas fa-sign-in-alt"></i> Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 