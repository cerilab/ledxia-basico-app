"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import {
  createCompany,
  updateCompany,
  type Company,
  type CompanyInput,
} from "@/lib/data/companies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ContactPerson {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

const EMPTY_FORM: CompanyInput & { contacts?: ContactPerson[] } = {
  name: "",
  rnc: "",
  phone: "",
  email: "",
  address: "",
  contacts: [],
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  tenantId,
  company,
  defaultName,
  title,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId?: string;
  company?: (Company & { contacts?: ContactPerson[] }) | null;
  defaultName?: string;
  title?: string;
  onSaved?: (company: Company) => void;
}) {
  const isEdit = !!company;
  const [form, setForm] = useState(() => getInitialState());
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [saving, setSaving] = useState(false);

  function getInitialState() {
    if (company) {
      return {
        name: company.name ?? "",
        rnc: company.rnc ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        address: company.address ?? "",
      };
    }
    return { ...EMPTY_FORM, name: defaultName ?? "" };
  }

  // Reset form whenever dialog opens or target company changes
  useEffect(() => {
    if (open) {
      setForm(getInitialState());
      setContacts(company?.contacts ?? []);
    }
  }, [open, company, defaultName]);

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /* ---------------- Contact Persons Handlers ---------------- */
  function addContact() {
    setContacts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", role: "", email: "", phone: "" },
    ]);
  }

  function updateContact(id: string, field: keyof ContactPerson, value: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function removeContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    // Validate contacts if added
    const invalidContact = contacts.find((c) => !c.name.trim());
    if (invalidContact) {
      toast.error("Por favor completa el nombre de todas las personas de contacto");
      return;
    }

    setSaving(true);

    const cleanedPayload: CompanyInput & { contacts?: ContactPerson[] } = {
      name: trimmedName,
      rnc: form.rnc?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name.trim(),
        role: c.role?.trim() || undefined,
        email: c.email?.trim() || undefined,
        phone: c.phone?.trim() || undefined,
      })),
    };

    try {
      if (isEdit && company) {
        await updateCompany(tenantId, company.id, cleanedPayload);
        toast.success("Empresa actualizada");
        onSaved?.({ ...company, ...cleanedPayload });
      } else {
        const ref = await createCompany(tenantId, cleanedPayload);
        toast.success("Empresa registrada");
        onSaved?.({
          id: ref.id,
          active: true,
          ...cleanedPayload,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la empresa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Building2 className="h-4 w-4 text-[color:var(--brand-primary,#00A99D)]" />
            {title ?? (isEdit ? "Editar empresa" : "Registrar empresa")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Company Details */}
          <div className="space-y-3">
            <FieldGroup label="Nombre / Razón social *">
              <Input
                required
                autoFocus
                disabled={saving}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej. Diagnósticos Médicos S.R.L."
              />
            </FieldGroup>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="RNC / Tax ID">
                <Input
                  disabled={saving}
                  value={form.rnc ?? ""}
                  onChange={(e) => set("rnc", e.target.value)}
                  placeholder="000000000"
                  className="font-mono text-sm"
                />
              </FieldGroup>
              <FieldGroup label="Teléfono de la Empresa">
                <Input
                  disabled={saving}
                  value={form.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                  type="tel"
                  placeholder="809-000-0000"
                />
              </FieldGroup>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Email de Facturación">
                <Input
                  disabled={saving}
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="facturacion@empresa.com"
                />
              </FieldGroup>

              <FieldGroup label="Dirección Fiscal">
                <Input
                  disabled={saving}
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Calle, Ave., Edificio"
                />
              </FieldGroup>
            </div>
          </div>

          <hr className="my-2 border-slate-100 dark:border-slate-800" />

          {/* Contact People Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personas de Contacto ({contacts.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
                disabled={saving}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir contacto
              </Button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2 border rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
                No hay personas de contacto asociadas aún.
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={contact.id}
                    className="relative rounded-lg border bg-slate-50/50 p-3 dark:bg-slate-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Contacto #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContact(contact.id)}
                        disabled={saving}
                        className="h-5 w-5 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Nombre y apellido *"
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                          disabled={saving}
                          className="h-8 pl-8 text-xs"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Briefcase className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Cargo (ej. Recursos Humanos)"
                          value={contact.role ?? ""}
                          onChange={(e) => updateContact(contact.id, "role", e.target.value)}
                          disabled={saving}
                          className="h-8 pl-8 text-xs"
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Correo directo"
                          value={contact.email ?? ""}
                          onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                          disabled={saving}
                          className="h-8 pl-8 text-xs"
                        />
                      </div>

                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Teléfono / Extensión"
                          value={contact.phone ?? ""}
                          onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                          disabled={saving}
                          className="h-8 pl-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Guardar empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}