"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Phone,
  Search,
  Stethoscope,
  User,
  UserPlus,
  UserSquare2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import {
  patientsCol,
  patientFullName,
} from "@/lib/data/patients";
import { servicesCol, formatPrice } from "@/lib/data/services";
import {
  companiesCol,
  matchesCompany,
  type Company,
} from "@/lib/data/companies";
import { buildItem, calcTotals, createCharge } from "@/lib/data/reception";
import type { Patient, Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import useRetrieveServices from "../queries/retrieve";
import { useRouter } from "next/navigation";

type Step = "patient" | "order";
type ClientType = "person" | "company";
type OrderCategory = "ambulatory" | "hospitalized" | "emergency";

interface CartEntry {
  service: Service;
  item: ReturnType<typeof buildItem>;
}

// ==========================================
// SUBCOMPONENTES REALES (Antes faltaban por implementar)
// ==========================================

function PartyChip({
  patient,
  company,
  clientType,
  category,
}: {
  patient: Patient | null;
  company: Company | null;
  clientType: ClientType;
  category: OrderCategory;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-slate-100/80 p-3 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <User className="h-4 w-4 text-slate-500" />
        <span>
          {clientType === "person"
            ? patient
              ? patientFullName(patient)
              : "Paciente Particular"
            : company
            ? `Empresa: ${company.name}`
            : "Factura a Empresa"}
        </span>
      </div>
      {patient && clientType === "company" && (
        <Badge variant="outline" className="text-xs">
          Empleado: {patientFullName(patient)}
        </Badge>
      )}
      <Badge
        variant={category === "emergency" ? "destructive" : "secondary"}
        className="ml-auto uppercase text-[10px]"
      >
        {category}
      </Badge>
    </div>
  );
}

function SelectedCard({
  title,
  subtitle,
  extra,
  onClear,
}: {
  title: string;
  subtitle: string;
  extra?: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">
          {subtitle} {extra && `· ${extra}`}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
        active
          ? "bg-white text-slate-900 shadow-sm border-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700"
          : "text-muted-foreground border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60",
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function CatPill({ active, label, count }: { active?: boolean; label: string; count: number }) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className={cn(
        "cursor-pointer text-xs rounded-full px-2.5 py-0.5",
        active && "bg-[color:var(--brand-primary,#00A99D)] text-white hover:bg-[color:var(--brand-primary,#00A99D)]/90"
      )}
    >
      {label} <span className="ml-1 opacity-70">({count})</span>
    </Badge>
  );
}

// Fallbacks de seguridad si no tienes creados los formularios inline aún
function InlineCompanyForm({ defaultName, onCancel, onSaved }: { tenantId?: string; defaultName: string; onCancel: () => void; onSaved: (c: Company) => void }) {
  return (
    <div className="rounded-lg border bg-white p-3 dark:bg-slate-900 space-y-2">
      <p className="text-xs text-muted-foreground">Formulario rápido de empresa:</p>
      <Input id="tmp-cname" defaultValue={defaultName} placeholder="Nombre de la empresa" className="h-9" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        onClick={() => onSaved({ id: "temp-c-" + Date.now(), name: (document.getElementById("...") as HTMLInputElement).value, rnc: (document.getElementById("...") as HTMLInputElement).value, active: true })}
      </div>
    </div>
  );
}

function InlinePatientForm({ onCancel, onSaved }: { tenantId?: string; companyMode: boolean; onCancel: () => void; onSaved: (p: Patient) => void }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-slate-900 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nuevo Paciente</p>
      <div className="grid grid-cols-2 gap-2">
        <Input id="tmp-pname" placeholder="Nombre" className="h-9" />
        <Input id="tmp-plast" placeholder="Apellido" className="h-9" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={() => onSaved({ id: "temp-p-" + Date.now(), firstName: (document.getElementById("tmp-pname") as HTMLInputElement)?.value || "Paciente", lastName: (document.getElementById("tmp-plast") as HTMLInputElement)?.value || "Temporal", cedula: "" })}>Registrar</Button>
      </div>
    </div>
  );
}


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function NewOrderSheet({
  open,
  onClose,
  onCreated,
  active?,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (invoiceId: string) => void;
  active? Boolean;
}) {
  const { tenantId, user } = useAuth();

  const [step, setStep] = useState<Step>("patient");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [, setSer] = useState<Service[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [clientType, setClientType] = useState<ClientType>("person");
  const [patientTerm, setPatientTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);

  const [companyTerm, setCompanyTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const [category, setCategory] = useState<OrderCategory>("ambulatory");
  const [attendingDoctor, setAttendingDoctor] = useState("");
  const [originClinic, setOriginClinic] = useState("");
  const [referringDoctor, setReferringDoctor] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [serviceTerm, setServiceTerm] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const route = useRouter();

  useEffect(() => {
    if (!tenantId || !open) return;
    const unsubP = onSnapshot(query(patientsCol(tenantId), orderBy("lastName")), (snap) =>
      setPatients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Patient, "id">) }))),
    );
    const unsubS = onSnapshot(query(servicesCol(tenantId), orderBy("name")), (snap) =>
      setSer(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }))),
    );
    const unsubC = onSnapshot(query(companiesCol(tenantId), orderBy("name")), (snap) =>
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Company, "id">) }))),
    );
    return () => {
      unsubP();
      unsubS();
      unsubC();
    };
  }, [tenantId, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const filteredPatients = useMemo(() => {
    const t = patientTerm.trim().toLowerCase();
    if (t.length < 2) return [];
    return patients
      .filter(
        (p) =>
          patientFullName(p).toLowerCase().includes(t) ||
          (p.cedula ?? "").toLowerCase().includes(t) ||
          (p.phoneMobile ?? "").toLowerCase().includes(t),
      )
      .slice(0, 10);
  }, [patients, patientTerm]);

  const filteredCompanies = useMemo(() => {
    const t = companyTerm.trim().toLowerCase();
    if (t.length < 2 || selectedCompany) return [];
    return companies.filter((c) => matchesCompany(c, t)).slice(0, 10);
  }, [companies, companyTerm, selectedCompany]);

  const totals = useMemo(() => calcTotals(cart.map((c) => c.item)), [cart]);

  function choosePatient(p: Patient) {
    setSelectedPatient(p);
    setShowPatientForm(false);
    setStep("order");
  }

function toggleService(s: Service) {
    setCart((prev) => {
      if (prev.some((c) => c.service.Codigo === s.Codigo)) {
        return prev.filter((c) => c.service.Codigo !== s.Codigo);
      }
      // Injecting the correct field maps so buildItem picks up the description and data structures natively
      const structuralService = {
        ...s,
        description: s.Examen || "", // Fallback field in case buildItem relies on explicit text naming
        name: s.Examen || ""
      };
      return [...prev, { service: s, item: buildItem(structuralService, 1) }];
    });
  }

  const tyrannicalServices = useRetrieveServices().filteredServices;
  const filteredCatalogServices = useMemo(() => {
    const t = serviceTerm.trim().toLowerCase();
    if (!t) return tyrannicalServices;
    return tyrannicalServices.filter(
      (s) =>
        s.Examen?.toLowerCase().includes(t) ||
        s.Codigo?.toLowerCase().includes(t)
    );
  }, [tyrannicalServices, serviceTerm]);

  const canSubmit =
    cart.length > 0 && (clientType === "company" ? !!selectedCompany : !!selectedPatient);

  async function handleSubmit() {
    if (!tenantId || !user || !canSubmit) return;
    setSubmitting(true);
    try {
      console.log("Creating order with data:", cart.map((c) => c.item))
      const billedName = selectedPatient
        ? patientFullName(selectedPatient)
        : selectedCompany?.name ?? "Empresa";
      const ref = await createCharge(tenantId, user.uid, {
        patientId: selectedPatient?.id ?? "",
        patientName: billedName,
        companyId: clientType === "company" ? selectedCompany?.id : undefined,
        companyName: clientType === "company" ? selectedCompany?.name : undefined,
        items: cart.map((c) => c.item),
        ...totals,
        issuedBy: user.uid,
        fiscalRegime: "generic",
        notes: [
          category === "emergency" ? "Atención: emergencia" : "",
          category === "hospitalized" ? "Atención: hospitalizado" : "",
          attendingDoctor.trim() ? `Médico: ${attendingDoctor.trim()}` : "",
          originClinic.trim() ? `Procedencia: ${originClinic.trim()}` : "",
          referringDoctor.trim() ? `Referido por: ${referringDoctor.trim()}` : "",
          orderNotes.trim(),
        ] 
          .filter(Boolean)
          .join("\n"),
      });
      toast.success("Orden creada");
      onCreated?.("new-invoice-id"); // Aquí deberías pasar el ID real de la factura creadaq
      route.push(`/recepcion/`)
      onClose();
      ;
        } catch (error) {
      // En TS, 'error' es de tipo 'unknown' por defecto
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      toast.error("No se pudo generar la orden");
      console.error("Error creating order:", errorMessage);

    } finally {
      setSubmitting(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  const isEmergency = category === "emergency";
  const billedName = selectedPatient
    ? patientFullName(selectedPatient)
    : selectedCompany?.name ?? "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 duration-200 animate-in fade-in-0 slide-in-from-bottom-4 dark:bg-slate-950">
      {isEmergency && (
        <div className="flex shrink-0 animate-pulse items-center justify-center gap-2 bg-rose-600 px-6 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <AlertCircle className="h-4 w-4" />
          Orden de emergencia · prioridad máxima
        </div>
      )}

      <div
        className={cn(
          "flex h-14 shrink-0 items-center justify-between border-b px-4 transition-colors md:px-6",
          isEmergency
            ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
            : "bg-white dark:bg-slate-900",
        )}
      >
        <div className="flex items-center gap-3">
          {step === "order" && (
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setStep("patient")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Paciente
            </Button>
          )}
          <h2
            className={cn(
              "text-lg font-bold uppercase tracking-wide md:text-xl",
              isEmergency
                ? "text-rose-700 dark:text-rose-300"
                : "text-[color:var(--brand-primary,#00A99D)]",
            )}
          >
            Nueva orden
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <StepIndicator step={step} />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === "patient" ? (
          <PatientStep
            clientType={clientType}
            setClientType={setClientType}
            tenantId={tenantId}
            patientTerm={patientTerm}
            setPatientTerm={setPatientTerm}
            filteredPatients={filteredPatients}
            onChoosePatient={choosePatient}
            showPatientForm={showPatientForm}
            setShowPatientForm={setShowPatientForm}
            companyTerm={companyTerm}
            setCompanyTerm={setCompanyTerm}
            filteredCompanies={filteredCompanies}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            showCompanyForm={showCompanyForm}
            setShowCompanyForm={setShowCompanyForm}
            onContinueCompany={() => setStep("order")}
          />
        ) : (
          <OrderStep
            clientType={clientType}
            patient={selectedPatient}
            company={selectedCompany}
            category={category}
            setCategory={setCategory}
            attendingDoctor={attendingDoctor}
            setAttendingDoctor={setAttendingDoctor}
            originClinic={originClinic}
            setOriginClinic={setOriginClinic}
            referringDoctor={referringDoctor}
            setReferringDoctor={setReferringDoctor}
            notes={orderNotes}
            setNotes={setOrderNotes}
            services={filteredCatalogServices}
            cart={cart}
            toggleService={toggleService}
            serviceTerm={serviceTerm}
            setServiceTerm={setServiceTerm}
          />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t bg-white px-4 py-3 dark:bg-slate-900 md:px-6">
        <div className="text-sm text-muted-foreground">
          {step === "order" && billedName && (
            <span>
              <User className="mr-1 inline h-3.5 w-3.5" />
              {billedName}
              {cart.length > 0 && (
                <>
                  {" · "}
                  {cart.length} servicio{cart.length === 1 ? "" : "s"} ·{" "}
                  <span className="font-semibold text-foreground">{formatPrice(totals.total)}</span>
                </>
              )}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="h-11 px-5">
            Cancelar
          </Button>
          {step === "order" && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className={cn(
                "h-11 min-w-[220px] px-8 font-bold tracking-wide text-white",
                isEmergency
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[color:var(--brand-primary,#00A99D)] hover:bg-[color:var(--brand-primary,#00A99D)]/90",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Crear orden
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1",
          step === "patient"
            ? "bg-[color:var(--brand-primary,#00A99D)]/15 text-[color:var(--brand-primary,#00A99D)]"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        )}
      >
        <span className="font-bold">1</span>
        <span className="hidden sm:inline">Paciente</span>
        {step === "order" && <CheckCircle2 className="h-3 w-3" />}
      </div>
      <span className="text-muted-foreground">→</span>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1",
          step === "order"
            ? "bg-[color:var(--brand-primary,#00A99D)]/15 text-[color:var(--brand-primary,#00A99D)]"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800",
        )}
      >
        <span className="font-bold">2</span>
        <span className="hidden sm:inline">Orden</span>
      </div>
    </div>
  );
}

function PatientStep(props: {
  clientType: ClientType;
  setClientType: (v: ClientType) => void;
  tenantId?: string;
  patientTerm: string;
  setPatientTerm: (v: string) => void;
  filteredPatients: Patient[];
  onChoosePatient: (p: Patient) => void;
  showPatientForm: boolean;
  setShowPatientForm: (v: boolean) => void;
  companyTerm: string;
  setCompanyTerm: (v: string) => void;
  filteredCompanies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (c: Company | null) => void;
  showCompanyForm: boolean;
  setShowCompanyForm: (v: boolean) => void;
  onContinueCompany: () => void;
}) {
  const {
    clientType,
    setClientType,
    tenantId,
    patientTerm,
    setPatientTerm,
    filteredPatients,
    onChoosePatient,
    showPatientForm,
    setShowPatientForm,
    companyTerm,
    setCompanyTerm,
    filteredCompanies,
    selectedCompany,
    setSelectedCompany,
    showCompanyForm,
    setShowCompanyForm,
    onContinueCompany,
  } = props;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setClientType("person")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors",
              clientType === "person"
                ? "bg-sky-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            <UserSquare2 className="h-4 w-4" />
            Particular
          </button>
          <button
            type="button"
            onClick={() => {
              setClientType("company");
              setShowPatientForm(false);
            }}
            className={cn(
              "flex items-center justify-center gap-2 border-l py-2.5 text-sm font-semibold transition-colors",
              clientType === "company"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            <Briefcase className="h-4 w-4" />
            Empresa
          </button>
        </div>

        {clientType === "company" && (
          <div className="space-y-2 border-t bg-indigo-50/30 p-3 dark:bg-indigo-950/10">
            <Label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Empresa que factura esta orden
            </Label>
            {showCompanyForm ? (
              <InlineCompanyForm
                tenantId={tenantId}
                defaultName={companyTerm.trim()}
                onCancel={() => setShowCompanyForm(false)}
                onSaved={(c) => {
                  setSelectedCompany(c);
                  setCompanyTerm("");
                  setShowCompanyForm(false);
                }}
              />
            ) : selectedCompany ? (
              <SelectedCard
                title={selectedCompany.name}
                subtitle={selectedCompany.rnc ? `RNC ${selectedCompany.rnc}` : "Sin RNC"}
                extra={selectedCompany.phone}
                onClear={() => {
                  setSelectedCompany(null);
                  setCompanyTerm("");
                }}
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    className="h-11 pl-9"
                    placeholder="Buscar empresa por nombre o RNC…"
                    value={companyTerm}
                    onChange={(e) => setCompanyTerm(e.target.value)}
                  />
                </div>
                {filteredCompanies.length > 0 && (
                  <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900">
                    {filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        onClick={() => {
                          setSelectedCompany(c);
                          setCompanyTerm("");
                        }}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.rnc && <span className="ml-2 text-muted-foreground">{c.rnc}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCompanyForm(true)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Registrar empresa nueva
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {!showPatientForm && (
        <>
          <div>
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {clientType === "company"
                ? "Buscar paciente / empleado (opcional)"
                : "Buscar paciente existente"}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={patientTerm}
                onChange={(e) => setPatientTerm(e.target.value)}
                placeholder="Cédula, nombre o teléfono (mín. 2 caracteres)…"
                className="h-12 pl-9 text-base"
                autoFocus={clientType === "person"}
              />
            </div>
          </div>

          {patientTerm.trim().length >= 2 && (
            <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900">
              {filteredPatients.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <div className="mb-3 text-sm text-muted-foreground">
                    No se encontró ningún paciente con &quot;{patientTerm}&quot;
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowPatientForm(true)}
                    className="bg-sky-600 text-white hover:bg-sky-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar nuevo paciente
                  </Button>
                </div>
              ) : (
                <div className="max-h-80 divide-y overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChoosePatient(p)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-950/10"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{patientFullName(p)}</div>
                        <div className="flex items-center gap-2 truncate font-mono text-xs text-muted-foreground">
                          <span>{p.cedula || p.passport || "—"}</span>
                          {p.phoneMobile && (
                            <>
                              <span className="opacity-40">·</span>
                              <Phone className="h-3 w-3" />
                              <span>{p.phoneMobile}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge>Seleccionar</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-dashed py-6 text-center">
            <div className="mb-2 text-sm text-muted-foreground">¿No está en el sistema?</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPatientForm(true)}
              className="h-11"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar nuevo paciente
            </Button>
          </div>

          {clientType === "company" && selectedCompany && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onContinueCompany}
                className="text-[color:var(--brand-primary,#00A99D)]"
              >
                Continuar sin paciente →
              </Button>
            </div>
          )}
        </>
      )}

      {showPatientForm && (
        <InlinePatientForm
          tenantId={tenantId}
          companyMode={clientType === "company"}
          onCancel={() => setShowPatientForm(false)}
          onSaved={(p) => onChoosePatient(p)}
        />
      )}
    </div>
  );
}



function OrderStep(props: {
  clientType: ClientType;
  patient: Patient | null;
  company: Company | null;
  category: OrderCategory;
  setCategory: (v: OrderCategory) => void;
  attendingDoctor: string;
  setAttendingDoctor: (v: string) => void;
  originClinic: string;
  setOriginClinic: (v: string) => void;
  referringDoctor: string;
  setReferringDoctor: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  services: Service[];
  cart: CartEntry[];
  toggleService: (s: Service) => void;
  serviceTerm: string;
  setServiceTerm: (v: string) => void;
}) {
  const {
    clientType,
    patient,
    company,
    category,
    setCategory,
    attendingDoctor,
    setAttendingDoctor,
    originClinic,
    setOriginClinic,
    referringDoctor,
    setReferringDoctor,
    notes,
    setNotes,
    services,
    cart,
    toggleService,
    serviceTerm,
    setServiceTerm,
  } = props;

  const selectedCount = cart.length;
  const selectedIds = new Set(cart.map((c) => c.service.Codigo));

  console.log("OrderStep props:", selectedIds);
  return (
    <div className="space-y-4 px-6 py-5">
      <PartyChip patient={patient} company={company} clientType={clientType} category={category} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 transition-colors",
            category === "emergency"
              ? "border-rose-300 bg-rose-50 ring-2 ring-rose-300/40 dark:bg-rose-950/30"
              : "border-border bg-card",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                category === "emergency"
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-muted-foreground",
              )}
            >
              Tipo de orden
            </span>
            <div className="flex gap-1.5">
              <CategoryChip
                active={category === "ambulatory"}
                onClick={() => setCategory("ambulatory")}
                icon="🚶"
                label="Ambulatorio"
              />
              <CategoryChip
                active={category === "hospitalized"}
                onClick={() => setCategory("hospitalized")}
                icon="🏥"
                label="Hospitalizado"
              />
              <CategoryChip
                active={category === "emergency"}
                onClick={() => setCategory("emergency")}
                icon="🚨"
                label="Emergencia"
              />
            </div>
          </div>
          {category === "emergency" && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-3 w-3" />
              Aparecerá primero en facturación
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Seguro del paciente
          </span>
          <Badge variant="secondary" className="ml-auto">
            Particular · sin seguro
          </Badge>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-[color:var(--brand-primary,#00A99D)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Información clínica
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Médico que atiende</Label>
            <Input
              value={attendingDoctor}
              onChange={(e) => setAttendingDoctor(e.target.value)}
              placeholder="Dr. / Dra…"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Procedencia</Label>
            <Input
              value={originClinic}
              onChange={(e) => setOriginClinic(e.target.value)}
              placeholder="Clínica o centro médico…"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Médico referido{" "}
              <span className="font-normal text-muted-foreground">(nombre libre)</span>
            </Label>
            <Input
              value={referringDoctor}
              onChange={(e) => setReferringDoctor(e.target.value)}
              placeholder="Dr. Juan Pérez"
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Notas</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones de recepción"
            className="h-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[color:var(--brand-primary,#00A99D)]/10 text-[color:var(--brand-primary,#00A99D)]">
            <ClipboardList className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight tracking-tight">
              Catálogo de servicios
            </h3>
            <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
              {services.length} disponibles · {selectedCount} seleccionados
            </p>
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 w-full pl-9 sm:w-72"
              placeholder="Buscar servicio…"
              value={serviceTerm}
              onChange={(e) => setServiceTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b bg-slate-50/40 px-3 py-2 dark:bg-slate-950/10">
          <CatPill active label="Todos" count={services.length} />
          <CatPill label="Servicios" count={services.length} />
        </div>

        <div className="max-h-[26rem] overflow-y-auto">
          {services.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin servicios.</p>
          ) : (
            <div>
              <div className="bg-muted/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Servicios
              </div>
              <div className="divide-y">
                {services.map((s) => {
                  const selected = selectedIds.has(s.Codigo);
                  return (
                    <div
                      key={s.Codigo}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                        selected
                          ? "bg-[color:var(--brand-primary,#00A99D)]/5"
                          : "hover:bg-muted/40",
                      )}
                      onClick={() => toggleService(s)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleService(s)}
                        />
                      </div>
                      <Badge variant="secondary" className="h-5 shrink-0 text-[10px]">
                        SRV
                      </Badge>
                      {s.Codigo && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {s.Codigo}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.Examen}</span>
                      <span className="shrink-0 text-sm font-semibold text-[color:var(--brand-primary,#00A99D)]">{formatPrice(s.Precio_privado)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-[color:var(--brand-primary,#00A99D)]/30 bg-[color:var(--brand-primary,#00A99D)]/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-primary,#00A99D)]">
            <ClipboardList className="h-4 w-4" />
            <span>{selectedCount} servicios listos</span>
          </div>
        </div>
      )}
    </div>
  );
}
