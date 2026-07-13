"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Banknote, CreditCard, SendToBack } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
    subscribeInvoices,
    STATUS_LABEL,
    STATUS_VARIANT,
} from "@/lib/data/billing";
import { formatPrice } from "@/lib/data/services";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta de Crédito/Débito",
    transfer: "Transferencia Bancaria",
};

export function InvoicesClient() {
    const { tenantId } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        return subscribeInvoices(tenantId, (invs) => {
            setInvoices(invs);
            setLoading(false);
        });
    }, [tenantId]);

    const getTotalsByMethod = (method: string) => {
        return invoices
            .filter((inv) => inv.paymentMethod === method)
            .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Facturación</h2>
                    <p className="text-sm text-muted-foreground">Historial de facturas y cargos.</p>
                </div>
            </div>

            {/* Main invoices table layout (Now on top) */}
            <div className="rounded-lg border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N°</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Método de Pago</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Pagado</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                    Aún no hay facturas. Empieza desde Recepción.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {inv.invoiceNumber ?? "—"}
                                    </TableCell>
                                    <TableCell className="font-medium">{inv.patientName}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(inv.issuedAt).toLocaleDateString("es-DO")}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {inv.paymentMethod ? (PAYMENT_METHOD_LABEL[inv.paymentMethod] || inv.paymentMethod) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">{formatPrice(inv.total)}</TableCell>
                                    <TableCell className="text-right">{formatPrice(inv.paidAmount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[inv.status]}>
                                            {STATUS_LABEL[inv.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" >
                                            <Link href={`/facturacion/${inv.id}`}>
                                                Ver
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Payment Methods cards displayed below the table */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : formatPrice(getTotalsByMethod("cash"))}
                        </div>
                        <p className="text-xs text-muted-foreground">Total recaudado en caja</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tarjeta Crédito/Débito</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : formatPrice(getTotalsByMethod("card"))}
                        </div>
                        <p className="text-xs text-muted-foreground">Procesado por terminales</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
                        <SendToBack className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : formatPrice(getTotalsByMethod("transfer"))}
                        </div>
                        <p className="text-xs text-muted-foreground">Depósitos bancarios directos</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}