"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Search,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  ageFromDob,
  patientFullName,
  patientsCol,
} from "@/lib/data/patients";
import type { Patient } from "@/lib/types";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PatientsClient() {
  const { tenantId } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const q = query(patientsCol(tenantId), orderBy("lastName"));
    return onSnapshot(
        q,
        (snap) => {
          setPatients(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Patient, "id">) }))
          );
          setLoading(false);
        },
        () => setLoading(false),
    );
  }, [tenantId]);

  // Enhanced search covering Name, Cédula, Passport, Phone & Email
  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return patients;
    return patients.filter((p) => {
      const name = patientFullName(p).toLowerCase();
      const documentId = (p.cedula || p.passport || p.nss || "").toLowerCase();
      const phone = (p.phoneMobile || p.phoneHome || "").toLowerCase();
      const email = (p.email || "").toLowerCase();

      return (
          name.includes(t) ||
          documentId.includes(t) ||
          phone.includes(t) ||
          email.includes(t)
      );
    });
  }, [patients, term]);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditing(patient);
    setDialogOpen(true);
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pacientes</h2>
            <p className="text-sm text-muted-foreground">
              Gestión y registro de expedientes de pacientes.
            </p>
          </div>
          <Button onClick={handleCreate} className="self-start sm:self-auto gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                className="pl-8"
                placeholder="Buscar por nombre, documento o teléfono..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
          Mostrando {filtered.length} de {patients.length} pacientes
        </span>
        </div>

        {/* Patients Table */}
        <div className="rounded-xl border bg-background overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Teléfono / Contacto</TableHead>
                <TableHead>Envío</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
              ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {term ? "No se encontraron pacientes." : "Aún no hay pacientes registrados."}
                    </TableCell>
                  </TableRow>
              ) : (
                  filtered.map((p) => {
                    const age = ageFromDob(p.dob);
                    const delivery = (p as unknown as Record<string, unknown>).deliveryMethod;

                    return (
                        <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{patientFullName(p)}</span>
                              {p.email && (
                                  <span className="text-xs text-muted-foreground">{p.email}</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {p.cedula || p.passport || "—"}
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {age != null ? `${age} años` : "—"}
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {p.phoneMobile || p.phoneHome || "—"}
                          </TableCell>

                          {/* Delivery Method Badge */}
                          <TableCell>
                            {delivery === "email" ? (
                                <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50/50">
                                  <Mail className="h-3 w-3" /> Email
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/50">
                                  <MessageSquare className="h-3 w-3" /> WhatsApp
                                </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(p)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>

        <PatientFormDialog
            key={editing?.id ?? "new"}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            tenantId={tenantId}
            patient={editing}
        />
      </div>
  );
}