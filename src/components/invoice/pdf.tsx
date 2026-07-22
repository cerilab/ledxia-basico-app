import React from 'react';
import type { Invoice } from "@/lib/types";

interface MedicalInvoiceProps {
    invoice: Invoice | null;
}

const colorThemes = {
    emerald: {
        bg: "bg-emerald-700",
        text: "text-emerald-800",
        border: "border-emerald-700",
        textLight: "text-emerald-600",
        badge: "bg-emerald-700"
    },
    purple: {
        bg: "bg-purple-700",
        text: "text-purple-800",
        border: "border-purple-700",
        textLight: "text-purple-600",
        badge: "bg-purple-700"
    },
    blue: {
        bg: "bg-blue-700",
        text: "text-blue-800",
        border: "border-blue-700",
        textLight: "text-blue-600",
        badge: "bg-blue-700"
    },
    red: {
        bg: "bg-red-700",
        text: "text-red-800",
        border: "border-red-700",
        textLight: "text-red-600",
        badge: "bg-red-700"
    }
};

export default function MedicalInvoice({ invoice }: MedicalInvoiceProps) {
    if (!invoice) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground font-sans">
                Cargando datos de la factura...
            </div>
        );
    }

    let theme = colorThemes.emerald; // Default

    if (invoice.fiscalRegime === "fiscal") {
        theme = colorThemes.blue;
    } else if (invoice.status === "cancelled") {
        theme = colorThemes.red;
    } else if (invoice.status === "pending") {
        theme = colorThemes.purple;
    }

    const items = invoice.items || [];
    const totalAmount = invoice.total || 0;
    const subtotalAmount = invoice.subtotal || 0;

    // Obtención dinámica del monto entregado y el cambio/devuelta calculados
    const amountTendered = (invoice as any).amountTendered ?? invoice.paidAmount ?? 0;
    const changeGiven = (invoice as any).changeGiven ?? (amountTendered > totalAmount ? amountTendered - totalAmount : 0);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:bg-white print:p-0">
            {/* Main Invoice Container exacto al diseño */}
            <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-200 shadow-sm font-sans text-[11px] text-gray-800 print:shadow-none print:border-none print:p-0">

                {/* HEADER SECTION */}
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                    <div className="text-center md:text-left">
                        <div className="flex items-center space-x-1 justify-center md:justify-start">
                            <span className="text-4xl font-black tracking-tight text-slate-900">
                                <span className="text-blue-800">C</span>erilab
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-slate-800 align-super pt-3">SRL</span>
                        </div>
                        <p className="text-[9px] font-bold text-blue-900 tracking-wider text-center md:text-left uppercase mt-0.5">Centro Diagnóstico</p>
                        <div className="mt-3 space-y-0.5 text-gray-600 text-[10px]">
                            <p className="font-bold text-gray-800">RNC 1-3151696-3</p>
                            <p>Ave. Santa Rosa #55, La Romana</p>
                            <p>Tel: +1 (809) 848-6263</p>
                        </div>
                    </div>

                    <div className="text-right space-y-1 text-gray-700">
                        <h2 className="text-[13px] font-black uppercase tracking-tight text-slate-900">
                            {invoice.fiscalRegime === "fiscal" ? "Factura de Crédito Fiscal" : "Factura de Consumo"}
                        </h2>
                        <div className={`inline-block text-white font-bold text-[9px] px-4 py-0.5 rounded-md uppercase tracking-wider ${theme.badge}`}>
                            {invoice.fiscalRegime === "fiscal" ? "Fiscal" : "Privada"}
                        </div>
                        <div className="pt-2 space-y-0.5 text-right text-[10px]">
                            <p><span className="font-semibold text-gray-500">No. Factura:</span> <span className="text-red-600 font-bold font-mono">{invoice.invoiceNumber ?? "F-2026-825613"}</span></p>
                            <p><span className="font-semibold text-gray-500">e-NCF:</span> <span className="font-mono">E320002785248</span></p>
                            <p><span className="font-semibold text-gray-500">Fecha de emisión:</span> {new Date(invoice.issuedAt).toLocaleDateString("es-DO")}</p>
                            <p><span className="font-semibold text-gray-500">Vence Secuencia:</span> 31/12/2026</p>
                            <p><span className="font-semibold text-gray-500">Sucursal:</span> Sucursal Romana II</p>
                            <p><span className="font-semibold text-gray-500">Atendido por:</span> María Victoria Mir Marte</p>
                        </div>
                    </div>
                </div>

                {/* PATIENT DATA SECTION */}
                <div className={`border ${theme.border} rounded-md mb-4 overflow-hidden`}>
                    <div className={`text-white font-bold px-3 py-1 text-[11px] tracking-wide ${theme.bg}`}>
                        DATOS DEL PACIENTE
                    </div>
                    <div className="p-3 grid grid-cols-12 gap-y-2 gap-x-4 text-gray-700">
                        <div className="col-span-12 flex"><span className="font-bold w-20 text-gray-500">Nombre:</span> <span className="font-bold text-gray-900 uppercase">{invoice.patientName}</span></div>
                        <div className="col-span-4 flex"><span className="font-bold w-20 text-gray-500">Cédula:</span> <span className="font-mono">{invoice.patientId || "026-0122514-3"}</span></div>
                        <div className="col-span-5 flex"><span className="font-bold w-24 text-gray-500">F. Nacimiento:</span> <span>14/03/1987</span></div>
                        <div className="col-span-3 flex"><span className="font-bold w-12 text-gray-500">Edad:</span> <span>39 años</span></div>

                        <div className="col-span-4 flex"><span className="font-bold w-20 text-gray-500">Teléfono:</span> <span>809-963-4840</span></div>
                        <div className="col-span-5 flex"><span className="font-bold w-24 text-gray-500">Médico:</span> <span>Dr. José Pérez</span></div>
                        <div className="col-span-3 flex"><span className="font-bold w-12 text-gray-500">Sexo:</span> <span className="uppercase">F</span></div>

                        <div className="col-span-12 flex"><span className="font-bold w-20 text-gray-500">Dirección:</span> <span>Calle Santa Rosa #55, esq. Duarte, La Romana</span></div>
                        <div className="col-span-6 flex"><span className="font-bold w-20 text-gray-500">Servicio:</span> <span className="font-medium">Laboratorio</span></div>
                        <div className="col-span-6 flex"><span className="font-bold w-24 text-gray-500">Fecha y hora:</span> <span>{new Date(invoice.issuedAt).toLocaleString("es-DO")}</span></div>
                    </div>
                </div>

                {/* SERVICES TABLE */}
                <div className={`border-x border-b ${theme.border} rounded-t-md overflow-hidden mb-4`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className={`text-white font-bold text-[10px] uppercase tracking-wider ${theme.bg}`}>
                            <th className="p-2 w-7/12">Servicio</th>
                            <th className="p-2 text-center w-1/12">Cant.</th>
                            <th className="p-2 text-right w-2/12">Precio Unit.</th>
                            <th className="p-2 text-right w-2/12">Total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                            <tr key={index} className="text-gray-700 hover:bg-gray-50/50">
                                <td className="p-2 font-medium">{item.description}</td>
                                <td className="p-2 text-center font-mono">{item.quantity}</td>
                                <td className="p-2 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                                <td className="p-2 text-right font-medium font-mono">{item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* SUB-TOTAL INSIDE TABLE BORDER */}
                    <div className="flex justify-between items-center bg-gray-50/80 border-t py-2 px-3 font-bold text-gray-900">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">SUB-TOTAL</span>
                        <span className="font-mono text-xs">RD${subtotalAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* LOGS, PAYMENTS & QR SECTION */}
                <div className="grid grid-cols-12 gap-4 items-start mb-6">
                    {/* Caja de Balance / Recibo exacto */}
                    <div className={`col-span-7 border ${theme.border} rounded-md p-3 space-y-2 bg-white shadow-xs`}>
                        <div className="flex justify-between font-black text-[12px] text-gray-900 pb-1 border-b border-gray-100">
                            <span>TOTAL A PAGAR</span>
                            <span className="font-mono">RD${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>PAGADO (EFECTIVO RECIBIDO)</span>
                            <span className="font-mono text-gray-900">RD${amountTendered.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>CAMBIO (DEVOLUCIÓN)</span>
                            <span className="font-mono text-gray-900">RD${changeGiven.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-[10px] pt-1 border-t border-dashed">
                            <span>MÉTODO DE PAGO:</span>
                            <span className="font-bold text-gray-800 uppercase">Efectivo</span>
                        </div>
                    </div>

                    {/* Área QR Dinámica lateral */}
                    <div className="col-span-5 flex flex-col items-center justify-center text-[9px] text-gray-500 border rounded-md p-2 bg-gray-50/50">
                        <div className="text-center space-y-1">
                            <div className="w-16 h-16 bg-gray-200 mx-auto border flex items-center justify-center font-mono text-[7px] text-gray-400 shadow-inner">[QR Resultados]</div>
                            <p className="font-bold text-gray-700 leading-tight">Escanea para ver<br/>tus resultados</p>
                        </div>
                        <div className="text-center mt-2 pt-1 border-t border-gray-200 w-full flex items-center justify-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 border flex items-center justify-center font-mono text-[5px] text-gray-400">[QR]</div>
                            <p className="text-[8px] text-gray-600 font-medium">QR Cédula</p>
                        </div>
                    </div>
                </div>

                {/* OBSERVATIONS LINE */}
                <div className="pt-2 mb-6 text-[10px] text-gray-600">
                    <span className="font-bold">Observaciones:</span>
                    <div className="border-b border-gray-300 w-full h-4 inline-block opacity-60"></div>
                </div>

                {/* FOOTER DGII LEGAL TERMS */}
                <div className="border-t pt-3 flex justify-between items-end text-[9px] text-gray-400 font-mono">
                    <div className="space-y-0.5">
                        <p><span className="font-semibold text-gray-500">Cód. Seguridad:</span> IKJLB1</p>
                        <p><span className="font-semibold text-gray-500">Fecha de Firma Digital:</span> {new Date(invoice.issuedAt).toLocaleString("es-DO")}</p>
                        <p><span className="font-semibold text-gray-500">No. Reg:</span> 46968539</p>
                    </div>
                    <div className="text-right font-sans space-y-0.5">
                        <p className="font-bold text-gray-600 text-[10px]">Comprobante fiscal válido ante la DGII</p>
                        <p className="text-gray-400">Powered by <span className="font-semibold text-gray-500">Ledxia</span> - ledxia.com</p>
                    </div>
                </div>

                {/* BARRA INFERIOR DE ENTREGA */}
                <div className={`mt-4 text-white font-bold px-3 py-1 text-[10px] rounded-md flex items-center space-x-2 ${theme.bg}`}>
                    <span>🖨️ Entrega de resultados: Realice sus consultas en línea de forma segura.</span>
                </div>
            </div>
        </div>
    );
}
