import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Canteens.css';

const Canteens = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [canteenData, setCanteenData] = useState(null);
  const [canteenLoading, setCanteenLoading] = useState(true);
  const [canteenError, setCanteenError] = useState(null);

  const [canteens, setCanteens] = useState([]);
  const [canteensLoading, setCanteensLoading] = useState(true);
  const [canteensError, setCanteensError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch specific canteen data
  useEffect(() => {
    const fetchCanteenData = async () => {
      try {
        setCanteenLoading(true);
        const response = await axios.get(`http://localhost:5000/api/explore/canteens/${id}`);
        setCanteenData(response.data);
      } catch (err) {
        setCanteenError('Failed to fetch canteen details');
        console.error('Error:', err);
      } finally {
        setCanteenLoading(false);
      }
    };

    if (id) fetchCanteenData();
  }, [id]);

  // Fetch list of all canteens
  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        setCanteensLoading(true);
        const response = await axios.get('http://localhost:5000/api/explore/canteens');
        setCanteens(response.data);
      } catch (err) {
        setCanteensError('Failed to fetch canteens');
        console.error('Error fetching canteens:', err);
      } finally {
        setCanteensLoading(false);
      }
    };

    fetchCanteens();
  }, []);

  const formatCategory = (category) => {
    return category
      .split(' ') // Split words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize
      .join(' '); // Join back
  };

  // Handle loading states
  if (canteenLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (canteenError || !canteenData) {
    return <div className="error-message">{canteenError || 'Canteen not found'}</div>;
  }

  const categories = ['all', ...new Set(canteenData.menu.map(item => item.category))];
  const filteredMenu = activeCategory === 'all' 
    ? canteenData.menu 
    : canteenData.menu.filter(item => item.category === activeCategory);

  return (
    <div className="canteen-page">
      {/* Hero Section */}
      <div 
        className="canteen-hero" 
        style={{ backgroundImage: `url(${canteenData.coverImage})` }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>{canteenData.name}</h1>
            <div className="canteen-meta">
              <span className="rating">
                <i className="fas fa-star"></i> {canteenData.rating}
              </span>
              <span className="location">
                <i className="fas fa-map-marker-alt"></i> {canteenData.location}
              </span>
              <span className={`status ${canteenData.isOpen ? 'open' : 'closed'}`}>
                {canteenData.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="menu-section">
        <div className="container">
          {/* Category Navigation */}
          <div className="category-nav">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {formatCategory(category)}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="menu-grid">
            {filteredMenu.map(item => (
              <div key={item.id} className="menu-item">
                <div className="menu-item-image">
                  <img src={item.image} alt={item.name} />
                  {item.isAvailable ? (
                    <button className="add-to-cart">
                      <i className="fas fa-plus"></i>
                    </button>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>
                <div className="menu-item-info">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <div className="price-row">
                    <span className="price">₹{item.price}</span>
                    {item.originalPrice && (
                      <span className="original-price">₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canteens List */}
      <div className="canteens-grid">
        {canteensLoading ? (
          <div className="loading-container">
            <div className="loader"></div>
          </div>
        ) : canteensError ? (
          <div className="error-message">{canteensError}</div>
        ) : (
          canteens.map((canteen) => (
            <div key={canteen._id || canteen.id} className="canteen-card">
              <div className="canteen-image">
                <img src={canteen.imageUrl} alt={canteen.name} />
              </div>
              <div className="canteen-info">
                <h3>{canteen.name}</h3>
                <p>{canteen.description}</p>
                <div className="canteen-details">
                  <span className="location">{canteen.location}</span>
                  <span className={`status ${canteen.isOpen ? 'open' : 'closed'}`}>
                    {canteen.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* View All Canteens Button */}
      <div className="view-all-container">
        <button 
          className="view-all-btn"
          onClick={() => navigate('/canteens')}
        >
          View All Canteens
        </button>
      </div>
    </div>
  );
};

export default Canteens;
