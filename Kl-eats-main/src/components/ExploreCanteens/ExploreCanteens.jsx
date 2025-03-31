import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExploreCanteens.css';

const canteens = [
  {
    id: 1,
    name: 'KL ADDA',
    rating: 4.3,
    reviews: '(850+)',
    time: '10-15 mins',
    cuisine: 'South Indian, Chinese, Fast Food',
    location: 'Near Block 3, KL University',
    image: '/images/kl-adda.jpg'
  },
  {
    id: 2,
    name: 'US Pizza',
    rating: 4.1,
    reviews: '(500+)',
    time: '15-20 mins',
    cuisine: 'Pizza, Italian, Fast Food',
    location: 'Food Court, KL University',
    image: '/images/us-pizza.jpg'
  },
  {
    id: 3,
    name: 'Main Canteen',
    rating: 4.2,
    reviews: '(1.2K+)',
    time: '5-10 mins',
    cuisine: 'North Indian, South Indian',
    location: 'Main Block, KL University',
    image: '/images/main-canteen.jpg'
  },
  {
    id: 4,
    name: 'Sateesh Canteen',
    rating: 4.4,
    reviews: '(650+)',
    time: '15-20 mins',
    cuisine: 'South Indian, Beverages',
    location: 'Block 5, KL University',
    image: '/images/sateesh-canteen.jpg'
  },
  {
    id: 5,
    name: 'Hostel Canteen',
    rating: 4.0,
    reviews: '(300+)',
    time: '10-15 mins',
    cuisine: 'North Indian, Chinese',
    location: 'Boys Hostel, KL University',
    image: '/images/hostel-canteen.jpg'
  },
  {
    id: 6,
    name: 'Naturals',
    rating: 4.5,
    reviews: '(900+)',
    time: '15-20 mins',
    cuisine: 'Ice Cream, Desserts',
    location: 'Food Court, KL University',
    image: '/images/naturals.jpg'
  }
];

const ExploreCanteens = () => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const displayedCanteens = showAll ? canteens : canteens.slice(0, 3);

  const handleViewMenu = (canteenId) => {
    navigate(`/canteen/${canteenId}/menu`);
  };

  return (
    <div className="explore-canteens">
      <h2>Top restaurants to explore</h2>
      <div className="canteens-list">
        {displayedCanteens.map((canteen) => (
          <div key={canteen.id} className="canteen-card">
            <div className="canteen-image">
              <img src={canteen.image} alt={canteen.name} />
            </div>
            <div className="canteen-info">
              <div className="canteen-header">
                <h3>{canteen.name}</h3>
                <button 
                  className="view-menu-btn" 
                  onClick={() => handleViewMenu(canteen.id)}
                  aria-label="View menu"
                >
                  →
                </button>
              </div>
              <div className="rating-time">
                <span className="rating">
                  ★ {canteen.rating} {canteen.reviews}
                </span>
                <span className="dot">•</span>
                <span className="time">{canteen.time}</span>
              </div>
              <p className="cuisine">{canteen.cuisine}</p>
              <p className="location">{canteen.location}</p>
            </div>
          </div>
        ))}
      </div>
      {!showAll && (
        <button className="view-more-btn" onClick={() => setShowAll(true)}>
          View More Canteens
        </button>
      )}
    </div>
  );
};

export default ExploreCanteens;
