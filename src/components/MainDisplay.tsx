
import React, { useState, useEffect } from 'react'; // Added useEffect
import type { PlayerData, StatcastMetric } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, RadarChart, PolarGrid, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';
import { FiInfo, FiMapPin, FiSun, FiWind, FiUsers, FiTrendingUp, FiBarChart2, FiUser, FiWatch } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';

interface MainDisplayProps {
  player: PlayerData;
  reportDate: string; 
}

const SectionTitle: React.FC<{ title: string, icon?: React.ReactNode, className?: string }> = ({ title, icon, className = "" }) => (
  <div className={`flex items-center mb-4 ${className}`}>
    {icon && <span className="mr-2 text-[var(--primary-glow)] text-lg">{icon}</span>}
    <h3 className="text-lg font-[var(--font-display)] text-[var(--primary-glow)]">
      {title}
    </h3>
  </div>
);

const ContextualFactorItem: React.FC<{ icon: React.ReactNode; label: string; value: string; details?: string }> = ({ icon, label, value, details }) => (
    <div className="flex items-start text-sm">
        <span className="mr-3 mt-1 text-[var(--icon-color)]">{icon}</span>
        <div>
            <p><span className="font-semibold text-[var(--text-primary)]">{label}:</span> {value}</p>
            {details && <p className="text-xs text-[var(--text-secondary)]">{details}</p>}
        </div>
    </div>
);

const StatcastListItem: React.FC<{ metric: StatcastMetric }> = ({ metric }) => (
    <li className="py-2">
        <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-[var(--text-primary)] font-medium">{metric.label}: <span className="font-bold">{metric.value}</span></span>
            <span className="text-[var(--text-secondary)]">{metric.percentile}th Pctl</span>
        </div>
        <div className="w-full bg-[rgba(132,204,22,0.1)] rounded h-2.5">
            <div
                className="bg-[var(--accent-positive)] h-2.5 rounded"
                style={{ width: `${metric.percentile}%` }}
                aria-valuenow={metric.percentile}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
                aria-label={`${metric.label} percentile`}
            ></div>
        </div>
    </li>
);

const SHARED_RADAR_KEYS = [
    { key: "Contact", label: "Contact" }, { key: "Power", label: "Power" },
    { key: "Discipline", label: "Discipline" }, { key: "AvoidK", label: "Avoid K" },
    { key: "Speed", label: "Speed" }, { key: "Adaptability", label: "Adaptability" }
];

const HITTER_RADAR_METRIC_KEYS: Array<{key: string, label: string}> = [
    {key: "xBA", label: "xBA"}, {key: "HardHitPct", label: "HardHit%"},
    {key: "AvgExitVelo", label: "Avg EV"}, {key: "BarrelPct", label: "Barrel%"},
    {key: "ChaseRate", label: "Chase %"}, {key: "WhiffPct", label: "Whiff %"}
];

const PITCHER_ARSENAL_COLORS = ['#a3e635', '#84cc16', '#6ca112', '#4d7c0f', '#365903'];

const PlayerImage: React.FC<{ player: PlayerData, size?: string }> = ({ player, size = "w-16 h-16 sm:w-20 sm:h-20" }) => {
  const [imageError, setImageError] = useState(false);
  const initials = player.player.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const imageKey = player.mlbId || player.imageUrl || player.player; // Unique key for re-render

  useEffect(() => {
    setImageError(false); // Reset error state when player image source changes
  }, [imageKey]);

  const handleImageError = () => {
    setImageError(true);
  };

  let imageUrlToLoad: string | undefined = undefined;

  if (player.mlbId && !imageError) {
    imageUrlToLoad = `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${player.mlbId}/headshot/67/current`;
  } else if (player.imageUrl && !imageError) {
    if (!player.mlbId) {
        imageUrlToLoad = player.imageUrl;
    }
  }
  
  if (imageUrlToLoad && !imageError) {
    return <img 
             key={imageKey} // Add key here
             src={imageUrlToLoad} 
             alt={player.player} 
             className={`${size} rounded-full object-cover mr-4 border-2 border-[var(--border-color)] shadow-md`}
             onError={handleImageError} 
           />;
  }

  return (
    <div key={`${imageKey}-initials`} // Add key here
      className={`${size} rounded-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--primary-glow)] font-bold text-xl sm:text-2xl mr-4 shadow-md`}>
      {initials || <FiUser size={Math.floor(parseInt(size.split('-')[1] || '16') / 2) || 24} />}
    </div>
  );
};


