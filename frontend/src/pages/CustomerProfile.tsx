import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Phone, 
  MapPin, 
  Car, 
  FileText, 
  Upload, 
  ArrowLeft, 
  Plus, 
  MessageCircle, 
  Loader2,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Dialog Modals
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  // Form Fields: Edit Customer Details
  const [editFullName, setEditFullName] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editAddressLine1, setEditAddressLine1] = useState('');
  const [editAddressLine2, setEditAddressLine2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Active renewing policy item
  const [renewingPolicy, setRenewingPolicy] = useState<any | null>(null);

  // Form Fields: Renewal
  const [newPolicyNumber, setNewPolicyNumber] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const [newCompanyId, setNewCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  // Form Fields: Add Vehicle
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('PETROL');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  const [checkingPlate, setCheckingPlate] = useState(false);
  const [plateError, setPlateError] = useState('');

  // Form Fields: Document Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('INSURANCE_PDF');

  const [uiError, setUiError] = useState('');

  // Fetch Customer Profile details
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['customerProfile', id],
    queryFn: async () => {
      const res = await api.get<any>(`/customers/${id}`);
      return res.data;
    },
  });

  // URL triggers opening renewal modal
  useEffect(() => {
    const renewPolicyId = searchParams.get('renew');
    if (data?.profile && renewPolicyId && companies.length > 0) {
      // Find the policy
      let foundPolicy: any = null;
      for (const vehicle of data.profile.vehicles) {
        const match = vehicle.policies.find((p: any) => p.id === renewPolicyId);
        if (match) {
          foundPolicy = match;
          break;
        }
      }

      if (foundPolicy) {
        openRenewal(foundPolicy);
      }
      
      // Clean query parameters
      searchParams.delete('renew');
      setSearchParams(searchParams);
    }
  }, [data, searchParams, companies]);

  // Load Companies
  useEffect(() => {
    if (companies.length === 0) {
      api.get<{ data: { companies: any[] } }>('/policies/companies')
        .then((res) => setCompanies(res.data.companies));
    }
  }, []);

  const openRenewal = (policy: any) => {
    setRenewingPolicy(policy);
    setNewPolicyNumber('');
    
    // Set new start date to 1 day after old expiry date
    const oldExpiry = new Date(policy.expiryDate);
    const start = new Date(oldExpiry);
    start.setDate(start.getDate() + 1);
    
    // Set new expiry to 1 year after start date
    const expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + 1);
    expiry.setDate(expiry.getDate() - 1);

    setNewStartDate(start.toISOString().split('T')[0]);
    setNewExpiryDate(expiry.toISOString().split('T')[0]);
    
    // Carry over values

    setNewCompanyId(policy.companyId);

    setIsRenewModalOpen(true);
  };

  const handlePlateCheck = async () => {
    const cleanPlate = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanPlate.length < 5) return;
    setCheckingPlate(true);
    setPlateError('');
    try {
      const res = await api.get<{ data: { isDuplicate: boolean; ownerName: string | null } }>(
        `/vehicles/check-duplicate?vehicleNumber=${cleanPlate}`
      );
      if (res.data.isDuplicate) {
        setPlateError(`Vehicle already registered to ${res.data.ownerName}`);
      }
    } catch (e) {
      // Ignore
    } finally {
      setCheckingPlate(false);
    }
  };

  // Mutations
  const renewMutation = useMutation({
    mutationFn: async () => {
      const startIso = new Date(newStartDate).toISOString();
      const expiryIso = new Date(newExpiryDate).toISOString();

      await api.post('/policies/renew', {
        oldPolicyId: renewingPolicy.id,
        companyId: newCompanyId,
        policyNumber: newPolicyNumber,
        startDate: startIso,
        expiryDate: expiryIso,
        premiumAmount: 1,
        idv: 1,
        ncb: 0,
        commissionRate: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsRenewModalOpen(false);
      setUiError('');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'Error occurred during renewal');
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/vehicles', {
        customerId: id,
        vehicleNumber: vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        vehicleType,
        brand: brand || 'Unknown',
        model: model || 'Unknown',
        fuelType,
        manufacturingYear,
        engineNumber: null,
        chassisNumber: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
      setIsAddVehicleOpen(false);
      setVehicleNumber('');
      setBrand('');
      setModel('');
      setPlateError('');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'Error occurred adding vehicle');
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a file to upload');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', id!);
      formData.append('documentType', documentType);

      await api.post('/documents/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
      setIsUploadDocOpen(false);
      setSelectedFile(null);
      setUiError('');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'File upload failed');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
    }
  });

  const replaceDocMutation = useMutation({
    mutationFn: async ({ docId, file }: { docId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/documents/replace/${docId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
      setReplacingDocId(null);
      setUiError('');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'File replacement failed');
    }
  });

  const triggerReplace = (docId: string) => {
    setReplacingDocId(docId);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replacingDocId) {
      replaceDocMutation.mutate({ docId: replacingDocId, file });
    }
    e.target.value = '';
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      navigate('/customers');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'Error occurred while deleting customer');
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/customers/${id}`, {
        fullName: editFullName,
        mobileNumber: editMobileNumber,
        whatsappNumber: editWhatsappNumber || null,
        addressLine1: editAddressLine1 || null,
        addressLine2: editAddressLine2 || null,
        city: editCity || null,
        state: editState || null,
        pincode: editPincode || null,
        notes: editNotes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditCustomerOpen(false);
      setUiError('');
    },
    onError: (err: any) => {
      setUiError(err?.message || 'Error occurred while updating customer');
    }
  });

  const openEditModal = () => {
    setEditFullName(profile.fullName);
    setEditMobileNumber(profile.mobileNumber);
    setEditWhatsappNumber(profile.whatsappNumber || '');
    setEditAddressLine1(profile.address?.addressLine1 || '');
    setEditAddressLine2(profile.address?.addressLine2 || '');
    setEditCity(profile.address?.city || '');
    setEditState(profile.address?.state || '');
    setEditPincode(profile.address?.pincode || '');
    setEditNotes(profile.notes || '');
    setUiError('');
    setIsEditCustomerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
        <span className="text-sm text-slate-500">Loading profile records...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold text-red-500">Profile Not Found</h3>
        <p className="text-xs text-slate-500 mt-2">The requested customer record does not exist or access is restricted.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-sm font-semibold text-brand-600">
          Back to list
        </button>
      </div>
    );
  }

  const { profile } = data;



  const getWhatsAppLink = (policy: any) => {
    const vehicle = profile.vehicles.find((v: any) => v.id === policy.vehicleId);
    const expiry = new Date(policy.expiryDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const message = `Hi ${profile.fullName}, your ${vehicle.brand} ${vehicle.model} (${vehicle.vehicleNumber}) insurance with ${policy.company.name} is expiring on ${expiry}. Let me know if you would like to renew. Thanks!`;
    const phone = profile.whatsappNumber || profile.mobileNumber;
    
    return `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={replaceInputRef}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleReplaceFileChange}
      />
      {/* Profile Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">ID: {profile.id.substring(0, 8)}...</p>
          </div>
        </div>

        <button
          onClick={() => {
            setUiError('');
            setIsDeleteModalOpen(true);
          }}
          className="flex items-center px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors cursor-pointer"
        >
          <Trash2 size={16} className="mr-2 text-red-500" />
          Delete Customer
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Customer details, address, notes */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card: Profile Info */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Customer Details</h3>
              <button
                onClick={openEditModal}
                className="text-xs font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Edit Details
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-slate-900 dark:text-slate-100 font-semibold">
                <User size={16} className="text-slate-500 dark:text-slate-450" />
                <span className="font-semibold">{profile.fullName}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-900 dark:text-slate-100 font-semibold">
                <Phone size={16} className="text-slate-500 dark:text-slate-450" />
                <span className="font-semibold">{profile.mobileNumber}</span>
              </div>
              {/* Alternate Contact display removed */}
              {profile.whatsappNumber && (
                <div className="flex items-center space-x-3 text-sm text-emerald-700 dark:text-emerald-400 pl-7 font-bold">
                  <MessageCircle size={14} />
                  <span>{profile.whatsappNumber}</span>
                </div>
              )}
            </div>

            {profile.address && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Address</h4>
                <div className="flex items-start space-x-3 text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{profile.address.addressLine1}</p>
                    {profile.address.addressLine2 && <p className="font-semibold">{profile.address.addressLine2}</p>}
                    <p className="font-semibold">{profile.address.city}, {profile.address.state} - {profile.address.pincode}</p>
                  </div>
                </div>
              </div>
            )}

            {profile.notes && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Agent Notes</h4>
                <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-medium">
                  {profile.notes}
                </p>
              </div>
            )}
          </div>

          {/* Card: Document Locker */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Document Locker</h3>
              <button
                onClick={() => {
                  setUiError('');
                  setIsUploadDocOpen(true);
                }}
                className="p-1 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20"
                title="Upload document"
              >
                <Upload size={18} />
              </button>
            </div>

            {profile.documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Locker empty. Upload RC book or DL.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-slate-300 dark:hover:border-slate-800 transition-colors">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <FileText size={16} className="text-brand-500 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-250 block truncate">{doc.fileName}</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold capitalize">{doc.documentType.replace('_', ' ')} • {Math.round(doc.fileSize / 1024)} KB</span>
                      </div>
                    </div>

                    <div className="flex space-x-1.5 flex-shrink-0">
                      <a
                        href={`http://localhost:5000/api/documents/file/${doc.id}?token=${useAuthStore.getState().accessToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        title="View Document"
                      >
                        <Eye size={14} />
                      </a>
                      <a
                        href={`http://localhost:5000/api/documents/file/${doc.id}?token=${useAuthStore.getState().accessToken}&download=true`}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        title="Download Document"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => triggerReplace(doc.id)}
                        disabled={replaceDocMutation.isPending && replacingDocId === doc.id}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                        title="Replace/Update Document"
                      >
                        <RefreshCw size={14} className={replaceDocMutation.isPending && replacingDocId === doc.id ? "animate-spin" : ""} />
                      </button>
                      <button
                        onClick={() => deleteDocMutation.mutate(doc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Vehicles, Policies, and Insurance History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Vehicles & Policies */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Registered Vehicles ({profile.vehicles.length})</h3>
              <button
                onClick={() => {
                  setUiError('');
                  setIsAddVehicleOpen(true);
                }}
                className="flex items-center text-xs font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 px-3 py-1.5 rounded-lg"
              >
                <Plus size={14} className="mr-1" /> Add Vehicle
              </button>
            </div>

            {profile.vehicles.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-655 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No vehicles registered. Click 'Add Vehicle' to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {profile.vehicles.map((vehicle: any) => {
                  const activePolicy = vehicle.policies.find((p: any) => p.status.name === 'ACTIVE');

                  return (
                    <div key={vehicle.id} className="border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      {/* Vehicle summary header */}
                      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-205 dark:border-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Car size={18} />
                          </div>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{vehicle.vehicleNumber}</span>
                            <span className="text-xs text-slate-800 dark:text-slate-200 block sm:inline font-bold">{vehicle.brand} {vehicle.model} ({vehicle.vehicleType})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              activePolicy
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                            }`}>
                              {activePolicy ? 'Active' : 'Expired'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            // If they have an active policy, renew it. If not, open booking.
                            if (activePolicy) {
                              openRenewal(activePolicy);
                            } else if (vehicle.policies.length > 0) {
                              // Open renewal with the most recent policy
                              openRenewal(vehicle.policies[0]);
                            } else {
                              // If no policy exists for this vehicle, we can direct them to create one
                              navigate(`/customers?create=true`);
                            }
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-all"
                        >
                          Renew Policy
                        </button>
                      </div>

                      {/* Vehicle details & Active Policy */}
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 font-bold block">Fuel Type</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{vehicle.fuelType}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 font-bold block">Manufacturing Year</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{vehicle.manufacturingYear}</span>
                          </div>
                        </div>

                        {/* Current Active Policy */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Current Active Policy</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              activePolicy
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                            }`}>
                              {activePolicy ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          {activePolicy ? (
                            <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <span className="text-xs text-slate-700 dark:text-slate-350 font-semibold block">Insurance Provider</span>
                                  <span className="text-sm font-extrabold text-slate-950 dark:text-white">{activePolicy.company.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-755 dark:text-slate-350 font-semibold block">Policy Number</span>
                                  <span className="text-sm font-extrabold font-mono text-slate-950 dark:text-white">{activePolicy.policyNumber}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-3 text-xs pt-2 border-t border-slate-150 dark:border-slate-850/60">
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400 font-bold block">Period</span>
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                    {new Date(activePolicy.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(activePolicy.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              {/* Alert Share - restricted to expiring in <= 3 days */}
                              {(() => {
                                const daysRemaining = Math.ceil((new Date(activePolicy.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return daysRemaining <= 3 ? (
                                  <div className="flex justify-end pt-2">
                                    <a
                                      href={getWhatsAppLink(activePolicy)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg hover:shadow-sm"
                                    >
                                      <MessageCircle size={14} className="mr-1.5" /> Share Policy Reminder
                                    </a>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl font-bold">
                              No current active policy registered for this vehicle.
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Activity Timeline removed */}
        </div>

      </div>

      {/* MODAL 1: Add Vehicle Form */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Add New Vehicle</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addVehicleMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Plate *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="TN07CP1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    onBlur={handlePlateCheck}
                    className="w-full h-10 px-3 uppercase text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {checkingPlate && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
                </div>
                {plateError && <span className="text-[11px] text-red-500 block mt-1">{plateError}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type *</label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl focus:outline-none">
                    <option value="BIKE">Bike</option>
                    <option value="CAR">Car</option>
                    <option value="TRUCK">Truck</option>
                    <option value="BUS">Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fuel *</label>
                  <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl focus:outline-none">
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Brand *</label>
                  <input type="text" required placeholder="Tata" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Model *</label>
                  <input type="text" required placeholder="Nexon" value={model} onChange={(e) => setModel(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mfg Year *</label>
                <input type="number" required value={manufacturingYear} onChange={(e) => setManufacturingYear(parseInt(e.target.value))} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl" />
              </div>

              <button
                type="submit"
                disabled={addVehicleMutation.isPending || !!plateError}
                className="w-full h-11 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-semibold rounded-xl text-sm mt-3"
              >
                {addVehicleMutation.isPending ? 'Saving vehicle...' : 'Register Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Click Renewal Form */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Renew Policy</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pre-filled with previous policy attributes</p>
              </div>
              <button onClick={() => setIsRenewModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
            </div>

            {uiError && (
              <div className="p-3 mb-4 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl">{uiError}</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); renewMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Policy Number *</label>
                <input
                  type="text"
                  required
                  placeholder="POL-RENEW-XXXX"
                  value={newPolicyNumber}
                  onChange={(e) => setNewPolicyNumber(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date *</label>
                  <input type="date" required value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} onFocus={(e) => e.currentTarget.showPicker?.()} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiry Date *</label>
                  <input type="date" required value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} onFocus={(e) => e.currentTarget.showPicker?.()} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl cursor-pointer" />
                </div>
              </div>



              <button
                type="submit"
                disabled={renewMutation.isPending}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm mt-3"
              >
                {renewMutation.isPending ? 'Renewing...' : 'Issue Renewed Policy'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Upload Document Form */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Upload Metadata File</h3>
              <button onClick={() => setIsUploadDocOpen(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
            </div>

            {uiError && (
              <div className="p-3 mb-4 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl">{uiError}</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); uploadDocMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type *</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl">
                  <option value="INSURANCE_PDF">Insurance Policy PDF</option>
                  <option value="RC_BOOK">RC Book / Reg Certificate</option>
                  <option value="DRIVING_LICENSE">Driving License (DL)</option>
                  <option value="OTHER">Other Metadata Document</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select File (PDF/JPG/PNG, max 5MB) *</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 block">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop file'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadDocMutation.isPending || !selectedFile}
                className="w-full h-11 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm mt-3"
              >
                {uploadDocMutation.isPending ? 'Uploading file...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Customer Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Delete Customer Account?</h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
            </div>

            {uiError && (
              <div className="p-3 mb-4 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl">{uiError}</div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <strong>{profile.fullName}</strong>? This action is permanent and will delete all their details, registered vehicles, policies, and documents.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteCustomerMutation.mutate()}
                  disabled={deleteCustomerMutation.isPending}
                  className="flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors cursor-pointer"
                >
                  {deleteCustomerMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  {deleteCustomerMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Edit Customer Details */}
      {isEditCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Edit Customer Details</h3>
              <button onClick={() => setIsEditCustomerOpen(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
            </div>

            {uiError && (
              <div className="p-3 mb-4 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl">{uiError}</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); updateCustomerMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input type="text" required value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input type="text" required maxLength={10} value={editMobileNumber} onChange={(e) => setEditMobileNumber(e.target.value.replace(/\D/g, ''))} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp Number</label>
                  <input type="text" maxLength={10} value={editWhatsappNumber} onChange={(e) => setEditWhatsappNumber(e.target.value.replace(/\D/g, ''))} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address Line 1</label>
                <input type="text" value={editAddressLine1} onChange={(e) => setEditAddressLine1(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address Line 2</label>
                <input type="text" value={editAddressLine2} onChange={(e) => setEditAddressLine2(e.target.value)} className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                  <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full h-10 px-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                  <input type="text" value={editState} onChange={(e) => setEditState(e.target.value)} className="w-full h-10 px-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                  <input type="text" maxLength={6} value={editPincode} onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))} className="w-full h-10 px-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none" />
              </div>

              <button
                type="submit"
                disabled={updateCustomerMutation.isPending}
                className="w-full h-11 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm mt-3 transition-colors cursor-pointer"
              >
                {updateCustomerMutation.isPending ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerProfile;
