import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('focus') === 'search') {
      document.querySelector('.search-container input')?.focus();
    }
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="search-wrapper">
      <form onSubmit={handleSearch} className={`search-container ${isFocused ? 'focused' : ''}`}>
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your favorite food..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <i className="fas fa-microphone voice-icon"></i>
      </form>
    </div>
  );
};

export default SearchBar;