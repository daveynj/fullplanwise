import { useState, useEffect } from "react";
import { Sparkles, BookOpen, MessageSquare, Users, Clock } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const PROGRESS_STAGES = [
  { 
    id: 1, 
    text: "Analyzing vocabulary requirements", 
    icon: BookOpen, 
    duration: 20000 // 20 seconds
  },
  { 
    id: 2, 
    text: "Creating reading passages", 
    icon: MessageSquare, 
    duration: 30000 // 30 seconds
  },
  { 
    id: 3, 
    text: "Developing discussion questions", 
    icon: Users, 
    duration: 25000 // 25 seconds
  },
  { 
    id: 4, 
    text: "Generating images and final touches", 
    icon: Sparkles, 
    duration: 35000 // 35 seconds
  }
];

const TEACHING_TIPS = [
  "Students retain vocabulary 65% better when they see words in multiple contexts within the same lesson.",
  "Discussion questions that connect to student experiences increase engagement by up to 40%.",
  "Reading passages at the right CEFR level challenge students without overwhelming them.",
  "Visual aids like our generated images help students remember new concepts 3x longer.",
  "Sentence frames give students confidence to use new vocabulary in speaking activities.",
  "Semantic maps help students understand word relationships and build stronger vocabulary networks.",
  "Cross-component integration ensures students see vocabulary in reading, then use it in discussions.",
  "CEFR-appropriate grammar structures help students progress systematically through language levels.",
  "Our AI analyzes cognitive load to create lessons that challenge without frustrating students.",
  "Quality discussion questions require more than yes/no answers to promote meaningful conversation."
];

const COMMUNITY_ACTIVITIES = [
  "exploring ancient civilizations",
  "discussing environmental solutions", 
  "learning about cultural traditions",
  "analyzing business strategies",
  "exploring scientific discoveries",
  "discussing social media impacts",
  "learning cooking techniques",
  "exploring space exploration",
  "discussing healthy lifestyles",
  "analyzing historical events",
  "learning about technology trends",
  "exploring artistic movements"
];

export function LoadingOverlay({ 
  isLoading, 
  message = "Generating Your Lesson"
}: LoadingOverlayProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [communityActivity, setCommunityActivity] = useState("");

  useEffect(() => {
    if (!isLoading) {
      // When loading completes, immediately set to 100% and reset after a brief delay
      setProgress(100);
      const resetTimer = setTimeout(() => {
        setCurrentStage(0);
        setProgress(0);
      }, 500);
      return () => clearTimeout(resetTimer);
    }

    // Set random community activity
    setCommunityActivity(COMMUNITY_ACTIVITIES[Math.floor(Math.random() * COMMUNITY_ACTIVITIES.length)]);

    let stageIndex = 0;
    let stageStartTime = Date.now();
    const totalDuration = PROGRESS_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsedTime = 0;

    const interval = setInterval(() => {
      elapsedTime += 500;
      
      // Calculate which stage we should be in
      let cumulativeDuration = 0;
      let newStageIndex = 0;
      
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        cumulativeDuration += PROGRESS_STAGES[i].duration;
        if (elapsedTime < cumulativeDuration) {
          newStageIndex = i;
          break;
        }
      }
      
      // If we've gone past all stages, stay at the last stage
      if (elapsedTime >= totalDuration) {
        newStageIndex = PROGRESS_STAGES.length - 1;
      }

      // Update stage if changed
      if (newStageIndex !== stageIndex) {
        stageIndex = newStageIndex;
        setCurrentStage(stageIndex);
        stageStartTime = Date.now();
      }

      // Update progress (0-100%)
      const newProgress = Math.min((elapsedTime / totalDuration) * 100, 95);
      setProgress(newProgress);

    }, 500);

    // Rotate teaching tips every 8 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TEACHING_TIPS.length);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const CurrentIcon = PROGRESS_STAGES[currentStage]?.icon || Clock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg text-center">
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-nunito font-bold mb-2">{message}</h3>
        </div>

        {/* Progress Stages */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-3">
            <CurrentIcon className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {PROGRESS_STAGES[currentStage]?.text || "Finalizing your lesson..."}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{Math.round(progress)}% Complete</p>
        </div>

        {/* Teaching Tip */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <Sparkles className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium text-blue-700 mb-1">Teaching Tip</p>
              <p className="text-sm text-blue-600 leading-relaxed">
                {TEACHING_TIPS[currentTip]}
              </p>
            </div>
          </div>
        </div>

        {/* Community Activity */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            <Users className="w-3 h-3 inline mr-1" />
            Other teachers are creating lessons about <span className="font-medium">{communityActivity}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
