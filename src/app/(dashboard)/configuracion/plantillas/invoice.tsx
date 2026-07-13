import { PrintTemplateInput } from "@/lib/data/settings";
import type { Invoice, Payment } from "@/lib/types";
import { formatPrice } from "@/lib/data/services";
import { cn } from "@/lib/utils";
import { Button } from "@base-ui/react";

export interface InvoiceProps {
    invoice?: any;
    payments?: any[];
    currentPaymentChange?: number;
    currentPaymentMethod?: string;
    templateConfig?: PrintTemplateInput;
}

interface PreviewInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface PreviewInvoice {
    id?: string;
    invoiceNumber?: string | null;
    patientName: string;
    patientId?: string;
    issuedAt: string | Date;
    subtotal: number;
    total: number;
    paidAmount: number;
    items: PreviewInvoiceItem[];
    ecf?: { ncf?: string };
}

const MOCK_INVOICE: PreviewInvoice = {
    id: "srv-26429084",
    invoiceNumber: "F-2026-825613",
    patientName: "KIRSI MARGARITA QUEZADA BERROA",
    patientId: "026-0122514-3",
    issuedAt: "2026-06-22T14:10:00",
    subtotal: 630.00,
    total: 630.00,
    paidAmount: 630.00,
    ecf: { ncf: "E320002785248" },
    items: [
        { description: "Hemograma completo (CBC con diferencial)", quantity: 1, unitPrice: 380.00, total: 380.00 },
        { description: "Glucosa en ayunas", quantity: 1, unitPrice: 250.00, total: 250.00 }
    ]
};

