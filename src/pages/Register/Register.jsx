import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    email: '',
    mobileNumber: '',
    year: '1',
    password: '',
    confirmPassword: ''
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
    <div className="register-container">
      <div className="register-content">
        <div className="register-box">
          <div className="register-header">
            <h2>Create Account</h2>
            <p>Join KL Eats and start your food journey</p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="idNumber">Student ID Number</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter your ID number"
                />
              </div>
            </div>

            <div className="form-row">
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
                <label htmlFor="mobileNumber">Mobile Number</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="year">Year of Study</label>
              <div className="input-wrapper">
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>

            <div className="form-row">
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
                    placeholder="Create password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            <div className="form-group terms">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
            </div>

            <button type="submit" className="register-btn">
              Create Account
            </button>
          </form>

          <div className="register-footer">
            <p>Already have an account?</p>
            <Link to="/signin" className="signin-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
