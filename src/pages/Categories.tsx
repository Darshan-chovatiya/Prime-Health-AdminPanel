import { useState, useEffect, useRef } from "react";
import apiService, { Category } from "../services/api";
import swal from '../utils/swalHelper';
import CategoryModal from "../components/modals/CategoryModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import FilterDropdown from '../components/ui/FilterDropdown';
import { useDebounce } from '../hooks';
import Swal from "sweetalert2";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const isInitialLoad = useRef(true);

  // Debounced values - only for status filter since SearchInput handles search debouncing
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedStatusFilter]);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm, debouncedStatusFilter, limit]);

  const fetchCategories = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      } else {
        setTableLoading(true);
      }
      const response = await apiService.getCategories({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: debouncedStatusFilter === 'all' ? undefined : debouncedStatusFilter,
      });
      
      if (response.data && response.data.docs) {
        setCategories(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
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
      setTableLoading(false);
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
      const response = await apiService.createCategory(categoryData);
      if (response.status === 200 || response.status === 201) {
        swal.success('Success!', 'Category created successfully.');
        setShowCreateModal(false);
        fetchCategories();
        fetchCategoryStats();
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (error: any) {
      // Re-throw error so CategoryModal can display it inline
      throw error;
    }
  };

  const handleUpdateCategory = async (categoryData: any) => {
    try {
      const response = await apiService.updateCategory(categoryData);
      if (response.status === 200 || response.status === 201) {
        swal.success('Success!', 'Category updated successfully.');
        setEditingCategory(null);
        fetchCategories();
        fetchCategoryStats();
      } else {
        throw new Error(response.message || 'Failed to update category');
      }
    } catch (error: any) {
      // Re-throw error so CategoryModal can display it inline
      throw error;
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

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Service Categories
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
          >
            Add New Category
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Category Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search categories..."
                value={searchTerm}
                onChange={setSearchTerm}
                debounceMs={500}
              />
              <FilterDropdown
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Categories Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Categories</h4>
            </div>
            {tableLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}
            <div className={`overflow-x-auto ${tableLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <tr key={category._id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              category.color ? `bg-${category.color}-100 dark:bg-${category.color}-500/20` : 'bg-blue-100 dark:bg-blue-500/20'
                            }`}>
                              {category.icon ? (
                                <>
                                  <img 
                                    src={category.icon} 
                                    alt={category.name} 
                                    className="h-5 w-5"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.classList.remove('hidden');
                                    }}
                                  />
                                  <svg className={`h-5 w-5 hidden ${category.color ? `text-${category.color}-600 dark:text-${category.color}-400` : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </>
                              ) : (
                                <svg className={`h-5 w-5 ${category.color ? `text-${category.color}-600 dark:text-${category.color}-400` : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{category.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Medical Specialty</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 dark:text-white/90 max-w-xs truncate">
                            {category.description || 'No description available'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                          {category.servicesCount || (category.service ? 1 : 0)}
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <ActionButton 
                              type="view"
                              onClick={() => setViewingCategory(category)}
                            />
                            <ActionButton 
                              type="edit"
                              onClick={() => setEditingCategory(category)}
                            />
                            <ActionButton 
                              type="delete"
                              onClick={() => handleDeleteCategory(category._id, category.name)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="mt-2 text-sm">No categories found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalDocs={totalDocs}
            limit={limit}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
          />
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

      {/* View Category Modal */}
      {viewingCategory && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Category Details</h3>
              <button
                onClick={() => setViewingCategory(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center space-x-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-lg ${
                    viewingCategory.color ? `bg-${viewingCategory.color}-100 dark:bg-${viewingCategory.color}-500/20` : 'bg-blue-100 dark:bg-blue-500/20'
                  }`}>
                    {viewingCategory.icon ? (
                      <>
                        <img 
                          src={viewingCategory.icon} 
                          alt={viewingCategory.name} 
                          className="h-8 w-8"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <svg className={`h-8 w-8 hidden ${viewingCategory.color ? `text-${viewingCategory.color}-600 dark:text-${viewingCategory.color}-400` : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </>
                    ) : (
                      <svg className={`h-8 w-8 ${viewingCategory.color ? `text-${viewingCategory.color}-600 dark:text-${viewingCategory.color}-400` : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingCategory.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Medical Specialty</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span 
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                      viewingCategory.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                    }`}
                    onClick={() => handleToggleStatus(viewingCategory._id, viewingCategory.isActive)}
                    title={`Click to ${viewingCategory.isActive ? 'deactivate' : 'activate'} category`}
                  >
                    {viewingCategory.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {viewingCategory.description || 'No description available'}
                  </p>
                </div>

                {/* Services Count */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {viewingCategory.servicesCount || (viewingCategory.service ? 1 : 0)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">services available</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(viewingCategory.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(viewingCategory.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setViewingCategory(null);
                  setEditingCategory(viewingCategory);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
              >
                Edit Category
              </button>
              <button
                onClick={() => setViewingCategory(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
