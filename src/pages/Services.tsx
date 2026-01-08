import { useState, useEffect, useRef } from "react";
import apiService, { Service } from "../services/api";
import swal from '../utils/swalHelper';
import ServiceModal from "../components/modals/ServiceModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import FilterDropdown from '../components/ui/FilterDropdown';
import { useDebounce } from '../hooks';
import Swal from "sweetalert2";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
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
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const isInitialLoad = useRef(true);

  // Debounced values
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedStatusFilter]);

  useEffect(() => {
    fetchServiceStats();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [currentPage, searchTerm, debouncedStatusFilter, limit]);

  const fetchServices = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      } else {
        setTableLoading(true);
      }
      const response = await apiService.getServices({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: debouncedStatusFilter === 'all' ? undefined : debouncedStatusFilter,
      });
      
      if (response.data && response.data.docs) {
        setServices(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load services',
      });
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchServiceStats = async () => {
    try {
      // Calculate stats from services if API doesn't have stats endpoint
      const response = await apiService.getServices({ limit: 1000 });
      if (response.data && response.data.docs) {
        const allServices = response.data.docs;
        const stats = {
          totalServices: allServices.length,
          activeServices: allServices.filter((s: Service) => s.isActive !== false).length,
          inactiveServices: allServices.filter((s: Service) => s.isActive === false).length,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching service stats:', error);
      // Fallback stats
      setStats({
        totalServices: services.length,
        activeServices: services.filter(s => s.isActive !== false).length,
        inactiveServices: services.filter(s => s.isActive === false).length,
      });
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    const result = await swal.confirm('Are you sure?', `Delete service ${serviceName}?`);

    if (result.isConfirmed) {
      try {
        await apiService.deleteService(serviceId);
        swal.success('Deleted!', 'Service has been deleted.');
        fetchServices();
        fetchServiceStats();
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to delete service');
      }
    }
  };

  const handleCreateService = async (serviceData: any) => {
    try {
      await apiService.createService(serviceData);
      swal.success('Success!', 'Service created successfully.');
      setShowCreateModal(false);
      fetchServices();
      fetchServiceStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to create service');
    }
  };

  const handleUpdateService = async (serviceData: any) => {
    try {
      await apiService.updateService(serviceData);
      swal.success('Success!', 'Service updated successfully.');
      setEditingService(null);
      fetchServices();
      fetchServiceStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update service');
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await apiService.toggleServiceStatus(serviceId, !currentStatus);
      
      // Check if response indicates success
      if (response.status === 200 && response.data) {
        swal.success('Success!', `Service ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
        fetchServices();
        fetchServiceStats();
      } else {
        // If status is not 200 or no data, show error message from backend
        const errorMessage = response.message || 'Failed to update service status. Please try again.';
        swal.error('Error', errorMessage);
      }
    } catch (error: any) {
      // Extract error message from various possible formats
      let errorMessage = 'Failed to update service status. Please try again.';
      
      // The API service throws an Error with the message, so check error.message first
      if (error?.message) {
        // Only use the message if it's not a generic "Request failed"
        if (error.message !== 'Request failed' && !error.message.includes('Request failed with status')) {
          errorMessage = error.message;
        } else {
          // If it's a generic message, check for original error data
          if (error?.originalError) {
            const originalError = error.originalError;
            // Check for validation errors array (from Joi validator)
            if (originalError.errors && Array.isArray(originalError.errors)) {
              errorMessage = originalError.errors.map((err: any) => err.message || `${err.path || 'Field'}: Invalid value`).join(', ');
            }
            // Check for message in original error
            else if (originalError.message) {
              errorMessage = originalError.message;
            }
          }
          
          // If still no specific message, provide helpful fallback
          if (errorMessage === 'Failed to update service status. Please try again.') {
            errorMessage = 'Unable to update service status. The service may be assigned to categories. Please remove it from all categories first.';
          }
        }
      } 
      // Check for response object with message
      else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } 
      else if (error?.response?.message) {
        errorMessage = error.response.message;
      }
      // Check if error is a string
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      // Check if error has a data property with message
      else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      // Check for validation errors array
      else if (error?.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((err: any) => err.message || err).join(', ');
      }
      
      // Display the error message (not the error object)
      swal.error('Error', errorMessage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };


  if (loading && services.length === 0) {
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
            Services
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
          >
            Add New Service
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Service Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Services</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalServices?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Services</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.activeServices?.toLocaleString() || '0'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Services</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.inactiveServices?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search services..."
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

          {/* Services Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Services</h4>
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
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
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
                  {services.length > 0 ? (
                    services.map((service) => (
                      <tr key={service._id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{service.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 dark:text-white/90 max-w-xs truncate">
                            {service.description || 'No description available'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                              service.isActive !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                            }`}
                            onClick={() => handleToggleStatus(service._id, service.isActive !== false)}
                            title={`Click to ${service.isActive !== false ? 'deactivate' : 'activate'} service`}
                          >
                            {service.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(service.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <ActionButton 
                              type="view"
                              onClick={() => setViewingService(service)}
                            />
                            <ActionButton 
                              type="edit"
                              onClick={() => setEditingService(service)}
                            />
                            <ActionButton 
                              type="delete"
                              onClick={() => handleDeleteService(service._id, service.name)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p className="mt-2 text-sm">No services found</p>
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

      {/* Create Service Modal */}
      {showCreateModal && (
        <ServiceModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateService}
          title="Create New Service"
        />
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSubmit={handleUpdateService}
          title="Edit Service"
        />
      )}

      {/* View Service Modal */}
      {viewingService && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Service Details</h3>
              <button
                onClick={() => setViewingService(null)}
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
                {/* Service Header */}
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingService.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span 
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                      viewingService.isActive !== false
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                    }`}
                    onClick={() => handleToggleStatus(viewingService._id, viewingService.isActive !== false)}
                    title={`Click to ${viewingService.isActive !== false ? 'deactivate' : 'activate'} service`}
                  >
                    {viewingService.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {viewingService.description || 'No description available'}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(viewingService.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(viewingService.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setViewingService(null);
                  setEditingService(viewingService);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
              >
                Edit Service
              </button>
              <button
                onClick={() => setViewingService(null)}
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

