import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase/client";
import type { Service } from "@/lib/types";
import { httpsCallable } from "firebase/functions";

export type ServiceInput = Pick<Service, "Codigo" | "Examen" | "Seccion" | "tipo_muestra" | "tipo_envase" | "metodo" | "requisito" | "Entregable" | "Precio_privado" | "entregaimagen" | "entregaLab">;

export function servicesCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "services");
}

export async function createService(tenantId: string, input: ServiceInput) {
  return addDoc(servicesCol(tenantId), {
    ...input,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateService(
  tenantId: string,
  id: string,
  input: Partial<ServiceInput & { active: boolean }>,
) {
  return updateDoc(doc(db, "tenants", tenantId, "services", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
}


export async function uploadServices(tenantId: string, jsonData: Record<string, any>) {
  try {
      return addDoc(servicesCol(tenantId), {
    ...jsonData,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
    
    console.log(`Successfully uploaded JSON for tenant: ${tenantId}`);
  } catch (error) {
    console.error("Error uploading to Firestore:", error);
  }
}