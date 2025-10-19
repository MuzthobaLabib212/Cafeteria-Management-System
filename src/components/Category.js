import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Category.css';

function Category() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([
    {
      id: 'breakfast',
      name: 'Breakfast',
      description: 'Start your day with our delicious breakfast',
      icon: '🍳',
      items: ['Porota', 'Samosas', 'Singara', 'Alur Chop', 'Cold Drinks', 'Coffee Special']
    },
    {
      id: 'lunch',
      name: 'Lunch',
      description: 'Enjoy our hearty lunch specials',
      icon: '🍽️',
      items: ['Rice', 'Chicken Curry', 'Fish Curry', 'Vegetable Curry', 'Dal', 'Salad']
    },
    {
      id: 'dinner',
      name: 'Dinner',
      description: 'End your day with our savory dinner options',
      icon: '🌙',
      items: ['Biryani', 'Korma', 'Tandoori', 'Naan', 'Raita', 'Dessert']
    },
    {
      id: 'snacks',
      name: 'Snacks',
      description: 'Satisfy your cravings with our tasty snacks',
      icon: '🍿',
      items: ['Chips', 'Nuts', 'Cookies', 'Popcorn', 'Candy', 'Fruit']
    }
  ]);

  return (
    <div className="category-container">
      <div className="category-header">
        <h1>Food Categories</h1>
        <p>Explore our delicious menu options</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-icon">
              <span className="icon-emoji">{category.icon}</span>
            </div>
            <div className="category-content">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <div className="category-items">
                <h4>Popular Items:</h4>
                <ul>
                  {category.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="category-overlay">
              <button className="explore-btn" onClick={() => navigate(`/${category.id}`)}>Explore {category.name}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category;
