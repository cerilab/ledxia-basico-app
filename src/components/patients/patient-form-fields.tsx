"use client";

import {
  Baby,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  HeartPulse,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldPlus,
  User,
  UserCheck,
} from "lucide-react";
import type { PatientInput } from "@/lib/data/patients";
import type { Sex } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type DocumentType = "cedula" | "passport" | "rnc";

// Fully expanded interface for thorough clinical intake
export interface ExtendedPatientInput extends PatientInput {
  secondLastName?: string;
  placeOfBirth?: string;
  preferredLanguage?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "free_union";
  occupation?: string;
  workplace?: string;

  // Company / Corporate Payment
  isCompanyPaying?: boolean;
  companyName?: string;
  companyRnc?: string;
  companyDepartment?: string;

  // Delivery Method
  deliveryMethod?: "whatsapp" | "email";

  // Insurance details
  insuranceProvider?: string;
  insurancePlanType?: string;
  authorisationCode?: string;
  attendingPhysician?: string;

  // Clinical
  allergies?: string;
  currentMedications?: string;
  surgicalHistory?: string;
  chronicDiseases?: string;
  generalNotes?: string;
}

export function PatientFormFields({
                                    form,
                                    set,
                                    documentType,
                                    setDocumentType,
                                    isMinor,
                                    setIsMinor,
                                    showHistory = true,
                                  }: {
  form: ExtendedPatientInput;
  set: <K extends keyof ExtendedPatientInput>(key: K, value: ExtendedPatientInput[K]) => void;
  documentType: DocumentType;
  setDocumentType: (v: DocumentType) => void;
  isMinor: boolean;
  setIsMinor: (v: boolean) => void;
  showHistory?: boolean;
}) {
  function documentValue() {
    if (documentType === "passport") return form.passport ?? "";
    if (documentType === "rnc") return form.nss ?? "";
    return form.cedula ?? "";
  }

  function setDocumentValue(value: string) {
    if (documentType === "passport") {
      set("passport", value);
      return;
    }
    if (documentType === "rnc") {
      set("nss", value);
      return;
    }
    set("cedula", value);
  }

  return (
      <div className="space-y-9">
        {/* SECTION 1: DOCUMENTO DE IDENTIDAD */}
        <section className="space-y-3">
          <SectionTitle icon={CheckCircle2}>Documento de Identificación</SectionTitle>
          <div className="flex flex-wrap items-end gap-3">
            <FieldGroup label="Tipo de Documento">
              <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="flex h-9 w-36 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="cedula">Cédula</option>
                <option value="passport">Pasaporte</option>
                <option value="rnc">RNC / NSS</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Número de Documento">
              <div className="relative">
                <Input
                    value={documentValue()}
                    onChange={(e) => setDocumentValue(e.target.value)}
                    placeholder={documentType === "cedula" ? "00100000000" : "Número de documento"}
                    className="h-9 w-48 pr-9 font-mono tracking-wide"
                />
                {documentType === "cedula" &&
                    documentValue().replace(/\D/g, "").length === 11 && (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    )}
              </div>
            </FieldGroup>
            <label className="flex min-h-9 cursor-pointer select-none items-center gap-2 pb-0.5 text-[13px] font-medium">
              <Checkbox checked={isMinor} onCheckedChange={(v) => setIsMinor(v === true)} />
              <Baby className="h-3.5 w-3.5 text-muted-foreground" />
              Menor de edad
            </label>
          </div>

          {isMinor && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <FieldGroup label="Nombre del Tutor / Responsable Legal *">
                  <Input
                      value={form.legalGuardian ?? ""}
                      onChange={(e) => set("legalGuardian", e.target.value)}
                      placeholder="Nombre completo del padre, madre o tutor"
                  />
                </FieldGroup>
                <FieldGroup label="Teléfono del Tutor *">
                  <Input
                      value={form.emergencyContactPhone ?? ""}
                      onChange={(e) => set("emergencyContactPhone", e.target.value)}
                      placeholder="809-000-0000"
                  />
                </FieldGroup>
              </div>
          )}
        </section>

        {/* SECTION 2: DATOS PERSONALES */}
        <section className="space-y-3">
          <SectionTitle icon={User}>Datos Personales</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Primer Nombre *">
              <Input
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Ej. Juan Carlos"
              />
            </FieldGroup>
            <FieldGroup label="Primer Apellido *">
              <Input
                  required
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Ej. Pérez"
              />
            </FieldGroup>
            <FieldGroup label="Segundo Apellido">
              <Input
                  value={form.secondLastName ?? ""}
                  onChange={(e) => set("secondLastName", e.target.value)}
                  placeholder="Ej. Gómez"
              />
            </FieldGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <FieldGroup label="Fecha de Nacimiento">
              <Input
                  type="date"
                  value={form.dob ?? ""}
                  onChange={(e) => set("dob", e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Sexo de Nacimiento">
              <NativeSelect
                  value={form.sexAtBirth ?? ""}
                  onChange={(value) => set("sexAtBirth", (value || undefined) as Sex | undefined)}
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </NativeSelect>
            </FieldGroup>
            <FieldGroup label="Tipo de Sangre">
              <NativeSelect
                  value={form.bloodType ?? ""}
                  onChange={(value) => set("bloodType", value)}
              >
                <option value="">—</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                ))}
              </NativeSelect>
            </FieldGroup>
            <FieldGroup label="Estado Civil">
              <NativeSelect
                  value={form.maritalStatus ?? ""}
                  onChange={(value) => set("maritalStatus", value as ExtendedPatientInput["maritalStatus"])}
              >
                <option value="">Seleccionar</option>
                <option value="single">Soltero/a</option>
                <option value="married">Casado/a</option>
                <option value="divorced">Divorciado/a</option>
                <option value="widowed">Viudo/a</option>
                <option value="free_union">Unión Libre</option>
              </NativeSelect>
            </FieldGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Nacionalidad">
              <Input
                  value={form.nationality ?? ""}
                  onChange={(e) => set("nationality", e.target.value)}
                  placeholder="Ej. Dominicana"
              />
            </FieldGroup>
            <FieldGroup label="Lugar de Nacimiento">
              <Input
                  value={form.placeOfBirth ?? ""}
                  onChange={(e) => set("placeOfBirth", e.target.value)}
                  placeholder="Ej. Santo Domingo, R.D."
              />
            </FieldGroup>
            <FieldGroup label="Idioma Preferido">
              <Input
                  value={form.preferredLanguage ?? ""}
                  onChange={(e) => set("preferredLanguage", e.target.value)}
                  placeholder="Ej. Español, Inglés"
              />
            </FieldGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Ocupación / Profesión">
              <Input
                  value={form.occupation ?? ""}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="Ej. Ingeniero, Maestro, Comerciante"
              />
            </FieldGroup>
            <FieldGroup label="Lugar de Trabajo / Empresa">
              <Input
                  value={form.workplace ?? ""}
                  onChange={(e) => set("workplace", e.target.value)}
                  placeholder="Nombre de la institución o negocio"
              />
            </FieldGroup>
          </div>

          <div>
            <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Categoría / Tipo de Atención
            </Label>
            <div className="flex gap-2">
              {(
                  [
                    ["ambulatory", "Ambulatorio"],
                    ["hospitalized", "Hospitalizado"],
                    ["emergency", "Emergencia"],
                  ] as const
              ).map(([value, label]) => (
                  <button
                      key={value}
                      type="button"
                      onClick={() => set("patientCategory", value)}
                      className={cn(
                          "h-8 flex-1 rounded-lg border px-2 text-[13px] font-medium transition-colors",
                          form.patientCategory === value
                              ? "border-[color:var(--brand-primary,#00A99D)] bg-[color:var(--brand-primary,#00A99D)] text-white"
                              : "border-input bg-background text-muted-foreground hover:bg-accent",
                      )}
                  >
                    {label}
                  </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: PAGO CORPORATIVO / PATROCINIO EMPRESARIAL */}
        <section className="space-y-3">
          <SectionTitle icon={Building2}>Facturación Corporativa / Empresa</SectionTitle>

          <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
            <button
                type="button"
                onClick={() => set("isCompanyPaying", !form.isCompanyPaying)}
                className={cn(
                    "flex items-center justify-between w-full p-2.5 rounded-md border text-xs font-medium transition-all text-left",
                    form.isCompanyPaying
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-input bg-background text-muted-foreground hover:bg-accent"
                )}
            >
              <div className="flex items-center gap-2">
                <Briefcase className={cn("h-4 w-4", form.isCompanyPaying ? "text-primary" : "text-muted-foreground")} />
                <span>Mi empresa / empleador cubre el costo de esta consulta o estudio</span>
              </div>
              <Checkbox checked={form.isCompanyPaying ?? false} readOnly />
            </button>

            {form.isCompanyPaying && (
                <div className="grid gap-3 sm:grid-cols-3 pt-1 animate-in fade-in-50 duration-200">
                  <FieldGroup label="Nombre de la Empresa *">
                    <Input
                        value={form.companyName ?? ""}
                        onChange={(e) => set("companyName", e.target.value)}
                        placeholder="Ej. Grupo Ramos, Claro, etc."
                    />
                  </FieldGroup>
                  <FieldGroup label="RNC de la Empresa">
                    <Input
                        value={form.companyRnc ?? ""}
                        onChange={(e) => set("companyRnc", e.target.value)}
                        placeholder="1-01-00000-0"
                    />
                  </FieldGroup>
                  <FieldGroup label="Departamento / Área">
                    <Input
                        value={form.companyDepartment ?? ""}
                        onChange={(e) => set("companyDepartment", e.target.value)}
                        placeholder="Ej. Recursos Humanos, Operaciones"
                    />
                  </FieldGroup>
                </div>
            )}
          </div>
        </section>

        {/* SECTION 4: CONTACTO Y MÉTODO DE ENTREGA */}
        <section className="space-y-3">
          <SectionTitle icon={Phone}>Contacto y Envío de Resultados</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Teléfono Móvil / WhatsApp *">
              <Input
                  value={form.phoneMobile ?? ""}
                  onChange={(e) => set("phoneMobile", e.target.value)}
                  type="tel"
                  placeholder="809-000-0000"
              />
            </FieldGroup>
            <FieldGroup label="Teléfono Residencial">
              <Input
                  value={form.phoneHome ?? ""}
                  onChange={(e) => set("phoneHome", e.target.value)}
                  type="tel"
                  placeholder="809-000-0000"
              />
            </FieldGroup>
            <FieldGroup label="Correo Electrónico">
              <Input
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="correo@ejemplo.com"
              />
            </FieldGroup>
          </div>

          {/* Dynamic Delivery Selector */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-[color:var(--brand-primary,#00A99D)]" />
              Canal Preferido para Envío de Resultados Médicos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                  type="button"
                  onClick={() => set("deliveryMethod", "whatsapp")}
                  className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-md border text-xs font-medium transition-all",
                      form.deliveryMethod === "whatsapp" || !form.deliveryMethod
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                          : "border-input bg-background text-muted-foreground hover:bg-accent"
                  )}
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                WhatsApp
              </button>
              <button
                  type="button"
                  onClick={() => set("deliveryMethod", "email")}
                  className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-md border text-xs font-medium transition-all",
                      form.deliveryMethod === "email"
                          ? "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
                          : "border-input bg-background text-muted-foreground hover:bg-accent"
                  )}
              >
                <Mail className="h-4 w-4 text-blue-600" />
                Correo Electrónico
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 5: DIRECCIÓN DE RESIDENCIA */}
        <section className="space-y-3">
          <SectionTitle icon={MapPin}>Dirección de Residencia</SectionTitle>
          <FieldGroup label="Calle, Número y Edificio">
            <Input
                value={form.addressStreet ?? ""}
                onChange={(e) => set("addressStreet", e.target.value)}
                placeholder="Ej. Av. 27 de Febrero #123, Res. Los Pinos, Apt. 4B"
            />
          </FieldGroup>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Sector / Barrio">
              <Input
                  value={form.addressSector ?? ""}
                  onChange={(e) => set("addressSector", e.target.value)}
                  placeholder="Ej. Piantini"
              />
            </FieldGroup>
            <FieldGroup label="Municipio / Ciudad">
              <Input
                  value={form.addressMunicipality ?? ""}
                  onChange={(e) => set("addressMunicipality", e.target.value)}
                  placeholder="Ej. Distrito Nacional"
              />
            </FieldGroup>
            <FieldGroup label="Provincia">
              <Input
                  value={form.addressProvince ?? ""}
                  onChange={(e) => set("addressProvince", e.target.value)}
                  placeholder="Ej. Santo Domingo"
              />
            </FieldGroup>
          </div>
        </section>

        {/* SECTION 6: CONTACTO DE EMERGENCIA */}
        <section className="space-y-3">
          <SectionTitle icon={UserCheck}>Contacto de Emergencia</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Nombre del Contacto">
              <Input
                  value={form.emergencyContactName ?? ""}
                  onChange={(e) => set("emergencyContactName", e.target.value)}
                  placeholder="Nombre y apellido"
              />
            </FieldGroup>
            <FieldGroup label="Teléfono de Emergencia">
              <Input
                  value={form.emergencyContactPhone ?? ""}
                  onChange={(e) => set("emergencyContactPhone", e.target.value)}
                  placeholder="809-000-0000"
              />
            </FieldGroup>
            <FieldGroup label="Parentesco / Relación">
              <Input
                  value={form.emergencyContactRelationship ?? ""}
                  onChange={(e) => set("emergencyContactRelationship", e.target.value)}
                  placeholder="Ej. Cónyuge, Madre, Hermano, Amigo"
              />
            </FieldGroup>
          </div>
        </section>

        {/* SECTION 7: SEGURO MÉDICO Y ARS */}
        <section className="space-y-3">
          <SectionTitle icon={ShieldPlus}>Seguro Médico / ARS</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="Aseguradora / ARS">
              <Input
                  value={form.insuranceProvider ?? ""}
                  onChange={(e) => set("insuranceProvider", e.target.value)}
                  placeholder="Ej. ARS Primera, Senasa, Mapfre"
              />
            </FieldGroup>
            <FieldGroup label="Tipo de Plan / Cobertura">
              <Input
                  value={form.insurancePlanType ?? ""}
                  onChange={(e) => set("insurancePlanType", e.target.value)}
                  placeholder="Ej. Complementario, Básico, Ejecutivo"
              />
            </FieldGroup>
            <FieldGroup label="No. de Afiliado / Carnet">
              <Input
                  value={form.affiliateNumber ?? ""}
                  onChange={(e) => set("affiliateNumber", e.target.value)}
                  placeholder="Número impreso en el carnet"
              />
            </FieldGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <FieldGroup label="No. de Póliza / Contrato">
              <Input
                  value={form.contractNumber ?? ""}
                  onChange={(e) => set("contractNumber", e.target.value)}
                  placeholder="Número de póliza"
              />
            </FieldGroup>
            <FieldGroup label="NSS (Número de Seguridad Social)">
              <Input
                  value={form.nss ?? ""}
                  onChange={(e) => set("nss", e.target.value)}
                  placeholder="Número NSS"
              />
            </FieldGroup>
            <FieldGroup label="Código de Pre-Autorización">
              <Input
                  value={form.authorisationCode ?? ""}
                  onChange={(e) => set("authorisationCode", e.target.value)}
                  placeholder="No. de autorización ARS"
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Médico Tratante / Referidor">
            <Input
                value={form.attendingPhysician ?? ""}
                onChange={(e) => set("attendingPhysician", e.target.value)}
                placeholder="Dr. Nombre Apellido (Especialidad)"
            />
          </FieldGroup>
        </section>

        {/* SECTION 8: ANTECEDENTES Y NOTAS CLÍNICAS */}
        {showHistory && (
            <section className="space-y-3">
              <SectionTitle icon={HeartPulse}>Historial Clínico y Antecedentes Médicos</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="Alergias e Intolerancias">
                  <Textarea
                      value={form.allergies ?? ""}
                      onChange={(e) => set("allergies", e.target.value)}
                      placeholder="Alergias a medicamentos (Ej. Penicilina), alimentos, látex, contrastes..."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
                <FieldGroup label="Medicamentos Habituales / Uso Continuo">
                  <Textarea
                      value={form.currentMedications ?? ""}
                      onChange={(e) => set("currentMedications", e.target.value)}
                      placeholder="Tratamientos activos, dosis y frecuencia..."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
                <FieldGroup label="Enfermedades Crónicas / Patologías">
                  <Textarea
                      value={form.chronicDiseases ?? ""}
                      onChange={(e) => set("chronicDiseases", e.target.value)}
                      placeholder="Hipertensión, Diabetes, Asma, Dislipidemia, etc."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
                <FieldGroup label="Historial Quirúrgico / Cirugías">
                  <Textarea
                      value={form.surgicalHistory ?? ""}
                      onChange={(e) => set("surgicalHistory", e.target.value)}
                      placeholder="Procedimientos quirúrgicos previos y fechas aproximadas..."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
                <FieldGroup label="Antecedentes Heredofamiliares">
                  <Textarea
                      value={form.familyHistory ?? ""}
                      onChange={(e) => set("familyHistory", e.target.value)}
                      placeholder="Diabetes, cardiopatías, oncología en familiares directos..."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
                <FieldGroup label="Notas Médicas / Observaciones Generales">
                  <Textarea
                      value={form.generalNotes ?? ""}
                      onChange={(e) => set("generalNotes", e.target.value)}
                      placeholder="Cualquier información adicional relevante para el diagnóstico o trato al paciente..."
                      rows={3}
                      className="resize-y"
                  />
                </FieldGroup>
              </div>
            </section>
        )}
      </div>
  );
}

function SectionTitle({
                        icon: Icon,
                        children,
                      }: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
      <div className="flex items-center gap-2 border-b pb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-[color:var(--brand-primary,#00A99D)]" />}
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {children}
        </h4>
      </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {children}
      </div>
  );
}

function NativeSelect({
                        value,
                        onChange,
                        children,
                      }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
      <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
              "flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
      >
        {children}
      </select>
  );
}