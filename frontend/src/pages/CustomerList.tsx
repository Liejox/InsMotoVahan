import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Phone, 
  Car, 
  ShieldCheck, 
  MapPin, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  alternateNumber?: string;
  whatsappNumber?: string;
  address?: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  vehicles: {
    id: string;
    vehicleNumber: string;
    brand: string;
    model: string;
  }[];
  policyStatus?: 'Active' | 'Expired';
}

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('overall');
  const limit = 8;

  const months = [
    { key: 'overall', label: 'Overall' },
    { key: '1', label: 'January' },
    { key: '2', label: 'February' },
    { key: '3', label: 'March' },
    { key: '4', label: 'April' },
    { key: '5', label: 'May' },
    { key: '6', label: 'June' },
    { key: '7', label: 'July' },
    { key: '8', label: 'August' },
    { key: '9', label: 'September' },
    { key: '10', label: 'October' },
    { key: '11', label: 'November' },
    { key: '12', label: 'December' },
  ];

  // Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Form Fields
  // Step 1: Customer Details
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Vehicle Details
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('PETROL');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  const [plateDuplicateError, setPlateDuplicateError] = useState('');
  const [checkingPlate, setCheckingPlate] = useState(false);

  // Step 3: Policy Details
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  
  const [apiError, setApiError] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // URL triggers opening the wizard
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsWizardOpen(true);
      setWizardStep(1);
      // Remove query param to clean URL
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // Load Companies
  useEffect(() => {
    if (isWizardOpen && companies.length === 0) {
      setLoadingCompanies(true);
      api.get<{ data: { companies: any[] } }>('/policies/companies')
        .then((res) => {
          setCompanies(res.data.companies);
          if (res.data.companies.length > 0) {
            setSelectedCompanyId(res.data.companies[0].id);
          }
        })
        .finally(() => setLoadingCompanies(false));
    }
  }, [isWizardOpen]);

  // 1. Fetch Customers
  const { data, isLoading } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: ['customers', searchTerm, page, sortBy, selectedMonth],
    queryFn: async () => {
      const res = await api.get<{ data: { customers: Customer[]; total: number } }>(
        `/customers?query=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}&sortBy=${sortBy}&month=${selectedMonth}`
      );
      return res.data;
    },
  });

  // Reset pagination on search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Perform Live duplicate vehicle check
  const handleVehicleNumberBlur = async () => {
    const formattedPlate = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formattedPlate.length < 5) return;

    setCheckingPlate(true);
    setPlateDuplicateError('');
    try {
      const res = await api.get<{ data: { isDuplicate: boolean; ownerName: string | null } }>(
        `/vehicles/check-duplicate?vehicleNumber=${formattedPlate}`
      );
      if (res.data.isDuplicate) {
        setPlateDuplicateError(`This vehicle is already registered under ${res.data.ownerName}`);
      }
    } catch (e) {
      // Ignore network errors on live validation
    } finally {
      setCheckingPlate(false);
    }
  };

  // Handle Wizard Submit (Create Customer -> Create Vehicle -> Create Policy)
  const createPolicyMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create customer
      const custRes = await api.post<{ data: { customer: any } }>('/customers', {
        fullName,
        mobileNumber,
        alternateNumber: null,
        whatsappNumber: whatsappNumber || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        notes: notes || null,
      });
      const customer = custRes.data.customer;

      // Step 2: Create vehicle
      const vehRes = await api.post<{ data: { vehicle: any } }>('/vehicles', {
        customerId: customer.id,
        vehicleNumber: vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        vehicleType,
        brand: brand || 'Unknown',
        model: model || 'Unknown',
        fuelType,
        manufacturingYear: manufacturingYear || new Date().getFullYear(),
        engineNumber: null,
        chassisNumber: null,
      });
      const vehicle = vehRes.data.vehicle;

      // Step 3: Issue Policy
      const startIso = new Date(startDate).toISOString();
      const expiryIso = new Date(expiryDate).toISOString();

      await api.post('/policies', {
        vehicleId: vehicle.id,
        companyId: selectedCompanyId,
        policyNumber,
        startDate: startIso,
        expiryDate: expiryIso,
        premiumAmount: 1,
        idv: 1,
        ncb: 0,
        commissionRate: 0,
      });

      return customer.id;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsWizardOpen(false);
      resetForm();
      navigate(`/customers/${customerId}`);
    },
    onError: (err: any) => {
      setApiError(err?.message || 'Error occurred while creating the policy booking');
    }
  });

  const resetForm = () => {
    setFullName('');
    setMobileNumber('');
    setWhatsappNumber('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPincode('');
    setNotes('');

    setVehicleNumber('');
    setBrand('');
    setModel('');
    setPlateDuplicateError('');

    setPolicyNumber('');

    setApiError('');
    setWizardStep(1);
  };

  const validateStep1 = () => {
    if (!fullName || !mobileNumber) return false;
    if (mobileNumber.length !== 10) return false;
    if (pincode && pincode.length !== 6) return false;
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleNumber) return false;
    return true;
  };

  const validateStep3 = () => {
    if (!selectedCompanyId || !policyNumber || !startDate || !expiryDate) return false;
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (expiry <= start) return false;
    return true;
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && validateStep1()) setWizardStep(2);
    else if (wizardStep === 2 && validateStep2()) setWizardStep(3);
  };

  const handlePrevStep = () => {
    if (wizardStep > 1) setWizardStep(wizardStep - 1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-6">
      {/* Top Heading Search Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone, plate..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full h-11 pl-10 pr-4 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="h-11 px-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
          >
            <option value="name_asc">Sort: A–Z (Name)</option>
            <option value="name_desc">Sort: Z–A (Name)</option>
            <option value="month">Sort: Registration Month</option>
          </select>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsWizardOpen(true);
          }}
          className="flex items-center justify-center h-11 px-5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 transition-all cursor-pointer w-full md:w-auto flex-shrink-0"
        >
          <Plus size={18} className="mr-2" />
          Add Policy & Customer
        </button>
      </div>

      {/* Month Filter Tabs */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto scrollbar-none shadow-inner border border-slate-200/50 dark:border-slate-800/50">
        {months.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setSelectedMonth(m.key);
              setPage(1);
            }}
            className={`
              flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer
              ${selectedMonth === m.key 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'}
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Customer Database Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-72">
          <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
          <span className="text-sm text-slate-500">Loading database...</span>
        </div>
      ) : !data || data.customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <User size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <span className="text-base font-semibold text-slate-700 dark:text-slate-350">No customers found</span>
          <p className="text-xs text-slate-500 mt-1">Search again or click 'Add Policy & Customer' to begin booking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.customers.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {c.fullName}
                    </h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex-shrink-0 ${
                      c.policyStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {c.policyStatus || 'Expired'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-slate-500 mt-2 space-x-1">
                    <Phone size={13} />
                    <span>{c.mobileNumber}</span>
                  </div>

                  {c.address && (
                    <div className="flex items-center text-xs text-slate-500 mt-1.5 space-x-1">
                      <MapPin size={13} className="flex-shrink-0" />
                      <span className="truncate">{c.address.city}, {c.address.state}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                    <Car size={13} />
                    <span>{c.vehicles.length} {c.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:translate-x-1 transition-transform">Profile &rarr;</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Showing Page {page} of {totalPages} ({data.total} records)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3-Step Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between animate-fade-in relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Policy Booking</h3>
                <p className="text-xs text-slate-500 mt-0.5">Wizard step {wizardStep} of 3</p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
              {[
                { step: 1, label: 'Customer', icon: User },
                { step: 2, label: 'Vehicle', icon: Car },
                { step: 3, label: 'Policy Details', icon: ShieldCheck }
              ].map((s) => {
                const active = wizardStep === s.step;
                const completed = wizardStep > s.step;
                return (
                  <div key={s.step} className="flex items-center space-x-2">
                    <div className={`
                      flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg transition-all
                      ${active 
                        ? 'bg-brand-600 text-white' 
                        : completed 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}
                    `}>
                      {completed ? '✓' : s.step}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {apiError && (
                <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start space-x-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* STEP 1: Customer Details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number (10 digit) *</label>
                      <input
                        type="text"
                        maxLength={10}
                        required
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">WhatsApp Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="WhatsApp Contact"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Address Line 1</label>
                      <input
                        type="text"
                        placeholder="Door / Flat No, Street Address"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">State</label>
                        <input
                          type="text"
                          placeholder="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="600001"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Notes / Notes</label>
                    <textarea
                      placeholder="Add agent notes about customer..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Vehicle Details */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Number *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="TN07CP1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        onBlur={handleVehicleNumberBlur}
                        className={`
                          w-full h-10.5 px-3 text-sm uppercase bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                          ${plateDuplicateError ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}
                        `}
                      />
                      {checkingPlate && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />
                      )}
                    </div>
                    {plateDuplicateError && (
                      <span className="text-xs text-red-500 block mt-1">{plateDuplicateError}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Type *</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="BIKE">Bike / Two-Wheeler</option>
                        <option value="CAR">Car / Hatchback / SUV</option>
                        <option value="TRUCK">Truck / Commercial Lorry</option>
                        <option value="BUS">Bus / Coach</option>
                        <option value="OTHER">Other / Special Purpose</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Fuel Type *</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="PETROL">Petrol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="ELECTRIC">Electric</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Maruti Suzuki"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mfg Year</label>
                      <input
                        type="number"
                        placeholder={String(new Date().getFullYear())}
                        value={manufacturingYear || ''}
                        onChange={(e) => setManufacturingYear(e.target.value ? parseInt(e.target.value, 10) : 0)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Model Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Swift VXI"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Engine and Chassis fields removed */}
                </div>
              )}

              {/* STEP 3: Policy & Premium Booking */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Insurance Company *</label>
                    {loadingCompanies ? (
                      <div className="text-xs text-slate-400">Loading companies list...</div>
                    ) : (
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Policy Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POL-12345678"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        onFocus={(e) => e.currentTarget.showPicker?.()}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        onFocus={(e) => e.currentTarget.showPicker?.()}
                        className="w-full h-10.5 px-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={wizardStep === 1}
                className="px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-40 transition-colors"
              >
                Previous
              </button>

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={wizardStep === 1 ? !validateStep1() : !validateStep2()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800/40 rounded-xl transition-colors cursor-pointer"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => createPolicyMutation.mutate()}
                  disabled={!validateStep3() || createPolicyMutation.isPending}
                  className="flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 rounded-xl transition-colors cursor-pointer"
                >
                  {createPolicyMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : null}
                  {createPolicyMutation.isPending ? 'Booking...' : 'Issue Policy'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerList;
