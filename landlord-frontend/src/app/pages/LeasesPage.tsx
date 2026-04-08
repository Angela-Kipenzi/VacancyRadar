import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  FileSignature,
  ChevronDown,
  ChevronUp,
  Home,
  Users,
  CalendarDays,
  DollarSign,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PenLine,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LeaseAgreementData, YesNo } from '../../types';

// ─── Yes / No radio row ───────────────────────────────────────────────────────
function YesNoRadio({
  id,
  value,
  onChange,
}: {
  id: string;
  value?: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex gap-3">
      {(['yes', 'no'] as YesNo[]).map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              selected
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            <span
              className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                selected ? 'border-white bg-white' : 'border-gray-400 bg-white'
              }`}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </span>
            {opt === 'yes' ? 'Yes' : 'No'}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  description,
  step,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  step: number;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
        {step}
      </div>
      <div className="flex items-start gap-2 pt-0.5">
        <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 leading-none">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Policy row ───────────────────────────────────────────────────────────────
function PolicyRow({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value?: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <YesNoRadio id={id} value={value} onChange={onChange} />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
    active:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Active' },
    pending:    { cls: 'bg-amber-50  text-amber-700  border-amber-200',     icon: Clock,        label: 'Pending Signature' },
    expired:    { cls: 'bg-gray-50   text-gray-600   border-gray-200',      icon: XCircle,      label: 'Expired' },
    terminated: { cls: 'bg-red-50    text-red-700    border-red-200',       icon: AlertCircle,  label: 'Terminated' },
  };
  const cfg = map[status] ?? map.expired;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LeasesPage() {
  const { leases, units, properties, tenants, addLease, user } = useApp();
  const [showForm, setShowForm] = useState(false);

  // Core
  const [tenantId, setTenantId]           = useState('');
  const [unitId, setUnitId]               = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [rentAmount, setRentAmount]       = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('1');
  const [leaseType, setLeaseType]         = useState<'fixed' | 'month-to-month'>('fixed');
  const [notes, setNotes]                 = useState('');

  // Agreement data
  const [agreementData, setAgreementData] = useState<LeaseAgreementData>({});
  const set = (key: keyof LeaseAgreementData, value: LeaseAgreementData[keyof LeaseAgreementData]) =>
    setAgreementData((prev) => ({ ...prev, [key]: value }));

  // Payment methods (checkboxes)
  const paymentOptions = ['Bank Transfer', 'Mobile Money', 'Cash', 'Cheque', 'Credit Card'];
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const togglePayment = (opt: string) =>
    setSelectedPayments((prev) =>
      prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt]
    );

  // Signatures
  const [landlordSignature, setLandlordSignature] = useState('');
  const [landlordSignedDate, setLandlordSignedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Derived
  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId), [unitId, units]);
  const selectedProperty = useMemo(
    () => (selectedUnit ? properties.find((p) => p.id === selectedUnit.propertyId) : null),
    [selectedUnit, properties]
  );

  // Auto-fill from unit
  useEffect(() => {
    if (!selectedUnit) return;
    setRentAmount((p) => p || String(selectedUnit.monthlyRent || ''));
    setDepositAmount((p) => p || String(selectedUnit.securityDeposit || ''));
    setAgreementData((p) => ({
      ...p,
      bedrooms:        p.bedrooms        ?? String(selectedUnit.bedrooms  ?? ''),
      bathrooms:       p.bathrooms       ?? String(selectedUnit.bathrooms ?? ''),
      monthlyRent:     p.monthlyRent     ?? String(selectedUnit.monthlyRent  ?? ''),
      securityDeposit: p.securityDeposit ?? String(selectedUnit.securityDeposit ?? ''),
    }));
  }, [selectedUnit]);

  // Auto-fill from property — always overwrite address when unit changes
  useEffect(() => {
    if (!selectedProperty) return;
    const addr = [
      selectedProperty.address.street,
      selectedProperty.address.city,
      selectedProperty.address.state,
      selectedProperty.address.zipCode,
    ].filter(Boolean).join(', ');
    setAgreementData((p) => ({
      ...p,
      propertyType:    selectedProperty.type,
      propertyAddress: addr,
    }));
  }, [selectedProperty]);

  // Auto-fill tenant
  useEffect(() => {
    if (!tenantId) return;
    const t = tenants.find((t) => t.id === tenantId);
    if (t) setAgreementData((p) => ({ ...p, tenant: p.tenant ?? `${t.firstName} ${t.lastName}`.trim() }));
  }, [tenantId, tenants]);

  // Auto-fill landlord — always populate from account
  useEffect(() => {
    if (user?.name) {
      setAgreementData((p) => ({ ...p, landlord: user.name }));
      setLandlordSignature((p) => p || user.name);
    }
  }, [user?.name]);

  // Sync payment methods
  useEffect(() => {
    set('paymentMethods', selectedPayments.join(', '));
  }, [selectedPayments]);

  const resetForm = () => {
    setTenantId(''); setUnitId(''); setStartDate(''); setEndDate('');
    setRentAmount(''); setDepositAmount(''); setPaymentDueDay('1');
    setLeaseType('fixed'); setNotes(''); setAgreementData({}); setSelectedPayments([]);
    setLandlordSignature(user?.name || '');
    setLandlordSignedDate(new Date().toISOString().slice(0, 10));
  };

  const handleIssueLease = () => {
    const missing: string[] = [];
    if (!agreementData.tenant?.trim() && !tenantId) missing.push('Tenant Name');
    if (!unitId)     missing.push('Unit');
    if (!startDate)  missing.push('Start Date');
    if (!endDate)    missing.push('End Date');
    if (!landlordSignature.trim()) missing.push('Landlord Signature');

    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.join(', ')}`);
      return;
    }
    if (!selectedProperty) { toast.error('Select a valid unit.'); return; }

    const tenant = tenants.find((t) => t.id === tenantId);
    const addr = [
      selectedProperty.address.street,
      selectedProperty.address.city,
      selectedProperty.address.state,
      selectedProperty.address.zipCode,
    ].filter(Boolean).join(', ');

    const payload: LeaseAgreementData = {
      ...agreementData,
      leaseType, startDate, endDate,
      bedrooms:        agreementData.bedrooms        ?? (selectedUnit ? String(selectedUnit.bedrooms)         : undefined),
      bathrooms:       agreementData.bathrooms       ?? (selectedUnit ? String(selectedUnit.bathrooms)        : undefined),
      propertyType:    agreementData.propertyType    ?? selectedProperty.type,
      propertyAddress: agreementData.propertyAddress ?? addr,
      landlord:        agreementData.landlord        ?? user?.name,
      tenant:          agreementData.tenant          ?? (tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : undefined),
      monthlyRent:     agreementData.monthlyRent     ?? rentAmount,
      securityDeposit: agreementData.securityDeposit ?? depositAmount,
    };

    addLease({
      unitId, propertyId: selectedProperty.id, tenantId,
      startDate, endDate,
      monthlyRent:    Number(rentAmount    || 0),
      securityDeposit: Number(depositAmount || 0),
      leaseType, terms: notes, status: 'pending',
      signedAt: null, signatureStatus: 'pending',
      documentUrl: '',
      agreementData: payload,
    });

    toast.success('Lease sent to tenant for review and signature.');
    resetForm();
    setShowForm(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
        <p className="text-gray-500 mt-1">Create and manage rental agreements for your tenants.</p>
      </div>

      {/* Issue Lease card */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-3">
              <FileSignature className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold text-gray-900">Issue a New Lease</h2>
                <p className="text-xs text-gray-500">Fill out the agreement, sign it, then the tenant will sign on their side.</p>
              </div>
            </div>
            <Button
              variant={showForm ? 'outline' : 'default'}
              onClick={() => { setShowForm((p) => !p); if (!showForm) resetForm(); }}
              className="gap-2"
            >
              {showForm
                ? <><ChevronUp className="h-4 w-4" /> Cancel</>
                : <><ChevronDown className="h-4 w-4" /> New Lease</>}
            </Button>
          </div>

          {showForm && (
            <div className="p-6 space-y-6">
              {tenants.length === 0 || units.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  Add at least one tenant and one unit before issuing a lease.
                </div>
              ) : (
                <>
                  {/* ── 1. PARTIES ──────────────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={Users} step={1} title="Parties" description="Type a name or pick from the dropdown. Address & landlord auto-fill." />
                    <div className="grid gap-4 md:grid-cols-2">

                      {/* Tenant Selection */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="tenantNameInput">Tenant Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="tenantNameInput"
                            placeholder="Type full name…"
                            value={agreementData.tenant ?? ''}
                            onChange={(e) => {
                              set('tenant', e.target.value);
                              if (tenantId) setTenantId('');
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Select
                            value={tenantId}
                            onValueChange={(id) => {
                              setTenantId(id);
                              const t = tenants.find((t) => t.id === id);
                              if (t) set('tenant', `${t.firstName} ${t.lastName}`.trim());
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Or select existing tenant…" />
                            </SelectTrigger>
                            <SelectContent align="start">
                              {tenants.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.firstName} {t.lastName}
                                  <span className="ml-1 text-xs text-gray-400">({t.email})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Unit Selection */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="unitDisplayInput">Property / Unit <span className="text-red-500">*</span></Label>
                          <Input
                            id="unitDisplayInput"
                            placeholder="Type unit details…"
                            value={agreementData.occupants?.includes('#') ? '' : (selectedUnit ? `Unit ${selectedUnit.unitNumber}${selectedProperty?.name ? ` — ${selectedProperty.name}` : ''}` : '')}
                            onChange={() => {}}
                            readOnly={false}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Select value={unitId} onValueChange={setUnitId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit…" />
                            </SelectTrigger>
                            <SelectContent align="start">
                              {units.map((u) => {
                                const prop = properties.find((p) => p.id === u.propertyId);
                                return (
                                  <SelectItem key={u.id} value={u.id}>
                                    {prop?.name ?? 'Property'} — Unit {u.unitNumber}
                                    {u.status === 'vacant' && (
                                      <span className="ml-1.5 text-xs text-emerald-600">(Vacant)</span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Landlord — auto-filled, editable */}
                      <div className="space-y-1.5">
                        <Label htmlFor="landlordName">Landlord Name</Label>
                        <Input
                          id="landlordName"
                          value={agreementData.landlord ?? ''}
                          onChange={(e) => set('landlord', e.target.value)}
                        />
                      </div>

                      {/* Property Address — auto-filled on unit select */}
                      <div className="space-y-1.5">
                        <Label htmlFor="propAddr">Property Address</Label>
                        <Input
                          id="propAddr"
                          placeholder="Select a unit to auto-fill…"
                          value={agreementData.propertyAddress ?? ''}
                          onChange={(e) => set('propertyAddress', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {/* ── 2. LEASE TERM ────────────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={CalendarDays} step={2} title="Lease Term" description="Set the duration and type of this rental agreement." />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                        <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Lease Type</Label>
                        <div className="flex gap-3 pt-1">
                          {(['fixed', 'month-to-month'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setLeaseType(type)}
                              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                                leaseType === type
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                                leaseType === type ? 'border-primary' : 'border-gray-400'
                              }`}>
                                {leaseType === type && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </span>
                              {type === 'fixed' ? 'Fixed Term' : 'Month-to-Month'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 3. FINANCIAL TERMS ───────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={DollarSign} step={3} title="Financial Terms" description="Specify rent, deposit, and payment preferences." />
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="rentAmount">Monthly Rent <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input
                            id="rentAmount" type="number" min={0} className="pl-7"
                            value={rentAmount} placeholder="0.00"
                            onChange={(e) => { setRentAmount(e.target.value); set('monthlyRent', e.target.value); }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="depositAmount">Security Deposit</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input
                            id="depositAmount" type="number" min={0} className="pl-7"
                            value={depositAmount} placeholder="0.00"
                            onChange={(e) => { setDepositAmount(e.target.value); set('securityDeposit', e.target.value); }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="paymentDueDay">Rent Due Day</Label>
                        <Select value={paymentDueDay} onValueChange={setPaymentDueDay}>
                          <SelectTrigger id="paymentDueDay">
                            <SelectValue placeholder="Day of month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <Label>Accepted Payment Methods</Label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {paymentOptions.map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                              selectedPayments.includes(opt)
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Checkbox
                              checked={selectedPayments.includes(opt)}
                              onCheckedChange={() => togglePayment(opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── 4. PROPERTY DETAILS ──────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={Home} step={4} title="Property & Unit Details" description="Auto-filled from your selection — adjust as needed." />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Property Type</Label>
                        <Select value={agreementData.propertyType ?? ''} onValueChange={(v) => set('propertyType', v)}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {['apartment', 'house', 'condo', 'studio', 'townhouse', 'duplex'].map((t) => (
                              <SelectItem key={t} value={t} className="capitalize">
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bedrooms</Label>
                        <Select value={agreementData.bedrooms ?? ''} onValueChange={(v) => set('bedrooms', v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['Studio', '1', '2', '3', '4', '5+'].map((b) => (
                              <SelectItem key={b} value={b}>{b === 'Studio' ? 'Studio' : `${b} Bedroom${b === '1' ? '' : 's'}`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bathrooms</Label>
                        <Select value={agreementData.bathrooms ?? ''} onValueChange={(v) => set('bathrooms', v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['1', '1.5', '2', '2.5', '3', '3+'].map((b) => (
                              <SelectItem key={b} value={b}>{b} Bathroom{b === '1' ? '' : 's'}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Occupants</Label>
                        <Input
                          value={agreementData.occupants ?? ''}
                          onChange={(e) => set('occupants', e.target.value)}
                          placeholder="e.g. 2 adults, 1 child"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Authorized Persons</Label>
                        <Input
                          value={agreementData.authorizedPersons ?? ''}
                          onChange={(e) => set('authorizedPersons', e.target.value)}
                          placeholder="Other authorised residents"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Notices to Tenant</Label>
                        <Input
                          value={agreementData.noticesToTenant ?? ''}
                          onChange={(e) => set('noticesToTenant', e.target.value)}
                          placeholder="e.g. 30 days written notice"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="furnishings">Furnishings Included</Label>
                        <Textarea id="furnishings" rows={2} value={agreementData.furnishings ?? ''} onChange={(e) => set('furnishings', e.target.value)} placeholder="List any included furniture…" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="appliances">Appliances Included</Label>
                        <Textarea id="appliances" rows={2} value={agreementData.appliances ?? ''} onChange={(e) => set('appliances', e.target.value)} placeholder="Refrigerator, washing machine…" />
                      </div>
                    </div>
                  </div>

                  {/* ── 5. POLICIES ──────────────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={ShieldCheck} step={5} title="Lease Policies" description="Specify what is and isn't permitted under this agreement." />
                    <div className="grid gap-0 md:grid-cols-2 md:gap-x-10">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Occupancy</p>
                        <PolicyRow id="pets"       label="Pets Allowed"           hint="Cats, dogs, or other animals"       value={agreementData.pets}                    onChange={(v) => set('pets', v)} />
                        <PolicyRow id="smoking"    label="Smoking Permitted"       hint="Inside the unit or premises"        value={agreementData.smokingPolicy}           onChange={(v) => set('smokingPolicy', v)} />
                        <PolicyRow id="subletting" label="Subletting Allowed"      hint="Tenant may sublet the unit"         value={agreementData.subletting}              onChange={(v) => set('subletting', v)} />
                        <PolicyRow id="parking"    label="Parking Included"        hint="Dedicated parking provided"         value={agreementData.parking}                 onChange={(v) => set('parking', v)} />
                        <PolicyRow id="utilities"  label="Utilities Included"      hint="Water, electricity, gas, etc."      value={agreementData.utilitiesServices}        onChange={(v) => set('utilitiesServices', v)} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Financial & Legal</p>
                        <PolicyRow id="earlyMoveIn"    label="Early Move-In Allowed"          value={agreementData.earlyMoveIn}            onChange={(v) => set('earlyMoveIn', v)} />
                        <PolicyRow id="prepaidRent"    label="Prepaid Rent Required"           value={agreementData.prepaidRent}            onChange={(v) => set('prepaidRent', v)} />
                        <PolicyRow id="lateFee"        label="Late Payment Fee"                value={agreementData.lateFee}                onChange={(v) => set('lateFee', v)} />
                        <PolicyRow id="nsfFee"         label="NSF / Returned Cheque Fee"       value={agreementData.nsfFee}                 onChange={(v) => set('nsfFee', v)} />
                        <PolicyRow id="rentersIns"     label="Renters Insurance Required"      value={agreementData.rentersInsurance}       onChange={(v) => set('rentersInsurance', v)} />
                        <PolicyRow id="inspection"     label="Move-In Inspection"              value={agreementData.moveInInspection}       onChange={(v) => set('moveInInspection', v)} />
                        <PolicyRow id="leadPaint"      label="Lead-Based Paint Disclosure"     value={agreementData.leadBasedPaintDisclosure} onChange={(v) => set('leadBasedPaintDisclosure', v)} />
                        <PolicyRow id="cosigner"       label="Co-Signer Required"              value={agreementData.cosigner}               onChange={(v) => set('cosigner', v)} />
                      </div>
                    </div>
                  </div>

                  {/* ── 6. ADDITIONAL TERMS ──────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={FileText} step={6} title="Additional Terms" description="Any extra clauses or special conditions for this agreement." />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="additionalTerms">Additional Terms or Conditions</Label>
                        <Textarea id="additionalTerms" rows={4} value={agreementData.additionalTerms ?? ''} onChange={(e) => set('additionalTerms', e.target.value)} placeholder="Enter any additional clauses, rules, or conditions…" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="notes">Internal Notes <span className="text-gray-400 font-normal text-xs">(not visible to tenant)</span></Label>
                        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes for your records only…" />
                      </div>
                    </div>
                  </div>

                  {/* ── 7. SIGNATURES ────────────────────────────────── */}
                  <div className="rounded-xl border p-5">
                    <SectionHeader icon={PenLine} step={7} title="Signatures" description="You sign first. The tenant will receive the lease and sign on their side." />

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Landlord signature */}
                      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-gray-800">Landlord Signature</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="landlordSig">Signatue <span className="text-red-500">*</span></Label>
                          <Input
                            id="landlordSig"
                            className="font-serif text-base italic"
                            placeholder="Sign here"
                            value={landlordSignature}
                            onChange={(e) => setLandlordSignature(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="landlordSigDate">Date</Label>
                          <Input
                            id="landlordSigDate"
                            type="date"
                            value={landlordSignedDate}
                            onChange={(e) => setLandlordSignedDate(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          By signing above, you confirm that this lease is accurate and ready to send.
                        </p>
                      </div>

                      {/* Tenant signature (pending) */}
                      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <p className="text-sm font-semibold text-gray-700">Tenant Signature</p>
                        </div>
                        <div className="py-6 text-center">
                          <p className="text-2xl font-serif italic text-gray-300">____________________</p>
                          <p className="text-xs text-gray-400 mt-2">Awaiting tenant signature</p>
                        </div>
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                          The tenant will be notified to review and sign this lease.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── ACTIONS ──────────────────────────────────────── */}
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 border px-5 py-4">
                    <p className="text-sm text-gray-500">
                      Once issued, the tenant will be notified to sign.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => { resetForm(); setShowForm(false); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleIssueLease} className="gap-2">
                        <FileSignature className="h-4 w-4" />
                        Issue Lease
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── LEASES LIST ─────────────────────────────────────────────────────── */}
      {leases.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileSignature className="h-14 w-14 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No leases yet</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Issue your first lease above. All active and past agreements will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {leases.length} Lease{leases.length !== 1 ? 's' : ''}
          </h2>
          {leases.map((lease) => {
            const unit     = units.find((u) => u.id === lease.unitId);
            const property = properties.find((p) => p.id === lease.propertyId);
            const tenant   = tenants.find((t) => t.id === lease.tenantId);

            return (
              <Card key={lease.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {tenant?.firstName ?? '—'} {tenant?.lastName ?? ''}
                        </h3>
                        <StatusBadge status={lease.status} />
                        {lease.signatureStatus === 'pending' && lease.status !== 'active' && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 gap-1">
                            <Clock className="h-3 w-3" />
                            Awaiting Tenant Signature
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-x-6 gap-y-1.5 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="text-xs text-gray-400 block">Property</span>
                          {property?.name ?? '—'} — Unit {unit?.unitNumber ?? '—'}
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Monthly Rent</span>
                          ${lease.monthlyRent.toLocaleString()}/mo
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Lease Period</span>
                          {format(new Date(lease.startDate), 'MMM d, yyyy')} → {format(new Date(lease.endDate), 'MMM d, yyyy')}
                        </div>
                        {lease.signedAt && (
                          <div>
                            <span className="text-xs text-gray-400 block">Signed</span>
                            {format(new Date(lease.signedAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
