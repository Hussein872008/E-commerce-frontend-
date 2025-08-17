
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">E-Commerce Platform</h1>
        <p className="mb-8 text-lg md:text-2xl max-w-2xl mx-auto font-medium drop-shadow">Your one-stop shop for everything. Discover, compare, and buy the best products from trusted sellers.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/store" className="px-8 py-3 bg-white text-blue-700 font-bold rounded-lg shadow hover:bg-blue-100 transition">Browse Store</Link>
          <Link to="/register" className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 transition">Join as Buyer</Link>
          <Link to="/login" className="px-8 py-3 bg-blue-700 text-white font-bold rounded-lg shadow hover:bg-blue-800 transition">Login</Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🛒</span>
            <h3 className="font-bold text-lg mb-1">Wide Product Selection</h3>
            <p className="text-gray-500 text-center">Thousands of products in every category, from electronics to fashion and more.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">�</span>
            <h3 className="font-bold text-lg mb-1">Secure Shopping</h3>
            <p className="text-gray-500 text-center">Your data and payments are protected with the latest security standards.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🚚</span>
            <h3 className="font-bold text-lg mb-1">Fast Delivery</h3>
            <p className="text-gray-500 text-center">Get your orders quickly with reliable shipping and real-time tracking.</p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Popular Categories</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full font-semibold shadow">Electronics</span>
          <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-semibold shadow">Fashion</span>
          <span className="bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full font-semibold shadow">Home & Living</span>
          <span className="bg-purple-100 text-purple-700 px-5 py-2 rounded-full font-semibold shadow">Beauty</span>
          <span className="bg-pink-100 text-pink-700 px-5 py-2 rounded-full font-semibold shadow">Toys</span>
          <span className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full font-semibold shadow">More...</span>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 px-4 bg-blue-50 border-t border-blue-100 text-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Ready to start shopping or selling?</h2>
        <Link to="/register" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition">Create Your Free Account</Link>
      </section>
    </div>
  );
}
