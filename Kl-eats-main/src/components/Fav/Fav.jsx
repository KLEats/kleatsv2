import React, { useRef } from 'react';
import './Fav.css';

const Fav = () => {
  const sliderRef = useRef(null);

  const favFoods = [
    {
      id: 1,
      name: 'Chicken Biryani',
      restaurant: 'KL ADDA',
      price: '₹180',
      image: '/images/biryani.jpg',
      rating: 4.5,
      reviews: '(500+)'
    },
    {
      id: 2,
      name: 'Margherita Pizza',
      restaurant: 'US Pizza',
      price: '₹249',
      image: '/images/pizza.jpg',
      rating: 4.3,
      reviews: '(350+)'
    },
    {
      id: 3,
      name: 'Masala Dosa',
      restaurant: 'Main Canteen',
      price: '₹60',
      image: '/images/dosa.jpg',
      rating: 4.4,
      reviews: '(400+)'
    },
    {
      id: 4,
      name: 'Butter Chicken',
      restaurant: 'Sateesh Canteen',
      price: '₹220',
      image: '/images/butter-chicken.jpg',
      rating: 4.6,
      reviews: '(600+)'
    },
    {
      id: 5,
      name: 'Ice Cream Sundae',
      restaurant: 'Naturals',
      price: '₹150',
      image: '/images/sundae.jpg',
      rating: 4.7,
      reviews: '(300+)'
    }
  ];

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fav-section">
      <div className="fav-header">
        <h2>Your Favorites</h2>
        <div className="slider-controls">
          <button className="slider-btn" onClick={() => scroll('left')}>
            ←
          </button>
          <button className="slider-btn" onClick={() => scroll('right')}>
            →
          </button>
        </div>
      </div>
      
      <div className="fav-slider" ref={sliderRef}>
        {favFoods.map((food) => (
          <div key={food.id} className="fav-card">
            <div className="fav-image">
              <img src={food.image} alt={food.name} />
              <button className="remove-fav">×</button>
            </div>
            <div className="fav-info">
              <h3>{food.name}</h3>
              <p className="restaurant">{food.restaurant}</p>
              <div className="rating-price">
                <span className="rating">
                  ★ {food.rating} {food.reviews}
                </span>
                <span className="price">{food.price}</span>
              </div>
              <button className="order-now">Order Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fav;
