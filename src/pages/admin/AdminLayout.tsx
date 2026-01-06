import { useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Calendar, 
  Video, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Church,
  Home,
  UserCog
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Videos", href: "/admin/videos", icon: Video },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare, showBadge: true },
  { name: "Admins", href: "/admin/admins", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contact_submissions")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Please contact the church administrator to request access.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
            <Button variant="destructive" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden bg-background border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Church className="h-6 w-6 text-primary" />
            <span className="font-display font-bold">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="border-t p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors relative",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full animate-pulse" />
                  )}
                </div>
                {item.name}
                {item.showBadge && unreadCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
            <hr className="my-4" />
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
              View Website
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive w-full"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </nav>
        )}
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Church className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">Shiloh IM</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors relative",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.showBadge && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full animate-pulse" />
                    )}
                  </div>
                  {item.name}
                  {item.showBadge && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-5 w-5" />
                View Website
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive w-full transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 flex-1">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
