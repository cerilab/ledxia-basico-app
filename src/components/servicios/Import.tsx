'use client';
import { Button } from '@base-ui/react';
import React, { useState, ChangeEvent, useRef } from 'react';
import { read, utils, WorkBook, WorkSheet } from 'xlsx';
import { ReactFormState } from 'react-dom/client';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/client';
import { Plus } from 'lucide-react';
import { importService } from '@/lib/data/services';



export function ServicesReader() {
    const usrid = "your_user_id"; // Replace with actual user ID or get it from context/auth
    const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = (event: ProgressEvent<FileReader>) => {
            const buffer = event.target?.result;
            if (!buffer) return;

            const workbook: WorkBook = read(buffer, { type: 'buffer' });
            const firstSheetName: string = workbook.SheetNames[0];
            const worksheet: WorkSheet = workbook.Sheets[firstSheetName];

            const json = utils.sheet_to_json<Record<string, unknown>>(worksheet);

            setExcelData(json);
            setIsModalOpen(true);
            
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{ padding: '20px' }}>
            <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }} 
            />
                 
        <Button
          onClick={() => {handleButtonClick(); }}
        >
          importar Servicio
        </Button>

            {isModalOpen && (
                <ServicesModal data={excelData} onClose={() => setIsModalOpen(false)} userid={usrid} />
            )}
        </div>
    );
}

interface ServicesModalProps {
    data: Record<string, unknown>[];
    onClose: () => void;
}

function ServicesModal({ data, onClose, userid }: ServicesModalProps & { userid: string }) {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">preview</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xl px-2"
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 overflow-auto flex-1">
                    {data.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No data found in this sheet.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.map((header) => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row, rowIndex) => (
                                    <tr key={String(row.id) || rowIndex} className="hover:bg-gray-50">
                                        {headers.map((header) => (
                                            <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">
                                                {String(row[header] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                    
                    {/* Fixed onClick syntax & used Base UI Button */}
                    <button 
                        onClick={() => sve(userid, data)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        Subir
                    </button>
                </div>
            </div>
        </div>
    );
}


async function sve(userid: string, data: Record<string, unknown>[]) {

    if(!userid) return;
    //setSaving(true);   
    try {
        const result = await importService(userid, data);
        toast.success("Guardado con éxito");
    } catch (error) {
        console.error("Error uploading data:", error);
        toast.error("No se pudo guardar la configuración");
  }
}