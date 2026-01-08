import { useState, useEffect } from "react";
import { Slot } from "../../services/api";

interface SlotModalProps {
  slot?: Slot;
  doctors: any[];
  onClose: () => void;
  onSubmit: (slotData: any) => void;
  title: string;
}

export default function SlotModal({ slot, doctors, onClose, onSubmit, title }: SlotModalProps) {
  const [formData, setFormData] = useState({
    doctorId: "",
    startTime: "",
    endTime: "",
    status: "available" as "available" | "booked" | "blocked",
    isRecurring: false,
    recurrenceDetails: {
      frequency: "daily" as "daily" | "weekly" | "monthly",
      endDate: "",
    },
  });

  // Validation errors state
  const [errors, setErrors] = useState<{
    doctorId?: string;
    startTime?: string;
    endTime?: string;
    recurrenceEndDate?: string;
  }>({});

  useEffect(() => {
    if (slot) {
      let endDate = "";
      if (slot.recurrenceDetails?.endDate) {
        try {
          const date = new Date(slot.recurrenceDetails.endDate);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString().slice(0, 10);
          }
        } catch (e) {
          console.error('Error parsing endDate:', e);
        }
      }
      
      // Handle doctorId - it might be an object (populated) or a string
      let doctorIdValue = "";
      if (slot.doctorId) {
        if (typeof slot.doctorId === 'object' && slot.doctorId !== null && '_id' in slot.doctorId) {
          doctorIdValue = slot.doctorId._id;
        } else if (typeof slot.doctorId === 'string') {
          doctorIdValue = slot.doctorId;
        }
      }
      
      setFormData({
        doctorId: doctorIdValue,
        startTime: new Date(slot.startTime).toISOString().slice(0, 16),
        endTime: new Date(slot.endTime).toISOString().slice(0, 16),
        status: slot.status,
        isRecurring: slot.isRecurring,
        recurrenceDetails: slot.recurrenceDetails || {
          frequency: "daily",
          endDate: endDate,
        },
      });
    } else {
      setFormData({
        doctorId: "",
        startTime: "",
        endTime: "",
        status: "available",
        isRecurring: false,
        recurrenceDetails: {
          frequency: "daily",
          endDate: "",
        },
      });
    }
    setErrors({});
  }, [slot]);

  // Validate individual field
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'doctorId':
        if (!value || value.trim().length === 0) {
          return 'Doctor is required';
        }
        return null;
      
      case 'startTime':
        if (!value) {
          return 'Start time is required';
        }
        const startDate = new Date(value);
        if (isNaN(startDate.getTime())) {
          return 'Please enter a valid start time';
        }
        if (!slot) {
          const now = new Date();
          if (startDate <= now) {
            return 'Start time must be in the future';
          }
        }
        return null;
      
      case 'endTime':
        if (!value) {
          return 'End time is required';
        }
        const endDate = new Date(value);
        if (isNaN(endDate.getTime())) {
          return 'Please enter a valid end time';
        }
        if (formData.startTime) {
          const startDate = new Date(formData.startTime);
          if (endDate <= startDate) {
            return 'End time must be after start time';
          }
        }
        return null;
      
      case 'recurrenceEndDate':
        if (formData.isRecurring && value) {
          const recurrenceEndDate = new Date(value);
          if (isNaN(recurrenceEndDate.getTime())) {
            return 'Please enter a valid recurrence end date';
          }
          if (formData.startTime) {
            const startDate = new Date(formData.startTime);
            if (recurrenceEndDate <= startDate) {
              return 'Recurrence end date must be after the start time';
            }
          }
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'doctorId' || name === 'startTime' || name === 'endTime') {
      setFormData({ ...formData, [name]: value });
      // Validate the field
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error || undefined });
      
      // If startTime changed, revalidate endTime
      if (name === 'startTime') {
        const endTimeError = validateField('endTime', formData.endTime);
        setErrors(prev => ({ ...prev, endTime: endTimeError || undefined }));
      }
    } else if (name === 'status') {
      setFormData({ ...formData, status: value as "available" | "booked" | "blocked" });
    } else if (name === 'isRecurring') {
      setFormData({ ...formData, isRecurring: (e.target as HTMLInputElement).checked });
    } else if (name === 'frequency') {
      setFormData({ 
        ...formData, 
        recurrenceDetails: { 
          ...formData.recurrenceDetails, 
          frequency: value as "daily" | "weekly" | "monthly" 
        }
      });
    }
  };

  const handleRecurrenceEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ 
      ...formData, 
      recurrenceDetails: { 
        ...formData.recurrenceDetails, 
        endDate: value 
      }
    });
    // Validate the recurrence end date
    const error = validateField('recurrenceEndDate', value);
    setErrors({ ...errors, recurrenceEndDate: error || undefined });
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const doctorIdError = validateField('doctorId', formData.doctorId);
    const startTimeError = validateField('startTime', formData.startTime);
    const endTimeError = validateField('endTime', formData.endTime);
    const recurrenceEndDateError = formData.isRecurring 
      ? validateField('recurrenceEndDate', formData.recurrenceDetails.endDate)
      : null;
    
    return !doctorIdError && !startTimeError && !endTimeError && !recurrenceEndDateError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors: any = {};
    validationErrors.doctorId = validateField('doctorId', formData.doctorId);
    validationErrors.startTime = validateField('startTime', formData.startTime);
    validationErrors.endTime = validateField('endTime', formData.endTime);
    if (formData.isRecurring) {
      validationErrors.recurrenceEndDate = validateField('recurrenceEndDate', formData.recurrenceDetails.endDate);
    }

    // Remove undefined values
    Object.keys(validationErrors).forEach(key => {
      if (!validationErrors[key]) delete validationErrors[key];
    });

    setErrors(validationErrors);

    // Check if form is valid
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Format end date properly for backend
    let formattedEndDate = undefined;
    if (formData.isRecurring && formData.recurrenceDetails.endDate) {
      // If endDate is in YYYY-MM-DD format, add time to make it a valid date
      const dateStr = formData.recurrenceDetails.endDate;
      if (dateStr.includes('T')) {
        // Already has time component
        formattedEndDate = new Date(dateStr).toISOString();
      } else {
        // Just date, add midnight time
        formattedEndDate = new Date(dateStr + 'T00:00:00').toISOString();
      }
    }

    const submitData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      recurrenceDetails: formData.isRecurring ? {
        frequency: formData.recurrenceDetails.frequency,
        endDate: formattedEndDate,
      } : undefined,
    };

    const finalData = slot 
      ? { id: slot._id, ...submitData }
      : submitData;

    onSubmit(finalData);
  };

  return (
    <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="slot-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                  errors.doctorId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                }`}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor?.specialty?.name || 'N/A'}
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.doctorId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "available" | "booked" | "blocked" })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                min={slot ? undefined : new Date().toISOString().slice(0, 16)}
                className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                  errors.startTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                }`}
                required
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                min={formData.startTime || (slot ? undefined : new Date().toISOString().slice(0, 16))}
                className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                  errors.endTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                }`}
                required
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Recurring Slot
            </label>
          </div>

          {formData.isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.recurrenceDetails.frequency}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="recurrence-end-date"
                    value={formData.recurrenceDetails.endDate || ""}
                    onChange={handleRecurrenceEndDateChange}
                    min={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    className={`w-full rounded-lg border bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                      errors.recurrenceEndDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                    }`}
                    style={{ 
                      cursor: 'pointer',
                      paddingRight: '2.5rem'
                    }}
                    onFocus={(e) => {
                      // Try to open the date picker when focused (for browsers that support showPicker)
                      const input = e.currentTarget;
                      if (input && 'showPicker' in input && typeof (input as any).showPicker === 'function') {
                        try {
                          (input as any).showPicker();
                        } catch (err) {
                          // showPicker might not be available or might fail, that's okay
                        }
                      }
                    }}
                  />
                  {errors.recurrenceEndDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.recurrenceEndDate}</p>
                  )}
                  <label 
                    htmlFor="recurrence-end-date"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 cursor-pointer pointer-events-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
              </div>
            </div>
          )}
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
              form="slot-form"
              disabled={!isFormValid()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isFormValid()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {slot ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
