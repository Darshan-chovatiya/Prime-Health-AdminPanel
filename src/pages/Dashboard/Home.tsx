import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import apiService, { DashboardStats, Doctor, Slot } from "../../services/api";
import swal from '../../utils/swalHelper';
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [barChartLoading, setBarChartLoading] = useState(false);
  const [pieChartLoading, setPieChartLoading] = useState(false);
  const [barChartPeriod, setBarChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [pieChartPeriod, setPieChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [recentDoctors, setRecentDoctors] = useState<Doctor[]>([]);
  const [recentSlots, setRecentSlots] = useState<Slot[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentDoctors();
    fetchRecentSlots();
  }, []);

  useEffect(() => {
    fetchBarChartData();
  }, [barChartPeriod]);

  useEffect(() => {
    fetchPieChartData();
  }, [pieChartPeriod]);

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

  const fetchBarChartData = async () => {
    try {
      setBarChartLoading(true);
      // Fetch comprehensive stats for bar chart
      const comprehensiveResponse = await apiService.getComprehensiveStats(barChartPeriod);
      setComprehensiveData(comprehensiveResponse.data);
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    } finally {
      setBarChartLoading(false);
    }
  };

  const fetchPieChartData = async () => {
    try {
      setPieChartLoading(true);
      // Fetch appointment stats for pie chart
      const appointmentResponse = await apiService.getAppointmentStats(pieChartPeriod);
      setAppointmentData(appointmentResponse.data);
    } catch (error) {
      console.error('Error fetching pie chart data:', error);
    } finally {
      setPieChartLoading(false);
    }
  };

  const fetchRecentDoctors = async () => {
    try {
      const response = await apiService.getDoctors({ 
        limit: 4, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (response.data && response.data.docs) {
        setRecentDoctors(response.data.docs);
      }
    } catch (error) {
      console.error('Error fetching recent doctors:', error);
    }
  };

  const fetchRecentSlots = async () => {
    try {
      const response = await apiService.getSlots({ 
        limit: 4, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (response.data && response.data.docs) {
        setRecentSlots(response.data.docs);
      }
    } catch (error) {
      console.error('Error fetching recent slots:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Prepare data for bar chart
  const prepareBarChartData = () => {
    // Get all unique dates from all data sources
    const appointmentDates = comprehensiveData?.dailyAppointments?.map((item: any) => item._id) || [];
    const patientDates = comprehensiveData?.dailyPatients?.map((item: any) => item._id) || [];
    const doctorDates = comprehensiveData?.dailyDoctors?.map((item: any) => item._id) || [];
    const slotDates = comprehensiveData?.dailySlots?.map((item: any) => item._id) || [];
    
    // Get all unique dates
    const allDates = [...new Set([...appointmentDates, ...patientDates, ...doctorDates, ...slotDates])].sort();
    
    const appointmentsData = allDates.map((date: string) => {
      const appointment = comprehensiveData?.dailyAppointments?.find((item: any) => item._id === date);
      return Number(appointment?.total) || 0;
    });

    const patientsData = allDates.map((date: string) => {
      const patient = comprehensiveData?.dailyPatients?.find((item: any) => item._id === date);
      return Number(patient?.count) || 0;
    });

    const doctorsData = allDates.map((date: string) => {
      const doctor = comprehensiveData?.dailyDoctors?.find((item: any) => item._id === date);
      return Number(doctor?.count) || 0;
    });

    const slotsData = allDates.map((date: string) => {
      const slot = comprehensiveData?.dailySlots?.find((item: any) => item._id === date);
      return Number(slot?.total) || 0;
    });

    // Format categories based on selected period
    const formatCategory = (date: string) => {
      const dateObj = new Date(date);
      if (barChartPeriod === 'year') {
        // Show year only: 2024, 2025, 2026
        return dateObj.getFullYear().toString();
      } else if (barChartPeriod === 'month') {
        // Show month name only: Sep, Oct, Nov
        return dateObj.toLocaleDateString('en-US', { month: 'short' });
      } else {
        // Week: Show day and date
        return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    };

    // Group data by period for year and month
    if (barChartPeriod === 'year') {
      const groupedData: { [key: string]: { appointments: number; patients: number; doctors: number; slots: number } } = {};
      
      allDates.forEach((date: string, index: number) => {
        const year = new Date(date).getFullYear().toString();
        if (!groupedData[year]) {
          groupedData[year] = { appointments: 0, patients: 0, doctors: 0, slots: 0 };
        }
        groupedData[year].appointments += appointmentsData[index];
        groupedData[year].patients += patientsData[index];
        groupedData[year].doctors += doctorsData[index];
        groupedData[year].slots += slotsData[index];
      });

      const sortedYears = Object.keys(groupedData).sort();
      return {
        categories: sortedYears,
        appointments: sortedYears.map(year => groupedData[year].appointments),
        patients: sortedYears.map(year => groupedData[year].patients),
        doctors: sortedYears.map(year => groupedData[year].doctors),
        slots: sortedYears.map(year => groupedData[year].slots),
      };
    } else if (barChartPeriod === 'month') {
      const groupedData: { [key: string]: { appointments: number; patients: number; doctors: number; slots: number } } = {};
      
      allDates.forEach((date: string, index: number) => {
        const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
        if (!groupedData[month]) {
          groupedData[month] = { appointments: 0, patients: 0, doctors: 0, slots: 0 };
        }
        groupedData[month].appointments += appointmentsData[index];
        groupedData[month].patients += patientsData[index];
        groupedData[month].doctors += doctorsData[index];
        groupedData[month].slots += slotsData[index];
      });

      // Sort months in chronological order
      const monthOrder: { [key: string]: number } = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      const sortedMonths = Object.keys(groupedData).sort((a, b) => monthOrder[a] - monthOrder[b]);
      
      return {
        categories: sortedMonths,
        appointments: sortedMonths.map(month => groupedData[month].appointments),
        patients: sortedMonths.map(month => groupedData[month].patients),
        doctors: sortedMonths.map(month => groupedData[month].doctors),
        slots: sortedMonths.map(month => groupedData[month].slots),
      };
    } else {
      // Week: show daily data
      return {
        categories: allDates.map((date: string) => formatCategory(date)),
        appointments: appointmentsData,
        patients: patientsData,
        doctors: doctorsData,
        slots: slotsData,
      };
    }
  };

  const chartData = prepareBarChartData();

  // Calculate max value for y-axis and create ticks in increments of 2
  const getAllValues = () => {
    return [...chartData.appointments, ...chartData.patients, ...chartData.doctors, ...chartData.slots];
  };
  
  const maxValue = Math.max(...getAllValues(), 0);
  const maxTick = Math.ceil(maxValue / 2) * 2; // Round up to nearest even number
  const ticks = [];
  for (let i = 0; i <= maxTick; i += 2) {
    ticks.push(i);
  }

  // Comprehensive Dashboard Bar Chart Configuration
  const dashboardBarChartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 450,
      toolbar: { show: false },
    },
    colors: ["#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return val.toString();
      },
      offsetY: -20,
      style: {
        fontSize: "11px",
        colors: ["#6B7280"],
        fontWeight: 500,
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
      },
    },
    yaxis: {
      title: {
        text: "Count",
        style: { fontSize: "12px", color: "#6B7280" },
      },
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
        formatter: function(val: number) {
          // Only show even numbers (0, 2, 4, 6, 8, etc.)
          return val % 2 === 0 ? val.toString() : '';
        },
      },
      min: 0,
      max: Math.max(maxTick || 8, 8),
      tickAmount: Math.max(Math.floor(maxTick / 2), 4),
      forceNiceScale: false,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (val: number) => `${val} appointments`,
        },
        {
          formatter: (val: number) => `${val} patients`,
        },
        {
          formatter: (val: number) => `${val} doctors`,
        },
        {
          formatter: (val: number) => `${val} slots`,
        },
      ],
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "13px",
    },
  };

  const dashboardBarChartSeries = [
    {
      name: "Total Appointments",
      data: chartData.appointments,
    },
    {
      name: "Total Patients",
      data: chartData.patients,
    },
    {
      name: "Total Doctors",
      data: chartData.doctors,
    },
    {
      name: "Total Slots",
      data: chartData.slots,
    },
  ];

  // Calculate pie chart data
  const statusChartSeries = appointmentData?.statusBreakdown?.map((item: any) => Number(item.count) || 0) || [];
  const totalAppointments = statusChartSeries.reduce((sum: number, val: number) => sum + val, 0);

  // Status Breakdown Pie Chart
  const statusChartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 350,
    },
    colors: ["#60a5fa", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#22d3ee"],
    labels: appointmentData?.statusBreakdown?.map((item: any) => 
      item._id.charAt(0).toUpperCase() + item._id.slice(1)
    ) || [],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: (val: number) => `${val} appointments`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { show: true, fontSize: "14px" },
            value: { show: true, fontSize: "16px", fontWeight: 600 },
            total: {
              show: true,
              label: "Total Appointments",
              formatter: () => {
                return totalAppointments.toString();
              },
            },
          },
        },
      },
    },
  };


  return (
    <>
      {/* Period Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your practice today.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Patients */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/patients')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalPatients?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">Active</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Available Today */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/doctors-labs')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Today</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.availableToday?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                  {stats?.activeDoctors || 0} Active Doctors
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/booking-history')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.todaysAppointments?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                  {stats?.availableSlotsToday || 0} available
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/booking-history')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalBookings?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">All time</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Categories */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/categories')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categories</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalCategories?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">Services</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Doctors */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/doctors-labs')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Doctors</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalDoctors?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                  {stats?.activeDoctors || 0} Active
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Available Slots Today */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/slots')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Slots</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.availableSlotsToday?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">Today</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Slots */}
        <div 
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]"
          onClick={() => navigate('/slots')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Slots</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalSlots?.toLocaleString() || '0'}
              </p>
              <div className="mt-1 flex items-center">
                <svg className="h-3 w-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">All time</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 ml-2 flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Comprehensive Dashboard Bar Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comprehensive view for {barChartPeriod.charAt(0).toUpperCase() + barChartPeriod.slice(1)}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={barChartPeriod}
                onChange={(e) => setBarChartPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
          {barChartLoading ? (
            <div className="flex h-[450px] items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : comprehensiveData && chartData.categories.length > 0 && (chartData.appointments.some((v: number) => v > 0) || chartData.patients.some((v: number) => v > 0) || chartData.doctors.some((v: number) => v > 0) || chartData.slots.some((v: number) => v > 0)) ? (
            <Chart 
              options={{...dashboardBarChartOptions, xaxis: {...dashboardBarChartOptions.xaxis, categories: chartData.categories}}} 
              series={dashboardBarChartSeries} 
              type="bar" 
              height={450} 
            />
          ) : (
            <div className="flex h-[450px] items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No dashboard data available</p>
                <p className="text-xs mt-1">Data will appear here once activities are recorded</p>
              </div>
            </div>
          )}
        </div>

        {/* Appointment Status Pie Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Breakdown by status for {pieChartPeriod.charAt(0).toUpperCase() + pieChartPeriod.slice(1)}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={pieChartPeriod}
                onChange={(e) => setPieChartPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
          {pieChartLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : statusChartSeries.length > 0 && statusChartSeries.some((val: number) => val > 0) ? (
            <Chart 
              options={statusChartOptions} 
              series={statusChartSeries} 
              type="donut" 
              height={400} 
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p>No status data available</p>
                <p className="text-xs mt-1">Status breakdown will appear here once appointments are made</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Doctors */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Doctors</h3>
            <button 
              className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
              onClick={() => navigate('/doctors-labs')}
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentDoctors.length > 0 ? (
              recentDoctors.map((doctor) => (
                <div key={doctor._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-500/20">
                      {doctor.profileImage ? (
                        <>
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={doctor.profileImage} 
                            alt={doctor.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </>
                      ) : (
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typeof doctor.specialty === 'object' && doctor.specialty?.name 
                          ? doctor.specialty.name 
                          : typeof doctor.specialty === 'string' ? doctor.specialty : 'N/A'} • {doctor.email || doctor.mobileNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      doctor.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No recent doctors</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Slots */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Slots</h3>
            <button 
              className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
              onClick={() => navigate('/slots')}
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentSlots.length > 0 ? (
              recentSlots.map((slot) => (
                <div key={slot._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center dark:bg-teal-500/20">
                      <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typeof slot.doctorId === 'object' && slot.doctorId?.name 
                          ? (slot.doctorId.name.startsWith('Dr.') ? slot.doctorId.name : `Dr. ${slot.doctorId.name}`)
                          : 'N/A'} • {new Date(slot.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      slot.status === 'available'
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : slot.status === 'booked'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No recent slots</p>
              </div>
            )}
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

          {/* Summary Stats */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Appointment Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Appointments</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {appointmentData?.statusBreakdown?.reduce((sum: number, item: any) => sum + (Number(item.count) || 0), 0) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {Number(appointmentData?.statusBreakdown?.find((s: any) => s._id === 'completed')?.count) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {Number(appointmentData?.statusBreakdown?.find((s: any) => s._id === 'scheduled')?.count) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {Number(appointmentData?.statusBreakdown?.find((s: any) => s._id === 'cancelled')?.count) || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}