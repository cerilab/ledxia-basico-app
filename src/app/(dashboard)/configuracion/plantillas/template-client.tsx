"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  subscribePrintTemplate,
  savePrintTemplate,
  subscribeProfile,
  DEFAULT_PRINT_TEMPLATE,
  type PrintTemplateInput,
  type PaperWidth,
  type ClinicProfile,
} from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {InvoiceComponent} from "./invoice"

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {label}
    </label>
  );
}

export function TemplateClient() {
  const { tenantId } = useAuth();
  const [form, setForm] = useState<PrintTemplateInput>(DEFAULT_PRINT_TEMPLATE);
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const u1 = subscribePrintTemplate(tenantId, (tpl) => {
      if (tpl) {
        setForm({
          showLogo: tpl.showLogo ?? DEFAULT_PRINT_TEMPLATE.showLogo,
          headerText: tpl.headerText ?? "",
          showRnc: tpl.showRnc ?? DEFAULT_PRINT_TEMPLATE.showRnc,
          showPhone: tpl.showPhone ?? DEFAULT_PRINT_TEMPLATE.showPhone,
          showAddress: tpl.showAddress ?? DEFAULT_PRINT_TEMPLATE.showAddress,
          showItbisBreakdown:
            tpl.showItbisBreakdown ?? DEFAULT_PRINT_TEMPLATE.showItbisBreakdown,
          showPatient: tpl.showPatient ?? DEFAULT_PRINT_TEMPLATE.showPatient,
          showCashier: tpl.showCashier ?? DEFAULT_PRINT_TEMPLATE.showCashier,
          footerText: tpl.footerText ?? DEFAULT_PRINT_TEMPLATE.footerText,
          showFiscalMessage:
            tpl.showFiscalMessage ?? DEFAULT_PRINT_TEMPLATE.showFiscalMessage,
          paperWidth: tpl.paperWidth ?? DEFAULT_PRINT_TEMPLATE.paperWidth,
        });
      }
      setLoading(false);
    });
    const u2 = subscribeProfile(tenantId, setProfile);
    return () => {
      u1();
      u2();
    };
  }, [tenantId]);

  function set<K extends keyof PrintTemplateInput>(
    key: K,
    value: PrintTemplateInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      await savePrintTemplate(tenantId, form);
      toast.success("Plantilla guardada");
    } catch {
      toast.error("No se pudo guardar la plantilla");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Plantillas de impresión
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza el recibo / factura térmica que imprime el sistema.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* editor */}
        <form onSubmit={onSubmit} className="max-w-xl space-y-6">
          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Encabezado</h3>
            <Toggle
              checked={form.showLogo}
              onChange={(v) => set("showLogo", v)}
              label="Mostrar logotipo"
            />
            <div className="space-y-2">
              <Label htmlFor="t-header">Texto de encabezado</Label>
              <Input
                id="t-header"
                value={form.headerText}
                onChange={(e) => set("headerText", e.target.value)}
                placeholder="RECIBO DE PAGO"
              />
            </div>
            <Toggle
              checked={form.showRnc}
              onChange={(v) => set("showRnc", v)}
              label="Mostrar RNC"
            />
            <Toggle
              checked={form.showPhone}
              onChange={(v) => set("showPhone", v)}
              label="Mostrar teléfono"
            />
            <Toggle
              checked={form.showAddress}
              onChange={(v) => set("showAddress", v)}
              label="Mostrar dirección"
            />
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Cuerpo</h3>
            <Toggle
              checked={form.showItbisBreakdown}
              onChange={(v) => set("showItbisBreakdown", v)}
              label="Mostrar desglose de ITBIS"
            />
            <Toggle
              checked={form.showPatient}
              onChange={(v) => set("showPatient", v)}
              label="Mostrar paciente"
            />
            <Toggle
              checked={form.showCashier}
              onChange={(v) => set("showCashier", v)}
              label="Mostrar cajero"
            />
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Pie</h3>
            <div className="space-y-2">
              <Label htmlFor="t-footer">Texto de pie</Label>
              <Textarea
                id="t-footer"
                value={form.footerText}
                onChange={(e) => set("footerText", e.target.value)}
                placeholder="¡Gracias por su visita!"
                rows={2}
              />
            </div>
            <Toggle
              checked={form.showFiscalMessage}
              onChange={(v) => set("showFiscalMessage", v)}
              label="Mostrar mensaje fiscal"
            />
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Papel</h3>
            <div className="flex gap-2">
              {(["58mm", "80mm"] as PaperWidth[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => set("paperWidth", w)}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    form.paperWidth === w
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar plantilla
          </Button>
        </form>

        {/* preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Vista previa
          </p>
          <ReceiptPreview form={form} profile={profile} />
        </div>
      </div>
    </div>
  );
}

function ReceiptPreview({
  form,
  profile,
}: {
  form: PrintTemplateInput;
  profile: ClinicProfile | null;
}) {
  const width = form.paperWidth === "58mm" ? 200 : 280;
  const items = [
    { name: "Consulta general", qty: 1, price: 800 },
    { name: "Hemograma completo", qty: 1, price: 450 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const itbis = Math.round(subtotal * 0.18);
  const total = subtotal + (form.showItbisBreakdown ? itbis : 0);
  const money = (n: number) =>
    "RD$" + n.toLocaleString("es-DO", { minimumFractionDigits: 2 });

  return (
    <>
      <InvoiceComponent Logo = {profile.logoUrl} rnc={""} location={""} contact={""} store={[]} pacientes={[]} cart={[]} fisc={[]} currentDate={""}/>
    </>
  );
}
