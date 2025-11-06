import { useState, useEffect } from "react";
import apiService, { Doctor } from "../services/api";
import swal from '../utils/swalHelper';
import DoctorModal from "../components/modals/DoctorModal";
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';

export default function DoctorsLabs() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);

  // const [activeTab, setActiveTab] = useState<"doctors" | "labs">("doctors");

  useEffect(() => {
    fetchDoctors();
    fetchDoctorStats();
  }, [currentPage, searchTerm, specialtyFilter, statusFilter, limit]);
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await apiService.getCategoriesByService({
          limit: 100,
        });
        setSpecialties(response.data.docs);
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      }
    };
    fetchSpecialties();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDoctors({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        specialty: specialtyFilter === "all" ? undefined : specialtyFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response.data && response.data.docs) {
        setDoctors(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      swal.error("Error", "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorStats = async () => {
    try {
      const response = await apiService.getDoctorStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
    }
  };

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    const result = await swal.confirm("Are you sure?", `Delete doctor ${doctorName}?`);

    if (result.isConfirmed) {
      try {
        await apiService.deleteDoctor(doctorId);
        swal.success("Deleted!", "Doctor has been deleted.");
        fetchDoctors();
        fetchDoctorStats();
      } catch (error: any) {
        swal.error("Error", error.message || "Failed to delete doctor");
      }
    }
  };

  const handleApproveDoctor = async (doctorId: string, doctorName: string) => {
    const result = await swal.confirm("Approve Doctor", `Approve ${doctorName}?`, "Yes, approve!");

    if (result.isConfirmed) {
      try {
        await apiService.approveDoctor(doctorId);
        swal.success("Approved!", "Doctor has been approved.");
        fetchDoctors();
        fetchDoctorStats();
      } catch (error: any) {
        swal.error("Error", error.message || "Failed to approve doctor");
      }
    }
  };

  const handleRejectDoctor = async (doctorId: string, doctorName: string) => {
    const { value: reason } = await swal.fire({
      title: "Reject Doctor",
      text: `Reject ${doctorName}?`,
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter reason for rejection...",
      inputValidator: (value: string) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      position: 'center' // Keep input dialogs centered
    });

    if (reason) {
      try {
        await apiService.rejectDoctor(doctorId, reason);
        swal.success("Rejected!", "Doctor has been rejected.");
        fetchDoctors();
        fetchDoctorStats();
      } catch (error: any) {
        swal.error("Error", error.message || "Failed to reject doctor");
      }
    }
  };

  const handleCreateDoctor = async (doctorData: any) => {
    try {
      await apiService.createDoctor(doctorData);
      swal.success("Success!", "Doctor created successfully.");
      setShowCreateModal(false);
      fetchDoctors();
      fetchDoctorStats();
    } catch (error: any) {
      swal.error("Error", error.message || "Failed to create doctor");
    }
  };

  const handleUpdateDoctor = async (doctorData: any) => {
    try {
      await apiService.updateDoctor(doctorData);
      swal.success("Success!", "Doctor updated successfully.");
      setEditingDoctor(null);
      fetchDoctors();
      fetchDoctorStats();
    } catch (error: any) {
      swal.error("Error", error.message || "Failed to update doctor");
    }
  };

  const handleToggleStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      await apiService.toggleDoctorStatus(doctorId, !currentStatus);
      swal.success('Success!', `Doctor ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchDoctors();
      fetchDoctorStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update doctor status');
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
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Doctors & Labs Management
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Add New Doctor
          </button>
        </div>

        <div className="space-y-6">
          {/* Doctor Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Doctors
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalDoctors?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Active Doctors
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.activeDoctors?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Available Today
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.availableToday?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <SearchInput
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"

              >
                <option value="all">All Specialties</option>
                {specialties.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Doctors
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Specialty
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      License
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <tr key={doctor._id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {doctor.profileImage ? (
                                <>
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={doctor.profileImage}
                                    alt="Doctor"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hidden">
                                    <svg
                                      className="h-5 w-5 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                  </div>
                                </>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <svg
                                    className="h-5 w-5 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                Dr. {doctor.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {doctor.email || doctor.mobileNo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                          {doctor.specialty?.name || "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {doctor.license}
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                              doctor.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                            }`}
                            onClick={() => handleToggleStatus(doctor._id, doctor.isActive)}
                            title={`Click to ${doctor.isActive ? 'deactivate' : 'activate'} doctor`}
                          >
                            {doctor.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <ActionButton
                              type="edit"
                              onClick={() => setEditingDoctor(doctor)}
                            />
                            {!doctor.isActive && (
                              <>
                                <ActionButton
                                  type="approve"
                                  onClick={() =>
                                    handleApproveDoctor(doctor._id, doctor.name)
                                  }
                                />
                                <ActionButton
                                  type="reject"
                                  onClick={() =>
                                    handleRejectDoctor(doctor._id, doctor.name)
                                  }
                                />
                              </>
                            )}
                            <ActionButton
                              type="delete"
                              onClick={() =>
                                handleDeleteDoctor(doctor._id, doctor.name)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No doctors found
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

      {/* Create Doctor Modal */}
      {showCreateModal && (
        <DoctorModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDoctor}
          title="Create New Doctor"
        />
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <DoctorModal
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSubmit={handleUpdateDoctor}
          title="Edit Doctor"
        />
      )}
    </>
  );
}
