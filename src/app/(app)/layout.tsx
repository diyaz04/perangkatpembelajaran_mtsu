import React from "react";
import { requireAuth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <SidebarProvider>
      <AppSidebar userEmail={session.user.email} profile={session.profile} />
      <SidebarInset className="bg-white">
        <AppHeader userEmail={session.user.email} profile={session.profile} />
        <main className="flex-1 bg-white">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
