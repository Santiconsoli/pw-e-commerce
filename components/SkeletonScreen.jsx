export default function SkeletonScreen() {
  return (
    <div className="skeleton-screen" aria-hidden="true">
      <div className="skeleton-shell">
        <header className="skeleton-header">
          <div className="skeleton-header-bar">
            <span className="skeleton-menu-btn skeleton-block"></span>
            <span className="skeleton-logo skeleton-block"></span>
            <span className="skeleton-cart-btn skeleton-block"></span>
          </div>
        </header>

        <main className="skeleton-main">
          <section className="skeleton-hero">
            <div className="skeleton-hero-lines" aria-hidden="true">
              <span className="skeleton-hero-line skeleton-hero-line-blue"></span>
              <span className="skeleton-hero-line skeleton-hero-line-gold"></span>
              <span className="skeleton-hero-line skeleton-hero-line-red"></span>
            </div>

            <div className="skeleton-hero-layout">
              <div className="skeleton-hero-copy">
                <span className="skeleton-kicker skeleton-block"></span>
                <span className="skeleton-title skeleton-block skeleton-title-1"></span>
                <span className="skeleton-title skeleton-block skeleton-title-2"></span>
                <span className="skeleton-title skeleton-block skeleton-title-3"></span>

                <div className="skeleton-copy-group">
                  <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-sm"></span>
                </div>

                <span className="skeleton-cta skeleton-block"></span>
              </div>

              <div className="skeleton-hero-media">
                <span className="skeleton-hero-image skeleton-block"></span>
              </div>
            </div>
          </section>

          <section className="skeleton-collection">
            <div className="skeleton-section-head">
              <span className="skeleton-kicker skeleton-block"></span>
              <span className="skeleton-section-title skeleton-block"></span>
            </div>

            <div className="skeleton-product-grid">
              <article className="skeleton-product-card">
                <span className="skeleton-product-media skeleton-block"></span>
                <div className="skeleton-product-copy">
                  <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-xs"></span>
                  <span className="skeleton-product-btn skeleton-block"></span>
                </div>
              </article>

              <article className="skeleton-product-card">
                <span className="skeleton-product-media skeleton-block"></span>
                <div className="skeleton-product-copy">
                  <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-xs"></span>
                  <span className="skeleton-product-btn skeleton-block"></span>
                </div>
              </article>

              <article className="skeleton-product-card skeleton-product-card-desktop">
                <span className="skeleton-product-media skeleton-block"></span>
                <div className="skeleton-product-copy">
                  <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-xs"></span>
                  <span className="skeleton-product-btn skeleton-block"></span>
                </div>
              </article>

              <article className="skeleton-product-card skeleton-product-card-desktop">
                <span className="skeleton-product-media skeleton-block"></span>
                <div className="skeleton-product-copy">
                  <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                  <span className="skeleton-line skeleton-block skeleton-line-xs"></span>
                  <span className="skeleton-product-btn skeleton-block"></span>
                </div>
              </article>
            </div>

            <div className="skeleton-brand-strip">
              <span className="skeleton-brand skeleton-block"></span>
              <span className="skeleton-brand skeleton-block"></span>
              <span className="skeleton-brand skeleton-block"></span>
              <span className="skeleton-brand skeleton-block"></span>
            </div>
          </section>
        </main>

        <footer className="skeleton-footer">
          <div className="skeleton-footer-grid">
            <div className="skeleton-footer-col">
              <span className="skeleton-footer-logo skeleton-block"></span>
              <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
              <span className="skeleton-line skeleton-block skeleton-line-md"></span>
            </div>
            <div className="skeleton-footer-col skeleton-footer-col-desktop">
              <span className="skeleton-footer-title skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
            </div>
            <div className="skeleton-footer-col skeleton-footer-col-desktop">
              <span className="skeleton-footer-title skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
              <span className="skeleton-footer-link skeleton-block"></span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
