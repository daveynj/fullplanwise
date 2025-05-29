import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Zap,
  Target,
  ChevronRight,
  FastForward,
  Rewind
} from 'lucide-react';

interface TimelinePoint {
  id: string;
  time: string;
  label: string;
  action: string;
  highlighted: boolean;
  grammarRole: string;
  explanation: string;
}

interface EnhancedTimelineConnectionProps {
  grammarType: string;
  sentence: string;
  grammarWords: string[];
  onNext: () => void;
}

export function EnhancedTimelineConnection({ 
  grammarType, 
  sentence, 
  grammarWords,
  onNext 
}: EnhancedTimelineConnectionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedPoint, setHighlightedPoint] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);

  // Generate timeline data based on grammar type
  const generateTimelineData = (): TimelinePoint[] => {
    switch (grammarType.toLowerCase()) {
      case 'simple_present':
        return [
          {
            id: 'habitual',
            time: 'ROUTINE',
            label: 'Habitual Action',
            action: extractSimplePresentAction(sentence),
            highlighted: true,
            grammarRole: 'Present Simple Verb',
            explanation: 'Actions that happen regularly or are always true'
          },
          {
            id: 'frequency',
            time: 'FREQUENCY',
            label: 'How Often',
            action: extractFrequencyIndicator(sentence),
            highlighted: false,
            grammarRole: 'Time Expression',
            explanation: 'When or how often the action happens'
          },
          {
            id: 'general-truth',
            time: 'ALWAYS TRUE',
            label: 'General Truth',
            action: 'Facts and habits',
            highlighted: false,
            grammarRole: 'Universal Truth',
            explanation: 'Things that are generally or always true'
          }
        ];

      case 'simple_past':
        return [
          {
            id: 'past-action',
            time: 'PAST',
            label: 'Completed Action',
            action: extractSimplePastAction(sentence),
            highlighted: true,
            grammarRole: 'Past Simple Verb',
            explanation: 'An action that was completed in the past'
          },
          {
            id: 'time-marker',
            time: 'WHEN',
            label: 'Time Reference',
            action: extractTimeMarker(sentence),
            highlighted: false,
            grammarRole: 'Time Expression',
            explanation: 'When the action happened'
          },
          {
            id: 'finished',
            time: 'FINISHED',
            label: 'Complete',
            action: 'Action is done',
            highlighted: false,
            grammarRole: 'Completion',
            explanation: 'The action is completely finished'
          }
        ];

      case 'advanced_tenses':
        return [
          {
            id: 'duration-start',
            time: 'PAST START',
            label: 'Action Begins',
            action: extractAdvancedTenseStart(sentence),
            highlighted: true,
            grammarRole: 'Starting Point',
            explanation: 'When the ongoing action started'
          },
          {
            id: 'continuous',
            time: 'ONGOING',
            label: 'Continuous Action',
            action: extractAdvancedTenseMarker(sentence),
            highlighted: true,
            grammarRole: 'Perfect Continuous',
            explanation: 'The action continues over time'
          },
          {
            id: 'future-point',
            time: 'FUTURE POINT',
            label: 'Reference Point',
            action: extractFutureReference(sentence),
            highlighted: true,
            grammarRole: 'Future Reference',
            explanation: 'The future point we measure from'
          }
        ];

      case 'present_perfect':
        return [
          {
            id: 'past-action',
            time: 'PAST',
            label: 'Earlier Action',
            action: extractPastAction(sentence),
            highlighted: true,
            grammarRole: 'Past Participle',
            explanation: 'The action that was completed in the past'
          },
          {
            id: 'connection',
            time: 'BRIDGE',
            label: 'Connection',
            action: 'have/has',
            highlighted: true,
            grammarRole: 'Present Perfect Auxiliary',
            explanation: 'Links the past action to the present moment'
          },
          {
            id: 'present-result',
            time: 'NOW',
            label: 'Present Result',
            action: extractPresentResult(sentence),
            highlighted: false,
            grammarRole: 'Current State',
            explanation: 'How the past action affects the present'
          }
        ];
      
      case 'past_perfect':
        return [
          {
            id: 'earlier-past',
            time: 'EARLIER PAST',
            label: 'First Action',
            action: extractPastPerfectAction(sentence),
            highlighted: true,
            grammarRole: 'Past Participle',
            explanation: 'The action that happened first'
          },
          {
            id: 'later-past',
            time: 'LATER PAST',
            label: 'Second Action',
            action: extractSimplePastAction(sentence),
            highlighted: false,
            grammarRole: 'Simple Past',
            explanation: 'The action that happened second'
          },
          {
            id: 'sequence',
            time: 'SEQUENCE',
            label: 'Order Matters',
            action: 'had',
            highlighted: true,
            grammarRole: 'Past Perfect Marker',
            explanation: 'Shows which action came first'
          }
        ];
      
      case 'future_forms':
        return [
          {
            id: 'now',
            time: 'NOW',
            label: 'Current Moment',
            action: 'Making plans/decisions',
            highlighted: false,
            grammarRole: 'Present Context',
            explanation: 'When we think about the future'
          },
          {
            id: 'planning',
            time: 'PLANNING',
            label: 'Future Intention',
            action: extractFutureMarker(sentence),
            highlighted: true,
            grammarRole: 'Future Modal/Marker',
            explanation: 'How we express future intentions'
          },
          {
            id: 'future-action',
            time: 'FUTURE',
            label: 'Future Action',
            action: extractFutureAction(sentence),
            highlighted: true,
            grammarRole: 'Future Action',
            explanation: 'The action that will happen'
          }
        ];
      
      default:
        return [];
    }
  };

  // Helper functions to extract sentence parts
  const extractSimplePresentAction = (sentence: string): string => {
    const presentMatches = sentence.match(/\b(work|works|study|studies|live|lives|go|goes|come|comes|eat|eats|play|plays)\b/gi);
    return presentMatches?.[0] || 'action';
  };

  const extractFrequencyIndicator = (sentence: string): string => {
    const frequencyWords = ['always', 'usually', 'often', 'sometimes', 'never', 'every day', 'daily', 'weekly'];
    for (const word of frequencyWords) {
      if (sentence.toLowerCase().includes(word)) return word;
    }
    return 'regularly';
  };

  const extractTimeMarker = (sentence: string): string => {
    const timeWords = ['yesterday', 'last week', 'ago', 'in 2020', 'last month', 'last year'];
    for (const word of timeWords) {
      if (sentence.toLowerCase().includes(word)) return word;
    }
    return 'in the past';
  };

  const extractAdvancedTenseStart = (sentence: string): string => {
    return 'duration beginning';
  };

  const extractAdvancedTenseMarker = (sentence: string): string => {
    if (sentence.includes('will have been')) return 'will have been';
    if (sentence.includes('had been')) return 'had been';
    if (sentence.includes('have been')) return 'have been';
    return 'continuous action';
  };

  const extractFutureReference = (sentence: string): string => {
    const futureRefs = ['by next year', 'by then', 'by 2025', 'by the time'];
    for (const ref of futureRefs) {
      if (sentence.toLowerCase().includes(ref)) return ref;
    }
    return 'future point';
  };

  const extractPastAction = (sentence: string): string => {
    const perfectMatches = sentence.match(/(?:have|has)\s+(\w+ed|\w+en|\w+n)/gi);
    return perfectMatches?.[0]?.split(/\s+/).slice(1).join(' ') || 'completed action';
  };

  const extractPresentResult = (sentence: string): string => {
    return 'affects current situation';
  };

  const extractPastPerfectAction = (sentence: string): string => {
    const hadMatches = sentence.match(/had\s+(\w+ed|\w+en|\w+n)/gi);
    return hadMatches?.[0]?.split(/\s+/).slice(1).join(' ') || 'earlier action';
  };

  const extractSimplePastAction = (sentence: string): string => {
    const pastMatches = sentence.match(/\b(\w+ed|\w+)\b/gi);
    return pastMatches?.[0] || 'past action';
  };

  const extractFutureMarker = (sentence: string): string => {
    if (sentence.toLowerCase().includes('going to')) return 'going to';
    if (sentence.toLowerCase().includes('will')) return 'will';
    return 'future marker';
  };

  const extractFutureAction = (sentence: string): string => {
    return 'future action';
  };

  const timelineData = generateTimelineData();

  // Auto-play animation
  useEffect(() => {
    if (isPlaying && currentStep < timelineData.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        if (currentStep === timelineData.length - 1) {
          setIsPlaying(false);
          setShowConnections(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, timelineData.length]);

  const handlePlay = () => {
    if (currentStep >= timelineData.length) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setShowConnections(false);
    setHighlightedPoint(null);
  };

  const getTimelineColors = () => {
    switch (grammarType.toLowerCase()) {
      case 'simple_present':
        return {
          primary: 'bg-emerald-500',
          secondary: 'bg-emerald-200',
          accent: 'text-emerald-700',
          border: 'border-emerald-300'
        };
      case 'simple_past':
        return {
          primary: 'bg-amber-500',
          secondary: 'bg-amber-200',
          accent: 'text-amber-700',
          border: 'border-amber-300'
        };
      case 'advanced_tenses':
        return {
          primary: 'bg-indigo-500',
          secondary: 'bg-indigo-200',
          accent: 'text-indigo-700',
          border: 'border-indigo-300'
        };
      case 'present_perfect':
        return {
          primary: 'bg-purple-500',
          secondary: 'bg-purple-200',
          accent: 'text-purple-700',
          border: 'border-purple-300'
        };
      case 'past_perfect':
        return {
          primary: 'bg-blue-500',
          secondary: 'bg-blue-200', 
          accent: 'text-blue-700',
          border: 'border-blue-300'
        };
      case 'future_forms':
        return {
          primary: 'bg-green-500',
          secondary: 'bg-green-200',
          accent: 'text-green-700',
          border: 'border-green-300'
        };
      default:
        return {
          primary: 'bg-gray-500',
          secondary: 'bg-gray-200',
          accent: 'text-gray-700',
          border: 'border-gray-300'
        };
    }
  };

  const colors = getTimelineColors();

  const renderTimelinePoint = (point: TimelinePoint, index: number) => {
    const isActive = index <= currentStep;
    const isCurrent = index === currentStep;
    
    return (
      <motion.div
        key={point.id}
        className="flex flex-col items-center text-center relative"
        onMouseEnter={() => setHighlightedPoint(point.id)}
        onMouseLeave={() => setHighlightedPoint(null)}
        style={{ minWidth: '150px' }}
      >
        {/* Time Label */}
        <motion.div
          className={`text-sm font-bold mb-2 ${colors.accent}`}
          animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
        >
          {point.time}
        </motion.div>

        {/* Timeline Point */}
        <motion.div
          className={`w-16 h-16 rounded-full border-4 flex items-center justify-center relative ${
            isActive 
              ? `${colors.primary} border-white shadow-lg` 
              : `bg-gray-300 border-gray-400`
          }`}
          initial={{ scale: 0 }}
          animate={{ 
            scale: isActive ? 1 : 0.7,
            y: isCurrent ? [-5, 0, -5] : 0
          }}
          transition={{ 
            duration: 0.3,
            y: { duration: 1, repeat: isCurrent ? Infinity : 0 }
          }}
        >
          {point.highlighted && isActive && (
            <motion.div
              className={`absolute inset-0 rounded-full ${colors.primary}`}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 0.3, 0.7]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <Clock className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
        </motion.div>

        {/* Action Label */}
        <motion.div
          className={`mt-2 p-2 rounded-lg min-h-[60px] flex flex-col justify-center ${
            isActive ? `${colors.secondary} ${colors.border} border` : 'bg-gray-100'
          }`}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 10 }}
        >
          <div className={`font-bold text-sm ${colors.accent}`}>
            {point.label}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {point.action}
          </div>
        </motion.div>

        {/* Grammar Role Badge */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2"
            >
              <Badge variant="outline" className={`text-xs ${colors.accent} ${colors.border}`}>
                {point.grammarRole}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Explanation */}
        <AnimatePresence>
          {highlightedPoint === point.id && isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-full mt-4 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64"
            >
              <p className="text-sm text-gray-700">{point.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const getTenseTitle = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'simple_present':
        return 'Present Simple: Habits & Facts';
      case 'simple_past':
        return 'Past Simple: Completed Actions';
      case 'advanced_tenses':
        return 'Advanced Tenses: Complex Time';
      case 'present_perfect':
        return 'Present Perfect: Past to Present';
      case 'past_perfect':
        return 'Past Perfect: Earlier Past Action';
      case 'future_forms':
        return 'Future Forms: Plans & Predictions';
      default:
        return grammarType.replace('_', ' ').toUpperCase();
    }
  };

  const getTenseDescription = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'simple_present':
        return 'Simple Present isn\'t just about "now" - it\'s about habits, routines, and facts that don\'t change. Students often confuse this with Present Continuous ("I work" vs "I am working").';
      case 'simple_past':
        return 'Simple Past is your storytelling tense. It describes completed actions at specific times. The key word here is "finished" - the action is completely done.';
      case 'advanced_tenses':
        return 'These are the "professional English" tenses you hear in business meetings and academic writing. They show complex relationships between different times.';
      case 'present_perfect':
        return 'This is the "bridge" tense - it connects something that happened in the past to right now. Students often ask "Why not just use past tense?" Because the timing matters!';
      case 'past_perfect':
        return 'Think of this as the "flashback" tense. When telling a story about the past, this shows what happened BEFORE that past moment. It\'s all about sequence.';
      case 'future_forms':
        return 'English has many ways to talk about the future, each with a different feeling. "Will" vs "going to" vs "present continuous" - they\'re not the same!';
      default:
        return 'This tense shows specific time relationships in English.';
    }
  };

  const getTenseUsage = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'simple_present':
        return 'Use this for your daily routine ("I work from 9 to 5"), facts that never change ("Water boils at 100°C"), and things you always do ("I drink coffee every morning").';
      case 'simple_past':
        return 'Perfect for stories and completed events: "I graduated in 2020," "We met at a coffee shop," "The meeting ended at 3 PM." Always use when you mention a specific time.';
      case 'advanced_tenses':
        return 'Use these in formal writing, reports, and when you need to be very precise about timing: "By December, I will have been working here for 5 years."';
      case 'present_perfect':
        return 'Use when the past action affects NOW: "I have lost my keys" (still lost), "She has moved to Paris" (lives there now), "Have you finished?" (is it done now?).';
      case 'past_perfect':
        return 'Use to show sequence in stories: "When I arrived, the movie had already started" (first the movie started, then I arrived). Essential for clear storytelling.';
      case 'future_forms':
        return 'Will = predictions and promises ("It will rain tomorrow"). Going to = planned actions ("I\'m going to study tonight"). Present continuous = scheduled events ("I\'m flying to London tomorrow").';
      default:
        return 'This helps you express specific timing relationships in your communication.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`border-2 ${colors.border} bg-gradient-to-r from-blue-50 to-indigo-50`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            {getTenseTitle(grammarType)}
            <Badge variant="outline">{timelineData.length} time points</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">{getTenseDescription(grammarType)}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 When Do You Use This?</h4>
              <p className="text-blue-700 text-sm">{getTenseUsage(grammarType)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {currentStep >= timelineData.length ? 'Replay' : 'Play Timeline'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsPlaying(false)}
              disabled={!isPlaying}
            >
              <Pause className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <div className="flex-1" />
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Step: {Math.min(currentStep + 1, timelineData.length)}/{timelineData.length}</span>
              {isPlaying && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-600">Playing</span>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card>
        <CardContent className="p-8">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-20 left-0 right-0 flex items-center">
              <div className="flex-1 flex items-center">
                {timelineData.map((_, index) => (
                  <React.Fragment key={index}>
                    <motion.div
                      className={`h-1 flex-1 ${
                        index < currentStep ? colors.primary : 'bg-gray-300'
                      }`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: index < currentStep ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                    />
                    {index < timelineData.length - 1 && (
                      <motion.div
                        className={`w-4 h-4 rounded-full border-2 ${
                          index < currentStep 
                            ? `${colors.primary} border-white` 
                            : 'bg-gray-300 border-gray-400'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: index < currentStep ? 1 : 0.5 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Timeline Points */}
            <div className="flex justify-between items-start relative z-10">
              {timelineData.map((point, index) => renderTimelinePoint(point, index))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Analysis */}
      <AnimatePresence>
        {showConnections && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${colors.secondary} ${colors.border} border rounded-lg p-6`}
          >
            <h4 className={`text-xl font-bold ${colors.accent} mb-4 flex items-center gap-2`}>
              <Zap className="h-5 w-5" />
              Timeline Connection Analysis
            </h4>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">Sentence Structure</h5>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-lg">{sentence}</p>
                    <div className="flex gap-2 mt-3">
                      {grammarWords.map((word, index) => (
                        <Badge key={index} className={`${colors.primary} text-white`}>
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">Key Insight</h5>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-gray-700">
                      {grammarType === 'present_perfect' && 
                        "This tense connects a past action to the present moment, showing ongoing relevance."}
                      {grammarType === 'past_perfect' && 
                        "This tense shows the sequence of two past actions, clarifying which happened first."}
                      {grammarType === 'future_forms' && 
                        "This form expresses future actions with different levels of certainty and planning."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  <Rewind className="h-4 w-4 mr-2" />
                  Watch Again
                </Button>
                <Button 
                  onClick={onNext}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Continue Learning <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 