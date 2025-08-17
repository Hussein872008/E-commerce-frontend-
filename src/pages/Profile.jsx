import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateProfile } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaSave, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

export default function Profile() {
  const { user: currentUser, token } = useSelector((state) => state.auth);
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
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Profile Not Found</h2>
          <p className="mb-6 text-gray-600">You need to be logged in to view this page</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <FaUser /> Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
        {/* Header with back button */}
        <div className="bg-green-600 p-6 text-white flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white hover:text-green-200 font-bold text-lg"
          >
            <span className="text-2xl">←</span>
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
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Avatar and user info */}
          <div className="flex items-center mb-8 gap-6">
            <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-5xl font-extrabold shadow">
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded mb-1">
                {user.role}
              </span>
              <div className="text-xs text-gray-400 mt-1">
                {user.createdAt && (
                  <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                )}
                {user.updatedAt && (
                  <div>Last Updated: {new Date(user.updatedAt).toLocaleDateString()}</div>
                )}
                <div>Status: <span className="text-green-600 font-bold">Active</span></div>
              </div>
            </div>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Required for changes"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Leave blank to keep current"
                />
              </div>

              {formData.newPassword && (
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
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
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-gray-900">{user.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <p className="mt-1 text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-green-700 font-bold">Active</p>
                </div>
                {user.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="mt-1 text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                {user.updatedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p className="mt-1 text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2"
                >
                  <FaSignOutAlt /> Logout
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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