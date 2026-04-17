import { useState, useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useInvoiceDetail } from './useInvoiceDetail';
import { invoiceService } from '@/services/invoice.service';
import { usePaymentSocket } from './usePaymentSocket';

export const usePayment = (id: string) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    token: string;
    transaction_id: string;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: invoice, isLoading } = useInvoiceDetail(Number(id));

  const onPaymentSuccess = useCallback(() => {
    setIsSuccess(true);
    setTimeout(() => {
      router.dismissAll();
      router.replace('/(main)/(tabs)/dashboard');
    }, 10000);
  }, []);

  const { status: socketStatus } = usePaymentSocket(
    id,
    paymentData?.token,
    onPaymentSuccess,
  );

  useEffect(() => {
    if (invoice?.id && !paymentData && !isSuccess && !isExpired) {
      invoiceService
        .createPayment(invoice.id, Number(invoice.total_amount))
        .then((res) =>
          setPaymentData({
            token: res.token,
            transaction_id: res.transaction_id,
          }),
        )
        .catch((err) =>
          console.error('[Payment] Failed to initiate payment', err),
        );
    }
  }, [invoice?.id, invoice?.total_amount, paymentData, isSuccess, isExpired]);

  useEffect(() => {
    if (
      (socketStatus === 'DISCONNECTED' || socketStatus === 'ERROR') &&
      paymentData &&
      !isSuccess &&
      !isExpired
    ) {
      const timeout = setTimeout(() => setPaymentData(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [socketStatus, paymentData, isSuccess, isExpired]);

  useEffect(() => {
    if (!isSuccess && !isExpired && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSuccess, isExpired, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsExpired(true);
      const timeout = setTimeout(() => {
        router.dismissAll();
        router.replace('/(main)/(tabs)/dashboard');
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [timeLeft]);

  return {
    invoice,
    isLoading,
    isSuccess,
    paymentData,
    isExpired,
    timeLeft,
    socketStatus,
  };
};
