import { useState, useEffect } from "react";
import apiService, { Patient, Booking } from "../services/api";
import swal from '../utils/swalHelper';
import ActionButton from '../components/ui/ActionButton';
import SearchInput from '../components/ui/SearchInput';
import PaginationControls from '../components/ui/PaginationControls';
import { useDebounce } from '../hooks';

// Helper function to get image URL
const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '';
  
  // If it's a base64 string, return as is
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path (starts with uploads/), prepend the base URL
  // Use getBaseUrl from apiService to get the base URL
  const baseUrl = apiService.getBaseUrl();
  
  // Ensure the path starts with / for proper URL construction
  const normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  return `${baseUrl}${normalizedPath}`;
};

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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [allergyInput, setAllergyInput] = useState('');
  const [newMedical, setNewMedical] = useState({
    condition: '',
    diagnosis: '',
    treatment: '',
    date: ''
  });

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobileNo?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      mobileNo?: string;
    };
  }>({});

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
    setProfileImageFile(null);
    setProfileImagePreview('');
    setAllergyInput('');
    setNewMedical({
      condition: '',
      diagnosis: '',
      treatment: '',
      date: ''
    });
    setErrors({});
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
        setProfileImageFile(null);
        setProfileImagePreview(patient.profileImage ? getImageUrl(patient.profileImage) : '');
        setSelectedPatient(patient);
        setErrors({});
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

  // Validate individual field
  const validateField = (name: string, value: any, fieldType?: 'address' | 'emergencyContact'): string | null => {
    if (fieldType === 'address') {
      // Address fields are optional, but if any is provided, all must be non-empty
      const hasAnyField = formData.address.street || formData.address.city || formData.address.state || formData.address.zipCode || formData.address.country;
      if (hasAnyField) {
        if (name === 'street' && !value?.trim()) return 'Street is required if address is provided';
        if (name === 'city' && !value?.trim()) return 'City is required if address is provided';
        if (name === 'state' && !value?.trim()) return 'State is required if address is provided';
        if (name === 'zipCode' && !value?.trim()) return 'Zip code is required if address is provided';
        if (name === 'country' && !value?.trim()) return 'Country is required if address is provided';
      }
      return null;
    }

    if (fieldType === 'emergencyContact') {
      // Emergency contact: if any field is provided, all are required
      const hasAnyField = formData.emergencyContact.name || formData.emergencyContact.relationship || formData.emergencyContact.mobileNo;
      if (hasAnyField) {
        if (name === 'name' && !value?.trim()) return 'Emergency contact name is required';
        if (name === 'name' && value?.trim().length < 2) return 'Emergency contact name must be at least 2 characters';
        if (name === 'relationship' && !value?.trim()) return 'Emergency contact relationship is required';
        if (name === 'relationship' && value?.trim().length < 2) return 'Emergency contact relationship must be at least 2 characters';
        if (name === 'mobileNo' && !value?.trim()) return 'Emergency contact mobile number is required';
        if (name === 'mobileNo' && !/^[0-9]{10}$/.test(value?.trim() || '')) return 'Emergency contact mobile number must be exactly 10 digits';
      }
      return null;
    }

    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 50) {
          return 'Name must be less than 50 characters';
        }
        return null;
      
      case 'email':
        if (showCreateModal) {
          if (!value || !value.trim()) {
            return 'Email is required';
          }
        }
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;
      
      case 'mobileNo':
        if (!value || value.trim().length === 0) {
          return 'Mobile number is required';
        }
        if (!/^[0-9]{10}$/.test(value.trim())) {
          return 'Mobile number must be exactly 10 digits';
        }
        return null;
      
      case 'dateOfBirth':
        if (!value) {
          return 'Date of birth is required';
        }
        const dob = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(dob.getTime())) {
          return 'Please enter a valid date of birth';
        }
        if (dob > today) {
          return 'Date of birth cannot be in the future';
        }
        return null;
      
      case 'gender':
        if (!value || !['male', 'female', 'other'].includes(value)) {
          return 'Please select a valid gender';
        }
        return null;
      
      case 'bloodGroup':
        if (value) {
          const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
          if (!validBloodGroups.includes(value)) {
            return 'Please select a valid blood group';
          }
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate the field
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error || undefined });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedAddress = { ...formData.address, [name]: value };
    setFormData({
      ...formData,
      address: updatedAddress
    });
    
    // Validate the address field
    const error = validateField(name, value, 'address');
    setErrors({
      ...errors,
      address: {
        ...errors.address,
        [name]: error || undefined
      }
    });
  };

  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedEmergency = { ...formData.emergencyContact, [name]: value };
    setFormData({
      ...formData,
      emergencyContact: updatedEmergency
    });
    
    // Validate the emergency contact field
    const error = validateField(name, value, 'emergencyContact');
    setErrors({
      ...errors,
      emergencyContact: {
        ...errors.emergencyContact,
        [name]: error || undefined
      }
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

  const validateForm = (): string | null => {
    // Name validation: required, min 2, max 50
    if (!formData.name || formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      return 'Name is required and must be between 2 and 50 characters';
    }

    // Email validation: required for create, optional for update
    if (showCreateModal) {
      if (!formData.email || !formData.email.trim()) {
        return 'Email is required';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return 'Please enter a valid email address';
      }
    } else {
      // For update, email is optional but must be valid if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return 'Please enter a valid email address';
      }
    }

    // Mobile number validation: required, exactly 10 digits
    if (!formData.mobileNo) {
      return 'Mobile number is required';
    }
    if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      return 'Mobile number must be exactly 10 digits';
    }

    // Date of birth validation: required, must be a valid date, not in the future
    if (!formData.dateOfBirth) {
      return 'Date of birth is required';
    }
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dob.getTime())) {
      return 'Please enter a valid date of birth';
    }
    if (dob > today) {
      return 'Date of birth cannot be in the future';
    }

    // Gender validation: required, must be one of the valid values
    if (!formData.gender || !['male', 'female', 'other'].includes(formData.gender)) {
      return 'Please select a valid gender';
    }

    // Blood group validation: optional but must be valid if provided
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (formData.bloodGroup && !validBloodGroups.includes(formData.bloodGroup)) {
      return 'Please select a valid blood group';
    }

    // Emergency contact validation: optional during update, but if any field is provided, all are required
    // Only validate if we're creating a new patient OR if any emergency contact field is filled
    if (showCreateModal || formData.emergencyContact.name || formData.emergencyContact.relationship || formData.emergencyContact.mobileNo) {
      // If creating, emergency contact is optional
      // If updating and any field is provided, all fields must be provided
      const hasAnyField = formData.emergencyContact.name || formData.emergencyContact.relationship || formData.emergencyContact.mobileNo;
      const hasAllFields = formData.emergencyContact.name && formData.emergencyContact.relationship && formData.emergencyContact.mobileNo;
      
      if (hasAnyField && !hasAllFields) {
        return 'If providing emergency contact, all fields (name, relationship, mobile number) are required';
      }
      
      if (hasAllFields) {
        if (formData.emergencyContact.name.trim().length < 2) {
          return 'Emergency contact name must be at least 2 characters';
        }
        if (formData.emergencyContact.relationship.trim().length < 2) {
          return 'Emergency contact relationship must be at least 2 characters';
        }
        if (!/^[0-9]{10}$/.test(formData.emergencyContact.mobileNo)) {
          return 'Emergency contact mobile number must be exactly 10 digits';
        }
      }
    }

    // Medical history validation: if provided, all fields are required
    for (let i = 0; i < formData.medicalHistory.length; i++) {
      const history = formData.medicalHistory[i];
      if (!history.condition || !history.condition.trim()) {
        return `Medical history entry ${i + 1}: Condition is required`;
      }
      if (!history.diagnosis || !history.diagnosis.trim()) {
        return `Medical history entry ${i + 1}: Diagnosis is required`;
      }
      if (!history.treatment || !history.treatment.trim()) {
        return `Medical history entry ${i + 1}: Treatment is required`;
      }
      if (!history.date) {
        return `Medical history entry ${i + 1}: Date is required`;
      }
      const historyDate = new Date(history.date);
      if (isNaN(historyDate.getTime())) {
        return `Medical history entry ${i + 1}: Please enter a valid date`;
      }
    }

    return null; // No validation errors
  };

  // Check if all required fields are filled (for button disable state)
  const isFormValid = (): boolean => {
    if (showCreateModal) {
      // For create: check all required fields including email
      return !!(
        formData.name?.trim() &&
        formData.name.trim().length >= 2 &&
        formData.email?.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
        formData.mobileNo?.trim() &&
        /^[0-9]{10}$/.test(formData.mobileNo) &&
        formData.dateOfBirth &&
        formData.gender &&
        ['male', 'female', 'other'].includes(formData.gender)
      );
    } else {
      // For update: name is required, others can be optional
      return !!(
        formData.name?.trim() &&
        formData.name.trim().length >= 2
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const validationErrors: any = {};
    validationErrors.name = validateField('name', formData.name);
    validationErrors.email = validateField('email', formData.email);
    validationErrors.mobileNo = validateField('mobileNo', formData.mobileNo);
    validationErrors.dateOfBirth = validateField('dateOfBirth', formData.dateOfBirth);
    validationErrors.gender = validateField('gender', formData.gender);
    validationErrors.bloodGroup = validateField('bloodGroup', formData.bloodGroup);
    
    // Validate address fields
    const addressErrors: any = {};
    addressErrors.street = validateField('street', formData.address.street, 'address');
    addressErrors.city = validateField('city', formData.address.city, 'address');
    addressErrors.state = validateField('state', formData.address.state, 'address');
    addressErrors.zipCode = validateField('zipCode', formData.address.zipCode, 'address');
    addressErrors.country = validateField('country', formData.address.country, 'address');
    if (Object.keys(addressErrors).some(key => addressErrors[key])) {
      validationErrors.address = addressErrors;
    }
    
    // Validate emergency contact fields
    const emergencyErrors: any = {};
    emergencyErrors.name = validateField('name', formData.emergencyContact.name, 'emergencyContact');
    emergencyErrors.relationship = validateField('relationship', formData.emergencyContact.relationship, 'emergencyContact');
    emergencyErrors.mobileNo = validateField('mobileNo', formData.emergencyContact.mobileNo, 'emergencyContact');
    if (Object.keys(emergencyErrors).some(key => emergencyErrors[key])) {
      validationErrors.emergencyContact = emergencyErrors;
    }
    
    // Remove undefined values
    Object.keys(validationErrors).forEach(key => {
      if (!validationErrors[key] || (typeof validationErrors[key] === 'object' && Object.keys(validationErrors[key]).length === 0)) {
        delete validationErrors[key];
      }
    });
    
    setErrors(validationErrors);
    
    // Check if form is valid
    if (Object.keys(validationErrors).length > 0) {
      swal.error('Validation Error', 'Please fix the errors in the form before submitting');
      return;
    }

    try {
      // Prepare FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData
      formDataToSend.append('name', formData.name.trim());
      
      // For update: only send email/mobile if they're being changed
      // For create: always send email and mobileNo
      if (showEditModal && selectedPatient?._id) {
        // Only append email if it's different from existing (or if existing is empty)
        if (formData.email.trim() !== (selectedPatient.email || '')) {
          formDataToSend.append('email', formData.email.trim() || '');
        }
        // Only append mobileNo if it's different from existing
        if (formData.mobileNo.trim() !== (selectedPatient.mobileNo || '')) {
          formDataToSend.append('mobileNo', formData.mobileNo.trim());
        }
      } else {
        // For create: always send email and mobileNo
        formDataToSend.append('email', formData.email.trim() || '');
        formDataToSend.append('mobileNo', formData.mobileNo.trim());
      }
      
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('gender', formData.gender);
      if (formData.bloodGroup) {
        formDataToSend.append('bloodGroup', formData.bloodGroup);
      }
      // Clean up address - remove empty fields before sending
      const cleanedAddress: any = {};
      if (formData.address.street?.trim()) cleanedAddress.street = formData.address.street.trim();
      if (formData.address.city?.trim()) cleanedAddress.city = formData.address.city.trim();
      if (formData.address.state?.trim()) cleanedAddress.state = formData.address.state.trim();
      if (formData.address.zipCode?.trim()) cleanedAddress.zipCode = formData.address.zipCode.trim();
      if (formData.address.country?.trim()) cleanedAddress.country = formData.address.country.trim();
      
      // Only send address if it has at least one field, otherwise send null
      if (Object.keys(cleanedAddress).length > 0) {
        formDataToSend.append('address', JSON.stringify(cleanedAddress));
      } else {
        formDataToSend.append('address', JSON.stringify(null));
      }
      
      // Emergency contact is optional during update - only send if it has values
      const hasEmergencyContact = formData.emergencyContact.name || 
                                   formData.emergencyContact.relationship || 
                                   formData.emergencyContact.mobileNo;
      if (hasEmergencyContact) {
        formDataToSend.append('emergencyContact', JSON.stringify(formData.emergencyContact));
      } else {
        // Send empty object to allow clearing emergency contact
        formDataToSend.append('emergencyContact', JSON.stringify({}));
      }
      
      formDataToSend.append('allergies', JSON.stringify(formData.allergies));
      formDataToSend.append('medicalHistory', JSON.stringify(formData.medicalHistory));
      
      // Add profile image file if selected
      if (profileImageFile) {
        formDataToSend.append('profileImage', profileImageFile);
      }
      
      // Add id for update
      if (showEditModal && selectedPatient?._id) {
        formDataToSend.append('id', selectedPatient._id);
      }
      
      let response:any;
      if (showCreateModal) {
        response = await apiService.createPatient(formDataToSend);
      } else if (showEditModal && selectedPatient?._id) {
        response = await apiService.updatePatient(formDataToSend);
      }
      
      // Check if response indicates success (status 200 and data !== 0)
      if (response.status === 200 && response.data !== 0) {
        swal.success('Success', showCreateModal ? 'Patient created successfully' : 'Patient updated successfully');
        setShowCreateModal(false);
        setShowEditModal(false);
        setProfileImageFile(null);
        setProfileImagePreview('');
        fetchPatients();
        fetchPatientStats();
      } else {
        // Show backend error message (when status is 200 but data is 0, it's an error)
        const errorMessage = response.message || 'Failed to save patient';
        swal.error('Error', errorMessage);
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
                onClick={() => { 
                  setShowCreateModal(false); 
                  setShowEditModal(false);
                  setProfileImageFile(null);
                  setProfileImagePreview('');
                  setErrors({});
                }} 
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                    {showCreateModal && <span className="text-red-500">*</span>}
                    {showEditModal && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Read-only)</span>}
                  </label>
                  <input 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    readOnly={showEditModal}
                    required={showCreateModal}
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    } ${
                      showEditModal 
                        ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' 
                        : ''
                    }`}
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile No <span className="text-red-500">*</span>
                    {showEditModal && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Read-only)</span>}
                  </label>
                  <input 
                    name="mobileNo" 
                    value={formData.mobileNo} 
                    onChange={(e) => {
                      if (!showEditModal) {
                        const value = e.target.value;
                        // Only allow numbers
                        if (/^\d*$/.test(value)) {
                          handleInputChange(e);
                        }
                      }
                    }} 
                    readOnly={showEditModal}
                    required 
                    pattern="[0-9]{10}" 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.mobileNo ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    } ${
                      showEditModal 
                        ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' 
                        : ''
                    }`}
                    placeholder="Enter 10-digit mobile number (numbers only)"
                    maxLength={10}
                  />
                  {errors.mobileNo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mobileNo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      name="dateOfBirth" 
                      type="date" 
                      id="date-of-birth"
                      value={formData.dateOfBirth} 
                      onChange={handleInputChange} 
                      required 
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full border rounded-lg px-3 py-2 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 cursor-pointer ${
                        errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                      }`}
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
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange} 
                    required 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.gender ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                  <select 
                    name="bloodGroup" 
                    value={formData.bloodGroup} 
                    onChange={handleInputChange} 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.bloodGroup ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
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
                  {errors.bloodGroup && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bloodGroup}</p>
                  )}
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
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.address?.street ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter street"
                  />
                  {errors.address?.street && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.street}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input 
                    name="city" 
                    value={formData.address.city} 
                    onChange={handleAddressChange} 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.address?.city ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input 
                    name="state" 
                    value={formData.address.state} 
                    onChange={handleAddressChange} 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.address?.state ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter state"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                  <input 
                    name="zipCode" 
                    value={formData.address.zipCode} 
                    onChange={handleAddressChange} 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.address?.zipCode ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter zip code"
                  />
                  {errors.address?.zipCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.zipCode}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input 
                    name="country" 
                    value={formData.address.country} 
                    onChange={handleAddressChange} 
                    className={`w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 ${
                      errors.address?.country ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Enter country"
                  />
                  {errors.address?.country && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.country}</p>
                  )}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image</label>
              <div className="mb-3">
                {profileImagePreview || formData.profileImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={profileImagePreview || getImageUrl(formData.profileImage)} 
                      alt="Profile preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="w-32 h-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 flex items-center justify-center hidden">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Upload Image File</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        swal.error('File Too Large', 'Image size should be less than 5MB');
                        e.target.value = ''; // Reset input
                        return;
                      }
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        swal.error('Invalid File Type', 'Please select an image file');
                        e.target.value = ''; // Reset input
                        return;
                      }
                      // Store file for upload
                      setProfileImageFile(file);
                      // Create preview URL
                      const previewUrl = URL.createObjectURL(file);
                      setProfileImagePreview(previewUrl);
                    }
                  }}
                  className="w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    dark:file:bg-green-900/20 dark:file:text-green-400
                    dark:hover:file:bg-green-900/30
                    file:cursor-pointer
                    cursor-pointer
                    border border-gray-300 dark:border-gray-600 rounded-lg
                    dark:bg-gray-700"
                />
              </div>
            </div>
            </form>
          </div>
          
          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 z-10 px-4 sm:px-6 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { 
                  setShowCreateModal(false); 
                  setShowEditModal(false);
                  setProfileImageFile(null);
                  setProfileImagePreview('');
                }} 
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="patient-form"
                disabled={!isFormValid()}
                className={`px-4 py-2 rounded-lg w-full sm:w-auto ${
                  isFormValid()
                    ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                }`}
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
                                    src={getImageUrl(patient.profileImage)} 
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