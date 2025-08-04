import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

// ✅ Use API base from .env file
const API_BASE = process.env.REACT_APP_API_URL;

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index <= 300; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  // ✅ Fetch all products from backend
  useEffect(() => {
    fetch(`${API_BASE}/allproducts`)
      .then((response) => response.json())
      .then((data) => setAll_Product(data))
      .catch((error) => console.error("Fetch allproducts error:", error));
  }, []);

  // ✅ Load cart from backend if logged in
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      fetch(`${API_BASE}/getcart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: "", // optional; backend should handle it
      })
        .then((response) => response.json())
        .then((data) => setCartItems(data))
        .catch((error) => console.error("Get cart error:", error));
    }
  }, []);

  // ✅ Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  // ✅ Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ Add to cart
  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));

    const token = localStorage.getItem("auth-token");
    if (token) {
      fetch(`${API_BASE}/addtocart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ itemId }),
      })
        .then((res) => res.json())
        .then((data) => setCartItems(data))
        .catch((error) => console.error("Add to cart error:", error));
    }
  };

  // ✅ Remove from cart
  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : 0,
    }));

    const token = localStorage.getItem("auth-token");
    if (token) {
      fetch(`${API_BASE}/removefromcart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ itemId }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Removed item:", data))
        .catch((error) => console.error("Remove from cart error:", error));
    }
  };

  // ✅ Calculate total cart amount
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const product = all_product.find(
          (p) => p.id === Number(item)
        );
        if (product) {
          totalAmount += product.new_price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  // ✅ Calculate total items in cart
  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // ✅ Shared context
  const contextValue = {
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
