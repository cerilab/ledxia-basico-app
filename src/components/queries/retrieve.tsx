import { useAuth } from "@/lib/auth/context";
import { servicesCol } from "@/lib/data/services";
import { Service } from "@/lib/types";
import { getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export default function useRetrieveServices() {     
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!tenantId) {
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

          // Find where the JSON array or collection lives inside the document
          const rawPayload = data.services || data.datos || data.items || data;

          // Helper function to map a single JSON object into our Service structure
          const mapItemToService = (innerData: any, index: number): Service => {
            // Debug point: logs keys to console if fields are missing
            if (!innerData.EXAMEN && !innerData.examen && !innerData.Examen) {
              console.warn(`Mismatched properties at doc [${doc.id}] index [${index}]. Available keys:`, Object.keys(innerData));
            }

            const codigo = innerData.CODIGO ?? innerData.codigo ?? innerData.id ?? innerData.ID ?? `${doc.id}-${index}`;
            
            // Expanded fallback chain to look for common text alternatives
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

            // Handle 1 or 0 binary indicators cleanly
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
              entregaimagen: Number(imgDeliv) === 1 || imgDeliv === true,
              entregaLab: Number(labDeliv) === 1 || labDeliv === true,
            };
          };

          // If the JSON payload is an array inside the document, loop through it
          if (Array.isArray(rawPayload)) {
            rawPayload.forEach((item, index) => {
              fetchedServices.push(mapItemToService(item, index));
            });
          } else if (typeof rawPayload === "object" && rawPayload !== null) {
            // If it's a map/dictionary container of items instead of a flat array
            const values = Object.values(rawPayload);
            if (values.length > 0 && typeof values[0] === "object") {
              values.forEach((item, index) => {
                fetchedServices.push(mapItemToService(item, index));
              });
            } else {
              // Standard single fallback document
              fetchedServices.push(mapItemToService(rawPayload, 0));
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

  // Derived filtered results state
  const filteredServices = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return services;

    return services.filter((s) => {
      const nameMatch = s.Examen ? s.Examen.toLowerCase().includes(t) : false;
      const codeMatch = s.Codigo ? s.Codigo.toLowerCase().includes(t) : false;
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