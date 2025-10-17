import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { DashboardStats } from "../../services/api";
import swal from '../../utils/swalHelper';

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        swal.error('Error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
        <div 
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/patients')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalPatients?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">Active</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Doctors */}
        <div 
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/doctors-labs')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Doctors</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalDoctors?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">Available</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div 
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/booking-history')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.todaysAppointments?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="ml-1 text-sm text-blue-600 dark:text-blue-400">
                  {stats?.availableSlotsToday || 0} available
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div 
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/booking-history')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                ${(stats?.monthlyRevenue || 0).toLocaleString()}
              </p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">This month</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
              <button 
                className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                onClick={() => navigate('/booking-history')}
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                stats.recentBookings.map((booking: any) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-500/20">
                        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.patientId?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.doctorId?.name || 'Unknown Doctor'} • {booking.serviceId?.name || 'Service'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(booking.appointmentDate).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No recent bookings</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions and Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                onClick={() => navigate('/patients')}
              >
                Add New Patient
              </button>
              <button 
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/slots')}
              >
                Schedule Appointment
              </button>
              <button 
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/booking-history')}
              >
                View Reports
              </button>
              <button 
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/doctors-labs')}
              >
                Manage Doctors
              </button>
            </div>
          </div>

          
        </div>
      </div>
    </>
  );
}
