import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  ChevronRight
} from 'lucide-react';

interface DecisionNode {
  id: string;
  question: string;
  options: {
    text: string;
    leads_to: string;
    explanation: string;
  }[];
  result?: {
    choice: string;
    explanation: string;
    examples: string[];
  };
}

interface EnhancedDecisionTreeProps {
  grammarType: string;
  sentence: string;
  grammarWords: string[];
  onNext: () => void;
}

export function EnhancedDecisionTree({ 
  grammarType, 
  sentence, 
  grammarWords,
  onNext 
}: EnhancedDecisionTreeProps) {
  const [currentNode, setCurrentNode] = useState('start');
  const [path, setPath] = useState<string[]>(['start']);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateDecisionTree = (): Record<string, DecisionNode> => {
    if (grammarType.toLowerCase().includes('article')) {
      return {
        start: {
          id: 'start',
          question: 'What type of noun are you talking about?',
          options: [
            {
              text: 'Something specific that both speaker and listener know',
              leads_to: 'definite',
              explanation: 'When both people know exactly what you mean'
            },
            {
              text: 'Something general or mentioned for the first time',
              leads_to: 'indefinite',
              explanation: 'When introducing something new or speaking generally'
            },
            {
              text: 'Abstract concepts or general categories',
              leads_to: 'no_article',
              explanation: 'When talking about things in general'
            }
          ]
        },
        definite: {
          id: 'definite',
          question: 'Is there only one of this thing, or is it clearly identified?',
          options: [
            {
              text: 'Yes, it\'s unique or clearly identified',
              leads_to: 'the_result',
              explanation: 'Use "the" for specific, known items'
            },
            {
              text: 'No, but we both know which one',
              leads_to: 'the_result',
              explanation: 'Use "the" when context makes it clear'
            }
          ]
        },
        indefinite: {
          id: 'indefinite',
          question: 'How does the word start?',
          options: [
            {
              text: 'Vowel sound (a, e, i, o, u)',
              leads_to: 'an_result',
              explanation: 'Use "an" before vowel sounds'
            },
            {
              text: 'Consonant sound',
              leads_to: 'a_result',
              explanation: 'Use "a" before consonant sounds'
            }
          ]
        },
        no_article: {
          id: 'no_article',
          question: 'Are you talking about something in general?',
          options: [
            {
              text: 'Yes, general concepts or categories',
              leads_to: 'zero_result',
              explanation: 'No article needed for general statements'
            }
          ]
        },
        the_result: {
          id: 'the_result',
          question: '',
          options: [],
          result: {
            choice: 'THE',
            explanation: 'Use "the" for specific, known, or unique things',
            examples: ['the sun', 'the book we read', 'the best student']
          }
        },
        an_result: {
          id: 'an_result',
          question: '',
          options: [],
          result: {
            choice: 'AN',
            explanation: 'Use "an" before vowel sounds',
            examples: ['an apple', 'an hour', 'an honest person']
          }
        },
        a_result: {
          id: 'a_result',
          question: '',
          options: [],
          result: {
            choice: 'A',
            explanation: 'Use "a" before consonant sounds',
            examples: ['a book', 'a university', 'a one-way street']
          }
        },
        zero_result: {
          id: 'zero_result',
          question: '',
          options: [],
          result: {
            choice: 'NO ARTICLE',
            explanation: 'No article needed for general concepts',
            examples: ['music is beautiful', 'dogs are loyal', 'happiness matters']
          }
        }
      };
    } else if (grammarType.toLowerCase().includes('relative')) {
      return {
        start: {
          id: 'start',
          question: 'What are you adding information about?',
          options: [
            {
              text: 'People (persons)',
              leads_to: 'people',
              explanation: 'When the noun refers to human beings'
            },
            {
              text: 'Things or animals',
              leads_to: 'things',
              explanation: 'When the noun refers to objects, animals, or concepts'
            },
            {
              text: 'Places or times',
              leads_to: 'places_times',
              explanation: 'When referring to locations or time periods'
            }
          ]
        },
        people: {
          id: 'people',
          question: 'What role does the person play in the additional information?',
          options: [
            {
              text: 'The person does the action (subject)',
              leads_to: 'who_result',
              explanation: 'The person performs the verb in the relative clause'
            },
            {
              text: 'The action is done to the person (object)',
              leads_to: 'whom_result',
              explanation: 'The person receives the action (formal) or "who" (informal)'
            },
            {
              text: 'Something belongs to the person',
              leads_to: 'whose_result',
              explanation: 'Shows possession or relationship'
            }
          ]
        },
        things: {
          id: 'things',
          question: 'What role does the thing play in the additional information?',
          options: [
            {
              text: 'The thing does the action (subject)',
              leads_to: 'which_subject_result',
              explanation: 'The thing performs the verb in the relative clause'
            },
            {
              text: 'The action is done to the thing (object)',
              leads_to: 'which_object_result',
              explanation: 'The thing receives the action'
            },
            {
              text: 'Essential information (no commas)',
              leads_to: 'that_result',
              explanation: 'Information needed to identify which thing'
            }
          ]
        },
        places_times: {
          id: 'places_times',
          question: 'Are you talking about a place or time?',
          options: [
            {
              text: 'A place or location',
              leads_to: 'where_result',
              explanation: 'Use "where" for places and locations'
            },
            {
              text: 'A time or period',
              leads_to: 'when_result',
              explanation: 'Use "when" for times and periods'
            }
          ]
        },
        who_result: {
          id: 'who_result',
          question: '',
          options: [],
          result: {
            choice: 'WHO',
            explanation: 'Use "who" when the person does the action in the relative clause',
            examples: [
              'The student who studies hard will succeed',
              'People who exercise regularly are healthier',
              'The teacher who explained this is very good'
            ]
          }
        },
        whom_result: {
          id: 'whom_result',
          question: '',
          options: [],
          result: {
            choice: 'WHOM (formal) / WHO (informal)',
            explanation: 'Use "whom" in formal writing when the person receives the action',
            examples: [
              'The person whom I met yesterday (formal)',
              'The person who I met yesterday (informal)',
              'Students whom the teacher praised (formal)'
            ]
          }
        },
        whose_result: {
          id: 'whose_result',
          question: '',
          options: [],
          result: {
            choice: 'WHOSE',
            explanation: 'Use "whose" to show that something belongs to the person',
            examples: [
              'The student whose book is missing',
              'People whose houses were damaged',
              'The author whose novel won the prize'
            ]
          }
        },
        which_subject_result: {
          id: 'which_subject_result',
          question: '',
          options: [],
          result: {
            choice: 'WHICH',
            explanation: 'Use "which" when the thing does the action (usually with commas for extra info)',
            examples: [
              'The book, which was published last year, is popular',
              'My car, which is red, needs repair',
              'The computer which crashed contained important data'
            ]
          }
        },
        which_object_result: {
          id: 'which_object_result',
          question: '',
          options: [],
          result: {
            choice: 'WHICH',
            explanation: 'Use "which" when the action is done to the thing',
            examples: [
              'The book which I bought yesterday',
              'The movie which we watched was excellent',
              'The house which they built is beautiful'
            ]
          }
        },
        that_result: {
          id: 'that_result',
          question: '',
          options: [],
          result: {
            choice: 'THAT',
            explanation: 'Use "that" for essential information (no commas) - works for people or things',
            examples: [
              'The book that I need is on the shelf',
              'People that work hard usually succeed',
              'The car that broke down was old'
            ]
          }
        },
        where_result: {
          id: 'where_result',
          question: '',
          options: [],
          result: {
            choice: 'WHERE',
            explanation: 'Use "where" to give information about places and locations',
            examples: [
              'The school where I studied is nearby',
              'The city where he lives is beautiful',
              'This is the place where we first met'
            ]
          }
        },
        when_result: {
          id: 'when_result',
          question: '',
          options: [],
          result: {
            choice: 'WHEN',
            explanation: 'Use "when" to give information about times and periods',
            examples: [
              'The day when we met was special',
              'Summer is the time when people travel',
              'I remember the year when this happened'
            ]
          }
        }
      };
    } else if (grammarType.toLowerCase().includes('conditional')) {
      return {
        start: {
          id: 'start',
          question: 'What type of situation are you describing?',
          options: [
            {
              text: 'Real situations that happen regularly',
              leads_to: 'zero_conditional',
              explanation: 'Facts and general truths'
            },
            {
              text: 'Possible future situations',
              leads_to: 'first_conditional',
              explanation: 'Likely future scenarios'
            },
            {
              text: 'Unreal present/future situations',
              leads_to: 'second_conditional',
              explanation: 'Imaginary or unlikely scenarios'
            },
            {
              text: 'Unreal past situations',
              leads_to: 'third_conditional',
              explanation: 'Things that didn\'t happen in the past'
            }
          ]
        },
        zero_conditional: {
          id: 'zero_conditional',
          question: '',
          options: [],
          result: {
            choice: 'ZERO CONDITIONAL',
            explanation: 'If + present simple, present simple (for facts)',
            examples: ['If you heat water, it boils', 'If it rains, the ground gets wet']
          }
        },
        first_conditional: {
          id: 'first_conditional',
          question: '',
          options: [],
          result: {
            choice: 'FIRST CONDITIONAL',
            explanation: 'If + present simple, will + base verb (for likely futures)',
            examples: ['If it rains, I will stay home', 'If you study, you will pass']
          }
        },
        second_conditional: {
          id: 'second_conditional',
          question: '',
          options: [],
          result: {
            choice: 'SECOND CONDITIONAL',
            explanation: 'If + past simple, would + base verb (for unreal present)',
            examples: ['If I won the lottery, I would travel', 'If I were rich, I would help']
          }
        },
        third_conditional: {
          id: 'third_conditional',
          question: '',
          options: [],
          result: {
            choice: 'THIRD CONDITIONAL',
            explanation: 'If + past perfect, would have + past participle (for unreal past)',
            examples: ['If I had studied, I would have passed', 'If we had left earlier, we wouldn\'t have been late']
          }
        }
      };
    }
    return {};
  };

  const getTreeTitle = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'articles':
        return 'Articles: Choosing A, An, or The';
      case 'conditionals_basic':
        return 'Basic Conditionals: If-Then Logic';
      case 'conditionals_advanced':
        return 'Advanced Conditionals: Complex Situations';
      case 'relative_clauses':
        return 'Relative Clauses: Connecting Information';
      default:
        return `Decision Guide: ${grammarType.replace('_', ' ').toUpperCase()}`;
    }
  };

  const getTreeDescription = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'articles':
        return 'Articles are tiny words with big impact! Students often skip them or use the wrong one. The secret? Think about what your listener already knows. Are you talking about THE specific thing we both know, or just A general example?';
      case 'conditionals_basic':
        return 'Conditionals are "if-then" thinking made grammar. Students love using "will" in both parts, but that\'s wrong! The "if" part stays in present tense, even when talking about the future.';
      case 'conditionals_advanced':
        return 'These handle regret, impossible scenarios, and "what if" thinking. Master these and you\'ll sound fluent when discussing hypothetical situations or reflecting on past decisions.';
      case 'relative_clauses':
        return 'These are sentence-combining superpowers! Instead of saying "I met a man. The man was tall. The man spoke Spanish," you say "I met a man who was tall and spoke Spanish." Much smoother!';
      default:
        return 'Follow the decision tree to make the right grammar choice for your situation.';
    }
  };

  const getTreePurpose = (grammarType: string): string => {
    switch (grammarType.toLowerCase()) {
      case 'articles':
        return 'This stops you from saying "I need book" or using "the" for everything. Think like this: Can my listener picture exactly which thing I mean? If yes, use "the." If no, use "a/an."';
      case 'conditionals_basic':
        return 'This prevents the classic mistake: "If it will rain, I will stay home" (wrong!). The correct way: "If it rains, I will stay home." The "if" part uses present tense.';
      case 'conditionals_advanced':
        return 'This helps you express regret professionally: "If I had started earlier, I would have finished on time" sounds much better than "I should started before."';
      case 'relative_clauses':
        return 'This solves the who/whom confusion forever. Simple rule: If you can replace it with "he/she," use "who." If you need "him/her," use "whom" (formal) or "who" (informal).';
      default:
        return 'This decision tree guides you through the grammar choice step-by-step, helping you understand the logic behind each decision.';
    }
  };

  const decisionTree = generateDecisionTree();
  const currentDecision = decisionTree[currentNode];

  const handleChoice = (optionIndex: number) => {
    const option = currentDecision.options[optionIndex];
    const nextNode = option.leads_to;
    setCurrentNode(nextNode);
    setPath(prev => [...prev, nextNode]);
  };

  const handleReset = () => {
    setCurrentNode('start');
    setPath(['start']);
    setShowExplanation(false);
  };

  const isResult = currentDecision?.result !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-green-600" />
            {getTreeTitle(grammarType)}
            <Badge variant="outline">Interactive Guide</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">{getTreeDescription(grammarType)}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">🎯 How This Helps You</h4>
              <p className="text-green-700 text-sm">{getTreePurpose(grammarType)}</p>
            </div>
          </div>
          
          {/* Current Sentence Analysis */}
          <div className="bg-white rounded-lg p-4 border mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Your sentence to analyze:</h4>
            <p className="text-lg mb-2">{sentence}</p>
            <div className="flex gap-2">
              {grammarWords.map((word, index) => (
                <Badge key={index} className="bg-green-500 text-white">
                  {word}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Let's figure out the best choice step by step!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decision Path Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            {path.map((nodeId, index) => (
              <React.Fragment key={nodeId}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                    index === path.length - 1 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {nodeId === 'start' ? 'Start' : decisionTree[nodeId]?.result?.choice || 'Step ' + index}
                </motion.div>
                {index < path.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current Decision */}
          {!isResult ? (
            <motion.div
              key={currentNode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  {currentDecision.question}
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {currentDecision.options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleChoice(index)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-green-500 flex items-center justify-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-green-500 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{option.text}</p>
                        <p className="text-sm text-gray-600">{option.explanation}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Result Display */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <h3 className="text-2xl font-bold text-green-800">
                  Answer: {currentDecision.result?.choice}
                </h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-lg text-green-700 mb-4">
                  {currentDecision.result?.explanation}
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-green-800">Examples:</h4>
                  {currentDecision.result?.examples.map((example, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-3 rounded border text-gray-700"
                    >
                      "{example}"
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Current Sentence Analysis */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Your Sentence Analysis
        </h4>
        
        <div className="bg-white rounded-lg p-4 border mb-4">
          <p className="text-lg mb-3">{sentence}</p>
          <div className="flex gap-2">
            {grammarWords.map((word, index) => (
              <Badge key={index} variant="outline" className="bg-yellow-100 text-yellow-800">
                {word}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <GitBranch className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </Button>
            <Button 
              onClick={onNext}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Continue Learning <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6"
          >
            <h4 className="text-xl font-bold text-indigo-800 mb-4">🌳 Decision Tree Logic</h4>
            
            <div className="grid gap-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h5 className="font-bold text-indigo-700 mb-2">How Decision Trees Work</h5>
                <p className="text-gray-700 text-sm">
                  {grammarType === 'articles' 
                    ? "Each question helps narrow down which article to use. The decision depends on whether the noun is specific/general, countable/uncountable, and known/unknown to the listener."
                    : "Each question identifies the reality level of your situation. Real situations use different conditional types than imaginary ones."
                  }
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h5 className="font-bold text-indigo-700 mb-2">Quick Reference</h5>
                <div className="text-sm text-gray-700 space-y-1">
                  {grammarType === 'articles' ? (
                    <>
                      <p>• <strong>THE:</strong> specific, known, unique things</p>
                      <p>• <strong>A:</strong> general, singular, consonant sound</p>
                      <p>• <strong>AN:</strong> general, singular, vowel sound</p>
                      <p>• <strong>NO ARTICLE:</strong> general concepts, categories</p>
                    </>
                  ) : (
                    <>
                      <p>• <strong>Zero:</strong> Facts (if + present, present)</p>
                      <p>• <strong>First:</strong> Likely futures (if + present, will)</p>
                      <p>• <strong>Second:</strong> Unreal present (if + past, would)</p>
                      <p>• <strong>Third:</strong> Unreal past (if + past perfect, would have)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 