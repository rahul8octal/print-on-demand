import React from 'react';

export default function Cart({ checkout, isCartOpen, setIsCartOpen, removeLineItemInCart }) {
  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-overlay fade-in" onClick={() => setIsCartOpen(false)}></div>
      <div className={`cart-drawer glass-panel slide-in-right`}>
        <div className="cart-header">
          <h2 className="gradient-text">Your Design Cart</h2>
          <button className="close-cart btn-icon" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>

        <div className="cart-items">
          {!checkout?.lineItems?.length ? (
            <div className="empty-cart flex-center">
              <p>Your cart is empty. Let's design something!</p>
            </div>
          ) : (
            checkout?.lineItems?.map(item => (
              <div key={item.id} className="cart-item glass-card hover-lift">
                <div className="cart-item-image">
                  <img 
                    src={item.variant?.image?.src || 'https://via.placeholder.com/100'} 
                    alt={item.title} 
                  />
                </div>
                <div className="cart-item-details">
                  <h4>{item.title}</h4>
                  <p className="variant-title">
                    {item.variant?.title !== 'Default Title' ? item.variant?.title : ''}
                  </p>
                  <div className="cart-item-meta">
                    {item.customAttributes?.find(attr => attr.key === 'Design URL') && (
                      <div className="design-badge glass-panel flex-center scale-in">
                        <img 
                          src={item.customAttributes.find(attr => attr.key === 'Design URL').value} 
                          alt="Custom Design" 
                          className="design-thumbnail"
                        />
                        <span className="badge-text pulse">Custom Design Captured</span>
                      </div>
                    )}
                    <div className="space-between align-center mt-2">
                       <span className="qty">Qty: {item.quantity}</span>
                       <span className="price font-bold">${(parseFloat(item.variant?.price?.amount) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-danger btn-sm" 
                    onClick={() => removeLineItemInCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {checkout?.lineItems?.length > 0 && (
          <div className="cart-footer glass-panel">
            <div className="subtotal space-between">
              <span className="subtotal-label">Subtotal:</span>
              <span className="subtotal-amount">${checkout?.subtotalPrice?.amount}</span>
            </div>
            <a href={checkout?.webUrl} className="btn-primary checkout-btn flex-center">
              Continue to Secure Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}
