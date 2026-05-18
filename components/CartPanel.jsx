import Link from 'next/link';

export default function CartPanel({
  isOpen,
  cartItems,
  totalPrice,
  formatPrice,
  onClose,
  onQtyChange,
  onRemove,
  onClear
}) {
  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? 'is-visible' : ''}`}
        id="cart-overlay"
        hidden={!isOpen}
        onClick={onClose}
      />
      <aside
        className={`cart-panel ${isOpen ? 'is-open' : ''}`}
        id="cart-panel"
        aria-hidden={!isOpen}
        aria-labelledby="cart-title"
      >
        <div className="cart-panel-header">
          <div>
            <p className="cart-panel-eyebrow">525hp</p>
            <h2 id="cart-title">Tu Garage</h2>
          </div>
          <button type="button" className="cart-close" id="cart-close" aria-label="Cerrar carrito" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cart-panel-body">
          {cartItems.length === 0 ? (
            <p className="cart-empty" id="cart-empty">A tu Garage le falta vida.</p>
          ) : (
            <ul className="cart-items" id="cart-items">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-top">
                    <div className="cart-item-main">
                      <img className="cart-item-thumb" src={item.image} alt={item.name} />
                      <div>
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">{formatPrice(item.price)} c/u</p>
                      </div>
                    </div>
                    <p className="cart-item-price">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty-controls">
                      <button type="button" className="cart-qty-btn" onClick={() => onQtyChange(item.id, -1)}>-</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button type="button" className="cart-qty-btn" onClick={() => onQtyChange(item.id, 1)}>+</button>
                    </div>
                    <button type="button" className="cart-remove-btn" onClick={() => onRemove(item.id)}>Quitar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cart-panel-footer">
          <div className="cart-summary">
            <span>Subtotal</span>
            <strong id="cart-subtotal">{formatPrice(totalPrice)}</strong>
          </div>
          <div className="cart-actions">
            <button type="button" className="cart-secondary-btn" id="cart-continue" onClick={onClose}>
              Seguir comprando
            </button>
            <button type="button" className="cart-secondary-btn" id="cart-clear" onClick={onClear}>
              Vaciar Garage
            </button>
            <Link href="/checkout" className="cart-primary-btn" id="cart-checkout" onClick={onClose}>
              Finalizar compra
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
