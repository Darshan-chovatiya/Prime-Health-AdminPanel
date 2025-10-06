import { useState, useEffect } from "react";
import { Admin } from "../../services/api";

interface AdminModalProps {
  admin?: Admin;
  onClose: () => void;
  onSubmit: (adminData: any) => void;
  title: string;
}

export default function AdminModal({ admin, onClose, onSubmit, title }: AdminModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
    isActive: true,
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name,
        email: admin.email,
        password: "",
        role: admin.role,
        isActive: admin.isActive,
      });
    }
  }, [admin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    if (!admin && !formData.password) {
      alert("Password is required for new admin");
      return;
    }

    const submitData = admin 
      ? { id: admin._id, ...formData }
      : formData;

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password {!admin && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required={!admin}
              placeholder={admin ? "Leave blank to keep current password" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "super_admin" })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {admin ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
