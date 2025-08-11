import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  PuzzleIcon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  PlayCircle,
  Volume2,
  Download,
  Share2,
  Target,
  Brain,
  Lightbulb,
  GraduationCap,
  Languages,
  Sparkles
} from 'lucide-react';

// Import the lesson template structure
interface LessonTemplate {
  title: string;
  level: string;
  focus: string;
  estimatedTime: number;
  sections: LessonSection[];
  grammarSpotlight: GrammarSpotlight;
}

interface LessonSection {
  type: string;
  title: string;
  content?: string;
  questions?: any[];
  words?: VocabularyWord[];
  paragraphs?: string[];
  frames?: SentenceFrame[];
  sentences?: UnscrambleSentence[];
  text?: string;
  wordBank?: string[];
  procedure?: string;
  teacherNotes?: string;
  introduction?: string;
  targetVocabulary?: string[];
}

interface VocabularyWord {
  term: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  pronunciation: {
    syllables: string[];
    stressIndex: number;
    phoneticGuide: string;
  };
  semanticMap: {
    synonyms: string[];
    antonyms: string[];
    relatedConcepts: string[];
    contexts: string[];
    associatedWords: string[];
  };
  imagePrompt: string;
  wordFamily: {
    words: string[];
    description: string;
  };
  collocations: string[];
  usageNotes: string;
  teachingTips: string;
  additionalExamples: string[];
  semanticGroup: string;
}

interface SentenceFrame {
  patternTemplate: string;
  languageFunction: string;
  title: string;
  level: string;
  grammarFocus: string[];
  structureComponents: StructureComponent[];
  examples: FrameExample[];
  teachingNotes: string[];
}

interface StructureComponent {
  label: string;
  description: string;
  examples: string[];
  inSentenceExample: string;
}

interface FrameExample {
  completeSentence: string;
  breakdown: Record<string, string>;
}

interface UnscrambleSentence {
  words: string[];
  correctSentence: string;
}

interface GrammarSpotlight {
  grammarType: string;
  title: string;
  description: string;
  logicExplanation: {
    communicationNeed: string;
    logicalSolution: string;
    usagePattern: string;
    communicationImpact: string;
  };
  teachingTips: string[];
  examples: GrammarExample[];
  visualSteps: VisualStep[];
  visualLayout: VisualLayout;
  interactiveFeatures: Record<string, boolean>;
}

interface GrammarExample {
  sentence: string;
  highlighted: string;
  explanation: string;
}

interface VisualStep {
  stepNumber: number;
  instruction: string;
  visualElements: {
    type: string;
    elements?: string;
    guidance?: string;
    commonMistakes?: string[];
    successTips?: string[];
  };
}

interface VisualLayout {
  recommendedType: string;
  primaryColor: string;
  pedagogicalApproach: {
    learningObjective: string;
    practiceActivities: string[];
    realWorldApplication: string;
  };
  adaptiveFeatures: {
    levelAdjustment: string;
    scaffolding: string;
    extension: string;
  };
}

// Section Header Component
const SectionHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  color = "blue",
  estimatedTime 
}: {
  icon: any;
  title: string;
  description?: string;
  color?: string;
  estimatedTime?: string;
}) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
    </div>
    {estimatedTime && (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="h-4 w-4" />
        <span className="text-sm">{estimatedTime}</span>
      </div>
    )}
  </div>
);

