import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllEvents, createEvent, updateEvent, deleteEvent } from "@/integrations/firebase/firestore/church";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  is_active: boolean;
}

const defaultFormData: EventFormData = {
  title: "",
  description: "",
  event_date: "",
  start_time: "09:00",
  end_time: "12:00",
  location: "",
  event_type: "general",
  is_active: true,
};

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: getAllEvents,
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      await createEvent({
        title: data.title,
        description: data.description,
        eventDate: Timestamp.fromDate(new Date(data.event_date)),
        startTime: data.start_time,
        endTime: data.end_time || null,
        location: data.location,
        eventType: data.event_type,
        isActive: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      toast.success("Event created successfully");
    },
    onError: () => toast.error("Failed to create event"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      await updateEvent(id, {
        title: data.title,
        description: data.description,
        eventDate: Timestamp.fromDate(new Date(data.event_date)),
        startTime: data.start_time,
        endTime: data.end_time || null,
        location: data.location,
        eventType: data.event_type,
        isActive: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      setFormData(defaultFormData);
      toast.success("Event updated successfully");
    },
    onError: () => toast.error("Failed to update event"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted successfully");
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event.id);
    const eventDate = event.eventDate instanceof Date 
      ? event.eventDate 
      : event.eventDate?.toDate();
    
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : "",
      start_time: event.startTime || "09:00",
      end_time: event.endTime || "",
      location: event.location || "",
      event_type: event.eventType || "general",
      is_active: event.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">Manage church events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Add New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                      <SelectItem value="youth">Youth</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Main Sanctuary"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="divide-y">
              {events.map((event) => {
                const eventDate = event.eventDate instanceof Date 
                  ? event.eventDate 
                  : event.eventDate?.toDate();
                
                return (
                  <div key={event.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        {!event.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {eventDate ? format(eventDate, "MMMM d, yyyy") : "TBD"} • {event.location || "TBD"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(event.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No events yet. Create your first event!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
