import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getSupabaseClient } from '../lib/supabase/client';

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

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/checkout';

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('El ingreso no esta disponible por el momento.');
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

    await saveProfile(supabase, data.user);
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
    setMessage('Sesión cerrada.');
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
                  <h1>{mode === 'register' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}</h1>
                  <p>
                    Guardá tus datos de compra, seguí tus pedidos y avanzá más rápido en el checkout.
                  </p>
                </section>

                <section className="checkout-stage auth-stage" aria-label="Formulario de cuenta">
                  {sessionEmail ? (
                    <div className="auth-session-box">
                      <p>Sesión activa como</p>
                      <strong>{sessionEmail}</strong>
                      <div className="checkout-page-actions auth-actions">
                        <Link href={nextPath} className="checkout-primary-btn">
                          {nextPath === '/checkout' ? 'Ir al checkout' : 'Continuar'}
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
                              value={fullName}
                              onChange={(event) => setFullName(event.target.value)}
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
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
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
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
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
                              value={passwordConfirm}
                              onChange={(event) => setPasswordConfirm(event.target.value)}
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
