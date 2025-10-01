import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiArrowUp } from 'react-icons/fi';

export default function ScrollToTop({ behavior = 'smooth' }) {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
try {
      setTimeout(() => {
        try {
          window.scrollTo({ top: 0, behavior });
        } catch (e) {
          window.scrollTo(0, 0);
        }
      }, 0);
    } catch (e) {
      try {
        window.scrollTo({ top: 0, behavior });
      } catch (err) {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, behavior]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 20) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  const isSellerPage = pathname.includes('/seller');

  const baseClasses = 'fixed bottom-8 right-8 p-3 rounded-full text-white shadow-lg transition-all duration-300 z-50 hover:scale-110 active:scale-95 animate-fade-in';
  const sellerClasses = 'bg-indigo-600 hover:bg-indigo-700';
  const buyerClasses = 'bg-gradient-to-br from-[#2361E8] to-[#4338CA] hover:opacity-90';

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`${baseClasses} ${isSellerPage ? sellerClasses : buyerClasses}`}
          aria-label="Scroll to top"
        >
          <FiArrowUp className="w-6 h-6" />
        </button>
      )}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
