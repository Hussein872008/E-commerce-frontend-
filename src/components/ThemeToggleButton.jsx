import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode } from '../redux/themeSlice';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function ThemeToggleButton() {
  const darkMode = useSelector(state => state.theme.darkMode);
  const dispatch = useDispatch();

  return (
    <button
      onClick={() => dispatch(toggleDarkMode())}
      aria-pressed={darkMode}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white ring-indigo-400/30' : 'bg-white text-gray-800 ring-gray-200'}`}
    >
      <span className="text-lg">
        {darkMode ? <FaMoon /> : <FaSun />}
      </span>
      <span className="hidden sm:inline-block font-medium text-sm">
        {darkMode ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
}
