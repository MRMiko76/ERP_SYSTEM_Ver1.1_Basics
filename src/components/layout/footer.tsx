import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Github, 
  Bot, 
  MessageSquare, 
  Wifi, 
  Zap, 
  Database,
  Code,
  Shield,
  Palette,
  Globe
} from "lucide-react";

export function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Tech Stack", href: "#tech-stack" },
        { name: "Demos", href: "#demos" },
        { name: "Quick Start", href: "#quickstart" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "API Reference", href: "#" },
        { name: "Tutorials", href: "#" },
        { name: "Blog", href: "#blog" },
      ],
    },
    {
      title: "Community",
      links: [
        { name: "GitHub", href: "#" },
        { name: "Discord", href: "#" },
        { name: "Twitter", href: "#" },
        { name: "Support", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "Contact", href: "#" },
      ],
    },
  ];

  const techBadges = [
    { name: "Next.js 15", icon: Globe },
    { name: "TypeScript", icon: Code },
    { name: "Tailwind CSS", icon: Palette },
    { name: "Prisma", icon: Database },
    { name: "Socket.IO", icon: Wifi },
    { name: "Z.ai SDK", icon: Bot },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <img src="/logo.svg" alt="Z.ai Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Z.ai Code Scaffold</h3>
                <p className="text-sm text-muted-foreground">
                  AI-Powered Development Platform
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Modern Next.js scaffold optimized for AI-powered development. 
              Built with TypeScript, Tailwind CSS, and shadcn/ui for rapid application development.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" size="sm">
                <Bot className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Tech Stack Badges */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Built With</h4>
          <div className="flex flex-wrap gap-2">
            {techBadges.map((tech) => {
              const Icon = tech.icon;
              return (
                <Badge key={tech.name} variant="secondary" className="flex items-center space-x-1">
                  <Icon className="h-3 w-3" />
                  <span>{tech.name}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© 2024 Z.ai Code Scaffold. All rights reserved.</span>
            <span>•</span>
            <span>Built with ❤️ using Next.js 15</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4" />
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}