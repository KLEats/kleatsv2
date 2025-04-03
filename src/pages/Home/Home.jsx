// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import './Home.css';
import Footer from '../../components/Footer/Footer';
import ExploreCanteens from '../../components/ExploreCanteens/ExploreCanteens';
import Fav from '../../components/Fav/Fav';
import BottomNav from '../../components/BottomNav/BottomNav';
import PromotionalBanner from '../../components/PromotionalBanner/PromotionalBanner';
import SearchBar from '../../components/SearchBar/SearchBar';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const foodCategories = [
    { id: 'all', name: 'All', image: '/images/all-food.png' },
    { id: 'biryani', name: 'Biryani', image: '/images/biryani.png' },
    { id: 'pizza', name: 'Pizza', image: '/images/pizza.png' },
    { id: 'burger', name: 'Burger', image: '/images/burger.png' },
    { id: 'chicken', name: 'Chicken', image: '/images/chicken.png' },
    { id: 'dosa', name: 'Dosa', image: '/images/dosa.png' },
    { id: 'fried-rice', name: 'Fried Rice', image: '/images/fried-rice.png' },
    { id: 'manchurian', name: 'Manchurian', image: '/images/manchurian.png' },
    { id: 'pastry', name: 'Pastry', image: '/images/pastry.png' },
  ];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    // Add your filtering logic here
  };

  return (
    <div className="home">
     
      <SearchBar />
      
      {/* Food Categories Slider */}
      <div className="categories-wrapper">
        <div className="categories-container">
          {foodCategories.map((category) => (
            <div
              key={category.id}
              className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="category-image-container">
                <img src={category.image} alt={category.name} loading="lazy" />
              </div>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      
      <PromotionalBanner />
      <ExploreCanteens/>
      <Fav />
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Home;