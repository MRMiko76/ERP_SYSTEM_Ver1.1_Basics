import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
}

const QUERY_KEYS = {
  profile: ['profile'] as const,
};

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async (): Promise<ProfileData> => {
      const response = await axios.get('/api/profile');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileData): Promise<ProfileData> => {
      const response = await axios.put('/api/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update profile cache
      queryClient.setQueryData(QUERY_KEYS.profile, data);
      // Also invalidate auth cache if it exists
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('تم تحديث الملف الشخصي بنجاح');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطأ في تحديث الملف الشخصي';
      toast.error(message);
      console.error('Error updating profile:', error);
    },
  });
}

// Change password mutation
export function useChangePassword() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }): Promise<ProfileData> => {
      const response = await axios.put('/api/profile', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success('تم تغيير كلمة المرور بنجاح');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطأ في تغيير كلمة المرور';
      toast.error(message);
      console.error('Error changing password:', error);
    },
  });
}