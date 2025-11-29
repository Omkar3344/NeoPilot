import React from 'react';
import { 
  Battery, 
  Gauge, 
  Navigation, 
  Timer, 
  MapPin, 
  TrendingUp,
  Plane,
  RotateCw
} from 'lucide-react';

const TelemetryPanel = ({ droneData }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBatteryColor = (level) => {
    if (level > 60) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const telemetryItems = [
    {
      icon: Battery,
      label: 'Battery',
      value: `${droneData.battery_level}%`,
      color: getBatteryColor(droneData.battery_level),
      progress: droneData.battery_level
    },
    {
      icon: Gauge,
      label: 'Speed',
      value: `${droneData.speed} m/s`,
      color: 'text-blue-400'
    },
    {
      icon: Navigation,
      label: 'Altitude',
      value: `${droneData.altitude} m`,
      color: 'text-purple-400'
    },
    {
      icon: Timer,
      label: 'Flight Time',
      value: formatTime(droneData.flight_time),
      color: 'text-cyan-400'
    },
    {
      icon: TrendingUp,
      label: 'Distance',
      value: `${droneData.total_distance} m`,
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Flight Status */}
      <div className="mb-6">
        <div className={`flex items-center space-x-3 p-4 rounded-lg border ${
          droneData.is_flying 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-slate-700/50 border-slate-600 text-slate-400'
        }`}>
          <Plane className={`h-5 w-5 ${droneData.is_flying ? 'animate-bounce' : ''}`} />
          <div>
            <div className="font-semibold">
              {droneData.is_flying ? 'IN FLIGHT' : 'GROUNDED'}
            </div>
            <div className="text-xs opacity-75">
              {droneData.is_flying ? 'Drone is airborne' : 'Drone is on the ground'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Continuous Gesture */}
      {droneData.current_gesture && droneData.is_flying && (
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-4 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse">
            <RotateCw className="h-5 w-5 animate-spin" />
            <div>
              <div className="font-semibold text-sm">CONTINUOUS MOVEMENT</div>
              <div className="text-xs opacity-90">
                {droneData.current_gesture.toUpperCase().replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Grid */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-slate-200">Flight Telemetry</h3>
        <div className="grid gap-4">
          {telemetryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${item.color}`} />
                    <span className="text-slate-300">{item.label}</span>
                  </div>
                  <span className={`font-semibold ${item.color}`}>
                    {item.value}
                  </span>
                </div>
                {item.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item.progress > 60 ? 'bg-green-500' :
                          item.progress > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Position & Rotation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Position & Orientation</h3>
        
        {/* Position */}
        <div className="glass-panel p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-slate-300 font-medium">Position (XYZ)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">X</div>
              <div className="text-blue-400 font-mono">
                {droneData.position.x.toFixed(1)}
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Y</div>
              <div className="text-green-400 font-mono">
                {droneData.position.y.toFixed(1)}
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Z</div>
              <div className="text-purple-400 font-mono">
                {droneData.position.z.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="glass-panel p-4">
          <div className="flex items-center space-x-2 mb-3">
            <RotateCw className="h-4 w-4 text-orange-400" />
            <span className="text-slate-300 font-medium">Rotation (°)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Pitch</div>
              <div className="text-red-400 font-mono">
                {droneData.rotation.pitch.toFixed(1)}°
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Yaw</div>
              <div className="text-yellow-400 font-mono">
                {droneData.rotation.yaw.toFixed(1)}°
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Roll</div>
              <div className="text-cyan-400 font-mono">
                {droneData.rotation.roll.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>

        {/* Velocity */}
        <div className="glass-panel p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-slate-300 font-medium">Velocity (m/s)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">X</div>
              <div className="text-blue-400 font-mono">
                {droneData.velocity.x.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Y</div>
              <div className="text-green-400 font-mono">
                {droneData.velocity.y.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-2 bg-slate-700/50 rounded">
              <div className="text-slate-400">Z</div>
              <div className="text-purple-400 font-mono">
                {droneData.velocity.z.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
