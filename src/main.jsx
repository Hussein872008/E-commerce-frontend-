import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css' 
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useSelector, useDispatch } from 'react-redux';
import { setAuthToken } from './utils/api';
import setupAxiosInterceptors from './redux/setupAxiosInterceptors';
import { verifyToken } from './redux/authSlice';
import { initializeNotifications } from './redux/notificationSlice';

function insertRuntimeCssOverrides() {
  try {
  const css = `
/* Override SWAL2 keyframes that use margin-top (layout thrash) with transform-based animations */
@keyframes swal2-animate-error-x-mark{0%{transform:translateY(10px) scale(.4);opacity:0}40%{transform:translateY(-6px) scale(1.05);opacity:1}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes swal2-animate-success-line-long{0%{transform:translateY(0) scale(.6);opacity:0}65%{transform:translateY(0) scale(.6);opacity:0}84%{transform:translateY(0) scale(1.02)}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes swal2-animate-success-line-tip{0%{transform:translateY(0) scale(.6);opacity:0}54%{transform:translateY(0) scale(.6);opacity:0}70%{transform:translateY(0) scale(1.02)}84%{transform:translateY(0) scale(1)}100%{transform:translateY(0) scale(1);opacity:1}}
.swal2-icon { zoom: unset !important; transform-origin: center; }
html, :host, body { -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; text-size-adjust: 100%; }
/* Note: global user-select rules removed to allow normal text caret and selection. */
`;

    const ATTR = 'data-runtime-overrides';

    function createStyle() {
      const existing = document.head.querySelector(`style[${ATTR}]`);
      if (existing) return existing;
      const s = document.createElement('style');
      s.setAttribute(ATTR, 'swal2-overrides');
      s.textContent = css;
      document.head.appendChild(s);
      return s;
    }

    createStyle();

    const observer = new MutationObserver((mutations) => {
      let shouldReinsert = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'style' || (tag === 'link' && node.rel === 'stylesheet')) {
              shouldReinsert = true;
              break;
            }
          }
        }
        if (shouldReinsert) break;
      }
      if (shouldReinsert) {
        const existing = document.head.querySelector(`style[${ATTR}]`);
        if (existing) existing.remove();
        createStyle();
      }
    });

    observer.observe(document.head, { childList: true, subtree: false });
    try {
      (window.__runtimeCssOverrides = window.__runtimeCssOverrides || []).push(observer);
    } catch (e) {
    }
  } catch (e) {
  }
}

function Root() {
  const dispatch = useDispatch();
  const darkMode = useSelector(state => state.theme.darkMode);
  const auth = useSelector(state => state.auth);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  React.useEffect(() => {
    if (auth?.isAuthenticated && auth.user?._id) {
      const cleanup = dispatch(initializeNotifications(auth.user._id));
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [auth?.isAuthenticated, auth?.user?._id, dispatch]);
  return (
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
  {(() => {
    try {
      setAuthToken(localStorage.getItem('token'));
      setupAxiosInterceptors();
    } catch (e) {
    }
    return null;
  })()}
  <Root />
    </Provider>
  </React.StrictMode>
);

insertRuntimeCssOverrides();
