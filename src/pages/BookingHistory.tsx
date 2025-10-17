import { useState, useEffect } from "react";
import apiService, { Booking } from "../services/api";
import swal from '../utils/swalHelper';
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchBookingStats();
    fetchDoctors();
    fetchPatients();
  }, [currentPage, searchTerm, statusFilter, doctorFilter, patientFilter, limit]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBookings({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
        doctorId: doctorFilter === 'all' ? undefined : doctorFilter,
        patientId: patientFilter === 'all' ? undefined : patientFilter,
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

  const fetchDoctors = async () => {
    try {
      const response = await apiService.getDoctors({ limit: 100 });
      if (response.data && response.data.docs) {
        setDoctors(response.data.docs);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiService.getPatients({ limit: 100 });
      if (response.data && response.data.docs) {
        setPatients(response.data.docs);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
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
        doctorId: doctorFilter === 'all' ? undefined : doctorFilter,
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
            Booking History
          </h3>
          <div className="flex space-x-3">
            <button 
              onClick={exportBookings}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Export Data
            </button>
            <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
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
            <div className="flex flex-1 items-center gap-4">
              <SearchInput
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
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
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Patients</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>{patient.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Booking History Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Bookings</h4>
            </div>
            <div className="overflow-x-auto">
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
                      const doctor = doctors.find(d => d._id === booking.doctorId);
                      const patient = patients.find(p => p._id === booking.patientId);
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
                                  <img className="h-8 w-8 rounded-full" src={patient.profileImage} alt="Patient" />
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
                              {doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doctor?.specialty || 'N/A'}
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
                              {booking.serviceId?.name || 'General Consultation'}
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
                                onClick={() => {}} // Add view functionality here
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
    </>
  );
}
