import React, { useState, useEffect } from 'react';
import './PromotionalBanner.css';

const PromotionalBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const offers = [
    {
      title: "Flat ₹125 off on dinner",
      description: "on orders in KLADDA",
      extraOffer: "Get a free sugarcane juice",
      image: "/images/food-banner.png"
    },
    {
      title: "2% off on breakfast",
      description: "Valid from 7 AM to 11 AM",
      extraOffer: "Additional 10% off on KLeats",
      image: "/images/breakfast-banner.png"
    },
    {
      title: "Buy 1 Get 1 Free",
      description: "on selected items",
      extraOffer: "Free delivery on orders above ₹399",
      image: "/images/special-offer.png"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % offers.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="promotional-banner">
      <div className="banner-slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {offers.map((offer, index) => (
          <div key={index} className="banner-content">
            <div className="banner-text">
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
              <p className="extra-offer">{offer.extraOffer}</p>
              <button className="order-now-btn">ORDER NOW</button>
            </div>
            <div className="banner-image">
              <img src={offer.image} alt="Promotional Offer" />
            </div>
          </div>
        ))}
      </div>
      <div className="banner-dots">
        {offers.map((_, index) => (
          <span
            key={index}
            className={`dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default PromotionalBanner;