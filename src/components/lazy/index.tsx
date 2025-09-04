/**
 * Lazy loading components for better performance
 * This file contains lazy-loaded versions of heavy components
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Loading fallback components
const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="flex space-x-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border-b last:border-b-0">
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <Skeleton className="h-6 w-48" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-center space-x-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FormSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Lazy loaded components
export const LazyRoleTable = lazy(() => import('@/components/erp/roles/role-table').then(mod => ({ default: mod.RoleTable })));
export const LazyUserTable = lazy(() => import('@/components/erp/users/user-table').then(mod => ({ default: mod.UserTable })));
export const LazyRoleForm = lazy(() => import('@/components/erp/roles/role-form').then(mod => ({ default: mod.RoleForm })));
export const LazyUserForm = lazy(() => import('@/components/erp/users/user-form').then(mod => ({ default: mod.UserForm })));
export const LazyChart = lazy(() => import('@/components/ui/chart'));
export const LazyCalendar = lazy(() => import('@/components/ui/calendar'));

// HOC for wrapping components with Suspense
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode
) => {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Components with suspense wrappers
export const RoleTableWithSuspense = withLazyLoading(LazyRoleTable, <TableSkeleton />);
export const UserTableWithSuspense = withLazyLoading(LazyUserTable, <TableSkeleton />);
export const RoleFormWithSuspense = withLazyLoading(LazyRoleForm, <FormSkeleton />);
export const UserFormWithSuspense = withLazyLoading(LazyUserForm, <FormSkeleton />);

// Debug wrapper for UserForm
const UserFormDebugWrapper = (props: any) => {
  console.log('🔄 LAZY: UserFormWithSuspense تم تحميله مع البيانات:', props);
  return <UserFormWithSuspense {...props} />;
};

export { UserFormDebugWrapper };
export const ChartWithSuspense = withLazyLoading(LazyChart, <ChartSkeleton />);
export const CalendarWithSuspense = withLazyLoading(LazyCalendar, <Skeleton className="h-80 w-full" />);

// Utility function for dynamic imports with error handling
export const dynamicImport = async function<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
  try {
    const mod = await importFn();
    return mod.default;
  } catch (error) {
    console.error('Failed to load component:', error);
    throw error;
  }
}

// Utility function for retrying failed imports
export async function retryImport<T>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await dynamicImport(importFn);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Preload functions for critical components
export const preloadComponents = {
  roles: () => import('@/components/erp/roles/role-table'),
  users: () => import('@/components/erp/users/user-table'),
  forms: () => Promise.all([
    import('@/components/erp/roles/role-form'),
    import('@/components/erp/users/user-form'),
  ]),
};

// Hook for preloading components
export const usePreloadComponent = (componentKey: keyof typeof preloadComponents) => {
  const preload = () => {
    preloadComponents[componentKey]().catch(console.error);
  };

  return { preload };
};

// Component preloader utility
export const ComponentPreloader = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};