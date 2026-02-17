
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService, Company } from '../services/admin.service';

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ['admin', 'users'],
        queryFn: () => AdminService.getUsers(),
    });
};

export const useAdminCompanies = () => {
    return useQuery({
        queryKey: ['admin', 'companies'],
        queryFn: () => AdminService.getCompanies(),
    });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            AdminService.updateUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => AdminService.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (company: Partial<Company>) => AdminService.createCompany(company),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
        },
    });
};

export const useUpdateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...company }: Partial<Company> & { id: string }) =>
            AdminService.updateCompany(id, company),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
        },
    });
};

export const useDeleteCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) => AdminService.deleteCompany(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
        },
    });
};
