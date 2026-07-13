import React from 'react';

// TypeScript interfaces for type safety
interface InvoiceHeader {
  providerName: string;
  providerSubtitle: string;
  rnc: string;
  address: string;
  phone: string;
  invoiceType: string;
  invoiceNo: string;
  eNcf: string;
  emissionDate: string;
  expirySequence: string;
  branch: string;
  serviceCode: string;
  attendedBy: string;
}

interface PatientData {
  name: string;
  cedula: string;
  dob: string;
  age: string;
  phone: string;
  doctor: string;
  gender: string;
  address: string;
  serviceType: string;
  dateTime: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function MedicalInvoice() {
  // Hardcoded data from your image sample
  const headerData: InvoiceHeader = {
    providerName: "Cerilab",
    providerSubtitle: "CENTRO DIAGNÓSTICO",
    rnc: "1-3151696-3",
    address: "Ave. Santa Rosa #55, La Romana",
    phone: "+1 (809) 848-6263",
    invoiceType: "FACTURA DE CONSUMO Empresa",
    invoiceNo: "F-2026-825613",
    eNcf: "E320002785248",
    emissionDate: "22/06/2026",
    expirySequence: "31/12/2026",
    branch: "Sucursal Romana II",
    serviceCode: "SRV-246429084",
    attendedBy: "María Victoria Mir Marte"
  };

  const patientData: PatientData = {
    name: "KIRSI MARGARITA QUEZADA BERROA",
    cedula: "026-0122514-3",
    dob: "14/03/1987",
    age: "39 años",
    phone: "809-963-4840",
    doctor: "Dr. José Pérez",
    gender: "F",
    address: "Calle Santa Rosa #55, esq. Duarte, La Romana",
    serviceType: "Laboratorio",
    dateTime: "22/06/2026 2:10 p. m."
  };

  const items: InvoiceItem[] = [
    { description: "Hemograma completo (CBC con diferencial)", quantity: 1, unitPrice: 380.00, total: 380.00 },
    { description: "Glucosa en ayunas", quantity: 1, unitPrice: 250.00, total: 250.00 }
  ];

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:bg-white print:p-0">

      {/* Main Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-200 shadow-sm font-sans text-xs text-gray-800 print:shadow-none print:border-none print:p-0">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-900">
              <span className="text-3xl font-extrabold tracking-tight">{headerData.providerName}</span>
              <span className="text-xs font-semibold tracking-wider bg-sky-900 text-white px-1 rounded-sm">SRL</span>
            </div>
            <p className="text-[10px] font-bold text-sky-900 tracking-widest mt-0.5">{headerData.providerSubtitle}</p>
            <div className="mt-3 space-y-0.5 text-gray-600">
              <p><span className="font-semibold">RNC:</span> {headerData.rnc}</p>
              <p>{headerData.address}</p>
              <p><span className="font-semibold">Tel:</span> {headerData.phone}</p>
            </div>
          </div>

          <div className="text-right space-y-1 text-gray-700">
            <h2 className="text-sm font-bold text-emerald-800">{headerData.invoiceType.split(' ')[0]} {headerData.invoiceType.split(' ')[1]}</h2>
            <div className="inline-block bg-violet-700 text-white font-bold text-[10px] px-3 py-0.5 rounded-sm mb-1">
              {headerData.invoiceType.split(' ').slice(2).join(' ')}
            </div>
            <p><span className="font-semibold text-gray-500">No. Factura:</span> <span className="text-red-600 font-bold">{headerData.invoiceNo}</span></p>
            <p><span className="font-semibold text-gray-500">e-NCF:</span> {headerData.eNcf}</p>
            <p><span className="font-semibold text-gray-500">Fecha de emisión:</span> {headerData.emissionDate}</p>
            <p><span className="font-semibold text-gray-500">Vence Secuencia:</span> {headerData.expirySequence}</p>
            <p><span className="font-semibold text-gray-500">Sucursal:</span> {headerData.branch}</p>
            <p><span className="font-semibold text-gray-500">Cód. Servicio:</span> {headerData.serviceCode}</p>
            <p><span className="font-semibold text-gray-500">Atendido por:</span> {headerData.attendedBy}</p>
          </div>
        </div>

        {/* PATIENT DATA SECTION */}
        <div className="border border-emerald-700 rounded-sm mb-4 overflow-hidden">
          <div className="bg-violet-700 text-white font-bold px-3 py-1 text-[11px] tracking-wide">
            DATOS DEL PACIENTE
          </div>
          <div className="p-3 grid grid-cols-12 gap-y-2 gap-x-4">
            <div className="col-span-12 flex"><span className="font-semibold w-24 text-gray-600">Nombre:</span> <span className="font-bold">{patientData.name}</span></div>
            <div className="col-span-4 flex"><span className="font-semibold w-24 text-gray-600">Cédula:</span> <span>{patientData.cedula}</span></div>
            <div className="col-span-5 flex"><span className="font-semibold w-28 text-gray-600">F. Nacimiento:</span> <span>{patientData.dob}</span></div>
            <div className="col-span-3 flex"><span className="font-semibold w-16 text-gray-600">Edad:</span> <span>{patientData.age}</span></div>
            
            <div className="col-span-4 flex"><span className="font-semibold w-24 text-gray-600">Teléfono:</span> <span>{patientData.phone}</span></div>
            <div className="col-span-5 flex"><span className="font-semibold w-28 text-gray-600">Médico que atiende:</span> <span>{patientData.doctor}</span></div>
            <div className="col-span-3 flex"><span className="font-semibold w-16 text-gray-600">Sexo:</span> <span>{patientData.gender}</span></div>

            <div className="col-span-12 flex"><span className="font-semibold w-24 text-gray-600">Dirección:</span> <span>{patientData.address}</span></div>
            
            <div className="col-span-6 flex"><span className="font-semibold w-24 text-gray-600">Servicio:</span> <span>{patientData.serviceType}</span></div>
            <div className="col-span-6 flex"><span className="font-semibold w-28 text-gray-600">Fecha y hora:</span> <span>{patientData.dateTime}</span></div>
          </div>
        </div>

        {/* SERVICES TABLE */}
        <table className="w-full text-left border-collapse mb-2">
          <thead>
            <tr className="bg-violet-700 text-white font-bold text-[10px] uppercase tracking-wider">
              <th className="p-2 w-7/12">Servicio</th>
              <th className="p-2 text-center w-1/12">Cant.</th>
              <th className="p-2 text-right w-2/12">Precio Unit.</th>
              <th className="p-2 text-right w-2/12">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="text-gray-700">
                <td className="p-2 font-medium">{item.description}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">RD${item.unitPrice.toFixed(2)}</td>
                <td className="p-2 text-right font-medium">RD${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUB-TOTAL */}
        <div className="flex justify-between items-center bg-gray-50 border-y py-1.5 px-2 mb-6 font-bold">
          <span>SUB-TOTAL</span>
          <span>RD${totalAmount.toFixed(2)}</span>
        </div>

        {/* PAYMENT DETAILS & QR */}
        <div className="grid grid-cols-12 gap-4 items-start mb-6">
          <div className="col-span-6 border rounded-sm p-3 space-y-1.5">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL A PAGAR</span>
              <span>RD${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-1.5">
              <span>PAGADO</span>
              <span>RD${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>CAMBIO</span>
              <span>RD$0.00</span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-1.5">
              <span>MÉTODO DE PAGO:</span>
              <span className="font-medium text-gray-800">Efectivo</span>
            </div>
          </div>

          {/* QR Area placeholders matches design layout */}
          <div className="col-span-6 flex flex-col items-center justify-center space-y-3 text-[9px] text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 mx-auto mb-1 border flex items-center justify-center font-mono text-[8px] text-gray-400">[QR Resultados]</div>
              <p className="font-medium text-gray-700">Escanea para ver<br/>tus resultados</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-200 mx-auto mb-0.5 border flex items-center justify-center font-mono text-[8px] text-gray-400">[QR Cédula]</div>
              <p className="text-[8px]">QR Cédula</p>
            </div>
          </div>
        </div>

        {/* OBSERVATIONS */}
        <div className="border-t pt-2 mb-4 text-[10px]">
          <span className="font-semibold text-gray-600">Observaciones:</span>
          <div className="border-b border-gray-300 w-full h-4 inline-block"></div>
        </div>

        {/* FOOTER DGII LEGAL TERMS */}
        <div className="border-t pt-3 flex justify-between items-end text-[9px] text-gray-500">
          <div>
            <p><span className="font-semibold">Cód. Seguridad:</span> IKJLB1</p>
            <p><span className="font-semibold">Fecha de Firma Digital:</span> 22/06/2026 2:10 p. m.</p>
            <p><span className="font-semibold">No. Reg:</span> 46968539</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Comprobante fiscal válido ante la DGII</p>
            <p>Powered by Ledxia - ledxia.com</p>
          </div>
        </div>

        {/* GREEN BOTTOM STATUS BAR */}
        <div className="bg-violet-800 text-white font-bold p-1 text-[10px] mt-4 rounded-sm flex items-center">
          <span className="mr-2">🖨️</span> Entrega de resultados: __________________________________________________
        </div>

      </div>
    </div>
  );
}