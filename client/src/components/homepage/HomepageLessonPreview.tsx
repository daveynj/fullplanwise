import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    Volume2,
    CheckCircle2,
    MessageSquare,
    Lightbulb,
    Puzzle,
    Layers,
    Target,
    Sparkles
} from 'lucide-react';

interface VocabularyWord {
    term: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    pronunciation?: {
        phoneticGuide: string;
    };
}

interface LessonSection {
    type: string;
    title: string;
    content?: string;
    paragraphs?: string[];
    questions?: string[];
    targetVocabulary?: string[];
    words?: VocabularyWord[];
}

interface LessonData {
    title: string;
    level: string;
    sections: LessonSection[];
}

interface HomepageLessonPreviewProps {
    lessonData: LessonData | null;
    activeSection: string;
    isLoading?: boolean;
}

// Vocabulary Card Component
function VocabularyCardPreview({ word }: { word: VocabularyWord }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="group"
        >
            <Card className="h-full bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h4 className="text-2xl font-bold text-brand-navy group-hover:text-brand-yellow transition-colors">
                                {word.term}
                            </h4>
                            <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-800">
                                {word.partOfSpeech}
                            </Badge>
                        </div>
                        <button className="p-2 rounded-full bg-brand-navy/10 hover:bg-brand-navy/20 transition-colors">
                            <Volume2 className="h-5 w-5 text-brand-navy" />
                        </button>
                    </div>

                    {word.pronunciation?.phoneticGuide && (
                        <p className="text-sm text-gray-500 italic mb-3 font-mono">
                            /{word.pronunciation.phoneticGuide}/
                        </p>
                    )}

                    <p className="text-gray-700 mb-4 leading-relaxed">
                        {word.definition}
                    </p>

                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-brand-yellow">
                        <p className="text-gray-600 italic text-sm">"{word.example}"</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Reading Text Preview
function ReadingPreview({ paragraphs, title }: { paragraphs: string[], title: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg p-6 md:p-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-brand-navy text-white">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy">{title}</h3>
                </div>

                <div className="prose prose-lg max-w-none">
                    {paragraphs.slice(0, 2).map((paragraph, index) => (
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15, duration: 0.4 }}
                            className="text-gray-700 leading-relaxed mb-4 last:mb-0"
                        >
                            {paragraph}
                        </motion.p>
                    ))}
                    {paragraphs.length > 2 && (
                        <p className="text-brand-navy font-medium mt-4 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            ...and {paragraphs.length - 2} more paragraphs in the full lesson
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Warmup Preview
function WarmupPreview({ questions, vocabulary }: { questions: string[], vocabulary: string[] }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl shadow-lg p-6 md:p-8 border border-green-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-green-600 text-white">
                        <Lightbulb className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy">Discussion Questions</h3>
                </div>

                <div className="space-y-3">
                    {questions.slice(0, 4).map((question, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white border border-green-100 hover:border-green-300 transition-colors"
                        >
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                            </span>
                            <p className="text-gray-700">{question}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {vocabulary && vocabulary.length > 0 && (
                <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-lg p-6 border border-purple-100">
                    <h4 className="font-semibold text-brand-navy mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Target Vocabulary
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {vocabulary.map((word, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Comprehension Preview
function ComprehensionPreview({ questions }: { questions?: Array<{ question: string, options?: string[], correctAnswer?: string }> | string[] }) {
    if (!questions || questions.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl shadow-lg p-6 md:p-8 border border-orange-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy">Comprehension Check</h3>
                </div>

                <div className="space-y-4">
                    {(questions as any[]).slice(0, 3).map((q, index) => {
                        const questionText = typeof q === 'string' ? q : q.question;
                        const options = typeof q === 'object' ? q.options : null;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-white rounded-lg border border-orange-100"
                            >
                                <p className="font-medium text-gray-800 mb-3">
                                    <span className="text-orange-600 mr-2">Q{index + 1}.</span>
                                    {questionText}
                                </p>
                                {options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {options.slice(0, 4).map((opt: string, optIndex: number) => (
                                            <div
                                                key={optIndex}
                                                className="p-2 rounded bg-gray-50 text-sm text-gray-600 hover:bg-orange-50 transition-colors cursor-pointer"
                                            >
                                                {String.fromCharCode(65 + optIndex)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

// Discussion Preview
function DiscussionPreview({ questions }: { questions: string[] }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl shadow-lg p-6 md:p-8 border border-cyan-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-cyan-600 text-white">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy">Discussion Questions</h3>
                </div>

                <div className="grid gap-4">
                    {questions.slice(0, 4).map((question, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4 items-start p-4 bg-white rounded-lg border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold">
                                {index + 1}
                            </div>
                            <p className="text-gray-700 pt-2">{question}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Loading Skeleton
function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

// Generic Section Preview (for cloze, unscramble, etc.)
function GenericSectionPreview({ title, icon: Icon, color }: { title: string, icon: React.ElementType, color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className={`bg-gradient-to-br from-white to-${color}-50/30 rounded-xl shadow-lg p-6 md:p-8 border border-${color}-100`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg bg-${color}-600 text-white`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy">{title}</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Interactive {title.toLowerCase()} activities await in the full lesson!</p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`w-16 h-8 bg-${color}-100 rounded-lg animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Main Component
export function HomepageLessonPreview({ lessonData, activeSection, isLoading }: HomepageLessonPreviewProps) {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!lessonData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading lesson preview...</p>
            </div>
        );
    }

    const findSection = (type: string) => lessonData.sections.find(s => s.type === type);

    const renderSection = () => {
        switch (activeSection) {
            case 'warmup': {
                const warmup = findSection('warmup');
                if (!warmup) return null;
                return (
                    <WarmupPreview
                        questions={warmup.questions || []}
                        vocabulary={warmup.targetVocabulary || []}
                    />
                );
            }

            case 'reading': {
                const reading = findSection('reading');
                if (!reading) return null;
                return (
                    <ReadingPreview
                        paragraphs={reading.paragraphs || []}
                        title={reading.title || 'Reading Passage'}
                    />
                );
            }

            case 'vocabulary': {
                const vocab = findSection('vocabulary');
                if (!vocab?.words) return null;
                return (
                    <div className="grid md:grid-cols-2 gap-6">
                        {vocab.words.slice(0, 4).map((word, index) => (
                            <VocabularyCardPreview key={index} word={word} />
                        ))}
                    </div>
                );
            }

            case 'comprehension': {
                const comp = findSection('comprehension');
                if (!comp) return null;
                return <ComprehensionPreview questions={comp.questions as any} />;
            }

            case 'discussion': {
                const disc = findSection('discussion');
                if (!disc?.questions) return null;
                return <DiscussionPreview questions={disc.questions} />;
            }

            case 'sentence': {
                return <GenericSectionPreview title="Sentence Patterns" icon={Layers} color="indigo" />;
            }

            case 'cloze': {
                return <GenericSectionPreview title="Fill-in-the-Blanks" icon={Puzzle} color="pink" />;
            }

            case 'unscramble': {
                return <GenericSectionPreview title="Sentence Unscramble" icon={Sparkles} color="violet" />;
            }

            case 'quiz': {
                return <GenericSectionPreview title="Knowledge Check Quiz" icon={Target} color="emerald" />;
            }

            default:
                return null;
        }
    };

    return (
        <div className="min-h-[400px]">
            {renderSection()}
        </div>
    );
}
