import { useState, useEffect } from "react";
import apiService, { Category } from "../services/api";
import swal from '../utils/swalHelper';
import CategoryModal from "../components/modals/CategoryModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchCategoryStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.data && response.data.docs) {
        setCategories(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load categories',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const response = await apiService.getCategoryStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const result = await swal.confirm('Are you sure?', `Delete category ${categoryName}?`);

    if (result.isConfirmed) {
      try {
        await apiService.deleteCategory(categoryId);
        swal.success('Deleted!', 'Category has been deleted.');
        fetchCategories();
        fetchCategoryStats();
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to delete category');
      }
    }
  };

  const handleCreateCategory = async (categoryData: any) => {
    try {
      await apiService.createCategory(categoryData);
      swal.success('Success!', 'Category created successfully.');
      setShowCreateModal(false);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (categoryData: any) => {
    try {
      await apiService.updateCategory(categoryData);
      swal.success('Success!', 'Category updated successfully.');
      setEditingCategory(null);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update category');
    }
  };

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await apiService.toggleCategoryStatus(categoryId, !currentStatus);
      swal.success('Success!', `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update category status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Service Categories
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Add New Category
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Category Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalCategories?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.activeCategories?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most Popular</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {stats?.mostPopular?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Services Available</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalServices?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                  <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <SearchInput
                placeholder="Search categories..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category._id} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        category.color ? `bg-${category.color}-100 dark:bg-${category.color}-500/20` : 'bg-blue-100 dark:bg-blue-500/20'
                      }`}>
                        {category.icon ? (
                          <img src={category.icon} alt={category.name} className="h-6 w-6" />
                        ) : (
                          <svg className={`h-6 w-6 ${category.color ? `text-${category.color}-600 dark:text-${category.color}-400` : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{category.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Medical Specialty</p>
                      </div>
                    </div>
                    <span 
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                      }`}
                      onClick={() => handleToggleStatus(category._id, category.isActive)}
                      title={`Click to ${category.isActive ? 'deactivate' : 'activate'} category`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description || 'No description available'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{category.servicesCount || category.service?.length || 0}</span> services available
                    </div>
                    <div className="flex space-x-2">
                      <ActionButton 
                        type="edit"
                        onClick={() => setEditingCategory(category)}
                      />
                      <ActionButton 
                        type="delete"
                        onClick={() => handleDeleteCategory(category._id, category.name)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No categories found</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <CategoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCategory}
          title="Create New Category"
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleUpdateCategory}
          title="Edit Category"
        />
      )}
    </>
  );
}
