"use client"

import { useAuth } from "@/lib/auth/context";
import { servicesCol } from "@/lib/data/services";
import { Service } from "@/lib/types";
import { getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const mapItemToService = (innerData: any, docId: string, index: number): Service => {
  if (!innerData) {
    return {
      Codigo: `${docId}-${index}`,
      Examen: "Examen inválido",
      Seccion: "—",
      tipo_muestra: "—",
      tipo_envase: "—",
      metodo: "—",
      requisito: "—",
      Entregable: "—",
      Precio_privado: 0,
      entregaimagen: false,
      entregaLab: false,
    };
  }

  if (!innerData.EXAMEN && !innerData.examen && !innerData.Examen) {
    console.warn(`Mismatched properties at doc [${docId}] index [${index}]. Available keys:`, Object.keys(innerData));
  }

  const codigo = innerData.CODIGO ?? innerData.codigo ?? innerData.id ?? innerData.ID ?? `${docId}-${index}`;
  
  const examen = innerData.EXAMEN ?? 
                 innerData.examen ?? 
                 innerData.Examen ?? 
                 innerData.Nombre ?? 
                 innerData.nombre ?? 
                 innerData.Name ?? 
                 innerData.name ?? 
                 "Examen sin nombre";
                 
  const seccion = innerData.SECCION ?? innerData.seccion ?? "—";
  const muestra = innerData.MUESTRA ?? innerData.muestra ?? innerData.tipo_muestra ?? "—";
  const envase = innerData.ENVASE ?? innerData.envase ?? innerData.tipo_envase ?? "—";
  const metodo = innerData.METODO ?? innerData.metodo ?? "—";
  const requisito = innerData.REQUISITO ?? innerData.requisito ?? "—";
  const entregable = innerData.ENTREGABLE ?? innerData.entregable ?? "—";
  const precio = innerData.PRECIO_PRIVADO ?? innerData.precio_privado ?? innerData.Precio_privado ?? innerData.precio ?? 0;

  const imgDeliv = innerData.ENTREGA_IMAGEN ?? innerData.entrega_imagen ?? innerData.entregaimagen ?? 0;
  const labDeliv = innerData.ENTREGA_LAB ?? innerData.entrega_lab ?? innerData.entregaLab ?? 0;

  return {
    Codigo: String(codigo),
    Examen: String(examen),
    Seccion: String(seccion),
    tipo_muestra: String(muestra),
    tipo_envase: String(envase),
    metodo: String(metodo),
    requisito: String(requisito),
    Entregable: String(entregable),
    Precio_privado: Number(precio),
    entregaimagen: Number(imgDeliv) === 1 || imgDeliv === true || imgDeliv === "true",
    entregaLab: Number(labDeliv) === 1 || labDeliv === true || labDeliv === "true",
  };
};

export function useRetrieveServices() {     
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!tenantId) {
      setServices([]); // Clear state if tenant logs out
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("RUTA DE LA COLECCIÓN:", servicesCol(tenantId).path);

    getDocs(servicesCol(tenantId))
      .then((querySnapshot) => {
        const fetchedServices: Service[] = [];

        querySnapshot.forEach((doc) => {
          console.log(`Documento crudo ID [${doc.id}]:`, doc.data());

          const data = doc.data();
          if (!data) return;

          // Target nested structure variations or default to full object
          const rawPayload = data.services || data.datos || data.items || data;

          if (Array.isArray(rawPayload)) {
            rawPayload.forEach((item, index) => {
              fetchedServices.push(mapItemToService(item, doc.id, index));
            });
          } else if (typeof rawPayload === "object" && rawPayload !== null) {
            const values = Object.values(rawPayload);
            
            // Check if it's a key-value record of objects or just a flat document
            if (values.length > 0 && values[0] !== null && typeof values[0] === "object") {
              values.forEach((item, index) => {
                fetchedServices.push(mapItemToService(item, doc.id, index));
              });
            } else {
              // Flat document structure
              fetchedServices.push(mapItemToService(rawPayload, doc.id, 0));
            }
          }
        });

        setServices(fetchedServices);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
      });
  }, [tenantId]);

  const filteredServices = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return services;

    return services.filter((s) => {
      const nameMatch = s.Examen ? String(s.Examen).toLowerCase().includes(t) : false;
      const codeMatch = s.Codigo ? String(s.Codigo).toLowerCase().includes(t) : false;
      return nameMatch || codeMatch;
    });
  }, [services, term]);

  return {
    services,
    filteredServices,
    loading,
    term,
    setTerm,
  };
}

export const useRetrievedata = useRetrieveServices;