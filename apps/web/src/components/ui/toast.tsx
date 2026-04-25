"use client";

import { useState, useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).substring(7);
  const toast: Toast = { id, type, message };
  toastListeners.forEach(listener => listener(toast));
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  // Toasts auto-remove after 5 seconds
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" :
            toast.type === "error" ? "bg-red-600" :
            "bg-blue-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
