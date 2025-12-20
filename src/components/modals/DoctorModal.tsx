import { useState, useEffect, useRef } from "react";
import { Doctor, apiService, Service, Category } from "../../services/api";
import swal from '../../utils/swalHelper';

interface DoctorModalProps {
  doctor?: Doctor;
  onClose: () => void;
  onSubmit: (doctorData: any) => void;
  title: string;
}

// Helper function to get image URL
const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '';
  
  // If it's a base64 string, return as is
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path (starts with uploads/), prepend the base URL
  // Use getBaseUrl from apiService to get the base URL
  const baseUrl = apiService.getBaseUrl();
  
  // Ensure the path starts with / for proper URL construction
  const normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  return `${baseUrl}${normalizedPath}`;
};

export default function DoctorModal({
  doctor,
  onClose,
  onSubmit,
  title,
}: DoctorModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNo: "",
    license: "",
    specialty: "", // Category ID
    bio: "",
    services: "", // Single Service ID
    pricing: {
      consultationFee: 0,
      followUpFee: 0,
    },
    isActive: true,
    profileImage: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobileNo?: string;
    license?: string;
    specialty?: string;
    services?: string;
    consultationFee?: string;
    followUpFee?: string;
  }>({});

  // 🔹 Fetch all services only once
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await apiService.getServices({ limit: 100 });
        if (response.status === 200 && response.data?.docs) {
          const nonDeletedServices = response.data.docs.filter(
            (service: Service) => !service.isDeleted
          );
          setServices(nonDeletedServices);
          setServicesError(null);
        } else {
          setServicesError(response.message || "Failed to load services.");
        }
      } catch (error: any) {
        console.error("Error fetching services:", error);
        setServicesError(
          error.message || "Failed to load services. Please try again."
        );
      }
    };

    fetchServices();
  }, []);

  // 🔹 Only fetch categories when a service is selected
  useEffect(() => {
    if (!formData.services) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategoriesByService({
          limit: 100,
          serviceId: formData.services, // pass serviceId in payload
        });
        if (response.status === 200 && response.data?.docs) {
          setCategories(response.data.docs);
          setCategoriesError(null);
        } else {
          setCategoriesError(response.message || "Failed to load categories.");
        }
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        setCategoriesError(
          error.message || "Failed to load categories. Please try again."
        );
      }
    };

    fetchCategories();
  }, [formData.services]);

  // 🔹 Prefill doctor data if editing
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name,
        email: doctor.email || "",
        mobileNo: doctor.mobileNo,
        license: doctor.license,
        specialty: doctor.specialty?._id || "",
        bio: doctor.bio || "",
        services: doctor.services?._id || "",
        pricing: {
          consultationFee: doctor.pricing?.consultationFee ?? 0,
          followUpFee: doctor.pricing?.followUpFee ?? 0,
        },
        isActive: doctor.isActive,
        profileImage: doctor.profileImage || "",
      });
      setProfileImagePreview("");
      setProfileImageFile(null);
      setErrors({});
    } else {
      // Reset form when creating new doctor
      setFormData({
        name: "",
        email: "",
        mobileNo: "",
        license: "",
        specialty: "",
        bio: "",
        services: "",
        pricing: {
          consultationFee: 0,
          followUpFee: 0,
        },
        isActive: true,
        profileImage: "",
      });
      setProfileImagePreview("");
      setProfileImageFile(null);
      setErrors({});
    }
  }, [doctor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        swal.error('Invalid File Type', 'Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        swal.error('File Too Large', 'Image size should be less than 5MB');
        return;
      }

      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate individual field
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 50) {
          return 'Name must be less than 50 characters';
        }
        return null;
      
      case 'email':
        if (!value || !value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;
      
      case 'mobileNo':
        if (!value || value.trim().length === 0) {
          return 'Mobile number is required';
        }
        if (!/^[0-9]{10}$/.test(value.trim())) {
          return 'Mobile number must be exactly 10 digits';
        }
        return null;
      
      case 'license':
        if (!value || value.trim().length < 5) {
          return 'License number must be at least 5 characters';
        }
        if (value.trim().length > 20) {
          return 'License number must be less than 20 characters';
        }
        return null;
      
      case 'specialty':
        if (!value || value.trim().length === 0) {
          return 'Specialty is required';
        }
        return null;
      
      case 'services':
        if (!value || value.trim().length === 0) {
          return 'Service is required';
        }
        return null;
      
      case 'consultationFee':
        if (value === '' || value === null || value === undefined) {
          return 'Consultation fee is required';
        }
        const fee = parseFloat(value);
        if (isNaN(fee) || fee < 0) {
          return 'Consultation fee must be a number greater than or equal to 0';
        }
        return null;
      
      case 'followUpFee':
        if (value !== '' && value !== null && value !== undefined) {
          const followFee = parseFloat(value);
          if (isNaN(followFee) || followFee < 0) {
            return 'Follow-up fee must be a number greater than or equal to 0';
          }
        }
        return null;
      
      default:
        return null;
    }
  };

  // Validate entire form
  const isFormValid = (): boolean => {
    const nameError = validateField('name', formData.name);
    const emailError = validateField('email', formData.email);
    const mobileError = validateField('mobileNo', formData.mobileNo);
    const licenseError = validateField('license', formData.license);
    const specialtyError = validateField('specialty', formData.specialty);
    const servicesError = validateField('services', formData.services);
    const consultationFeeError = validateField('consultationFee', formData.pricing.consultationFee);
    
    return !nameError && !emailError && !mobileError && !licenseError && !specialtyError && !servicesError && !consultationFeeError;
  };

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    if (name === 'consultationFee' || name === 'followUpFee') {
      setFormData({
        ...formData,
        pricing: {
          ...formData.pricing,
          [name]: value === '' ? 0 : parseFloat(value) || 0,
        },
      });
      // Validate the field
      const error = validateField(name, value === '' ? 0 : parseFloat(value) || 0);
      setErrors({ ...errors, [name]: error || undefined });
    } else {
      setFormData({ ...formData, [name]: value });
      // Validate the field
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error || undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors: any = {};
    validationErrors.name = validateField('name', formData.name);
    validationErrors.email = validateField('email', formData.email);
    validationErrors.mobileNo = validateField('mobileNo', formData.mobileNo);
    validationErrors.license = validateField('license', formData.license);
    validationErrors.specialty = validateField('specialty', formData.specialty);
    validationErrors.services = validateField('services', formData.services);
    validationErrors.consultationFee = validateField('consultationFee', formData.pricing.consultationFee);
    validationErrors.followUpFee = validateField('followUpFee', formData.pricing.followUpFee);

    // Remove undefined values
    Object.keys(validationErrors).forEach(key => {
      if (!validationErrors[key]) delete validationErrors[key];
    });

    setErrors(validationErrors);

    // Check if form is valid
    if (Object.keys(validationErrors).length > 0) {
      swal.error('Validation Error', 'Please fix the errors in the form before submitting');
      return;
    }

    // Create FormData for file upload
    const formDataToSend = new FormData();
    
    // Add all form fields
    formDataToSend.append('name', formData.name);
    if (formData.email) {
      formDataToSend.append('email', formData.email);
    }
    formDataToSend.append('mobileNo', formData.mobileNo);
    formDataToSend.append('license', formData.license);
    formDataToSend.append('specialty', formData.specialty);
    formDataToSend.append('services', formData.services);
    if (formData.bio) {
      formDataToSend.append('bio', formData.bio);
    }
    formDataToSend.append('pricing', JSON.stringify(formData.pricing));
    formDataToSend.append('isActive', formData.isActive.toString());
    
    // Add profile image file if selected
    if (profileImageFile) {
      formDataToSend.append('profileImage', profileImageFile);
    }
    
    // Add ID if updating
    if (doctor) {
      formDataToSend.append('id', doctor._id);
    }

    console.log("Submitting doctor data:", formDataToSend);
    try {
      await onSubmit(formDataToSend);
    } catch (error: any) {
      console.error("Error submitting doctor:", error);
      // Show validation errors properly
      const errorMessage = error.message || "Failed to submit doctor. Please try again.";
      swal.error("Error", errorMessage);
      // Re-throw to let parent handle if needed
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers
                  if (/^\d*$/.test(value) && value.length <= 10) {
                    handleInputChange(e);
                  }
                }}
                className={`w-full rounded-lg border ${
                  errors.mobileNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Enter mobile number (numbers only)"
                maxLength={10}
                required
              />
              {errors.mobileNo && (
                <p className="mt-1 text-sm text-red-500">{errors.mobileNo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="license"
                value={formData.license}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  errors.license ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                required
              />
              {errors.license && (
                <p className="mt-1 text-sm text-red-500">{errors.license}</p>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service <span className="text-red-500">*</span>
                </label>
                {servicesError ? (
                  <p className="text-red-500 text-sm">{servicesError}</p>
                ) : services.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No services available.
                  </p>
                ) : (
                  <>
                    <select
                      name="services"
                      value={formData.services}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Reset specialty when service changes
                        setFormData({
                          ...formData,
                          services: e.target.value,
                          specialty: "",
                        });
                        setErrors({ ...errors, specialty: undefined });
                      }}
                      className={`w-full rounded-lg border ${
                        errors.services ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                      required
                    >
                      <option value="">Select a Service</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    {errors.services && (
                      <p className="mt-1 text-sm text-red-500">{errors.services}</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialty <span className="text-red-500">*</span>
                </label>
                {categoriesError ? (
                  <p className="text-red-500 text-sm">{categoriesError}</p>
                ) : categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {formData.services
                      ? "No categories available for selected service."
                      : "Select a service first."}
                  </p>
                ) : (
                  <>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      className={`w-full rounded-lg border ${
                        errors.specialty ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                      required
                      disabled={!formData.services} // Disable until a service is selected
                    >
                      <option value="">Select Specialty</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.specialty && (
                      <p className="mt-1 text-sm text-red-500">{errors.specialty}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Consultation Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="consultationFee"
                value={formData.pricing.consultationFee}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  errors.consultationFee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                min="0"
                step="0.01"
                required
              />
              {errors.consultationFee && (
                <p className="mt-1 text-sm text-red-500">{errors.consultationFee}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-up Fee
              </label>
              <input
                type="number"
                name="followUpFee"
                value={formData.pricing.followUpFee}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  errors.followUpFee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                min="0"
                step="0.01"
              />
              {errors.followUpFee && (
                <p className="mt-1 text-sm text-red-500">{errors.followUpFee}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Brief description about the doctor..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Image
            </label>
            <div className="mb-3">
              {profileImagePreview || formData.profileImage ? (
                <div className="relative inline-block">
                  <img 
                    src={profileImagePreview || getImageUrl(formData.profileImage)} 
                    alt="Profile preview" 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-32 h-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 flex items-center justify-center hidden">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profileImageInput"
              />
              <label
                htmlFor="profileImageInput"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {profileImagePreview || formData.profileImage ? 'Change Image' : 'Upload Image'}
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
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
              form="doctor-form"
              disabled={!isFormValid()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isFormValid()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {doctor ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
