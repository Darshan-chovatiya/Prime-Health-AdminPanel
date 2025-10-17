import { useState, useEffect } from "react";
import { Doctor, apiService, Service, Category } from "../../services/api";

interface DoctorModalProps {
  doctor?: Doctor;
  onClose: () => void;
  onSubmit: (doctorData: any) => void;
  title: string;
}

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
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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
      });
    }
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.mobileNo ||
      !formData.license ||
      !formData.services ||
      !formData.specialty
    ) {
      alert(
        "Please fill in all required fields, including service and specialty"
      );
      return;
    }

    const submitData = doctor ? { id: doctor._id, ...formData } : formData;

    console.log("Submitting doctor data:", submitData);
    try {
      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Error submitting doctor:", error);
      alert(error.message || "Failed to submit doctor. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number *
              </label>
              <input
                type="text"
                value={formData.mobileNo}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers
                  if (/^\d*$/.test(value)) {
                    setFormData({ ...formData, mobileNo: value });
                  }
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Enter mobile number (numbers only)"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Number *
              </label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) =>
                  setFormData({ ...formData, license: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service *
                </label>
                {servicesError ? (
                  <p className="text-red-500 text-sm">{servicesError}</p>
                ) : services.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No services available.
                  </p>
                ) : (
                  <select
                    value={formData.services}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        services: e.target.value,
                        specialty: "",
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a Service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialty *
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
                  <select
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Consultation Fee *
              </label>
              <input
                type="number"
                value={formData.pricing.consultationFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing,
                      consultationFee: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-up Fee
              </label>
              <input
                type="number"
                value={formData.pricing.followUpFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing,
                      followUpFee: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                min="0"
                step="0.01"
              />
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
              {doctor ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