// Warmup Section Component
const WarmupSection = ({ section }: { section: LessonSection }) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Users}
      title={section.title}
      description="Activate your prior knowledge and prepare for the lesson topic through discussion."
      color="green"
      estimatedTime="10-15 minutes"
    />
    
    <Card className="border-green-200 shadow-md">
      <CardHeader className="bg-green-50 border-b border-green-100">
        <CardTitle className="text-green-700 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {section.questions?.map((question, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                {index + 1}
              </div>
              <p className="text-gray-800 text-lg">{question}</p>
            </div>
          ))}
        </div>
        
        {section.targetVocabulary && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Preview Vocabulary</h4>
            <div className="flex flex-wrap gap-2">
              {section.targetVocabulary.map((word, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {section.teacherNotes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Teacher Notes</h4>
            <p className="text-yellow-700">{section.teacherNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

// Reading Section Component
const ReadingSection = ({ section }: { section: LessonSection }) => {
  const [activeParagraph, setActiveParagraph] = useState(0);
  const paragraphs = section.paragraphs || [];
  
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={BookOpen}
        title={section.title}
        description="Read the text carefully and notice the vocabulary we discussed earlier."
        color="blue"
        estimatedTime="15-20 minutes"
      />
      
      <Card className="border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Reading Text
            </CardTitle>
            {paragraphs.length > 1 && (
              <div className="text-sm text-blue-600">
                Paragraph {activeParagraph + 1} of {paragraphs.length}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none">
            {paragraphs.length > 0 ? (
              <p className="text-xl leading-relaxed text-gray-800 font-medium">
                {paragraphs[activeParagraph]}
              </p>
            ) : (
              <p className="text-gray-500">No reading content available</p>
            )}
          </div>
          
          {paragraphs.length > 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setActiveParagraph(prev => Math.max(0, prev - 1))}
                disabled={activeParagraph === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={() => setActiveParagraph(prev => Math.min(paragraphs.length - 1, prev + 1))}
                disabled={activeParagraph === paragraphs.length - 1}
                variant="outline"
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Vocabulary Card Component
const VocabularyCard = ({ word }: { word: VocabularyWord }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const playPronunciation = () => {
    setPlayingAudio(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.term);
      utterance.rate = 0.8;
      utterance.onend = () => setPlayingAudio(false);
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudio(false), 1000);
    }
  };

  return (
    <Card className="h-64 cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={() => setIsFlipped(!isFlipped)}>
      <CardContent className="p-6 h-full">
        {!isFlipped ? (
          // Front of card
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{word.term}</h3>
                <Badge variant="secondary">{word.partOfSpeech}</Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPronunciation();
                  }}
                  className="flex items-center gap-1"
                >
                  <Volume2 className={`h-4 w-4 ${playingAudio ? 'text-blue-600' : ''}`} />
                  <span className="text-sm font-mono">{word.pronunciation.phoneticGuide}</span>
                </Button>
              </div>
              
              <p className="text-lg text-gray-700 mb-4">{word.definition}</p>
              <p className="text-gray-600 italic">"{word.example}"</p>
            </div>
            
            <div className="text-xs text-gray-400 text-center">
              Click to see more details →
            </div>
          </div>
        ) : (
          // Back of card
          <div className="h-full overflow-y-auto space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Word Family</h4>
              <div className="flex flex-wrap gap-1">
                {word.wordFamily.words.map((related, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {related}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Common Phrases</h4>
              <div className="space-y-1">
                {word.collocations.map((phrase, index) => (
                  <div key={index} className="text-sm text-gray-600">• {phrase}</div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Synonyms</h4>
              <div className="flex flex-wrap gap-1">
                {word.semanticMap.synonyms.slice(0, 3).map((synonym, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-green-50">
                    {synonym}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-400 text-center">
              ← Click to go back
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Vocabulary Section Component
const VocabularySection = ({ section }: { section: LessonSection }) => (
  <div className="space-y-6">
    <SectionHeader
      icon={Languages}
      title={section.title}
      description="Learn key vocabulary words with definitions, pronunciation, and examples."
      color="purple"
      estimatedTime="20-25 minutes"
    />
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {section.words?.map((word, index) => (
        <VocabularyCard key={index} word={word} />
      ))}
    </div>
  </div>
);

// Comprehension Section Component
const ComprehensionSection = ({ section }: { section: LessonSection }) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const questions = section.questions || [];
  
  const handleSubmit = () => {
    setShowResult(true);
  };
  
  const nextQuestion = () => {
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CheckCircle2}
        title={section.title}
        description="Test your understanding of the reading text."
        color="orange"
        estimatedTime="15-20 minutes"
      />
      
      <Card className="border-orange-200 shadow-md">
        <CardHeader className="bg-orange-50 border-b border-orange-100">
          <CardTitle className="text-orange-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Question {activeQuestion + 1} of {questions.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {questions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {questions[activeQuestion].question}
              </h3>
              
              <div className="space-y-3">
                {questions[activeQuestion].options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      selectedAnswer === option
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              {!showResult && (
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="w-full"
                >
                  Submit Answer
                </Button>
              )}
              
              {showResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    selectedAnswer === questions[activeQuestion].correctAnswer
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-semibold ${
                      selectedAnswer === questions[activeQuestion].correctAnswer
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {selectedAnswer === questions[activeQuestion].correctAnswer
                        ? '✓ Correct!'
                        : '✗ Incorrect'
                      }
                    </p>
                    <p className="text-gray-700 mt-2">
                      {questions[activeQuestion].explanation}
                    </p>
                  </div>
                  
                  {activeQuestion < questions.length - 1 && (
                    <Button onClick={nextQuestion} className="w-full">
                      Next Question
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Grammar Spotlight Component
const GrammarSpotlightSection = ({ grammarSpotlight }: { grammarSpotlight: GrammarSpotlight }) => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Brain}
        title={grammarSpotlight.title}
        description={grammarSpotlight.description}
        color="indigo"
        estimatedTime="15-20 minutes"
      />
      
      <Card className="border-indigo-200 shadow-md">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100">
          <CardTitle className="text-indigo-700 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Understanding the Logic
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Why do we need this?</h4>
                <p className="text-gray-600">{grammarSpotlight.logicExplanation.communicationNeed}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">How does it work?</h4>
                <p className="text-gray-600">{grammarSpotlight.logicExplanation.logicalSolution}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Examples</h4>
              {grammarSpotlight.examples.map((example, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg mb-2" dangerouslySetInnerHTML={{ 
                    __html: example.highlighted.replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-200 px-1 rounded">$1</span>')
                  }} />
                  <p className="text-sm text-gray-600">{example.explanation}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Learning Steps</h4>
              <div className="flex space-x-2 mb-4">
                {grammarSpotlight.visualSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveStep(index)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeStep === index
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Step {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h5 className="font-semibold text-indigo-800 mb-2">
                  Step {activeStep + 1}: {grammarSpotlight.visualSteps[activeStep]?.instruction}
                </h5>
                <div className="text-indigo-700">
                  {grammarSpotlight.visualSteps[activeStep]?.visualElements.elements && (
                    <p className="mb-2">{grammarSpotlight.visualSteps[activeStep].visualElements.elements}</p>
                  )}
                  {grammarSpotlight.visualSteps[activeStep]?.visualElements.guidance && (
                    <p>{grammarSpotlight.visualSteps[activeStep].visualElements.guidance}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Lesson Layout Component
export const LessonLayout = ({ lesson }: { lesson: LessonTemplate }) => {
  const [activeTab, setActiveTab] = useState("warmup");
  
  const getSectionByType = (type: string) => {
    return lesson.sections.find(section => section.type === type);
  };

  const tabs = [
    { id: "warmup", label: "Warm-up", icon: Users },
    { id: "reading", label: "Reading", icon: BookOpen },
    { id: "vocabulary", label: "Vocabulary", icon: Languages },
    { id: "comprehension", label: "Comprehension", icon: CheckCircle2 },
    { id: "grammar", label: "Grammar", icon: Brain },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Lesson Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {lesson.level.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>{lesson.estimatedTime} minutes</span>
              </div>
              <Badge variant="secondary">
                {lesson.focus}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="warmup">
          {getSectionByType("warmup") && <WarmupSection section={getSectionByType("warmup")!} />}
        </TabsContent>

        <TabsContent value="reading">
          {getSectionByType("reading") && <ReadingSection section={getSectionByType("reading")!} />}
        </TabsContent>

        <TabsContent value="vocabulary">
          {getSectionByType("vocabulary") && <VocabularySection section={getSectionByType("vocabulary")!} />}
        </TabsContent>

        <TabsContent value="comprehension">
          {getSectionByType("comprehension") && <ComprehensionSection section={getSectionByType("comprehension")!} />}
        </TabsContent>

        <TabsContent value="grammar">
          {lesson.grammarSpotlight && <GrammarSpotlightSection grammarSpotlight={lesson.grammarSpotlight} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LessonLayout;