// context/ModalContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface ModalContextType {
    isAddTransactionOpen: boolean;
    openAddTransaction: () => void;
    closeAddTransaction: () => void;
    // NEW: untuk auto-refresh dashboard setelah transaksi
    dataVersion: number;
    bumpDataVersion: () => void;
}

const ModalContext = createContext<ModalContextType>({
    isAddTransactionOpen: false,
    openAddTransaction: () => {},
    closeAddTransaction: () => {},
    dataVersion: 0,
    bumpDataVersion: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [dataVersion, setDataVersion] = useState(0);

    const bumpDataVersion = useCallback(() => {
        setDataVersion((v) => v + 1);
    }, []);

    return (
        <ModalContext.Provider
            value={{
                isAddTransactionOpen,
                openAddTransaction: () => setIsAddTransactionOpen(true),
                closeAddTransaction: () => setIsAddTransactionOpen(false),
                dataVersion,
                bumpDataVersion,
            }}
        >
            {children}
        </ModalContext.Provider>
    );
}

export const useModal = () => useContext(ModalContext); 