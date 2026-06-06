import { useEffect, useMemo, useState } from 'react';
import { syncCartItemsWithSupabase } from '../lib/supabase/products';

const CART_STORAGE_KEY = '525hp-cart';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartReady, setCartReady] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimer, setToastTimer] = useState(null);

  useEffect(() => {
    let isMounted = true;

    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);

        syncCartItemsWithSupabase(parsedCart).then(({ data }) => {
          if (isMounted) {
            setCartItems(data);
            setCartReady(true);
          }
        });
        return () => {
          isMounted = false;
        };
      }
    } catch {
      setCartItems([]);
    }

    setCartReady(true);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isCartReady) {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, isCartReady]);

  useEffect(() => {
    return () => {
      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }
    };
  }, [toastTimer]);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    const timer = window.setTimeout(() => setToastMessage(''), 2000);
    setToastTimer(timer);
  };

  const handleAdd = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id || item.name === product.name);

      if (existing) {
        return prevItems.map((item) =>
          item.id === existing.id ? { ...item, ...product, quantity: item.quantity + 1 } : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} agregado al Garage`);
  };

  const handleQtyChange = (productId, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(item.quantity + delta, 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const handleClear = () => {
    setCartItems([]);
  };

  return {
    cartItems,
    totalPrice,
    cartCount,
    toastMessage,
    handleAdd,
    handleQtyChange,
    handleRemove,
    handleClear
  };
}
