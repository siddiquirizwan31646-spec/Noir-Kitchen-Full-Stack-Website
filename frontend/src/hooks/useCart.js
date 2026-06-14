import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useCart(user) {
  const [cartItems, setCartItems] = useState([]);

  const token = () => localStorage.getItem("token");

  const fetchCart = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`${API}/api/cart`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    const json = await res.json();
    if (json.success) setCartItems(json.data);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (item) => {
    const res = await fetch(`${API}/api/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (json.success) setCartItems(json.data);
    return json.success;
  };

  const updateQty = async (menuItemId, variant, qty) => {
    const res = await fetch(`${API}/api/cart/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ menuItemId, variant, qty })
    });
    const json = await res.json();
    if (json.success) setCartItems(json.data);
  };

  const removeItem = async (menuItemId, variant) => {
    const res = await fetch(`${API}/api/cart/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ menuItemId, variant })
    });
    const json = await res.json();
    if (json.success) setCartItems(json.data);
  };

  const clearCart = async () => {
    await fetch(`${API}/api/cart/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` }
    });
    setCartItems([]);
  };

  return { cartItems, fetchCart, addToCart, updateQty, removeItem, clearCart };
}