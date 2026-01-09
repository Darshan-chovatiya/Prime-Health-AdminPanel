// export const API_BASE_URL = 'http://localhost:3300/api/admin';
export const API_BASE_URL = "https://primehealth.itfuturz.in/api/admin";
// export const API_BASE_URL = 'https://t9hr21z3-3200.inc1.devtunnels.ms/api/admin';

// Types
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  profileImage?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  name: string;
  email?: string;
  mobileNo: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    mobileNo: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosis: string;
    treatment: string;
    date: string;
  }>;
  allergies: string[];
  bloodGroup?: string;
  profileImage?: string;
  isActive: boolean;
  lastVisit?: string;
  totalVisits: number;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  service: string | { _id: string; name: string; description: string };
  isActive: boolean;
  sortOrder: number;
  servicesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  category?: string | null;
  description: string;
  isActive?: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  _id: string;
  name: string;
  email?: string;
  mobileNo: string;
  license: string;
  specialty: {
    _id: string;
    name: string;
    description?: string;
  };
  bio?: string;
  services?: {
    _id: string;
    name: string;
    description?: string;
  };
  certifications?: Array<{
    name: string;
    document?: string;
    issuedBy: string;
    issueDate: string;
  }>;
  pricing: {
    consultationFee: number;
    followUpFee?: number;
  };
  machineId?: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

