"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Users,
  FileText,
  StickyNote,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "IP Assets", href: "/ip-assets", icon: Shield },
  { label: "People", href: "/people", icon: Users },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "Notes", href: "/notes", icon: StickyNote },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-72 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] flex flex-col h-screen sticky top-0 shadow-xl">
      {/* Logo / Brand */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">IP Contingency</h1>
            <p className="text-xs text-[var(--sidebar-foreground)]/50">Ownership Risk Tracker</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--sidebar-border)]" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] shadow-sm"
                  : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)]/50 hover:text-[var(--sidebar-foreground)]"
              )}
            >
              <Icon className={cn(
                "w-[18px] h-[18px] transition-colors",
                isActive ? "text-[var(--sidebar-primary)]" : "text-[var(--sidebar-foreground)]/50 group-hover:text-[var(--sidebar-foreground)]/80"
              )} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-[var(--sidebar-primary)]/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mx-4 h-px bg-[var(--sidebar-border)]" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
            {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-[var(--sidebar-foreground)]/50 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-[var(--sidebar-foreground)]/50 hover:text-red-400 transition-colors w-full px-1"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
