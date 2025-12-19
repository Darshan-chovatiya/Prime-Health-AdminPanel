import { useState, useEffect } from "react";
import { Slot } from "../../services/api";
import swal from "../../utils/swalHelper";

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

  useEffect(() => {
    if (slot) {
      setFormData({
        doctorId: slot.doctorId,
        startTime: new Date(slot.startTime).toISOString().slice(0, 16),
        endTime: new Date(slot.endTime).toISOString().slice(0, 16),
        status: slot.status,
        isRecurring: slot.isRecurring,
        recurrenceDetails: slot.recurrenceDetails || {
          frequency: "daily",
          endDate: "",
        },
      });
    }
  }, [slot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctorId || !formData.startTime || !formData.endTime) {
      swal.error("Validation Error", "Please fill in all required fields");
      return;
    }

    // Parse dates and validate
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      swal.error("Invalid Date", "Please enter valid start and end times");
      return;
    }

    // Check if end time is after start time
    if (startDate >= endDate) {
      swal.error("Invalid Time Range", "End time must be after start time");
      return;
    }

    // Check if start time is in the future (only for new slots, not when editing)
    if (!slot) {
      const now = new Date();
      if (startDate <= now) {
        swal.error("Invalid Start Time", "Start time must be in the future");
        return;
      }
    }

    // Validate recurring slot end date if recurring is enabled
    if (formData.isRecurring && formData.recurrenceDetails.endDate) {
      const recurrenceEndDate = new Date(formData.recurrenceDetails.endDate);
      if (isNaN(recurrenceEndDate.getTime())) {
        swal.error("Invalid Recurrence End Date", "Please enter a valid recurrence end date");
        return;
      }
      if (recurrenceEndDate <= startDate) {
        swal.error("Invalid Recurrence End Date", "Recurrence end date must be after the start time");
        return;
      }
    }

    const submitData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      recurrenceDetails: formData.isRecurring ? {
        ...formData.recurrenceDetails,
        endDate: formData.recurrenceDetails.endDate ? new Date(formData.recurrenceDetails.endDate).toISOString() : undefined,
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
                Doctor *
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor?.specialty?.name || 'N/A'}
                  </option>
                ))}
              </select>
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
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                min={slot ? undefined : new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                min={formData.startTime || (slot ? undefined : new Date().toISOString().slice(0, 16))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
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
                  value={formData.recurrenceDetails.frequency}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recurrenceDetails: { 
                      ...formData.recurrenceDetails, 
                      frequency: e.target.value as "daily" | "weekly" | "monthly" 
                    }
                  })}
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
                <input
                  type="date"
                  value={formData.recurrenceDetails.endDate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recurrenceDetails: { 
                      ...formData.recurrenceDetails, 
                      endDate: e.target.value 
                    }
                  })}
                  min={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
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
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {slot ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
