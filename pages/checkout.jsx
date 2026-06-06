import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import {
  getPhoneDigits,
  isValidEmail,
  sanitizeAddress,
  sanitizeNotes,
  sanitizePersonName,
  sanitizePhone,
  sanitizeProvince
} from '../lib/formValidation';
import { getSupabaseClient } from '../lib/supabase/client';
import { createCheckoutOrder } from '../lib/supabase/orders';
import { syncCartItemsWithSupabase } from '../lib/supabase/products';

const CART_STORAGE_KEY = '525hp-cart';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isCartReady, setCartReady] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimer, setToastTimer] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    let isMounted = true;

    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];

      syncCartItemsWithSupabase(parsedCart).then(({ data }) => {
        if (isMounted) {
          setCartItems(data);
          setCartReady(true);
        }
      });
    } catch {
      setCartItems([]);
      setCartReady(true);
    }

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
    const supabase = getSupabaseClient();

    if (!supabase) {
      return undefined;
    }

    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email || '');
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email || '');
    });

    return () => subscription.unsubscribe();
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

  useEffect(() => {
    if (!router.isReady || !router.query.payment) {
      return;
    }

    const messages = {
      success: 'Pago aprobado. Tu pedido quedó registrado.',
      pending: 'Pago pendiente. Te avisaremos cuando se confirme.',
      failure: 'El pago no se pudo completar. Podés intentarlo nuevamente.'
    };

    if (router.query.payment === 'success') {
      localStorage.removeItem(CART_STORAGE_KEY);
      setCartItems([]);
    }

    showToast(messages[router.query.payment] || 'Volviste del proceso de pago.');
  }, [router.isReady, router.query.payment]);

  useEffect(() => {
    if (!router.isReady || !router.query.payment || !router.query.order) {
      return;
    }

    const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value);
    const paymentId =
      getQueryValue(router.query.payment_id) ||
      getQueryValue(router.query.collection_id) ||
      getQueryValue(router.query['data.id']) ||
      null;
    const merchantOrderId = getQueryValue(router.query.merchant_order_id) || null;
    const preferenceId = getQueryValue(router.query.preference_id) || null;

    fetch('/api/payments/confirm-return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: getQueryValue(router.query.order),
        paymentId,
        merchantOrderId,
        preferenceId
      })
    })
      .then((response) => response.json().catch(() => ({})))
      .then((data) => {
        if (data.orderStatus === 'pagada') {
          showToast('Pago confirmado. Tu compra ya quedó registrada.');
        }
      })
      .catch(() => {
        showToast('El pago quedó iniciado. Estamos esperando la confirmación.');
      });
  }, [router.isReady, router.query.payment, router.query.order]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const sanitizers = {
      fullName: sanitizePersonName,
      phone: sanitizePhone,
      province: sanitizeProvince,
      address: sanitizeAddress,
      notes: sanitizeNotes
    };
    const nextValue = sanitizers[name] ? sanitizers[name](value) : value;

    setFormState((prevState) => ({ ...prevState, [name]: nextValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!cartItems.length) {
      showToast('Tu Garage esta vacio. Agrega productos antes de continuar.');
      return;
    }

    if (formState.fullName.trim().length < 3) {
      showToast('Ingresá un nombre completo válido.');
      return;
    }

    if (!isValidEmail(formState.email)) {
      showToast('Ingresá un email válido.');
      return;
    }

    const phoneDigits = getPhoneDigits(formState.phone);

    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      showToast('Ingresá un teléfono válido, solo con números y prefijo si corresponde.');
      return;
    }

    if (formState.province.trim().length < 3) {
      showToast('Ingresá una provincia válida.');
      return;
    }

    if (formState.address.trim().length < 6) {
      showToast('Ingresá una dirección de entrega válida.');
      return;
    }

    const validatedFormState = {
      ...formState,
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      province: formState.province.trim(),
      address: formState.address.trim(),
      notes: formState.notes.trim()
    };

    if (!sessionEmail) {
      showToast('Iniciá sesión para finalizar tu pedido.');
      return;
    }

    setSubmitting(true);
    let shouldRedirectToPayment = false;

    try {
      const order = await createCheckoutOrder({ cartItems, formState: validatedFormState, totalPrice });
      const paymentResponse = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: order.id })
      });

      const paymentData = await paymentResponse.json().catch(() => ({}));

      if (paymentResponse.ok && paymentData.checkoutUrl) {
        shouldRedirectToPayment = true;
        showToast('Pedido creado. Te llevamos a Mercado Pago.');
        window.location.href = paymentData.checkoutUrl;
        return;
      }

      if (paymentResponse.status === 501) {
        showToast('Mercado Pago no está configurado en Vercel. Revisá las variables privadas.');
        return;
      }

      const paymentError = [paymentData.error, paymentData.detail].filter(Boolean).join(' ');
      showToast(paymentError || `Pedido ${order.referencia_pago} guardado. No pudimos abrir Mercado Pago.`);
    } catch (error) {
      showToast(error.message || 'No pudimos confirmar tu pedido. Intentá nuevamente en unos minutos.');
    } finally {
      if (!shouldRedirectToPayment) {
        setSubmitting(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Checkout | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="checkout-page">
        <Header actionHref="/catalogo" actionLabel="Seguir comprando" />

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
                  <div className="auth-inline-status">
                    {sessionEmail ? (
                      <span>Sesión activa: <strong>{sessionEmail}</strong></span>
                    ) : (
                      <>
                        <span>Necesitás iniciar sesión para guardar el pedido.</span>
                        <Link href="/login" className="auth-inline-link">Ingresar</Link>
                      </>
                    )}
                  </div>

                  <div className="checkout-grid">
                    <label className="checkout-field">
                      <span>Nombre completo</span>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Tu nombre"
                        required
                        minLength={3}
                        maxLength={80}
                        autoComplete="name"
                        value={formState.fullName}
                        onChange={handleChange}
                      />
                    </label>
                    <label className="checkout-field">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        placeholder="nombre@email.com"
                        required
                        maxLength={120}
                        autoComplete="email"
                        value={formState.email}
                        onChange={handleChange}
                      />
                    </label>
                    <label className="checkout-field">
                      <span>Telefono</span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+54 9 11 1234 5678"
                        required
                        inputMode="tel"
                        pattern="[\d+\s()\-]{8,24}"
                        maxLength={24}
                        autoComplete="tel"
                        title="Usá solo números, espacios, paréntesis, guiones o + al inicio."
                        value={formState.phone}
                        onChange={handleChange}
                      />
                    </label>
                    <label className="checkout-field">
                      <span>Provincia</span>
                      <input
                        type="text"
                        name="province"
                        placeholder="Buenos Aires"
                        required
                        minLength={3}
                        maxLength={60}
                        autoComplete="address-level1"
                        value={formState.province}
                        onChange={handleChange}
                      />
                    </label>
                    <label className="checkout-field checkout-field-full">
                      <span>Direccion de entrega</span>
                      <input
                        type="text"
                        name="address"
                        placeholder="Calle, numero, piso, depto"
                        required
                        minLength={6}
                        maxLength={140}
                        autoComplete="street-address"
                        value={formState.address}
                        onChange={handleChange}
                      />
                    </label>
                    <label className="checkout-field checkout-field-full">
                      <span>Notas para tu pedido</span>
                      <textarea
                        name="notes"
                        rows="4"
                        placeholder="Instrucciones de entrega, referencias, etc."
                        maxLength={300}
                        value={formState.notes}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <div className="checkout-page-actions">
                    <a href="/catalogo" className="checkout-secondary-btn checkout-link-btn">Volver al catálogo</a>
                    <button type="submit" className="checkout-primary-btn" disabled={!cartItems.length || isSubmitting}>
                      {isSubmitting ? 'Preparando pago...' : 'Confirmar y pagar'}
                    </button>
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
          <div className="cart-toast is-visible" id="cart-toast" role="status" aria-live="polite" aria-atomic="true">
            {toastMessage}
          </div>
        )}
      </div>
    </>
  );
}
