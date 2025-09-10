import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiArrowUp } from 'react-icons/fi';

export default function ScrollToTop({ behavior = 'smooth' }) {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [pathname, behavior]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
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

  const showInSellerPages = pathname.includes('/seller');

  if (!showInSellerPages) return null;

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 p-3 rounded-full bg-indigo-600 text-white shadow-lg 
            hover:bg-indigo-700 transition-all duration-300 z-50
            hover:scale-110 active:scale-95
            animate-fade-in`}
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
