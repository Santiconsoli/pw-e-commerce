import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getSupabaseClient } from '../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/checkout';

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase no esta configurado.');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase no esta configurado.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`
      }
    });

    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Te enviamos un enlace de acceso. Revisá tu email para continuar.');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage('');

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase no esta configurado.');
      setGoogleLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`
      }
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
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
                  <p className="eyebrow">Acceso 525hp</p>
                  <h1>Ingresá a tu cuenta</h1>
                  <p>
                    Usá Google o tu email para continuar con tu compra, revisar tu sesión y guardar pedidos en Supabase.
                  </p>
                </section>

                <section className="checkout-stage auth-stage" aria-label="Formulario de ingreso">
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
                      <button
                        type="button"
                        className="auth-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        <span className="auth-google-icon" aria-hidden="true">G</span>
                        {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
                      </button>

                      <div className="auth-divider"><span>o ingresá con email</span></div>

                      <form className="checkout-page-form" onSubmit={handleSubmit}>
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

                        <button type="submit" className="checkout-primary-btn auth-submit-btn" disabled={isSubmitting}>
                          {isSubmitting ? 'Enviando...' : 'Enviar enlace de acceso'}
                        </button>
                      </form>
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
