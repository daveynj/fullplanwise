import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Function to create or reset a test user (development only)
export async function createTestUser() {
  const res = await apiRequest("POST", "/api/dev/create-test-user");
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Making API request to: ${queryKey[0]}`);
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        // Add cache control to prevent stale responses
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log(`Received response from ${queryKey[0]} with status: ${res.status}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Unauthorized access, returning null as configured');
        return null;
      }

      // For status 500, provide more detailed error information
      if (res.status === 500) {
        try {
          const errorDetails = await res.json();
          console.error('Server error details:', errorDetails);
          throw new Error(`Server error: ${JSON.stringify(errorDetails)}`);
        } catch (jsonParseError) {
          // If can't parse JSON, fall back to text
          const errorText = await res.text();
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }
      }

      await throwIfResNotOk(res);
      
      try {
        const data = await res.json();
        return data;
      } catch (jsonError: any) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error(`Failed to parse server response as JSON: ${jsonError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`API request failed for ${queryKey[0]}:`, error);
      // Rethrow to let React Query handle it
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
