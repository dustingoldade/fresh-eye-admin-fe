import { ReactNode } from "react";
import { RoleProvider } from "./role-context";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <div className="h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-auto">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
