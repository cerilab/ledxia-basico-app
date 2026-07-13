/*import React from 'react';
import { InvoiceComponent, InvoiceProps } from '@/app/(dashboard)/configuracion/plantillas/invoice';

export default function CheckoutPage() {
  
  const currentInvoiceData: InvoiceProps = {
    rnc: "RNC: 1-31-12345-6",
    location: "Av. Winston Churchill, Santo Domingo, RD",
    contact: "Tel: (809) 555-0199 | info@ledxia.com",
    logoUrl: "https://via.placeholder.com/150x50?text=Ledxia+Logo",
    currentDate: new Date().toLocaleString(),
    
    // Pass arrays containing the operational details
    fisc: [
      {
        ontcode: "E31000523145",
        digfirm: "abc123xyz789digital-signature-hash",
        noreg: "REG-2026-9941"
      }
    ],
    
    pacientes: [
      {
        nombre: "Juan Pérez Gómez",
        cedula: "001-0000000-1",
        tel: "829-555-4321",
        age: 34,
        birth: "15/04/1992",
        med: "Dr. Carlos Martínez (Cardiólogo)",
        dirr: "Calle Primera #4, Ensanche Naco"
      }
    ],
    
    cart: [
      {
        cart: "Consulta Médica General",
        code: "MED-001",
        cantidad: 1,
        precio: 2500.00,
        total: 2500.00,
        metodo: "Efectivo",
        pagado: 3000.00,
        camb: 500.00
      },
      {
        cart: "Análisis del Hemograma Completo",
        code: "LAB-502",
        cantidad: 1,
        precio: 1200.00,
        total: 1200.00,
        metodo: "Efectivo",
        pagado: 0.00, // Part of the total cash flow transaction
        camb: 0.00
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-700">Panel de Facturación</h1>
        <p className="text-sm text-gray-500">Vista previa del recibo de venta</p>
      </div>

      {  }
      <InvoiceComponent 
        rnc={currentInvoiceData.rnc}
        location={currentInvoiceData.location}
        contact={currentInvoiceData.contact}
        logoUrl={currentInvoiceData.logoUrl}
        currentDate={currentInvoiceData.currentDate}
        fisc={currentInvoiceData.fisc}
        pacientes={currentInvoiceData.pacientes}
        cart={currentInvoiceData.cart}
      />
    </div>
  );
}*/