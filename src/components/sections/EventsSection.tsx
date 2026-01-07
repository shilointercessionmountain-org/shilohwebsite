import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import eventsBg from "@/assets/events-bg.jpg";

const eventTypeColors: Record<string, string> = {
  weekly: "bg-primary/10 text-primary",
  special: "bg-accent/10 text-accent",
  youth: "bg-green-500/10 text-green-600",
  fellowship: "bg-orange-500/10 text-orange-600",
  general: "bg-muted text-muted-foreground",
};

export function EventsSection() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(4);

      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const formatTime = (startTime: string, endTime: string | null) => {
    const formatTimeStr = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    if (endTime) {
      return `${formatTimeStr(startTime)} - ${formatTimeStr(endTime)}`;
    }
    return formatTimeStr(startTime);
  };

  return (
    <section id="events" className="relative section-padding overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${eventsBg})` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/90 dark:bg-background/95" />
      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join us for worship, fellowship, and spiritual growth. Check out our upcoming events and be part of our community.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-20 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : events && events.length > 0 ? (
            events.map((event) => {
              const eventDate = parseISO(event.event_date);
              return (
                <Card
                  key={event.id}
                  className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="p-0">
                    {/* Date Banner */}
                    <div className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{format(eventDate, "dd")}</p>
                        <p className="text-sm uppercase">{format(eventDate, "MMM")}</p>
                      </div>
                      <div className="h-12 w-px bg-primary-foreground/30" />
                      <div>
                        <p className="font-semibold">{format(eventDate, "EEEE")}</p>
                        <p className="text-sm text-primary-foreground/80">{format(eventDate, "yyyy")}</p>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant="secondary" 
                          className={eventTypeColors[event.event_type || "general"]}
                        >
                          {(event.event_type || "general").charAt(0).toUpperCase() + (event.event_type || "general").slice(1)}
                        </Badge>
                      </div>

                      <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{formatTime(event.start_time, event.end_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.location.href = "/events"}
          >
            <ArrowRight className="h-4 w-4" />
            See All Events
          </Button>
        </div>
      </div>
    </section>
  );
}
