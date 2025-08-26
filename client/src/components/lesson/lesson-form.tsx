import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Student, AIProviderEnum, LessonCategoryEnum, CATEGORY_LABELS } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Bot, Sparkles, Info } from "lucide-react";
import { useFreeTrial } from "@/hooks/use-free-trial";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define CEFR levels
const cefrLevels = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficiency" },
];

// AI providers - only Gemini now
const aiProviders = [
  { value: "gemini", label: "Google Gemini", icon: Sparkles }
];

// Schema for the form
const formSchema = z.object({
  studentId: z.string().optional(),
  cefrLevel: z.string(),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  targetVocabulary: z.string().optional(),
  aiProvider: AIProviderEnum.default("gemini"),
  focus: z.string().default("general"),
  lessonLength: z.number().default(60),
  category: LessonCategoryEnum.default("general"),
});

type FormValues = z.infer<typeof formSchema>;

interface LessonFormProps {
  students: Student[];
  onSubmit: (data: any) => void;
}

const placeholders = [
  "e.g., The future of space exploration",
  "e.g., Different cultural holidays around the world",
  "e.g., The benefits of learning a new skill",
  "e.g., How technology has changed our daily lives",
  "e.g., My favorite type of food and why",
];

export function LessonForm({ students, onSubmit }: LessonFormProps) {
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>("B1");
  const [placeholder, setPlaceholder] = useState(placeholders[0]);
  const { isFreeTrialActive } = useFreeTrial();
  const { user } = useAuth();
  
  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setPlaceholder(placeholders[index]);
    }, 3000); // Change placeholder every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "none",
      cefrLevel: "B1",
      topic: "",
      targetVocabulary: "",
      aiProvider: "gemini",
      focus: "general",
      lessonLength: 60,
      category: "general",
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Convert studentId to number if it exists and isn't 'none'
    const parsedValues = {
      ...values,
      studentId: values.studentId && values.studentId !== 'none' 
        ? parseInt(values.studentId) 
        : undefined,
      // Only include target vocabulary if it's not empty
      targetVocabulary: values.targetVocabulary && values.targetVocabulary.trim() !== '' 
        ? values.targetVocabulary.trim() 
        : undefined,
      // Add required fields for the API
      components: ["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"],
      generateImages: true,
      useStudentHistory: false
    };
    
    onSubmit(parsedValues);
  };

  const canGenerate = isFreeTrialActive || user?.subscriptionTier === 'unlimited' || user?.isAdmin;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-nunito font-semibold mb-4">Lesson Parameters</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Student selection */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific student</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.cefrLevel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Subject Area</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select subject area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* CEFR Level */}
            <FormField
              control={form.control}
              name="cefrLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">CEFR Level</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {cefrLevels.map((level) => (
                      <Button
                        key={level.value}
                        type="button"
                        variant={field.value === level.value ? "default" : "outline"}
                        className={field.value === level.value ? "bg-primary" : "border-gray-300"}
                        onClick={() => {
                          field.onChange(level.value);
                          setSelectedCefrLevel(level.value);
                        }}
                      >
                        {level.value}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Topic - Made larger and more prominent */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className="py-3 bg-blue-50 rounded-lg p-5 border-2 border-blue-200 shadow-md">
                  <div className="flex items-center gap-2">
                    <FormLabel className="font-bold text-lg text-blue-800">Enter a Conversation Topic</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-blue-500 hover:text-blue-700">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Enter a real-world topic for a conversation lesson. Our AI will automatically identify a relevant grammar point and explain it in the 'Grammar Spotlight' section!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-blue-600 mb-2">Enter the main topic for your lesson</p>
                  <FormControl>
                    <Textarea 
                      placeholder={placeholder} 
                      {...field} 
                      className="min-h-32 text-lg px-4 py-3 shadow-sm border-2 border-blue-300 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-blue-600 mt-2 italic">Be specific - a good topic helps generate better lessons</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Target Vocabulary Field */}
            <FormField
              control={form.control}
              name="targetVocabulary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Target Vocabulary (Optional)</FormLabel>
                  <p className="text-sm text-gray-600 mb-2">Add specific words you want included in the lesson</p>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. sustainable, recycle, ecosystem, conservation" 
                      {...field} 
                      className="min-h-20 text-md px-4 py-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600 mt-2 italic">Separate multiple words with commas</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* AI Provider - Hidden since only Gemini */}
            <FormField
              control={form.control}
              name="aiProvider"
              render={({ field }) => (
                <input type="hidden" {...field} value="gemini" />
              )}
            />
            
            {/* Generate button */}
            <div className="flex justify-center mt-8">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-lg flex items-center transition w-full justify-center"
                disabled={!canGenerate || form.formState.isSubmitting}
              >
                <Wand2 className="mr-2 text-xl" /> Generate Lesson
                {(isFreeTrialActive || user?.subscriptionTier === 'unlimited') && (
                  <span className="bg-white/20 ml-2 px-2 py-0.5 rounded-md text-sm">Unlimited</span>
                )}
              </Button>
            </div>
            
            {/* Show warning if cannot generate */}
            {!canGenerate && (
              <p className="text-destructive text-sm text-center mt-2">
                You need an active subscription to generate lessons.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}