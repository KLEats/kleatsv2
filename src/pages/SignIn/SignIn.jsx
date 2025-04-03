import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignIn.css';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
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
    console.log('Form submitted:', formData);
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <div className="signin-box">
          <div className="signin-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to continue your food journey</p>
          </div>
          
          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="signin-btn">
              Sign In
            </button>
          </form>

          <div className="signin-footer">
            <p>Don't have an account?</p>
            <Link to="/register" className="signup-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 