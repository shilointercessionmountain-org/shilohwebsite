import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, MessageSquare, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TITLES: Record<string, string> = {
  mr: "Mr",
  mrs: "Mrs",
  ms: "Ms",
  dr: "Dr",
  prof: "Professor",
  rev: "Rev",
  pastor: "Pastor",
  bishop: "Bishop",
  elder: "Elder",
};

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch admin profile for personalized welcome
  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, title")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: eventsCount, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-events-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: videosCount, isLoading: videosLoading } = useQuery({
    queryKey: ["admin-videos-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: messagesCount, isLoading: messagesLoading } = useQuery({
    queryKey: ["admin-messages-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contact_submissions")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
  });

  // Build personalized greeting
  const getGreeting = () => {
    const titleLabel = profile?.title ? TITLES[profile.title] : "";
    const firstName = profile?.first_name || "";
    const lastName = profile?.last_name || "";

    if (titleLabel && (firstName || lastName)) {
      return `Welcome, ${titleLabel} ${firstName} ${lastName}`.trim();
    } else if (firstName || lastName) {
      return `Welcome, ${firstName} ${lastName}`.trim();
    }
    return "Welcome to your church admin dashboard";
  };

  const stats = [
    {
      name: "Total Events",
      value: eventsCount,
      icon: Calendar,
      color: "bg-blue-500",
      loading: eventsLoading,
    },
    {
      name: "Gallery Videos",
      value: videosCount,
      icon: Video,
      color: "bg-purple-500",
      loading: videosLoading,
    },
    {
      name: "Unread Messages",
      value: messagesCount,
      icon: MessageSquare,
      color: "bg-green-500",
      loading: messagesLoading,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          {getGreeting()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.name}</p>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/events"
              className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
            >
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Manage Events</p>
            </a>
            <a
              href="/admin/videos"
              className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
            >
              <Video className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Manage Videos</p>
            </a>
            <a
              href="/admin/messages"
              className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
            >
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">View Messages</p>
            </a>
            <a
              href="/admin/settings"
              className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
            >
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Church Settings</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
