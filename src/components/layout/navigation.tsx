"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  MessageSquare, 
  Bot, 
  Wifi, 
  Settings,
  Github,
  Zap
} from "lucide-react";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: "features", label: "Features", icon: Home, description: "Explore project capabilities" },
    { id: "tech-stack", label: "Tech Stack", icon: Settings, description: "View technologies used" },
    { id: "blog", label: "Blog", icon: FileText, description: "Manage blog posts" },
    { id: "demos", label: "Demos", icon: Wifi, description: "Try live demos" },
    { id: "quickstart", label: "Quick Start", icon: Zap, description: "Get started quickly" },
  ];

  const handleNavigation = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setIsMobileMenuOpen(false);
  };

  const NavItems = ({ mobile = false }) => (
    <div className={`space-${mobile ? 'y-4' : 'x-1'}`}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <Button
            key={item.id}
            variant={isActive ? "default" : "ghost"}
            onClick={() => handleNavigation(item.id)}
            className={`${mobile ? 'w-full justify-start' : ''} ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Icon className={`h-4 w-4 ${mobile ? 'mr-3' : 'mr-2'}`} />
            {mobile && <span className="flex-1 text-left">{item.label}</span>}
            {!mobile && <span>{item.label}</span>}
            {isActive && <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>}
          </Button>
        );
      })}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img src="/logo.svg" alt="Z.ai Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Z.ai Code Scaffold</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                AI-Powered Development Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavItems />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-6 h-6">
                      <img src="/logo.svg" alt="Z.ai Logo" className="w-full h-full object-contain" />
                    </div>
                    <span>Navigation</span>
                  </SheetTitle>
                  <SheetDescription>
                    Explore the different sections of the Z.ai Code Scaffold
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <NavItems mobile={true} />
                </div>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <Github className="mr-3 h-4 w-4" />
                      GitHub Repository
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <Bot className="mr-3 h-4 w-4" />
                      AI Documentation
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="sm">
                      <MessageSquare className="mr-3 h-4 w-4" />
                      Community Chat
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* External Links */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}