export function InvoiceComponent({
                                   invoice,
                                   payments = [],
                                   currentPaymentChange = 70.00,
                                   currentPaymentMethod = "Efectivo",
                                   templateConfig,
                               }: InvoiceProps) {

    
    const data = invoice ?? MOCK_INVOICE;

    
    const showLogo = templateConfig?.showLogo ?? true;
    const customHeader = templateConfig?.headerText || "Cerilab";
    const showRnc = templateConfig?.showRnc ?? true;
    const showPhone = templateConfig?.showPhone ?? true;
    const showAddress = templateConfig?.showAddress ?? true;
    const showPatient = templateConfig?.showPatient ?? true;
    const showCashier = templateConfig?.showCashier ?? true;
    const customFooter = templateConfig?.footerText || "Gracias por su preferencia";
    const showFiscalMessage = templateConfig?.showFiscalMessage ?? true;
    const paperWidthClass = templateConfig?.paperWidth === "58mm" ? "w-[58mm] text-[10px]" : "w-[80mm] text-[11px]";

    const formatDateStr = (dateInput: string | Date): string => {
        try {
            return new Date(dateInput).toLocaleDateString("es-DO", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            });
        } catch {
            return "22/06/26";
        }
    };

    const formatDateTimeStr = (dateInput: string | Date): string => {
        try {
            const date = new Date(dateInput);
            return date.toLocaleDateString("es-DO", {
                day: "numeric",
                month: "numeric",
                year: "2-digit",
            }) + ", " + date.toLocaleTimeString("es-DO", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }).toLowerCase();
        } catch {
            return "22/6/26, 2:10 p. m.";
        }
    };
    const logourl = "https://picsum.photos/50/50";

    return (
        /* Added print specific text rendering fixes to the main wrapper */
        <div className={cn("bg-white text-black p-4 font-mono leading-tight mx-auto shadow-sm select-none transition-all duration-200 antialiased print:subpixel-antialiased print:text-black", paperWidthClass)}>
            
        
        <div className="flex justify-center mb-2">
            <img src={logourl}/>
        </div>

            {/* Encabezado Dinámico */}
            <div className="text-center space-y-0.5 mb-3">
                {showLogo && (
                    <h1 className="text-xl font-black tracking-tighter text-black uppercase">
                        {customHeader}<span className="text-xs font-bold font-sans lowercase">{customHeader === "Cerilab" ? "srl" : ""}</span>
                    </h1>
                )}
                <p className="text-[9px] uppercase font-bold tracking-widest text-black">
                    Centro Diagnóstico
                </p>
                <div className="text-[10px] space-y-0.5 pt-1 text-black">
                    {showRnc && <p>RNC 1-3151696-3</p>}
                    {showAddress && <p>Ave. Santa Rosa #55, La Romana</p>}
                    {showPhone && <p>Tel: +1 (809) 848-6263</p>}
                </div>
                <h2 className="font-bold border-y border-black py-1.5 my-2 tracking-wide uppercase text-xs">
                    Factura de Consumo
                </h2>
            </div>

            {/* Código de barras */}
            <div className="flex flex-col items-center justify-center my-3 space-y-0.5">
                <div
                    className="w-full h-8 bg-black opacity-100"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #000 1px, #000 3px, transparent 3px, transparent 5px, #000 5px, #000 6px)'
                    }}
                />
                <span className="text-[9px] font-bold tracking-[0.2em] text-black uppercase">
          {data.ecf?.ncf ?? "E320002785248"}
        </span>
            </div>

            {/* Metadatos */}
            <div className="space-y-0.5 text-[10px] mb-3 border-b border-black pb-2">
                <div className="flex justify-between"><span>e-NCF (Secuencia)</span><span className="font-bold">{data.ecf?.ncf ?? "E320002785248"}</span></div>
                <div className="flex justify-between"><span>Fecha de emisión</span><span>{formatDateStr(data.issuedAt)}</span></div>
                <div className="flex justify-between"><span>Venc. Secuencial</span><span>31/12/2026</span></div>
                <div className="flex justify-between"><span>Sucursal</span><span>Sucursal Romana II</span></div>
                <div className="flex justify-between"><span>No. Factura</span><span>{data.invoiceNumber ?? "F-2026-825613"}</span></div>
                <div className="flex justify-between"><span>Cód. Servicio</span><span>SRV-26429084</span></div>
                {showCashier && <div className="flex justify-between"><span>Atendido por</span><span className="truncate max-w-[120px]">María Victoria</span></div>}
            </div>

            {/* Datos del Paciente Condicional */}
            {showPatient && (
                <div className="border-t border-black pt-1 mb-3">
                    <div className="bg-black text-white text-center font-bold text-[10px] py-0.5 uppercase tracking-wider mb-2">
                        Datos del Paciente
                    </div>
                    <div className="space-y-0.5 text-[10px] text-black">
                        <div className="font-bold text-[11px] uppercase leading-tight mb-1">
                            Nombre: {data.patientName}
                        </div>
                        <div className="flex justify-between"><span>Cédula</span><span>{data.patientId}</span></div>
                        <div className="flex justify-between"><span>F. Nacimiento</span><span>14/3/87</span></div>
                        <div className="flex justify-between"><span>Teléfono</span><span>809-963-4840</span></div>
                        <p className="truncate">Médico que atiende: Dr. José Pérez</p>
                        <div className="flex justify-between"><span>Edad: 39 año(s)</span><span>Sexo: F</span></div>
                        <div className="flex justify-between pt-1 border-t border-black mt-1"><span>Día y hora</span><span>{formatDateTimeStr(data.issuedAt)}</span></div>
                        <p className="font-bold text-black mt-0.5">Servicio: Laboratorio</p>
                    </div>
                </div>
            )}

            {/* Servicios */}
            <div className="border-t border-black pt-1.5 mb-2">
                <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-black uppercase tracking-wider">
                    <span className="col-span-6">Servicio</span>
                    <span className="col-span-2 text-center">Cant</span>
                    <span className="col-span-2 text-right">Precio</span>
                    <span className="col-span-2 text-right">Total</span>
                </div>

                <div className="divide-y divide-dashed divide-black text-[10px]">
                    {data.items.map((item: PreviewInvoiceItem, index: number) => (
                        <div key={index} className="grid grid-cols-12 py-1.5 items-start">
                            <div className="col-span-6 pr-1 flex flex-col">
                                <span className="font-bold text-black break-words leading-tight">{item.description}</span>
                            </div>
                            <span className="col-span-2 text-center font-mono text-black">{item.quantity}</span>
                            <span className="col-span-2 text-right font-mono text-black">{item.unitPrice.toFixed(2)}</span>
                            <span className="col-span-2 text-right font-mono font-bold text-black">{item.total.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totales */}
            <div className="border-t border-dashed border-black pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-black">
                    <span>Sub-Total</span>
                    <span className="font-mono font-bold">RD${data.subtotal.toFixed(2)}</span>
                </div>

                {templateConfig?.showItbisBreakdown && (
                    <div className="flex justify-between items-center text-black text-[9px]">
                        <span>ITBIS (0%) incluido</span>
                        <span className="font-mono">RD$0.00</span>
                    </div>
                )}

                <div className="border border-black p-1.5 flex justify-between items-center font-black text-[11px] my-1 bg-white">
                    <span className="tracking-wide">TOTAL A PAGAR</span>
                    <span className="font-mono text-xs">RD${data.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-black">
                    <span>Pagado</span>
                    <span className="font-mono">RD${data.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-black">
                    <span>Cambio</span>
                    <span className="font-mono">RD${currentPaymentChange.toFixed(2)}</span>
                </div>
                <p className="pt-1 font-bold text-black">Método de Pago: {currentPaymentMethod}</p>
            </div>

            {/* Bloque QR */}
            <div className="flex flex-col items-center justify-center my-4 space-y-3 pt-3 border-t border-dashed border-black">
                <div className="flex flex-col items-center space-y-1">
                    <div className="w-16 h-16 bg-white border border-black p-1">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://ledxia.com/resultados/${data.id}`}
                            alt="QR Resultados"
                            className="w-full h-full object-contain filter contrast-200"
                        />
                    </div>
                    <span className="text-[8px] font-bold text-black tracking-tight">Escanea para ver tus resultados</span>
                </div>
            </div>

            {/* Pie Personalizado */}
            <div className="text-center text-[9px] space-y-0.5 pt-2 border-t border-black text-black">
                <p className="font-bold text-[10px] my-1 text-black whitespace-pre-line">{customFooter}</p>
                <p>Cód. Seguridad: <span className="font-bold text-black">IKJLB1</span></p>
                <p>Fecha de Firma Digital: {formatDateTimeStr(data.issuedAt)}</p>

                {showFiscalMessage && (
                    <p className="font-bold uppercase text-[8px] pt-1 text-black tracking-wide">
                        Comprobante fiscal válido ante la DGII
                    </p>
                )}
                <p className="text-black font-sans text-[8px] pt-0.5">Powered by <span className="font-bold text-black">Ledxia</span> - ledxia.com</p>

                <div className="pt-4 text-left flex items-center whitespace-nowrap text-[9px]">
                    <span className="font-medium text-black">Entrega de resultados: </span>
                    <div className="w-full border-b border-black ml-1 mb-0.5"></div>
                </div>
            </div>
            <Button className="print:hidden" onClick={() => window.print()}>imprimir</Button>
        </div>
    );
}