'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsService } from '@/services/api/contracts';
import { ContractResponse } from '@nhatroso/shared';

// Use same tailwind classes that mimic the provided CSS or convert inline
export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = React.useState<ContractResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMSG, setErrorMSG] = React.useState('');

  React.useEffect(() => {
    if (!contractId) return;

    contractsService
      .getById(contractId)
      .then(setContract)
      .catch((err) => setErrorMSG(err?.message || 'Failed to load contract'))
      .finally(() => setIsLoading(false));
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (errorMSG || !contract) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          {errorMSG || 'Contract not found'}
        </div>
        <button
          className="mt-4 text-blue-600 underline"
          onClick={() => router.back()}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-4 flex justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          &larr; Quay lại
        </button>
        <button
          onClick={handlePrint}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          In Hợp Đồng
        </button>
      </div>

      {/* Print area - A4 styled box */}
      <div
        className="bg-white p-10 shadow-lg print:p-0 print:shadow-none text-black mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: '"Times New Roman", serif',
        }}
      >
        <header className="text-center mb-8">
          <div className="mb-6 flex flex-col items-center">
            <p className="text-lg font-bold uppercase mb-1">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xl font-bold relative inline-block border-b border-black pb-1">
              Độc lập - Tự do - Hạnh phúc
            </p>
          </div>
          <h1 className="text-2xl font-bold uppercase mb-2">
            HỢP ĐỒNG THUÊ PHÒNG TRỌ
          </h1>
        </header>

        {/* contract created date */}
        <p className="mb-6 indent-8">
          Hôm nay, ngày{' '}
          {new Date(contract.created_at).getDate().toString().padStart(2, '0')}{' '}
          tháng{' '}
          {(new Date(contract.created_at).getMonth() + 1)
            .toString()
            .padStart(2, '0')}{' '}
          năm {new Date(contract.created_at).getFullYear()}, chúng tôi gồm có:
        </p>

        {/* Party A */}
        <div className="mb-6 leading-relaxed">
          <p className="font-bold uppercase mb-2">I. BÊN CHO THUÊ (BÊN A):</p>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Ông/Bà:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.owner_name}
            </span>
          </div>
          <div className="flex gap-4 mb-2 flex-wrap sm:flex-nowrap">
            <div className="flex gap-2 whitespace-nowrap">
              <span className="font-bold">CMND/CCCD số:</span>
              <span className="border-b border-dotted border-black w-40 font-medium">
                {contract.owner_id_card}
              </span>
            </div>
            <div className="flex gap-2 whitespace-nowrap">
              <span className="font-bold">Ngày cấp:</span>
              <span className="border-b border-dotted border-black w-32 font-medium">
                {contract.owner_id_card_date}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Địa chỉ thường trú:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.owner_address}
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Số điện thoại:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.owner_phone}
            </span>
          </div>
        </div>

        {/* Party B */}
        <div className="mb-6 leading-relaxed">
          <p className="font-bold uppercase mb-2">II. BÊN THUÊ (BÊN B):</p>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Ông/Bà:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.tenant_name}
            </span>
          </div>
          <div className="flex gap-4 mb-2 flex-wrap sm:flex-nowrap">
            <div className="flex gap-2 whitespace-nowrap">
              <span className="font-bold">CMND/CCCD số:</span>
              <span className="border-b border-dotted border-black w-40 font-medium">
                {contract.tenant_id_card}
              </span>
            </div>
            <div className="flex gap-2 whitespace-nowrap">
              <span className="font-bold">Ngày cấp:</span>
              <span className="border-b border-dotted border-black w-32 font-medium">
                {contract.tenant_id_card_date}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Địa chỉ thường trú:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.tenant_address}
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="font-bold shrink-0">Số điện thoại:</span>
            <span className="flex-1 border-b border-dotted border-black min-w-[200px] font-medium">
              {contract.tenant_phone}
            </span>
          </div>
        </div>

        <p className="font-bold italic mb-6">
          Hai bên cùng thỏa thuận và thống nhất ký kết hợp đồng với các điều
          khoản sau đây:
        </p>

        {/* Section 1 */}
        <section className="mb-6 leading-relaxed">
          <h2 className="font-bold mb-2">
            Điều 1. Đối tượng thuê và thời hạn thuê
          </h2>
          <div className="pl-4">
            <p className="mb-1">
              1.1. Bên A đồng ý cho Bên B thuê phòng trọ:{' '}
              <span className="inline-block border-b border-dotted border-black min-w-[100px] text-center font-bold">
                {contract.room_code}
              </span>
              , tại địa chỉ:{' '}
              <span className="inline-block border-b border-dotted border-black min-w-[200px] text-center font-bold">
                {contract.room_address}
              </span>
              .
            </p>
            <p className="mb-1">
              1.2. Thời hạn thuê là:{' '}
              <span className="inline-block border-b border-dotted border-black min-w-[30px] text-center font-bold">
                {contract.rental_period}
              </span>{' '}
              tháng, kể từ ngày
              <span className="inline-block border-b border-dotted border-black min-w-[100px] text-center font-bold">
                {contract.start_date}
              </span>
              đến ngày
              <span className="inline-block border-b border-dotted border-black min-w-[100px] text-center font-bold">
                {contract.end_date}
              </span>
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-6 leading-relaxed">
          <h2 className="font-bold mb-2">
            Điều 2. Giá thuê và phương thức thanh toán
          </h2>
          <div className="pl-4">
            <p className="mb-1">
              2.1. Giá thuê phòng là:{' '}
              <span className="inline-block border-b border-dotted border-black min-w-[100px] text-center font-bold">
                {contract.monthly_rent.toLocaleString()}
              </span>{' '}
              đồng/tháng.
            </p>
            <p className="mb-1">
              2.2. Giá thuê chưa bao gồm chi phí điện, nước, internet, vệ sinh,
              bảo trì, bảo dưỡng, khoản phí khác.
            </p>
            <p className="mb-1">
              2.3. Bên B phải đặt cọc cho Bên A số tiền là:{' '}
              <span className="inline-block border-b border-dotted border-black min-w-[100px] text-center font-bold">
                {contract.deposit_amount.toLocaleString()}
              </span>{' '}
              đồng. Tiền cọc sẽ được trả lại sau khi thanh lý hợp đồng và trừ đi
              các khoản thiệt hại (nếu có).
            </p>
            <p className="mb-1">
              2.4. Bên B thanh toán tiền thuê phòng cho bên A hàng tháng vào
              ngày
              <span className="inline-block border-b border-dotted border-black min-w-[30px] text-center font-bold">
                {contract.payment_day}
              </span>{' '}
              + tiền chi phí dịch vụ.
            </p>
            <p className="mb-1">
              2.5. Bên B có trách nhiệm thanh toán các khoản phí đúng thời hạn.
            </p>
          </div>
        </section>

        {/* Section 3 & 4 */}
        <section className="mb-6 leading-relaxed">
          <h2 className="font-bold mb-2">
            Điều 3. Quyền và trách nhiệm của các bên
          </h2>
          <div className="pl-4">
            <p className="mb-1">
              3.1. Bên A có trách nhiệm đảm bảo quyền sử dụng phòng cho Bên B,
              hỗ trợ đăng ký tạm trú.
            </p>
            <p className="mb-1">
              3.2. Bên B có trách nhiệm sử dụng phòng đúng mục đích, giữ gìn vệ
              sinh, an ninh và phòng cháy chữa cháy.
            </p>
            <p className="mb-1">
              3.3. Bên B không được tự ý sửa chữa, thay đổi cấu trúc phòng nếu
              chưa được Bên A đồng ý.
            </p>
          </div>
        </section>

        <section className="mb-6 leading-relaxed">
          <h2 className="font-bold mb-2">Điều 4. Điều khoản chung</h2>
          <div className="pl-4">
            <p className="mb-1">
              4.1. Một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông
              báo trước ít nhất 30 ngày.
            </p>
            <p className="mb-1">
              4.2. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau,
              mỗi bên giữ 01 bản.
            </p>
          </div>
        </section>

        {/* Signatures */}
        <div className="flex justify-between mt-12 mb-32 px-10">
          <div className="text-center">
            <p className="font-bold uppercase mb-1">BÊN CHO THUÊ (BÊN A)</p>
            <p className="italic mb-24">(Ký và ghi rõ họ tên)</p>
            <p className="font-bold uppercase">{contract.owner_name}</p>
          </div>
          <div className="text-center">
            <p className="font-bold uppercase mb-1">BÊN THUÊ (BÊN B)</p>
            <p className="italic mb-24">(Ký và ghi rõ họ tên)</p>
            <p className="font-bold uppercase">{contract.tenant_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
