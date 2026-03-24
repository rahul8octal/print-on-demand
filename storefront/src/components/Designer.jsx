import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';
import '../index.css';

export default function Designer({ product, selectedVariant, quantity, addVariantToCart, onClose }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize Fabric Canvas
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 600,
      backgroundColor: 'transparent',
    });

    // Simulated T-Shirt print area boundary
    const printBoundary = new fabric.Rect({
      left: 100,
      top: 100,
      width: 300,
      height: 400,
      fill: 'transparent',
      stroke: 'rgba(99, 102, 241, 0.9)',
      strokeWidth: 2,
      strokeDashArray: [10, 5],
      selectable: false,
      evented: false,
    });
    initCanvas.add(printBoundary);

    setCanvas(initCanvas);

    return () => {
      initCanvas.dispose();
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        // Scale down if larger than print area
        if (img.width > 250) {
          img.scaleToWidth(250);
        }
        img.set({
          left: 125,
          top: 150,
          cornerColor: '#ec4899',
          borderColor: '#ec4899',
          cornerSize: 12,
          transparentCorners: false,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    // Prevent deleting the print boundary
    if (activeObj && activeObj.type !== 'rect') {
      canvas.remove(activeObj);
    }
  };

  const handleSaveAndAddToCart = async () => {
    if (!canvas) return;
    setIsSaving(true);
    
    try {
      // Temporarily hide the dashed boundary for the final PNG export
      const objects = canvas.getObjects();
      const boundary = objects.find(o => o.type === 'rect' && !o.selectable);
      if (boundary) boundary.set({ opacity: 0 });
      canvas.renderAll();

      // Export at 2x multiplier for 300+ DPI simulation
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 
      });

      // Restore boundary
      if (boundary) boundary.set({ opacity: 1 });
      canvas.renderAll();

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const designJson = JSON.stringify(canvas.toJSON());
      
      const formData = new FormData();
      formData.append('image', blob, 'design.png');
      formData.append('design_data', designJson);
      formData.append('product_id', product.id);
      formData.append('shop_domain', import.meta.env.VITE_SHOPIFY_DOMAIN || 'your-shop.myshopify.com');

      // Send to Laravel Middleware Phase 2 Endpoint
      const res = await axios.post('http://localhost:8000/api/design', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const designUrl = res.data.design.design_image_url;
      
      // Hook the returned Design URL into Shopify's Line Item Properties
      await addVariantToCart(selectedVariant.id, quantity, [
        { key: 'Design URL', value: designUrl }
      ]);
      
      onClose();
    } catch (err) {
      console.error("Failed to save design:", err);
      alert('Network Error: Ensure the Laravel Backend is running on localhost:8000. Fallback: Adding to cart without custom design URL.');
      
      // Fallback for demonstration offline
      await addVariantToCart(selectedVariant.id, quantity);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="designer-modal-overlay fade-in" onClick={onClose}></div>
      <div className="designer-modal glass-panel slide-in-bottom">
        
        <div className="designer-header space-between align-center">
          <h2 className="gradient-text">Studio Designer</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="designer-layout flex-col md-flex-row">
          
          <div className="designer-toolbar glass-card">
            <h3>Tools</h3>
            <p className="subtitle">Upload artwork into the dashed print area and position it.</p>
            
            <div className="tool-group">
              <label className="btn-secondary w-full text-center tooltip-host">
                Upload Artwork (PNG/JPG)
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            
            <div className="tool-group">
              <button className="btn-danger w-full" onClick={deleteSelected}>
                Delete Selected
              </button>
            </div>

            <div className="tool-group mt-auto pt-4">
              <div className="price-summary space-between mb-4">
                 <span>Total Price:</span>
                 <span className="price font-bold">${(parseFloat(selectedVariant?.price?.amount) * quantity).toFixed(2)}</span>
              </div>
              <button 
                 className="btn-primary w-full flex-center hover-lift" 
                 onClick={handleSaveAndAddToCart}
                 disabled={isSaving}
              >
                 {isSaving ? 'Processing & Saving...' : 'Save & Add To Cart'}
              </button>
            </div>
          </div>
          
          <div className="designer-canvas-wrapper flex-center glass-card">
             {/* We can place the T-shirt image as a CSS background to keep the DOM clean */}
             <div className="tshirt-backdrop" style={{ 
               backgroundImage: `url(${selectedVariant?.image?.src || product.images[0]?.src})` 
             }}>
               <canvas ref={canvasRef}></canvas>
             </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
