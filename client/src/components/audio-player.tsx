import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  id: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, id }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (!src) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle audio ended event
  const handleEnded = () => {
    setIsPlaying(false);
  };

  // If no audio source is provided, return a disabled button
  if (!src) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50 border-blue-200 text-blue-400 cursor-not-allowed hover:bg-blue-50"
        disabled
      >
        <Volume2 className="h-4 w-4 mr-2" />
        No Audio
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center">
      <audio 
        ref={audioRef} 
        src={src} 
        id={id} 
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayPause}
        className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isPlaying ? 'Pause' : 'Play'} Pronunciation
      </Button>
    </div>
  );
};