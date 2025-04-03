import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <i className="fas fa-home"></i>
        <span>Home</span>
      </NavLink>
      <NavLink to="/canteens" className={`nav-item ${isActive('/canteens') ? 'active' : ''}`}>
        <i className="fas fa-store"></i>
        <span>Canteens</span>
      </NavLink>
      <NavLink to="/?focus=search" className={`nav-item ${isActive('/search') ? 'active' : ''}`}>
        <i className="fas fa-search"></i>
        <span>Search</span>
      </NavLink>
      <NavLink to="/orders" className={`nav-item ${isActive('/orders') ? 'active' : ''}`}>
        <i className="fas fa-receipt"></i>
        <span>Orders</span>
      </NavLink>
      <NavLink to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
        <i className="fas fa-user"></i>
        <span>Account</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;