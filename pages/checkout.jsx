import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = '525hp-cart';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimer, setToastTimer] = useState(null);
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      setCartItems(storedCart ? JSON.parse(storedCart) : []);
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }
    };
  }, [toastTimer]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    const timer = window.setTimeout(() => setToastMessage(''), 2600);
    setToastTimer(timer);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!cartItems.length) {
      showToast('Tu Garage esta vacio. Agrega productos antes de continuar.');
      return;
    }

    const orderNumber = `525-${Date.now().toString().slice(-6)}`;
    localStorage.removeItem(CART_STORAGE_KEY);
    setCartItems([]);
    setFormState({
      fullName: '',
      email: '',
      phone: '',
      province: '',
      address: '',
      notes: ''
    });
    showToast(`Pedido ${orderNumber} confirmado. Te escribiremos para coordinar la entrega.`);
  };

  return (
    <>
      <Head>
        <title>Checkout | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="checkout-page">
        <header className="main-header checkout-header">
          <div className="container header-flex">
            <div className="logo">
              <Link href="/#inicio">525<span>hp</span></Link>
            </div>

            <nav className="nav-wrapper">
              <ul className="nav-list">
                <li><Link href="/#inicio" className="nav-link">Inicio</Link></li>
                <li><Link href="/#catalogo" className="nav-link">Catálogo</Link></li>
                <li><Link href="/#contacto" className="nav-link">Contacto</Link></li>
              </ul>
            </nav>

            <div className="header-actions">
              <Link href="/#catalogo" className="cart-btn">Seguir comprando</Link>
            </div>
          </div>
        </header>

        <main className="checkout-page-main">
          <section className="checkout-page-hero">
            <div className="hero-lines checkout-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container checkout-shell">
              <section className="checkout-stage">
                <div className="checkout-stage-heading">
                  <p className="eyebrow">525hp checkout</p>
                  <h1>Finalizá tu compra</h1>
                  <p className="checkout-page-description">
                    Completá tus datos para reservar tus piezas y coordinar la entrega de tu pedido.
                  </p>
                </div>

                <form className="checkout-page-form" id="checkout-form" onSubmit={handleSubmit}>
                  <div className="checkout-grid">
                    <label className="checkout-field">
                      <span>Nombre completo</span>
                      <input type="text" name="fullName" placeholder="Tu nombre" required value={formState.fullName} onChange={handleChange} />
                    </label>
                    <label className="checkout-field">
                      <span>Email</span>
                      <input type="email" name="email" placeholder="nombre@email.com" required value={formState.email} onChange={handleChange} />
                    </label>
                    <label className="checkout-field">
                      <span>Telefono</span>
                      <input type="tel" name="phone" placeholder="+54 9 11 1234 5678" required value={formState.phone} onChange={handleChange} />
                    </label>
                    <label className="checkout-field">
                      <span>Provincia</span>
                      <input type="text" name="province" placeholder="Buenos Aires" required value={formState.province} onChange={handleChange} />
                    </label>
                    <label className="checkout-field checkout-field-full">
                      <span>Direccion de entrega</span>
                      <input type="text" name="address" placeholder="Calle, numero, piso, depto" required value={formState.address} onChange={handleChange} />
                    </label>
                    <label className="checkout-field checkout-field-full">
                      <span>Notas para tu pedido</span>
                      <textarea name="notes" rows="4" placeholder="Instrucciones de entrega, referencias, etc." value={formState.notes} onChange={handleChange} />
                    </label>
                  </div>

                  <div className="checkout-page-actions">
                    <Link href="/#catalogo" className="checkout-secondary-btn checkout-link-btn">Volver al catálogo</Link>
                    <button type="submit" className="checkout-primary-btn" disabled={!cartItems.length}>Confirmar pedido</button>
                  </div>
                </form>
              </section>

              <aside className="checkout-summary-panel">
                <div className="checkout-summary-card">
                  <p className="checkout-eyebrow">Resumen</p>
                  <h2>Tu Garage</h2>
                  <p className="checkout-summary-copy">Revisá los productos seleccionados antes de confirmar el pedido.</p>

                  {!cartItems.length ? (
                    <p className="checkout-empty-page" id="checkout-empty-page">Tu Garage está vacío por ahora.</p>
                  ) : (
                    <ul className="checkout-order-list" id="checkout-order-list">
                      {cartItems.map((item) => (
                        <li key={item.id} className="checkout-order-item">
                          <img className="checkout-order-thumb" src={item.image} alt={item.name} />
                          <div className="checkout-order-copy">
                            <p className="checkout-order-name">{item.name}</p>
                            <p className="checkout-order-meta">Cantidad: {item.quantity}</p>
                          </div>
                          <strong className="checkout-order-price">{formatPrice(item.price * item.quantity)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="checkout-summary-box">
                    <div className="checkout-summary-row">
                      <span>Productos</span>
                      <strong id="checkout-items-count">{totalItems}</strong>
                    </div>
                    <div className="checkout-summary-row">
                      <span>Total</span>
                      <strong id="checkout-total">{cartItems.length ? formatPrice(totalPrice) : '$0'}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        {toastMessage && (
          <div className="cart-toast" id="cart-toast" role="status" aria-live="polite" aria-atomic="true">
            {toastMessage}
          </div>
        )}
      </div>
    </>
  );
}
