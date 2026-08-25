import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-1.5 mb-4">
              <img src="/goodkart-logo.png" alt="" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
              <span style={{ lineHeight: 1, display: 'flex', flexDirection: 'column' }}>
                <span>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1800AD' }}>Good</span><span style={{ fontSize: '2rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1800AD', letterSpacing: '0.3px', textAlign: 'center' }}>Good Deals. Good Life</span>
              </span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Sell your products to crores of customers at 0% commission. Join India's most trusted marketplace for sellers.
            </p>
            <div className="flex gap-4">
              <Link to="#" className="text-gray-400 hover:text-[#3B7CF1] transition-colors">
                <Instagram size={20} />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-[#3B7CF1] transition-colors">
                <Facebook size={20} />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-[#3B7CF1] transition-colors">
                <Twitter size={20} />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-[#3B7CF1] transition-colors">
                <Youtube size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Sell on Goodkart</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Sell Online</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Pricing & Commission</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">How it Works</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Grow Your Business</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Grow Your Business</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Learning Hub</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Ads on Goodkart</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Business Insights</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><a href="mailto:support@Goodkart.com" className="hover:text-[#3B7CF1] transition-colors">support@Goodkart.com</a></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Help Center</Link></li>
              <li><Link to="#" className="hover:text-[#3B7CF1] transition-colors">Seller Support</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 Goodkart Inc. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link to="#" className="hover:text-[#3B7CF1]">Privacy Policy</Link>
            <Link to="#" className="hover:text-[#3B7CF1]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;






