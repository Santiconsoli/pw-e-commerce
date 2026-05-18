import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import CartPanel from '../components/CartPanel';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

const CART_STORAGE_KEY = '525hp-cart';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);

export default function Home() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimer, setToastTimer] = useState(null);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!isCartOpen && !isMenuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCartOpen(false);
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, isMenuOpen]);

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
      clearTimeout(toastTimer);
    }
    const timer = window.setTimeout(() => setToastMessage(''), 2000);
    setToastTimer(timer);
  };

  const handleAdd = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
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

  return (
    <>
      <Head>
        <title>525hp | Luxury Auto Parts Furniture</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Muebles y artículos de lujo creados a partir de piezas automotrices icónicas."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Header
        cartCount={cartCount}
        isCartOpen={isCartOpen}
        isMenuOpen={isMenuOpen}
        onOpenCart={() => setCartOpen(true)}
        onOpenMenu={() => {
          setCartOpen(false);
          setMenuOpen(true);
        }}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-lines" aria-hidden="true">
            <span className="hero-line hero-line-blue"></span>
            <span className="hero-line hero-line-gold"></span>
            <span className="hero-line hero-line-red"></span>
          </div>
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">Luxury auto parts furniture</p>
              <h1>INGENIERÍA CONVERTIDA EN ARTE</h1>
              <p className="hero-description">
                Piezas icónicas del automóvil reinterpretadas como objetos de lujo para aquellos que comparten esta pasión.
              </p>
              <a href="#catalogo" className="hero-cta">Explorar colección</a>
            </div>

            <div className="hero-cars" aria-label="Colección de autos destacados">
              <figure className="hero-car hero-car-amg">
                <img src="/assets/hero/amgt63.jpg" alt="Mercedes-AMG GT63 lateral" />
              </figure>
              <figure className="hero-car hero-car-mclaren">
                <img src="/assets/hero/mclarenside.webp" alt="McLaren lateral" />
              </figure>
              <figure className="hero-car hero-car-porsche">
                <img src="/assets/hero/porschegt3side.jpg" alt="Porsche GT3 RS lateral" />
              </figure>
            </div>
          </div>
        </section>

        <section className="collection-section" id="catalogo">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Colección</p>
              <h2>Piezas construídas para destacar</h2>
            </div>

            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} formatPrice={formatPrice} onAdd={handleAdd} />
              ))}
            </div>

            <div className="brand-strip" aria-label="Marcas destacadas">
              <figure className="brand-logo-card" aria-label="Logo Porsche">
                <img className="brand-logo-image" src="/assets/logos/porsche-specific.png" alt="Logo Porsche" />
              </figure>
              <figure className="brand-logo-card" aria-label="Logo Mercedes-Benz">
                <img className="brand-logo-image" src="/assets/logos/mercedes.png" alt="Logo Mercedes-Benz" />
              </figure>
              <figure className="brand-logo-card" aria-label="Logo BMW">
                <img className="brand-logo-image" src="/assets/logos/bmw.png" alt="Logo BMW" />
              </figure>
              <figure className="brand-logo-card" aria-label="Logo Ferrari">
                <img className="brand-logo-image" src="/assets/logos/ferrari.png" alt="Logo Ferrari" />
              </figure>
            </div>
          </div>
        </section>
      </main>

      <CartPanel
        isOpen={isCartOpen}
        cartItems={cartItems}
        totalPrice={totalPrice}
        formatPrice={formatPrice}
        onClose={() => setCartOpen(false)}
        onQtyChange={handleQtyChange}
        onRemove={handleRemove}
        onClear={handleClear}
      />

      {toastMessage && (
        <div className="cart-toast" id="cart-toast" role="status" aria-live="polite" aria-atomic="true">
          {toastMessage}
        </div>
      )}

      <Footer />
    </>
  );
}
