import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
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

export default function CatalogPage({ catalogProducts }) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('featured');
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

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return catalogProducts
      .filter((product) => {
        const matchesSearch = !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch);

        return matchesSearch;
      })
      .sort((firstProduct, secondProduct) => {
        if (sortMode === 'price-asc') {
          return firstProduct.price - secondProduct.price;
        }

        if (sortMode === 'price-desc') {
          return secondProduct.price - firstProduct.price;
        }

        return 0;
      });
  }, [catalogProducts, searchTerm, sortMode]);

  const lowestPrice = useMemo(
    () => catalogProducts.reduce((min, product) => Math.min(min, product.price), catalogProducts[0]?.price || 0),
    [catalogProducts]
  );

  return (
    <>
      <Head>
        <title>Catálogo | 525hp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Explorá la colección 525hp de muebles y objetos de lujo inspirados en piezas automotrices."
        />
      </Head>

      <div className="catalog-page">
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
          <section className="catalog-hero">
            <div className="hero-lines catalog-page-lines" aria-hidden="true">
              <span className="hero-line hero-line-blue"></span>
              <span className="hero-line hero-line-gold"></span>
              <span className="hero-line hero-line-red"></span>
            </div>

            <div className="container catalog-hero-layout">
              <div className="catalog-hero-copy">
                <p className="eyebrow">Catálogo 525hp</p>
                <h1>Objetos con ADN de pista</h1>
                <p>
                  Una selección curada de piezas automotrices reinterpretadas como mobiliario y objetos de presencia.
                </p>
              </div>

              <aside className="catalog-hero-stat" aria-label="Resumen del catálogo">
                <span>{catalogProducts.length}</span>
                <p>Piezas activas</p>
                <strong>Desde {formatPrice(lowestPrice)}</strong>
                <small>Elegí tu próxima pieza de colección.</small>
              </aside>
            </div>
          </section>

          <section className="catalog-section">
            <div className="container">
              <div className="catalog-toolbar">
                <label className="catalog-search">
                  <span>Buscar pieza</span>
                  <input
                    type="search"
                    placeholder="Mesa, reloj, lámpara..."
                    maxLength={60}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value.slice(0, 60))}
                  />
                </label>

                <label className="catalog-sort">
                  <span>Ordenar</span>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                    <option value="featured">Destacados</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                  </select>
                </label>
              </div>

              <div className="catalog-results-heading">
                <div>
                  <p className="eyebrow">La colección</p>
                  <h2>
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'pieza encontrada' : 'piezas encontradas'}
                  </h2>
                </div>
              </div>

              {filteredProducts.length ? (
                <div className="catalog-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} formatPrice={formatPrice} onAdd={handleAdd} />
                  ))}
                </div>
              ) : (
                <div className="catalog-empty">
                  <p>No encontramos piezas con esos filtros.</p>
                  <button
                    type="button"
                    className="checkout-primary-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setSortMode('featured');
                    }}
                  >
                    Reiniciar filtros
                  </button>
                </div>
              )}
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
          <div className="cart-toast is-visible" id="cart-toast" role="status" aria-live="polite" aria-atomic="true">
            {toastMessage}
          </div>
        )}

        <Footer />
      </div>
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
