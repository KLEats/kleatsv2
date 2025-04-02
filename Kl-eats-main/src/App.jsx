import React, { createContext, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import SignIn from './pages/SignIn/SignIn';
import Register from './pages/Register/Register';
import Canteens from './pages/Canteens/Canteens';
import Profile from './pages/Profile/Profile';
import Team from './components/team/team';
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs"; 



export const CartContext = createContext();

const App = () => {
  const [cartItems, setCartItems] = useState([]);

  // Cart management functions
  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity 
    }}>
      <div className='app'>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/Cart' element={<Cart />} />
          <Route path='/PlaceOrder' element={<PlaceOrder />} />
          <Route path='/signin' element={<SignIn />} />
          <Route path='/register' element={<Register />} />
          <Route path='/canteens' element={<Canteens />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/team' element={<Team />} />
          <Route path="/about" element={<AboutUs />}/>
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </div>
    </CartContext.Provider>
  );
};

export default App;
