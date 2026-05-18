import Link from 'next/link';

export default function Header({
  cartCount = 0,
  isCartOpen = false,
  isMenuOpen = false,
  onOpenCart,
  onOpenMenu,
  onCloseMenu,
  checkout = false
}) {
  if (checkout) {
    return (
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
    );
  }

  return (
    <>
      <header className="main-header">
        <div className="container header-flex">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={onOpenMenu}
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
          </div>
        </div>
      </header>

      <div
        className={`menu-overlay ${isMenuOpen ? 'is-visible' : ''}`}
        hidden={!isMenuOpen}
        onClick={onCloseMenu}
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
          <button type="button" className="menu-close" aria-label="Cerrar menú" onClick={onCloseMenu}>
            ×
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Navegación principal">
          <ul className="mobile-menu-list">
            <li><a href="#inicio" className="mobile-menu-link" onClick={onCloseMenu}>Inicio</a></li>
            <li><a href="#catalogo" className="mobile-menu-link" onClick={onCloseMenu}>Catálogo</a></li>
            <li><a href="#nosotros" className="mobile-menu-link" onClick={onCloseMenu}>Nosotros</a></li>
            <li><a href="#contacto" className="mobile-menu-link" onClick={onCloseMenu}>Contacto</a></li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
