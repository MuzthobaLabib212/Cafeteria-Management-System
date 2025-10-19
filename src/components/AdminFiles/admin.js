import React, { useState, useEffect } from 'react';
import { ref, get, set, update, push, remove } from "firebase/database";
import { db } from "../../firebaseconfig";
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "", items: "" });
  const [newItem, setNewItem] = useState({});
  const [currentView, setCurrentView] = useState('current'); // 'current' or 'past'

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.isAdmin) {
      navigate("/");
      return;
    }
    setAdminName(currentUser.username);
    setAdminRole(currentUser.role);
    fetchOrders();
    fetchCategories();

    // Check for auto-completion every second
    const interval = setInterval(() => {
      checkAndCompleteOrders();
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const ordersRef = ref(db, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersList = Object.entries(ordersData).map(([id, order]) => ({ id, ...order }));
        setOrders(ordersList);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate("/");
  };

  const fetchCategories = async () => {
    try {
      const categoriesRef = ref(db, 'categories');
      const snapshot = await get(categoriesRef);
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesList = Object.entries(categoriesData).map(([id, category]) => ({ id, ...category }));
        setCategories(categoriesList);
      } else {
        // No categories found in database
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, { status: "Accepted", acceptedAt: Date.now() });
      alert("Order accepted");
      fetchOrders();
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      const categoriesRef = ref(db, 'categories');
      await push(categoriesRef, {
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon,
        items: newCategory.items.split(',').map(item => item.trim())
      });
      alert("Category added");
      setNewCategory({ name: "", description: "", icon: "", items: "" });
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const categoryRef = ref(db, `categories/${categoryId}`);
        await remove(categoryRef);
        alert("Category deleted");
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category");
      }
    }
  };

  const addItem = async (categoryId, item) => {
    if (!item.trim()) return;
    try {
      const categoryRef = ref(db, `categories/${categoryId}`);
      const snapshot = await get(categoryRef);
      if (snapshot.exists()) {
        const categoryData = snapshot.val();
        const updatedItems = [...(categoryData.items || []), item.trim()];
        await update(categoryRef, { items: updatedItems });
        alert("Item added");
        fetchCategories();
        setNewItem({ ...newItem, [categoryId]: "" });
      } else {
        alert("This category is not in the database. Please add it as a new category first to make it editable.");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item");
    }
  };

  const deleteItem = async (categoryId, itemIndex) => {
    try {
      const categoryRef = ref(db, `categories/${categoryId}`);
      const snapshot = await get(categoryRef);
      if (snapshot.exists()) {
        const categoryData = snapshot.val();
        const updatedItems = categoryData.items.filter((_, index) => index !== itemIndex);
        await update(categoryRef, { items: updatedItems });
        alert("Item deleted");
        fetchCategories();
      } else {
        alert("This category is not in the database. Please add it as a new category first to make it editable.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  };

  const checkAndCompleteOrders = async () => {
    try {
      const ordersRef = ref(db, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const now = Date.now();
        const updates = {};

        Object.entries(ordersData).forEach(([orderId, order]) => {
          if (order.status === 'Accepted' && order.acceptedAt && (now - order.acceptedAt) >= 10000) {
            updates[`orders/${orderId}/status`] = 'Completed';
          }
        });

        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
          fetchOrders();
        }
      }
    } catch (error) {
      console.error("Error checking and completing orders:", error);
    }
  };



  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Admin Dashboard</h2>
        <div className="admin-info">
          <p><strong>Name:</strong> {adminName}</p>
          <p><strong>Post:</strong> {adminRole}</p>
        </div>

        <div className="orders-section">
          <div className="order-buttons">
            <button onClick={() => setCurrentView('current')} className={currentView === 'current' ? 'active' : ''}>Current Orders</button>
            <button onClick={() => setCurrentView('past')} className={currentView === 'past' ? 'active' : ''}>Past Orders</button>
          </div>
          <h3>{currentView === 'current' ? 'Current Orders' : 'Past Orders'}</h3>
          {(() => {
            const filteredOrders = orders.filter((order) => {
              const status = order.status || 'Pending';
              if (currentView === 'current') {
                return status === 'Pending' || status === 'Accepted';
              } else {
                return status === 'Completed' || status === 'Cancelled';
              }
            });
            return filteredOrders.length === 0 ? (
              <p>No {currentView === 'current' ? 'current' : 'past'} orders</p>
            ) : (
              <ul className="order-list">
                {filteredOrders.map((order) => (
                  <li key={order.id} className="order-item">
                    <div className="order-header">
                      <p><strong>Order ID:</strong> {order.orderSerial || order.id}</p>
                      <p><strong>Time:</strong> {order.orderTime}</p>
                    </div>
                    <div className="order-details">
                      <p><strong>Item:</strong> {order.itemName}</p>
                      <p><strong>Price:</strong> ৳{order.price}</p>
                      <p><strong>Quantity:</strong> {order.quantity}</p>
                      <p><strong>Category:</strong> {order.category}</p>
                      <p><strong>Status:</strong> {order.status || 'Pending'}</p>
                      {order.status !== "Accepted" && order.status !== "Completed" && order.status !== "Cancelled" && (
                        <button onClick={() => acceptOrder(order.id)} className="accept-button">Accept Order</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        <div className="categories-section">
          <h3>Manage Categories</h3>
          <form onSubmit={addCategory}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Items (comma separated)"
              value={newCategory.items}
              onChange={(e) => setNewCategory({ ...newCategory, items: e.target.value })}
              required
            />
            <button type="submit">Add Category</button>
          </form>
          <ul>
            {categories.map((cat) => (
              <li key={cat.id} className="category-item">
                <div className="category-header">
                  <h4>{cat.name}</h4>
                  <button onClick={() => deleteCategory(cat.id)} className="delete-button">Delete Category</button>
                </div>
                <div className="category-items">
                  <ul>
                    {(cat.items || []).map((item, index) => (
                      <li key={index}>
                        {item}
                        <button onClick={() => deleteItem(cat.id, index)} className="delete-item-button">Delete</button>
                      </li>
                    ))}
                  </ul>
                  <div className="add-item">
                    <input
                      type="text"
                      placeholder="New item"
                      value={newItem[cat.id] || ""}
                      onChange={(e) => setNewItem({ ...newItem, [cat.id]: e.target.value })}
                    />
                    <button onClick={() => addItem(cat.id, newItem[cat.id])} className="add-item-button">Add Item</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-actions">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
