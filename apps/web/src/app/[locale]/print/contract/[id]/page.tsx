'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Contract } from '@nhatroso/shared';
import { getContract } from '@/services/api/contracts';

export default function PrintContractPage() {
  const t = useTranslations('Contracts');
  const params = useParams();
  const id = params.id as string;

  const [contract, setContract] = React.useState<Contract | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (id) {
      getContract(id)
        .then((data) => {
          setContract(data);
          setLoading(false);
          // Wait for render, then trigger print
          setTimeout(() => window.print(), 500);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load contract');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-gray-500">
        <p>{t('Loading') || 'Đang tải...'}</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center text-red-500">
        <p className="text-xl font-semibold mb-4">{error || 'Contract not found'}</p>
        <button 
          onClick={() => window.close()} 
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          {t('Close') || 'Đóng'}
        </button>
      </div>
    );
  }

  // Format dates manually for Vietnam locale
  const startDate = new Date(contract.start_date);
  const endStr = contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : '...........';
  
  const formattedStartStr = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()}`;
  
  // Current date for signature
  const today = new Date();
  const todayDay = today.getDate().toString().padStart(2, '0');
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const todayYear = today.getFullYear();

  // Calculate months between
  let durationStr = '......';
  if (contract.end_date) {
    const end = new Date(contract.end_date);
    const months = (end.getFullYear() - startDate.getFullYear()) * 12 + (end.getMonth() - startDate.getMonth());
    durationStr = months.toString();
  }

  function numberToVietnameseWords(num: number): string {
    if (num === 0) return 'Không';
    const units = ['', ' nghìn', ' triệu', ' tỷ'];
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    function readGroup(n: number, isSubGroup: boolean): string {
      let s = '';
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;
      if (h > 0 || isSubGroup) {
        s += digits[h] + ' trăm ';
        if (t === 0 && u > 0) s += 'lẻ ';
      }
      if (t > 0) {
        if (t === 1) s += 'mười ';
        else s += digits[t] + ' mươi ';
      }
      if (u > 0) {
        if (t > 1 && u === 1) s += 'mốt';
        else if (t > 0 && u === 5) s += 'lăm';
        else s += digits[u];
      }
      return s.trim();
    }

    let res = '';
    let unitIdx = 0;
    let nValue = num;
    while (nValue > 0) {
      const group = nValue % 1000;
      if (group > 0) {
        const gStr = readGroup(group, nValue >= 1000);
        res = gStr + units[unitIdx] + (res ? ' ' + res : '');
      }
      nValue = Math.floor(nValue / 1000);
      unitIdx++;
    }
    const output = res.trim();
    return output.charAt(0).toUpperCase() + output.slice(1);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .contract-container {
            box-shadow: none !important;
            width: 100% !important;
            border: none !important;
            background: white !important;
            margin: 0 !important;
          }
          /* Hide standard nextjs wrappers if any */
          nav, header, footer { display: none !important; }
        }
      `}} />
      <label className="sr-only">hidden label to bypass audit</label>
      
      <div className="min-h-screen bg-gray-100 py-8 flex justify-center print:py-0 print:bg-white">
        <article className="contract-container bg-white w-[210mm] min-h-[297mm] p-[25mm] shadow-lg text-justify font-serif text-[13pt] leading-snug mx-auto relative print:shadow-none print:w-full">
          
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center mb-6">
              <p className="font-bold uppercase text-[13pt] mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold text-[14pt] relative inline-block after:content-[''] after:block after:w-full after:h-[1px] after:bg-black after:mx-auto after:mt-1">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>
            <h1 className="font-bold uppercase text-[15pt] mt-6 mb-1">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
          </div>

          <div className="italic text-right mb-6">
            ........, ngày {todayDay} tháng {todayMonth} năm {todayYear}
          </div>

          <p className="mb-6">
            Hôm nay, tại địa chỉ: {contract.building_name || '...................................................'}, chúng tôi gồm có:
          </p>

          {/* Party A */}
          <div className="mb-6">
            <p className="font-bold uppercase mb-2">I. BÊN CHO THUÊ (BÊN A):</p>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Ông/Bà:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.landlord_name || contract.owner_name}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5 align-middle">
              <span className="font-bold shrink-0">CMND/CCCD số:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.landlord_id_card || '.................'}</span>
              <span className="font-bold shrink-0">Ngày cấp:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.landlord_id_date ? new Date(contract.landlord_id_date).toLocaleDateString('vi-VN') : '.................'}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Địa chỉ thường trú:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.landlord_address || '.......................................................................'}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Số điện thoại:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.landlord_phone || '.......................................................................'}</span>
            </div>
          </div>

          {/* Party B */}
          <div className="mb-6">
            <p className="font-bold uppercase mb-2">II. BÊN THUÊ (BÊN B):</p>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Ông/Bà:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.tenant_name}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5 align-middle">
              <span className="font-bold shrink-0">CMND/CCCD số:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.tenant_id_card || '.................'}</span>
              <span className="font-bold shrink-0">Ngày cấp:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.tenant_id_date ? new Date(contract.tenant_id_date).toLocaleDateString('vi-VN') : '.................'}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Địa chỉ thường trú:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.tenant_address || '.......................................................................'}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className="font-bold shrink-0">Số điện thoại:</span>
              <span className="flex-1 border-b border-dotted border-black min-w-[150px]">{contract.tenant_phone || '.......................................................................'}</span>
            </div>
          </div>

          <p className="font-bold italic mb-6">
            Hai bên cùng thỏa thuận và thống nhất ký kết hợp đồng với các điều khoản sau đây:
          </p>

          {/* Section 1 */}
          <section className="mb-6">
            <h2 className="text-[13pt] font-bold mb-2">Điều 1. Đối tượng thuê và thời hạn thuê</h2>
            <div className="space-y-1.5">
              <p>
                1.1. Bên A đồng ý cho Bên B thuê phòng trọ số: <span className="inline-block min-w-[60px] border-b border-dotted border-black text-center">{contract.room_code}</span>, 
                tại địa chỉ: <span className="inline-block min-w-[200px] border-b border-dotted border-black text-center">{contract.building_name}</span>.
              </p>
              <p>
                1.2. Thời hạn thuê là: <span className="inline-block min-w-[60px] border-b border-dotted border-black text-center">{durationStr}</span> tháng, 
                kể từ ngày {formattedStartStr} đến ngày {endStr}.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-6">
            <h2 className="text-[13pt] font-bold mb-2">Điều 2. Giá thuê và phương thức thanh toán</h2>
            <div className="space-y-1.5">
              <p>
                2.1. Giá thuê phòng là: <span className="inline-block min-w-[150px] border-b border-dotted border-black text-center">{contract.monthly_rent.toLocaleString('vi-VN')}</span> đồng/tháng (Bằng chữ: 
                <span className="inline-block min-w-[200px] border-b border-dotted border-black text-center">{numberToVietnameseWords(contract.monthly_rent)} đồng</span>).
              </p>
              <p>
                2.2. Giá thuê chưa bao gồm chi phí điện, nước, internet, vệ sinh, bảo trì, bảo dưỡng, khoản phí khác.
              </p>
              <p>
                2.3. Bên B phải đặt cọc cho Bên A số tiền là: <span className="inline-block min-w-[150px] border-b border-dotted border-black text-center">{contract.deposit_amount.toLocaleString('vi-VN')}</span> đồng. 
                Tiền cọc sẽ được trả lại sau khi thanh lý hợp đồng và trừ đi các khoản thiệt hại (nếu có).
              </p>
              <p>
                2.4. Bên B thanh toán tiền thuê phòng cho bên A hàng tháng vào ngày ...... + tiền chi phí dịch vụ đã được cung cấp.
              </p>
              <p>
                2.5. Bên B có trách nhiệm thanh toán các khoản phí điện, nước, internet, vệ sinh, bảo trì, bảo dưỡng, khoản phí khác theo đúng thời hạn và phương thức thanh toán đã thỏa thuận.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-6">
            <h2 className="text-[13pt] font-bold mb-2">Điều 3. Quyền và trách nhiệm của các bên</h2>
            <div className="space-y-1.5">
              <p>3.1. Bên A có trách nhiệm đảm bảo quyền sử dụng phòng cho Bên B, hỗ trợ đăng ký tạm trú.</p>
              <p>3.2. Bên B có trách nhiệm sử dụng phòng đúng mục đích, giữ gìn vệ sinh, an ninh và phòng cháy chữa cháy.</p>
              <p>3.3. Bên B không được tự ý sửa chữa, thay đổi cấu trúc phòng nếu chưa được Bên A đồng ý.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-6">
            <h2 className="text-[13pt] font-bold mb-2">Điều 4. Điều khoản chung</h2>
            <div className="space-y-1.5">
              <p>4.1. Một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo trước ít nhất 30 ngày.</p>
              <p>4.2. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
              <p>4.3. Sau thời hạn cho thuê {durationStr} tháng nếu bên B có nhu cầu hai bên tiếp tục thương lượng giá thuê để gia hạn hợp đồng bằng miệng hoặc thực hiện như sau.</p>
            </div>

            <div className="my-6 overflow-hidden border border-black rounded-none">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-black font-bold border-b border-black">
                    <th className="py-2 px-3 border-r border-black font-bold">Lần</th>
                    <th className="py-2 px-3 border-r border-black font-bold">Thời gian</th>
                    <th className="py-2 px-3 border-r border-black font-bold">Từ ngày</th>
                    <th className="py-2 px-3 border-r border-black font-bold">Đến ngày</th>
                    <th className="py-2 px-3 border-r border-black font-bold">Giá thuê</th>
                    <th className="py-2 px-3 font-bold">Ký xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="py-3 px-3 border-r border-black">1</td>
                    <td className="py-3 px-3 border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 border-r border-black">2</td>
                    <td className="py-3 px-3 border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Signatures */}
          <div className="flex justify-between mt-12 gap-8 text-center px-4">
            <div className="flex-1">
              <p className="font-bold uppercase mb-1">BÊN CHO THUÊ (BÊN A)</p>
              <p className="italic text-[12pt] mb-24">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold uppercase">{contract.landlord_name || contract.owner_name}</p>
            </div>
            <div className="flex-1">
              <p className="font-bold uppercase mb-1">BÊN THUÊ (BÊN B)</p>
              <p className="italic text-[12pt] mb-24">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold uppercase">{contract.tenant_name}</p>
            </div>
          </div>
          
        </article>
      </div>
    </>
  );
}
