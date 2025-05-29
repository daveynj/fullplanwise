import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedModalScale } from './enhanced-modal-scale';
import { EnhancedTimelineConnection } from './enhanced-timeline-connection';
import { EnhancedDecisionTree } from './enhanced-decision-tree';
import { EnhancedTransformation } from './enhanced-transformation';
import { BookOpen, Target, Lightbulb, CheckCircle } from 'lucide-react';

interface ShowcaseExample {
  grammarType: string;
  component: 'scale' | 'timeline' | 'tree' | 'transformation';
  sentence: string;
  grammarWords: string[];
  explanation: string;
  learningFocus: string;
  realWorldUse: string;
}

const showcaseExamples: ShowcaseExample[] = [
  // SCALE COMPONENTS (6 types)
  {
    grammarType: 'modal_verbs',
    component: 'scale',
    sentence: 'I might go to the party tonight, but I\'m not sure yet.',
    grammarWords: ['might'],
    explanation: 'Modal verbs express different levels of certainty',
    learningFocus: 'Understanding how to express uncertainty politely',
    realWorldUse: 'Making plans when you\'re not completely sure'
  },
  {
    grammarType: 'basic_modals',
    component: 'scale',
    sentence: 'I can speak three languages fluently.',
    grammarWords: ['can'],
    explanation: 'Basic modals express ability and permission',
    learningFocus: 'Expressing what you\'re able to do or allowed to do',
    realWorldUse: 'Talking about skills and capabilities in job interviews'
  },
  {
    grammarType: 'comparative',
    component: 'scale',
    sentence: 'This coffee is much better than the one we had yesterday.',
    grammarWords: ['much better than'],
    explanation: 'Comparatives show degrees of difference between things',
    learningFocus: 'Expressing how different things are from each other',
    realWorldUse: 'Comparing products, experiences, or options when making decisions'
  },

  // TIMELINE COMPONENTS (6 types)
  {
    grammarType: 'simple_present',
    component: 'timeline',
    sentence: 'I work from home every Tuesday and Thursday.',
    grammarWords: ['work'],
    explanation: 'Simple present describes habits and routines',
    learningFocus: 'Talking about regular activities and schedules',
    realWorldUse: 'Explaining your work schedule or daily routine'
  },
  {
    grammarType: 'simple_past',
    component: 'timeline',
    sentence: 'I graduated from university in 2019.',
    grammarWords: ['graduated'],
    explanation: 'Simple past describes completed actions at specific times',
    learningFocus: 'Telling stories about finished events',
    realWorldUse: 'Sharing your background and past experiences'
  },
  {
    grammarType: 'present_perfect',
    component: 'timeline',
    sentence: 'I have lived in this city for five years.',
    grammarWords: ['have lived'],
    explanation: 'Present perfect connects past actions to present relevance',
    learningFocus: 'Showing that past actions still matter now',
    realWorldUse: 'Talking about experiences that affect your current situation'
  },
  {
    grammarType: 'past_perfect',
    component: 'timeline',
    sentence: 'By the time I arrived, the meeting had already started.',
    grammarWords: ['had started'],
    explanation: 'Past perfect shows which of two past actions happened first',
    learningFocus: 'Clarifying the sequence of past events',
    realWorldUse: 'Explaining what happened before another past event'
  },
  {
    grammarType: 'future_forms',
    component: 'timeline',
    sentence: 'I\'m going to start my new job next Monday.',
    grammarWords: ['going to start'],
    explanation: 'Future forms express planned actions and predictions',
    learningFocus: 'Talking about future plans with different levels of certainty',
    realWorldUse: 'Making arrangements and sharing future plans'
  },
  {
    grammarType: 'advanced_tenses',
    component: 'timeline',
    sentence: 'By next year, I will have been working here for ten years.',
    grammarWords: ['will have been working'],
    explanation: 'Advanced tenses show complex time relationships',
    learningFocus: 'Expressing duration up to a future point',
    realWorldUse: 'Talking about achievements and milestones in formal contexts'
  },

  // DECISION TREE COMPONENTS (4 types)
  {
    grammarType: 'articles',
    component: 'tree',
    sentence: 'I need a book about the history of England.',
    grammarWords: ['a', 'the'],
    explanation: 'Articles specify whether nouns are general or specific',
    learningFocus: 'Choosing the right article based on shared knowledge',
    realWorldUse: 'Making it clear what you\'re referring to'
  },
  {
    grammarType: 'conditionals_basic',
    component: 'tree',
    sentence: 'If it rains tomorrow, I will stay home.',
    grammarWords: ['If', 'will'],
    explanation: 'Basic conditionals express likely future scenarios',
    learningFocus: 'Making plans that depend on other events',
    realWorldUse: 'Discussing possibilities and making contingent plans'
  },
  {
    grammarType: 'conditionals_advanced',
    component: 'tree',
    sentence: 'If I had studied harder, I would have passed the exam.',
    grammarWords: ['had studied', 'would have passed'],
    explanation: 'Advanced conditionals discuss unreal past situations',
    learningFocus: 'Expressing regret and imaginary past scenarios',
    realWorldUse: 'Reflecting on past decisions and their consequences'
  },
  {
    grammarType: 'relative_clauses',
    component: 'tree',
    sentence: 'The teacher who explained this concept is very experienced.',
    grammarWords: ['who'],
    explanation: 'Relative clauses add extra information about people and things',
    learningFocus: 'Combining sentences to avoid repetition',
    realWorldUse: 'Providing additional details without starting new sentences'
  },

  // TRANSFORMATION COMPONENTS (3 types)
  {
    grammarType: 'passive_voice',
    component: 'transformation',
    sentence: 'The new bridge was built by the city government.',
    grammarWords: ['was built'],
    explanation: 'Passive voice shifts focus from who does to what happens',
    learningFocus: 'Emphasizing the action or result rather than the actor',
    realWorldUse: 'Formal writing and when the doer is unknown or unimportant'
  },
  {
    grammarType: 'reported_speech',
    component: 'transformation',
    sentence: 'She said that she would arrive at 3 PM.',
    grammarWords: ['said that', 'would arrive'],
    explanation: 'Reported speech retells what someone said without quotes',
    learningFocus: 'Sharing conversations and information indirectly',
    realWorldUse: 'Summarizing meetings, conversations, and instructions'
  },
  {
    grammarType: 'subjunctive',
    component: 'transformation',
    sentence: 'I suggest that he study harder for the next exam.',
    grammarWords: ['suggest that', 'study'],
    explanation: 'Subjunctive expresses suggestions and recommendations',
    learningFocus: 'Making formal suggestions and expressing necessity',
    realWorldUse: 'Professional recommendations and formal advice'
  }
];

