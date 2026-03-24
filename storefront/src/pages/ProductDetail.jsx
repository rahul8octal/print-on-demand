import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { client } from '../shopify';
import Designer from '../components/Designer';

export default function ProductDetail({ addVariantToCart }) {
  const { handle } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [podCatalog, setPodCatalog] = useState([]);

  useEffect(() => {
    client.product.fetchByHandle(handle).then((res) => {
      if (res) {
        setProduct(res);
        setSelectedVariant(res.variants[0]);
      }
      setLoading(false);
    });

    // Fetch POD catalog
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/pod/catalog`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPodCatalog(data.ids.map(id => `gid://shopify/Product/${id}`));
        }
      });
  }, [handle]);

  const isPodEnabled = product && podCatalog.includes(product.id);

  if (loading || !product) return <div className="loader">Loading Details...</div>;

  const handleOptionChange = (optionName, newValue) => {
    const newVariant = product.variants.find(v => 
      v.selectedOptions.some(o => o.name === optionName && o.value === newValue)
    );
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  return (
    <>
      <div className="product-detail-container fade-in">
        <div className="product-detail-flex">
          
          <div className="product-image-large glass-panel hover-lift">
            <img 
              src={selectedVariant?.image?.src || product.images[0]?.src} 
              alt={product.title} 
            />
          </div>
          
          <div className="product-options glass-panel">
            <h1 className="gradient-text">{product.title}</h1>
            <p className="product-price">${selectedVariant?.price?.amount}</p>
            
            <div className="variant-selectors">
              {product.options.map(option => (
                <div className="option-group" key={option.id}>
                  <label>{option.name}</label>
                  <select onChange={(e) => handleOptionChange(option.name, e.target.value)}>
                    {option.values.map(val => (
                      <option key={val.value} value={val.value}>{val.value}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <div className="qty-wrapper">
                <label>Quantity</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  min="1" 
                  className="qty-input"
                />
              </div>
              
              {isPodEnabled ? (
                <>
                  <button 
                    className="btn-secondary hover-lift" 
                    style={{marginBottom: '1rem', border: '1px solid var(--primary)'}}
                    onClick={() => setIsDesignerOpen(true)}
                  >
                    🚀 Open Custom Studio Designer
                  </button>
                  
                  <button 
                    className="btn-primary" 
                    onClick={() => addVariantToCart(selectedVariant.id, quantity)}
                  >
                    🛒 Buy Blank (No Design)
                  </button>
                </>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={() => addVariantToCart(selectedVariant.id, quantity)}
                >
                  🛒 Add to Cart
                </button>
              )}
            </div>
            
            <div className="product-description">
              <h3>Description</h3>
              <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
          </div>
          
        </div>
      </div>
      
      {isDesignerOpen && (
        <Designer 
          product={product} 
          selectedVariant={selectedVariant}
          quantity={quantity}
          addVariantToCart={addVariantToCart}
          onClose={() => setIsDesignerOpen(false)}
        />
      )}
    </>
  );
}
