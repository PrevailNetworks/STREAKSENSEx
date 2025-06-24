
import React, { useState } from 'react';
import type { PlayerData, StatcastMetric } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, RadarChart, PolarGrid, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';
import { FiInfo, FiMapPin, FiSun, FiWind, FiUsers, FiTrendingUp, FiBarChart2, FiUser } from 'react-icons/fi';

interface MainDisplayProps {
  player: PlayerData;
  reportDate: string; 
}

type TabKey = "verdict" | "fullAnalysis" | "statcastDeepDive";

const SectionTitle: React.FC<{ title: string, icon?: React.ReactNode, className?: string }> = ({ title, icon, className = "" }) => (
  <div className={`flex items-center mb-4 ${className}`}>
    {icon && <span className="mr-2 text-[var(--primary-glow)]">{icon}</span>}
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

// Standardized keys for Hitter vs Pitcher Radar Chart
const SHARED_RADAR_KEYS = [
    { key: "Contact", label: "Contact" },
    { key: "Power", label: "Power" },
    { key: "Discipline", label: "Discipline" },
    { key: "AvoidK", label: "Avoid K" },
    { key: "Speed", label: "Speed" },
    { key: "Adaptability", label: "Adaptability" }
];

// Keys for the new Hitter Analysis Radar chart (percentiles 0-100)
const HITTER_RADAR_METRIC_KEYS: Array<{key: string, label: string}> = [
    {key: "xBA", label: "xBA"},
    {key: "HardHitPct", label: "HardHit%"},
    {key: "AvgExitVelo", label: "Avg EV"},
    {key: "BarrelPct", label: "Barrel%"},
    {key: "ChaseRate", label: "Chase %"}, // Lower is better, so might invert for display or note it
    {key: "WhiffPct", label: "Whiff %"}  // Lower is better
];

const PITCHER_ARSENAL_COLORS = [
  '#a3e635', '#84cc16', '#6ca112', '#4d7c0f',
];

const PlayerImage: React.FC<{ player: PlayerData, size?: string }> = ({ player, size = "w-12 h-12" }) => {
  const initials = player.player.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (player.imageUrl) {
    return <img src={player.imageUrl} alt={player.player} className={`${size} rounded-full object-cover mr-3 border-2 border-[var(--border-color)]`} />;
  }
  return (
    <div className={`${size} rounded-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--primary-glow)] font-semibold text-lg mr-3`}>
      {initials || <FiUser size={24} />}
    </div>
  );
};


export const MainDisplay: React.FC<MainDisplayProps> = ({ player, reportDate }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("verdict");
  const { corePerformance, statcastValidation, matchup, synthesis, finalVerdict, playerSpecificVerdict } = player;

  const probabilityGaugeData = [{ name: 'Probability', value: finalVerdict.compositeHitProbability }];
  
  const hitterVsPitcherRadarData = SHARED_RADAR_KEYS.map(item => {
    const hitterValue = synthesis.hitterStrengths?.[item.key] ?? 0;
    const pitcherValue = synthesis.pitcherProfile?.[item.key] ?? 0; // Assuming pitcherProfile uses same keys for opposing values
    
    return {
      subject: item.label,
      [player.player]: hitterValue,
      [matchup.pitcher]: pitcherValue, 
      fullMark: 100
    };
  }).filter(d => (d[player.player] as number) > 0 || (d[matchup.pitcher] as number) > 0);


  const hitterAnalysisRadarData = HITTER_RADAR_METRIC_KEYS.map(item => ({
    subject: item.label,
    value: synthesis.hitterRadarMetrics?.[item.key] ?? 0,
    fullMark: 100
  })).filter(d => d.value > 0);

  const pitcherArsenalData = matchup.pitchVulnerabilities?.map((pitch, index) => ({
      name: pitch.pitchType,
      vulnerability: pitch.vulnerabilityScore * 100,
      color: PITCHER_ARSENAL_COLORS[index % PITCHER_ARSENAL_COLORS.length]
  })) || [];

  const renderTabContent = () => {
    switch (activeTab) {
      case "verdict":
        return (
            <div className="space-y-6">
                <div>
                    <SectionTitle title="Analyst Verdict" icon={<FiInfo />} />
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {playerSpecificVerdict || synthesis.BvPHistory || "No specific verdict available. Review full analysis for details."}
                    </p>
                </div>
                {hitterAnalysisRadarData && hitterAnalysisRadarData.length > 0 && (
                    <div>
                        <SectionTitle title="Hitter Advanced Profile" icon={<FiBarChart2 />} className="mt-6"/>
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
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        );
      case "fullAnalysis":
        return (
          <div>
            <SectionTitle title="Comprehensive Player Analysis" icon={<FiTrendingUp />} />
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-[var(--text-primary)] mb-1">Core Performance Metrics:</h4>
                <p className="text-sm text-[var(--text-secondary)]">Slash Line (2025): {corePerformance.slashLine2025}</p>
                <p className="text-sm text-[var(--text-secondary)]">OPS (2025): {corePerformance.OPS2025}</p>
                <p className="text-sm text-[var(--text-secondary)]">Active Hitting Streak: {corePerformance.activeHittingStreak.games} games {corePerformance.activeHittingStreak.details && `(${corePerformance.activeHittingStreak.details})`}</p>
              </div>
              {synthesis.predictiveModels && synthesis.predictiveModels.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-[var(--text-primary)] mb-1">Predictive Model Insights:</h4>
                    <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] pl-4">
                    {synthesis.predictiveModels.map(m => <li key={m.modelName}>{m.modelName}: {m.probability}</li>)}
                    </ul>
                </div>
              )}
            </div>
          </div>
        );
      case "statcastDeepDive":
           return (
              <div>
                  <SectionTitle title="Statcast™ Deep Dive" icon={<FiBarChart2 />} />
                  {statcastValidation && statcastValidation.length > 0 ? (
                      <ul className="space-y-1">
                          {statcastValidation.map((metric, index) => (
                              <StatcastListItem key={index} metric={metric} />
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-[var(--text-secondary)]">No detailed Statcast metrics available for this player.</p>
                  )}
              </div>
          );
      default:
        return null;
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4">
        <div className="flex items-center">
          <PlayerImage player={player} />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">{player.player}</h1>
            <p className="text-md text-[var(--text-secondary)]">{player.position}, {player.team}</p>
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--border-color)]">
        <nav className="flex space-x-1 sm:space-x-4 -mb-px" aria-label="Tabs">
          {(["verdict", "fullAnalysis", "statcastDeepDive"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors
                ${activeTab === tab 
                  ? 'border-[var(--tab-active-border)] text-[var(--primary-glow)]' 
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'}`}
            >
              {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)] min-h-[200px]">
        {renderTabContent()}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
          <SectionTitle title="Hit Probability" icon={<FiInfo />} />
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" barSize={18} data={probabilityGaugeData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" angleAxisId={0} fill="var(--primary-glow)" cornerRadius={8} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-[var(--text-primary)] text-3xl sm:text-4xl font-bold font-[var(--font-display)]">
                  {finalVerdict.compositeHitProbability}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
          <SectionTitle title="Matchup Analysis: Tale of the Tape" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Hitter vs. Pitcher Profile</h4>
              {hitterVsPitcherRadarData && hitterVsPitcherRadarData.length > 0 ? (
                <div className="w-full h-56 sm:h-64">
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={hitterVsPitcherRadarData}>
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}/>
                      <Radar name={player.player} dataKey={player.player} stroke="var(--primary-glow)" fill="var(--primary-glow)" fillOpacity={0.6} />
                      <Radar name={matchup.pitcher} dataKey={matchup.pitcher} stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.5} />
                      <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/>
                       <RechartsTooltip contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-center text-[var(--text-secondary)] h-56 sm:h-64 flex items-center justify-center">Hitter/Pitcher profile data not available.</p>}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Pitcher Arsenal Vulnerability</h4>
              {pitcherArsenalData && pitcherArsenalData.length > 0 ? (
                <div className="w-full h-56 sm:h-64 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pitcherArsenalData} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                          <XAxis type="number" domain={[0, 'dataMax + 5']} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)" tickFormatter={(value) => `${value}%`}/>
                          <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)"/>
                          <RechartsTooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}
                              itemStyle={{color: 'var(--text-primary)'}}
                              formatter={(value:number) => `${value.toFixed(1)}%`}
                          />
                          <Bar dataKey="vulnerability" barSize={15} radius={[0, 5, 5, 0]}>
                              {pitcherArsenalData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-center text-[var(--text-secondary)] h-56 sm:h-64 flex items-center justify-center">Pitcher arsenal data not available.</p>}
            </div>
          </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                <div className="bg-[var(--main-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)]">ERA</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.ERA}</span>
                </div>
                <div className="bg-[var(--main-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)]">WHIP</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.WHIP}</span>
                </div>
                <div className="bg-[var(--main-bg)] p-2 rounded">
                    <span className="block text-[var(--text-secondary)]">BAA</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{matchup.battingAverageAgainst}</span>
                </div>
            </div>
        </div>
      </div>
      
       <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
          <SectionTitle title="Contextual Factors" />
          <div className="space-y-3">
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
            <ContextualFactorItem icon={<FiUsers size={18}/>} label="Lineup Position (Est.)" value="Top 3 (Projected)" details="Maximizes plate appearances."/>
            {synthesis.BvPHistory && 
                 <ContextualFactorItem icon={<FiInfo size={18}/>} label="Batter vs Pitcher" value={synthesis.BvPHistory} />
            }
          </div>
        </div>
    </div>
  );
};
