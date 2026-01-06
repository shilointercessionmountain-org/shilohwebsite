import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Send, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(255, "Message must be 255 characters or less"),
});

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export function ContactSection() {
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: churchInfo } = useQuery({
    queryKey: ["church-info-contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("contact_submissions").insert({
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
      toast.success("Message sent successfully! We'll get back to you soon.");
    },
    onError: () => {
      toast.error("Failed to send message. Please try again.");
    },
  });

  const validateField = (field: keyof typeof formData, value: string) => {
    const result = contactSchema.shape[field].safeParse(value);
    if (!result.success) {
      return result.error.errors[0].message;
    }
    return undefined;
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleFieldBlur = (field: keyof typeof formData) => {
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    submitMutation.mutate(formData);
  };

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Contact Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We'd love to hear from you. Whether you have a question, prayer request, or just want to say hello, feel free to reach out.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                Send Us a Message
              </h3>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    Thank You!
                  </h4>
                  <p className="text-muted-foreground mb-6">
                    Your message has been sent. We'll get back to you soon.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      onBlur={() => handleFieldBlur("name")}
                      className={errors.name ? "border-destructive" : ""}
                      required
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      className={errors.email ? "border-destructive" : ""}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="message">Your Message</Label>
                      <span className={`text-xs ${formData.message.length > 255 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formData.message.length}/255
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleFieldChange("message", e.target.value)}
                      onBlur={() => handleFieldBlur("message")}
                      className={errors.message ? "border-destructive" : ""}
                      maxLength={255}
                      required
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Map & Contact Info */}
          <div className="space-y-6">
            {/* Google Map */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video w-full">
                  <iframe
                    src={churchInfo?.google_maps_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114595.77558147967!2d28.004739999999998!3d-26.195246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950c68f0406a51%3A0x238ac9d9b1d34041!2sJohannesburg%2C%20South%20Africa!5e0!3m2!1sen!2sus!4v1234567890"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Our Location"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Get in Touch
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Address</p>
                      <p className="text-muted-foreground text-sm">
                        {churchInfo?.address || "Johannesburg, South Africa"}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Phone</p>
                      <p className="text-muted-foreground text-sm">
                        {churchInfo?.phone || "+27 11 123 4567"}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <p className="text-muted-foreground text-sm">
                        {churchInfo?.email || "info@shilohim.org"}
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
