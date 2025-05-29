import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  Lightbulb, 
  Zap, 
  Eye, 
  Play, 
  Pause,
  RotateCw,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Users,
  Volume2,
  Search,
  Layers,
  Star,
  ChevronRight
} from 'lucide-react';

interface EnhancedPatternRecognitionProps {
  sentence: string;
  grammarType: string;
  grammarWords: string[];
  explanation: string;
  onNext: () => void;
}

interface PatternAnalysis {
  word: string;
  role: string;
  explanation: string;
  relatedWords: string[];
  alternativeForm?: string;
  commonMistakes?: string[];
  usage: 'basic' | 'intermediate' | 'advanced';
}

export function EnhancedPatternRecognition({ 
  sentence, 
  grammarType, 
  grammarWords, 
  explanation,
  onNext 
}: EnhancedPatternRecognitionProps) {
  const [analysisStep, setAnalysisStep] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [detectedPattern, setDetectedPattern] = useState<string | null>(null);
  const [patternConfidence, setPatternConfidence] = useState(0);

  // AI-powered pattern analysis
  const analyzePatterns = (words: string[], type: string): PatternAnalysis[] => {
    const analysisMap: Record<string, (words: string[]) => PatternAnalysis[]> = {
      'present_perfect': (words) => words.map(word => {
        if (['have', 'has'].includes(word.toLowerCase())) {
          return {
            word,
            role: 'Auxiliary Verb',
            explanation: 'Creates the perfect aspect - connects past to present',
            relatedWords: ['had', 'will have', 'having'],
            alternativeForm: word === 'have' ? 'has' : 'have',
            commonMistakes: ['Using "did" instead', 'Forgetting with third person'],
            usage: 'basic'
          };
        } else {
          return {
            word,
            role: 'Past Participle',
            explanation: 'Shows the completed action that affects now',
            relatedWords: ['past form', 'base form', '-ing form'],
            commonMistakes: ['Using simple past', 'Wrong participle form'],
            usage: 'intermediate'
          };
        }
      }),
      'past_perfect': (words) => words.map(word => {
        if (word.toLowerCase() === 'had') {
          return {
            word,
            role: 'Past Perfect Auxiliary',
            explanation: 'Shows earlier action before another past action',
            relatedWords: ['have', 'has', 'will have'],
            commonMistakes: ['Using "have" instead', 'Confusing order of events'],
            usage: 'intermediate'
          };
        } else {
          return {
            word,
            role: 'Past Participle',
            explanation: 'The action that happened first (earlier past)',
            relatedWords: ['simple past', 'present perfect'],
            commonMistakes: ['Using simple past', 'Wrong participle'],
            usage: 'intermediate'
          };
        }
      }),
      'future_forms': (words) => words.map(word => {
        if (['will', 'shall'].includes(word.toLowerCase())) {
          return {
            word,
            role: 'Future Modal',
            explanation: 'Shows prediction or decision made now',
            relatedWords: ['going to', 'present continuous'],
            commonMistakes: ['Adding "to"', 'Wrong future form choice'],
            usage: 'basic'
          };
        } else if (word.toLowerCase() === 'going') {
          return {
            word,
            role: 'Future Plan Marker',
            explanation: 'Shows planned or intended future action',
            relatedWords: ['will', 'present continuous'],
            commonMistakes: ['Forgetting "to"', 'Wrong tense choice'],
            usage: 'basic'
          };
        } else {
          return {
            word,
            role: 'Future Action',
            explanation: 'The action that will happen in the future',
            relatedWords: ['infinitive', 'base form'],
            usage: 'basic'
          };
        }
      }),
      'modal_verbs': (words) => words.map(word => {
        const modalMap: Record<string, string> = {
          'can': 'ability/possibility',
          'could': 'past ability/polite possibility', 
          'may': 'formal permission/possibility',
          'might': 'weak possibility',
          'will': 'future certainty/willingness',
          'would': 'hypothetical/polite request',
          'shall': 'formal future/offers',
          'should': 'advice/expectation',
          'must': 'strong necessity/certainty',
          'ought': 'moral obligation'
        };
        return {
          word,
          role: 'Modal Verb',
          explanation: `Expresses ${modalMap[word.toLowerCase()] || 'attitude/modality'}`,
          relatedWords: Object.keys(modalMap).filter(w => w !== word.toLowerCase()),
          commonMistakes: ['Adding "to"', 'Using with past tense', 'Wrong modal choice'],
          usage: ['can', 'will', 'should'].includes(word.toLowerCase()) ? 'basic' : 'intermediate'
        };
      }),
      'prepositions': (words) => words.map(word => {
        const prepMap: Record<string, string> = {
          'in': 'location inside/time periods',
          'on': 'surface contact/days/topics',
          'at': 'specific points/times/places',
          'by': 'method/agent/deadline',
          'for': 'purpose/duration/benefit',
          'with': 'accompaniment/instrument',
          'from': 'origin/source/starting point',
          'to': 'direction/destination/recipient',
          'of': 'belonging/part of whole',
          'about': 'topic/approximately',
          'through': 'movement via/method',
          'during': 'throughout time period',
          'before': 'earlier in time/order',
          'after': 'later in time/order',
          'under': 'below/less than/control',
          'over': 'above/more than/completion',
          'between': 'in the middle of two',
          'among': 'surrounded by many'
        };
        return {
          word,
          role: 'Preposition',
          explanation: `Shows ${prepMap[word.toLowerCase()] || 'relationship between words'}`,
          relatedWords: Object.keys(prepMap).filter(w => w !== word.toLowerCase()).slice(0, 5),
          commonMistakes: ['Direct translation errors', 'Wrong preposition choice', 'Missing preposition'],
          usage: ['in', 'on', 'at'].includes(word.toLowerCase()) ? 'basic' : 'intermediate'
        };
      }),
      'articles': (words) => words.map(word => ({
        word,
        role: 'Article',
        explanation: word === 'the' ? 'Definite - specific/known noun' : word === 'a' ? 'Indefinite - general/countable singular' : 'Indefinite - vowel sound start',
        relatedWords: ['a', 'an', 'the'].filter(w => w !== word.toLowerCase()),
        commonMistakes: word === 'the' ? ['Overusing with general concepts', 'Missing with specific items'] : ['a/an confusion', 'Using with uncountable nouns'],
        usage: 'basic'
      })),
      'phrasal_verbs': (words) => words.map((word, index) => {
        const particles = ['up', 'down', 'in', 'out', 'on', 'off', 'over', 'back', 'away', 'through', 'around', 'along', 'across'];
        if (particles.includes(word.toLowerCase())) {
          return {
            word,
            role: 'Particle',
            explanation: 'Changes the meaning of the verb - creates new meaning',
            relatedWords: particles.filter(p => p !== word.toLowerCase()),
            commonMistakes: ['Separating when inseparable', 'Wrong particle choice'],
            usage: 'intermediate'
          };
        } else {
          return {
            word,
            role: 'Main Verb',
            explanation: 'Base verb that combines with particle for new meaning',
            relatedWords: ['base form', 'past form', 'participle'],
            commonMistakes: ['Using wrong verb form', 'Missing particle'],
            usage: 'intermediate'
          };
        }
      }),
      'relative_clauses': (words) => words.map(word => {
        const relativeMap: Record<string, string> = {
          'who': 'refers to people (subject)',
          'whom': 'refers to people (object)',
          'whose': 'shows possession',
          'which': 'refers to things/animals',
          'that': 'refers to people/things (restrictive)',
          'where': 'refers to places',
          'when': 'refers to times',
          'why': 'refers to reasons'
        };
        return {
          word,
          role: 'Relative Pronoun',
          explanation: `Connects clauses - ${relativeMap[word.toLowerCase()] || 'links information'}`,
          relatedWords: Object.keys(relativeMap).filter(w => w !== word.toLowerCase()),
          commonMistakes: ['Who/whom confusion', 'That/which choice', 'Missing relative pronoun'],
          usage: word.toLowerCase() === 'that' ? 'basic' : 'intermediate'
        };
      }),
      'gerunds_infinitives': (words) => words.map(word => {
        if (word.toLowerCase() === 'to') {
          return {
            word,
            role: 'Infinitive Marker',
            explanation: 'Introduces infinitive form - shows purpose/intention',
            relatedWords: ['gerunds (-ing)', 'base verbs'],
            commonMistakes: ['Using gerund instead', 'Missing "to"'],
            usage: 'basic'
          };
        } else if (word.toLowerCase().endsWith('ing')) {
          return {
            word,
            role: 'Gerund',
            explanation: 'Verb acting as noun - names activities/concepts',
            relatedWords: ['infinitives', 'present participle'],
            commonMistakes: ['Using infinitive instead', 'Wrong gerund choice'],
            usage: 'intermediate'
          };
        } else {
          return {
            word,
            role: 'Infinitive Verb',
            explanation: 'Base form after "to" - shows action/purpose',
            relatedWords: ['gerund form', 'past form'],
            usage: 'basic'
          };
        }
      }),
      'conditionals': (words) => words.map(word => {
        const conditionalMap: Record<string, string> = {
          'if': 'introduces condition/hypothesis',
          'unless': 'negative condition (if not)',
          'would': 'result in unreal situations',
          'could': 'possible result/ability in condition',
          'might': 'uncertain result in condition',
          'should': 'expected result/advice condition',
          'had': 'past unreal condition (3rd conditional)',
          'will': 'real future result (1st conditional)'
        };
        return {
          word,
          role: word.toLowerCase() === 'if' || word.toLowerCase() === 'unless' ? 'Condition Marker' : 'Result Modal',
          explanation: conditionalMap[word.toLowerCase()] || 'part of conditional structure',
          relatedWords: Object.keys(conditionalMap).filter(w => w !== word.toLowerCase()).slice(0, 4),
          commonMistakes: ['Wrong conditional type', 'Mixing conditionals', 'Missing "if"'],
          usage: word.toLowerCase() === 'if' ? 'basic' : 'intermediate'
        };
      }),
      'passive_voice': (words) => words.map(word => {
        const beVerbs = ['am', 'is', 'are', 'was', 'were', 'being', 'been'];
        if (beVerbs.includes(word.toLowerCase())) {
          return {
            word,
            role: 'Passive Auxiliary',
            explanation: 'Forms passive voice - focuses on action/result',
            relatedWords: beVerbs.filter(v => v !== word.toLowerCase()),
            commonMistakes: ['Wrong "be" form', 'Missing auxiliary'],
            usage: 'intermediate'
          };
        } else {
          return {
            word,
            role: 'Past Participle',
            explanation: 'Shows action done to subject (passive meaning)',
            relatedWords: ['active form', 'base form'],
            commonMistakes: ['Using wrong participle', 'Active/passive confusion'],
            usage: 'intermediate'
          };
        }
      }),
      'comparatives': (words) => words.map(word => {
        const compMap: Record<string, string> = {
          'more': 'comparative marker (increases degree)',
          'most': 'superlative marker (highest degree)',
          'less': 'comparative marker (decreases degree)',
          'least': 'superlative marker (lowest degree)',
          'than': 'comparison connector',
          'the': 'superlative marker (definite)',
          'as': 'equality comparison marker'
        };
        
        if (word.toLowerCase().endsWith('er')) {
          return {
            word,
            role: 'Comparative Adjective',
            explanation: 'Shows higher degree when comparing two things',
            relatedWords: ['more + adjective', 'superlative form'],
            commonMistakes: ['Double comparison', 'Wrong comparative form'],
            usage: 'basic'
          };
        } else if (word.toLowerCase().endsWith('est')) {
          return {
            word,
            role: 'Superlative Adjective', 
            explanation: 'Shows highest degree among three or more',
            relatedWords: ['most + adjective', 'comparative form'],
            commonMistakes: ['Missing "the"', 'Wrong superlative form'],
            usage: 'basic'
          };
        } else {
          return {
            word,
            role: compMap[word.toLowerCase()] ? 'Comparison Word' : 'Adjective',
            explanation: compMap[word.toLowerCase()] || 'adjective being compared',
            relatedWords: Object.keys(compMap).filter(w => w !== word.toLowerCase()).slice(0, 3),
            commonMistakes: ['Wrong comparison structure', 'Missing comparison word'],
            usage: 'basic'
          };
        }
      })
    };

    return analysisMap[type]?.(words) || words.map(word => ({
      word,
      role: 'Grammar Element',
      explanation: 'Part of the grammatical pattern in this sentence',
      relatedWords: [],
      usage: 'basic' as const
    }));
  };

  const patternAnalysis = analyzePatterns(grammarWords, grammarType);

  // Start the AI analysis animation
  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setDetectedPattern(grammarType.toUpperCase());
      setPatternConfidence(85 + Math.random() * 10);
      setIsAnalyzing(false);
      setAnalysisStep(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [grammarType]);

  const handleWordSelect = (word: string) => {
    setSelectedWord(selectedWord === word ? null : word);
  };

  const renderSentenceWithInteractiveHighlights = () => {
    const words = sentence.split(/(\s+)/);
    return (
      <div className="text-xl leading-relaxed">
        {words.map((word, index) => {
          const cleanWord = word.toLowerCase().replace(/[.,;:!?'"()]/g, '');
          const isGrammarWord = grammarWords.some(gw => 
            gw.toLowerCase() === cleanWord || word.toLowerCase().includes(gw.toLowerCase())
          );
          
          if (isGrammarWord) {
            return (
              <motion.span
                key={index}
                className={`cursor-pointer transition-all duration-300 px-1 rounded-lg font-bold ${
                  selectedWord === cleanWord
                    ? 'bg-purple-200 text-purple-900 ring-2 ring-purple-400'
                    : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWordSelect(cleanWord)}
              >
                {word}
              </motion.span>
            );
          }
          return <span key={index}>{word}</span>;
        })}
      </div>
    );
  };

  const selectedAnalysis = patternAnalysis.find(p => 
    p.word.toLowerCase() === selectedWord || 
    selectedWord?.includes(p.word.toLowerCase())
  );

  const analysisSteps = [
    {
      icon: Search,
      title: "AI Pattern Detection",
      description: "Scanning sentence for grammatical patterns..."
    },
    {
      icon: Brain,
      title: "Pattern Analysis",
      description: "Click on highlighted words to explore their roles"
    },
    {
      icon: Layers,
      title: "Deep Understanding", 
      description: "See how each element contributes to meaning"
    },
    {
      icon: Star,
      title: "Mastery Check",
      description: "Ready to see the complete pattern?"
    }
  ];

  return (
    <div className="space-y-6">
      {/* AI Analysis Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            AI Grammar Analysis
            {isAnalyzing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCw className="h-5 w-5 text-blue-600" />
              </motion.div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Analysis Steps */}
            <div className="flex justify-between items-center">
              {analysisSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === analysisStep;
                const isComplete = index < analysisStep;
                
                return (
                  <div key={index} className="flex flex-col items-center text-center max-w-[120px]">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isComplete 
                          ? 'bg-green-500 text-white' 
                          : isActive 
                            ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                            : 'bg-gray-200 text-gray-500'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                    >
                      {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </motion.div>
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Detection Results */}
            <AnimatePresence>
              {detectedPattern && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg p-4 border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-700">Pattern Detected:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {detectedPattern}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Confidence:</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${patternConfidence}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-sm font-bold text-green-600">{Math.round(patternConfidence)}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Sentence Analysis */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-600" />
            Interactive Sentence Explorer
            <Badge variant="outline">{grammarWords.length} elements found</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Interactive Sentence */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  💡 Click on highlighted words to explore their grammatical roles
                </p>
                {renderSentenceWithInteractiveHighlights()}
              </div>
            </div>

            {/* Word Analysis Panel */}
            <AnimatePresence>
              {selectedAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        "{selectedAnalysis.word}" Analysis
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-semibold text-purple-600">Role:</span>
                          <Badge className="ml-2 bg-purple-100 text-purple-800">
                            {selectedAnalysis.role}
                          </Badge>
                        </div>
                        
                        <div>
                          <span className="text-sm font-semibold text-purple-600">Function:</span>
                          <p className="text-gray-700 mt-1">{selectedAnalysis.explanation}</p>
                        </div>

                        {selectedAnalysis.alternativeForm && (
                          <div>
                            <span className="text-sm font-semibold text-purple-600">Alternative:</span>
                            <Badge variant="outline" className="ml-2">
                              {selectedAnalysis.alternativeForm}
                            </Badge>
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-semibold text-purple-600">Level:</span>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${
                              selectedAnalysis.usage === 'basic' ? 'bg-green-50 text-green-700' :
                              selectedAnalysis.usage === 'intermediate' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-700'
                            }`}
                          >
                            {selectedAnalysis.usage}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-purple-700 mb-3">Related Words</h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedAnalysis.relatedWords.map((word, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                            {word}
                          </Badge>
                        ))}
                      </div>

                      {selectedAnalysis.commonMistakes && (
                        <div>
                          <h5 className="font-bold text-red-700 mb-2">⚠️ Common Mistakes</h5>
                          <ul className="text-sm text-red-600 space-y-1">
                            {selectedAnalysis.commonMistakes.map((mistake, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span>•</span>
                                <span>{mistake}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pattern Summary */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Pattern Insight
              </h4>
              <p className="text-yellow-700 text-lg mb-4">{explanation}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {grammarWords.map((word, index) => (
                    <motion.div
                      key={index}
                      className="bg-yellow-200 border border-yellow-400 rounded-lg px-3 py-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="font-bold text-yellow-900">{word}</span>
                    </motion.div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => setShowDeepAnalysis(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Deep Analysis <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Deep Analysis Modal */}
            <AnimatePresence>
              {showDeepAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6"
                >
                  <h4 className="text-xl font-bold text-indigo-800 mb-4">🔬 Deep Pattern Analysis</h4>
                  
                  <div className="grid gap-4">
                    {patternAnalysis.map((analysis, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg p-4 border border-indigo-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-bold text-indigo-700">{analysis.word}</h5>
                          <Badge className="bg-indigo-100 text-indigo-800">{analysis.role}</Badge>
                        </div>
                        <p className="text-gray-700 text-sm">{analysis.explanation}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setShowDeepAnalysis(false)}>
                      Close Analysis
                    </Button>
                    <Button 
                      onClick={() => {
                        setAnalysisStep(3);
                        onNext();
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Continue to Timeline <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 