export const MainDisplay: React.FC<MainDisplayProps> = ({ player, reportDate }) => {
  const { matchup, synthesis, finalVerdict, playerSpecificVerdict } = player;

  const probabilityGaugeData = [{ name: 'Probability', value: finalVerdict.compositeHitProbability }];
  
  const hitterVsPitcherRadarData = SHARED_RADAR_KEYS.map(item => ({
    subject: item.label,
    [player.player]: synthesis.hitterStrengths?.[item.key] ?? 0,
    [matchup.pitcher]: synthesis.pitcherProfile?.[item.key] ?? 0, 
    fullMark: 100
  })).filter(d => (d[player.player] as number) > 0 || (d[matchup.pitcher] as number) > 0);

  const hitterAnalysisRadarData = HITTER_RADAR_METRIC_KEYS.map(item => ({
    subject: item.label,
    value: synthesis.hitterRadarMetrics?.[item.key] ?? 0,
    fullMark: 100
  })).filter(d => d.value > 0);

  const pitcherArsenalData = matchup.pitchVulnerabilities?.map((pitch, index) => ({
      name: pitch.pitchType,
      vulnerability: pitch.vulnerabilityScore * 100, // Assuming score is 0-1, convert to 0-100
      color: PITCHER_ARSENAL_COLORS[index % PITCHER_ARSENAL_COLORS.length]
  })) || [];

  return (
    <div className="max-w-full lg:max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4">
        <div className="flex items-center">
          <PlayerImage player={player} />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">{player.player}</h1>
            <p className="text-md text-[var(--text-secondary)]">{player.position}, {player.team}</p>
          </div>
        </div>
         <div className="mt-3 sm:mt-0 text-right">
             <span className="block text-xs text-[var(--text-secondary)]">Report Date</span>
             <span className="text-sm font-semibold text-[var(--text-primary)]">{reportDate}</span>
         </div>
      </header>
      
      <section className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--border-color)]">
        <MarkdownRenderer content={playerSpecificVerdict || "Detailed analysis for this player is currently unavailable."} />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--border-color)]">
          <SectionTitle title="Hit Probability" icon={<FiTrendingUp />} />
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" barSize={18} data={probabilityGaugeData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" angleAxisId={0} fill="var(--primary-glow)" cornerRadius={8} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-[var(--text-primary)] text-3xl sm:text-4xl font-bold font-[var(--font-display)]">
                  {finalVerdict.compositeHitProbability}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {hitterAnalysisRadarData && hitterAnalysisRadarData.length > 0 && (
            <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--border-color)]">
                <SectionTitle title="Hitter Advanced Profile" icon={<FiBarChart2 />} />
                <div className="w-full h-64 sm:h-72">
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={hitterAnalysisRadarData}>
                            <PolarGrid stroke="var(--border-color)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}/>
                            <Radar name={player.player} dataKey="value" stroke="var(--primary-glow)" fill="var(--primary-glow)" fillOpacity={0.7} />
                            <RechartsTooltip 
                                contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}
                                formatter={(value: number, name: string, props: any) => [`${props.payload.subject}: ${value}%`, null]}
                                wrapperStyle={{zIndex: 1000}}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--border-color)] space-y-3">
          <SectionTitle title="Contextual Factors" icon={<FiWatch />} />
            {synthesis.parkFactors && 
                <ContextualFactorItem icon={<FiMapPin size={18}/>} label="Venue" value={synthesis.parkFactors.venue} details={synthesis.parkFactors.historicalTendency}/>
            }
            {synthesis.weatherConditions && 
                <ContextualFactorItem 
                    icon={synthesis.weatherConditions.forecast.toLowerCase().includes("wind") ? <FiWind size={18}/> : <FiSun size={18}/>} 
                    label="Weather" 
                    value={synthesis.weatherConditions.forecast.split(',')[0]} 
                    details={synthesis.weatherConditions.forecast.substring(synthesis.weatherConditions.forecast.indexOf(',') + 1).trim()}/>
            }
            {synthesis.BvPHistory && 
                 <ContextualFactorItem icon={<FiUsers size={18}/>} label="Batter vs Pitcher" value={synthesis.BvPHistory} />
            }
            {!synthesis.parkFactors && !synthesis.weatherConditions && !synthesis.BvPHistory &&
                 <p className="text-sm text-[var(--text-secondary)]">No specific contextual factors highlighted.</p>
            }
        </div>
      </div>
      
      <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--border-color)]">
          <SectionTitle title="Matchup Analysis: Tale of the Tape" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Hitter vs. Pitcher Profile</h4>
              {hitterVsPitcherRadarData && hitterVsPitcherRadarData.length > 0 ? (
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={hitterVsPitcherRadarData}>
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}/>
                      <Radar name={player.player} dataKey={player.player} stroke="var(--primary-glow)" fill="var(--primary-glow)" fillOpacity={0.6} />
                      <Radar name={matchup.pitcher} dataKey={matchup.pitcher} stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.5} />
                      <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/>
                       <RechartsTooltip 
                        contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}
                        wrapperStyle={{zIndex: 1000}}
                       />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-center text-[var(--text-secondary)] h-64 sm:h-72 flex items-center justify-center">Hitter/Pitcher profile data not available.</p>}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Pitcher Arsenal Vulnerability</h4>
              {pitcherArsenalData && pitcherArsenalData.length > 0 ? (
                <div className="w-full h-64 sm:h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pitcherArsenalData} layout="vertical" margin={{ top: 0, right: 25, left: 10, bottom: 0 }}>
                          <XAxis type="number" domain={[0, 'dataMax + 10']} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)" tickFormatter={(value) => `${value}%`}/>
                          <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)"/>
                          <RechartsTooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}
                              itemStyle={{color: 'var(--text-primary)'}}
                              formatter={(value:number) => `${value.toFixed(1)}%`}
                              wrapperStyle={{zIndex: 1000}}
                          />
                          <Bar dataKey="vulnerability" barSize={15} radius={[0, 5, 5, 0]}>
                              {pitcherArsenalData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-center text-[var(--text-secondary)] h-64 sm:h-72 flex items-center justify-center">Pitcher arsenal data not available.</p>}
            </div>
          </div>
            <div className="grid grid-cols-3 gap-2 mt-6 text-center text-xs border-t border-[var(--border-color)] pt-4">
                <div className="bg-[var(--sidebar-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)] uppercase">Pitcher ERA</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.ERA}</span>
                </div>
                <div className="bg-[var(--sidebar-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)] uppercase">Pitcher WHIP</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.WHIP}</span>
                </div>
                <div className="bg-[var(--sidebar-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)] uppercase">Pitcher BAA</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.battingAverageAgainst}</span>
                </div>
            </div>
        </div>
    </div>
  );
};
