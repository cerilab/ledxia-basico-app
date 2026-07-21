"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createPatient, updatePatient } from "@/lib/data/patients";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PatientFormFields,
  type DocumentType,
  type ExtendedPatientInput,
} from "@/components/patients/patient-form-fields";

const EMPTY: ExtendedPatientInput = {
  firstName: "",
  lastName: "",
  cedula: "",
  passport: "",
  nss: "",
  dob: "",
  sexAtBirth: undefined,
  bloodType: "",
  nationality: "Dominicana",
  patientCategory: "ambulatory",
  phoneMobile: "",
  phoneHome: "",
  email: "",
  addressStreet: "",
  addressSector: "",
  addressMunicipality: "",
  addressProvince: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  legalGuardian: "",
  affiliateNumber: "",
  contractNumber: "",
  familyHistory: "",
  medicalHistory: "",
  deliveryMethod: "whatsapp",
  maritalStatus: undefined,
  occupation: "",
  insuranceProvider: "",
  attendingPhysician: "",
  allergies: "",
  currentMedications: "",
};

function fromPatient(patient: Patient | null): ExtendedPatientInput {
  if (!patient) return EMPTY;
  return {
    firstName: patient.firstName ?? "",
    lastName: patient.lastName ?? "",
    cedula: patient.cedula ?? "",
    passport: patient.passport ?? "",
    nss: patient.nss ?? "",
    dob: patient.dob ?? "",
    sexAtBirth: patient.sexAtBirth,
    bloodType: patient.bloodType ?? "",
    nationality: patient.nationality ?? "Dominicana",
    patientCategory: patient.patientCategory ?? "ambulatory",
    phoneMobile: patient.phoneMobile ?? "",
    phoneHome: patient.phoneHome ?? "",
    email: patient.email ?? "",
    addressStreet: patient.addressStreet ?? "",
    addressSector: patient.addressSector ?? "",
    addressMunicipality: patient.addressMunicipality ?? "",
    addressProvince: patient.addressProvince ?? "",
    emergencyContactName: patient.emergencyContactName ?? "",
    emergencyContactPhone: patient.emergencyContactPhone ?? "",
    emergencyContactRelationship: patient.emergencyContactRelationship ?? "",
    legalGuardian: patient.legalGuardian ?? "",
    affiliateNumber: patient.affiliateNumber ?? "",
    contractNumber: patient.contractNumber ?? "",
    familyHistory: patient.familyHistory ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    deliveryMethod: (patient as unknown as Record<string, unknown>).deliveryMethod as "whatsapp" | "email" ?? "whatsapp",
    maritalStatus: (patient as unknown as Record<string, unknown>).maritalStatus as ExtendedPatientInput["maritalStatus"],
    occupation: (patient as unknown as Record<string, unknown>).occupation as string ?? "",
    insuranceProvider: (patient as unknown as Record<string, unknown>).insuranceProvider as string ?? "",
    attendingPhysician: (patient as unknown as Record<string, unknown>).attendingPhysician as string ?? "",
    allergies: (patient as unknown as Record<string, unknown>).allergies as string ?? "",
    currentMedications: (patient as unknown as Record<string, unknown>).currentMedications as string ?? "",
  };
}

function cleanInput(input: ExtendedPatientInput): ExtendedPatientInput {
  const out: ExtendedPatientInput = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
  };

  for (const [key, value] of Object.entries(input) as [keyof ExtendedPatientInput, unknown][]) {
    if (key === "firstName" || key === "lastName") continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        (out as unknown as Record<string, unknown>)[key] =
            key === "cedula" || key === "nss" ? trimmed.replace(/\D/g, "") : trimmed;
      }
      continue;
    }
    if (value !== undefined && value !== null) {
      (out as unknown as Record<string, unknown>)[key] = value;
    }
  }

  return out;
}

export function PatientFormDialog({
  open,
  onOpenChange,
  tenantId,
  patient,
  title,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId?: string;
  patient?: Patient | null;
  title?: string;
  onSaved?: (patient: Patient) => void;
}) {
  const isEdit = !!patient;
  const [form, setForm] = useState<ExtendedPatientInput>(() => fromPatient(patient ?? null));
  const [documentType, setDocumentType] = useState<DocumentType>("cedula");
  const [isMinor, setIsMinor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromPatient(patient ?? null));
      setDocumentType(patient?.passport ? "passport" : "cedula");
      setIsMinor(!!patient?.legalGuardian);
    }
  }, [open, patient]);

  function set<K extends keyof ExtendedPatientInput>(key: K, value: ExtendedPatientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Error de sesión: Tenant no identificado");
      return;
    }

    const payload = cleanInput({
      ...form,
      legalGuardian: isMinor ? form.legalGuardian : "",
    });

    if (!payload.firstName || !payload.lastName) {
      toast.error("El nombre y apellido son requeridos.");
      return;
    }

    if (payload.deliveryMethod === "whatsapp" && !payload.phoneMobile) {
      toast.error("Proporcione un celular/WhatsApp para enviar los resultados.");
      return;
    }
    if (payload.deliveryMethod === "email" && !payload.email) {
      toast.error("Proporcione un correo electrónico para enviar los resultados.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && patient) {
        await updatePatient(tenantId, patient.id, payload);
        toast.success("Paciente actualizado con éxito");
        onSaved?.({ ...patient, ...payload });
      } else {
        const ref = await createPatient(tenantId, payload);
        toast.success("Paciente registrado con éxito");
        onSaved?.({ id: ref.id, active: true, ...payload } as Patient);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los datos del paciente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-full sm:max-w-6xl grid-rows-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/20 px-6 py-4">
          <DialogTitle>{title ?? (isEdit ? "Editar expediente de paciente" : "Nuevo registro de paciente")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <PatientFormFields
              form={form}
              set={set}
              documentType={documentType}
              setDocumentType={setDocumentType}
              isMinor={isMinor}
              setIsMinor={setIsMinor}
            />
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/10 px-6 py-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Guardar paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}