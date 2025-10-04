// import PageBreadcrumb from "../components/common/PageBreadCrumb";
// import PageMeta from "../components/common/PageMeta";

export default function Slots() {
  return (
    <>
      {/* <PageMeta
        title="Appointment Slots Management | Prime Health"
        description="Manage appointment slots and scheduling for Prime Health system"
      />
      <PageBreadcrumb pageTitle="Slots" /> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Appointment Slots Management
          </h3>
          <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
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
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">156</p>
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
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">89</p>
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
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">67</p>
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
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">3</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search slots..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                <option>All Doctors</option>
                <option>Dr. Sarah Wilson</option>
                <option>Dr. Michael Chen</option>
                <option>Dr. Emily Rodriguez</option>
              </select>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                <option>All Status</option>
                <option>Available</option>
                <option>Booked</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                Today
              </button>
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                This Week
              </button>
              <button className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
                This Month
              </button>
            </div>
          </div>

          {/* Calendar View */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Today's Schedule</h4>
            </div>
            <div className="p-6">
              {/* Time Slots Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Morning Slots */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Morning (9:00 AM - 12:00 PM)</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">9:00 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">9:30 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">10:00 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">10:30 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">11:00 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">11:30 AM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-500/20 dark:text-red-400">
                        Cancelled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Afternoon (1:00 PM - 5:00 PM)</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">1:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">1:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">2:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">2:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">3:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">3:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evening Slots */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Evening (5:00 PM - 8:00 PM)</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">5:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">5:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Sarah Wilson</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">6:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">6:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Michael Chen</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">7:00 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-500/20 dark:text-green-400">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">7:30 PM</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emily Rodriguez</p>
                      </div>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                        Booked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emergency Slots */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency (24/7)</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">Emergency</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Emergency</p>
                      </div>
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-500/20 dark:text-red-400">
                        Always Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">Urgent Care</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Urgent</p>
                      </div>
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-500/20 dark:text-orange-400">
                        Limited Hours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
