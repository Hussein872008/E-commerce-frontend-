import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode } from '../redux/themeSlice';

export default function ThemeToggleButton() {
  const darkMode = useSelector(state => state.theme.darkMode);
  const dispatch = useDispatch();
  return (
    <button
      onClick={() => dispatch(toggleDarkMode())}
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-full shadow transition-colors duration-300 font-semibold text-sm
        ${darkMode ? 'bg-gray-800 text-blue-200 hover:bg-gray-700' : 'bg-white text-blue-700 hover:bg-blue-100'}`}
      aria-label="Toggle theme"
    >
      {darkMode ? '🌙 الوضع الليلي' : '☀️ الوضع الفاتح'}
    </button>
  );
}
