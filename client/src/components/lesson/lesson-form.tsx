import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Student } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Image, History } from "lucide-react";

// Define CEFR levels
const cefrLevels = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficiency" },
];

// Lesson components
const lessonComponents = [
  { id: "warm-up", label: "Warm-up Activity" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "reading", label: "Reading Passage" },
  { id: "comprehension", label: "Comprehension Questions" },
  { id: "sentences", label: "Sentence Frames" },
  { id: "discussion", label: "Discussion Questions" },
  { id: "quiz", label: "Quiz" },
  { id: "homework", label: "Homework" },
];

// Schema for the form
const formSchema = z.object({
  studentId: z.string().optional(),
  cefrLevel: z.string(),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  textInput: z.string().optional(),
  components: z.array(z.string()).min(1, "Select at least one component"),
  generateImages: z.boolean().default(true),
  useStudentHistory: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface LessonFormProps {
  students: Student[];
  onSubmit: (data: any) => void;
  credits: number;
}

export function LessonForm({ students, onSubmit, credits }: LessonFormProps) {
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>("B1");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "none",
      cefrLevel: "B1",
      topic: "",
      textInput: "",
      components: ["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"],
      generateImages: true,
      useStudentHistory: true,
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Convert studentId to number if it exists and isn't 'none'
    const parsedValues = {
      ...values,
      studentId: values.studentId && values.studentId !== 'none' 
        ? parseInt(values.studentId) 
        : undefined,
    };
    
    onSubmit(parsedValues);
  };

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
            
            {/* Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Topic or Subject</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Environmental issues, Travel, Food" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Text Input */}
            <FormField
              control={form.control}
              name="textInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Additional Text Input (Optional)
                    <span className="font-normal text-sm text-gray-500 ml-1">Article, story or specific content</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste text or article you want to use as the base for the lesson..." 
                      className="resize-none" 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Lesson components */}
            <FormField
              control={form.control}
              name="components"
              render={() => (
                <FormItem>
                  <FormLabel className="font-semibold">Lesson Components</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    {lessonComponents.map((component) => (
                      <FormField
                        key={component.id}
                        control={form.control}
                        name="components"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={component.id}
                              className="flex items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(component.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedComponents = checked
                                      ? [...field.value, component.id]
                                      : field.value.filter((item) => item !== component.id);
                                    field.onChange(updatedComponents);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {component.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Options */}
            <FormItem>
              <FormLabel className="font-semibold">Options</FormLabel>
              
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="generateImages"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Image className="text-xl text-gray-500 mr-2 h-5 w-5" />
                        <span>Generate Images</span>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="useStudentHistory"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <History className="text-xl text-gray-500 mr-2 h-5 w-5" />
                        <span>Use Student History</span>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormItem>
            
            {/* Generate button */}
            <div className="flex justify-center mt-8">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-lg flex items-center transition w-full justify-center"
                disabled={credits < 1 || form.formState.isSubmitting}
              >
                <Wand2 className="mr-2 text-xl" /> Generate Lesson
                <span className="bg-white/20 ml-2 px-2 py-0.5 rounded-md text-sm">1 Credit</span>
              </Button>
            </div>
            
            {/* Show warning if no credits */}
            {credits < 1 && (
              <p className="text-destructive text-sm text-center mt-2">
                You need at least 1 credit to generate a lesson.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
