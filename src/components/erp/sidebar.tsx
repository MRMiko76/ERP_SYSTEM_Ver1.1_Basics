"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Shield,
  Building2,
  Warehouse,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Archive,
  Boxes,
  UserCheck,
  Calculator,
  BookOpen,
  Coins,
  Receipt,
  PieChart
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUserPermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  className?: string;
}

// لوحة التحكم الرئيسية
const dashboardItem = { name: "لوحة التحكم", href: "/erp/dashboard", icon: Home, module: "dashboard" };

// الأقسام المنظمة
const navigationSections = [
  {
    title: "المشتريات",
    icon: ShoppingCart,
    items: [
      { name: "الموردين", href: "/erp/suppliers", icon: Building2, module: "purchasing" },
      { name: "الخامات", href: "/erp/raw-materials", icon: Archive, module: "purchasing" },
      { name: "أوامر الشراء", href: "/erp/purchase/purchase-orders", icon: ShoppingCart, module: "purchasing" },
    ]
  },
  {
    title: "التصنيع",
    icon: Factory,
    items: [
      { name: "أوامر التصنيع", href: "/erp/manufacturing", icon: Factory, module: "manufacturing" },
      { name: "أوامر التعبئة", href: "/erp/packaging", icon: Box, module: "packaging" },
    ]
  },
  {
    title: "المخازن",
    icon: Warehouse,
    items: [
      { name: "أسماء المخازن", href: "/erp/warehouses", icon: Package, module: "warehouses" },
      { name: "حركة المخزون", href: "/erp/inventory-movement", icon: TrendingUp, module: "warehouses" },
      { name: "الجرد", href: "/erp/inventory", icon: ClipboardList, module: "warehouses" },
      { name: "الإهلاكات", href: "/erp/depreciation", icon: Calculator, module: "warehouses" },
    ]
  },
  {
    title: "المبيعات",
    icon: Truck,
    items: [
      { name: "المنتجات", href: "/erp/products", icon: Boxes, module: "sales" },
      { name: "العملاء", href: "/erp/customers", icon: UserCheck, module: "sales" },
      { name: "أوامر البيع", href: "/erp/sales", icon: Truck, module: "sales" },
    ]
  },
  {
    title: "الماليات",
    icon: DollarSign,
    items: [
      { name: "الخزينة", href: "/erp/treasury", icon: Coins, module: "finance" },
      { name: "أنواع الخزينة", href: "/erp/treasury-types", icon: Receipt, module: "finance" },
      { name: "دفتر الأستاذ", href: "/erp/general-ledger", icon: BookOpen, module: "finance" },
      { name: "دفتر العملاء", href: "/erp/customer-ledger", icon: Users, module: "finance" },
      { name: "الدليل المحاسبي", href: "/erp/chart-of-accounts", icon: FileText, module: "finance" },
    ]
  },
  {
    title: "التقارير",
    icon: BarChart3,
    items: [
      { name: "تقرير مخصوص", href: "/erp/custom-reports", icon: PieChart, module: "reports" },
      { name: "صفحة إنشاء التقارير", href: "/erp/reports", icon: BarChart3, module: "reports" },
    ]
  },
  {
    title: "الإعدادات",
    icon: Settings,
    items: [
      { name: "صفحة الإعدادات", href: "/erp/settings", icon: Settings, module: "settings" },
      { name: "المستخدمين", href: "/erp/users", icon: Users, module: "users" },
      { name: "الأدوار والصلاحيات", href: "/erp/roles", icon: Shield, module: "roles" },
    ]
  },
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
    // اعرض جميع العناصر دائماً لضمان ظهور القائمة
    return true;
  };

  // التحقق من كون المستخدم مدير
  const isAdmin = user?.roles?.some(role => role.name === 'مدير النظام' || role.name === 'مشرف');

  // عرض جميع الأقسام والعناصر
  const filteredNavigationSections = navigationSections;

  // السماح بالوصول للوحة التحكم دائماً
  const canAccessDashboard = true;

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
        {/* لوحة التحكم */}
        {canAccessDashboard && (
          <Button
            variant={pathname === dashboardItem.href ? "default" : "ghost"}
            className={cn(
              "w-full justify-start transition-all duration-200 sidebar-nav-item mb-4",
              pathname === dashboardItem.href && "bg-primary text-primary-foreground sidebar-active-btn"
            )}
            onClick={() => handleNavigation(dashboardItem.href)}
            style={pathname === dashboardItem.href ? {
              backgroundColor: 'var(--btn-primary, #3b82f6)',
              color: 'white',
              borderColor: 'var(--btn-primary, #3b82f6)'
            } : {}}
          >
            <Home className="ml-3 h-4 w-4" />
            {dashboardItem.name}
            {pathname === dashboardItem.href && <Badge variant="secondary" className="mr-auto text-xs">نشط</Badge>}
          </Button>
        )}

        {/* الأقسام القابلة للطي */}
        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredNavigationSections.map((section, index) => {
            const SectionIcon = section.icon;
            const hasActiveItem = section.items.some(item => pathname === item.href);
            
            return (
              <AccordionItem key={section.title} value={`section-${index}`} className="border-none">
                <AccordionTrigger className={cn(
                  "hover:no-underline p-3 rounded-lg transition-all duration-200",
                  hasActiveItem ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <SectionIcon className="h-4 w-4" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1 mr-6">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Button
                          key={item.name}
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
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
                          <Icon className="ml-3 h-3 w-3" />
                          {item.name}
                          {isActive && <Badge variant="secondary" className="mr-auto text-xs">نشط</Badge>}
                        </Button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
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