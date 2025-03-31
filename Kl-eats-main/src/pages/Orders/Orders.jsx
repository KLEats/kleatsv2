import React, { useState } from 'react';
import './Orders.css';
import BottomNav from '../../components/BottomNav/BottomNav';

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const orders = [
    {
      id: 'ORD123456',
      date: 'March 15, 2023',
      time: '02:30 PM',
      status: 'Payment Completed',
      items: [
        { name: 'Chicken Burger', price: 199, quantity: 2 },
        { name: 'Fresh Fruit Juice', price: 89, quantity: 1 }
      ],
      deliveryAddress: 'Room 203, Student Hostel, University Campus',
      canteen: 'Campus Café',
      total: 599
    },
    {
      id: 'ORD123457',
      date: 'March 18, 2023',
      time: '12:15 PM',
      status: 'Payment Completed',
      items: [
        { name: 'Veg Sandwich', price: 149, quantity: 1 },
        { name: 'Cold Coffee', price: 79, quantity: 2 }
      ],
      deliveryAddress: 'Room 203, Student Hostel, University Campus',
      canteen: 'Campus Café',
      total: 307
    },
    {
      id: 'ORD123458',
      date: 'March 20, 2023',
      time: '07:45 PM',
      status: 'Payment Completed',
      items: [
        { name: 'Pizza Margherita', price: 249, quantity: 1 },
        { name: 'Garlic Bread', price: 99, quantity: 1 },
        { name: 'Coke', price: 49, quantity: 2 }
      ],
      deliveryAddress: 'Room 205, Student Hostel, University Campus',
      canteen: 'Italian Corner',
      total: 446
    },
    {
      id: 'ORD123459',
      date: 'March 22, 2023',
      time: '01:30 PM',
      status: 'Payment Completed',
      items: [
        { name: 'Butter Chicken', price: 299, quantity: 1 },
        { name: 'Naan', price: 35, quantity: 2 },
        { name: 'Sweet Lassi', price: 79, quantity: 1 }
      ],
      deliveryAddress: 'Room 210, Student Hostel, University Campus',
      canteen: 'Indian Delights',
      total: 448
    },
    {
      id: 'ORD123460',
      date: 'March 23, 2023',
      time: '06:20 PM',
      status: 'Payment Completed',
      items: [
        { name: 'Hakka Noodles', price: 189, quantity: 1 },
        { name: 'Spring Rolls', price: 129, quantity: 1 },
        { name: 'Green Tea', price: 59, quantity: 1 }
      ],
      deliveryAddress: 'Room 208, Student Hostel, University Campus',
      canteen: 'Asian Fusion',
      total: 377
    }
  ];

  return (
    <div className="orders-container">
      <div className="orders-wrapper">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order.id}</div>
                <div className="order-date">
                  Placed on {order.date} at {order.time}
                </div>
                <div className="payment-status">
                  <i className="fas fa-check-circle"></i>
                  {order.status}
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-name-qty">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">× {item.quantity}</span>
                    </div>
                    <div className="item-price">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="delivery-address">
                <i className="fas fa-map-marker-alt"></i>
                <span>{order.deliveryAddress}</span>
              </div>

              <div className="order-footer">
                <div className="canteen-name">
                  <i className="fas fa-store"></i>
                  {order.canteen}
                </div>
                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{order.total}</span>
                </div>
              </div>

              <button className="view-details-btn" onClick={() => handleViewDetails(order)}>
                <i className="fas fa-file-alt"></i>
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="order-info-section">
                <h3>Order Information</h3>
                <p><strong>Order ID:</strong> #{selectedOrder.id}</p>
                <p><strong>Date:</strong> {selectedOrder.date}</p>
                <p><strong>Time:</strong> {selectedOrder.time}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>
              </div>

              <div className="order-items-section">
                <h3>Items Ordered</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="modal-order-item">
                    <div className="item-details">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <span className="item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="total-section">
                  <strong>Total Amount:</strong>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>

              <div className="delivery-section">
                <h3>Delivery Information</h3>
                <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                <p><strong>Canteen:</strong> {selectedOrder.canteen}</p>
              </div>

              <div className="modal-actions">
                <button className="print-btn" onClick={handlePrint}>
                  <i className="fas fa-print"></i>
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Orders;