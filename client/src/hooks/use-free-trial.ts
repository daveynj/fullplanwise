
import { useState, useEffect } from 'react';
import axios from 'axios';
import { queryClient }from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface FreeTrialStatus {
  isActive: boolean;
  endDate: string | null;
}

const fetchFreeTrialStatus = async (): Promise<FreeTrialStatus> => {
    const { data } = await axios.get('/api/features/free-trial');
    return data;
};

export function useFreeTrial() {
    const { data, isLoading, error } = useQuery<FreeTrialStatus>({
        queryKey: ['freeTrialStatus'],
        queryFn: fetchFreeTrialStatus,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });

    return {
        isFreeTrialActive: data?.isActive ?? false,
        freeTrialEndDate: data?.endDate ? new Date(data.endDate) : null,
        isLoading,
        error,
    };
}
