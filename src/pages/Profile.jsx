import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateProfile } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaSave, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

export default function Profile() {
  const { user: currentUser, token } = useSelector((state) => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
  const [user, setUser] = useState(currentUser || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
  name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");


    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords don't match");
        setLoading(false);
        return;
      }
    }

    try {
      await dispatch(
        updateProfile({
          userId: user.id,
          token,
          updates: {
            name: formData.name,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          },
        })
      ).unwrap();

      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      setError(err.message || "Failed to update profile");
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    toast.info("Logged out successfully");
  };

  if (!user) {
    return (
      <div className={`flex justify-center items-center min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        <div className={`p-8 rounded-lg shadow-md max-w-md w-full text-center ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="mb-6">You need to be logged in to view this page</p>
          <button
            onClick={() => navigate("/login")}
            className={`w-full py-2 rounded-md transition flex items-center justify-center gap-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-800 text-blue-100' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <FaUser /> Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-gray-100' : 'bg-gradient-to-br from-green-50 to-white text-gray-800'}`}>
      <div className={`max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-green-100 text-gray-800'}`}>
        {/* Header with back button */}
  <div className={`p-6 flex items-center justify-between ${darkMode ? 'bg-blue-700 text-blue-100' : 'bg-green-600 text-white'}`}> 
          <button
            onClick={() => window.history.back()}
            className={`flex items-center gap-2 font-bold text-lg transition-colors ${darkMode ? 'text-blue-100 hover:text-blue-300' : 'text-white hover:text-green-200'}`}
          >
            <span className="text-2xl"></span>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="opacity-90 text-sm">Manage your account settings</p>
          </div>
          <span></span>
        </div>

  <div className="p-8">
          {error && (
            <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Avatar and user info */}
          <div className="flex items-center mb-8 gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-extrabold shadow ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-green-100 text-green-600'}`}>
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className={`mb-1 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>{user.email}</p>
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded mb-1 ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-green-100 text-green-800'}`}>
                {user.role}
              </span>
              <div className={`text-xs mt-1 ${darkMode ? 'text-blue-300/70' : 'text-gray-400'}`}>
                {user.createdAt && (
                  <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                )}
                {user.updatedAt && (
                  <div>Last Updated: {new Date(user.updatedAt).toLocaleDateString()}</div>
                )}
                <div>Status: <span className={`${darkMode ? 'text-blue-300 font-bold' : 'text-green-600 font-bold'}`}>Active</span></div>
              </div>
            </div>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-900 border-gray-700 text-blue-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-green-500'}`}
                  required
                />
              </div>

              <div>
                <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-900 border-gray-700 text-blue-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-green-500'}`}
                  placeholder="Required for changes"
                />
              </div>

              <div>
                <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-900 border-gray-700 text-blue-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-green-500'}`}
                  placeholder="Leave blank to keep current"
                />
              </div>

              {formData.newPassword && (
                <div>
                  <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-900 border-gray-700 text-blue-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-green-500'}`}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className={`px-4 py-2 rounded transition ${darkMode ? 'bg-gray-700 text-blue-100 hover:bg-gray-800' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded flex items-center gap-2 transition ${darkMode ? 'bg-blue-700 text-blue-100 hover:bg-blue-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  disabled={loading}
                >
                  <FaSave /> {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Name</h3>
                  <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.name}</p>
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Email</h3>
                  <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.email}</p>
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Role</h3>
                  <p className={`mt-1 capitalize ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.role}</p>
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Status</h3>
                  <p className={`mt-1 font-bold ${darkMode ? 'text-blue-300' : 'text-green-700'}`}>Active</p>
                </div>
                {user.createdAt && (
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Created</h3>
                    <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                {user.updatedAt && (
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Last Updated</h3>
                    <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{new Date(user.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded flex items-center gap-2 transition ${darkMode ? 'bg-red-700 text-red-100 hover:bg-red-800' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  <FaSignOutAlt /> Logout
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className={`px-4 py-2 rounded transition ${darkMode ? 'bg-blue-700 text-blue-100 hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}