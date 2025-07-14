import React from 'react';
import { 
  Sliders, 
  Zap, 
  Wind, 
  Target,
  ToggleLeft,
  ToggleRight,
  Gauge
} from 'lucide-react';

const FlightControls = ({ droneData }) => {
  const controlSettings = [
    {
      label: 'Flight Mode',
      value: droneData.is_flying ? 'Manual' : 'Standby',
      icon: Target,
      status: droneData.is_flying
    },
    {
      label: 'Auto Hover',
      value: Math.abs(droneData.velocity.x) < 0.1 && Math.abs(droneData.velocity.y) < 0.1 ? 'Enabled' : 'Disabled',
      icon: Wind,
      status: Math.abs(droneData.velocity.x) < 0.1 && Math.abs(droneData.velocity.y) < 0.1
    },
    {
      label: 'Gesture Control',
      value: 'Active',
      icon: Zap,
      status: true
    }
  ];

  const flightMetrics = [
    {
      label: 'Max Speed',
      value: '5.0 m/s',
      current: droneData.speed,
      max: 5.0,
      unit: 'm/s'
    },
    {
      label: 'Max Altitude',
      value: '50 m',
      current: droneData.altitude,
      max: 50,
      unit: 'm'
    },
    {
      label: 'Response Time',
      value: '0.1 s',
      current: 0.1,
      max: 1.0,
      unit: 's'
    }
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Flight Controls Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sliders className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">Flight Controls</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Monitor and configure drone flight parameters and control settings.
        </p>
      </div>

      {/* Control Status */}
      <div className="space-y-4 mb-6">
        <h4 className="text-md font-semibold text-slate-300">Control Status</h4>
        <div className="space-y-3">
          {controlSettings.map((setting, index) => {
            const Icon = setting.icon;
            const ToggleIcon = setting.status ? ToggleRight : ToggleLeft;
            return (
              <div key={index} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${setting.status ? 'text-green-400' : 'text-slate-400'}`} />
                    <span className="text-slate-300">{setting.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      setting.status ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {setting.value}
                    </span>
                    <ToggleIcon className={`h-5 w-5 ${
                      setting.status ? 'text-green-400' : 'text-slate-500'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flight Metrics */}
      <div className="space-y-4 mb-6">
        <h4 className="text-md font-semibold text-slate-300">Flight Metrics</h4>
        <div className="space-y-3">
          {flightMetrics.map((metric, index) => {
            const percentage = (metric.current / metric.max) * 100;
            return (
              <div key={index} className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm">{metric.label}</span>
                  <span className="text-blue-400 text-sm font-mono">
                    {metric.current.toFixed(1)} {metric.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>Max: {metric.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flight Limits */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-slate-300">Flight Limits</h4>
        <div className="glass-panel p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Movement Step</span>
              <span className="text-cyan-400 text-sm font-mono">0.5 m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Rotation Step</span>
              <span className="text-yellow-400 text-sm font-mono">15°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Confidence Threshold</span>
              <span className="text-green-400 text-sm font-mono">70%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Update Rate</span>
              <span className="text-purple-400 text-sm font-mono">30 FPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-300">Performance</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel p-3 text-center">
            <Gauge className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">CPU Usage</div>
            <div className="text-sm font-semibold text-blue-400">12%</div>
          </div>
          <div className="glass-panel p-3 text-center">
            <Zap className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Frame Rate</div>
            <div className="text-sm font-semibold text-green-400">30 FPS</div>
          </div>
        </div>
      </div>

      {/* Emergency Procedures */}
      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h4 className="font-semibold text-red-400 mb-2">Emergency Procedures</h4>
        <div className="text-sm text-slate-300 space-y-1">
          <p>• Emergency Stop: Spread all fingers wide</p>
          <p>• Manual Reset: Use the reset button in header</p>
          <p>• System will auto-land if battery is below 10%</p>
        </div>
      </div>
    </div>
  );
};

export default FlightControls;
