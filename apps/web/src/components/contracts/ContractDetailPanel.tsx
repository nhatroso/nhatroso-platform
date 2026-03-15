import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Contract,
  CreateContractInput,
  Room,
  TenantLookupResult,
} from '@nhatroso/shared';
import {
  createContract,
  endContract,
  getAvailableRooms,
  lookupTenantByPhone,
} from '@/services/api/contracts';
import { priceRulesApi } from '@/services/api/price-rules';
import { servicesApi } from '@/services/api/services';

interface ContractDetailPanelProps {
  contract: Contract | null;
  isCreating: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContractDetailPanel({
  contract,
  isCreating,
  onClose,
  onSuccess,
}: ContractDetailPanelProps) {
  const t = useTranslations('Contracts');
  const tErr = useTranslations('Errors');

  // Form state
  const [roomId, setRoomId] = React.useState('');
  const [tenantPhone, setTenantPhone] = React.useState('');
  const [tenantName, setTenantName] = React.useState('');
  const [tenantIdCard, setTenantIdCard] = React.useState('');
  const [tenantIdDate, setTenantIdDate] = React.useState('');
  const [tenantAddress, setTenantAddress] = React.useState('');

  const [landlordName, setLandlordName] = React.useState('');
  const [landlordIdCard, setLandlordIdCard] = React.useState('');
  const [landlordIdDate, setLandlordIdDate] = React.useState('');
  const [landlordAddress, setLandlordAddress] = React.useState('');
  const [landlordPhone, setLandlordPhone] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [leaseDuration, setLeaseDuration] = React.useState<number>(12);
  const [depositAmount, setDepositAmount] = React.useState<number>(0);
  const [monthlyRent, setMonthlyRent] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Room dropdown state
  const [availableRooms, setAvailableRooms] = React.useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = React.useState(false);

  // Tenant lookup state
  const [lookupResult, setLookupResult] =
    React.useState<TenantLookupResult | null>(null);
  const [lookingUp, setLookingUp] = React.useState(false);
  const lookupTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Fetch available rooms when entering creation mode
  React.useEffect(() => {
    if (isCreating) {
      setLoadingRooms(true);
      getAvailableRooms()
        .then(setAvailableRooms)
        .catch(() => setAvailableRooms([]))
        .finally(() => setLoadingRooms(false));
    }
  }, [isCreating]);

  // Reset form when switching modes
  React.useEffect(() => {
    if (!isCreating && contract) {
      setRoomId(contract.room_id);
      setStartDate(contract.start_date);
      setTenantPhone('');
      setTenantName('');
      setTenantIdCard(contract.tenant_id_card || '');
      setTenantIdDate(contract.tenant_id_date || '');
      setTenantAddress(contract.tenant_address || '');
      setLandlordName(contract.landlord_name || '');
      setLandlordIdCard(contract.landlord_id_card || '');
      setLandlordIdDate(contract.landlord_id_date || '');
      setLandlordAddress(contract.landlord_address || '');
      setLandlordPhone(contract.landlord_phone || '');
      setLookupResult(null);
      setDepositAmount(contract.deposit_amount ?? 0);
      setMonthlyRent(contract.monthly_rent ?? 0);
    } else {
      setRoomId('');
      setTenantPhone('');
      setTenantName('');
      setTenantIdCard('');
      setTenantIdDate('');
      setTenantAddress('');
      setLandlordName('');
      setLandlordIdCard('');
      setLandlordIdDate('');
      setLandlordAddress('');
      setLandlordPhone('');
      setStartDate(new Date().toISOString().split('T')[0]);
      // Default end date to 1 year from now
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setEndDate(nextYear.toISOString().split('T')[0]);
      setLeaseDuration(12);
      setLookupResult(null);
      setDepositAmount(0);
      setMonthlyRent(0);
    }
    setError(null);
  }, [contract, isCreating]);

  // Handle automatic monthly rent population
  React.useEffect(() => {
    const fetchRoomPrice = async () => {
      if (isCreating && roomId) {
        try {
          const [allServices, rules] = await Promise.all([
            servicesApi.list(),
            priceRulesApi.listByRoom(roomId),
          ]);
          
          // Find the "Room" service (Phòng)
          const roomService = allServices.find(s => 
            s.name.toLowerCase().includes('phòng') || 
            s.name.toLowerCase().includes('room')
          );

          if (roomService) {
            // Find active rule for this service
            const activeRule = rules.find(r => 
              r.service_id === roomService.id && !r.effective_end
            );
            if (activeRule) {
              setMonthlyRent(Number(activeRule.unit_price));
            }
          }
        } catch (err) {
          console.error('Failed to fetch room price', err);
        }
      }
    };

    fetchRoomPrice();
  }, [roomId, isCreating]);

  // Handle automatic end date calculation
  React.useEffect(() => {
    if (isCreating && startDate && leaseDuration > 0) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setMonth(end.getMonth() + Number(leaseDuration));
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [startDate, leaseDuration, isCreating]);

  // Debounced phone lookup
  const handlePhoneChange = (value: string) => {
    setTenantPhone(value);
    setLookupResult(null);
    setTenantName('');

    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 9) {
      lookupTimerRef.current = setTimeout(async () => {
        setLookingUp(true);
        try {
          const result = await lookupTenantByPhone(trimmed);
          setLookupResult(result);
          if (result.found && result.user) {
            setTenantName(result.user.name);
          }
        } catch {
          // silently fail lookup
        } finally {
          setLookingUp(false);
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isCreating) {
        if (!roomId) {
          setError(t('RoomRequired'));
          setIsSubmitting(false);
          return;
        }

        if (!tenantPhone.trim()) {
          setError(t('TenantsRequired'));
          setIsSubmitting(false);
          return;
        }

        const payload: CreateContractInput = {
          room_id: roomId,
          tenant_phone: tenantPhone.trim(),
          tenant_name: lookupResult?.found
            ? lookupResult?.user?.name || tenantName
            : tenantName.trim(),
          tenant_id_card: tenantIdCard.trim(),
          tenant_id_date: tenantIdDate,
          tenant_address: tenantAddress.trim(),
          landlord_name: landlordName.trim(),
          landlord_id_card: landlordIdCard.trim(),
          landlord_id_date: landlordIdDate,
          landlord_address: landlordAddress.trim(),
          landlord_phone: landlordPhone.trim(),
          start_date: startDate,
          end_date: endDate,
          payment_cycle: 'MONTHLY',
          deposit_amount: depositAmount,
          monthly_rent: monthlyRent,
        };
        await createContract(payload);
        onSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(tErr(err.message) || err.message);
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndContract = async () => {
    if (!contract) return;

    if (!window.confirm(t('ConfirmEndContract'))) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await endContract(contract.id, { end_date: today });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(tErr(err.message) || err.message);
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/50 px-6 py-5 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isCreating ? t('CreateNewContract') : t('ContractDetails')}
          </h2>
          {!isCreating && contract && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  contract.status === 'ACTIVE'
                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20'
                    : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-600/20'
                }`}
              >
                {t(contract.status === 'ACTIVE' ? 'Active' : 'Ended')}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 md:hidden dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label={t('Close')}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 dark:border-gray-700/50 dark:bg-gray-800 dark:ring-white/10">
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-5">
              {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  {t('PropertyDetails')}
                </h3>
                <div className="grid grid-cols-3 gap-x-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {t('Building')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium truncate">
                      {isCreating ? (
                        availableRooms.find(r => r.id === roomId)?.building_name || '-'
                      ) : (
                        contract?.building_name
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {t('Floor')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium truncate">
                      {isCreating ? (
                        availableRooms.find(r => r.id === roomId)?.floor_name || '-'
                      ) : (
                        contract?.floor_name || '-'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {t('Room')}
                    </label>
                    <div className="mt-1">
                      {isCreating ? (
                        <select
                          id="roomId"
                          required
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                        >
                          <option value="">
                            {loadingRooms ? '...' : t('SelectRoom')}
                          </option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.code}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                          {contract?.room_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Party A: Landlord --- */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  {t('LandlordInfo') || 'Thông tin Chủ nhà'} (Bên A)
                </h3>
                {isCreating ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('FullName')} <span className="text-red-500">*</span></label>
                      <input type="text" required value={landlordName} onChange={(e) => setLandlordName(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('PhoneNumber')} <span className="text-red-500">*</span></label>
                      <input type="tel" required value={landlordPhone} onChange={(e) => setLandlordPhone(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('IdCard')} <span className="text-red-500">*</span></label>
                      <input type="text" required value={landlordIdCard} onChange={(e) => setLandlordIdCard(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('IdCardDate')} <span className="text-red-500">*</span></label>
                      <input type="date" required value={landlordIdDate} onChange={(e) => setLandlordIdDate(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Address')} <span className="text-red-500">*</span></label>
                      <input type="text" required value={landlordAddress} onChange={(e) => setLandlordAddress(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('FullName') || 'Họ và tên'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.landlord_name || contract?.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('PhoneNumber') || 'Số điện thoại'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.landlord_phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('IdCard') || 'CMND/CCCD'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.landlord_id_card || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('IdCardDate') || 'Ngày cấp'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.landlord_id_date || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('Address') || 'Địa chỉ'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.landlord_address || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* --- Party B: Tenant --- */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  {t('TenantInfo') || 'Thông tin Người thuê'} (Bên B)
                </h3>
                {isCreating ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="tenantPhone" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('PhoneNumber') || 'Số điện thoại'} <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input id="tenantPhone" type="tel" required value={tenantPhone} onChange={(e) => handlePhoneChange(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" placeholder="0901234567" />
                        {lookingUp && <p className="mt-1 text-xs text-gray-500">{t('LookingUp')}</p>}
                      </div>
                      
                      {lookupResult && (
                        <div className="mt-2">
                          {lookupResult.found && lookupResult.user ? (
                            <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20 text-sm font-medium text-green-800 dark:text-green-400 flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {t('TenantFound')}: {lookupResult.user.name}
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{t('TenantNotFound')}</p>
                          )}
                          {lookupResult.has_active_contract && (
                            <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{t('TenantAlreadyHasActiveContract')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('FullName')} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" required value={tenantName} onChange={(e) => setTenantName(e.target.value)} disabled={!!lookupResult?.found} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 disabled:opacity-50 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('IdCard')} <span className="text-red-500">*</span></label>
                      <input type="text" required value={tenantIdCard} onChange={(e) => setTenantIdCard(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('IdCardDate')} <span className="text-red-500">*</span></label>
                      <input type="date" required value={tenantIdDate} onChange={(e) => setTenantIdDate(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Address')} <span className="text-red-500">*</span></label>
                      <input type="text" required value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('FullName') || 'Họ và tên'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.tenant_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('PhoneNumber') || 'Số điện thoại'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.tenant_phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('IdCard') || 'CMND/CCCD'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.tenant_id_card || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('IdCardDate') || 'Ngày cấp'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.tenant_id_date || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('Address') || 'Địa chỉ'}</p>
                      <p className="text-sm font-medium dark:text-white">{contract?.tenant_address || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  {t('StartDate')} <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  {isCreating ? (
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {contract?.start_date}
                    </p>
                  )}
                </div>
              </div>


              {/* Lease Duration */}
              {isCreating && (
                <div>
                  <label
                    htmlFor="leaseDuration"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {t('LeaseDuration') || 'Thời hạn thuê'} (
                    {t('Months') || 'tháng'})
                  </label>
                  <div className="mt-2">
                    <input
                      id="leaseDuration"
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={leaseDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          setLeaseDuration(val);
                        } else if (e.target.value === '') {
                          // Allow empty during typing but maybe set to 1 on blur or similar
                          // For now just keep it as is
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val <= 0) {
                          setLeaseDuration(1);
                        }
                      }}
                      className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* End Date */}
              {isCreating ? (
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {t('EndDate')} <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="endDate"
                      type="date"
                      required
                      readOnly
                      value={endDate}
                      className="block w-full rounded-md border-0 py-2.5 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                contract?.end_date && (
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                      {t('EndDate')}
                    </label>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {contract.end_date}
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Monthly Rent */}
              <div>
                <label
                  htmlFor="monthlyRent"
                  className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  {t('MonthlyRent') || 'Tiền thuê hàng tháng'} <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  {isCreating ? (
                    <input
                      id="monthlyRent"
                      type="number"
                      required
                      min="0"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(contract?.monthly_rent ?? 0).toLocaleString()} VND
                    </p>
                  )}
                </div>
              </div>

              {/* Deposit Amount */}
              <div>
                <label
                  htmlFor="depositAmount"
                  className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  {t('DepositAmount')} <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  {isCreating ? (
                    <input
                      id="depositAmount"
                      type="number"
                      required
                      min="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(contract?.deposit_amount ?? 0).toLocaleString()} VND
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-900/5 pt-6 dark:border-white/5">
              {!isCreating && contract && (
                <a
                  href={`/print/contract/${contract.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-700"
                >
                  {t('PrintContract') || 'In hợp đồng'}
                </a>
              )}

              {!isCreating && contract?.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={handleEndContract}
                  disabled={isSubmitting}
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50 dark:bg-transparent dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                >
                  {isSubmitting ? '...' : t('EndContract')}
                </button>
              )}

              {isCreating && (
                <button
                  type="submit"
                  disabled={isSubmitting || lookupResult?.has_active_contract}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {isSubmitting ? t('Save') : t('CreateNewContract')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
