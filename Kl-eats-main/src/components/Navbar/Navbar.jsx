import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { CartContext } from '../../App';
import Team from '../team/team';

const Navbar = () => {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <img 
          src={assets.lugo} 
          alt="Logo" 
          className="logo" 
          onClick={() => navigate('/')}
        />

        {/* Right Actions */}
        <div className="navbar-actions">
          <Link to="/cart" className="nav-icon-btn">
            <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 20C9 21.1 8.1 22 7 22C5.9 22 5 21.1 5 20C5 18.9 5.9 18 7 18C8.1 18 9 18.9 9 20Z" />
              <path d="M20 20C20 21.1 19.1 22 18 22C16.9 22 16 21.1 16 20C16 18.9 16.9 18 18 18C19.1 18 20 18.9 20 20Z" />
              <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L4.707 15.293C4.077 15.923 4.523 17 5.414 17H17" />
            </svg>
            {cartItemCount > 0 && <span className="nav-badge">{cartItemCount}</span>}
          </Link>
          
          <button 
            className="nav-icon-btn"
            onClick={() => navigate('/profile')}
          >
            <div className="nav-avatar">R</div>
          </button>

          <button 
            className="menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
          
          {isMenuOpen && (
            <div className="dropdown-content">
              <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact Us</Link>
              <Link to="/team" onClick={() => setIsMenuOpen(false)}>Our Team</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
              <Link to="/help" onClick={() => setIsMenuOpen(false)}>Help & Support</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
