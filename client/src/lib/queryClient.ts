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

      // Handle any non-200 responses here
      if (!res.ok) {
        console.error(`Error response from server: ${res.status} ${res.statusText}`);
        
        // Clone the response first so we can read it multiple times
        const resClone = res.clone();
        
        try {
          // Try to parse as JSON first
          const errorJSON = await resClone.json();
          console.error('Server error details:', errorJSON);
          throw new Error(`Server error (${res.status}): ${JSON.stringify(errorJSON)}`);
        } catch (jsonParseError) {
          // If JSON parsing fails, read as text
          try {
            const errorText = await res.text();
            throw new Error(`Server error (${res.status}): ${errorText}`);
          } catch (textError) {
            // If all else fails, just throw with status info
            throw new Error(`Server error (${res.status}): ${res.statusText}`);
          }
        }
      }
      
      // No need for throwIfResNotOk since we already handled non-ok responses above
      
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
