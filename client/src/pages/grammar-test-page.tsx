import { GrammarComponentShowcase } from '@/components/lesson/grammar-component-showcase';

export default function GrammarTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Grammar Components
          </h1>
          <p className="text-gray-600">
            Interactive grammar components with educational focus on practical usage
          </p>
        </div>
        
        <GrammarComponentShowcase />
      </div>
    </div>
  );
} 