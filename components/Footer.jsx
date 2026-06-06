import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-column footer-brand">
          <span className="footer-logo">525<span>hp</span></span>
          <p className="footer-description">
            Muebles y artículos de lujo creados a partir de piezas automotrices icónicas, con una presencia sobria,
            técnica y contemporánea.
          </p>
        </div>

        <div className="footer-column">
          <h2 className="footer-title">Enlaces rápidos</h2>
          <ul className="footer-list">
            <li><Link href="/#inicio" className="footer-link">Inicio</Link></li>
            <li><Link href="/catalogo" className="footer-link">Catálogo</Link></li>
            <li><Link href="/nosotros" className="footer-link">Nosotros</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h2 className="footer-title">Redes sociales</h2>
          <ul className="footer-list">
            <li>
              <span className="footer-link social-link footer-static" aria-label="Instagram de 525hp">
                <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.5" cy="6.5" r="1"></circle>
                </svg>
                <span>Instagram</span>
              </span>
            </li>
            <li>
              <span className="footer-link social-link footer-static" aria-label="Facebook de 525hp">
                <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3.2l.8-4H13V9a1 1 0 0 1 1-1Z"></path>
                </svg>
                <span>Facebook</span>
              </span>
            </li>
            <li>
              <span className="footer-link social-link footer-static" aria-label="LinkedIn de 525hp">
                <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="4" y="9" width="4" height="11"></rect>
                  <circle cx="6" cy="5.5" r="2"></circle>
                  <path d="M11 9h4v1.8c.7-1.1 1.9-2.1 4-2.1 3.1 0 4 2.1 4 5.3V20h-4v-5.1c0-1.5-.3-2.7-1.9-2.7-1.6 0-2.1 1.1-2.1 2.7V20h-4Z"></path>
                </svg>
                <span>LinkedIn</span>
              </span>
            </li>
            <li>
              <span className="footer-link social-link footer-static" aria-label="WhatsApp de 525hp">
                <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 21a8.9 8.9 0 0 1-4.5-1.2L3 21l1.3-4.3A9 9 0 1 1 12 21Z"></path>
                  <path d="M9.1 7.8c.2-.4.4-.5.7-.5h.6c.2 0 .4 0 .6.5l.6 1.5c.1.3.1.5-.1.7l-.5.6c-.1.1-.2.3-.1.5.3.6.8 1.2 1.4 1.8.7.6 1.4 1 2.1 1.3.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.7-.1l1.4.7c.3.1.5.3.4.6l-.2.9c-.1.3-.3.6-.6.7-.5.2-1.2.2-1.9 0-1.1-.3-2.3-.9-3.5-1.9-1.1-.9-2-2.1-2.5-3.3-.4-.8-.5-1.5-.3-2.1Z"></path>
                </svg>
                <span>WhatsApp</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-meta">
            <span className="footer-meta-item">AR | Argentina 🇦🇷</span>
            <span className="footer-meta-item">Idioma | Español</span>
            <span className="footer-meta-link footer-static">Términos y Condiciones del sitio web</span>
            <span className="footer-meta-link footer-static">Privacidad</span>
            <span className="footer-meta-link footer-static">Política de cookies</span>
          </div>
          <p className="footer-copy">© 2026 525hp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
