import { useState, useEffect } from "react";
import apiService, { Patient, Booking } from "../services/api";
import Swal from 'sweetalert2';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
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

  useEffect(() => {
    fetchPatients();
    fetchPatientStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatients({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.data && response.data.docs) {
        setPatients(response.data.docs);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load patients',
      });
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete patient ${patientName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await apiService.deletePatient(patientId);
        if (response.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Patient has been deleted.',
          });
          fetchPatients();
          fetchPatientStats();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Failed to delete patient',
          });
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete patient',
        });
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
        Swal.fire('Error', response.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load patient data', 'error');
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
        Swal.fire('Error', response.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load patient data', 'error');
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
      Swal.fire('Warning', 'Please fill all medical history fields', 'warning');
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
        Swal.fire('Success', showCreateModal ? 'Patient created successfully' : 'Patient updated successfully', 'success');
        setShowCreateModal(false);
        setShowEditModal(false);
        fetchPatients();
        fetchPatientStats();
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to save patient', 'error');
    }
  };

  const renderModal = (isCreate: boolean) => {
    return (
      <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Basic Information</h3>
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
                    onChange={handleInputChange} 
                    required 
                    pattern="[0-9]{10}" 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
                  <input 
                    name="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={handleInputChange} 
                    required 
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                  />
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Address</h3>
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    onChange={handleEmergencyChange} 
                    pattern="[0-9]{10}" 
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Allergies</h3>
              <div className="flex gap-2 mb-3">
                <input 
                  value={allergyInput} 
                  onChange={(e) => setAllergyInput(e.target.value)} 
                  placeholder="Enter allergy"
                  className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
                <button 
                  type="button" 
                  onClick={addAllergy} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Medical History</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
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
                <input 
                  name="date" 
                  type="date" 
                  value={newMedical.date} 
                  onChange={handleNewMedicalChange} 
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>
              <button 
                type="button" 
                onClick={addMedicalHistory} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-3"
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

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} 
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {isCreate ? 'Create Patient' : 'Update Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!selectedPatient) return null;
    return (
      <div className="fixed inset-0 bg-[#1018285e] bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl m-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Patient Details</h2>
            <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Basic Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Name: {selectedPatient.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Email: {selectedPatient.email || 'N/A'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mobile: {selectedPatient.mobileNo}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">DOB: {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Gender: {selectedPatient.gender}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Blood Group: {selectedPatient.bloodGroup || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Address</h3>
              {selectedPatient.address && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Street: {selectedPatient.address.street || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">City: {selectedPatient.address.city || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">State: {selectedPatient.address.state || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Zip: {selectedPatient.address.zipCode || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Country: {selectedPatient.address.country || 'N/A'}</p>
                </>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Emergency Contact</h3>
              {selectedPatient.emergencyContact && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Name: {selectedPatient.emergencyContact.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Relationship: {selectedPatient.emergencyContact.relationship || 'N/A'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Mobile: {selectedPatient.emergencyContact.mobileNo || 'N/A'}</p>
                </>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Allergies</h3>
              {selectedPatient.allergies?.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                  {selectedPatient.allergies.map((allergy, i) => <li key={i}>{allergy}</li>)}
                </ul>
              ) : <p className="text-sm text-gray-600 dark:text-gray-300">None</p>}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Medical History</h3>
              {selectedPatient.medicalHistory?.length > 0 ? (
                <ul className="space-y-2">
                  {selectedPatient.medicalHistory.map((history, i) => (
                    <li key={i} className="border p-2 rounded text-sm text-gray-600 dark:text-gray-300">
                      <p>Condition: {history.condition}</p>
                      <p>Diagnosis: {history.diagnosis}</p>
                      <p>Treatment: {history.treatment}</p>
                      <p>Date: {new Date(history.date).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600 dark:text-gray-300">None</p>}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Bookings</h3>
              {recentBookings.length > 0 ? (
                <ul className="space-y-2">
                  {recentBookings.map((booking, i) => (
                    <li key={i} className="border p-2 rounded text-sm text-gray-600 dark:text-gray-300">
                      <p>Doctor: {booking.doctorId?.name} ({booking.doctorId?.specialty})</p>
                      <p>Service: {booking.serviceId?.name}</p>
                      <p>Date: {new Date(booking.appointmentDate).toLocaleString()}</p>
                      <p>Status: {booking.status}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600 dark:text-gray-300">No recent bookings</p>}
            </div>
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
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Patient Management
          </h3>
          <button 
            onClick={handleOpenCreate}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
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
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
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
                                <img className="h-10 w-10 rounded-full" src={patient.profileImage} alt="Patient" />
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
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            patient.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                          }`}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button onClick={() => handleOpenView(patient._id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                              View
                            </button>
                            <button onClick={() => handleOpenEdit(patient._id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePatient(patient._id, patient.name)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && renderModal(true)}
      {showEditModal && renderModal(false)}
      {showViewModal && renderViewModal()}
    </>
  );
}