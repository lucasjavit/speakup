import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';
import type { CompleteProfileRequest } from '@/types';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => userService.getCurrentUser(),
  });
}

export function useCompleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CompleteProfileRequest }) =>
      userService.completeProfileById(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
