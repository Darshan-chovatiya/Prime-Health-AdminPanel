import { useState, useEffect } from "react";
import apiService, { Slot } from "../services/api";
import Swal from 'sweetalert2';
import SlotModal from "../components/modals/SlotModal";

export default function Slots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    // Reset page to 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, doctorFilter]);

  useEffect(() => {
    fetchSlots();
    fetchSlotStats();
    fetchDoctors();
  }, [currentPage, searchTerm, statusFilter, doctorFilter]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSlots({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === 'all' ? undefined : doctorFilter,
      });

      if (response.status === 200 && response.data) {
        setSlots(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error(response.message || 'Failed to load slots');
      }
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load slots',
      });
      setSlots([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotStats = async () => {
    try {
      const response = await apiService.getSlotStats();
      if (response.status === 200 && response.data) {
        setStats({
          totalSlotsToday: response.data.totalSlotsToday,
          availableSlots: response.data.availableSlotsToday, // Fixed key name
          bookedSlots: response.data.bookedSlotsToday, // Fixed key name
          cancelledToday: response.data.cancelledSlotsToday // Fixed key name
        });
      }
    } catch (error) {
      console.error('Error fetching slot stats:', error);
      setStats(null);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiService.getDoctors({ limit: 100 });
      if (response.status === 200 && response.data?.docs) {
        setDoctors(response.data.docs);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const handleDeleteSlot = async (slotId: string, slotTime: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete slot ${slotTime}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await apiService.deleteSlot(slotId);
        if (response.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Slot has been deleted.',
          });
          fetchSlots();
          fetchSlotStats();
        } else {
          throw new Error(response.message || 'Failed to delete slot');
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete slot',
        });
      }
    }
  };

  const handleCreateSlot = async (slotData: any) => {
    try {
      const response = await apiService.createSlot(slotData);
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Slot created successfully.',
        });
        setShowCreateModal(false);
        fetchSlots();
        fetchSlotStats();
      } else {
        throw new Error(response.message || 'Failed to create slot');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to create slot',
      });
    }
  };

  const handleUpdateSlot = async (slotData: any) => {
    try {
      const response = await apiService.updateSlot(slotData);
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Slot updated successfully.',
        });
        setEditingSlot(null);
        fetchSlots();
        fetchSlotStats();
      } else {
        throw new Error(response.message || 'Failed to update slot');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update slot',
      });
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
            Appointment Slots Management
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Create New Slot
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Slots Today</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalSlotsToday?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available Slots</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.availableSlots?.toLocaleString() || '0'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Booked Slots</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.bookedSlots?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled Today</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.cancelledToday?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by doctor name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>Dr. {doctor.name}</option>
                ))}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Slots Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Appointment Slots</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">End Time</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Recurring</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {slots.length > 0 ? (
                    slots.map((slot) => {
                      const doctor = doctors.find(d => d._id === slot.doctorId?._id || slot.doctorId);
                      return (
                        <tr key={slot._id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doctor?.specialty || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                            {new Date(slot.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                            {new Date(slot.endTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              slot.status === 'available' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : slot.status === 'booked'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                            }`}>
                              {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {slot.isRecurring ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingSlot(slot)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteSlot(slot._id, `${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}`)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No slots found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Slot Modal */}
      {showCreateModal && (
        <SlotModal
          doctors={doctors}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSlot}
          title="Create New Slot"
        />
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <SlotModal
          slot={editingSlot}
          doctors={doctors}
          onClose={() => setEditingSlot(null)}
          onSubmit={handleUpdateSlot}
          title="Edit Slot"
        />
      )}
    </>
  );
}