"use client";

import { db } from "@/lib/firebase/client";
import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "@/lib/auth/context";
import { Invoice } from "@/lib/types";

// Interfaz para dar tipado seguro al error de Firestore
interface FirestoreError {
    code?: string;
    message?: string;
}

export const useInvoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 1. FETCH INVOICES
    const fetchInvoices = useCallback(async () => {
        if (!user) {
            setInvoices([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // NOTE: This query requires a Composite Index in Firestore!
            // Fields: userId (Ascending), createdAt (Descending)
            const q = query(
                collection(db, "invoices"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const retrievedInvoices: Invoice[] = [];

            querySnapshot.forEach((doc) => {
                retrievedInvoices.push({
                    id: doc.id,
                    ...doc.data(),
                } as Invoice);
            });

            setInvoices(retrievedInvoices);
        } catch (err: unknown) {
            // CORREGIDO: Declaramos como 'unknown' y hacemos un cast seguro a 'FirestoreError'
            const dbError = err as FirestoreError;
            console.error("Error fetching invoices from Firestore:", dbError);

            // Helpful warning if the developer forgot to create the composite index
            if (dbError.code === "failed-precondition") {
                setError("Database index missing. Please check your browser console for the direct creation link.");
            } else {
                setError(dbError.message || "Failed to fetch invoices");
            }
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    // 2. SAVE INVOICE
    const saveInvoice = async (invoiceData: Omit<Invoice, "id">) => {
        if (!user) {
            throw new Error("User must be authenticated to save invoices.");
        }

        try {
            const invoiceToSave = {
                ...invoiceData,
                userId: user.uid,
                createdAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, "invoices"), invoiceToSave);

            // Instantly refresh the local invoice list
            await fetchInvoices();

            return docRef.id;
        } catch (err) {
            console.error("Error writing invoice to Firestore:", err);
            throw err;
        }
    };

    // Automatically fetch records on component load or when the logged-in state changes
    useEffect(() => {
        let active = true;

        if (active) {
            Promise.resolve().then(() => {
                if (active) {
                    fetchInvoices();
                }
            });
        }

        return () => {
            active = false;
        };
    }, [fetchInvoices]);

    return {
        invoices,
        loading,
        error,
        saveInvoice,
        refetchInvoices: fetchInvoices,
    };
};
