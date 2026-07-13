"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Printer } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { InvoiceComponent } from "./invoice";
import MedicalInvoice from "@/components/invoice/pdf";

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
        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
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
    const [activeTab, setActiveTab] = useState<"ticket" | "a4">("ticket");

useEffect(() => {
    if (!tenantId) return;
    const u1 = subscribePrintTemplate(tenantId, (tpl) => {
        if (tpl) {
            const currentWidth = tpl.paperWidth ?? DEFAULT_PRINT_TEMPLATE.paperWidth;
            setForm({
                showLogo: tpl.showLogo ?? DEFAULT_PRINT_TEMPLATE.showLogo,
                headerText: tpl.headerText ?? "",
                showRnc: tpl.showRnc ?? DEFAULT_PRINT_TEMPLATE.showRnc,
                showPhone: tpl.showPhone ?? DEFAULT_PRINT_TEMPLATE.showPhone,
                showAddress: tpl.showAddress ?? DEFAULT_PRINT_TEMPLATE.showAddress,
                showItbisBreakdown: tpl.showItbisBreakdown ?? DEFAULT_PRINT_TEMPLATE.showItbisBreakdown,
                showPatient: tpl.showPatient ?? DEFAULT_PRINT_TEMPLATE.showPatient,
                showCashier: tpl.showCashier ?? DEFAULT_PRINT_TEMPLATE.showCashier,
                footerText: tpl.footerText ?? DEFAULT_PRINT_TEMPLATE.footerText,
                showFiscalMessage: tpl.showFiscalMessage ?? DEFAULT_PRINT_TEMPLATE.showFiscalMessage,
                paperWidth: currentWidth,
            });
            
            // Cast to string to safely evaluate if it was saved as A4
            if (String(currentWidth) === "A4") {
                setActiveTab("a4");
            }
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

    const handleTabChange = (value: string) => {
        const tab = value as "ticket" | "a4";
        setActiveTab(tab);
        if (tab === "a4") {
            set("paperWidth", "A4" as PaperWidth);
        } else {
            set("paperWidth", "80mm");
        }
    };

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

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold tracking-tight">Plantillas de impresión</h1>
                <p className="text-sm text-muted-foreground">
                    Personaliza los formatos de los comprobantes y recibos del sistema.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full print:hidden">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="ticket">Ticket Térmico</TabsTrigger>
                    <TabsTrigger value="a4">Recibo A4 / Carta</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* --- VISTA DE PESTAÑA: TICKET TÉRMICO --- */}
            {activeTab === "ticket" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                    <form onSubmit={onSubmit} className="max-w-xl space-y-6 print:hidden">
                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Encabezado</h3>
                            <Toggle
                                checked={form.showLogo}
                                onChange={(v) => set("showLogo", v)}
                                label="Mostrar logotipo en el documento"
                            />
                            <div className="space-y-2">
                                <Label htmlFor="t-header">Texto de encabezado alternativo</Label>
                                <Input
                                    id="t-header"
                                    value={form.headerText}
                                    onChange={(e) => set("headerText", e.target.value)}
                                    placeholder="Cerilab SRL (Por defecto)"
                                />
                            </div>
                            <Toggle checked={form.showRnc} onChange={(v) => set("showRnc", v)} label="Mostrar RNC" />
                            <Toggle checked={form.showPhone} onChange={(v) => set("showPhone", v)} label="Mostrar teléfono" />
                            <Toggle checked={form.showAddress} onChange={(v) => set("showAddress", v)} label="Mostrar dirección" />
                        </section>

                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Cuerpo</h3>
                            <Toggle
                                checked={form.showItbisBreakdown}
                                onChange={(v) => set("showItbisBreakdown", v)}
                                label="Mostrar desglose de ITBIS"
                            />
                            <Toggle checked={form.showPatient} onChange={(v) => set("showPatient", v)} label="Mostrar paciente" />
                            <Toggle checked={form.showCashier} onChange={(v) => set("showCashier", v)} label="Mostrar cajero" />
                        </section>

                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Pie de página</h3>
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
                            <h3 className="font-semibold">Ancho del Papel de Ticket</h3>
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

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Formato Ticket
                            </Button>
                            <Button type="button" variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
                                <Printer className="mr-2 h-4 w-4" /> Probar Impresión
                            </Button>
                        </div>
                    </form>

                    {/* Vista Previa Ticket */}
                    <div className="lg:sticky lg:top-4 lg:self-start print:p-0 print:m-0 print:absolute print:top-0 print:left-0 print:w-full">
                        <p className="mb-2 text-sm font-medium text-muted-foreground print:hidden text-center lg:text-left">
                            Vista previa Rollo ({form.paperWidth})
                        </p>
                        <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200 shadow-inner max-h-[85vh] overflow-y-auto print:bg-white print:p-0 print:border-none print:shadow-none print:overflow-visible mx-auto">
                            <InvoiceComponent invoice={undefined} payments={undefined} templateConfig={form} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- VISTA DE PESTAÑA: RECIBO A4 --- */}
            {activeTab === "a4" && (
                <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
                    <form onSubmit={onSubmit} className="max-w-xl space-y-6 print:hidden">
                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Encabezado</h3>
                            <Toggle
                                checked={form.showLogo}
                                onChange={(v) => set("showLogo", v)}
                                label="Mostrar logotipo en el documento"
                            />
                            <div className="space-y-2">
                                <Label htmlFor="a4-header">Texto de encabezado alternativo</Label>
                                <Input
                                    id="a4-header"
                                    value={form.headerText}
                                    onChange={(e) => set("headerText", e.target.value)}
                                    placeholder="Cerilab SRL (Por defecto)"
                                />
                            </div>
                            <Toggle checked={form.showRnc} onChange={(v) => set("showRnc", v)} label="Mostrar RNC" />
                            <Toggle checked={form.showPhone} onChange={(v) => set("showPhone", v)} label="Mostrar teléfono" />
                            <Toggle checked={form.showAddress} onChange={(v) => set("showAddress", v)} label="Mostrar dirección" />
                        </section>

                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Cuerpo</h3>
                            <Toggle
                                checked={form.showItbisBreakdown}
                                onChange={(v) => set("showItbisBreakdown", v)}
                                label="Mostrar desglose de ITBIS"
                            />
                            <Toggle checked={form.showPatient} onChange={(v) => set("showPatient", v)} label="Mostrar paciente" />
                            <Toggle checked={form.showCashier} onChange={(v) => set("showCashier", v)} label="Mostrar cajero" />
                        </section>

                        <section className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Pie de página</h3>
                            <div className="space-y-2">
                                <Label htmlFor="a4-footer">Texto de pie</Label>
                                <Textarea
                                    id="a4-footer"
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

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Formato A4
                            </Button>
                            <Button type="button" variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
                                <Printer className="mr-2 h-4 w-4" /> Probar Impresión A4
                            </Button>
                        </div>
                    </form>

                    {/* Vista Previa Completa en A4 */}
                    <div className="w-full xl:w-[700px] lg:sticky lg:top-4 lg:self-start print:p-0 print:m-0 print:absolute print:top-0 print:left-0 print:w-full">
                        <p className="mb-2 text-sm font-medium text-muted-foreground print:hidden">
                            Vista previa Estándar (A4 / Carta)
                        </p>
                        <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200 shadow-inner max-h-[85vh] overflow-y-auto print:bg-white print:p-0 print:border-none print:shadow-none print:overflow-visible">
                            <div className="bg-white shadow-lg border border-zinc-300 p-8 mx-auto w-full max-w-[210mm] min-h-[297mm] rounded-sm print:shadow-none print:border-none print:p-0">

                                <MedicalInvoice/>
                                <InvoiceComponent invoice={undefined} payments={undefined} templateConfig={form} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
