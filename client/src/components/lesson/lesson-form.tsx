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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Wand2, Bot, Sparkles, Info, Quote } from "lucide-react";
import { EXPRESSIONS_COMPONENT, expressionsRulesFor } from "@shared/lesson-expressions";
import { grammarTopicHint } from "@shared/topic-hints";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaughtPrompt } from "@/components/lesson/taught-prompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { initialStudentMode, type StudentMode } from "@/components/lesson/student-mode";

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
  initialStudentId?: string;
  /** Filled in when making a lesson from a student's idea. */
  initialTopic?: string;
  initialCefrLevel?: string;
}

const placeholders = [
  "e.g., The future of space exploration",
  "e.g., Different cultural holidays around the world",
  "e.g., The benefits of learning a new skill",
  "e.g., How technology has changed our daily lives",
  "e.g., My favorite type of food and why",
];

export function LessonForm({ students, onSubmit, initialStudentId, initialTopic, initialCefrLevel }: LessonFormProps) {
  const startLevel = initialCefrLevel && cefrLevels.some((level) => level.value === initialCefrLevel) ? initialCefrLevel : "B1";
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>(startLevel);
  const [placeholder, setPlaceholder] = useState(placeholders[0]);
  const { canGenerateLessons, isInTrial, isSubscriber, freeCreditsRemaining } = useTrialStatus();
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
      studentId: initialStudentId || "none",
      cefrLevel: startLevel,
      topic: initialTopic ?? "",
      targetVocabulary: "",
      aiProvider: "gemini",
      focus: "general",
      lessonLength: 60,
      category: "general",
    },
  });

  // Start from the student the teacher made a lesson for last time, so the
  // next lesson builds on that student's words instead of "No specific
  // student". A student chosen in the link (?studentId=) always wins.
  const lastStudentKey = user ? `planwise.lastStudent.${user.id}` : null;
  useEffect(() => {
    if (!lastStudentKey || initialStudentId) return;
    if (form.getValues("studentId") !== "none" || form.formState.dirtyFields.studentId) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(lastStudentKey);
    } catch {
      saved = null;
    }
    if (saved && students.some((s) => String(s.id) === saved)) {
      form.setValue("studentId", saved);
    }
  }, [students, lastStudentKey, initialStudentId, form]);
  const selectedStudentId = form.watch("studentId");
  const selectedStudent = students.find((s) => String(s.id) === selectedStudentId);

  // "Who is this lesson for?" Teachers with students pick one; teachers
  // without any type a first name, which creates the student on the spot.
  // A lesson for a named student is what makes PlanWise remember their words.
  const [studentMode, setStudentMode] = useState<StudentMode>(() => initialStudentMode(students.length, initialStudentId));
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAbout, setNewStudentAbout] = useState("");
  const [askedForName, setAskedForName] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  useEffect(() => {
    // Students load after the form: switch to picking one once they arrive,
    // unless the teacher already started typing a new name.
    if (students.length > 0 && studentMode === "new" && !newStudentName.trim()) setStudentMode("existing");
  }, [students.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // The idioms & phrasal verbs switch follows the level's default until the
  // teacher changes it; it is never offered for A1.
  const [expressionsChoice, setExpressionsChoice] = useState<boolean | null>(null);
  const includesExpressions = (level: string) => {
    const rules = expressionsRulesFor(level);
    return rules !== null && (expressionsChoice ?? rules.onByDefault);
  };
  const cefrLevel = form.watch("cefrLevel");
  const expressionsRules = expressionsRulesFor(cefrLevel);
  const expressionsOn = includesExpressions(cefrLevel);

  const handleSubmit = async (values: FormValues) => {
    setStudentError(null);
    if (studentMode === "new") {
      const name = newStudentName.trim();
      if (!name && !askedForName) {
        // Ask once; pressing Generate again makes the lesson without a student.
        setAskedForName(true);
        return;
      }
      if (name) {
        setCreatingStudent(true);
        try {
          const res = await apiRequest("POST", "/api/students", {
            name,
            cefrLevel: values.cefrLevel,
            ...(newStudentAbout.trim() ? { notes: newStudentAbout.trim() } : {}),
          });
          const created = (await res.json()) as { id: number };
          // Counted in Analytics by the server (student_added), not here.
          await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
          values = { ...values, studentId: String(created.id) };
          form.setValue("studentId", String(created.id));
          setStudentMode("existing");
          setNewStudentName("");
          setNewStudentAbout("");
        } catch {
          setStudentError("We couldn’t save the student. Try again, or choose “Just exploring”.");
          setCreatingStudent(false);
          return;
        }
        setCreatingStudent(false);
      } else {
        values = { ...values, studentId: "none" };
      }
    } else if (studentMode === "none") {
      values = { ...values, studentId: "none" };
    }

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
      components: [
        "warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz",
        ...(includesExpressions(values.cefrLevel) ? [EXPRESSIONS_COMPONENT] : []),
      ],
      generateImages: true,
      useStudentHistory: true
    };
    
    if (lastStudentKey) {
      try {
        if (parsedValues.studentId) window.localStorage.setItem(lastStudentKey, String(parsedValues.studentId));
      } catch {
        // Private windows can refuse storage; the form then starts from "No specific student".
      }
    }
    onSubmit(parsedValues);
  };

  const canGenerate = canGenerateLessons || user?.isAdmin;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-nunito font-semibold mb-4">Lesson Parameters</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Who is this lesson for? */}
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3" data-testid="who-is-this-for">
              <div>
                <p className="font-semibold text-gray-900">Who is this lesson for?</p>
                <p className="text-sm text-gray-600">
                  PlanWise remembers each student’s words, so their next lesson builds on this one instead of starting again.
                </p>
              </div>

              {studentMode === "existing" && students.length > 0 && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Student</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "__new") {
                            setStudentMode("new");
                            field.onChange("none");
                          } else {
                            field.onChange(value);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name} ({student.cefrLevel})
                            </SelectItem>
                          ))}
                          <SelectItem value="__new">+ A new student</SelectItem>
                          <SelectItem value="none">No specific student (just exploring)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {studentMode === "new" && (
                <div className="space-y-2">
                  <Input
                    aria-label="Student’s first name"
                    placeholder="Their first name, e.g. Maria"
                    value={newStudentName}
                    onChange={(e) => {
                      setNewStudentName(e.target.value);
                      setAskedForName(false);
                    }}
                    className="bg-white"
                    maxLength={60}
                  />
                  <Input
                    aria-label="About the student (optional)"
                    placeholder="Optional: anything about them, e.g. 13-year-old boy from China, loves gaming; or: first lesson, don’t know her yet"
                    value={newStudentAbout}
                    onChange={(e) => setNewStudentAbout(e.target.value)}
                    className="bg-white"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500">Write as much or as little as you like: PlanWise uses it to fit every lesson to them. Their level is the CEFR level below, and you can change any of this later.</p>
                  {askedForName && !newStudentName.trim() && (
                    <p className="text-sm text-amber-800" role="status">
                      Add their first name so PlanWise can remember their words, or press Generate again to make this lesson without a student.
                    </p>
                  )}
                </div>
              )}

              {studentMode === "none" && (
                <p className="text-sm text-gray-700">This lesson won’t be saved to a student.</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {studentMode !== "existing" && students.length > 0 && (
                  <button type="button" className="text-primary underline underline-offset-2" onClick={() => setStudentMode("existing")}>
                    Choose one of my students
                  </button>
                )}
                {studentMode !== "new" && (
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => {
                      setStudentMode("new");
                      form.setValue("studentId", "none");
                    }}
                  >
                    {students.length > 0 ? "Add a new student" : "Add a student"}
                  </button>
                )}
                {studentMode !== "none" && (
                  <button
                    type="button"
                    className="text-gray-500 underline underline-offset-2"
                    onClick={() => {
                      setStudentMode("none");
                      form.setValue("studentId", "none");
                    }}
                  >
                    Just exploring
                  </button>
                )}
              </div>
              {studentError && <p className="text-sm text-red-700" role="alert">{studentError}</p>}
            </div>
            {studentMode === "existing" && selectedStudent && <TaughtPrompt studentId={selectedStudent.id} studentName={selectedStudent.name} />}
            
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
                          <p>Enter a real-world topic for a conversation lesson. You can also add notes about your student, like their job or interests, to shape the lesson.</p>
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
                  {(() => {
                    const hint = grammarTopicHint(field.value || "");
                    if (!hint) return null;
                    return (
                      <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" data-testid="grammar-topic-hint">
                        <p>
                          PlanWise makes <strong>conversation lessons</strong>: grammar is practised in the sentence frames, not taught as rules.
                          To practise {hint.grammar}, try a topic where your student will naturally use it, for example:
                        </p>
                        <button
                          type="button"
                          className="mt-2 font-semibold underline decoration-amber-500 underline-offset-2 hover:text-amber-700"
                          onClick={() => form.setValue("topic", hint.suggestion, { shouldValidate: true, shouldDirty: true })}
                        >
                          Use "{hint.suggestion}"
                        </button>
                      </div>
                    );
                  })()}
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

            {/* Idioms & phrasal verbs switch */}
            <div
              className={`flex items-center justify-between gap-4 rounded-lg border-2 p-4 ${
                expressionsOn ? "border-pink-200 bg-pink-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-pink-600" />
                  <Label htmlFor="include-expressions" className="font-semibold">Idioms &amp; phrasal verbs</Label>
                </div>
                <p id="include-expressions-hint" className="text-sm text-gray-600 mt-1.5">
                  {expressionsRules ? expressionsRules.formHint : "Not offered for A1 lessons. Beginners focus on the five words."}
                </p>
              </div>
              <Switch
                id="include-expressions"
                checked={expressionsOn}
                onCheckedChange={setExpressionsChoice}
                disabled={!expressionsRules}
                aria-describedby="include-expressions-hint"
              />
            </div>

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
                disabled={!canGenerate || form.formState.isSubmitting || creatingStudent}
              >
                <Wand2 className="mr-2 text-xl" /> Generate Lesson
                {(isInTrial || isSubscriber) && (
                  <span className="bg-white/20 ml-2 px-2 py-0.5 rounded-md text-sm">Unlimited</span>
                )}
                {!isInTrial && !isSubscriber && freeCreditsRemaining > 0 && (
                  <span className="bg-white/20 ml-2 px-2 py-0.5 rounded-md text-sm">{freeCreditsRemaining} credit{freeCreditsRemaining !== 1 ? 's' : ''} left</span>
                )}
              </Button>
            </div>
            
            {/* Show warning if cannot generate */}
            {!canGenerate && (
              <p className="text-destructive text-sm text-center mt-2">
                Your free trial has ended and you've used all your free lessons. Subscribe for unlimited access!
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}