import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import ThemeToggleButton from '../components/ThemeToggleButton';


export default function Home() {
  const darkMode = useSelector(state => state.theme.darkMode);
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${darkMode ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-blue-600 via-indigo-400 to-purple-400'}`}>
      <ThemeToggleButton />
      {/* Hero Section */}
      <section className={`flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-r ${darkMode ? 'from-gray-900 via-gray-800 to-gray-900 text-blue-100' : 'from-blue-600 via-indigo-600 to-purple-600 text-white'} shadow-2xl rounded-b-3xl`}>
        <h1 className={`text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-200 via-blue-400 to-purple-400' : 'from-white via-blue-200 to-purple-200'}`}>E-Commerce Platform</h1>
        <p className={`mb-8 text-lg md:text-2xl max-w-2xl mx-auto font-medium drop-shadow bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-200 via-blue-400 to-purple-400' : 'from-white via-blue-100 to-purple-100'}`}>Your one-stop shop for everything. Discover, compare, and buy the best products from trusted sellers.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/store" className={`px-8 py-3 font-bold rounded-xl shadow hover:scale-105 transition-all ${darkMode ? 'bg-gray-800 text-blue-200 hover:bg-gray-700' : 'bg-white/80 text-blue-700 hover:bg-blue-100/80'}`}>Browse Store</Link>
          <Link to="/register" className={`px-8 py-3 font-bold rounded-xl shadow hover:scale-105 transition-all bg-gradient-to-r ${darkMode ? 'from-blue-900 via-indigo-900 to-purple-900' : 'from-blue-600 via-indigo-600 to-purple-600'} text-white`}>Join as Buyer</Link>
          <Link to="/login" className={`px-8 py-3 font-bold rounded-xl shadow hover:scale-105 transition-all bg-gradient-to-r ${darkMode ? 'from-purple-900 via-indigo-900 to-blue-900' : 'from-purple-600 via-indigo-600 to-blue-600'} text-white`}>Login</Link>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className={`text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-200 via-indigo-400 to-purple-400' : 'from-blue-100 via-indigo-200 to-purple-400'}`}>Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 flex flex-col items-center ${darkMode ? 'from-gray-800 via-gray-900 to-gray-800' : 'from-blue-50 via-indigo-50 to-purple-50'}`}>
            <span className="text-4xl mb-2">🛒</span>
            <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Wide Product Selection</h3>
            <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Thousands of products in every category, from electronics to fashion and more.</p>
          </div>
          <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 flex flex-col items-center ${darkMode ? 'from-gray-800 via-gray-900 to-gray-800' : 'from-blue-50 via-indigo-50 to-purple-50'}`}>
            <span className="text-4xl mb-2">🔒</span>
            <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Secure Shopping</h3>
            <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your data and payments are protected with the latest security standards.</p>
          </div>
          <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 flex flex-col items-center ${darkMode ? 'from-gray-800 via-gray-900 to-gray-800' : 'from-blue-50 via-indigo-50 to-purple-50'}`}>
            <span className="text-4xl mb-2">🚚</span>
            <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Fast Delivery</h3>
            <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Get your orders quickly with reliable shipping and real-time tracking.</p>
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-6 ${darkMode ? 'from-blue-200 via-indigo-400 to-purple-400' : 'from-blue-100 via-indigo-200 to-purple-400'}`}>Popular Categories</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-blue-200' : 'from-blue-100 to-indigo-100 text-blue-700'}`}>Electronics</span>
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-indigo-200' : 'from-indigo-100 to-purple-100 text-indigo-700'}`}>Fashion</span>
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-purple-200' : 'from-purple-100 to-pink-100 text-purple-700'}`}>Home & Living</span>
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-pink-200' : 'from-pink-100 to-blue-100 text-pink-700'}`}>Beauty</span>
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-blue-200' : 'from-blue-100 to-purple-100 text-blue-700'}`}>Toys</span>
          <span className={`px-5 py-2 rounded-full font-semibold shadow bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900 text-indigo-200' : 'from-indigo-100 to-blue-100 text-indigo-700'}`}>More...</span>
        </div>
      </section>
      {/* Call to Action Section */}
      <section className={`py-12 px-4 border-t text-center rounded-t-3xl bg-gradient-to-r ${darkMode ? 'from-gray-900 via-gray-800 to-gray-900 border-blue-100/30' : 'from-blue-600 via-indigo-600 to-purple-600 border-blue-100/30'}`}>
        <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4 ${darkMode ? 'from-blue-200 via-blue-400 to-purple-400' : 'from-white via-blue-100 to-purple-100'}`}>Ready to start shopping or selling?</h2>
        <Link to="/register" className={`inline-block px-8 py-3 font-bold rounded-xl shadow hover:scale-105 transition-all ${darkMode ? 'bg-gray-800 text-blue-200 hover:bg-gray-700' : 'bg-white/80 text-blue-700 hover:bg-blue-100/80'}`}>Create Your Free Account</Link>
      </section>
    </div>
  );
}
