import MeterConfigForm from '@/components/meter-requests/MeterConfigForm';

export async function generateMetadata() {
  return {
    title: `Meter Automation - Nhatroso`,
  };
}

export default function MeterSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Meter Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage automation schedules for utility readings
        </p>
      </div>

      <MeterConfigForm />
    </div>
  );
}
