import React from 'react';

// --- TypeScript Interfaces ---
export interface InvoiceProps {
  rnc: string;
  location: string;
  contact: string;
  logoUrl?: string;
  store?: any[];
  pacientes?: Array<{
    nombre: string;
    cedula: string;
    tel: string;
    age: number;
    birth: string;
    med: string;
    dirr: string;
  }>;
  cart?: Array<{
    cart: string;
    code: string;
    cantidad: number;
    precio: number;
    total: number;
    metodo: string;
    pagado: number;
    camb: number;
  }>;
  fisc?: Array<{
    ontcode: string;
    digfirm: string;
    noreg: string;
  }>;
  currentDate: string;
}

export function InvoiceComponent({
  rnc,
  location,
  contact,
  logoUrl = "https://via.placeholder.com/150x50?text=Logo",
  store = [],
  pacientes = [],
  cart = [],
  fisc = [],
  currentDate
}: InvoiceProps) {

  const s = { x: 120, y: 120 };
  const uris = `https://api.qrserver.com/v1/create-qr-code/?size=${s.x}x${s.y}&data=${encodeURIComponent("hola mundo")}&ecc=M`;
  
  // Triggers native browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    // Added print:p-0 print:border-0 print:shadow-none for standard print margins
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 shadow-md font-sans text-sm text-gray-800 relative print:p-0 print:border-0 print:shadow-none print:max-w-full">
      
      {/* Print Action Button - Hides itself during printing */}
      <div className="mb-4 flex justify-end print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded shadow transition-colors"
        >
          Imprimir Factura
        </button>
      </div>

      {/* Header Section */}
      <div className="text-center mb-4">
        {logoUrl && <img src={logoUrl} alt="Business Logo" className="mx-auto mb-2 max-h-12" />}
        <h2 className="font-bold text-lg">{rnc}</h2>
        <p className="text-gray-600 text-xs">{location}</p>
        <p className="text-gray-600 text-xs">{contact}</p>
        <h1 className="text-xl font-black mt-3 tracking-wider">FACTURA DE CONSUMO</h1>
        <div className="my-2 p-2 inline-block bg-gray-100 border border-dashed border-gray-400 print:bg-gray-100">
          <img src={uris} alt="Factura QR" className="w-[100px] h-[100px]" />
        </div>
      </div>

      <hr className="my-3 border-gray-300" />

      {/* Store & Invoice Meta Data */}
      {fisc.map((f, index) => (
        <div key={index} className="grid grid-cols-2 gap-y-1 text-xs mb-4">
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">e-NCF:</span>
            <span>dffgdf</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">Fecha:</span>
            <span>dfgdfg</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">Vence:</span>
            <span>fdgdfgdf</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">Sucursal:</span>
            <span>fdgdfg</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">Cod. Servicio:</span>
            <span>dfgfd</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold"># factura:</span>
            <span>dfgfdg</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="font-semibold">Servido por:</span>
            <span>dfgdfg</span>
          </div>
        </div>
      ))}

      <hr className="my-3 border-gray-300" />

      {/* Patient Data */}
      <div className="mb-4">
        <h3 className="font-bold border-b pb-1 mb-2 text-gray-700 uppercase tracking-wide text-xs">Datos del Paciente</h3>
        {pacientes.map((p, index) => (
          <div key={index} className="grid grid-cols-2 gap-y-1 text-xs">
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Nombre:</span>
              <span>{p.nombre}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Cédula:</span>
              <span>{p.cedula}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Tel:</span>
              <span>{p.tel}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Edad:</span>
              <span>{p.age} años</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">F. Nac:</span>
              <span>{p.birth}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Médico:</span>
              <span>{p.med}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="font-semibold">Dirección:</span>
              <span>{p.dirr}</span>
            </div>
            <div className="col-span-2 flex justify-end text-gray-500 italic mt-1">
              Impreso el: {currentDate}
            </div>
          </div>
        ))}
      </div>

      <hr className="my-3 border-gray-300" />

      {/* Cart / Items Section */}
      <div className="mb-4">
        <h3 className="font-bold border-b pb-1 mb-2 text-gray-700 uppercase tracking-wide text-xs">Servicios</h3>
        <table className="w-full text-xs text-left mb-3">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-1">Descripción</th>
              <th className="py-1 text-right">Cantidad</th>
              <th className="py-1 text-right">Precio</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.code} className="border-b border-gray-100">
                <td className="py-1.5 font-medium">
                  {item.cart} <span className="text-gray-400 text-[10px]">({item.code})</span>
                </td>
                <td className="py-1.5 text-right">{item.cantidad}</td>
                <td className="py-1.5 text-right">${(item.precio).toFixed(2)}</td>
                <td className="py-1.5 text-right font-semibold">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial breakdowns */}
        {cart.map((item) => (
          <div key={`totals-${item.code}`} className="mt-2 text-xs flex flex-col gap-1 bg-gray-50 p-2 rounded print:bg-gray-50">
            <div className="flex justify-between w-full">
              <span className="text-gray-500">Método de Pago:</span> 
              <span className="font-medium">{item.metodo}</span>
            </div>
            <div className="flex justify-between w-full">
              <span className="text-gray-500">Pagado:</span> 
              <span className="font-semibold">${item.pagado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full text-red-600 font-bold print:text-red-600">
              <span>Cambio:</span> 
              <span>${item.camb.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-3 border-gray-300" />

      {/* QR Bottom Placeholders */}
      <div className="flex justify-around my-4 text-center text-[10px] text-gray-500">
        <div className="border p-2 bg-gray-50 rounded print:bg-gray-50">
          <div className="font-mono text-gray-400">[QR RES]</div>
          <span className="block mt-1">Resolución DGII</span>
        </div>
        <div className="border p-2 bg-gray-50 rounded print:bg-gray-50">
          <div className="font-mono text-gray-400">[QR CED]</div>
          <span className="block mt-1">Validación Cédula</span>
        </div>
      </div>

      {/* Fiscal Validation Data */}
      {fisc.map((f, index) => (
        <div key={index} className="text-center text-[11px] text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200 mb-4 break-all print:bg-yellow-50 print:border-yellow-200">
          <p><span className="font-semibold">Código DGII:</span> {f.ontcode}</p>
          <p><span className="font-semibold">Firma Digital:</span> {f.digfirm}</p>
          <p><span className="font-semibold">No. Registro:</span> {f.noreg}</p>
        </div>
      ))}

      {/* Footer Acknowledgments */}
      <div className="text-center mt-6 border-t pt-4 text-xs text-gray-500">
        <div className="flex justify-between text-[11px] mt-1">
          <span className="font-semibold text-gray-600">Código de seguridad:</span>
          <span>jsidkal23</span>
        </div>
        <div className="flex justify-between text-[11px] mt-1 mb-3">
          <span className="font-semibold text-gray-600">Fecha de Firma Digital:</span>
          <span>22/5/2022 2:30</span>
        </div>

        <h2 className="font-bold text-green-700 tracking-wide uppercase my-2 print:text-green-700">
          Comprobante Fiscal Válido para Consumo
        </h2>
        
        <p className="text-[11px]">Ledxia - Ledxia.com</p>

        <div className="mt-4 border-t border-dashed pt-4">
          <div className="w-32 mx-auto border-t border-gray-400 mt-6 mb-1"></div>
          <p className="uppercase text-[10px] tracking-widest font-semibold">Firma Entrega</p>
        </div>
      </div>

    </div>
  );
}