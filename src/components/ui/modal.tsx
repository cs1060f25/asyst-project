"use client";

import React from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function Modal({ open, title, description, onClose, actions, children }: ModalProps) {
  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-5">
        {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {children}
        <div className="mt-4 flex justify-end gap-2">
          {actions}
        </div>
      </div>
    </div>,
    document.body
  );
}
