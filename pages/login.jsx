import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { isValidEmail, sanitizePersonName } from '../lib/formValidation';
import { getSupabaseClient } from '../lib/supabase/client';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isAccountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/checkout';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  const getRedirectUrl = () => {
    const origin = siteUrl || window.location.origin;
    return `${origin}/login?next=${encodeURIComponent(nextPath)}`;
  };

  const loadAccountData = async (supabase, user) => {
    if (!user) {
      setProfile(null);
      setOrders([]);
      return;
    }

    setAccountLoading(true);
    setAccountError('');

    const [profileResult, ordersResult] = await Promise.all([
      supabase
        .from('usuarios')
        .select('email, nombre, apellido, direccion, telefono, creado_en')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('ordenes')
        .select(`
          id,
          total,
          estado,
          referencia_pago,
          metodo_pago,
          creado_en,
          detalles_orden (
            cantidad,
            precio_unitario,
            subtotal,
            productos (
              nombre,
              imagen_url
            )
          )
        `)
        .order('creado_en', { ascending: false })
    ]);

    if (profileResult.error || ordersResult.error) {
      setAccountError('No pudimos cargar toda la información de tu cuenta.');
    }

    setProfile(profileResult.data || null);
    setOrders(ordersResult.data || []);
    setAccountLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('El ingreso no esta disponible por el momento.');
      return undefined;
    }

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user || null;
      setCurrentUser(user);
      setSessionEmail(user?.email || '');
      loadAccountData(supabase, user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      setSessionEmail(user?.email || '');
      loadAccountData(supabase, user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveProfile = async (supabase, user) => {
    if (!user) {
      return;
    }

    const [nombre = '', ...apellidoParts] = fullName.trim().split(/\s+/);

    await supabase.from('usuarios').upsert(
      {
        id: user.id,
        email: user.email || email,
        nombre,
        apellido: apellidoParts.join(' ')
      },
      { onConflict: 'id' }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('El ingreso no esta disponible por el momento.');
      setSubmitting(false);
      return;
    }

    if (mode === 'register' && fullName.trim().length < 3) {
      setMessage('Ingresá un nombre válido.');
      setSubmitting(false);
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Ingresá un email válido.');
      setSubmitting(false);
      return;
    }

    if (mode === 'register' && password !== passwordConfirm) {
      setMessage('Las contraseñas no coinciden.');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      setSubmitting(false);
      return;
    }

    const response = mode === 'register'
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
            data: {
              full_name: fullName
            }
          }
        })
      : await supabase.auth.signInWithPassword({
          email,
          password
        });

    const { data, error } = response;

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    if (mode === 'register') {
      await saveProfile(supabase, data.user);
    }

    await loadAccountData(supabase, data.user);
    setSubmitting(false);

    if (!data.session && mode === 'register') {
      setMessage('Cuenta creada. Revisá tu email para activarla y después ingresá con tu contraseña.');
      return;
    }

    setSessionEmail(data.user?.email || email);
    setMessage(mode === 'register' ? 'Cuenta creada correctamente.' : 'Ingreso correcto.');
    window.setTimeout(() => router.push(nextPath), 700);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setSessionEmail('');
    setCurrentUser(null);
    setProfile(null);
    setOrders([]);
    setMessage('Sesión cerrada.');
  };

  const accountName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ');
  const completedOrders = orders.filter((order) => order.estado !== 'pendiente');
  const pendingOrders = orders.filter((order) => order.estado === 'pendiente');

  const handleEmailChange = (event) => {
    setEmail(event.target.value.trim().slice(0, 120));
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value.slice(0, 72));
  };

  const handlePasswordConfirmChange = (event) => {
    setPasswordConfirm(event.target.value.slice(0, 72));
  };

  return (
    <>
      <Head>
        <title>Ingresar | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="checkout-page">
        <Header actionHref={nextPath} actionLabel={nextPath === '/checkout' ? 'Volver al checkout' : 'Volver'} />

        <main className="checkout-page-main">
          <section className="checkout-page-hero auth-page-hero">
            <div className="hero-lines checkout-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container auth-shell auth-shell-wide">
              <div className="auth-layout">
                <section className="auth-copy-panel">
                  <p className="eyebrow">Cuenta 525hp</p>
                  <h1>{sessionEmail ? 'Mi cuenta' : mode === 'register' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}</h1>
                  <p>
                    {sessionEmail
                      ? 'Consultá tu información, revisá tus pedidos y seguí construyendo tu garage.'
                      : 'Guardá tus datos de compra, seguí tus pedidos y avanzá más rápido en el checkout.'}
                  </p>
                </section>

                <section className="checkout-stage auth-stage" aria-label="Formulario de cuenta">
                  {sessionEmail ? (
                    <div className="account-dashboard">
                      <div className="account-card-heading">
                        <p>Panel privado</p>
                        <h2>{accountName || 'Tu cuenta'}</h2>
                        <span>{sessionEmail}</span>
                      </div>

                      {isAccountLoading ? (
                        <p className="account-muted">Cargando información de tu cuenta...</p>
                      ) : (
                        <>
                          <div className="account-info-grid">
                            <div className="account-info-item">
                              <span>Nombre</span>
                              <strong>{accountName || 'Pendiente de completar'}</strong>
                            </div>
                            <div className="account-info-item">
                              <span>Email</span>
                              <strong>{profile?.email || currentUser?.email || sessionEmail}</strong>
                            </div>
                            <div className="account-info-item">
                              <span>Teléfono</span>
                              <strong>{profile?.telefono || 'Sin cargar'}</strong>
                            </div>
                            <div className="account-info-item">
                              <span>Dirección</span>
                              <strong>{profile?.direccion || 'Sin cargar'}</strong>
                            </div>
                          </div>

                          <div className="account-orders">
                            <div className="account-section-title">
                              <p>Historial</p>
                              <h3>Tus pedidos</h3>
                            </div>

                            {completedOrders.length ? (
                              <ul className="account-order-list">
                                {completedOrders.map((order) => (
                                  <li key={order.id} className="account-order-card">
                                    <div className="account-order-top">
                                      <div>
                                        <span>Pedido #{order.referencia_pago || order.id}</span>
                                        <strong>{formatPrice(Number(order.total))}</strong>
                                      </div>
                                      <span className="account-order-status">{order.estado}</span>
                                    </div>
                                    <p className="account-order-date">{formatDate(order.creado_en)}</p>

                                    {order.detalles_orden?.length ? (
                                      <ul className="account-order-products">
                                        {order.detalles_orden.map((detail, index) => (
                                          <li key={`${order.id}-${index}`}>
                                            <span>{detail.productos?.nombre || 'Producto 525hp'}</span>
                                            <small>
                                              {detail.cantidad} x {formatPrice(Number(detail.precio_unitario))}
                                            </small>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="account-empty-orders">
                                <p>Todavía no tenés pedidos realizados.</p>
                                <span>Cuando completes tu primer pago, la compra va a aparecer acá.</span>
                              </div>
                            )}

                            {pendingOrders.length ? (
                              <div className="account-empty-orders account-pending-orders">
                                <p>Tenés {pendingOrders.length === 1 ? 'un pedido pendiente de pago' : `${pendingOrders.length} pedidos pendientes de pago`}.</p>
                                <span>Si volviste desde Mercado Pago sin pagar, no se cuenta como compra finalizada.</span>
                              </div>
                            ) : null}
                          </div>
                        </>
                      )}

                      {accountError && <p className="auth-message">{accountError}</p>}

                      <div className="checkout-page-actions auth-actions">
                        <Link href="/catalogo" className="checkout-primary-btn">
                          Ver colección
                        </Link>
                        <button type="button" className="checkout-secondary-btn" onClick={handleSignOut}>Cerrar sesión</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="auth-card-heading">
                        <p>{mode === 'register' ? 'Nuevo cliente' : 'Cliente registrado'}</p>
                        <h2>{mode === 'register' ? 'Crear cuenta' : 'Ingresar'}</h2>
                      </div>

                      <form className="checkout-page-form" onSubmit={handleSubmit}>
                        {mode === 'register' && (
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
                              value={fullName}
                              onChange={(event) => setFullName(sanitizePersonName(event.target.value))}
                            />
                          </label>
                        )}

                        <label className="checkout-field">
                          <span>Email</span>
                          <input
                            type="email"
                            name="email"
                            placeholder="nombre@email.com"
                            required
                            maxLength={120}
                            autoComplete="email"
                            value={email}
                            onChange={handleEmailChange}
                          />
                        </label>

                        <label className="checkout-field">
                          <span>Contraseña</span>
                          <input
                            type="password"
                            name="password"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                            maxLength={72}
                            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={handlePasswordChange}
                          />
                        </label>

                        {mode === 'register' && (
                          <label className="checkout-field">
                            <span>Confirmar contraseña</span>
                            <input
                              type="password"
                              name="passwordConfirm"
                              placeholder="Repetí tu contraseña"
                              required
                              minLength={6}
                              maxLength={72}
                              autoComplete="new-password"
                              value={passwordConfirm}
                              onChange={handlePasswordConfirmChange}
                            />
                          </label>
                        )}

                        <button type="submit" className="checkout-primary-btn auth-submit-btn" disabled={isSubmitting}>
                          {isSubmitting
                            ? 'Procesando...'
                            : mode === 'register'
                              ? 'Crear cuenta'
                              : 'Ingresar'}
                        </button>
                      </form>

                      <button
                        type="button"
                        className="auth-mode-toggle"
                        onClick={() => {
                          setMode((currentMode) => currentMode === 'register' ? 'login' : 'register');
                          setMessage('');
                        }}
                      >
                        {mode === 'register'
                          ? 'Ya tengo cuenta'
                          : 'Quiero crear una cuenta'}
                      </button>
                    </>
                  )}

                  {message && <p className="auth-message">{message}</p>}
                </section>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
