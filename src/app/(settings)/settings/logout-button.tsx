"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 w-full min-h-[52px] px-4.5 bg-transparent border border-mb-border rounded-lg text-mb-error font-medium text-sm text-left hover:bg-mb-error/10 hover:border-mb-error transition-colors cursor-pointer"
    >
      <LogOut className="w-[19px] h-[19px]" />
      Cerrar sesión
    </button>
  );
}
