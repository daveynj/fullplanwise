import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';

// Validation schema for the form
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [username, setUsername] = useState<string | null>(null);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Define form
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validate token
  const { isLoading: isValidating } = useQuery({
    queryKey: ['validateResetToken', token],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/reset-password/${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Invalid or expired token');
        }
        
        setUsername(data.username);
        setTokenValidated(true);
        return data;
      } catch (error: any) {
        setTokenError(error.message || 'Invalid or expired token');
        setTokenValidated(false);
        throw error;
      }
    },
    retry: false,
    enabled: !!token,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { password: string }) => {
      return apiRequest('POST', `/api/reset-password/${token}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successfully',
        description: 'Your password has been updated. You can now log in with your new password.',
      });
      
      setTimeout(() => {
        setLocation('/auth');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'There was a problem resetting your password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate({ password: data.password });
  };

  if (isValidating) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Validating Reset Token</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-destructive">Invalid Token</CardTitle>
            <CardDescription className="text-center">
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/forgot-password">Request New Reset Link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          {username && (
            <CardDescription className="text-center">
              Hi {username}, enter your new password below
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter a new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link to="/auth">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;