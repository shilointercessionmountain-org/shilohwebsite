import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, ArrowLeft, Filter, X } from "lucide-react";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { Link } from "react-router-dom";

const eventTypeColors: Record<string, string> = {
  weekly: "bg-primary/10 text-primary",
  special: "bg-accent/10 text-accent",
  youth: "bg-green-500/10 text-green-600",
  fellowship: "bg-orange-500/10 text-orange-600",
  general: "bg-muted text-muted-foreground",
};

const eventTypes = [
  { value: "all", label: "All Types" },
  { value: "weekly", label: "Weekly" },
  { value: "special", label: "Special" },
  { value: "youth", label: "Youth" },
  { value: "fellowship", label: "Fellowship" },
  { value: "general", label: "General" },
];

const months = [
  { value: "all", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

export default function Events() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 0,
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    return events.filter((event) => {
      const eventDate = parseISO(event.event_date);
      const eventMonth = getMonth(eventDate);
      
      const matchesType = selectedType === "all" || event.event_type === selectedType;
      const matchesMonth = selectedMonth === "all" || eventMonth === parseInt(selectedMonth);
      
      return matchesType && matchesMonth;
    });
  }, [events, selectedType, selectedMonth]);

  const hasActiveFilters = selectedType !== "all" || selectedMonth !== "all";

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedMonth("all");
  };

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <Link
                to="/#events"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
                All Upcoming Events
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Browse all our upcoming events and join us for worship, fellowship, and spiritual growth.
              </p>
            </div>

            {/* Filters */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-5 w-5" />
                    <span className="font-medium">Filters</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[160px]">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.value !== "all" && (
                                <span className={`w-2 h-2 rounded-full ${
                                  type.value === "weekly" ? "bg-primary" :
                                  type.value === "special" ? "bg-accent" :
                                  type.value === "youth" ? "bg-green-500" :
                                  type.value === "fellowship" ? "bg-orange-500" :
                                  "bg-muted-foreground"
                                }`} />
                              )}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Results count */}
                  <div className="text-sm text-muted-foreground">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
                  </div>
                </div>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
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
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
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
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? "No events match your filters. Try adjusting your selection."
                      : "No upcoming events at the moment. Check back soon!"}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
