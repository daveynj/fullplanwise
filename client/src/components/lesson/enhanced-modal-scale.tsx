import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp,
  Target,
  Info,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface EnhancedModalScaleProps {
  grammarType: string;
  sentence: string;
  grammarWords: string[];
  onNext: () => void;
}

export function EnhancedModalScale({ 
  grammarType, 
  sentence, 
  grammarWords,
  onNext 
}: EnhancedModalScaleProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateScaleData = () => {
    if (grammarType.toLowerCase() === 'modal_verbs') {
      return {
        title: 'Modal Verbs: How Sure Are You?',
        subtitle: 'Choose the right modal based on your level of certainty',
        contextExplanation: 'Think about when you make plans with friends or give advice at work. Modal verbs help you show exactly how confident you are. Students often use "will" for everything, but native speakers use different modals to show uncertainty, politeness, and possibility.',
        levels: [
          { 
            value: 0, 
            label: 'Impossible/Forbidden', 
            modals: ['cannot', "can't", 'must not'], 
            color: 'bg-red-500', 
            example: "You can't park here (it's illegal)",
            realWorldUse: 'When something is definitely not allowed (traffic signs, workplace rules) or physically impossible ("You can\'t be in two places at once")',
            communicativeFunction: 'Setting clear boundaries and stating absolute facts'
          },
          { 
            value: 20, 
            label: 'Very Unlikely', 
            modals: ['might not', "probably won't"], 
            color: 'bg-red-400', 
            example: "It might not rain today (but pack an umbrella just in case)",
            realWorldUse: 'When you think something probably won\'t happen but want to stay polite or open to possibilities',
            communicativeFunction: 'Being cautious in predictions without sounding too negative'
          },
          { 
            value: 40, 
            label: 'Uncertain/Possible', 
            modals: ['might', 'could', 'may'], 
            color: 'bg-yellow-500', 
            example: "I might go to the party (I'm not sure yet - depends on work)",
            realWorldUse: 'When making plans you\'re not committed to, or when you don\'t want to promise something definite',
            communicativeFunction: 'Keeping your options open and avoiding firm commitments'
          },
          { 
            value: 60, 
            label: 'Probably/Should', 
            modals: ['should', 'ought to', 'probably will'], 
            color: 'bg-orange-500', 
            example: "You should pass the test (if you studied like you said you did)",
            realWorldUse: 'When giving advice based on logic, or when you expect something to happen based on evidence',
            communicativeFunction: 'Giving helpful advice or making reasonable predictions'
          },
          { 
            value: 80, 
            label: 'Very Likely', 
            modals: ['will probably', 'should definitely'], 
            color: 'bg-green-400', 
            example: "The meeting will probably start on time (the boss is always punctual)",
            realWorldUse: 'When you\'re quite confident based on patterns or evidence, but leaving a small room for doubt',
            communicativeFunction: 'Making strong predictions while staying realistic'
          },
          { 
            value: 100, 
            label: 'Certain/Must', 
            modals: ['will', 'must', 'have to'], 
            color: 'bg-green-600', 
            example: "The sun will rise tomorrow (100% certain - it always does)",
            realWorldUse: 'When stating facts, making promises, or when you\'re completely sure based on knowledge or schedules',
            communicativeFunction: 'Expressing absolute certainty or stating universal truths'
          }
        ]
      };
    } else if (grammarType.toLowerCase() === 'basic_modals') {
      return {
        title: 'Basic Modals: Can You Do It?',
        subtitle: 'Express your ability and permission clearly',
        contextExplanation: 'Whether you\'re in a job interview talking about your skills, or asking your boss for time off, these modals help you sound confident and polite. Many students confuse "can" (ability) with "may" (permission) - we\'ll clear that up!',
        levels: [
          { 
            value: 0, 
            label: 'Cannot/Not Allowed', 
            modals: ['cannot', "can't", "I'm not allowed to"], 
            color: 'bg-red-500', 
            example: "I can't speak Chinese (I never learned it)",
            realWorldUse: 'When you don\'t have the skill/ability, or when rules don\'t permit something ("I can\'t access that file - need admin permission")',
            communicativeFunction: 'Being honest about limitations or explaining restrictions'
          },
          { 
            value: 25, 
            label: 'Maybe Possible', 
            modals: ['might be able to', 'could possibly'], 
            color: 'bg-orange-400', 
            example: "I might be able to help you later (if I finish my current project)",
            realWorldUse: 'When your ability depends on other things happening first - common in workplace planning',
            communicativeFunction: 'Offering help while being realistic about constraints'
          },
          { 
            value: 50, 
            label: 'Probably Can', 
            modals: ['should be able to', 'can probably'], 
            color: 'bg-yellow-500', 
            example: "I should be able to come to the party (unless something urgent comes up)",
            realWorldUse: 'When you expect to be able to do something but want to leave room for unexpected changes',
            communicativeFunction: 'Making commitments while staying flexible'
          },
          { 
            value: 75, 
            label: 'Can Do It', 
            modals: ['can', 'am able to'], 
            color: 'bg-green-400', 
            example: "I can swim 50 meters (I do it every week at the pool)",
            realWorldUse: 'When stating clear abilities or skills, especially in resumes, interviews, or when offering help',
            communicativeFunction: 'Demonstrating competence and reliability'
          },
          { 
            value: 100, 
            label: 'Definitely Can', 
            modals: ['can certainly', 'can definitely'], 
            color: 'bg-green-600', 
            example: "I can definitely help you with math (I was a math tutor for 3 years)",
            realWorldUse: 'When you\'re completely confident in your ability, often backed by experience or expertise',
            communicativeFunction: 'Showing strong confidence and expertise'
          }
        ]
      };
    } else if (grammarType.toLowerCase() === 'comparative') {
      return {
        title: 'Comparisons: How Different Are They?',
        subtitle: 'Show the degree of difference between things',
        contextExplanation: 'Comparatives help you describe differences. Choose the right form based on how big the difference is and what you want to emphasize.',
        levels: [
          { 
            value: 0, 
            label: 'Same/Equal', 
            modals: ['as...as', 'the same as'], 
            color: 'bg-blue-500', 
            example: "This book is as interesting as that one",
            realWorldUse: 'When two things are exactly the same in some way',
            communicativeFunction: 'Showing equality or similarity'
          },
          { 
            value: 25, 
            label: 'Slightly Different', 
            modals: ['a bit', 'slightly', 'a little'], 
            color: 'bg-blue-400', 
            example: "This coffee is slightly better than yesterday's",
            realWorldUse: 'When there\'s a small, noticeable difference',
            communicativeFunction: 'Expressing mild preference or difference'
          },
          { 
            value: 50, 
            label: 'Clearly Different', 
            modals: ['-er', 'more'], 
            color: 'bg-purple-500', 
            example: "This movie is more exciting than the last one",
            realWorldUse: 'When there\'s an obvious difference you want to highlight',
            communicativeFunction: 'Making clear comparisons'
          },
          { 
            value: 75, 
            label: 'Much Different', 
            modals: ['much', 'far', 'way'], 
            color: 'bg-purple-600', 
            example: "This test is much harder than I expected",
            realWorldUse: 'When you want to emphasize a big difference',
            communicativeFunction: 'Emphasizing significant differences'
          },
          { 
            value: 100, 
            label: 'The Most/Extreme', 
            modals: ['-est', 'most', 'the best/worst'], 
            color: 'bg-purple-800', 
            example: "This is the most beautiful sunset I've ever seen",
            realWorldUse: 'When comparing three or more things, or showing extremes',
            communicativeFunction: 'Expressing superlatives and extremes'
          }
        ]
      };
    }
    return null;
  };

  const scaleData = generateScaleData();
  if (!scaleData) return null;

  // Find which level contains our grammar words
  const currentLevel = scaleData.levels.find(level => 
    grammarWords.some(word => 
      level.modals.some(modal => 
        modal.toLowerCase().includes(word.toLowerCase()) || 
        word.toLowerCase().includes(modal.toLowerCase())
      )
    )
  );

  const handleLevelClick = (index: number) => {
    setSelectedLevel(selectedLevel === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            {scaleData.title}
            <Badge variant="outline">{scaleData.levels.length} levels</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-2">{scaleData.subtitle}</p>
          {scaleData.contextExplanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Why This Matters</h4>
              <p className="text-blue-700 text-sm">{scaleData.contextExplanation}</p>
            </div>
          )}
          
          {/* Current Sentence */}
          <div className="bg-white rounded-lg p-4 border mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Your sentence:</h4>
            <p className="text-lg">{sentence}</p>
            <div className="flex gap-2 mt-2">
              {grammarWords.map((word, index) => (
                <Badge key={index} className="bg-blue-500 text-white">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Scale */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Scale Bar */}
            <div className="relative">
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 via-orange-500 via-green-400 to-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                />
              </div>
              
              {/* Scale markers */}
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Current Level Indicator */}
            {currentLevel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${currentLevel.color} text-white rounded-lg p-4 text-center`}
              >
                <h3 className="text-xl font-bold mb-2">Your Level: {currentLevel.label}</h3>
                <p className="text-lg">{currentLevel.example}</p>
              </motion.div>
            )}

            {/* Level Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {scaleData.levels.map((level, index) => {
                const isActive = currentLevel?.value === level.value;
                const isSelected = selectedLevel === index;
                
                return (
                  <motion.button
                    key={index}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isActive 
                        ? `${level.color} text-white border-white shadow-lg scale-105` 
                        : isSelected
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => handleLevelClick(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-bold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {level.label}
                      </h4>
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {level.value}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {level.modals.map((modal, modalIndex) => (
                          <span 
                            key={modalIndex}
                            className={`text-xs px-2 py-1 rounded ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {modal}
                          </span>
                        ))}
                      </div>
                      
                      <p className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                        {level.example}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Level Details */}
            <AnimatePresence>
              {selectedLevel !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6"
                >
                  <h4 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {scaleData.levels[selectedLevel].label} Level
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-indigo-700 mb-2">When to Use:</h5>
                      <p className="text-gray-700 text-sm mb-3">
                        {scaleData.levels[selectedLevel].realWorldUse || getModalUsage(scaleData.levels[selectedLevel].label)}
                      </p>
                      
                      <h5 className="font-semibold text-indigo-700 mb-2">Communication Purpose:</h5>
                      <p className="text-gray-700 text-sm">
                        {scaleData.levels[selectedLevel].communicativeFunction || 'Expressing specific meaning'}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-indigo-700 mb-2">More Examples:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {getMoreExamples(scaleData.levels[selectedLevel], grammarType).map((example, i) => (
                          <li key={i}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Key Insight
        </h4>
        <p className="text-yellow-700 text-lg mb-4">
          {(grammarType === 'modal_verbs' || grammarType === 'basic_modals')
            ? "Don't just use 'will' for everything! Native speakers constantly adjust their certainty level. Listen for this in movies and conversations - you'll hear 'might,' 'could,' 'should' way more than you think."
            : "Stop saying 'more good' or 'more easy'! English has specific rules for comparatives. Short words (1-2 syllables) usually add '-er,' while longer words use 'more.' But there are exceptions - 'good' becomes 'better,' not 'gooder'!"
          }
        </p>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? 'Hide' : 'Show'} Rules
          </Button>
          <Button 
            onClick={onNext}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Continue Learning <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Grammar Rules */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h4 className="text-lg font-bold text-gray-800 mb-4">📚 Grammar Rules</h4>
            
            {(grammarType === 'modal_verbs' || grammarType === 'basic_modals') ? (
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <strong>Certainty:</strong> will, must, can't (high certainty) → might, could (low certainty)
                </div>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                  <strong>Ability:</strong> can (present), could (past), will be able to (future)
                </div>
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <strong>Permission:</strong> can, may (informal) → could, might (polite)
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <strong>Equal:</strong> as + adjective + as (as tall as me)
                </div>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                  <strong>Comparative:</strong> adjective + er (taller) or more + adjective (more beautiful)
                </div>
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <strong>Superlative:</strong> the + adjective + est (tallest) or the most + adjective (most beautiful)
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper functions
function getModalUsage(level: string): string {
  const usages = {
    'Impossible': 'Use when something definitely cannot happen',
    'Very Unlikely': 'Use when something probably won\'t happen',
    'Uncertain': 'Use when you are not sure if something will happen',
    'Probable': 'Use when something is likely to happen',
    'Very Likely': 'Use when something almost certainly will happen',
    'Certain': 'Use when something definitely will happen'
  };
  return usages[level as keyof typeof usages] || '';
}

function getComparativeUsage(level: string): string {
  const usages = {
    'Equal': 'Use when two things are the same',
    'Slightly More': 'Use when there is a small difference',
    'More': 'Use when there is a clear difference',
    'Much More': 'Use when there is a big difference',
    'Most/Extreme': 'Use when comparing three or more things'
  };
  return usages[level as keyof typeof usages] || '';
}

function getMoreExamples(level: any, grammarType: string): string[] {
  if (grammarType === 'modal_verbs') {
    const examples = {
      'Impossible': ["I can't speak Chinese", "That cannot be true"],
      'Very Unlikely': ["It might not work", "He might not come"],
      'Uncertain': ["I might be late", "It could rain"],
      'Probable': ["You should pass the test", "It ought to be ready"],
      'Very Likely': ["She will probably agree", "It will likely succeed"],
      'Certain': ["The meeting will start at 9", "I must finish this today"]
    };
    return examples[level.label as keyof typeof examples] || [];
  } else {
    const examples = {
      'Equal': ["as smart as her", "as fast as lightning"],
      'Slightly More': ["a bit taller", "slightly better"],
      'More': ["more expensive", "faster than"],
      'Much More': ["much bigger", "far more interesting"],
      'Most/Extreme': ["the fastest car", "the most beautiful"]
    };
    return examples[level.label as keyof typeof examples] || [];
  }
} 