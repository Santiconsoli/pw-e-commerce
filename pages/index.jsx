import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

      <header className="main-header">
        <div className="container header-flex">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => {
              setCartOpen(false);
              setMenuOpen(true);
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="logo">
            <a href="#inicio">525<span>hp</span></a>
          </div>

          <nav className="nav-wrapper">
            <ul className="nav-list">
              <li><a href="#inicio" className="nav-link">Inicio</a></li>
              <li><a href="#catalogo" className="nav-link">Catálogo</a></li>
              <li><a href="#nosotros" className="nav-link">Nosotros</a></li>
              <li><a href="#contacto" className="nav-link">Contacto</a></li>
            </ul>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito de compras con ${cartCount} producto${cartCount === 1 ? '' : 's'}`}
              aria-controls="cart-panel"
              aria-expanded={isCartOpen}
            >
              <svg className="cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 4h2l2.2 9.2A2 2 0 0 0 9.15 15H18a2 2 0 0 0 1.94-1.5L21 8H7.1"></path>
                <circle cx="10" cy="19" r="1.5"></circle>
                <circle cx="18" cy="19" r="1.5"></circle>
              </svg>
              <span className="cart-btn-label">GARAGE (<span id="cart-count">{cartCount}</span>)</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`menu-overlay ${isMenuOpen ? 'is-visible' : ''}`}
        hidden={!isMenuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`mobile-menu ${isMenuOpen ? 'is-open' : ''}`}
        id="mobile-menu"
        aria-hidden={!isMenuOpen}
        aria-labelledby="mobile-menu-title"
      >
        <div className="mobile-menu-header">
          <div>
            <p className="cart-panel-eyebrow">525hp</p>
            <h2 id="mobile-menu-title">Menú</h2>
          </div>
          <button type="button" className="menu-close" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}>
            ×
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Navegación principal">
          <ul className="mobile-menu-list">
            <li><a href="#inicio" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Inicio</a></li>
            <li><a href="#catalogo" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Catálogo</a></li>
            <li><a href="#nosotros" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Nosotros</a></li>
            <li><a href="#contacto" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Contacto</a></li>
          </ul>
        </nav>
      </aside>

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

            <figure className="hero-figure" aria-label="Mesa BMW destacada">
              <img src="/assets/productos/mesa-bmw.png" alt="Mesa BMW en acabado oscuro" />
            </figure>
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
                <article key={product.id} className="product-card">
                  <figure className="product-media">
                    <img src={product.image} alt={product.alt} />
                  </figure>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">{formatPrice(product.price)}</p>
                    <button type="button" className="btn-add" onClick={() => handleAdd(product)}>
                      AÑADIR AL GARAGE
                    </button>
                  </div>
                </article>
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

      <div
        className={`cart-overlay ${isCartOpen ? 'is-visible' : ''}`}
        id="cart-overlay"
        hidden={!isCartOpen}
        onClick={() => setCartOpen(false)}
      />
      <aside
        className={`cart-panel ${isCartOpen ? 'is-open' : ''}`}
        id="cart-panel"
        aria-hidden={!isCartOpen}
        aria-labelledby="cart-title"
      >
        <div className="cart-panel-header">
          <div>
            <p className="cart-panel-eyebrow">525hp</p>
            <h2 id="cart-title">Tu Garage</h2>
          </div>
          <button type="button" className="cart-close" id="cart-close" aria-label="Cerrar carrito" onClick={() => setCartOpen(false)}>
            ×
          </button>
        </div>

        <div className="cart-panel-body">
          {cartItems.length === 0 ? (
            <p className="cart-empty" id="cart-empty">A tu Garage le falta vida.</p>
          ) : (
            <ul className="cart-items" id="cart-items">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-top">
                    <div className="cart-item-main">
                      <img className="cart-item-thumb" src={item.image} alt={item.name} />
                      <div>
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">{formatPrice(item.price)} c/u</p>
                      </div>
                    </div>
                    <p className="cart-item-price">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty-controls">
                      <button type="button" className="cart-qty-btn" onClick={() => handleQtyChange(item.id, -1)}>-</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button type="button" className="cart-qty-btn" onClick={() => handleQtyChange(item.id, 1)}>+</button>
                    </div>
                    <button type="button" className="cart-remove-btn" onClick={() => handleRemove(item.id)}>Quitar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cart-panel-footer">
          <div className="cart-summary">
            <span>Subtotal</span>
            <strong id="cart-subtotal">{formatPrice(totalPrice)}</strong>
          </div>
          <div className="cart-actions">
            <button type="button" className="cart-secondary-btn" id="cart-continue" onClick={() => setCartOpen(false)}>
              Seguir comprando
            </button>
            <button type="button" className="cart-secondary-btn" id="cart-clear" onClick={handleClear}>
              Vaciar Garage
            </button>
            <Link href="/checkout" className="cart-primary-btn" id="cart-checkout" onClick={() => setCartOpen(false)}>
              Finalizar compra
            </Link>
          </div>
        </div>
      </aside>

      {toastMessage && (
        <div className="cart-toast" id="cart-toast" role="status" aria-live="polite" aria-atomic="true">
          {toastMessage}
        </div>
      )}

      <footer className="site-footer" id="contacto">
        <div className="container footer-content">
          <div className="footer-column footer-brand">
            <span className="footer-logo">525<span>hp</span></span>
            <p className="footer-description">
              Muebles y artículos de lujo creados a partir de piezas automotrices icónicas, con una presencia sobria,
              técnica y contemporánea.
            </p>
          </div>

          <div className="footer-column">
            <h2 className="footer-title">Enlaces rápidos</h2>
            <ul className="footer-list">
              <li><span className="footer-link footer-static">Inicio</span></li>
              <li><span className="footer-link footer-static">Catálogo</span></li>
              <li><span className="footer-link footer-static">Nosotros</span></li>
              <li><span className="footer-link footer-static">Contacto</span></li>
            </ul>
          </div>

          <div className="footer-column">
            <h2 className="footer-title">Redes sociales</h2>
            <ul className="footer-list">
              <li>
                <span className="footer-link social-link footer-static" aria-label="Instagram de 525hp">
                  <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                    <circle cx="12" cy="12" r="4"></circle>
                    <circle cx="17.5" cy="6.5" r="1"></circle>
                  </svg>
                  <span>Instagram</span>
                </span>
              </li>
              <li>
                <span className="footer-link social-link footer-static" aria-label="Facebook de 525hp">
                  <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3.2l.8-4H13V9a1 1 0 0 1 1-1Z"></path>
                  </svg>
                  <span>Facebook</span>
                </span>
              </li>
              <li>
                <span className="footer-link social-link footer-static" aria-label="LinkedIn de 525hp">
                  <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <rect x="4" y="9" width="4" height="11"></rect>
                    <circle cx="6" cy="5.5" r="2"></circle>
                    <path d="M11 9h4v1.8c.7-1.1 1.9-2.1 4-2.1 3.1 0 4 2.1 4 5.3V20h-4v-5.1c0-1.5-.3-2.7-1.9-2.7-1.6 0-2.1 1.1-2.1 2.7V20h-4Z"></path>
                  </svg>
                  <span>LinkedIn</span>
                </span>
              </li>
              <li>
                <span className="footer-link social-link footer-static" aria-label="WhatsApp de 525hp">
                  <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 21a8.9 8.9 0 0 1-4.5-1.2L3 21l1.3-4.3A9 9 0 1 1 12 21Z"></path>
                    <path d="M9.1 7.8c.2-.4.4-.5.7-.5h.6c.2 0 .4 0 .6.5l.6 1.5c.1.3.1.5-.1.7l-.5.6c-.1.1-.2.3-.1.5.3.6.8 1.2 1.4 1.8.7.6 1.4 1 2.1 1.3.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.7-.1l1.4.7c.3.1.5.3.4.6l-.2.9c-.1.3-.3.6-.6.7-.5.2-1.2.2-1.9 0-1.1-.3-2.3-.9-3.5-1.9-1.1-.9-2-2.1-2.5-3.3-.4-.8-.5-1.5-.3-2.1Z"></path>
                  </svg>
                  <span>WhatsApp</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <div className="footer-meta">
              <span className="footer-meta-item">AR | Argentina 🇦🇷</span>
              <span className="footer-meta-item">Idioma | Español</span>
              <span className="footer-meta-link footer-static">Términos y Condiciones del sitio web</span>
              <span className="footer-meta-link footer-static">Privacidad</span>
              <span className="footer-meta-link footer-static">Política de cookies</span>
            </div>
            <p className="footer-copy">© 2026 525hp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
