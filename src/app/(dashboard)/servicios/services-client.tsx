"use client";

import { useEffect, useMemo, useState } from "react";
import { getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  createService,
  formatPrice,
  servicesCol,
  updateService,
  type ServiceInput,
} from "@/lib/data/services";
import type { Service } from "@/lib/types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServicesReader } from "@/components/servicios/Import";

export function ServicesClient() {
  const { tenantId } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    console.log("RUTA DE LA COLECCIÓN:", servicesCol(tenantId).path);

    getDocs(servicesCol(tenantId))
      .then((querySnapshot) => {
        const fetchedServices: Service[] = [];

        querySnapshot.forEach((doc) => {
          console.log(`Documento crudo ID [${doc.id}]:`, doc.data());

          const data = doc.data();
          if (!data) return;

          // Find where the JSON array or collection lives inside the document
          const rawPayload = data.services || data.datos || data.items || data;

          // Helper function to map a single JSON object into our Service structure
          const mapItemToService = (innerData: any, index: number): Service => {
            const codigo = innerData.CODIGO ?? innerData.codigo ?? `${doc.id}-${index}`;
            const examen = innerData.EXAMEN ?? innerData.examen ?? innerData.Examen ?? "Examen sin nombre";
            const seccion = innerData.SECCION ?? innerData.seccion ?? "—";
            const muestra = innerData.MUESTRA ?? innerData.muestra ?? innerData.tipo_muestra ?? "—";
            const envase = innerData.ENVASE ?? innerData.envase ?? innerData.tipo_envase ?? "—";
            const metodo = innerData.METODO ?? innerData.metodo ?? "—";
            const requisito = innerData.REQUISITO ?? innerData.requisito ?? "—";
            const entregable = innerData.ENTREGABLE ?? innerData.entregable ?? "—";
            const precio = innerData.PRECIO_PRIVADO ?? innerData.precio_privado ?? innerData.Precio_privado ?? 0;

            // Handle 1 or 0 binary indicators cleanly
            const imgDeliv = innerData.ENTREGA_IMAGEN ?? innerData.entrega_imagen ?? innerData.entregaimagen ?? 0;
            const labDeliv = innerData.ENTREGA_LAB ?? innerData.entrega_lab ?? innerData.entregaLab ?? 0;

            return {
              Codigo: String(codigo),
              Examen: String(examen),
              Seccion: String(seccion),
              tipo_muestra: String(muestra),
              tipo_envase: String(envase),
              metodo: String(metodo),
              requisito: String(requisito),
              Entregable: String(entregable),
              Precio_privado: Number(precio),
              entregaimagen: Number(imgDeliv) === 1 || imgDeliv === true,
              entregaLab: Number(labDeliv) === 1 || labDeliv === true,
            };
          };

          // If the JSON payload is an array inside the document, loop through it
          if (Array.isArray(rawPayload)) {
            rawPayload.forEach((item, index) => {
              fetchedServices.push(mapItemToService(item, index));
            });
          } else if (typeof rawPayload === "object" && rawPayload !== null) {
            // If it's a map/dictionary container of items instead of a flat array
            const values = Object.values(rawPayload);
            if (values.length > 0 && typeof values[0] === "object") {
              values.forEach((item, index) => {
                fetchedServices.push(mapItemToService(item, index));
              });
            } else {
              // Standard single fallback document
              fetchedServices.push(mapItemToService(rawPayload, 0));
            }
          }
        });

        setServices(fetchedServices);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
      });
  }, [tenantId]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return services;

    return services.filter((s) => {
      const nameMatch = s.Examen ? s.Examen.toLowerCase().includes(t) : false;
      const codeMatch = s.Codigo ? s.Codigo.toLowerCase().includes(t) : false;
      return nameMatch || codeMatch;
    });
  }, [services, term]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo de servicios</h2>
          <p className="text-sm text-muted-foreground">Lista de precios de la clínica.</p>
        </div>
      </div>

      <Button
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
      </Button>

      <ServicesReader />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre o código…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Examen</TableHead>
              <TableHead>Precio Privado</TableHead>
              <TableHead>Tipo Muestra</TableHead>
              <TableHead>Tipo Envase</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Requisito</TableHead>
              <TableHead>Entregable</TableHead>
              <TableHead>Entrega Imagen</TableHead>
              <TableHead>Entrega Lab</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                  {term ? "Sin resultados." : "Aún no hay servicios."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s, index) => (
                <TableRow key={s.Codigo || index}>
                  <TableCell className="font-medium">{s.Codigo}</TableCell>
                  <TableCell className="text-muted-foreground">{s.Examen}</TableCell>
                  <TableCell>{formatPrice(s.Precio_privado)}</TableCell>
                  <TableCell>{s.tipo_muestra}</TableCell>
                  <TableCell>{s.tipo_envase}</TableCell>
                  <TableCell>{s.metodo}</TableCell>
                  <TableCell>{s.requisito}</TableCell>
                  <TableCell>{s.Entregable}</TableCell>
                  <TableCell>{s.entregaimagen ? "Sí" : "No"}</TableCell>
                  <TableCell>{s.entregaLab ? "Sí" : "No"}</TableCell>
                  <TableCell>{s.Seccion}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(s);
                        setDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ServiceDialog
        key={editing?.Codigo ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        tenantId={tenantId}
        service={editing}
      />
    </div>
  );
}

const EMPTY: ServiceInput = {
  Examen: "",
  Codigo: "",
  Precio_privado: 0,
  Seccion: "",
  tipo_muestra: "",
  tipo_envase: "",
  metodo: "",
  requisito: "",
  Entregable: "",
  entregaimagen: false,
  entregaLab: false,
};

function ServiceDialog({
  open,
  onOpenChange,
  tenantId,
  service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId?: string;
  service: Service | null;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState<ServiceInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (service) {
        setForm({
          Examen: service.Examen ?? "",
          Codigo: service.Codigo ?? "",
          Precio_privado: service.Precio_privado ?? 0,
          Seccion: service.Seccion ?? "",
          tipo_muestra: service.tipo_muestra ?? "",
          tipo_envase: service.tipo_envase ?? "",
          metodo: service.metodo ?? "",
          requisito: service.requisito ?? "",
          Entregable: service.Entregable ?? "",
          entregaimagen: !!service.entregaimagen,
          entregaLab: !!service.entregaLab,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, service]);

  function set<K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      if (isEdit && service) {
        await updateService(tenantId, service.Codigo, form);
        toast.success("Servicio actualizado");
      } else {
        await createService(tenantId, form);
        toast.success("Servicio creado");
      }
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar el servicio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="svc-name">Nombre</Label>
            <Input
              id="svc-name"
              required
              value={form.Examen}
              onChange={(e) => set("Examen", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="svc-code">Código (opcional)</Label>
            <Input
              id="svc-code"
              value={form.Codigo}
              onChange={(e) => set("Codigo", e.target.value)}
              placeholder="LAB-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="svc-price">Precio (DOP)</Label>
              <Input
                id="svc-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.Precio_privado || ""}
                onChange={(e) => set("Precio_privado", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}