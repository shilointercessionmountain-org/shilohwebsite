import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Target, Eye, Clock, MapPin, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  {
    icon: Heart,
    title: "Intercession",
    description: "Equipping intercessors to intercede for the body of Christ and for nations.",
  },
  {
    icon: Target,
    title: "Training",
    description: "Receiving, equipping, and sending out intercessors to be effective for the kingdom of God.",
  },
  {
    icon: Eye,
    title: "Prayer",
    description: "A house of prayer and a training place for practical intercession.",
  },
];

export function AboutSection() {
  const { data: churchInfo } = useQuery({
    queryKey: ["church-info-about"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: serviceTimes } = useQuery({
    queryKey: ["service-times"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_times")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (startTime: string, endTime: string | null) => {
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  return (
    <section id="about" className="section-padding bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            About Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We are a prophetic house of God for all intercessors around the world. Established in 2015, we are not a church but a house of prayer — a training place for practical intercession.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {churchInfo?.mission_statement || "To push the mission of Jesus Christ by equipping intercessors to intercede. To intercede for the body of Christ and for nations."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                Our Vision
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {churchInfo?.vision_statement || "The work of our ministry includes receiving, equipping, training, and sending out intercessors to be effective for the kingdom of God."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Our Core Values
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                    {value.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Times & Contact Info */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold mb-6">Meeting Times</h3>
              <ul className="space-y-4">
                {serviceTimes && serviceTimes.length > 0 ? (
                  serviceTimes.map((service) => (
                    <li key={service.id} className="flex items-start gap-3">
                      <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{service.service_name}</p>
                        <p className="text-primary-foreground/80">
                          {service.day_of_week} • {formatTimeRange(service.start_time, service.end_time)}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Sunday Service</p>
                        <p className="text-primary-foreground/80">9:00 AM - 12:00 PM</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Wednesday Prayer Meeting</p>
                        <p className="text-primary-foreground/80">6:00 PM - 8:00 PM</p>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold text-foreground mb-6">Contact Information</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                      <p className="font-semibold text-foreground">Address</p>
                    <p>{churchInfo?.address || "Johannesburg, South Africa"}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Phone</p>
                    <p>{churchInfo?.phone || "+27 11 123 4567"}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <p>{churchInfo?.email || "info@shilohim.org"}</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
