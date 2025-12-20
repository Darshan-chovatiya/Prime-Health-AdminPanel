import { useState, useEffect } from "react";
import apiService, { Slot } from "../services/api";
import swal from '../utils/swalHelper';
import SlotModal from "../components/modals/SlotModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import { useDebounce } from '../hooks';

export default function Slots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Debounced values - only for filters since SearchInput handles search debouncing
  const debouncedStatusFilter = useDebounce(statusFilter, 300);
  const debouncedDoctorFilter = useDebounce(doctorFilter, 300);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedStatusFilter, debouncedDoctorFilter]);

  useEffect(() => {
    fetchSlots();
    fetchSlotStats();
    fetchDoctors();
  }, [currentPage, searchTerm, debouncedStatusFilter, debouncedDoctorFilter, limit]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSlots({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: debouncedStatusFilter === 'all' ? undefined : debouncedStatusFilter,
        doctorId: debouncedDoctorFilter === 'all' ? undefined : debouncedDoctorFilter,
      });

      if (response.status === 200 && response.data) {
        setSlots(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load slots');
      }
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      swal.error('Error', error.message || 'Failed to load slots');
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
    const result = await swal.confirm('Are you sure?', `Delete slot ${slotTime}?`);

    if (result.isConfirmed) {
      try {
        const response = await apiService.deleteSlot(slotId);
        if (response.status === 200) {
          swal.success('Deleted!', 'Slot has been deleted.');
          fetchSlots();
          fetchSlotStats();
        } else {
          throw new Error(response.message || 'Failed to delete slot');
        }
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to delete slot');
      }
    }
  };

  const handleCreateSlot = async (slotData: any) => {
    try {
      const response = await apiService.createSlot(slotData);
      if (response.status === 200) {
        swal.success('Success!', 'Slot created successfully.');
        setShowCreateModal(false);
        fetchSlots();
        fetchSlotStats();
      } else {
        throw new Error(response.message || 'Failed to create slot');
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to create slot');
    }
  };

  const handleUpdateSlot = async (slotData: any) => {
    try {
      const response = await apiService.updateSlot(slotData);
      if (response.status === 200) {
        swal.success('Success!', 'Slot updated successfully.');
        setEditingSlot(null);
        fetchSlots();
        fetchSlotStats();
      } else {
        throw new Error(response.message || 'Failed to update slot');
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update slot');
    }
  };

  const handleToggleStatus = async (slotId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
      await apiService.toggleSlotStatus(slotId, newStatus);
      swal.success('Success!', `Slot ${newStatus === 'available' ? 'activated' : 'blocked'} successfully.`);
      fetchSlots();
      fetchSlotStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update slot status');
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
            Appointment Slots Management
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
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
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search by doctor name..."
                value={searchTerm}
                onChange={setSearchTerm}
                debounceMs={500}
              />
              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white w-full sm:w-auto"
              >
                <option value="all">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>Dr. {doctor.name}</option>
                ))}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white w-full sm:w-auto"
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
                      console.log('Rendering slot:', slot);
                      console.log('doctors list:', doctors);
                      const doctor = doctors.find(d => d._id === slot?.doctorId?._id);
                      return (
                        <tr key={slot._id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doctor?.specialty?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                            {new Date(slot.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                            {new Date(slot.endTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium transition-colors duration-200 ${
                                slot.status === 'available' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 cursor-pointer hover:opacity-80'
                                  : slot.status === 'booked'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 cursor-pointer hover:opacity-80'
                              }`}
                              onClick={slot.status !== 'booked' ? () => handleToggleStatus(slot._id, slot.status) : undefined}
                              title={slot.status !== 'booked' ? `Click to ${slot.status === 'available' ? 'block' : 'activate'} slot` : 'Booked slot cannot be changed'}
                            >
                              {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {slot.isRecurring ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <ActionButton 
                                type="edit"
                                onClick={() => setEditingSlot(slot)}
                              />
                              <ActionButton 
                                type="delete"
                                onClick={() => handleDeleteSlot(slot._id, `${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}`)}
                              />
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