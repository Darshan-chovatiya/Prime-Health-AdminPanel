import { useState, useEffect } from "react";
import { Category, Service } from "../../services/api";
import { X } from "lucide-react";
import { apiService } from "../../services/api";

interface CategoryModalProps {
  category?: Category;
  onClose: () => void;
  onSubmit: (categoryData: any) => void;
  title: string;
}

export default function CategoryModal({ category, onClose, onSubmit, title }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service: "", // Changed from services array to single service ID
    isActive: true,
    sortOrder: 0,
  });
  const [services, setServices] = useState<Service[]>([]);

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    service?: string;
    general?: string;
  }>({});

  useEffect(() => {
    // Fetch services for dropdown - only active services
    const fetchServices = async () => {
      try {
        const response = await apiService.getServices({ 
          limit: 100,
          status: 'active'
        });
        // Filter to ensure only active services are shown (client-side backup)
        const activeServices = response.data.docs.filter((service: Service) => 
          service.isActive !== false
        );
        setServices(activeServices);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    };
    fetchServices();

    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        service: typeof category.service === 'object' ? category.service._id : category.service || "", 
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        service: "",
        isActive: true,
        sortOrder: 0,
      });
    }
    setErrors({});
  }, [category]);

  // Validate individual field
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Name must be less than 100 characters';
        }
        return null;
      
      case 'description':
        if (!value || value.trim().length < 10) {
          return 'Description must be at least 10 characters';
        }
        if (value.trim().length > 500) {
          return 'Description must be less than 500 characters';
        }
        return null;
      
      case 'service':
        if (!value || value.trim().length === 0) {
          return 'Service is required';
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
     
    // Validate the field
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error || undefined });
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const nameError = validateField('name', formData.name);
    const descriptionError = validateField('description', formData.description);
    const serviceError = validateField('service', formData.service);
    
    return !nameError && !descriptionError && !serviceError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate all fields
    const validationErrors: any = {};
    validationErrors.name = validateField('name', formData.name);
    validationErrors.description = validateField('description', formData.description);
    validationErrors.service = validateField('service', formData.service);

    // Remove undefined values
    Object.keys(validationErrors).forEach(key => {
      if (!validationErrors[key]) delete validationErrors[key];
    });

    setErrors(validationErrors);

    // Check if form is valid
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submitData = category 
      ? { id: category._id, ...formData }
      : formData;

    try {
      await onSubmit(submitData);
    } catch (error: any) {
      // Handle backend errors inline
      const errorMessage = error.message || error.response?.data?.message || 'Failed to save category. Please try again.';
      
      // Try to map backend errors to specific fields
      if (errorMessage.toLowerCase().includes('name')) {
        setErrors(prev => ({ ...prev, name: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('description')) {
        setErrors(prev => ({ ...prev, description: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('service')) {
        setErrors(prev => ({ ...prev, service: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}
          <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
              }`}
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                errors.service ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
              }`}
              required
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
            {errors.service && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.service}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              min="0"
            />
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
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 px-6 pt-4 pb-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={!isFormValid()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isFormValid()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