export interface Slot {
  _id: string;
  doctorId: any;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "blocked";
  isRecurring: boolean;
  recurrenceDetails?: {
    frequency: "daily" | "weekly" | "monthly";
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  bookingId?: string;
  patientId: string | Patient;
  doctorId: string | Doctor | any;
  slotId: string | null;
  serviceId: string | Service | any;
  appointmentDate: string;
  appointmentTime: string;
  status:
    | "scheduled"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no-show"
    | "rescheduled";
  consultationType: "in-person" | "video" | "phone";
  notes?: string;
  prescription?: string;
  diagnosis?: string;
  followUpRequired: boolean;
  followUpDate?: string | null;
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  amount: number | string;
  paymentMethod: "cash" | "card" | "online" | "insurance";
  cancellationReason?: string;
  cancelledBy?: "patient" | "doctor" | "admin" | null;
  cancelledAt?: string | null;
  rating?: number | string;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  activeDoctors: number;
  availableToday: number;
  todaysAppointments: number;
  availableSlotsToday: number;
  monthlyRevenue: number;
  totalBookings: number;
  totalCategories: number;
  totalSlots: number;
  recentBookings: Booking[];
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  // Get base URL (without /api/admin) for image URLs
  getBaseUrl(): string {
    return API_BASE_URL.replace("/api/admin", "");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend (Joi validation errors)
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map((err: any) => {
              // Handle both { message: string } and { path: string, message: string } formats
              return (
                err.message ||
                `${err.path || "Field"}: ${err.message || "Invalid value"}`
              );
            })
            .join(", ");
          throw new Error(errorMessages);
        }
        // Extract error message from backend response
        // Backend returns: { status: number, message: string, data: any }
        const errorMessage =
          data.message ||
          data.Message ||
          `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        // Store original error data for debugging
        (error as any).originalError = data;
        (error as any).statusCode = response.status;
        throw error;
      }

      // Check if response indicates failure even with 200 status
      if (data.status && data.status !== 200 && data.message) {
        throw new Error(data.message);
      }

      return data;
    } catch (error: any) {
      console.error("API Request failed:", error);
      // If it's already an Error object with message, re-throw it
      if (error instanceof Error) {
        // Make sure the error message is not generic "Request failed"
        if (
          error.message &&
          error.message !== "Request failed" &&
          !error.message.includes("Request failed with status")
        ) {
          throw error;
        }
        // If it's a generic message, try to extract from the original error
        const errorWithOriginal = error as any;
        if (errorWithOriginal.originalError) {
          const originalError = errorWithOriginal.originalError;
          // Check for validation errors array
          if (originalError?.errors && Array.isArray(originalError.errors)) {
            const errorMessages = originalError.errors
              .map(
                (err: any) =>
                  err.message || `${err.path || "Field"}: Invalid value`
              )
              .join(", ");
            throw new Error(errorMessages);
          }
          // Check for message in original error
          if (originalError?.message) {
            throw new Error(originalError.message);
          }
        }
        throw error;
      }
      // Otherwise wrap it in an Error
      throw new Error(error.message || "Request failed");
    }
  }

  // Authentication
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ token: string; admin: Admin }>> {
    const response = (await this.request("/login", {
      body: JSON.stringify({ email, password }),
    })) as ApiResponse<{ token: string; admin: Admin }>; // ✅ assert type

    // Check if login was successful - backend returns message "Invalid credentials." when login fails
    if (!response.data || !response.data.token) {
      const errorMessage =
        response.message ||
        "Invalid email or password. Please check your credentials and try again.";
      throw new Error(errorMessage);
    }

    if (response.data.token) {
      this.token = response.data.token;
      localStorage.setItem("authToken", this.token);
      localStorage.setItem("user", JSON.stringify(response.data.admin));
    }

    return response;
  }

  async register(
    adminData: Partial<Admin> & { password: string }
  ): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request("/register", {
      body: JSON.stringify(adminData),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request("/logout");
    this.token = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    return response;
  }

  // Profile
  async getProfile(id?: string): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request("/profile", {
      method: "POST",
      body: JSON.stringify(id ? { id } : {}),
    });
  }

  async updateProfile(profileData: {
    name?: string;
    email?: string;
    id?: string;
  }): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request("/profile/update", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{}>> {
    return this.request("/profile/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  }

  // Admins
  async getAdmins(
    params: PaginationParams & { role?: string; status?: string } = {}
  ): Promise<ApiResponse> {
    return this.request("/admins", {
      body: JSON.stringify(params),
    });
  }

  async createAdmin(
    adminData: Partial<Admin> & { password: string }
  ): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>(
      "/admins/create",
      {
        body: JSON.stringify(adminData),
      }
    );

    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (
      response.data === 0 ||
      response.data === null ||
      (!response.data && response.message)
    ) {
      throw new Error(response.message || "Failed to create admin");
    }

    return response as ApiResponse<{ admin: Admin }>;
  }

  async updateAdmin(
    adminData: Partial<Admin> & { id: string }
  ): Promise<ApiResponse<{ admin: Admin }>> {
    const response = await this.request<{ admin: Admin } | 0>(
      "/admins/update",
      {
        body: JSON.stringify(adminData),
      }
    );

    // Check if backend returned an error message with data: 0 (status 200 but error condition)
    if (
      response.data === 0 ||
      response.data === null ||
      (!response.data && response.message)
    ) {
      throw new Error(response.message || "Failed to update admin");
    }

    return response as ApiResponse<{ admin: Admin }>;
  }

  async deleteAdmin(id: string): Promise<ApiResponse> {
    return this.request("/admins/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async toggleAdminStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<{ admin: Admin }>> {
    return this.request("/admins/update", {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async getAdminStats(): Promise<ApiResponse> {
    return this.request("/admins/stats");
  }

  // Patients
  async getPatients(
    params: PaginationParams & { status?: string } = {}
  ): Promise<ApiResponse> {
    return this.request("/patients", {
      body: JSON.stringify(params),
    });
  }

  async getPatient(
    id: string
  ): Promise<ApiResponse<{ patient: Patient; recentBookings: Booking[] }>> {
    return this.request("/patients/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createPatient(
    patientData: FormData | any
  ): Promise<ApiResponse<{ patient: Patient }>> {
    // Check if it's FormData (file upload) or regular object
    if (patientData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/patients/create`, {
        method: "POST",
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: patientData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      return data;
    } else {
      return this.request("/patients/create", {
        body: JSON.stringify(patientData),
      });
    }
  }

