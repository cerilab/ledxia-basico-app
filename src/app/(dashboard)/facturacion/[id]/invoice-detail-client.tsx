"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowLeft,
    Loader2,
    Printer,
    RefreshCw,
    Send,
    Banknote,
    CreditCard,
    SendToBack,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import {
    subscribeInvoice,
    getPaymentsForInvoice,
    registerPayment,
    cancelInvoice,
    STATUS_LABEL,
    STATUS_VARIANT,
    METHOD_LABEL,
    type PaymentInput,
} from "@/lib/data/billing";
import { formatPrice } from "@/lib/data/services";
import { submitEcfFn, createPrintJobFn } from "@/lib/firebase/functions";
import { subscribePrinters, type Printer as PrinterType } from "@/lib/data/printing";
import { ECF_STATUS_LABEL, ECF_STATUS_VARIANT } from "@/lib/data/ecf";
import type { Invoice, Payment, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
    const { tenantId, user } = useAuth();
    const router = useRouter();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Visibilidad de módulos principales
    const [showPayForm, setShowPayForm] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);

    // --- ESTADOS FORMULARIO DE PAGO ESTILO CAJA ---
    const [activeMethod, setActiveMethod] = useState<PaymentMethod>("cash");
    const [cashAmount, setCashAmount] = useState<string>("");
    const [cashTendered, setCashTendered] = useState<string>("");

    const [cardAmount, setCardAmount] = useState<string>("0");
    const [cardLast4, setCardLast4] = useState<string>("");
    const [cardBank, setCardBank] = useState<string>("");
    const [cardVerifone, setCardVerifone] = useState<string>("");
    const [cardHolder, setCardHolder] = useState<string>("");

    const [transferAmount, setTransferAmount] = useState<string>("0");
    const [transferCode, setTransferCode] = useState<string>("");
    const [transferBank, setTransferBank] = useState<string>("");
    const [transferHolder, setTransferHolder] = useState<string>("");

    const [notes, setNotes] = useState<string>("");
    const [autoPrint, setAutoPrint] = useState<boolean>(true);
    const [cobrarAhora, setCobrarAhora] = useState<boolean>(true);
    const [saving, setSaving] = useState(false);

    const paidAmount = invoice?.paidAmount;

    useEffect(() => {
        if (!tenantId) return;
        const unsub = subscribeInvoice(tenantId, invoiceId, (inv) => {
            setInvoice(inv);
            setLoading(false);
        });
        return unsub;
    }, [tenantId, invoiceId]);

    useEffect(() => {
        if (!tenantId || paidAmount == null) return;
        getPaymentsForInvoice(tenantId, invoiceId).then((data) => {
            setPayments(data);
        });
    }, [tenantId, invoiceId, paidAmount]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
                <AlertTriangle className="h-8 w-8" />
                <p>Factura no encontrada.</p>
                <Button variant="outline" >
                    <Link href="/facturacion/lista">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Link>
                </Button>
            </div>
        );
    }

    const remaining = invoice.total - invoice.paidAmount;
    const isClosed = invoice.status === "paid" || invoice.status === "cancelled";
    const isFiscal = invoice.fiscalRegime === "fiscal" && invoice.status !== "cancelled";

    // Parseos numéricos dinámicos
    const parsedCashAmount = parseFloat(cashAmount) || 0;
    const parsedCardAmount = parseFloat(cardAmount) || 0;
    const parsedTransferAmount = parseFloat(transferAmount) || 0;

    // Suma de lo que el usuario pretende distribuir en los métodos
    const totalDistribuido = (activeMethod === "cash" ? parsedCashAmount : 0) +
        (activeMethod === "credit_card" ? parsedCardAmount : 0) +
        (activeMethod === "transfer" ? parsedTransferAmount : 0);

    const parsedTendered = parseFloat(cashTendered) || 0;
    const change = activeMethod === "cash" && parsedTendered > 0 ? Math.max(0, parsedTendered - parsedCashAmount) : 0;
    const isBalanced = Math.abs(totalDistribuido - remaining) < 0.01;

    function handleOpenPayForm() {
        setCashAmount(remaining.toString());
        setCashTendered("");
        setCardAmount("0");
        setTransferAmount("0");
        setActiveMethod("cash");
        setShowCancelForm(false);
        setShowPayForm(true);
    }

    function handleOpenCancelForm() {
        setShowPayForm(false);
        setShowCancelForm(true);
    }

    async function handleRegisterPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!tenantId || !user?.uid) return;

        let finalAmount = 0;
        let referenceStr = "";

        if (activeMethod === "cash") {
            finalAmount = parsedCashAmount;
        } else if (activeMethod === "credit_card") {
            finalAmount = parsedCardAmount;
            referenceStr = `Ref: ${cardVerifone} - Banco: ${cardBank} - Tarjeta: ${cardLast4}`;
        } else if (activeMethod === "transfer") {
            finalAmount = parsedTransferAmount;
            referenceStr = `Ref: ${transferCode} - Banco: ${transferBank}`;
        }

        if (finalAmount <= 0 || finalAmount > remaining) {
            toast.error("El monto distribuido es inválido o excede el pendiente.");
            return;
        }

        setSaving(true);
        try {
            const input: PaymentInput = {
                method: activeMethod,
                amount: finalAmount,
                amountTendered: activeMethod === "cash" ? parsedTendered || finalAmount : undefined,
                reference: referenceStr.trim() || undefined,
            };

            // @ts-ignore
            const result = await registerPayment(tenantId, invoiceId, user.uid, input);

            if (activeMethod === "cash" && result.changeGiven > 0) {
                toast.success(`Pago registrado. Cambio: ${formatPrice(result.changeGiven)}`);
            } else {
                toast.success("Pago registrado exitosamente");
            }

            setShowPayForm(false);
            router.refresh();
        } catch {
            toast.error("No se pudo registrar el pago");
        } finally {
            setSaving(false);
        }
    }

    async function handleCancelInvoice(e: React.FormEvent) {
        e.preventDefault();
        if (!tenantId || !user?.uid ) return;
        setSaving(true);
        try {
            toast.success("Factura anulada");
            setShowCancelForm(false);
            router.push("/facturacion/lista");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            toast.error(msg === "already-cancelled" ? "Ya está anulada" : "No se pudo anular");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-5xl w-full mx-auto p-4">
            {/* Header original */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" >
                    <Link href="/facturacion/lista">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Facturas
                    </Link>
                </Button>
                <Badge variant={STATUS_VARIANT[invoice.status]} className="text-sm">
                    {STATUS_LABEL[invoice.status]}
                </Badge>
            </div>

            <div className="bg-background rounded-xl p-4 border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Factura </span>
                    <h2 className="text-xl font-bold text-foreground">{invoice.invoiceNumber ?? "Cargo sin número"}</h2>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{invoice.patientName}</span> · RNC/Cédula: {invoice.patientId || "02301709404"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Fecha de emisión</p>
                    <p className="text-sm font-medium">
                        {new Date(invoice.issuedAt).toLocaleDateString("es-DO", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {isFiscal && <EcfSection invoiceId={invoiceId} tenantId={tenantId} ecf={invoice.ecf} />}

            {/* Formulario de Caja Estilo Completo (Línea de diseño de la foto) */}
            {!isClosed && showPayForm && (
                <div className="bg-slate-50/50 dark:bg-zinc-900/40 rounded-xl border p-6 space-y-6 shadow-sm animate-in fade-in-50 duration-200">

                    {/* Fila superior informativa */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                        <div className="flex items-center gap-6">
                            <h3 className="text-md font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-primary" /> Caja · Pago de Factura
                            </h3>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="cobrarAhora"
                                    checked={cobrarAhora}
                                    onCheckedChange={(checked) => setCobrarAhora(!!checked)}
                                />
                                <label htmlFor="cobrarAhora" className="text-xs text-muted-foreground font-medium cursor-pointer">
                                    Cobrar ahora mismo <span className="text-zinc-400">(apaga para solo emitir la factura sin cobrar)</span>
                                </label>
                            </div>
                        </div>

                        {/* Indicador de balance superior derecho */}
                        <div className="text-right bg-white dark:bg-zinc-950 p-2 px-4 rounded-lg border shadow-2xs flex items-center gap-6">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total a Pagar</p>
                                <p className="text-md font-black text-slate-900 dark:text-white">{formatPrice(remaining)}</p>
                            </div>
                            <div className="border-l pl-4 flex flex-col items-end">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isBalanced ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                                    {isBalanced ? '✓ Balanceado' : '⚡ Desbalanceado'}
                                </span>
                                <p className="text-xs font-bold mt-0.5 text-emerald-600">{formatPrice(totalDistribuido)}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleRegisterPayment} className="space-y-6">
                        {/* Grid de Métodos de Pago Paralelos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                            {/* COLUMNA 1: EFECTIVO */}
                            <div
                                onClick={() => setActiveMethod("cash")}
                                className={`p-4 rounded-xl border bg-background transition-all cursor-pointer relative ${
                                    activeMethod === "cash" ? "ring-2 ring-emerald-500 border-transparent shadow-md" : "opacity-70 hover:opacity-100"
                                }`}
                            >
                                <div className="flex items-center justify-between border-b pb-2 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                                        <Banknote className="h-4 w-4" /> Efectivo
                                    </span>
                                    <div className={`h-2 w-2 rounded-full ${activeMethod === "cash" ? "bg-emerald-500" : "bg-transparent"}`} />
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Monto</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                className="font-mono text-right font-bold text-base bg-muted/40"
                                                value={cashAmount}
                                                disabled={activeMethod !== "cash"}
                                                onChange={(e) => setCashAmount(e.target.value)}
                                            />
                                            <div className="flex gap-1 mt-1">
                                                <Button type="button" variant="secondary"  className="text-[10px] h-6 px-2" onClick={() => setCashAmount(remaining.toString())}>Total</Button>
                                                <Button type="button" variant="ghost"  className="text-[10px] h-6 px-2 text-destructive" onClick={() => setCashAmount("")}>Borrar</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-1">
                                        <Label className="text-xs text-muted-foreground">Monto Recibido</Label>
                                        <Input
                                            type="number"
                                            placeholder="RD$ 0.00"
                                            className="font-mono text-right"
                                            value={cashTendered}
                                            disabled={activeMethod !== "cash"}
                                            onChange={(e) => setCashTendered(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center mt-2">
                                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Devuelta</span>
                                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(change)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA 2: TARJETA */}
                            <div
                                onClick={() => setActiveMethod("credit_card")}
                                className={`p-4 rounded-xl border bg-background transition-all cursor-pointer relative ${
                                    activeMethod === "credit_card" ? "ring-2 ring-blue-500 border-transparent shadow-md" : "opacity-70 hover:opacity-100"
                                }`}
                            >
                                <div className="flex items-center justify-between border-b pb-2 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                                        <CreditCard className="h-4 w-4" /> Tarjeta
                                    </span>
                                    <div className={`h-2 w-2 rounded-full ${activeMethod === "credit_card" ? "bg-blue-500" : "bg-transparent"}`} />
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Monto</Label>
                                        <Input
                                            type="number"
                                            className="font-mono text-right font-bold"
                                            value={cardAmount}
                                            disabled={activeMethod !== "credit_card"}
                                            onChange={(e) => setCardAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] text-muted-foreground">Últimos 4 Dígitos</Label>
                                            <Input
                                                maxLength={4}
                                                placeholder="7890"
                                                className="text-center font-mono"
                                                value={cardLast4}
                                                disabled={activeMethod !== "credit_card"}
                                                onChange={(e) => setCardLast4(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] text-muted-foreground">Banco Emisor</Label>
                                            <Input
                                                placeholder="BHD, Banreservas..."
                                                value={cardBank}
                                                disabled={activeMethod !== "credit_card"}
                                                onChange={(e) => setCardBank(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] text-muted-foreground">Código Verifone</Label>
                                            <Input
                                                placeholder="045123"
                                                className="font-mono text-center"
                                                value={cardVerifone}
                                                disabled={activeMethod !== "credit_card"}
                                                onChange={(e) => setCardVerifone(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] text-muted-foreground">Titular</Label>
                                            <Input
                                                placeholder="Nombre Completo"
                                                value={cardHolder}
                                                disabled={activeMethod !== "credit_card"}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA 3: TRANSFERENCIA */}
                            <div
                                onClick={() => setActiveMethod("transfer")}
                                className={`p-4 rounded-xl border bg-background transition-all cursor-pointer relative ${
                                    activeMethod === "transfer" ? "ring-2 ring-purple-500 border-transparent shadow-md" : "opacity-70 hover:opacity-100"
                                }`}
                            >
                                <div className="flex items-center justify-between border-b pb-2 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
                                        <SendToBack className="h-4 w-4" /> Transferencia
                                    </span>
                                    <div className={`h-2 w-2 rounded-full ${activeMethod === "transfer" ? "bg-purple-500" : "bg-transparent"}`} />
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Monto</Label>
                                        <Input
                                            type="number"
                                            className="font-mono text-right font-bold"
                                            value={transferAmount}
                                            disabled={activeMethod !== "transfer"}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Código Transferencia</Label>
                                        <Input
                                            placeholder="TRX-875421"
                                            className="font-mono"
                                            value={transferCode}
                                            disabled={activeMethod !== "transfer"}
                                            onChange={(e) => setTransferCode(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Banco Emisor</Label>
                                        <Input
                                            placeholder="Popular, Progreso..."
                                            value={transferBank}
                                            disabled={activeMethod !== "transfer"}
                                            onChange={(e) => setTransferBank(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Titular</Label>
                                        <Input
                                            placeholder="Nombre completo"
                                            value={transferHolder}
                                            disabled={activeMethod !== "transfer"}
                                            onChange={(e) => setTransferHolder(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Campo de Observaciones */}
                        <div className="space-y-2">
                            <Label htmlFor="invoice-notes" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Observación (Opcional)
                            </Label>
                            <Textarea
                                id="invoice-notes"
                                placeholder="Notas al paciente, descuentos aplicados, forma de entrega..."
                                className="resize-none bg-background"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Fila Final de Acciones y Submit */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoPrint"
                                    checked={autoPrint}
                                    onCheckedChange={(checked) => setAutoPrint(!!checked)}
                                />
                                <label htmlFor="autoPrint" className="text-xs font-medium text-muted-foreground cursor-pointer flex items-center gap-1">
                                    <Printer className="h-3.5 w-3.5" /> Imprimir automáticamente
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowPayForm(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || (cobrarAhora && !isBalanced)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                                >
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        `Cobrar ${formatPrice(totalDistribuido || remaining)}`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Resto de secciones originales de desglose (Mesa de servicios, Pagos anteriores, etc.) */}
            <section className="rounded-xl border bg-background shadow-2xs overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Servicio</TableHead>
                            <TableHead className="text-center">Cant.</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">ITBIS</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map((item, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                                <TableCell className="text-right">
                                    {item.taxRate > 0 ? formatPrice(item.taxAmount) : "—"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">{formatPrice(item.total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="border-t px-6 py-4 space-y-1.5 text-sm text-right bg-muted/10">
                    <div className="flex justify-end gap-12 text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="w-24 font-mono">{formatPrice(invoice.subtotal)}</span>
                    </div>
                    {invoice.taxAmount > 0 && (
                        <div className="flex justify-end gap-12 text-muted-foreground">
                            <span>ITBIS</span>
                            <span className="w-24 font-mono">{formatPrice(invoice.taxAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-12 font-bold text-base border-t pt-2 mt-2 text-foreground">
                        <span>Total</span>
                        <span className="w-24 font-mono text-lg">{formatPrice(invoice.total)}</span>
                    </div>
                </div>
            </section>

            {/* Bloque original de acciones básicas cuando el formulario de pago está cerrado */}
            {!isClosed && !showPayForm && !showCancelForm && (
                <div className="rounded-xl border bg-muted/20 p-4 flex items-center justify-between gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Pendiente de cobro: </span>
                        <span className="font-bold text-primary text-base ml-1">{formatPrice(remaining)}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenPayForm} className="px-6">
                            Proceder a Caja
                        </Button>
                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleOpenCancelForm}>
                            Anular Factura
                        </Button>
                    </div>
                </div>
            )}

            {/* Inline Cancellation Module Container */}
            {showCancelForm && (
                <div className="rounded-lg border border-destructive/30 bg-card p-5 space-y-4 shadow-sm">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight text-destructive">Anular factura</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Esta acción no se puede deshacer. Indica el motivo de la anulación.
                        </p>
                    </div>
                    <form onSubmit={handleCancelInvoice} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="inline-cancel-reason">Motivo</Label>
                            <Input
                                id="inline-cancel-reason"
                                required
                                onChange={(e) => console.log("klk")}
                                placeholder="Ej. Error en servicios seleccionados"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowCancelForm(false)}>
                                Volver
                            </Button>
                            <Button type="submit" variant="destructive" disabled={saving }>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Anular Definitivamente
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {payments.length > 0 && (
                <section className="space-y-2">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Historial de Pagos</h3>
                    <div className="rounded-xl border bg-background overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Detalles / Referencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{METHOD_LABEL[p.method] || p.method}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(p.paidAt).toLocaleDateString("es-DO")}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">{formatPrice(p.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            {p.reference || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            )}

            {invoice.status === "cancelled" && invoice.cancellationReason && (
                <p className="text-sm text-muted-foreground font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    Motivo de anulación: <span className="text-foreground font-semibold">{invoice.cancellationReason}</span>
                </p>
            )}

            {invoice.status === "paid" && (
                <PrintSection invoiceId={invoiceId} tenantId={tenantId} />
            )}
        </div>
    );
}

// Sub-componentes auxiliares idénticos de tu código base
function PrintSection({ invoiceId, tenantId }: { invoiceId: string; tenantId?: string }) {
    const [printers, setPrinters] = useState<PrinterType[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState("");
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        if (!tenantId) return;
        const unsub = subscribePrinters(tenantId, (list) => {
            const active = list.filter((p) => p.active);
            setPrinters(active);
            if (active.length > 0 && !selectedPrinter) {
                setSelectedPrinter(active[0].id);
            }
        });
        return unsub;
    }, [tenantId, selectedPrinter]);

    if (printers.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-4 flex items-center gap-3 text-sm text-muted-foreground bg-muted/20">
                <Printer className="h-4 w-4 flex-none" />
                <span>
                    No hay impresoras activas.{" "}
                    <Link href="/configuracion/impresion" className="underline underline-offset-2 hover:text-foreground transition-colors">
                        Configura una en Configuración
                    </Link>
                    .
                </span>
            </div>
        );
    }

    async function handlePrint() {
        if (!tenantId || !selectedPrinter) return;
        setPrinting(true);
        toast("Enviando a impresora…");
        try {
            await createPrintJobFn({ invoiceId, printerId: selectedPrinter });
            toast.success("Trabajo enviado");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            toast.error(`No se pudo enviar: ${msg}`);
        } finally {
            setPrinting(false);
        }
    }

    return (
        <div className="rounded-lg border bg-muted/20 p-4 flex items-center gap-3 flex-wrap">
            <Printer className="h-4 w-4 flex-none text-muted-foreground" />
            <select
                className="flex-1 h-9 min-w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
            >
                {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
            </select>
            <Button size="sm" onClick={handlePrint} disabled={printing || !selectedPrinter}>
                {printing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Imprimir recibo
            </Button>
        </div>
    );
}

function EcfSection({ invoiceId, tenantId, ecf }: { invoiceId: string; tenantId?: string; ecf?: Invoice["ecf"] }) {
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!tenantId) return;
        setSubmitting(true);
        try {
            const res = await submitEcfFn({ invoiceId });
            const { encf, status } = res.data as { encf: string; status: string };
            if (status === "error") {
                toast.error("No se pudo transmitir a la DGII. Verifica los Ajustes e-CF.");
            } else {
                toast.success(`eNCF asignado: ${encf}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            toast.error(`Error: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (!ecf?.ncf) {
        return (
            <div className="rounded-lg border border-dashed p-4 flex items-center justify-between gap-4 bg-muted/10">
                <div>
                    <p className="text-sm font-medium">Comprobante Fiscal Electrónico</p>
                    <p className="text-xs text-muted-foreground">
                        Esta factura es fiscal. Asigna un eNCF y transmítela a la DGII.
                    </p>
                </div>
                <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Asignar e-CF y transmitir
                </Button>
            </div>
        );
    }

    const status = ecf.status ?? "pending";
    const isError = status === "rejected" || status === "error";

    return (
        <div className="rounded-lg border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">e-CF / DGII</p>
                    <p className="font-mono font-semibold">{ecf.ncf}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={ECF_STATUS_VARIANT[status] ?? "secondary"}>
                        {ECF_STATUS_LABEL[status] ?? status}
                    </Badge>
                    {isError && (
                        <Button size="sm" variant="outline" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Reintentar
                        </Button>
                    )}
                </div>
            </div>
            {ecf.trackId && <p className="text-xs text-muted-foreground">Track ID: <span className="font-mono">{ecf.trackId}</span></p>}
            {ecf.message && isError && <p className="text-xs text-destructive">{ecf.message}</p>}
        </div>
    );
}
