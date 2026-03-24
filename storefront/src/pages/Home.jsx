import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../shopify';

export default function Home() {
  const [products, setProducts] = useState(null);
  const [podCatalog, setPodCatalog] = useState([]);

  useEffect(() => {
    // Fetch Shopify products
    client.product.fetchAll().then((res) => {
      setProducts(res);
    }).catch(err => console.error("Error fetching products", err));

    // Fetch POD catalog IDs
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/pod/catalog`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPodCatalog(data.ids.map(id => `gid://shopify/Product/${id}`));
        }
      })
      .catch(err => console.error("Error fetching POD catalog", err));
  }, []);

  const isPodEnabled = (productId) => podCatalog.includes(productId);

  if (!products) {
    return <div className="loader-container flex-center"><div className="loader pulse"></div></div>;
  }

  return (
    <div className="home-container fade-in">
      <div className="hero-section glass-panel">
        <h1 className="gradient-text">Design Your Ultimate Custom Apparel</h1>
        <p>Start with our premium blanks and unleash your creativity.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card glass-panel hover-lift relative">
            {isPodEnabled(product.id) && (
              <div className="pod-badge glass-panel scale-in">Personalize</div>
            )}
            <Link to={`/product/${product.handle}`} className="product-link">
              <div className="product-image-container">
                <img 
                  src={product.images[0]?.src || 'https://via.placeholder.com/300'} 
                  alt={product.title} 
                />
              </div>
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="price-tag font-bold mb-4">${product.variants[0]?.price?.amount}</p>
                <button className={`btn-primary w-full ${!isPodEnabled(product.id) ? 'btn-secondary' : ''}`}>
                   {isPodEnabled(product.id) ? 'Open Custom Studio' : 'View Details'}
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