export function GrammarComponentShowcase() {
  const [selectedExample, setSelectedExample] = useState<ShowcaseExample | null>(null);
  const [showingComponent, setShowingComponent] = useState(false);

  const renderSelectedComponent = () => {
    if (!selectedExample) return null;

    const commonProps = {
      sentence: selectedExample.sentence,
      grammarWords: selectedExample.grammarWords,
      onNext: () => setShowingComponent(false)
    };

    switch (selectedExample.component) {
      case 'scale':
        return (
          <EnhancedModalScale
            grammarType={selectedExample.grammarType}
            {...commonProps}
          />
        );
      case 'timeline':
        return (
          <EnhancedTimelineConnection
            grammarType={selectedExample.grammarType}
            {...commonProps}
          />
        );
      case 'tree':
        return (
          <EnhancedDecisionTree
            grammarType={selectedExample.grammarType}
            {...commonProps}
          />
        );
      case 'transformation':
        return (
          <EnhancedTransformation
            grammarType={selectedExample.grammarType}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  if (showingComponent && selectedExample) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              Educational Focus: {selectedExample.learningFocus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Real-World Application
                </h4>
                <p className="text-gray-600 text-sm">{selectedExample.realWorldUse}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  Grammar Focus
                </h4>
                <p className="text-gray-600 text-sm">{selectedExample.explanation}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowingComponent(false)}
              className="mt-4"
            >
              ← Back to Examples
            </Button>
          </CardContent>
        </Card>
        
        {renderSelectedComponent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Enhanced Grammar Components Showcase
            <Badge variant="outline">Educational Focus</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Our grammar components now prioritize <strong>practical learning</strong> over visual complexity. 
            Each component clearly explains <em>when</em> and <em>why</em> to use grammar structures, 
            not just how they work.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">🎯 Educational Improvements</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• <strong>Clear Context</strong>: Every component explains real-world usage</li>
                <li>• <strong>Communication Purpose</strong>: Understanding what each choice achieves</li>
                <li>• <strong>Practical Examples</strong>: Authentic scenarios students actually encounter</li>
                <li>• <strong>When & Why</strong>: Focus on decision-making, not just rules</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Complete Coverage</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p>• <strong>15 Grammar Types</strong> across all CEFR levels</p>
                <p>• <strong>4 Component Types</strong> with different pedagogical approaches</p>
                <p>• <strong>Scale:</strong> 3 types (certainty & degrees)</p>
                <p>• <strong>Timeline:</strong> 6 types (time relationships)</p>
                <p>• <strong>Tree:</strong> 4 types (logical decisions)</p>
                <p>• <strong>Transform:</strong> 3 types (structure changes)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* Organize examples by component type */}
        {['scale', 'timeline', 'tree', 'transformation'].map(componentType => {
          const componentExamples = showcaseExamples.filter(example => example.component === componentType);
          const componentNames = {
            scale: 'Scale Components (Levels & Degrees)',
            timeline: 'Timeline Components (Time Relationships)', 
            tree: 'Decision Tree Components (Logical Choices)',
            transformation: 'Transformation Components (Structure Changes)'
          };
          
          return (
            <div key={componentType} className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {componentNames[componentType as keyof typeof componentNames]}
                </h3>
                <p className="text-gray-600 text-sm">
                  {componentType === 'scale' && 'Express degrees of certainty, ability, and comparison'}
                  {componentType === 'timeline' && 'Show when actions happen and their relationships over time'}
                  {componentType === 'tree' && 'Guide students through logical grammar decisions'}
                  {componentType === 'transformation' && 'Transform sentences while maintaining meaning'}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {componentExamples.map((example, index) => (
                  <Card 
                    key={`${componentType}-${index}`}
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedExample === example ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedExample(example);
                      setShowingComponent(true);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Badge className={`text-white text-xs ${
                          componentType === 'scale' ? 'bg-purple-500' :
                          componentType === 'timeline' ? 'bg-blue-500' :
                          componentType === 'tree' ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {componentType.toUpperCase()}
                        </Badge>
                        {example.grammarType.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm mb-2">{example.sentence}</p>
                          <div className="flex gap-1 flex-wrap">
                            {example.grammarWords.map((word, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{word}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-semibold text-xs text-gray-700">Learning Focus:</h5>
                            <p className="text-xs text-gray-600">{example.learningFocus}</p>
                          </div>
                          <div>
                            <h5 className="font-semibold text-xs text-gray-700">Real-World Use:</h5>
                            <p className="text-xs text-gray-600">{example.realWorldUse}</p>
                          </div>
                        </div>
                        
                        <Button className="w-full text-xs py-2">
                          Try Interactive Component →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">📚 Key Educational Principles</h4>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
              <h5 className="font-bold text-blue-800 mb-2">Context First</h5>
              <p className="text-blue-700 text-sm">
                Every component starts by explaining when and why you'd use this grammar in real communication.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
              <h5 className="font-bold text-green-800 mb-2">Practical Examples</h5>
              <p className="text-green-700 text-sm">
                Examples come from authentic situations students actually encounter, not artificial textbook sentences.
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-400">
              <h5 className="font-bold text-orange-800 mb-2">Decision Logic</h5>
              <p className="text-orange-700 text-sm">
                Focus on helping students understand how to choose the right grammar form for their specific situation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 