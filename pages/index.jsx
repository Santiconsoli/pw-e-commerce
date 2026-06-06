import Head from 'next/head';
import { useEffect, useState } from 'react';
import CartPanel from '../components/CartPanel';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { products as fallbackProducts } from '../data/products';
import { useCart } from '../hooks/useCart';
import { getProductsFromSupabase } from '../lib/supabase/products';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);

export default function Home({ catalogProducts }) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const {
    cartItems,
    totalPrice,
    cartCount,
    toastMessage,
    handleAdd,
    handleQtyChange,
    handleRemove,
    handleClear
  } = useCart();

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
              <a href="/catalogo" className="hero-cta">Explorar colección</a>
            </div>

            <figure className="hero-cars hero-cars-stack" aria-label="McLaren, Porsche y Ferrari destacados">
              <img className="hero-car hero-car-top" src="/assets/hero/m2png.png" alt="McLaren negro lateral" />
              <img className="hero-car hero-car-middle" src="/assets/hero/ppng.png" alt="Porsche blanco lateral" />
              <img className="hero-car hero-car-bottom" src="/assets/hero/fpng.png" alt="Ferrari rojo lateral" />
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
              {catalogProducts.map((product) => (
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

export async function getServerSideProps() {
  const { data, error } = await getProductsFromSupabase();

  if (error || !data?.length) {
    return {
      props: {
        catalogProducts: fallbackProducts
      }
    };
  }

  return {
    props: {
      catalogProducts: data
    }
  };
}
