import React from 'react';
import { Camera, Wifi } from 'lucide-react';

const WebcamFeed = ({ frame }) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">Live Camera Feed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">LIVE</span>
        </div>
      </div>
      
      <div className="relative">
        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
          {frame ? (
            <img 
              src={frame} 
              alt="Webcam Feed" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No camera feed</p>
                <p className="text-xs text-slate-600">Check camera connection</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Hand positioning guide overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm rounded-lg p-2">
            <div className="text-xs text-slate-300 text-center">
              Position your hand in the center of the frame
            </div>
          </div>
          
          {/* Center guide */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 border-2 border-blue-400/50 border-dashed rounded-lg"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-slate-500 text-center">
        Make sure your hand is well-lit and clearly visible
      </div>
    </div>
  );
};

export default WebcamFeed;
