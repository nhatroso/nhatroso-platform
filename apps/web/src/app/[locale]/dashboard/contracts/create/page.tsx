'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

import { useCreateContract } from '@/hooks/contract/useCreateContract';

function maskName(name: string) {
  const parts = name.trim().split(' ');
  return parts
    .map((p, i) => {
      if (i === parts.length - 1)
        return p.length > 1 ? p[0] + '*'.repeat(p.length - 1) : p;
      return p;
    })
    .join(' ');
}

function maskIdCard(id: string) {
  if (id.length <= 4) return id;
  return id.slice(0, 3) + '*'.repeat(id.length - 5) + id.slice(-2);
}

function maskDate(date: string) {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `**/**/${parts[0]}`;
}

export default function CreateContractPage() {
  const {
    rooms,
    isLoadingRooms,
    isSubmitting,
    errorMSG,
    isLookingUp,
    userExists,
    hasActiveContract,
    foundUser,
    register,
    handleSubmit,
    errors,
    watch,
    router,
  } = useCreateContract();

  const watchTenantName = watch('tenant_name');
  const watchTenantIdCard = watch('tenant_id_card');
  const watchTenantIdCardDate = watch('tenant_id_card_date');
  const watchTenantAddress = watch('tenant_address');
  const watchRoomAddress = watch('room_address');

  return (
    <div className="mx-auto max-w-3xl py-8">
      <PageHeader
        variant="full"
        title="Tạo Hợp Đồng Thuê Phòng Mới"
        description="Điền thông tin và ký kết hợp đồng số hóa"
      />

      {errorMSG && (
        <div className="mb-6 rounded-lg bg-danger-light p-4 text-body text-danger dark:bg-danger-dark/20 dark:text-danger-dark">
          {errorMSG}
        </div>
      )}

      {hasActiveContract && (
        <div className="mb-6 rounded-lg bg-warning-light p-4 text-body text-warning dark:bg-warning-dark/20 dark:text-warning-dark">
          <span className="font-semibold">Cảnh báo:</span> Khách hàng này hiện
          đang có hợp đồng thuê trên hệ thống. Vui lòng chắc chắn bạn nhập đúng
          số điện thoại.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-border bg-gray-card p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Phòng
          </label>
          <select
            {...register('room_id')}
            disabled={isLoadingRooms}
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.room_id
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-input'
            } text-gray-text focus:border-primary focus:ring-primary disabled:opacity-50`}
          >
            <option value="">
              {isLoadingRooms ? 'Đang tải...' : '-- Chọn phòng --'}
            </option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.building_name ? `${room.building_name} - ` : ''}
                {room.floor_name ? `${room.floor_name} - ` : ''}
                P.{room.code}
              </option>
            ))}
          </select>
          {errors.room_id && (
            <p className="mt-1 text-tiny text-danger">
              {errors.room_id.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Địa chỉ phòng (tòa nhà)
          </label>
          <input
            {...register('room_address')}
            readOnly
            value={watchRoomAddress || ''}
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.room_address
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-surface'
            } text-gray-text focus:border-primary focus:ring-primary`}
          />
          {errors.room_address && (
            <p className="mt-1 text-tiny text-danger">
              {errors.room_address.message}
            </p>
          )}
        </div>

        <h2 className="text-h3 font-semibold text-gray-text border-b border-gray-border pb-2">
          Thông tin Bên Cho Thuê (Chủ Nhà)
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Owner Details */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Họ và tên
            </label>
            <input
              {...register('owner_name')}
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.owner_name
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.owner_name && (
              <p className="mt-1 text-tiny text-danger">
                {errors.owner_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Số điện thoại
            </label>
            <input
              {...register('owner_phone')}
              className={`block w-full rounded-lg border p-2.5 text-body ${errors.owner_phone ? 'border-danger bg-danger-light' : 'border-gray-border bg-gray-input'} text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.owner_phone && (
              <p className="mt-1 text-tiny text-danger">
                {errors.owner_phone.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Số CMND/CCCD
            </label>
            <input
              {...register('owner_id_card')}
              className={`block w-full rounded-lg border p-2.5 text-body ${errors.owner_id_card ? 'border-danger bg-danger-light' : 'border-gray-border bg-gray-input'} text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.owner_id_card && (
              <p className="mt-1 text-tiny text-danger">
                {errors.owner_id_card.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Ngày cấp CMND/CCCD
            </label>
            <input
              type="date"
              {...register('owner_id_card_date')}
              className={`block w-full rounded-lg border p-2.5 text-body ${errors.owner_id_card_date ? 'border-danger bg-danger-light' : 'border-gray-border bg-gray-input'} text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.owner_id_card_date && (
              <p className="mt-1 text-tiny text-danger">
                {errors.owner_id_card_date.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Địa chỉ thường trú
          </label>
          <input
            {...register('owner_address')}
            className={`block w-full rounded-lg border p-2.5 text-body ${errors.owner_address ? 'border-danger bg-danger-light' : 'border-gray-border bg-gray-input'} text-gray-text focus:border-primary focus:ring-primary`}
          />
          {errors.owner_address && (
            <p className="mt-1 text-tiny text-danger">
              {errors.owner_address.message}
            </p>
          )}
        </div>

        <h2 className="text-h3 font-semibold text-gray-text border-b border-gray-border pb-2 mt-6">
          Thông tin Bên Thuê (Khách hàng)
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Tenant Phone */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-body font-medium text-gray-text">
              Số điện thoại
              {isLookingUp && (
                <span className="text-tiny text-primary italic">
                  Đang kiểm tra...
                </span>
              )}
            </label>
            <input
              {...register('tenant_phone')}
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.tenant_phone
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.tenant_phone && (
              <p className="mt-1 text-tiny text-danger">
                {errors.tenant_phone.message}
              </p>
            )}
            {userExists && !isLookingUp && foundUser && (
              <div className="mt-2.5 space-y-1 rounded-lg border border-success-light bg-success-light p-3 text-tiny text-success dark:border-success-dark/30 dark:bg-success-dark/20 dark:text-success-dark">
                <p className="flex items-center gap-1.5 font-semibold">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Số điện thoại này liên kết với 1 tài khoản trong hệ thống
                </p>
                <p className="ml-5.5 mt-1 text-success opacity-80 italic">
                  Thông tin đã được tự động điền, vui lòng kiểm tra kỹ tính
                  chính xác.
                </p>
              </div>
            )}
          </div>

          {/* Tenant Name */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Họ và tên
            </label>
            <input
              {...register('tenant_name')}
              readOnly={userExists}
              value={
                userExists && foundUser
                  ? maskName(foundUser.name)
                  : watchTenantName || ''
              }
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.tenant_name
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary ${userExists ? 'bg-gray-surface cursor-not-allowed opacity-70' : ''}`}
            />
            {errors.tenant_name && (
              <p className="mt-1 text-tiny text-danger">
                {errors.tenant_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Tenant CMND */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Số CMND/CCCD
            </label>
            <input
              {...register('tenant_id_card')}
              readOnly={userExists}
              value={
                userExists && foundUser?.id_card
                  ? maskIdCard(foundUser.id_card)
                  : watchTenantIdCard || ''
              }
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.tenant_id_card
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary ${userExists ? 'bg-gray-surface cursor-not-allowed opacity-70' : ''}`}
            />
            {errors.tenant_id_card && (
              <p className="mt-1 text-tiny text-danger">
                {errors.tenant_id_card.message}
              </p>
            )}
          </div>

          {/* Tenant CMND Date */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Ngày cấp CMND/CCCD
            </label>
            <input
              type={userExists ? 'text' : 'date'}
              {...register('tenant_id_card_date')}
              readOnly={userExists}
              value={
                userExists && foundUser?.id_card_date
                  ? maskDate(foundUser.id_card_date.split('T')[0])
                  : watchTenantIdCardDate || ''
              }
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.tenant_id_card_date
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary ${userExists ? 'bg-gray-surface cursor-not-allowed opacity-70' : ''}`}
            />
            {errors.tenant_id_card_date && (
              <p className="mt-1 text-tiny text-danger">
                {errors.tenant_id_card_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Tenant Address */}
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Địa chỉ thường trú
          </label>
          <input
            {...register('tenant_address')}
            readOnly={userExists}
            value={
              userExists && foundUser?.address
                ? maskIdCard(foundUser.address)
                : watchTenantAddress || ''
            }
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.tenant_address
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-input'
            } text-gray-text focus:border-primary focus:ring-primary ${userExists ? 'bg-gray-surface cursor-not-allowed opacity-70' : ''}`}
          />
          {errors.tenant_address && (
            <p className="mt-1 text-tiny text-danger">
              {errors.tenant_address.message}
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            {...register('start_date')}
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.start_date
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-input'
            } text-gray-text focus:border-primary focus:ring-primary`}
          />
          {errors.start_date && (
            <p className="mt-1 text-tiny text-danger">
              {errors.start_date.message}
            </p>
          )}
        </div>

        {/* Rental Period */}
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Thời gian thuê (tháng)
          </label>
          <input
            type="number"
            {...register('rental_period', { valueAsNumber: true })}
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.rental_period
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-input'
            } text-gray-text focus:border-primary focus:ring-primary`}
          />
          {errors.rental_period && (
            <p className="mt-1 text-tiny text-danger">
              {errors.rental_period.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="mb-2 block text-body font-medium text-gray-text">
            Ngày kết thúc
          </label>
          <input
            type="date"
            {...register('end_date')}
            readOnly
            className={`block w-full rounded-lg border p-2.5 text-body ${
              errors.end_date
                ? 'border-danger bg-danger-light'
                : 'border-gray-border bg-gray-surface'
            } text-gray-text focus:border-primary focus:ring-primary`}
          />
          {errors.end_date && (
            <p className="mt-1 text-tiny text-danger">
              {errors.end_date.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Monthly Rent */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Giá thuê / tháng (VNĐ)
            </label>
            <input
              type="number"
              {...register('monthly_rent', { valueAsNumber: true })}
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.monthly_rent
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.monthly_rent && (
              <p className="mt-1 text-tiny text-danger">
                {errors.monthly_rent.message}
              </p>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Tiền cọc (VNĐ)
            </label>
            <input
              type="number"
              {...register('deposit_amount', { valueAsNumber: true })}
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.deposit_amount
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.deposit_amount && (
              <p className="mt-1 text-tiny text-danger">
                {errors.deposit_amount.message}
              </p>
            )}
          </div>

          {/* Payment Day */}
          <div>
            <label className="mb-2 block text-body font-medium text-gray-text">
              Ngày thanh toán hàng tháng
            </label>
            <input
              type="number"
              {...register('payment_day', { valueAsNumber: true })}
              className={`block w-full rounded-lg border p-2.5 text-body ${
                errors.payment_day
                  ? 'border-danger bg-danger-light'
                  : 'border-gray-border bg-gray-input'
              } text-gray-text focus:border-primary focus:ring-primary`}
            />
            {errors.payment_day && (
              <p className="mt-1 text-tiny text-danger">
                {errors.payment_day.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-border bg-gray-card px-5 py-2.5 text-body font-medium text-gray-text hover:bg-gray-surface focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-subtle"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo Hợp Đồng'}
          </button>
        </div>
      </form>
    </div>
  );
}