  async updatePatient(
    patientData: FormData | any
  ): Promise<ApiResponse<{ patient: Patient }>> {
    // Check if it's FormData (file upload) or regular object
    if (patientData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/patients/update`, {
        method: "POST",
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: patientData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      return data;
    } else {
      return this.request("/patients/update", {
        body: JSON.stringify(patientData),
      });
    }
  }

  async deletePatient(id: string): Promise<ApiResponse> {
    return this.request("/patients/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async togglePatientStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<{ patient: Patient }>> {
    return this.request("/patients/update", {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async searchPatients(
    query: string,
    limit = 10
  ): Promise<ApiResponse<{ patients: Patient[] }>> {
    return this.request("/patients/search", {
      body: JSON.stringify({ q: query, limit }),
    });
  }

  async getPatientStats(): Promise<ApiResponse> {
    return this.request("/patients/stats");
  }

  // Categories
  async getCategories(
    params: PaginationParams & { status?: string } = {}
  ): Promise<ApiResponse> {
    return this.request("/categories", {
      body: JSON.stringify(params),
    });
  }

  //catedories by service
  async getCategoriesByService(
    params: PaginationParams & { status?: string; serviceId?: string } = {}
  ): Promise<ApiResponse> {
    return this.request("/doctors/categories", {
      body: JSON.stringify(params),
    });
  }

  async getCategory(id: string): Promise<ApiResponse<{ category: Category }>> {
    return this.request("/categories/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createCategory(
    categoryData: Partial<Category>
  ): Promise<ApiResponse<{ category: Category }>> {
    return this.request("/categories/create", {
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(
    categoryData: Partial<Category> & { id: string }
  ): Promise<ApiResponse<{ category: Category }>> {
    return this.request("/categories/update", {
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
    return this.request("/categories/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async toggleCategoryStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<{ category: Category }>> {
    return this.request("/categories/update", {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async getCategoryStats(): Promise<ApiResponse> {
    return this.request("/categories/stats");
  }

  // Services
  async getServices(
    params: PaginationParams & { status?: string; category?: string } = {}
  ): Promise<
    ApiResponse<{
      docs: Service[];
      totalDocs: number;
      totalPages: number;
      limit: number;
      page: number;
    }>
  > {
    return this.request("/services", {
      body: JSON.stringify(params),
    });
  }

  async getService(id: string): Promise<ApiResponse<{ service: Service }>> {
    return this.request("/services/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createService(
    serviceData: Partial<Service>
  ): Promise<ApiResponse<{ service: Service }>> {
    return this.request("/services/create", {
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(
    serviceData: Partial<Service> & { id: string }
  ): Promise<ApiResponse<{ service: Service }>> {
    return this.request("/services/update", {
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: string): Promise<ApiResponse> {
    return this.request("/services/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async toggleServiceStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<{ service: Service }>> {
    return this.request("/services/update", {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async getServiceStats(): Promise<ApiResponse> {
    try {
      return this.request("/services/stats", {
        method: "GET",
      });
    } catch (error) {
      // If stats endpoint doesn't exist, return empty stats
      return {
        status: 200,
        message: "Stats calculated from services",
        data: {
          totalServices: 0,
          activeServices: 0,
          inactiveServices: 0,
        },
      };
    }
  }

  // Doctors
  async getDoctors(
    params: PaginationParams & { specialty?: string; status?: string } = {}
  ): Promise<ApiResponse> {
    return this.request("/doctors", {
      body: JSON.stringify(params),
    });
  }

  async getDoctor(
    id: string
  ): Promise<
    ApiResponse<{
      doctor: Doctor;
      recentBookings: Booking[];
      availableSlots: Slot[];
    }>
  > {
    return this.request("/doctors/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createDoctor(
    doctorData: FormData | Partial<Doctor>
  ): Promise<ApiResponse<{ doctor: Doctor }>> {
    // Check if it's FormData (file upload) or regular object
    if (doctorData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/doctors/create`, {
        method: "POST",
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: doctorData,
      });
      const data = await response.json();
      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map((err: any) => err.message)
            .join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(data.message || "Request failed");
      }
      return data;
    } else {
      return this.request("/doctors/create", {
        body: JSON.stringify(doctorData),
      });
    }
  }

  async updateDoctor(
    doctorData: FormData | Partial<Doctor>
  ): Promise<ApiResponse<{ doctor: Doctor }>> {
    // Check if it's FormData (file upload) or regular object
    if (doctorData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/doctors/update`, {
        method: "POST",
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: doctorData,
      });
      const data = await response.json();
      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map((err: any) => err.message)
            .join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(data.message || "Request failed");
      }
      return data;
    } else {
      return this.request("/doctors/update", {
        body: JSON.stringify(doctorData),
      });
    }
  }

  async deleteDoctor(id: string): Promise<ApiResponse> {
    return this.request("/doctors/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async toggleDoctorStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request("/doctors/update", {
      body: JSON.stringify({ id, isActive }),
    });
  }

  async approveDoctor(id: string): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request("/doctors/approve", {
      body: JSON.stringify({ id }),
    });
  }

  async rejectDoctor(
    id: string,
    reason: string
  ): Promise<ApiResponse<{ doctor: Doctor }>> {
    return this.request("/doctors/reject", {
      body: JSON.stringify({ id, reason }),
    });
  }

  async getDoctorStats(): Promise<ApiResponse> {
    return this.request("/doctors/stats");
  }

  // Bookings
  async getBookings(
    params: PaginationParams & {
      status?: string;
      doctorId?: string;
      patientId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse> {
    return this.request("/bookings", {
      body: JSON.stringify(params),
    });
  }

  async getBooking(id: string): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request("/bookings/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createBooking(
    bookingData: Partial<Booking>
  ): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request("/bookings/create", {
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(
    bookingData: Partial<Booking> & { id: string }
  ): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request("/bookings/update", {
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(
    id: string,
    reason: string
  ): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request("/bookings/cancel", {
      body: JSON.stringify({ id, reason }),
    });
  }

  async rescheduleBooking(
    id: string,
    newSlotId: string,
    reason: string
  ): Promise<ApiResponse> {
    return this.request("/bookings/reschedule", {
      body: JSON.stringify({ id, newSlotId, reason }),
    });
  }

  async getBookingStats(): Promise<ApiResponse> {
    return this.request("/bookings/stats");
  }

  async exportBookings(
    params: {
      startDate?: string;
      endDate?: string;
      status?: string;
      doctorId?: string;
    } = {}
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/bookings/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  async generateReport(
    params: {
      startDate?: string;
      endDate?: string;
      type?: string;
      status?: string;
      doctorId?: string;
    } = {}
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/bookings/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Report generation failed" }));
      throw new Error(errorData.message || "Report generation failed");
    }

    return response.blob();
  }

  // Slots
  async getSlots(
    params: PaginationParams & {
      doctorId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse> {
    return this.request("/slots", {
      body: JSON.stringify(params),
    });
  }

  async getSlot(
    id: string
  ): Promise<ApiResponse<{ slot: Slot; booking?: Booking }>> {
    return this.request("/slots/get", {
      body: JSON.stringify({ id }),
    });
  }

  async createSlot(
    slotData: Partial<Slot>
  ): Promise<ApiResponse<{ slot: Slot }>> {
    return this.request("/slots/create", {
      body: JSON.stringify(slotData),
    });
  }

  async updateSlot(
    slotData: Partial<Slot> & { id: string }
  ): Promise<ApiResponse<{ slot: Slot }>> {
    return this.request("/slots/update", {
      body: JSON.stringify(slotData),
    });
  }

  async deleteSlot(id: string): Promise<ApiResponse> {
    return this.request("/slots/delete", {
      body: JSON.stringify({ id }),
    });
  }

  async toggleSlotStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<{ slot: Slot }>> {
    return this.request("/slots/update", {
      body: JSON.stringify({ id, status }),
    });
  }

  async getSlotsByDoctor(
    doctorId: string,
    params: {
      startDate?: string;
      endDate?: string;
      status?: string;
    } = {}
  ): Promise<ApiResponse<{ slots: Slot[]; groupedSlots: any; doctor: any }>> {
    return this.request("/slots/doctor", {
      body: JSON.stringify({ doctorId, ...params }),
    });
  }

  async getSlotStats(): Promise<ApiResponse> {
    return this.request("/slots/stats");
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request("/dashboard/stats");
  }

  async getRevenueStats(
    period: "week" | "month" | "year" = "month"
  ): Promise<ApiResponse> {
    return this.request("/dashboard/revenue", {
      body: JSON.stringify({ period }),
    });
  }

  async getAppointmentStats(
    period: "week" | "month" | "year" = "month"
  ): Promise<ApiResponse> {
    return this.request("/dashboard/appointments", {
      body: JSON.stringify({ period }),
    });
  }

  async getDepartmentStats(): Promise<ApiResponse> {
    return this.request("/dashboard/departments");
  }

  async getComprehensiveStats(
    period: "week" | "month" | "year" = "month"
  ): Promise<ApiResponse> {
    return this.request("/dashboard/comprehensive", {
      body: JSON.stringify({ period }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
