"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Factory, 
  Box, 
  Truck, 
  Users, 
  Settings, 
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUserPermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "لوحة التحكم", href: "/erp/dashboard", icon: Home, module: "dashboard" },
  { name: "المشتريات", href: "/erp/purchasing", icon: ShoppingCart, module: "purchasing" },
  { name: "التصنيع", href: "/erp/manufacturing", icon: Factory, module: "manufacturing" },
  { name: "التعبئة", href: "/erp/packaging", icon: Box, module: "packaging" },
  { name: "المستودعات", href: "/erp/warehouses", icon: Package, module: "warehouses" },
  { name: "المبيعات", href: "/erp/sales", icon: Truck, module: "sales" },
  { name: "التقارير", href: "/erp/reports", icon: BarChart3, module: "reports" },
  { name: "المستخدمون", href: "/erp/users", icon: Users, module: "users" },
  { name: "الأدوار والصلاحيات", href: "/erp/roles", icon: Shield, module: "roles" },
  { name: "الإعدادات", href: "/erp/settings", icon: Settings, module: "settings" },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: userPermissions, isLoading: permissionsLoading } = useUserPermissions();

  // تطبيق الألوان المخصصة من الإعدادات
  useEffect(() => {
    const applyCustomColors = () => {
      const savedSettings = localStorage.getItem('appearanceSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const root = document.documentElement;
        
        if (settings.buttonColors) {
          root.style.setProperty('--btn-primary', settings.buttonColors.primary);
          root.style.setProperty('--btn-secondary', settings.buttonColors.secondary);
          root.style.setProperty('--btn-accent', settings.buttonColors.accent);
        }
        
        if (settings.fontSize) {
          root.style.setProperty('--font-size-base', settings.fontSize);
        }
      }
    };

    applyCustomColors();
    
    // إعادة تطبيق الألوان عند تغيير الإعدادات
    const handleStorageChange = () => {
      applyCustomColors();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // دالة للتحقق من وجود صلاحية للوحدة
  const hasModulePermission = (module: string) => {
    // إذا كان هناك خطأ في تحميل الصلاحيات، اعرض جميع العناصر
    if (permissionsLoading || !userPermissions) return true;
    return userPermissions.groupedPermissions && userPermissions.groupedPermissions[module];
  };

  // تصفية عناصر التنقل حسب الصلاحيات
  const filteredNavigation = navigation.filter(item => {
    // إذا كان المستخدم مدير، اعرض جميع العناصر
    if (user?.roles?.some(role => role.name === 'مدير النظام' || role.name === 'مشرف')) return true;
    // إذا لم تكن هناك وحدة محددة، اعرض العنصر
    if (!item.module) return true;
    // تحقق من وجود صلاحية للوحدة
    return hasModulePermission(item.module);
  });

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full",
      mobile && "lg:hidden"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
            {(() => {
              const savedSettings = localStorage.getItem('companySettings');
              const companySettings = savedSettings ? JSON.parse(savedSettings) : null;
              const logoUrl = companySettings?.logo || '/logo.svg';
              
              return logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="شعار الشركة" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // إذا فشل تحميل الصورة، استخدم الأيقونة الافتراضية
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null;
            })()}
            <Factory className="h-6 w-6 text-primary-foreground hidden" />
          </div>
          <div>
            <h1 className="text-lg font-bold">
              {(() => {
                const savedSettings = localStorage.getItem('companySettings');
                const companySettings = savedSettings ? JSON.parse(savedSettings) : null;
                return companySettings?.name || 'نظام المصنع';
              })()}
            </h1>
            <p className="text-xs text-muted-foreground">ERP</p>
          </div>
        </div>
        {mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200 sidebar-nav-item",
                isActive && "bg-primary text-primary-foreground sidebar-active-btn"
              )}
              onClick={() => handleNavigation(item.href)}
              style={isActive ? {
                backgroundColor: 'var(--btn-primary, #3b82f6)',
                color: 'white',
                borderColor: 'var(--btn-primary, #3b82f6)'
              } : {}}
            >
              <Icon className="ml-3 h-4 w-4" />
              {item.name}
              {isActive && <Badge variant="secondary" className="mr-auto text-xs">نشط</Badge>}
            </Button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "مستخدم"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
            {/* تم نقل أزرار الملف الشخصي وتسجيل الخروج إلى أعلى الشاشة في الـ Avatar */}
          </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-border",
        className
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <SidebarContent mobile={true} />
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}