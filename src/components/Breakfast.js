import React, { useState } from 'react';
import { getDatabase, ref, push, get, set } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import app from "../firebaseconfig";
import './Breakfast.css';

function Breakfast() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});

  const breakfastItems = [
    {
      id: 1,
      name: 'Porota',
      description: 'Fluffy and soft porota fried with oildr',
      price: 10,
      image: '/images/porota.png',
    },
    {
      id: 2,
      name: 'Samosas',
      description: 'A tasty snack made with different fillings and spices',
      price: 10,
      image: '/images/img1.png',
      
    },
    {
      id: 3,
      name: 'Singara',
      description: 'A tasty snack made with different fillings and spices',
      price: 100,
      image: '/images/img3.png',
    },
    {
      id: 4,
      name: 'Alur Chop' ,
      description: 'A tasty cutlet made with mashed potato filling',
      price: 10,
      image: '/images/img2.png',
    },
    {
      id: 5,
      name: 'Cold Drinks',
      description: 'A refreshing beverage for customers',
      price: 25,
      image: '/images/img5.png',
    },
    {
      id: 6,
      name: 'Coffee Special',
      description: 'Freshly brewed coffee with your choice of milk',
      price: 20,
      image: '/images/coffee.png',
    }
  ];

  const handleOrder = async (item, quantity) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      navigate("/");
      return;
    }

    try {
      const db = getDatabase(app);

      // Generate global incrementing order serial number
      const globalOrderCounterRef = ref(db, 'globalOrderCounter');
      const counterSnapshot = await get(globalOrderCounterRef);
      let orderSerial = 1;
      if (counterSnapshot.exists()) {
        orderSerial = counterSnapshot.val() + 1;
      }
      await set(globalOrderCounterRef, orderSerial);

      const orderSerialStr = orderSerial.toString().padStart(2, '0');
      const orderData = {
        itemName: item.name,
        price: item.price * quantity,
        quantity: quantity,
        orderTime: new Date().toLocaleString(),
        userId: currentUser.uid,
        category: 'Breakfast',
        orderSerial: orderSerialStr
      };

      const orderRef = ref(db, `orders/${orderSerialStr}`);
      await set(orderRef, orderData);

      // Update local orders state with new order including serial as id
      setOrders(prevOrders => [...prevOrders, { ...orderData, id: orderSerialStr }]);

      alert(`Order placed successfully!\nItem: ${item.name}\nQuantity: ${quantity}\nTotal Price: ৳${item.price * quantity}\nTime: ${orderData.orderTime}\nOrder Serial: ${orderData.orderSerial}`);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    }
  };

  const handleBackToCategories = () => {
    navigate("/category");
  };

  return (
    <div className="breakfast-container">
      <div className="breakfast-header">
        <button onClick={handleBackToCategories} className="back-button">
          ← Back to Categories
        </button>
        <h1>Breakfast Menu</h1>
        <p>Start your day with our delicious breakfast</p>
      </div>

      <div className="breakfast-grid">
        {breakfastItems.map((item) => (
          <div key={item.id} className="breakfast-card">
            <div className="breakfast-image">
              <span className="item-icon">{item.icon}</span>
              <img src={item.image} alt={item.name} />
            </div>
            <div className="breakfast-content">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="breakfast-footer">
                <span className="price">৳{item.price * (quantities[item.id] || 1)}</span>
                <div className="quantity-input">
                  <label>Qty: </label>
                  <input
                    type="number"
                    min="1"
                    value={quantities[item.id] || 1}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setQuantities(prev => ({ ...prev, [item.id]: qty }));
                    }}
                  />
                </div>
                <button
                  onClick={() => handleOrder(item, quantities[item.id] || 1)}
                  className="order-button"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="breakfast-footer">
        <p>Enjoy your meal! Your orders will be displayed in the dashboard.</p>
      </div>
    </div>
  );
}

export default Breakfast;
