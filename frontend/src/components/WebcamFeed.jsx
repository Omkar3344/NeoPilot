import React, { useRef, useEffect } from 'react';
import { Camera, Hand, CheckCircle } from 'lucide-react';

const WebcamFeed = ({ frame }) => {
  const imgRef = useRef(null);
  const prevFrameRef = useRef(null);

  useEffect(() => {
    // Only update image if frame actually changed (prevents unnecessary re-renders)
    if (frame && frame !== prevFrameRef.current && imgRef.current) {
      imgRef.current.src = frame;
      prevFrameRef.current = frame;
    }
  }, [frame]);

  return (
    <div className="p-4 bg-slate-900/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-blue-400" />
          <span className="text-base font-semibold text-slate-200">Hand Gesture Camera</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      </div>
      
      <div className="relative">
        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-xl">
          {frame ? (
            <img 
              ref={imgRef}
              alt="Webcam Feed" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-base text-slate-400 font-medium">No camera feed</p>
                <p className="text-sm text-slate-600 mt-1">Check camera connection</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced hand positioning guide overlay */}
        {frame && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner guides */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-blue-400/60 rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-blue-400/60 rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-blue-400/60 rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-blue-400/60 rounded-br-lg"></div>
            
            {/* Center target zone */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-40 h-40 border-2 border-blue-500/40 border-dashed rounded-2xl animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Hand className="h-12 w-12 text-blue-400/30" />
                </div>
              </div>
            </div>
            
            {/* Top instruction banner */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md rounded-full px-4 py-1.5 shadow-lg border border-blue-400/30">
                <div className="flex items-center space-x-2">
                  <Hand className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-semibold">Place hand in center • Palm facing camera</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tips section */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-start space-x-2 text-xs">
          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-slate-400">Ensure good lighting on your hand</span>
        </div>
        <div className="flex items-start space-x-2 text-xs">
          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-slate-400">Keep hand steady for 1-2 seconds per gesture</span>
        </div>
        <div className="flex items-start space-x-2 text-xs">
          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-slate-400">Spread fingers wide for takeoff gesture</span>
        </div>
      </div>
    </div>
  );
};

export default WebcamFeed;
