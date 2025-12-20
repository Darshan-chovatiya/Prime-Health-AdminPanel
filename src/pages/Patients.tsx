import { useState, useEffect } from "react";
import apiService, { Patient, Booking } from "../services/api";
import swal from '../utils/swalHelper';
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import { useDebounce } from '../hooks';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit, setLimit] = useState(10);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  // Debounced values - only for status filter since SearchInput handles search debouncing
  const debouncedStatusFilter = useDebounce(statusFilter, 300);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      mobileNo: ''
    },
    allergies: [] as string[],
    medicalHistory: [] as { condition: string; diagnosis: string; treatment: string; date: string }[],
    bloodGroup: '',
    profileImage: '',
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [newMedical, setNewMedical] = useState({
    condition: '',
    diagnosis: '',
    treatment: '',
    date: ''
  });

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedStatusFilter]);

  useEffect(() => {
    fetchPatients();
    fetchPatientStats();
  }, [currentPage, searchTerm, debouncedStatusFilter, limit]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatients({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: debouncedStatusFilter === 'all' ? undefined : debouncedStatusFilter,
      });
      
      if (response.data && response.data.docs) {
        setPatients(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
        setTotalDocs(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      swal.error('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientStats = async () => {
    try {
      const response = await apiService.getPatientStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    }
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    const result = await swal.confirm('Are you sure?', `Delete patient ${patientName}?`);

    if (result.isConfirmed) {
      try {
        const response = await apiService.deletePatient(patientId);
        if (response.status === 200) {
          swal.success('Deleted!', 'Patient has been deleted.');
          fetchPatients();
          fetchPatientStats();
        } else {
          swal.error('Error', response.message || 'Failed to delete patient');
        }
      } catch (error: any) {
        swal.error('Error', error.message || 'Failed to delete patient');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobileNo: '',
      dateOfBirth: '',
      gender: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        mobileNo: ''
      },
      allergies: [],
      medicalHistory: [],
      bloodGroup: '',
      profileImage: '',
    });
    setAllergyInput('');
    setNewMedical({
      condition: '',
      diagnosis: '',
      treatment: '',
      date: ''
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = async (id: string) => {
    try {
      const response = await apiService.getPatient(id);
      if (response.status === 200) {
        const patient = response.data.patient;
        setFormData({
          name: patient.name || '',
          email: patient.email || '',
          mobileNo: patient.mobileNo || '',
          dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
          gender: patient.gender || '',
          address: patient.address || { street: '', city: '', state: '', zipCode: '', country: '' },
          emergencyContact: patient.emergencyContact || { name: '', relationship: '', mobileNo: '' },
          allergies: patient.allergies || [],
          medicalHistory: patient.medicalHistory?.map(h => ({
            ...h,
            date: new Date(h.date).toISOString().split('T')[0]
          })) || [],
          bloodGroup: patient.bloodGroup || '',
          profileImage: patient.profileImage || '',
        });
        setSelectedPatient(patient);
        setShowEditModal(true);
      } else {
        swal.error('Error', response.message);
      }
    } catch (error) {
      swal.error('Error', 'Failed to load patient data');
    }
  };

  const handleOpenView = async (id: string) => {
    try {
      const response = await apiService.getPatient(id);
      if (response.status === 200) {
        setSelectedPatient(response.data.patient);
        setRecentBookings(response.data.recentBookings || []);
        setShowViewModal(true);
      } else {
        swal.error('Error', response.message);
      }
    } catch (error) {
      swal.error('Error', 'Failed to load patient data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      address: { ...formData.address, [name]: value }
    });
  };

  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      emergencyContact: { ...formData.emergencyContact, [name]: value }
    });
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    const newAllergies = formData.allergies.filter((_, i) => i !== index);
    setFormData({ ...formData, allergies: newAllergies });
  };

  const handleNewMedicalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMedical({ ...newMedical, [name]: value });
  };

  const addMedicalHistory = () => {
    if (newMedical.condition && newMedical.diagnosis && newMedical.treatment && newMedical.date) {
      setFormData({
        ...formData,
        medicalHistory: [...formData.medicalHistory, { ...newMedical }]
      });
      setNewMedical({ condition: '', diagnosis: '', treatment: '', date: '' });
    } else {
      swal.warning('Warning', 'Please fill all medical history fields');
    }
  };

  const removeMedicalHistory = (index: number) => {
    const newHistory = formData.medicalHistory.filter((_, i) => i !== index);
    setFormData({ ...formData, medicalHistory: newHistory });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response:any;
      if (showCreateModal) {
        response = await apiService.createPatient(formData);
      } else if (showEditModal && selectedPatient?._id) {
        response = await apiService.updatePatient({ ...formData, id: selectedPatient._id });
      }
      if (response.status === 200) {
        swal.success('Success', showCreateModal ? 'Patient created successfully' : 'Patient updated successfully');
        setShowCreateModal(false);
        setShowEditModal(false);
        fetchPatients();
        fetchPatientStats();
      } else {
        swal.error('Error', response.message);
      }
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to save patient');
    }
  };

  const handleToggleStatus = async (patientId: string, currentStatus: boolean) => {
    try {
      await apiService.togglePatientStatus(patientId, !currentStatus);
      swal.success('Success!', `Patient ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchPatients();
      fetchPatientStats();
    } catch (error: any) {
      swal.error('Error', error.message || 'Failed to update patient status');
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const renderModal = (isCreate: boolean) => {
    return (
      <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {isCreate ? 'Add New Patient' : 'Update Patient'}
              </h2>
              <button 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No *</label>
                  <input 
                    name="mobileNo" 
                    value={formData.mobileNo} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (/^\d*$/.test(value)) {
                        handleInputChange(e);
                      }
                    }} 
                    required 
                    pattern="[0-9]{10}" 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter 10-digit mobile number (numbers only)"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
                  <div className="relative">
                    <input 
                      name="dateOfBirth" 
                      type="date" 
                      id="date-of-birth"
                      value={formData.dateOfBirth} 
                      onChange={handleInputChange} 
                      required 
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full border rounded-lg px-3 py-2 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500 cursor-pointer" 
                      style={{ paddingRight: '2.5rem' }}
                      onFocus={(e) => {
                        const input = e.currentTarget;
                        if (input && 'showPicker' in input && typeof (input as any).showPicker === 'function') {
                          try {
                            (input as any).showPicker();
                          } catch (err) {
                            // showPicker might not be available or might fail, that's okay
                          }
                        }
                      }}
                    />
                    <label 
                      htmlFor="date-of-birth"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                  <select 
                    name="bloodGroup" 
                    value={formData.bloodGroup} 
                    onChange={handleInputChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street</label>
                  <input 
                    name="street" 
                    value={formData.address.street} 
                    onChange={handleAddressChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input 
                    name="city" 
                    value={formData.address.city} 
                    onChange={handleAddressChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input 
                    name="state" 
                    value={formData.address.state} 
                    onChange={handleAddressChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                  <input 
                    name="zipCode" 
                    value={formData.address.zipCode} 
                    onChange={handleAddressChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter zip code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input 
                    name="country" 
                    value={formData.address.country} 
                    onChange={handleAddressChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input 
                    name="name" 
                    value={formData.emergencyContact.name} 
                    onChange={handleEmergencyChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                  <input 
                    name="relationship" 
                    value={formData.emergencyContact.relationship} 
                    onChange={handleEmergencyChange} 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter relationship"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
                  <input 
                    name="mobileNo" 
                    value={formData.emergencyContact.mobileNo} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (/^\d*$/.test(value)) {
                        handleEmergencyChange(e);
                      }
                    }} 
                    pattern="[0-9]{10}" 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter 10-digit mobile number (numbers only)"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">Allergies</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input 
                  value={allergyInput} 
                  onChange={(e) => setAllergyInput(e.target.value)} 
                  placeholder="Enter allergy"
                  className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
                <button 
                  type="button" 
                  onClick={addAllergy} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="text-sm">{allergy}</span>
                    <button type="button" onClick={() => removeAllergy(index)} className="text-red-600 hover:text-red-800">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">Medical History</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <input 
                  name="condition" 
                  value={newMedical.condition} 
                  onChange={handleNewMedicalChange} 
                  placeholder="Condition" 
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
                <input 
                  name="diagnosis" 
                  value={newMedical.diagnosis} 
                  onChange={handleNewMedicalChange} 
                  placeholder="Diagnosis" 
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
                <input 
                  name="treatment" 
                  value={newMedical.treatment} 
                  onChange={handleNewMedicalChange} 
                  placeholder="Treatment" 
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
                <div className="relative">
                  <input 
                    name="date" 
                    type="date" 
                    id="medical-history-date"
                    value={newMedical.date} 
                    onChange={handleNewMedicalChange} 
                    className="border rounded-lg px-3 py-2 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500 cursor-pointer" 
                    style={{ paddingRight: '2.5rem' }}
                    onFocus={(e) => {
                      const input = e.currentTarget;
                      if (input && 'showPicker' in input && typeof (input as any).showPicker === 'function') {
                        try {
                          (input as any).showPicker();
                        } catch (err) {
                          // showPicker might not be available or might fail, that's okay
                        }
                      }
                    }}
                  />
                  <label 
                    htmlFor="medical-history-date"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addMedicalHistory} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-3 w-full sm:w-auto"
              >
                Add History
              </button>
              <div className="space-y-2">
                {formData.medicalHistory.map((history, index) => (
                  <div key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm">{`${history.condition} - ${history.diagnosis} (${new Date(history.date).toLocaleDateString()})`}</span>
                    <button type="button" onClick={() => removeMedicalHistory(index)} className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image URL</label>
              <input 
                name="profileImage" 
                value={formData.profileImage} 
                onChange={handleInputChange} 
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                placeholder="Enter image URL"
              />
            </div>
            </form>
          </div>
          
          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 px-4 sm:px-6 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} 
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="patient-form"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
              >
                {isCreate ? 'Create Patient' : 'Update Patient'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!selectedPatient) return null;
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20 flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Patient Details</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Complete patient information and medical history</p>
              </div>
            </div>
            <button 
              onClick={() => setShowViewModal(false)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors self-end sm:self-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.mobileNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Group:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.bloodGroup || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address
                </h3>
                {selectedPatient.address ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Street:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.address.street || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">City:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.address.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">State:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.address.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Zip Code:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.address.zipCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Country:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.address.country || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No address information available</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Emergency Contact
                </h3>
                {selectedPatient.emergencyContact ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.emergencyContact.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.emergencyContact.relationship || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedPatient.emergencyContact.mobileNo || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No emergency contact information available</p>
                )}
              </div>

              {/* Allergies */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Allergies
                </h3>
                {selectedPatient.allergies?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatient.allergies.map((allergy, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm text-gray-900 dark:text-white">{allergy}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No known allergies</p>
                )}
              </div>
            </div>

            {/* Medical History - Full Width */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Medical History
              </h3>
              {selectedPatient.medicalHistory?.length > 0 ? (
                <div className="space-y-4">
                  {selectedPatient.medicalHistory.map((history, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Condition:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{history.condition}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{new Date(history.date).toLocaleDateString()}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnosis:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{history.diagnosis}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Treatment:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{history.treatment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No medical history available</p>
              )}
            </div>

            {/* Recent Bookings - Full Width */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Recent Bookings
              </h3>
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Doctor:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">
                            {booking.doctorId?.name} ({booking.doctorId?.specialty})
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">
                            {new Date(booking.appointmentDate).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Service:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">{booking.serviceId?.name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent bookings available</p>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedPatient(selectedPatient);
                setShowEditModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Patient</span>
            </button>
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    );
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
            Patient Management
          </h3>
          <button 
            onClick={handleOpenCreate}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 w-full sm:w-auto"
          >
            Add New Patient
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Patient Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.totalPatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.newThisMonth?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.activePatients?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Appointments</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {stats?.pendingAppointments?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                  <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
              <SearchInput
                placeholder="Search patients..."
                value={searchTerm}
                onChange={setSearchTerm}
                debounceMs={500}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Patient Records</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Contact</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Last Visit</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <tr key={patient._id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {patient.profileImage ? (
                                <>
                                  <img 
                                    className="h-10 w-10 rounded-full" 
                                    src={patient.profileImage} 
                                    alt="Patient"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center hidden">
                                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                </>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{patient.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">ID: {patient._id.slice(-6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 dark:text-white/90">{patient.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{patient.mobileNo}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                          {patient.age || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                              patient.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                            }`}
                            onClick={() => handleToggleStatus(patient._id, patient.isActive)}
                            title={`Click to ${patient.isActive ? 'deactivate' : 'activate'} patient`}
                          >
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <ActionButton 
                              type="view" 
                              onClick={() => handleOpenView(patient._id)} 
                            />
                            <ActionButton 
                              type="edit" 
                              onClick={() => handleOpenEdit(patient._id)} 
                            />
                            <ActionButton 
                              type="delete" 
                              onClick={() => handleDeletePatient(patient._id, patient.name)} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No patients found
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

      {showCreateModal && renderModal(true)}
      {showEditModal && renderModal(false)}
      {showViewModal && renderViewModal()}
    </>
  );
}