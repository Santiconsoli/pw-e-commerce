export default function SkeletonScreen() {
  return (
    <div className="skeleton-screen" aria-hidden="true">
      <div className="skeleton-shell">
        <header className="skeleton-header">
          <div className="skeleton-topbar">
            <span className="skeleton-status skeleton-status-time"></span>
            <div className="skeleton-status-group">
              <span className="skeleton-status skeleton-status-signal"></span>
              <span className="skeleton-status skeleton-status-wifi"></span>
              <span className="skeleton-status skeleton-status-battery"></span>
            </div>
          </div>

          <div className="skeleton-toolbar">
            <span className="skeleton-avatar skeleton-block"></span>
            <span className="skeleton-search skeleton-block"></span>
            <span className="skeleton-icon skeleton-block"></span>
          </div>
        </header>

        <main className="skeleton-feed">
          <section className="skeleton-card">
            <div className="skeleton-card-head">
              <span className="skeleton-avatar skeleton-block"></span>
              <div className="skeleton-card-copy">
                <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
                <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                <span className="skeleton-line skeleton-block skeleton-line-sm"></span>
              </div>
            </div>

            <div className="skeleton-text-group">
              <span className="skeleton-line skeleton-block skeleton-line-full"></span>
              <span className="skeleton-line skeleton-block skeleton-line-xl"></span>
              <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
              <span className="skeleton-line skeleton-block skeleton-line-md"></span>
            </div>

            <div className="skeleton-meta-row">
              <div className="skeleton-dots">
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
              </div>
              <span className="skeleton-pill skeleton-block"></span>
            </div>
          </section>

          <section className="skeleton-card">
            <div className="skeleton-card-head">
              <span className="skeleton-avatar skeleton-block"></span>
              <div className="skeleton-card-copy">
                <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
                <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                <span className="skeleton-line skeleton-block skeleton-line-sm"></span>
              </div>
            </div>

            <div className="skeleton-media skeleton-block"></div>

            <div className="skeleton-meta-row">
              <div className="skeleton-dots">
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
                <span className="skeleton-dot skeleton-block"></span>
              </div>
              <span className="skeleton-pill skeleton-block"></span>
            </div>
          </section>

          <section className="skeleton-card skeleton-card-desktop">
            <div className="skeleton-card-head">
              <span className="skeleton-avatar skeleton-block"></span>
              <div className="skeleton-card-copy">
                <span className="skeleton-line skeleton-block skeleton-line-lg"></span>
                <span className="skeleton-line skeleton-block skeleton-line-md"></span>
                <span className="skeleton-line skeleton-block skeleton-line-sm"></span>
              </div>
            </div>

            <div className="skeleton-grid">
              <span className="skeleton-product skeleton-block"></span>
              <span className="skeleton-product skeleton-block"></span>
              <span className="skeleton-product skeleton-block"></span>
            </div>
          </section>
        </main>

        <footer className="skeleton-bottom-nav">
          <span className="skeleton-nav-item skeleton-block"></span>
          <span className="skeleton-nav-item skeleton-block"></span>
          <span className="skeleton-nav-item skeleton-block"></span>
          <span className="skeleton-nav-item skeleton-block"></span>
          <span className="skeleton-nav-item skeleton-block"></span>
        </footer>
      </div>
    </div>
  );
}
