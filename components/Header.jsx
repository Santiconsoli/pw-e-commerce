import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header({
  cartCount = 0,
  isCartOpen = false,
  isMenuOpen,
  onOpenCart,
  onOpenMenu,
  onCloseMenu,
  actionHref = null,
  actionLabel = 'Seguir comprando'
}) {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuControlled = typeof onOpenMenu === 'function' || typeof onCloseMenu === 'function';
  const menuOpen = isMenuControlled ? Boolean(isMenuOpen) : internalMenuOpen;

  const handleOpenMenu = () => {
    if (isMenuControlled) {
      onOpenMenu?.();
      return;
    }
    setInternalMenuOpen(true);
  };

  const handleCloseMenu = () => {
    if (isMenuControlled) {
      onCloseMenu?.();
      return;
    }
    setInternalMenuOpen(false);
  };

  useEffect(() => {
    if (isMenuControlled || !menuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setInternalMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuControlled, menuOpen]);

  return (
    <>
      <header className="main-header">
        <div className="container header-flex">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={handleOpenMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="logo">
            <Link href="/#inicio">525<span>hp</span></Link>
          </div>

          <nav className="nav-wrapper">
            <ul className="nav-list">
              <li><Link href="/#inicio" className="nav-link">Inicio</Link></li>
              <li><Link href="/#catalogo" className="nav-link">Catálogo</Link></li>
              <li><Link href="/nosotros" className="nav-link">Nosotros</Link></li>
            </ul>
          </nav>

          <div className="header-actions">
            {actionHref ? (
              <Link href={actionHref} className="cart-btn header-link-btn">{actionLabel}</Link>
            ) : (
              <button
                type="button"
                className="cart-btn"
                onClick={onOpenCart}
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
            )}
          </div>
        </div>
      </header>

      <div
        className={`menu-overlay ${menuOpen ? 'is-visible' : ''}`}
        hidden={!menuOpen}
        onClick={handleCloseMenu}
      />
      <aside
        className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
        id="mobile-menu"
        aria-hidden={!menuOpen}
        aria-labelledby="mobile-menu-title"
      >
        <div className="mobile-menu-header">
          <div>
            <p className="cart-panel-eyebrow">525hp</p>
            <h2 id="mobile-menu-title">Menú</h2>
          </div>
          <button type="button" className="menu-close" aria-label="Cerrar menú" onClick={handleCloseMenu}>
            ×
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Navegación principal">
          <ul className="mobile-menu-list">
            <li><Link href="/#inicio" className="mobile-menu-link" onClick={handleCloseMenu}>Inicio</Link></li>
            <li><Link href="/#catalogo" className="mobile-menu-link" onClick={handleCloseMenu}>Catálogo</Link></li>
            <li><Link href="/nosotros" className="mobile-menu-link" onClick={handleCloseMenu}>Nosotros</Link></li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
