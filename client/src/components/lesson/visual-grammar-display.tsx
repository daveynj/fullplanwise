import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowDown, 
  Clock, 
  MapPin, 
  Users, 
  Target,
  TrendingUp,
  Link,
  Eye,
  Zap,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface VisualGrammarDisplayProps {
  grammarType: string;
  title: string;
  description: string;
  examples: Array<{
    sentence: string;
    highlighted: string;
    explanation: string;
  }>;
  visualSteps: Array<{
    stepNumber: number;
    instruction: string;
    visualElements: any;
  }>;
}

export function VisualGrammarDisplay({ 
  grammarType, 
  title, 
  description, 
  examples, 
  visualSteps 
}: VisualGrammarDisplayProps) {

  // Extract grammar words from highlighted text
  const extractGrammarWords = (highlighted: string) => {
    return highlighted.split('**').filter((_, index) => index % 2 === 1);
  };

  const renderVisualByType = () => {
    const type = grammarType.toLowerCase().replace(/[_\s]+/g, '');
    
    switch (type) {
      case 'prepositions':
        return <PrepositionsVisual examples={examples} />;
      case 'modalverbs':
      case 'modal_verbs':
        return <ModalVerbsVisual examples={examples} />;
      case 'presentperfect':
      case 'present_perfect':
        return <PresentPerfectVisual examples={examples} />;
      case 'articles':
        return <ArticlesVisual examples={examples} />;
      case 'conditionals':
        return <ConditionalsVisual examples={examples} />;
      case 'relativeclauses':
      case 'relative_clauses':
        return <RelativeClausesVisual examples={examples} />;
      case 'passivevoice':
      case 'passive_voice':
        return <PassiveVoiceVisual examples={examples} />;
      case 'simplepresent':
      case 'simple_present':
        return <SimplePresentVisual examples={examples} />;
      case 'simplepast':
      case 'simple_past':
        return <SimplePastVisual examples={examples} />;
      default:
        return <DefaultGrammarVisual examples={examples} grammarType={grammarType} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-3xl font-bold text-purple-800 mb-2">{title}</h2>
        <p className="text-purple-600 text-lg">{description}</p>
      </div>

      {/* Visual Display */}
      {renderVisualByType()}
    </div>
  );
}

// Prepositions Visual Component
function PrepositionsVisual({ examples }: { examples: any[] }) {
  const prepositionCategories = {
    place: { 
      words: ['in', 'on', 'at', 'under', 'over', 'behind', 'beside', 'between'], 
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      icon: <MapPin className="h-4 w-4" />
    },
    time: { 
      words: ['before', 'after', 'during', 'since', 'until', 'while'], 
      color: 'bg-green-100 border-green-300 text-green-800',
      icon: <Clock className="h-4 w-4" />
    },
    movement: { 
      words: ['to', 'from', 'through', 'across', 'along', 'around'], 
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      icon: <ArrowRight className="h-4 w-4" />
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">How Prepositions Work</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3">
            <span className="font-bold text-blue-800">NOUN 1</span>
            <div className="text-sm text-blue-600">The book</div>
          </div>
          <ArrowRight className="h-8 w-8 text-purple-600" />
          <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-3">
            <span className="font-bold text-purple-800">PREPOSITION</span>
            <div className="text-sm text-purple-600">on</div>
          </div>
          <ArrowRight className="h-8 w-8 text-purple-600" />
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
            <span className="font-bold text-green-800">NOUN 2</span>
            <div className="text-sm text-green-600">the table</div>
          </div>
        </div>
        <div className="text-center mt-4 text-gray-600">
          Prepositions connect words to show relationships
        </div>
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(prepositionCategories).map(([category, data]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 rounded-lg p-4 ${data.color}`}
          >
            <div className="flex items-center gap-2 mb-3">
              {data.icon}
              <h4 className="font-bold capitalize">{category}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.words.map((word, index) => (
                <Badge key={index} variant="secondary" className="bg-white text-gray-800 text-lg px-3 py-1">
                  {word}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Modal Verbs Visual Component
function ModalVerbsVisual({ examples }: { examples: any[] }) {
  const modalLevels = [
    { modal: 'must', certainty: 100, color: 'bg-red-500', meaning: 'Very certain / Required' },
    { modal: 'will', certainty: 95, color: 'bg-red-400', meaning: 'Very likely' },
    { modal: 'should', certainty: 80, color: 'bg-orange-500', meaning: 'Recommended' },
    { modal: 'can', certainty: 70, color: 'bg-yellow-500', meaning: 'Possible / Able' },
    { modal: 'could', certainty: 50, color: 'bg-blue-500', meaning: 'Less certain' },
    { modal: 'might', certainty: 30, color: 'bg-purple-500', meaning: 'Small possibility' }
  ];

  return (
    <div className="space-y-6">
      {/* Certainty Scale */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Modal Verbs: Certainty Scale</h3>
        <div className="space-y-3">
          {modalLevels.map((item, index) => (
            <motion.div
              key={item.modal}
              initial={{ width: 0 }}
              animate={{ width: `${item.certainty}%` }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className={`${item.color} text-white rounded-lg p-3 flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg uppercase">{item.modal}</span>
                <span className="text-sm">{item.meaning}</span>
              </div>
              <span className="font-bold">{item.certainty}%</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Function Wheel */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Modal Functions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { function: 'Ability', modals: ['can', 'could'], icon: <Zap className="h-5 w-5" /> },
            { function: 'Permission', modals: ['can', 'may'], icon: <Eye className="h-5 w-5" /> },
            { function: 'Possibility', modals: ['might', 'could'], icon: <Activity className="h-5 w-5" /> },
            { function: 'Advice', modals: ['should', 'ought'], icon: <Target className="h-5 w-5" /> }
          ].map((item, index) => (
            <motion.div
              key={item.function}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 text-center"
            >
              <div className="flex justify-center mb-2 text-blue-600">
                {item.icon}
              </div>
              <h4 className="font-bold text-gray-800 mb-2">{item.function}</h4>
              <div className="space-y-1">
                {item.modals.map(modal => (
                  <Badge key={modal} variant="outline">{modal}</Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Present Perfect Visual Component
function PresentPerfectVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      {/* Timeline Bridge */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Present Perfect: Past ↔ Present Connection</h3>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
              <h4 className="font-bold text-gray-800">PAST</h4>
              <p className="text-sm text-gray-600">Action happened</p>
            </div>
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
              <h4 className="font-bold text-green-800">NOW</h4>
              <p className="text-sm text-green-600">Result/Effect continues</p>
            </div>
          </div>
          
          {/* Bridge */}
          <div className="relative bg-gradient-to-r from-gray-200 to-green-200 h-12 rounded-lg flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
              HAVE / HAS + PAST PARTICIPLE
            </div>
          </div>
        </div>
      </div>

      {/* Formula Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Present Perfect Formula</h3>
        <div className="flex items-center justify-center space-x-4 text-lg">
          <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
            <span className="font-bold text-blue-800">Subject</span>
            <div className="text-sm text-blue-600">I, You, We, They, He, She, It</div>
          </div>
          <span className="text-2xl font-bold text-blue-600">+</span>
          <div className="bg-white border-2 border-green-300 rounded-lg p-3">
            <span className="font-bold text-green-800">Have/Has</span>
            <div className="text-sm text-green-600">Auxiliary verb</div>
          </div>
          <span className="text-2xl font-bold text-blue-600">+</span>
          <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
            <span className="font-bold text-purple-800">Past Participle</span>
            <div className="text-sm text-purple-600">done, seen, eaten, etc.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Articles Visual Component
function ArticlesVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      {/* Decision Tree */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Article Decision Tree</h3>
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 inline-block">
              <span className="font-bold text-blue-800">Do you know which specific thing?</span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <ArrowDown className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
                <span className="font-bold text-green-800">YES → THE</span>
                <div className="text-sm text-green-600">Specific/Known</div>
              </div>
            </div>
            
            <div className="text-center">
              <ArrowDown className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3">
                <span className="font-bold text-orange-800">NO → A/AN</span>
                <div className="text-sm text-orange-600">General/Unknown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-bold text-red-800 mb-2 text-center">THE</h4>
          <p className="text-sm text-red-700 text-center mb-3">Specific items</p>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded text-sm">THE book on my desk</div>
            <div className="bg-white p-2 rounded text-sm">THE sun (only one)</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-800 mb-2 text-center">A</h4>
          <p className="text-sm text-blue-700 text-center mb-3">Consonant sounds</p>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded text-sm">A cat</div>
            <div className="bg-white p-2 rounded text-sm">A university</div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-bold text-purple-800 mb-2 text-center">AN</h4>
          <p className="text-sm text-purple-700 text-center mb-3">Vowel sounds</p>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded text-sm">AN apple</div>
            <div className="bg-white p-2 rounded text-sm">AN hour</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Conditionals Visual Component
function ConditionalsVisual({ examples }: { examples: any[] }) {
  const conditionalTypes = [
    { 
      type: 'Zero', 
      structure: 'If + present, present', 
      meaning: 'General truths',
      example: 'If you heat water, it boils',
      color: 'bg-gray-100 border-gray-300 text-gray-800'
    },
    { 
      type: 'First', 
      structure: 'If + present, will + base', 
      meaning: 'Real future possibility',
      example: 'If it rains, I will stay home',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    { 
      type: 'Second', 
      structure: 'If + past, would + base', 
      meaning: 'Unreal present/future',
      example: 'If I won the lottery, I would travel',
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    { 
      type: 'Third', 
      structure: 'If + past perfect, would have + past participle', 
      meaning: 'Unreal past',
      example: 'If I had studied, I would have passed',
      color: 'bg-purple-100 border-purple-300 text-purple-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Conditional Types */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">Types of Conditionals</h3>
        {conditionalTypes.map((conditional, index) => (
          <motion.div
            key={conditional.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-2 rounded-lg p-4 ${conditional.color}`}
          >
            <div className="grid md:grid-cols-4 gap-4 items-center">
              <div className="text-center">
                <h4 className="font-bold text-lg">{conditional.type}</h4>
              </div>
              <div className="font-mono text-sm">
                {conditional.structure}
              </div>
              <div className="text-sm">
                {conditional.meaning}
              </div>
              <div className="bg-white p-2 rounded text-sm italic">
                "{conditional.example}"
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* If-Then Flow */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Conditional Flow</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4">
            <span className="font-bold text-orange-800">IF CONDITION</span>
            <div className="text-sm text-orange-600">Something happens</div>
          </div>
          <ArrowRight className="h-8 w-8 text-gray-500" />
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
            <span className="font-bold text-green-800">THEN RESULT</span>
            <div className="text-sm text-green-600">This follows</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add more visual components for other grammar types...
function RelativeClausesVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Relative Clauses: Connecting Ideas</h3>
        <div className="space-y-4">
          {[
            { pronoun: 'WHO', use: 'People (subject)', example: 'The teacher WHO teaches math', color: 'bg-blue-100' },
            { pronoun: 'WHICH', use: 'Things', example: 'The book WHICH I read', color: 'bg-green-100' },
            { pronoun: 'THAT', use: 'People or things', example: 'The car THAT I bought', color: 'bg-purple-100' },
            { pronoun: 'WHERE', use: 'Places', example: 'The school WHERE I study', color: 'bg-orange-100' }
          ].map((item, index) => (
            <div key={item.pronoun} className={`${item.color} border border-gray-300 rounded-lg p-4`}>
              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div className="font-bold text-lg text-center">{item.pronoun}</div>
                <div className="text-center">{item.use}</div>
                <div className="bg-white p-2 rounded text-sm italic text-center">{item.example}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PassiveVoiceVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Active vs Passive Voice</h3>
        <div className="space-y-6">
          {/* Active Voice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-800 mb-3">ACTIVE VOICE</h4>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
                <span className="font-bold text-blue-800">SUBJECT</span>
                <div className="text-sm text-blue-600">The chef</div>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-600" />
              <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
                <span className="font-bold text-blue-800">VERB</span>
                <div className="text-sm text-blue-600">cooks</div>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-600" />
              <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
                <span className="font-bold text-blue-800">OBJECT</span>
                <div className="text-sm text-blue-600">the meal</div>
              </div>
            </div>
          </div>

          {/* Transformation Arrow */}
          <div className="text-center">
            <ArrowDown className="h-8 w-8 text-purple-600 mx-auto" />
            <p className="text-purple-600 font-semibold">BECOMES</p>
          </div>

          {/* Passive Voice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-800 mb-3">PASSIVE VOICE</h4>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                <span className="font-bold text-green-800">OBJECT (now subject)</span>
                <div className="text-sm text-green-600">The meal</div>
              </div>
              <ArrowRight className="h-6 w-6 text-green-600" />
              <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                <span className="font-bold text-green-800">BE + PAST PARTICIPLE</span>
                <div className="text-sm text-green-600">is cooked</div>
              </div>
              <ArrowRight className="h-6 w-6 text-green-600" />
              <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                <span className="font-bold text-green-800">BY + AGENT</span>
                <div className="text-sm text-green-600">(by the chef)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimplePresentVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Simple Present Tense</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-bold text-green-800">WHEN TO USE:</h4>
            <div className="space-y-2">
              {[
                'Daily habits: "I drink coffee every morning"',
                'Facts: "The sun rises in the east"',
                'Scheduled events: "The train leaves at 8 AM"'
              ].map((use, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm">{use}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-blue-800">FORMATION:</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2">
                <p><strong>I/You/We/They:</strong> verb (base form)</p>
                <p><strong>He/She/It:</strong> verb + s/es</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimplePastVisual({ examples }: { examples: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-center mb-6">Simple Past Tense</h3>
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-bold text-purple-800 mb-3">REGULAR VERBS:</h4>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white border border-purple-300 rounded p-3">
                <span className="font-bold">BASE VERB</span>
                <div className="text-sm">walk, play, study</div>
              </div>
              <span className="text-2xl font-bold text-purple-600">+</span>
              <div className="bg-white border border-purple-300 rounded p-3">
                <span className="font-bold">-ED</span>
                <div className="text-sm">walked, played, studied</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-bold text-orange-800 mb-3">IRREGULAR VERBS:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                ['go', 'went'], ['see', 'saw'], ['do', 'did'],
                ['have', 'had'], ['get', 'got'], ['make', 'made']
              ].map(([base, past], index) => (
                <div key={index} className="bg-white border border-orange-300 rounded p-2 text-center">
                  <span className="font-bold">{base}</span> → <span className="font-bold text-orange-600">{past}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default fallback component
function DefaultGrammarVisual({ examples, grammarType }: { examples: any[], grammarType: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-center mb-6">{grammarType.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-lg mb-2" dangerouslySetInnerHTML={{ 
              __html: example.highlighted?.replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-200 font-bold px-1 rounded">$1</span>') 
            }} />
            <p className="text-sm text-gray-600">{example.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 