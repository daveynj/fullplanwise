interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  progressText?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = "Generating Your Lesson", 
  progress = 45,
  progressText = "Analyzing content and creating materials..."
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md text-center">
        <div className="mb-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h3 className="text-xl font-nunito font-bold mb-2">{message}</h3>
        <p className="text-gray-600 mb-4">
          Our AI is creating a personalized lesson based on your requirements. This may take a moment.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-xs text-gray-500">{progressText}</p>
      </div>
    </div>
  );
}
