import { useQuery } from '@tanstack/react-query';

interface TrialStatus {
    isSubscriber: boolean;
    isInTrial: boolean;
    isPersonalTrial: boolean;
    isGlobalTrial: boolean;
    trialDaysRemaining: number;
    trialExpiresAt: string | null;
    freeCreditsRemaining: number;
    canGenerateLessons: boolean;
}

async function fetchTrialStatus(): Promise<TrialStatus> {
    const response = await fetch('/api/user/trial-status', {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch trial status');
    }

    return response.json();
}

/**
 * Hook to fetch the current user's trial status and remaining credits.
 * Returns information about:
 * - Whether the user is a subscriber (unlimited tier)
 * - Whether the user is in their 7-day trial period
 * - How many free lesson credits remain
 * - Whether the user can generate lessons
 */
export function useTrialStatus() {
    const { data, isLoading, error, refetch } = useQuery<TrialStatus>({
        queryKey: ['trialStatus'],
        queryFn: fetchTrialStatus,
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: true,
    });

    return {
        // Status flags
        isSubscriber: data?.isSubscriber ?? false,
        isInTrial: data?.isInTrial ?? false,
        isPersonalTrial: data?.isPersonalTrial ?? false,
        isGlobalTrial: data?.isGlobalTrial ?? false,

        // Trial info
        trialDaysRemaining: data?.trialDaysRemaining ?? 0,
        trialExpiresAt: data?.trialExpiresAt ? new Date(data.trialExpiresAt) : null,

        // Credits
        freeCreditsRemaining: data?.freeCreditsRemaining ?? 0,

        // Can generate
        canGenerateLessons: data?.canGenerateLessons ?? false,

        // Query state
        isLoading,
        error,
        refetch,
    };
}
