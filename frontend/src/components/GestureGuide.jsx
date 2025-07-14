import React from 'react';
import { 
  Hand, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  RotateCw,
  Square,
  AlertTriangle,
  Pause
} from 'lucide-react';

const GestureGuide = () => {
  const gestures = [
    {
      name: 'Takeoff',
      icon: ArrowUp,
      color: 'text-green-400',
      description: 'Open palm facing up',
      command: 'takeoff'
    },
    {
      name: 'Land',
      icon: ArrowDown,
      color: 'text-red-400',
      description: 'Closed fist',
      command: 'land'
    },
    {
      name: 'Move Forward',
      icon: ArrowUp,
      color: 'text-blue-400',
      description: 'Point index finger forward',
      command: 'move_forward'
    },
    {
      name: 'Move Backward',
      icon: ArrowDown,
      color: 'text-blue-400',
      description: 'Point thumb backward',
      command: 'move_backward'
    },
    {
      name: 'Move Left',
      icon: ArrowLeft,
      color: 'text-purple-400',
      description: 'Point index finger left',
      command: 'move_left'
    },
    {
      name: 'Move Right',
      icon: ArrowRight,
      color: 'text-purple-400',
      description: 'Point index finger right',
      command: 'move_right'
    },
    {
      name: 'Rotate Left',
      icon: RotateCcw,
      color: 'text-yellow-400',
      description: 'L-shape with thumb and index',
      command: 'rotate_left'
    },
    {
      name: 'Rotate Right',
      icon: RotateCw,
      color: 'text-yellow-400',
      description: 'Reverse L-shape',
      command: 'rotate_right'
    },
    {
      name: 'Hover',
      icon: Pause,
      color: 'text-cyan-400',
      description: 'Peace sign (two fingers)',
      command: 'hover'
    },
    {
      name: 'Emergency Stop',
      icon: AlertTriangle,
      color: 'text-red-500',
      description: 'All fingers spread wide',
      command: 'emergency_stop'
    }
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Hand className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">Hand Gestures</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Position your hand clearly in front of the camera. Make sure gestures are 
          distinct and held for at least 1 second for recognition.
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
