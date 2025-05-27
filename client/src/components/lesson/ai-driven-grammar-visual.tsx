import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowDown, 
  Clock, 
  MapPin, 
  Target,
  Eye,
  Zap,
  Activity,
  TrendingUp,
  RotateCw,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface AIDrivenGrammarVisualProps {
  grammarData: {
    grammarType: string;
    title: string;
    description: string;
    examples: Array<{
      sentence: string;
      highlighted: string;
      explanation: string;
    }>;
    visualLayout?: {
      recommendedType: string;
      primaryColor: string;
      components: Array<{
        type: string;
        title?: string;
        description?: string;
        keyPoints?: string[];
        structure?: string;
        components?: Array<{
          part: string;
          description: string;
          examples: string[];
        }>;
        categories?: Array<{
          name: string;
          description: string;
          words: string[];
          examples: string[];
        }>;
        examples?: Array<{
          sentence: string;
          breakdown: string;
          alternatives: string[];
        }>;
      }>;
    };
  };
}

export function AIDrivenGrammarVisual({ grammarData }: AIDrivenGrammarVisualProps) {
  const visualLayout = grammarData.visualLayout;
  
  if (!visualLayout) {
    return <FallbackVisual grammarData={grammarData} />;
  }

  // Map AI-specified colors to Tailwind classes
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, any> = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        accent: 'bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200', 
        text: 'text-green-800',
        accent: 'bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        accent: 'bg-purple-100'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        accent: 'bg-orange-100'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        accent: 'bg-red-100'
      },
      teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-800',
        accent: 'bg-teal-100'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const colors = getColorClasses(visualLayout.primaryColor);

  // Render based on AI-recommended visual type
  const renderVisualType = () => {
    switch (visualLayout.recommendedType) {
      case 'connection_flow':
        return <ConnectionFlowVisual components={visualLayout.components} colors={colors} />;
      case 'certainty_scale':
        return <CertaintyScaleVisual components={visualLayout.components} colors={colors} />;
      case 'timeline_bridge':
        return <TimelineBridgeVisual components={visualLayout.components} colors={colors} />;
      case 'decision_tree':
        return <DecisionTreeVisual components={visualLayout.components} colors={colors} />;
      case 'transformation_flow':
        return <TransformationFlowVisual components={visualLayout.components} colors={colors} />;
      case 'comparison_table':
        return <ComparisonTableVisual components={visualLayout.components} colors={colors} />;
      case 'process_steps':
        return <ProcessStepsVisual components={visualLayout.components} colors={colors} />;
      default:
        return <GenericVisual components={visualLayout.components} colors={colors} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI-Generated Header */}
      <div className={`text-center ${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h2 className={`text-3xl font-bold ${colors.text} mb-2`}>{grammarData.title}</h2>
        <p className="text-gray-600 text-lg">{grammarData.description}</p>
      </div>

      {/* AI-Driven Visual Content */}
      {renderVisualType()}
    </div>
  );
}

// Connection Flow Visual (for prepositions, etc.)
function ConnectionFlowVisual({ components, colors }: any) {
  const breakdown = components.find((c: any) => c.type === 'visual_breakdown');
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">How This Grammar Works</h3>
        {breakdown?.components && (
          <div className="flex items-center justify-center space-x-4 flex-wrap">
            {breakdown.components.map((part: any, index: number) => (
              <React.Fragment key={part.part}>
                {index > 0 && <ArrowRight className="h-8 w-8 text-gray-500" />}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`${colors.accent} border-2 ${colors.border} rounded-lg p-3 text-center`}
                >
                  <span className={`font-bold ${colors.text}`}>{part.part.toUpperCase()}</span>
                  <div className="text-sm text-gray-600">{part.examples[0]}</div>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="text-center mt-4 text-gray-600">
          {breakdown?.structure}
        </div>
      </div>
      <CategoriesSection components={components} colors={colors} />
    </div>
  );
}

// Certainty Scale Visual (for modal verbs)
function CertaintyScaleVisual({ components, colors }: any) {
  const categories = components.find((c: any) => c.type === 'categories_breakdown')?.categories || [];
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Certainty and Function Scale</h3>
        <div className="space-y-3">
          {categories.map((category: any, index: number) => (
            <motion.div
              key={category.name}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className={`${colors.accent} border ${colors.border} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-bold ${colors.text} text-lg`}>{category.name}</h4>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                  <div className="flex gap-2 mt-2">
                    {category.words.map((word: string) => (
                      <Badge key={word} variant="secondary">{word}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <ExamplesSection components={components} colors={colors} />
    </div>
  );
}

// Timeline Bridge Visual (for tenses)
function TimelineBridgeVisual({ components, colors }: any) {
  const breakdown = components.find((c: any) => c.type === 'visual_breakdown');
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Timeline Connection</h3>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
              <h4 className="font-bold text-gray-800">PAST</h4>
              <p className="text-sm text-gray-600">Action/State</p>
            </div>
            <div className={`${colors.accent} border-2 ${colors.border} rounded-lg p-4 text-center`}>
              <h4 className={`font-bold ${colors.text}`}>PRESENT</h4>
              <p className="text-sm text-gray-600">Connection/Effect</p>
            </div>
          </div>
          
          <div className={`relative bg-gradient-to-r from-gray-200 to-${colors.accent} h-12 rounded-lg flex items-center justify-center`}>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
              {breakdown?.structure || 'GRAMMAR STRUCTURE'}
            </div>
          </div>
        </div>
      </div>
      <FormulaSection components={components} colors={colors} />
    </div>
  );
}

// Decision Tree Visual (for articles, etc.)
function DecisionTreeVisual({ components, colors }: any) {
  const categories = components.find((c: any) => c.type === 'categories_breakdown')?.categories || [];
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Decision Process</h3>
        <div className="space-y-4">
          <div className="text-center">
            <div className={`${colors.accent} border-2 ${colors.border} rounded-lg p-3 inline-block`}>
              <span className={`font-bold ${colors.text}`}>What should you choose?</span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 flex-wrap">
            {categories.map((category: any, index: number) => (
              <div key={category.name} className="text-center">
                <ArrowDown className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${colors.accent} border-2 ${colors.border} rounded-lg p-3`}
                >
                  <span className={`font-bold ${colors.text}`}>{category.name}</span>
                  <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                  <div className="mt-2 space-y-1">
                    {category.examples.slice(0, 2).map((example: string, i: number) => (
                      <div key={i} className="bg-white p-2 rounded text-base">{example}</div>
                    ))}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Transformation Flow Visual (for passive voice, etc.)
function TransformationFlowVisual({ components, colors }: any) {
  const breakdown = components.find((c: any) => c.type === 'visual_breakdown');
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Grammar Transformation</h3>
        <div className="space-y-6">
          {breakdown?.components && breakdown.components.length >= 2 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-3">BEFORE</h4>
                <div className="flex items-center justify-center space-x-2">
                  {breakdown.components.slice(0, 3).map((part: any, index: number) => (
                    <React.Fragment key={part.part}>
                      {index > 0 && <ArrowRight className="h-4 w-4 text-blue-600" />}
                      <div className="bg-white border border-blue-300 rounded p-2 text-center">
                        <span className="font-bold text-blue-800 text-sm">{part.part}</span>
                        <div className="text-sm text-blue-600">{part.examples[0]}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <RotateCw className="h-8 w-8 text-purple-600 mx-auto" />
                <p className="text-purple-600 font-semibold">TRANSFORMS TO</p>
              </div>

              <div className={`${colors.accent} border ${colors.border} rounded-lg p-4`}>
                <h4 className={`font-bold ${colors.text} mb-3`}>AFTER</h4>
                <div className="flex items-center justify-center space-x-2">
                  {breakdown.components.slice(0, 3).map((part: any, index: number) => (
                    <React.Fragment key={part.part}>
                      {index > 0 && <ArrowRight className={`h-4 w-4 ${colors.text}`} />}
                      <div className={`bg-white border ${colors.border} rounded p-2 text-center`}>
                        <span className={`font-bold ${colors.text} text-sm`}>{part.part}</span>
                        <div className="text-sm text-gray-600">{part.examples[1] || part.examples[0]}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Comparison Table Visual (for conditionals, etc.)
function ComparisonTableVisual({ components, colors }: any) {
  const categories = components.find((c: any) => c.type === 'categories_breakdown')?.categories || [];
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Types and Uses</h3>
        <div className="space-y-3">
          {categories.map((category: any, index: number) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.accent} border ${colors.border} rounded-lg p-4`}
            >
              <div className="grid md:grid-cols-4 gap-4 items-center">
                <div className="text-center">
                  <h4 className={`font-bold ${colors.text} text-lg`}>{category.name}</h4>
                </div>
                <div className="text-sm text-gray-600">{category.description}</div>
                <div className="flex gap-1 flex-wrap">
                  {category.words.map((word: string) => (
                    <Badge key={word} variant="outline" className="text-lg px-2 py-1">{word}</Badge>
                  ))}
                </div>
                <div className="bg-white p-2 rounded text-sm italic">
                  "{category.examples[0]}"
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Process Steps Visual (for verb formation, etc.)
function ProcessStepsVisual({ components, colors }: any) {
  const breakdown = components.find((c: any) => c.type === 'visual_breakdown');
  
  return (
    <div className="space-y-6">
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <h3 className="text-xl font-bold text-center mb-6">Step-by-Step Process</h3>
        <div className="space-y-4">
          {breakdown?.components?.map((step: any, index: number) => (
            <motion.div
              key={step.part}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className={`${colors.accent} border ${colors.border} rounded-full w-10 h-10 flex items-center justify-center font-bold ${colors.text}`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${colors.text}`}>{step.part}</h4>
                <p className="text-gray-600 text-sm">{step.description}</p>
                <div className="flex gap-2 mt-1">
                  {step.examples.slice(0, 3).map((example: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-base px-2 py-1">{example}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic fallback visual
function GenericVisual({ components, colors }: any) {
  return (
    <div className="space-y-6">
      <MainExplanationSection components={components} colors={colors} />
      <CategoriesSection components={components} colors={colors} />
      <ExamplesSection components={components} colors={colors} />
    </div>
  );
}

// Reusable sections
function MainExplanationSection({ components, colors }: any) {
  const explanation = components.find((c: any) => c.type === 'main_explanation');
  
  if (!explanation) return null;
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
      <h3 className={`text-xl font-bold ${colors.text} text-center mb-4`}>{explanation.title}</h3>
      <p className="text-gray-700 text-center mb-4">{explanation.description}</p>
      {explanation.keyPoints && (
        <div className="space-y-2">
          {explanation.keyPoints.map((point: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircle className={`h-4 w-4 ${colors.text}`} />
              <span className="text-sm">{point}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesSection({ components, colors }: any) {
  const categoriesData = components.find((c: any) => c.type === 'categories_breakdown');
  
  if (!categoriesData?.categories) return null;
  
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categoriesData.categories.map((category: any, index: number) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${colors.accent} border ${colors.border} rounded-lg p-4`}
        >
          <h4 className={`font-bold ${colors.text} mb-2`}>{category.name}</h4>
          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {category.words.map((word: string) => (
              <Badge key={word} variant="secondary" className="bg-white text-gray-800 text-lg px-3 py-1">
                {word}
              </Badge>
            ))}
          </div>
          {category.examples && (
            <div className="space-y-1">
              {category.examples.slice(0, 2).map((example: string, i: number) => (
                <div key={i} className="bg-white p-3 rounded text-base italic">
                  {example}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function FormulaSection({ components, colors }: any) {
  const breakdown = components.find((c: any) => c.type === 'visual_breakdown');
  
  if (!breakdown) return null;
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
      <h3 className="text-xl font-bold text-center mb-6">Grammar Formula</h3>
      <div className="flex items-center justify-center space-x-4 text-lg flex-wrap">
        {breakdown.components?.map((component: any, index: number) => (
          <React.Fragment key={component.part}>
            {index > 0 && <span className="text-2xl font-bold text-gray-600">+</span>}
            <div className={`bg-white border-2 ${colors.border} rounded-lg p-3 text-center`}>
              <span className={`font-bold ${colors.text}`}>{component.part}</span>
              <div className="text-sm text-gray-600">{component.description}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ExamplesSection({ components, colors }: any) {
  const examples = components.find((c: any) => c.type === 'practical_examples');
  
  if (!examples?.examples) return null;
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
      <h3 className="text-xl font-bold text-center mb-6">{examples.title || 'Examples'}</h3>
      <div className="space-y-4">
        {examples.examples.map((example: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="font-medium text-lg mb-2">{example.sentence}</p>
            <p className="text-sm text-gray-600 mb-2">{example.breakdown}</p>
            {example.alternatives && example.alternatives.length > 0 && (
              <div className="text-sm text-purple-600">
                <strong>Alternative:</strong> {example.alternatives[0]}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Fallback for when no visual layout is provided
function FallbackVisual({ grammarData }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-center mb-6">{grammarData.title}</h3>
      <div className="space-y-4">
        {grammarData.examples.map((example: any, index: number) => (
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