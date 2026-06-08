import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';

const CART_STORAGE_KEY = '525hp-cart';

const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

const resultCopy = {
  checking: {
    eyebrow: 'Confirmando pago',
    title: 'Estamos validando tu compra',
    text: 'Esto puede tardar unos segundos. Estamos cruzando la información con Mercado Pago.',
    tone: 'neutral'
  },
  success: {
    eyebrow: 'Pago aprobado',
    title: 'Tu pieza ya está reservada',
    text: 'Gracias por elegir 525hp. Registramos tu compra y vamos a preparar el pedido con el cuidado que merece.',
    tone: 'success'
  },
  pending: {
    eyebrow: 'Pago pendiente',
    title: 'Tu pedido quedó en revisión',
    text: 'Mercado Pago todavía no confirmó la operación. Cuando se acredite, el pedido se actualizará automáticamente.',
    tone: 'pending'
  },
  failure: {
    eyebrow: 'Pago rechazado',
    title: 'No pudimos completar el pago',
    text: 'La operación fue rechazada o cancelada. Podés volver al checkout e intentarlo nuevamente.',
    tone: 'failure'
  },
  processing: {
    eyebrow: 'Confirmación en proceso',
    title: 'Recibimos tu regreso de Mercado Pago',
    text: 'No pudimos confirmar el pago en este instante, pero el webhook puede actualizarlo en breve. Revisá tu cuenta o consultá al equipo.',
    tone: 'pending'
  },
  error: {
    eyebrow: 'Algo no salió bien',
    title: 'No pudimos leer el resultado del pago',
    text: 'La URL de retorno llegó incompleta o hubo un error inesperado. Si hiciste un pago, revisá tu cuenta o contactanos.',
    tone: 'failure'
  }
};

export default function PaymentResultPage() {
  const router = useRouter();
  const [resultState, setResultState] = useState('checking');
  const [orderReference, setOrderReference] = useState('');

  const result = useMemo(() => resultCopy[resultState] || resultCopy.error, [resultState]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const paymentResult =
      getQueryValue(router.query.payment) ||
      getQueryValue(router.query.status) ||
      getQueryValue(router.query.collection_status);
    const orderId =
      getQueryValue(router.query.order) ||
      getQueryValue(router.query.external_reference);
    const paymentId =
      getQueryValue(router.query.payment_id) ||
      getQueryValue(router.query.collection_id) ||
      getQueryValue(router.query['data.id']) ||
      null;
    const merchantOrderId = getQueryValue(router.query.merchant_order_id) || null;
    const preferenceId = getQueryValue(router.query.preference_id) || null;

    if (orderId) {
      setOrderReference(`#${orderId}`);
    }

    if (!paymentResult) {
      setResultState('error');
      return;
    }

    if (['failure', 'rejected', 'cancelled', 'cancelada'].includes(paymentResult)) {
      setResultState('failure');
      return;
    }

    if (!orderId) {
      setResultState(paymentResult === 'pending' ? 'pending' : 'error');
      return;
    }

    fetch('/api/payments/confirm-return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        merchantOrderId,
        preferenceId
      })
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, data };
      })
      .then(({ ok, data }) => {
        if (!ok) {
          setResultState(paymentResult === 'success' ? 'processing' : 'error');
          return;
        }

        if (data.orderStatus === 'pagada') {
          localStorage.removeItem(CART_STORAGE_KEY);
          setResultState('success');
          return;
        }

        if (paymentResult === 'pending' || data.orderStatus === 'pendiente') {
          setResultState('pending');
          return;
        }

        if (data.orderStatus === 'cancelada') {
          setResultState('failure');
          return;
        }

        setResultState('processing');
      })
      .catch(() => {
        setResultState(paymentResult === 'success' ? 'processing' : 'error');
      });
  }, [
    router.isReady,
    router.query.payment,
    router.query.status,
    router.query.collection_status,
    router.query.order,
    router.query.external_reference,
    router.query.payment_id,
    router.query.collection_id,
    router.query['data.id'],
    router.query.merchant_order_id,
    router.query.preference_id
  ]);

  return (
    <>
      <Head>
        <title>Resultado del pago | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="payment-result-page">
        <Header actionHref="/catalogo" actionLabel="Ver colección" />

        <main className="payment-result-main">
          <section className="checkout-page-hero payment-result-hero">
            <div className="hero-lines checkout-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container payment-result-shell">
              <article className={`payment-result-card is-${result.tone}`}>
                <div className="payment-result-mark" aria-hidden="true">
                  {result.tone === 'success' ? '✓' : result.tone === 'failure' ? '!' : '…'}
                </div>
                <p className="eyebrow">{result.eyebrow}</p>
                <h1>{result.title}</h1>
                <p>{result.text}</p>

                {orderReference && (
                  <div className="payment-result-reference">
                    <span>Orden</span>
                    <strong>{orderReference}</strong>
                  </div>
                )}

                <div className="payment-result-actions">
                  <Link href="/" className="checkout-primary-btn">Volver al inicio</Link>
                  <Link href={resultState === 'failure' ? '/checkout' : '/login'} className="checkout-secondary-btn">
                    {resultState === 'failure' ? 'Reintentar pago' : 'Ver mi cuenta'}
                  </Link>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
