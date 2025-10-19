import React, { useState, useEffect } from 'react';
import { ref, get, update } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import { db } from "../firebaseconfig";
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [currentView, setCurrentView] = useState('current'); // 'current' or 'past'

  // Fetch user data and orders when component mounts
  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        navigate("/");
        return;
      }

      try {
        // Fetch user data directly by UID
        const userRef = ref(db, `users/${currentUser.uid}`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          setUserName(fullName);
          // Store serial number for display
          localStorage.setItem('userSerial', userData.serialNumber || 'N/A');
        }

        // Fetch user orders
        const ordersRef = ref(db, 'orders');
        const ordersSnapshot = await get(ordersRef);
        if (ordersSnapshot.exists()) {
          const ordersData = ordersSnapshot.val();
          const userOrders = Object.entries(ordersData).filter(([key, order]) => order.userId === currentUser.uid);
          setOrders(userOrders);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndOrders();
  }, [navigate]);



  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate("/");
  };



  const handleCancelOrder = async (orderId) => {
    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, { status: "Cancelled" });
      alert("Order cancelled successfully.");
      // Refresh user orders
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const ordersRef = ref(db, 'orders');
      const ordersSnapshot = await get(ordersRef);
      if (ordersSnapshot.exists()) {
        const ordersData = ordersSnapshot.val();
        const userOrders = Object.entries(ordersData).filter(([key, order]) => order.userId === currentUser.uid);
        setOrders(userOrders);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Error cancelling order: " + error.message);
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>User Dashboard</h2>
        <div className="user-info">
          <p><strong>Name:</strong> {userName || 'Not available'}</p>
          <p><strong>Email:</strong> {JSON.parse(localStorage.getItem('currentUser'))?.email || 'Not available'}</p>
        </div>
        <div className="order-buttons">
          <button onClick={() => setCurrentView('current')} className={currentView === 'current' ? 'active' : ''}>Current Orders</button>
          <button onClick={() => setCurrentView('past')} className={currentView === 'past' ? 'active' : ''}>Past Orders</button>
        </div>
        <h3>{currentView === 'current' ? 'Current Orders' : 'Past Orders'}</h3>
        {(() => {
          const filteredOrders = orders.filter(([orderId, order]) => {
            const status = order.status || 'Pending';
            if (currentView === 'current') {
              return status === 'Pending' || status === 'Accepted';
            } else {
              return status === 'Completed' || status === 'Cancelled';
            }
          });
          return filteredOrders.length === 0 ? (
            <p>No {currentView === 'current' ? 'current' : 'past'} orders found.</p>
          ) : (
            <ul className="order-list">
              {filteredOrders.map(([orderId, order]) => (
                <li key={orderId} className="order-item">
                  <div className="order-header">
                    <p><strong>Order No:</strong> {order.orderSerial || orderId}</p>
                    <p><strong>Time:</strong> {order.orderTime}</p>
                  </div>
                  <div className="order-details">
                    <p><strong>Item:</strong> {order.itemName}</p>
                    <p><strong>Price:</strong> ৳{order.price}</p>
                    <p><strong>Quantity:</strong> {order.quantity}</p>
                    <p><strong>Category:</strong> {order.category}</p>
                    <p><strong>Status:</strong> {order.status || 'Pending'}</p>
                    {order.status !== "Cancelled" && order.status !== "Completed" && (
                      <button onClick={() => handleCancelOrder(orderId)} className="cancel-button">Cancel Order</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          );
        })()}
        <div className="dashboard-actions">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
