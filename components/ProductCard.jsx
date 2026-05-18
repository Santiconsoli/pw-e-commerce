export default function ProductCard({ product, formatPrice, onAdd }) {
  return (
    <article className="product-card">
      <figure className="product-media">
        <img src={product.image} alt={product.alt} />
      </figure>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">{formatPrice(product.price)}</p>
        <button type="button" className="btn-add" onClick={() => onAdd(product)}>
          AÑADIR AL GARAGE
        </button>
      </div>
    </article>
  );
}
