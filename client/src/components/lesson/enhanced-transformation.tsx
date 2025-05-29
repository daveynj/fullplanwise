import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCw, 
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Zap,
  ChevronRight,
  Shuffle
} from 'lucide-react';

interface TransformationStep {
  id: string;
  label: string;
  before: string[];
  after: string[];
  explanation: string;
  highlight: number[];
}

interface EnhancedTransformationProps {
  grammarType: string;
  sentence: string;
  grammarWords: string[];
  onNext: () => void;
}

export function EnhancedTransformation({ 
  grammarType, 
  sentence, 
  grammarWords,
  onNext 
}: EnhancedTransformationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const generateTransformationSteps = (): TransformationStep[] => {
    if (grammarType.toLowerCase() === 'passive_voice') {
      return [
        {
          id: 'active',
          label: 'Active Voice (Original)',
          before: ['The chef', 'cooks', 'the meal'],
          after: ['The chef', 'cooks', 'the meal'],
          explanation: 'Subject performs the action on the object',
          highlight: [0, 1, 2]
        },
        {
          id: 'identify',
          label: 'Identify Components',
          before: ['Subject', 'Verb', 'Object'],
          after: ['Subject', 'Verb', 'Object'],
          explanation: 'Find who does what to whom',
          highlight: [0, 1, 2]
        },
        {
          id: 'swap',
          label: 'Swap Subject & Object',
          before: ['The chef', 'cooks', 'the meal'],
          after: ['The meal', 'cooks', 'the chef'],
          explanation: 'The object becomes the new subject',
          highlight: [0, 2]
        },
        {
          id: 'add_be',
          label: 'Add "be" Verb',
          before: ['The meal', 'cooks', 'the chef'],
          after: ['The meal', 'is', 'cooked', 'by the chef'],
          explanation: 'Insert appropriate form of "be" + past participle',
          highlight: [1, 2]
        },
        {
          id: 'final',
          label: 'Passive Voice (Complete)',
          before: ['The chef', 'cooks', 'the meal'],
          after: ['The meal', 'is cooked', 'by the chef'],
          explanation: 'Focus shifts to the action and result',
          highlight: [0, 1, 2]
        }
      ];
    } else if (grammarType.toLowerCase() === 'reported_speech') {
      return [
        {
          id: 'direct',
          label: 'Direct Speech (Original)',
          before: ['John said:', '"I am happy"'],
          after: ['John said:', '"I am happy"'],
          explanation: 'Exact words in quotation marks',
          highlight: [0, 1]
        },
        {
          id: 'reporting_verb',
          label: 'Add Reporting Verb',
          before: ['John', 'said:', '"I am happy"'],
          after: ['John', 'said that', '"I am happy"'],
          explanation: 'Add "that" after the reporting verb',
          highlight: [1]
        },
        {
          id: 'change_pronoun',
          label: 'Change Pronouns',
          before: ['John', 'said that', '"I am happy"'],
          after: ['John', 'said that', '"he was happy"'],
          explanation: 'Change pronouns from speaker\'s perspective',
          highlight: [2]
        },
        {
          id: 'change_tense',
          label: 'Change Tense',
          before: ['John', 'said that', '"he was happy"'],
          after: ['John', 'said that', 'he was happy'],
          explanation: 'Shift tense back one step and remove quotes',
          highlight: [2]
        },
        {
          id: 'final_reported',
          label: 'Reported Speech (Complete)',
          before: ['John said: "I am happy"'],
          after: ['John said that he was happy'],
          explanation: 'Indirect speech without quotation marks',
          highlight: [0, 1]
        }
      ];
    } else if (grammarType.toLowerCase() === 'subjunctive') {
      return [
        {
          id: 'identify_trigger',
          label: 'Identify Trigger Verb',
          before: ['I', 'suggest', 'that you study'],
          after: ['I', 'suggest', 'that you study'],
          explanation: 'Verbs like suggest, recommend, insist trigger subjunctive',
          highlight: [1]
        },
        {
          id: 'remove_s',
          label: 'Use Base Form',
          before: ['He', 'studies', 'hard'],
          after: ['that he', 'study', 'hard'],
          explanation: 'Remove -s/-es endings, use base form of verb',
          highlight: [1]
        },
        {
          id: 'be_form',
          label: 'Special "be" Form',
          before: ['I suggest that she', 'is', 'careful'],
          after: ['I suggest that she', 'be', 'careful'],
          explanation: 'Always use "be", never "is/am/are" in subjunctive',
          highlight: [1]
        },
        {
          id: 'complete_subjunctive',
          label: 'Complete Subjunctive',
          before: ['Normal:', 'He studies every day'],
          after: ['Subjunctive:', 'I suggest that he study'],
          explanation: 'The subjunctive expresses necessity, suggestion, or demand',
          highlight: [1]
        }
      ];
    } else if (grammarType.toLowerCase() === 'phrasal_verbs') {
      return [
        {
          id: 'separate',
          label: 'Verb + Particle (Separate)',
          before: ['turn', 'on', 'the light'],
          after: ['turn', 'on', 'the light'],
          explanation: 'Verb and particle work together',
          highlight: [0, 1]
        },
        {
          id: 'meaning',
          label: 'New Meaning Created',
          before: ['turn', '+', 'on', '=', 'activate'],
          after: ['turn', '+', 'on', '=', 'activate'],
          explanation: 'Combined meaning is different from individual parts',
          highlight: [0, 2, 4]
        },
        {
          id: 'separable',
          label: 'Separable Version',
          before: ['turn', 'on', 'the light'],
          after: ['turn', 'the light', 'on'],
          explanation: 'Some phrasal verbs can be separated',
          highlight: [0, 1, 2]
        },
        {
          id: 'pronoun',
          label: 'With Pronouns',
          before: ['turn', 'on', 'it'],
          after: ['turn', 'it', 'on'],
          explanation: 'Pronouns must go between verb and particle',
          highlight: [0, 1, 2]
        }
      ];
    }
    return [];
  };

  const transformationSteps = generateTransformationSteps();

  const getTransformationTitle = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'passive_voice':
        return 'Passive Voice: Changing Focus';
      case 'reported_speech':
        return 'Reported Speech: Retelling What Someone Said';
      case 'subjunctive':
        return 'Subjunctive: Expressing Necessity & Suggestion';
      case 'phrasal_verbs':
        return 'Phrasal Verbs: Verb + Particle Combinations';
      default:
        return `Grammar Transformation: ${grammarType.replace('_', ' ').toUpperCase()}`;
    }
  };

  const getTransformationDescription = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'passive_voice':
        return 'Passive voice isn\'t "bad English" - it\'s strategic English! Use it when the action matters more than who did it. Scientists love it ("The experiment was conducted"), but don\'t overuse it in casual conversation.';
      case 'reported_speech':
        return 'This is how you share conversations without using quotes. Essential for business ("The client said that..."), storytelling, and avoiding he-said-she-said repetition. Watch out for tense changes!';
      case 'subjunctive':
        return 'This makes you sound professional and formal. Instead of "I think you should study more" (casual), try "I suggest that you study more" (professional). It\'s the difference between friendly advice and official recommendations.';
      case 'phrasal_verbs':
        return 'These are the secret to natural English! "Turn on" doesn\'t mean "turn" + "on" - it means "activate." Students often translate word-by-word and get confused. Learn them as complete units.';
      default:
        return 'This transformation changes the structure of your sentence while keeping the same basic meaning.';
    }
  };

  const getTransformationPurpose = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'passive_voice':
        return 'Use this in research papers ("The data was analyzed"), news reports ("The building was destroyed"), and when you don\'t know who did something ("My bike was stolen"). Avoid in casual conversation - it sounds too formal.';
      case 'reported_speech':
        return 'Perfect for meeting summaries ("She mentioned that the deadline changed"), sharing gossip politely ("He told me that he might quit"), and academic writing where you cite sources.';
      case 'subjunctive':
        return 'Use in formal recommendations ("I suggest that he be more careful"), business proposals ("I recommend that we postpone the meeting"), and official documents. Sounds very professional and educated.';
      case 'phrasal_verbs':
        return 'Master these for natural conversation! They\'re everywhere: "pick up" (learn/collect), "put off" (postpone), "get over" (recover). You can\'t avoid them - native speakers use them constantly.';
      default:
        return 'Understanding this transformation helps you express the same idea in different ways, making your English more flexible and natural.';
    }
  };

  // Auto-play animation
  useEffect(() => {
    if (isPlaying && currentStep < transformationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStep >= transformationSteps.length - 1) {
      setIsPlaying(false);
      setShowComparison(true);
    }
  }, [isPlaying, currentStep, transformationSteps.length]);

  const handlePlay = () => {
    if (currentStep >= transformationSteps.length - 1) {
      setCurrentStep(0);
      setShowComparison(false);
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setShowComparison(false);
  };

  const currentTransformation = transformationSteps[currentStep];

  const renderWordBox = (word: string, index: number, isHighlighted: boolean, isAfter: boolean = false) => {
    return (
      <motion.div
        key={`${word}-${index}-${isAfter ? 'after' : 'before'}`}
        layout
        className={`px-4 py-2 rounded-lg border-2 font-semibold text-center min-w-[80px] ${
          isHighlighted 
            ? 'bg-blue-500 text-white border-blue-600 shadow-lg' 
            : 'bg-gray-100 text-gray-700 border-gray-300'
        }`}
        animate={isHighlighted ? { 
          scale: [1, 1.05, 1],
          boxShadow: ['0 0 0 0px rgba(59, 130, 246, 0.5)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0px rgba(59, 130, 246, 0)']
        } : {}}
        transition={{ duration: 0.6, repeat: isHighlighted ? Infinity : 0 }}
      >
        {word}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <RotateCw className="h-6 w-6 text-orange-600" />
            {getTransformationTitle(grammarType)}
            <Badge variant="outline">Step {currentStep + 1}/{transformationSteps.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">{getTransformationDescription(grammarType)}</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">🔄 Why Transform Grammar?</h4>
              <p className="text-orange-700 text-sm">{getTransformationPurpose(grammarType)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {currentStep >= transformationSteps.length - 1 ? 'Replay' : 'Play Transformation'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsPlaying(false)}
              disabled={!isPlaying}
            >
              <Pause className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>

            <div className="flex-1" />

            {isPlaying && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center gap-2 text-sm text-orange-600"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Transforming...</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transformation Display */}
      <Card>
        <CardContent className="p-8">
          {currentTransformation && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Step Title */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {currentTransformation.label}
                </h3>
                <p className="text-gray-600">
                  {currentTransformation.explanation}
                </p>
              </div>

              {/* Before State */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 text-center">Before:</h4>
                <div className="flex justify-center items-center gap-3 flex-wrap">
                  {currentTransformation.before.map((word, index) => 
                    renderWordBox(
                      word, 
                      index, 
                      currentTransformation.highlight.includes(index),
                      false
                    )
                  )}
                </div>
              </div>

              {/* Transformation Arrow */}
              <div className="flex justify-center">
                <motion.div
                  animate={{ 
                    x: [0, 10, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: isPlaying ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className="bg-orange-500 text-white p-3 rounded-full"
                >
                  <Shuffle className="h-6 w-6" />
                </motion.div>
              </div>

              {/* After State */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 text-center">After:</h4>
                <div className="flex justify-center items-center gap-3 flex-wrap">
                  {currentTransformation.after.map((word, index) => 
                    renderWordBox(
                      word, 
                      index, 
                      currentTransformation.highlight.includes(index),
                      true
                    )
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0 || isPlaying}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {transformationSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentStep ? 'bg-orange-500' : 
                        index < currentStep ? 'bg-orange-300' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.min(transformationSteps.length - 1, currentStep + 1))}
                  disabled={currentStep >= transformationSteps.length - 1 || isPlaying}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6"
          >
            <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Complete Transformation
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-bold text-blue-700 mb-3">Original:</h5>
                <div className="flex gap-2 flex-wrap">
                  {transformationSteps[0]?.before.map((word, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                      {word}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {grammarType === 'passive_voice' 
                    ? 'Subject performs action on object'
                    : 'Verb and particle work together'
                  }
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-bold text-green-700 mb-3">Transformed:</h5>
                <div className="flex gap-2 flex-wrap">
                  {transformationSteps[transformationSteps.length - 1]?.after.map((word, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                      {word}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {grammarType === 'passive_voice' 
                    ? 'Focus shifts to action and result'
                    : 'Components can be rearranged'
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg p-4 border">
              <h5 className="font-bold text-gray-700 mb-2">Your Sentence Analysis:</h5>
              <p className="text-lg mb-3">{sentence}</p>
              <div className="flex gap-2">
                {grammarWords.map((word, index) => (
                  <Badge key={index} className="bg-orange-500 text-white">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Watch Again
              </Button>
              <Button 
                onClick={onNext}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue Learning <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grammar Rules */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">📚 Key Rules</h4>
          
          {grammarType === 'passive_voice' ? (
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>Active to Passive:</strong> Object becomes subject + be + past participle + by + original subject
              </div>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <strong>When to use:</strong> When the action is more important than who does it
              </div>
              <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                <strong>Common mistake:</strong> Forgetting to change the verb form to past participle
              </div>
            </div>
          ) : grammarType === 'reported_speech' ? (
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>Direct Speech:</strong> Exact words in quotation marks
              </div>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <strong>Reported Speech:</strong> Indirect speech without quotation marks
              </div>
            </div>
          ) : grammarType === 'subjunctive' ? (
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>Subjunctive:</strong> Expresses necessity, suggestion, or demand
              </div>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <strong>Trigger Verb:</strong> Verbs like suggest, recommend, insist trigger subjunctive
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>Separable:</strong> Can put object between verb and particle (turn it on)
              </div>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <strong>Inseparable:</strong> Must keep verb and particle together (look after someone)
              </div>
              <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                <strong>With pronouns:</strong> Pronouns must go between separable phrasal verbs
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 