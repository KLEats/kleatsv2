import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../App';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = cartItems.length > 0 ? 9.99 : 0;
  const total = subtotal + shipping;

  return (
    <div className="cart-container">
      <div className="cart-wrapper">
        <h1>Your Cart</h1>
        <p className="cart-description">
          Review your items and proceed to checkout when you're ready.
        </p>
        
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <i className="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <button onClick={() => navigate('/menu')} className="continue-shopping">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image-container">
                      <img src={item.image} alt={item.name} className="item-image" />
                    </div>
                    <div className="item-details">
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <p className="item-price">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-controls">
                          <button 
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              className="checkout-btn"
              onClick={() => navigate('/PlaceOrder')}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/menu')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;