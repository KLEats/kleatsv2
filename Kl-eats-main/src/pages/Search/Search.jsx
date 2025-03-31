import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './Search.css';
import SearchBar from '../../components/SearchBar/SearchBar';
import BottomNav from '../../components/BottomNav/BottomNav';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search</h1>
        <p>Find your favorite dishes and canteens</p>
      </div>
      <SearchBar />
      <div className="search-results">
        {query && (
          <div className="search-query-info">
            <p>Showing results for: <strong>{query}</strong></p>
          </div>
        )}
        {/* Search results will be implemented here */}
      </div>
      <BottomNav />
    </div>
  );
};

export default Search;