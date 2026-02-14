import { useQuery } from '@tanstack/react-query';
import { CompanyService, Company } from '../services/company.service';

export const useCompanies = () => {
    return useQuery<Company[], Error>({
        queryKey: ['companies'],
        queryFn: async () => {
            const response = await CompanyService.list();
            if (!response.success) throw new Error(response.error || 'Failed to fetch companies');
            return response.data || [];
        }
    });
};

export const useCompanyDetail = (id: string) => {
    return useQuery<Company, Error>({
        queryKey: ['company', id],
        queryFn: async () => {
            if (!id) throw new Error('Company ID is required');
            const response = await CompanyService.getById(id);
            if (!response.success) throw new Error(response.error || 'Failed to fetch company detail');
            return response.data as Company;
        },
        enabled: !!id
    });
};
