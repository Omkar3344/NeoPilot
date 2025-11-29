import React from 'react';
import { 
  Hand, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  MoveUp,
  MoveDown,
  CircleDot,
  AlertTriangle
} from 'lucide-react';

const GestureGuide = () => {
  const gestures = [
    {
      name: 'Stop / Hover',
      icon: Hand,
      color: 'text-orange-400',
      description: '✋ Open palm with fingers spread apart',
      details: 'All fingers extended and separated - Hover in place',
      command: 'stop'
    },
    {
      name: 'Land',
      icon: CircleDot,
      color: 'text-red-400',
      description: '👌 OK sign - thumb & index circle',
      details: 'Thumb and index form circle, other 3 fingers extended',
      command: 'land'
    },
    {
      name: 'Go Forward',
      icon: MoveUp,
      color: 'text-green-400',
      description: '✋ Palm facing camera, all fingers extended',
      details: 'Open palm facing forward - Move drone forward',
      command: 'go_forward'
    },
    {
      name: 'Back',
      icon: MoveDown,
      color: 'text-blue-400',
      description: '👊 Closed fist, back of hand visible',
      details: 'All fingers curled, palm facing away',
      command: 'back'
    },
    {
      name: 'Up',
      icon: ArrowUp,
      color: 'text-cyan-400',
      description: '👆 Index finger pointing upward',
      details: 'Only index extended, palm facing forward',
      command: 'up'
    },
    {
      name: 'Down',
      icon: ArrowDown,
      color: 'text-purple-400',
      description: '👇 Palm facing downward',
      details: 'Hand rotated with fingers pointing down',
      command: 'down'
    },
    {
      name: 'Left',
      icon: ArrowLeft,
      color: 'text-yellow-400',
      description: '✊ Closed fist with thumb pointing left',
      details: 'Fist with thumb extended to the left',
      command: 'left'
    },
    {
      name: 'Right',
      icon: ArrowRight,
      color: 'text-pink-400',
      description: '✊ Closed fist with thumb pointing right',
      details: 'Fist with thumb extended to the right',
      command: 'right'
    }
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Hand className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">Hand Gestures (8 Simple)</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Position your hand clearly in front of the camera. Make distinct gestures 
          and hold for 1 second for accurate recognition. Improved detection system!
        </p>
      </div>

      <div className="space-y-3">
        {gestures.map((gesture, index) => {
          const Icon = gesture.icon;
          return (
            <div key={index} className="glass-panel p-4 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${gesture.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-200">{gesture.name}</h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {gesture.command}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{gesture.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Pro Tips</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Ensure good lighting for better recognition</li>
              <li>• Keep hand steady for 1-2 seconds</li>
              <li>• Position hand in the center guide box</li>
              <li>• Confidence threshold is set to 70%</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-400 mb-1">Safety Notice</h4>
            <p className="text-sm text-slate-300">
              Emergency stop gesture will immediately land the drone. 
              Use it when you need to stop all operations quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureGuide;
