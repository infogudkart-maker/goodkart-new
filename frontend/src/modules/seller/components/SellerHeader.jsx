import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const SellerHeader = ({ onLoginClick, onNewSellerClick }) => {
  const [activeSection, setActiveSection] = useState('sell-online');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['sell-online', 'how-it-works', 'pricing-commission', 'shipping-returns', 'grow-business'];
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = React.useRef(null);

  const checkUser = () => {
    const isSellerTab = true; // SellerHeader is only used on seller pages
    const userData = localStorage.getItem('seller_user');
    const loginCtx = sessionStorage.getItem('loginContext');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // On seller pages, we only show user info if they are in SELLER context
        if (loginCtx === 'SELLER') {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    const handleUserChange = () => checkUser();
    window.addEventListener('userDataChanged', handleUserChange);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('userDataChanged', handleUserChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_userName');
    localStorage.removeItem('seller_dob');
    sessionStorage.removeItem('loginContext');
    setUser(null);
    window.dispatchEvent(new CustomEvent('userDataChanged'));
    window.location.href = window.location.origin + '/#/seller';
    window.location.reload();
  };

  const navItems = [
    { id: 'sell-online', label: 'Sell Online' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'pricing-commission', label: 'Pricing & Commission' },
    { id: 'shipping-returns', label: 'Shipping & Returns' },
    { id: 'grow-business', label: 'Grow Business' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-1.5">
            <img src="/goodkart-logo.png" alt="" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
            <span style={{ lineHeight: 1, display: 'flex', flexDirection: 'column' }}>
              <span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1800AD' }}>Good</span><span style={{ fontSize: '2rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1800AD', letterSpacing: '0.3px', textAlign: 'center' }}>Good Deals. Good Life</span>
            </span>
            <span className="text-xs font-medium text-gray-400 ml-1 hidden sm:inline">Supplier</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors relative ${activeSection === item.id
                  ? 'text-[#3B7CF1]'
                  : 'text-gray-600 hover:text-brand'
                  }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute -bottom-[31px] left-0 right-0 h-0.5 bg-[#1800AD]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} color="#1e293b" /> : <Menu size={24} color="#1e293b" />}
        </button>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4" ref={profileRef}>
              <button
                onClick={() => {
                  if (user.role === 'SELLER' && (user.status === 'APPROVED' || user.sellerStatus === 'APPROVED')) {
                    navigate('/seller/dashboard');
                  } else if (user.status === 'PENDING' || user.sellerStatus === 'PENDING') {
                    alert(`⏳ Your seller application is currently under review. Please wait for admin approval.`);
                  } else {
                    alert('You have not completed the seller registration. Please complete the onboarding to access the dashboard.');
                    navigate('/seller/register');
                  }
                }}
                className="rounded-xl border border-[#1800AD] px-5 py-2.5 text-sm font-semibold text-[#3B7CF1] hover:bg-blue-50 transition-all font-sans"
              >
                Go to Dashboard
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full bg-[#1800AD] text-white flex items-center justify-center font-bold"
                >
                  {(user.fullName || 'S').charAt(0).toUpperCase()}
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName || 'Seller'}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="rounded-lg border border-[#1800AD] px-5 py-2 text-sm font-medium text-[#1800AD] bg-transparent hover:bg-blue-50 transition-all cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={onNewSellerClick}
                className="rounded-lg bg-[#3B7CF1] text-white px-5 py-2 text-sm font-medium border-none cursor-pointer hover:bg-[#2d6ae0] transition-all"
              >
                New Seller
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { scrollToSection(item.id); setIsMobileMenuOpen(false); }}
                className={`text-left text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'text-[#3B7CF1] bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (user.role === 'SELLER' && (user.status === 'APPROVED' || user.sellerStatus === 'APPROVED')) {
                      navigate('/seller/dashboard');
                    } else if (user.status === 'PENDING' || user.sellerStatus === 'PENDING') {
                      alert(`⏳ Your seller application is currently under review. Please wait for admin approval.`);
                    } else {
                      alert('You have not completed the seller registration. Please complete the onboarding to access the dashboard.');
                      navigate('/seller/register');
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#1800AD] px-4 py-2.5 text-sm font-semibold text-[#3B7CF1] hover:bg-blue-50 transition-all text-center"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                  className="rounded-xl bg-red-50 text-red-600 px-4 py-2.5 text-sm font-semibold border border-red-200 hover:bg-red-100 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                  className="flex-1 rounded-lg border border-[#1800AD] px-4 py-2.5 text-sm font-medium text-[#1800AD] bg-transparent hover:bg-blue-50 transition-all text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNewSellerClick(); }}
                  className="flex-1 rounded-lg bg-[#3B7CF1] text-white px-4 py-2.5 text-sm font-medium border-none cursor-pointer hover:bg-[#2d6ae0] transition-all text-center"
                >
                  New Seller
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default SellerHeader;





