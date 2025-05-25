# Enhanced Qwen Prompts for AI-Powered Sentence Frames

## Overview
This document provides enhanced prompt engineering for Qwen to generate sentence frames with advanced AI features that maximize learning effectiveness and visual clarity.

## 🎯 Enhanced Prompt Structure

### 1. AI-Powered Sentence Frames Section

Add this enhanced section to the existing Qwen prompt:

```
ENHANCED SENTENCE FRAMES REQUIREMENTS (AI-POWERED):

Each sentence frame MUST include the following advanced AI-powered structure:

1. CORE PATTERN STRUCTURE (Enhanced):
   - patternTemplate: Clear pattern with semantic placeholders
   - languageFunction: Specific communicative purpose
   - title: Descriptive frame title
   - level: Appropriate CEFR complexity level
   - grammarFocus: Array of specific grammar points

2. INTELLIGENT STRUCTURE COMPONENTS:
   Each component MUST include:
   - label: Semantic component name (use grammatical terms like "Subject Noun", "Action Verb", "Evaluative Adjective")
   - description: Clear functional explanation 
   - examples: 8-10 contextually appropriate examples for ${params.cefrLevel} level
   - inSentenceExample: Shows component placement
   - semanticType: Grammatical category ("noun", "verb", "adjective", "adverb", "connector")
   - difficultyLevel: 1-5 scale appropriate for ${params.cefrLevel}

3. AI-ENHANCED EXAMPLES:
   Provide 4-6 examples, each with:
   - completeSentence: Full example using the pattern
   - breakdown: Maps each component label to its text in the sentence
   - culturalContext: "universal", "business", "academic", "casual", or "formal"
   - difficultyScore: 1-5 rating for ${params.cefrLevel} appropriateness
   - aiGenerated: true (mark as AI-enhanced)
   - personalizedFor: Array of learner types ["visual", "analytical", "practical", "creative"]

4. ADAPTIVE LEARNING FEATURES:
   Include adaptiveLearning object with:
   - proficiencyAnalysis:
     * currentLevel: "${params.cefrLevel}"
     * confidenceScore: Estimated percentage (60-95% based on pattern complexity)
     * strugglingAreas: Array of common challenge areas for this pattern
     * strongAreas: Array of pattern strengths for ${params.cefrLevel} learners
   - adaptiveFeatures:
     * vocabularyComplexity: "simplified"|"standard"|"challenging" (match to ${params.cefrLevel})
     * grammarComplexity: "basic"|"intermediate"|"advanced" (match to ${params.cefrLevel})
     * exampleQuantity: 4-8 based on pattern complexity
     * scaffoldingLevel: "high"|"medium"|"low" (inverse to ${params.cefrLevel})

5. AI ENHANCEMENTS OBJECT:
   Include aiEnhancements with:
   
   A. personalizedExamples: 3-4 additional examples with:
      - completeSentence: Contextually relevant to lesson topic "${params.topic}"
      - breakdown: Component mapping
      - culturalContext: Varied contexts
      - personalizedFor: Different learning preferences
      - aiGenerated: true
      - confidenceScore: 85-98%

   B. predictedErrors: 3-5 common mistakes with:
      - error: Actual incorrect sentence using the pattern
      - correction: Fixed version
      - explanation: Clear explanation of the mistake
      - likelihood: Percentage chance students make this error (based on ${params.cefrLevel})

   C. culturalAdaptations: 3-4 cultural contexts with:
      - culture: "International Business", "Academic Settings", "Casual Conversation", "Formal Events"
      - adaptation: How the pattern changes in this context
      - explanation: Cultural reasoning for the adaptation

   D. conversationalContexts: 3-4 scenarios with:
      - scenario: Real-world situation where pattern is used
      - appropriate: Boolean indicating if pattern fits
      - alternatives: Other patterns if this one doesn't fit

6. ENHANCED VISUAL STRUCTURE:
   Provide visualStructure with:
   - start: Opening words/structure
   - parts: Array of components with connectors and semantic types
   - end: Closing punctuation/structure
   - colorCoding: Map components to semantic colors
   - animationHints: Suggestions for visual presentation

7. INTERACTIVE FEATURES (Enhanced):
   Include comprehensive interactiveFeatures:
   
   A. fillInTheBlanks: 3-4 progressive exercises
   B. substitutionDrill: Multiple substitution options with context
   C. buildingSentences: Step-by-step construction guide
   D. errorPrevention: Common mistakes with prevention strategies
   E. culturalPractice: Context-switching exercises
   F. aiAssisted: Smart suggestions and real-time feedback features

8. PATTERN VARIATIONS (Comprehensive):
   Include all applicable variations:
   - negativeForm: Pattern in negative
   - questionForm: Pattern as question
   - modalForm: Pattern with modals (can, should, might, etc.)
   - pastForm: Pattern in past tense
   - futureForm: Pattern in future tense
   - conditionalForm: Pattern with if/when clauses (if appropriate)

9. TEACHING SUPPORT (AI-Enhanced):
   Provide comprehensive teaching support:
   
   A. teachingNotes: 5-8 practical classroom strategies
   B. discussionPrompts: 4-6 thought-provoking questions
   C. commonChallenges: Typical student difficulties with solutions
   D. extensionActivities: Ways to practice the pattern beyond basic exercises
   E. assessmentIdeas: How to evaluate student mastery
   F. differentiationTips: Adaptations for different learning styles

10. GAMIFICATION ELEMENTS:
    Include gamificationLayer:
    - achievementTargets: Milestones for pattern mastery
    - progressIndicators: How to measure improvement
    - practiceGoals: Specific targets for student practice
    - motivationalElements: Ways to keep students engaged

CRITICAL JSON STRUCTURE FOR AI-ENHANCED SENTENCE FRAMES:

```json
{
  "type": "sentenceFrames",
  "title": "Advanced Sentence Practice",
  "introduction": "Master sophisticated sentence patterns with AI-powered learning support.",
  "frames": [
    {
      "patternTemplate": "[Subject] + [Verb] + [Object] + because + [Reason]",
      "languageFunction": "Expressing cause and effect relationships",
      "title": "Cause and Effect Communication",
      "level": "intermediate",
      "grammarFocus": [
        "Causal conjunctions with 'because'",
        "Subject-verb agreement in complex sentences",
        "Appropriate register for explanations"
      ],
      "structureComponents": [
        {
          "label": "Subject Noun",
          "description": "The person, thing, or concept performing the action",
          "examples": ["The new policy", "My decision", "The team's approach", "This strategy", "The change", "Her method", "The solution", "Our plan"],
          "inSentenceExample": "[Subject Noun] helps everyone...",
          "semanticType": "noun",
          "difficultyLevel": 3
        },
        {
          "label": "Action Verb",
          "description": "The main action or state being described",
          "examples": ["improves", "creates", "enhances", "reduces", "increases", "supports", "generates", "facilitates"],
          "inSentenceExample": "...improves [Object]...",
          "semanticType": "verb", 
          "difficultyLevel": 3
        },
        {
          "label": "Target Object",
          "description": "What is being affected by the action",
          "examples": ["communication", "efficiency", "understanding", "cooperation", "productivity", "relationships", "outcomes", "performance"],
          "inSentenceExample": "...improves communication...",
          "semanticType": "noun",
          "difficultyLevel": 3
        },
        {
          "label": "Causal Reason",
          "description": "The explanation for why the action has this effect",
          "examples": ["it clarifies expectations", "it builds trust", "it saves time", "it prevents confusion", "it encourages participation", "it provides structure"],
          "inSentenceExample": "...because it clarifies expectations",
          "semanticType": "clause",
          "difficultyLevel": 4
        }
      ],
      "visualStructure": {
        "start": "",
        "parts": [
          { "label": "Subject Noun", "connector": "", "semanticType": "noun" },
          { "label": "Action Verb", "connector": "", "semanticType": "verb" },
          { "label": "Target Object", "connector": "", "semanticType": "noun" },
          { "label": "Causal Reason", "connector": "because", "semanticType": "clause" }
        ],
        "end": ".",
        "colorCoding": {
          "Subject Noun": "blue",
          "Action Verb": "green", 
          "Target Object": "purple",
          "Causal Reason": "orange"
        },
        "animationHints": [
          "Highlight each component as it's selected",
          "Show connection flow from cause to effect",
          "Animate sentence building left to right"
        ]
      },
      "examples": [
        {
          "completeSentence": "The new training program improves team performance because it focuses on practical skills.",
          "breakdown": {
            "Subject Noun": "The new training program",
            "Action Verb": "improves",
            "Target Object": "team performance", 
            "Causal Reason": "it focuses on practical skills"
          },
          "culturalContext": "business",
          "difficultyScore": 3,
          "aiGenerated": true,
          "personalizedFor": ["analytical", "practical"]
        },
        {
          "completeSentence": "This teaching method enhances student understanding because it connects theory to real experience.",
          "breakdown": {
            "Subject Noun": "This teaching method",
            "Action Verb": "enhances",
            "Target Object": "student understanding",
            "Causal Reason": "it connects theory to real experience"
          },
          "culturalContext": "academic",
          "difficultyScore": 4,
          "aiGenerated": true,
          "personalizedFor": ["visual", "creative"]
        }
      ],
      "adaptiveLearning": {
        "proficiencyAnalysis": {
          "currentLevel": "B1",
          "confidenceScore": 78,
          "strugglingAreas": ["complex causal reasoning", "academic vocabulary", "sentence length management"],
          "strongAreas": ["basic cause-effect understanding", "simple conjunctions", "present tense accuracy"]
        },
        "adaptiveFeatures": {
          "vocabularyComplexity": "standard",
          "grammarComplexity": "intermediate", 
          "exampleQuantity": 6,
          "scaffoldingLevel": "medium"
        }
      },
      "aiEnhancements": {
        "personalizedExamples": [
          {
            "completeSentence": "Learning about ${params.topic} improves critical thinking because it challenges assumptions.",
            "breakdown": {
              "Subject Noun": "Learning about ${params.topic}",
              "Action Verb": "improves", 
              "Target Object": "critical thinking",
              "Causal Reason": "it challenges assumptions"
            },
            "culturalContext": "academic",
            "personalizedFor": ["analytical"],
            "aiGenerated": true,
            "confidenceScore": 92
          }
        ],
        "predictedErrors": [
          {
            "error": "*The solution improve communication because is clear.",
            "correction": "The solution improves communication because it is clear.",
            "explanation": "Remember subject-verb agreement (solution improves) and include the subject 'it' in the because clause.",
            "likelihood": 65
          },
          {
            "error": "*This method enhances understanding because of it is practical.",
            "correction": "This method enhances understanding because it is practical.",
            "explanation": "Use 'because' + clause, not 'because of' + clause in this pattern.",
            "likelihood": 45
          }
        ],
        "culturalAdaptations": [
          {
            "culture": "International Business",
            "adaptation": "Use formal register and specific business terminology",
            "explanation": "Business contexts require precise, professional language with measurable outcomes"
          },
          {
            "culture": "Academic Settings", 
            "adaptation": "Include research-based evidence and theoretical frameworks",
            "explanation": "Academic discourse emphasizes evidence-based reasoning and scholarly terminology"
          }
        ],
        "conversationalContexts": [
          {
            "scenario": "Explaining a work process to colleagues",
            "appropriate": true,
            "alternatives": []
          },
          {
            "scenario": "Casual conversation about preferences", 
            "appropriate": false,
            "alternatives": ["I like X because...", "X is good because..."]
          }
        ]
      },
      "patternVariations": {
        "negativeForm": "This approach doesn't improve efficiency because it lacks clear guidelines.",
        "questionForm": "Why does this method enhance learning?",
        "modalForm": "This strategy could improve results because it addresses the core issue.",
        "pastForm": "The previous system improved productivity because it streamlined workflows.",
        "conditionalForm": "If this approach improves communication, it will be because it encourages feedback."
      },
      "interactiveFeatures": {
        "fillInTheBlanks": [
          {
            "template": "The new ___ improves ___ because it ___.",
            "prompts": [
              "Think of an innovation in your field",
              "What does it improve?",
              "Why does it have this effect?"
            ],
            "aiAssisted": true
          }
        ],
        "substitutionDrill": {
          "basePattern": "This method improves learning because it engages students.",
          "substitutions": [
            {"target": "method", "options": ["approach", "technique", "strategy", "system"]},
            {"target": "improves", "options": ["enhances", "increases", "supports", "facilitates"]},
            {"target": "learning", "options": ["understanding", "retention", "engagement", "performance"]}
          ],
          "contextual": true
        },
        "buildingSentences": {
          "stepByStep": [
            {"step": 1, "instruction": "Identify what causes the effect", "examples": ["new policy", "training program", "this method"]},
            {"step": 2, "instruction": "Choose the action/effect", "examples": ["improves", "enhances", "increases"]}, 
            {"step": 3, "instruction": "Specify what is affected", "examples": ["performance", "understanding", "efficiency"]},
            {"step": 4, "instruction": "Explain the mechanism", "examples": ["it provides structure", "it clarifies goals", "it saves time"]}
          ],
          "aiAssisted": true
        },
        "errorPrevention": {
          "realTimeChecking": true,
          "commonMistakes": [
            "Subject-verb agreement errors",
            "Missing subject in because clause", 
            "Confusion between 'because' and 'because of'"
          ],
          "preventionStrategies": [
            "Always check: Does the subject match the verb?",
            "Remember: 'because' needs a complete clause with subject + verb",
            "Practice: 'because' + clause vs 'because of' + noun phrase"
          ]
        }
      },
      "teachingNotes": [
        "Start with familiar cause-effect relationships before introducing complex academic concepts",
        "Use visual diagrams to show the logical flow from cause to effect",
        "Practice with current events or student experiences to maintain engagement",
        "Emphasize the difference between correlation and causation in advanced classes",
        "Encourage students to support their reasoning with specific evidence",
        "Model the thinking process: 'I believe X causes Y because of evidence Z'",
        "Use think-pair-share activities to practice the pattern collaboratively",
        "Connect to critical thinking skills by analyzing the quality of causal reasoning"
      ],
      "discussionPrompts": [
        "What changes in your field have improved outcomes? Why do you think they were effective?",
        "How does understanding cause and effect help in problem-solving?",
        "Can you think of a time when an intended improvement had unexpected results?",
        "What role does evidence play in establishing causal relationships?",
        "How might this pattern be useful in academic writing or professional presentations?"
      ],
      "gamificationLayer": {
        "achievementTargets": {
          "bronze": "Create 5 accurate cause-effect sentences",
          "silver": "Use pattern in different contexts (academic, business, personal)",
          "gold": "Teach the pattern to a classmate",
          "platinum": "Write a persuasive paragraph using multiple cause-effect relationships"
        },
        "progressIndicators": [
          "Accuracy in component identification",
          "Fluency in sentence construction", 
          "Appropriate context selection",
          "Creative example generation"
        ],
        "practiceGoals": {
          "daily": "Use pattern in 3 different sentences",
          "weekly": "Apply pattern across 2 different contexts",
          "monthly": "Demonstrate mastery in speaking and writing assessments"
        }
      }
    }
  ]
}
```

This enhanced structure provides:
- ✅ AI-powered adaptive learning features
- ✅ Predictive error correction  
- ✅ Cultural context adaptation
- ✅ Personalized examples generation
- ✅ Interactive practice elements
- ✅ Comprehensive teaching support
- ✅ Visual learning enhancements
- ✅ Gamification elements
- ✅ Real-time feedback capabilities

The AI generates contextually appropriate content that adapts to student level, cultural background, and learning preferences while maintaining pedagogical effectiveness and visual clarity.
```

## 2. Integration with Existing Qwen Service

To implement these enhancements, add this prompt section to the existing Qwen service in `server/services/qwen.ts` within the main lesson generation prompt, specifically in the sentence frames section.

## 3. Frontend Integration

The enhanced data structure integrates seamlessly with the new `EnhancedSentenceFramesSection` component, providing:

- **Adaptive Learning Dashboard**: Shows personalized progress and recommendations
- **AI-Powered Pattern Builder**: Interactive sentence construction with real-time feedback
- **Cultural Adaptation Panel**: Context-specific pattern usage guidance  
- **Error Prevention System**: Predictive assistance and correction
- **Gamification Elements**: Achievement tracking and motivation features

## 4. Benefits of This Enhancement

1. **Maximized AI Leverage**: Every aspect is AI-generated and personalized
2. **Enhanced Visual Clarity**: Semantic color coding and interactive animations
3. **Adaptive Learning**: Content adjusts to student proficiency and preferences
4. **Cultural Sensitivity**: Global applicability with local adaptations
5. **Pedagogical Effectiveness**: Research-based teaching strategies and assessment
6. **Engagement**: Gamification and interactive elements maintain motivation 