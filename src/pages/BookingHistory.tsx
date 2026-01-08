import { useState, useEffect, useRef } from "react";
import apiService, { Booking, Patient, Doctor } from "../services/api";
import swal from '../utils/swalHelper';
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import FilterDropdown from '../components/ui/FilterDropdown';

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetchBookingStats();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, statusFilter, limit]);

  const fetchBookings = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      } else {
        setTableLoading(true);
      }
      const response = await apiService.getBookings({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.data && response.data.docs) {
        setBookings(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      swal.error('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const response = await apiService.getBookingStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  };


  const handleCancelBooking = async (bookingId: string, patientName: string) => {
    const { value: reason } = await swal.fire({
      title: 'Cancel Booking',
      text: `Cancel booking for ${patientName}?`,
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Enter reason for cancellation...',
      inputValidator: (value: string) => {
        if (!value) {
          return 'You need to provide a reason!'
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Cancel Booking',
      cancelButtonText: 'Keep Booking',
      position: 'center' // Keep input dialogs centered
    });

    if (reason) {
      try {
        await apiService.cancelBooking(bookingId, reason);
        swal.success('Cancelled!', 'Booking has been cancelled.');
        fetchBookings();
        fetchBookingStats();
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to cancel booking');
      }
    }
  };

  const handleRescheduleBooking = async (bookingId: string, patientName: string) => {
    const { value: newSlotId } = await swal.fire({
      title: 'Reschedule Booking',
      text: `Reschedule booking for ${patientName}?`,
      input: 'text',
      inputLabel: 'New Slot ID',
      inputPlaceholder: 'Enter new slot ID...',
      inputValidator: (value: string) => {
        if (!value) {
          return 'You need to provide a new slot ID!'
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Reschedule',
      cancelButtonText: 'Cancel',
      position: 'center' // Keep input dialogs centered
    });

    if (newSlotId) {
      try {
        await apiService.rescheduleBooking(bookingId, newSlotId, 'Admin rescheduled');
        swal.success('Rescheduled!', 'Booking has been rescheduled.');
        fetchBookings();
        fetchBookingStats();
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to reschedule booking');
      }
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const exportBookings = async () => {
    try {
      const blob = await apiService.exportBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      swal.success('Exported!', 'Bookings exported successfully.');
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to export bookings');
    }
  };

  const generateReport = async () => {
    try {
      // Get date range for the report (last 30 days by default)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Use exportBookings endpoint which generates proper Excel files
      const blob = await apiService.exportBookings({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      // Create download link with Excel extension
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `booking-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      swal.success('Report Generated!', 'Your booking report has been generated and downloaded successfully.');
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to generate report. Please try again.');
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Booking History
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={exportBookings}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
            >
              Export Data
            </button>
            <button 
              onClick={generateReport}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
            >
              Generate Report
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalBookings?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.completedBookings?.toLocaleString() || '0'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.cancelledBookings?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No Show</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.noShowBookings?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                  <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.57-.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <FilterDropdown
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'no-show', label: 'No Show' },
                  { value: 'rescheduled', label: 'Rescheduled' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Booking History Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Bookings</h4>
            </div>
            {tableLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}
            <div className={`overflow-x-auto ${tableLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => {
                      // Handle populated data from backend
                      const patient: Patient | undefined = typeof booking.patientId === 'object' && booking.patientId !== null 
                        ? booking.patientId as Patient 
                        : undefined;
                      
                      const doctor: Doctor | undefined = typeof booking.doctorId === 'object' && booking.doctorId !== null
                        ? booking.doctorId as Doctor
                        : undefined;
                      
                      const service = typeof booking.serviceId === 'object' && booking.serviceId !== null
                        ? booking.serviceId
                        : null;

                      return (
                        <tr key={booking._id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                              #{booking.bookingId || booking._id.slice(-6).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0">
                                {patient?.profileImage ? (
                                  <>
                                    <img 
                                      className="h-8 w-8 rounded-full" 
                                      src={patient.profileImage} 
                                      alt="Patient"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hidden">
                                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                  {patient?.name || 'Unknown Patient'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {patient?.email || patient?.mobileNo || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {doctor ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Unknown Doctor'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {typeof doctor?.specialty === 'object' && doctor?.specialty?.name 
                                ? doctor.specialty.name 
                                : typeof doctor?.specialty === 'string' 
                                  ? doctor.specialty 
                                  : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {new Date(booking.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.appointmentTime}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800 dark:text-white/90">
                              {service?.name || 'General Consultation'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              booking.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                                : booking.status === 'no-show'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                : booking.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <ActionButton 
                                type="view"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsModalOpen(true);
                                }}
                              />
                              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                <>
                                  <ActionButton 
                                    type="reschedule"
                                    onClick={() => handleRescheduleBooking(booking._id, patient?.name || 'Patient')}
                                  />
                                  <ActionButton 
                                    type="cancel"
                                    onClick={() => handleCancelBooking(booking._id, patient?.name || 'Patient')}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No bookings found
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

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Booking Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
                {/* Patient Header */}
                <div className="flex items-center space-x-4">
                  {typeof selectedBooking.patientId === 'object' && selectedBooking.patientId !== null ? (
                    <>
                      {selectedBooking.patientId.profileImage ? (
                        <>
                          <img 
                            className="h-16 w-16 rounded-full" 
                            src={selectedBooking.patientId.profileImage} 
                            alt="Patient"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hidden">
                            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedBooking.patientId.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedBooking.patientId.email || selectedBooking.patientId.mobileNo}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">Patient information not available</div>
                  )}
                </div>

                {/* Booking Status */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    selectedBooking.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                      : selectedBooking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                      : selectedBooking.status === 'no-show'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                      : selectedBooking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
                  }`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>

                {/* Doctor Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor Information</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {typeof selectedBooking.doctorId === 'object' && selectedBooking.doctorId !== null ? (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedBooking.doctorId.name.startsWith('Dr.') ? selectedBooking.doctorId.name : `Dr. ${selectedBooking.doctorId.name}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedBooking.doctorId.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {typeof selectedBooking.doctorId.specialty === 'object' && selectedBooking.doctorId.specialty?.name 
                            ? selectedBooking.doctorId.specialty.name 
                            : selectedBooking.doctorId.specialty || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Doctor information not available</p>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Details</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Booking ID: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        #{selectedBooking.bookingId || selectedBooking._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedBooking.appointmentDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedBooking.appointmentTime}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Consultation Type: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedBooking.consultationType}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Service: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof selectedBooking.serviceId === 'object' && selectedBooking.serviceId !== null
                          ? selectedBooking.serviceId.name
                          : 'General Consultation'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Details</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Amount: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{typeof selectedBooking.amount === 'string' ? selectedBooking.amount : selectedBooking.amount}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status: </span>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        selectedBooking.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          : selectedBooking.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedBooking.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {(selectedBooking.notes || selectedBooking.prescription || selectedBooking.diagnosis) && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical Information</h5>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-3">
                      {selectedBooking.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.notes}</p>
                        </div>
                      )}
                      {selectedBooking.diagnosis && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.diagnosis}</p>
                        </div>
                      )}
                      {selectedBooking.prescription && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prescription</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedBooking.prescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Information</h5>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Follow-up Required: </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedBooking.followUpRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {selectedBooking.followUpDate && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Follow-up Date: </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedBooking.followUpDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.cancellationReason && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cancellation Reason</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.cancellationReason}</p>
                      </div>
                    )}
                    {selectedBooking.cancelledBy && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled By: </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedBooking.cancelledBy}</span>
                      </div>
                    )}
                    {selectedBooking.rating && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rating: </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {typeof selectedBooking.rating === 'string' ? selectedBooking.rating : selectedBooking.rating}/5
                        </span>
                      </div>
                    )}
                    {selectedBooking.review && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.review}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(selectedBooking.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {new Date(selectedBooking.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button
                onClick={() => setIsModalOpen(false)}
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
