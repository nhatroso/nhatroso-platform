'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Service } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ServicesPage() {
  const t = useTranslations('Services');
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form states
  const [name, setName] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await servicesApi.list();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  React.useEffect(() => {
    if (selectedService) {
      setName(selectedService.name);
      setUnit(selectedService.unit);
      setErrorMsg('');
    } else {
      setName('');
      setUnit('');
      setErrorMsg('');
    }
  }, [selectedService, isCreating]);

  const handleCreateNew = () => {
    setSelectedServiceId(null);
    setIsCreating(true);
  };

  const handleSelectService = (id: string) => {
    setIsCreating(false);
    setSelectedServiceId(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) {
      setErrorMsg(t('ErrorInvalid'));
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (isCreating) {
        await servicesApi.create({ name, unit });
        setIsCreating(false);
      } else if (selectedServiceId) {
        await servicesApi.update(selectedServiceId, { name, unit });
      }
      await fetchServices();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('ErrorDuplicate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedServiceId) return;
    try {
      await servicesApi.archive(selectedServiceId);
      setSelectedServiceId(null);
      await fetchServices();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-50 tracking-tight text-zinc-900">
      {/* LEFT COLUMN: LIST */}
      <div
        className={`flex flex-col border-r-4 border-zinc-900 bg-white transition-all duration-300 ease-in-out md:w-1/3 ${
          selectedServiceId || isCreating
            ? 'hidden w-0 md:flex md:w-1/3'
            : 'w-full'
        }`}
      >
        <div className="flex items-center justify-between border-b-4 border-zinc-900 bg-zinc-100 p-6">
          <h1 className="text-2xl font-black uppercase tracking-widest">
            {t('Title')}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Button
            onClick={handleCreateNew}
            className="mb-6 w-full rounded-none border-4 border-zinc-900 bg-zinc-900 py-6 text-sm font-black uppercase !text-white hover:bg-zinc-800"
          >
            {t('CreateNew')}
          </Button>

          {isLoading ? (
            <div className="p-4 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
              {t('Loading')}
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold uppercase tracking-widest text-zinc-400">
              {t('Empty')}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => handleSelectService(srv.id)}
                  className={`group relative cursor-pointer border-4 border-zinc-900 p-4 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] ${
                    selectedServiceId === srv.id
                      ? 'bg-zinc-900 text-white'
                      : srv.status === 'ARCHIVED'
                        ? 'bg-zinc-200 text-zinc-500 line-through opacity-70'
                        : 'bg-white text-zinc-900'
                  }`}
                >
                  <h3 className="text-xl font-black uppercase truncate">
                    {srv.name}
                  </h3>
                  <div className="mt-2 text-sm font-bold uppercase tracking-widest opacity-80">
                    {srv.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL/FORM PANEL */}
      <div
        className={`flex-1 flex-col bg-zinc-50 overflow-y-auto transition-all duration-300 ease-in-out ${
          selectedServiceId || isCreating ? 'flex' : 'hidden md:flex'
        }`}
      >
        {!selectedServiceId && !isCreating ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-300">
                {t('SelectFirst')}
              </h2>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-12">
            <Card className="rounded-none border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
              <CardHeader className="border-b-4 border-zinc-900 bg-zinc-100 pb-8 pt-8">
                <CardTitle className="text-3xl font-black uppercase tracking-tight">
                  {isCreating ? t('CreateNew') : selectedService?.name}
                </CardTitle>
                <CardDescription className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {isCreating
                    ? t('Description')
                    : `${t('StatusLabel')}: ${
                        selectedService?.status === 'ACTIVE'
                          ? t('Active')
                          : t('Archived')
                      }`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSave} className="flex flex-col gap-6">
                  {errorMsg && (
                    <div className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-900">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">
                      {t('NameLabel')}
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('PlaceholderName')}
                      disabled={
                        isSaving || selectedService?.status === 'ARCHIVED'
                      }
                      className="rounded-none border-4 border-zinc-900 bg-white p-4 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">
                      {t('UnitLabel')}
                    </Label>
                    <Input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder={t('PlaceholderUnit')}
                      disabled={
                        isSaving || selectedService?.status === 'ARCHIVED'
                      }
                      className="rounded-none border-4 border-zinc-900 bg-white p-4 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                    />
                  </div>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    {(!selectedService ||
                      selectedService.status !== 'ARCHIVED') && (
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-none border-4 border-zinc-900 bg-zinc-900 px-8 py-6 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-1 hover:bg-zinc-800 hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      >
                        {isSaving ? t('Saving') : t('Save')}
                      </Button>
                    )}

                    {!isCreating && selectedService?.status !== 'ARCHIVED' && (
                      <Button
                        type="button"
                        onClick={handleArchive}
                        disabled={isSaving}
                        variant="outline"
                        className="rounded-none border-4 border-red-600 bg-white px-8 py-6 text-sm font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
                      >
                        {t('Archive')}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
