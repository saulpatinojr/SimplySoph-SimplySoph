import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Calendar,
  FileText,
  Video,
  Image,
  Library,
  Grid,
  MessageSquare,
  MapPin,
  Globe,
  Rabbit,
  Settings,
  Shirt,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

// Exported so admin-routes.test.ts can verify every entry maps to a route.
export const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Calendar, label: "Calendar", path: "/admin/calendar" },
  { icon: FileText, label: "Blog Posts", path: "/admin/blog" },
  { icon: Video, label: "Videos", path: "/admin/video" },
  { icon: Library, label: "Media Library", path: "/admin/media" },
  { icon: Image, label: "Photos", path: "/admin/photo" },
  { icon: MapPin, label: "Destinations", path: "/admin/destinations" },
  { icon: Rabbit, label: "Menagerie", path: "/admin/menagerie" },
  { icon: Shirt, label: "Looks", path: "/admin/looks" },
  { icon: Grid, label: "Categories", path: "/admin/category" },
  { icon: MessageSquare, label: "Comments", path: "/admin/comments" },
  { icon: Settings, label: "Site Settings", path: "/admin/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

/** Clamp a persisted width so a stale/corrupt value can never push the
 *  sidebar over the content (cap at 40% of the viewport). */
function clampSidebarWidth(width: number): number {
  const upper = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.4));
  return Math.min(
    Math.max(Number.isFinite(width) ? width : DEFAULT_WIDTH, MIN_WIDTH),
    Math.max(upper, MIN_WIDTH)
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    clampSidebarWidth(
      parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? "", 10)
    )
  );
  const { loading } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Auth gating happens in RequireAuth at the router; this layout only
  // waits for the auth context so the header/footer can show the user.
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      // The mobile sheet reads --sidebar-width for its own width; only
      // override it with the persisted desktop width on desktop.
      style={
        isMobile
          ? undefined
          : ({ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties)
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={w => setSidebarWidth(clampSidebarWidth(w))}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  // "/admin" would prefix-match every admin route, so it stays exact-only;
  // other items also match their sub-routes (/admin/blog/new, /edit/:id, …).
  const isItemActive = (path: string) =>
    path === "/admin"
      ? location === "/admin"
      : location === path || location.startsWith(path + "/");
  const activeMenuItem = menuItems.find(item => isItemActive(item.path));
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <Sidebar
        ref={sidebarRef}
        collapsible="icon"
        className={`border-r-0 ${isResizing ? "transition-none" : ""}`}
      >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Toggle Sidebar"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                    title="Toggle Sidebar"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setLocation("/")}
                  tooltip="View Site"
                  className="h-10 transition-all font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Globe className="h-4 w-4" />
                  <span>View Site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <div className="h-px bg-border my-2 mx-2" />
              {menuItems.map(item => {
                const isActive = isItemActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.displayName?.charAt(0).toUpperCase() || "-"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.displayName || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
      </Sidebar>
      {/* Resize handle — desktop only; on mobile the sidebar is a Sheet and
          a fixed handle would float over page content. */}
      <div
        className={`fixed inset-y-0 left-[calc(var(--sidebar-width)-2px)] z-50 w-1 cursor-col-resize transition-colors hover:bg-primary/20 ${isCollapsed || isMobile ? "hidden" : ""}`}
        onMouseDown={() => {
          if (isCollapsed || isMobile) return;
          setIsResizing(true);
        }}
      />

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-backdrop-filter:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
