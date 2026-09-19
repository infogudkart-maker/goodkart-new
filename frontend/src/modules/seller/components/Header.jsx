import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from '@/modules/auth/components/AuthModal';

export const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3">
              <img src="/goodkart-icon-only.png" alt="" aria-hidden="true" style={{ height: 'clamp(36px, 8vw, 56px)', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <img src="/goodkart-wordmark.png" alt="Goodkart" style={{ height: 'clamp(20px, 4.4vw, 30px)', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                <img src="/goodkart-tagline.png" alt="Good Deals. Good Life" style={{ height: 'clamp(8px, 1.7vw, 12px)', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', marginTop: '2px' }} />
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Categories</Link>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Deals</Link>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">What's New</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
            >
              Login
            </button>
            <Link
              to="/seller"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover transition-all"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </header>
      <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} hideRegister={true} />
    </>
  );
};




