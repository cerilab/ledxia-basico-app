"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetrievedata } from "@/components/queries/retrieve";

const STATS = [
  { label: "Pacientes", value: "—" },
  { label: "Facturas de hoy", value: "—" },
  { label: "Cobrado hoy", value: "—" },
  { label: "Pendientes de pago", value: "—" },
];

export default function DashboardPage() {

    const { 
      services, 
      filteredServices, 
      loading, 
      term, 
      setTerm 
    } = useRetrievedata();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inicio</h2>
        <p className="text-sm text-muted-foreground">Resumen de la clínica.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
