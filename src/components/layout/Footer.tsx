import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Youtube, Instagram, Mail, Phone, MapPin } from "lucide-react";

const quickLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Events", href: "#events" },
  { name: "Gallery", href: "#gallery" },
  { name: "Contact", href: "#contact" },
];

export function Footer() {
  const { data: churchInfo } = useQuery({
    queryKey: ["church-info-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const socialLinks = [
    { icon: Facebook, href: churchInfo?.facebook_url || "https://facebook.com", label: "Facebook" },
    { icon: Youtube, href: churchInfo?.youtube_channel_url || "https://youtube.com", label: "YouTube" },
    { icon: Instagram, href: churchInfo?.instagram_url || "https://instagram.com", label: "Instagram" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Ministry Info */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-2xl font-bold mb-4">
              {churchInfo?.church_name || "Shiloh Intercession Mountain"}
            </h3>
            <p className="text-background/70 mb-6 max-w-md">
              A prophetic house of prayer for all intercessors around the world. 
              Equipping, training, and sending out intercessors to be effective for the kingdom of God.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{churchInfo?.address || "Johannesburg, South Africa"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>{churchInfo?.phone || "+27 11 123 4567"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>{churchInfo?.email || "info@shilohim.org"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-10 pt-8 text-center text-background/50 text-sm">
          <p>
            © {new Date().getFullYear()} {churchInfo?.church_name || "Shiloh Intercession Mountain"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
