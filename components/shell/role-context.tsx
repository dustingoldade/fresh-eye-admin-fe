"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type Role = "tenant_admin" | "super_admin";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initial: Role = pathname.startsWith("/super-admin") ? "super_admin" : "tenant_admin";
  const [role, setRoleRaw] = useState<Role>(initial);

  useEffect(() => {
    // Keep role in sync with URL on navigation
    if (pathname.startsWith("/super-admin") && role !== "super_admin") {
      setRoleRaw("super_admin");
    } else if (!pathname.startsWith("/super-admin") && role !== "tenant_admin") {
      setRoleRaw("tenant_admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const setRole = (r: Role) => {
    setRoleRaw(r);
    if (r === "super_admin" && !pathname.startsWith("/super-admin")) {
      router.push("/super-admin");
    } else if (r === "tenant_admin" && pathname.startsWith("/super-admin")) {
      router.push("/");
    }
  };

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole outside provider");
  return ctx;
}
