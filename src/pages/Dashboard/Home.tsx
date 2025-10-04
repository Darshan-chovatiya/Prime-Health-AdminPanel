// import PageMeta from "../../components/common/PageMeta";
// import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function Home() {
  return (
    <>
      {/* <PageMeta
        title="Dashboard | Prime Health"
        description="Prime Health Admin Dashboard - Comprehensive healthcare management overview"
      />
      <PageBreadcrumb pageTitle="Dashboard" /> */}
      
      {/* Welcome Section */}
      {/* <div className="mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white dark:from-brand-600 dark:to-brand-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
              <p className="mt-2 text-brand-100">Here's what's happening at Prime Health today.</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-sm text-brand-100">Current Time</p>
                <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
                <p className="text-sm text-brand-100">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">2,847</p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">+12.5%</span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">from last month</span>
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
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Doctors</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">48</p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">+3</span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">this week</span>
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
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">156</p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="ml-1 text-sm text-blue-600 dark:text-blue-400">89 available</span>
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
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">$124.5K</p>
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-sm text-green-600 dark:text-green-400">+8.2%</span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">from last month</span>
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
        {/* Left Column - Charts and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointments Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointments Overview</h3>
              <div className="flex space-x-2">
                <button className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white">7 Days</button>
                <button className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">30 Days</button>
                <button className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">90 Days</button>
              </div>
            </div>
            <div className="h-80">
              {/* Chart Placeholder */}
              <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Chart visualization will be here</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions and Stats */}
        <div className="space-y-6">
          {/* Department Stats */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Department Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Cardiology</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Neurology</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Orthopedics</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">15</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Dermatology</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Pediatrics</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">14</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Emergency</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">18</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
