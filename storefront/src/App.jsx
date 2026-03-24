import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './components/Cart';
import { client } from './shopify';
import './index.css';

function App() {
  const [checkout, setCheckout] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    client.checkout.create().then((res) => {
      setCheckout(res);
    });
  }, []);

  const addVariantToCart = async (variantId, quantity, customAttributes = []) => {
    if (!checkout) return;
    const lineItemsToAdd = [{ 
      variantId, 
      quantity: parseInt(quantity, 10),
      customAttributes 
    }];
    const newCheckout = await client.checkout.addLineItems(checkout.id, lineItemsToAdd);
    setCheckout(newCheckout);
    setIsCartOpen(true);
  };

  const removeLineItemInCart = async (lineItemId) => {
    if (!checkout) return;
    const newCheckout = await client.checkout.removeLineItems(checkout.id, [lineItemId]);
    setCheckout(newCheckout);
  };

  return (
    <Router>
      <div className="app-container">
        
        <header className="main-header glass-panel space-between align-center">
          <div className="logo hover-lift">
            <Link to="/">
              <span className="gradient-text tracking-wide">POD STUDIO</span>
            </Link>
          </div>
          <nav className="header-nav">
            <button 
              className="cart-trigger btn-secondary flex-center" 
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>{checkout?.lineItems?.length || 0}</span>
            </button>
          </nav>
        </header>

        <Cart 
          checkout={checkout} 
          isCartOpen={isCartOpen} 
          setIsCartOpen={setIsCartOpen} 
          removeLineItemInCart={removeLineItemInCart}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:handle" element={<ProductDetail addVariantToCart={addVariantToCart} />} />
          </Routes>
        </main>
        
        <footer className="main-footer glass-panel flex-center">
          <p>&copy; {new Date().getFullYear()} POD Studio. Built with React + Shopify + Laravel.</p>
        </footer>

      </div>
    </Router>
  );
}

export default App;
