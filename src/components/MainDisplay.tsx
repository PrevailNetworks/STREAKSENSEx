
import React, { useState } from 'react';
import type { PlayerData, StatcastMetric } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, RadarChart, PolarGrid, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';
import { FiInfo, FiMapPin, FiSun, FiWind, FiUsers, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';

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


const RADAR_CHART_KEYS = [
    { key: "ContactSkill", label: "Contact" },
    { key: "PowerHardHit", label: "Power" },
    { key: "PitchRecognition", label: "Pitch Rec." },
    { key: "PlateDiscipline", label: "Discipline" },
    { key: "vsRHP", label: "vs RHP" }, // Example, could be dynamic
    { key: "vsLHP", label: "vs LHP" }  // Example, could be dynamic
];

const PITCHER_ARSENAL_COLORS = [
  '#a3e635', // Brighter Lime
  '#84cc16', // Primary Glow
  '#6ca112', // Darker Lime
  '#4d7c0f', // Even Darker
];


export const MainDisplay: React.FC<MainDisplayProps> = ({ player, reportDate }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("verdict");
  const { corePerformance, statcastValidation, matchup, synthesis, finalVerdict, playerSpecificVerdict } = player;

  const probabilityGaugeData = [{ name: 'Probability', value: finalVerdict.compositeHitProbability }];
  
  const radarData = RADAR_CHART_KEYS.map(item => {
    const hitterValue = synthesis.hitterStrengths ? (synthesis.hitterStrengths[item.key] ?? 0) : 0;
    // For pitcher, we might need a mapping if keys differ, or use specific pitcher profile keys
    // For simplicity, let's assume pitcherProfile might have corresponding weaknesses or general ratings
    const pitcherValue = synthesis.pitcherProfile ? (synthesis.pitcherProfile[`vs${item.label.replace(/\s+/g, '')}`] ?? synthesis.pitcherProfile[item.key] ?? 0) : 0;
    
    // Explicitly define the structure for type clarity
    const dataPoint: { subject: string; fullMark: number; [key: string]: string | number } = {
      subject: item.label,
      fullMark: 100
    };
    dataPoint[player.player] = hitterValue;
    dataPoint[matchup.pitcher] = pitcherValue;
    return dataPoint;

  }).filter(d => {
      // Assert that these dynamically accessed properties are numbers for the comparison
      const playerValue = d[player.player] as number;
      const pitcherValue = d[matchup.pitcher] as number;
      return playerValue > 0 || pitcherValue > 0;
  });

  const pitcherArsenalData = matchup.pitchVulnerabilities?.map((pitch, index) => ({
      name: pitch.pitchType,
      vulnerability: pitch.vulnerabilityScore * 100, // Assuming score is 0-1, convert to 0-100 for chart display
      color: PITCHER_ARSENAL_COLORS[index % PITCHER_ARSENAL_COLORS.length]
  })) || [];


  const renderTabContent = () => {
    switch (activeTab) {
      case "verdict":
        return (
            <div>
                <SectionTitle title="Analyst Verdict" icon={<FiInfo />} />
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {playerSpecificVerdict || synthesis.BvPHistory || "No specific verdict available. Review full analysis for details."}
                </p>
                {/* Optionally add BvP if not in verdict */}
                {!playerSpecificVerdict && synthesis.BvPHistory && (
                    <>
                        <h4 className="text-md font-semibold text-[var(--text-primary)] mt-4 mb-2">Batter vs. Pitcher History</h4>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{synthesis.BvPHistory}</p>
                    </>
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
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">{player.player}</h1>
          <p className="text-md text-[var(--text-secondary)]">{player.position}, {player.team}</p>
        </div>
        {/* TODO: The tag below needs to be dynamic based on AI analysis if possible, or removed if too static */}
        {/* <div className="mt-3 sm:mt-0">
          <span className="bg-[var(--accent-positive)] text-xs text-green-900 font-semibold px-3 py-1.5 rounded-full">
            Generational Contact vs. Young LHP 
          </span>
        </div> */}
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

      <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)] min-h-[100px]">
        {renderTabContent()}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hit Probability Card */}
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

        {/* Matchup Analysis Card */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
          <SectionTitle title="Matchup Analysis: Tale of the Tape" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Hitter vs. Pitcher Strengths</h4>
              {radarData && radarData.length > 0 ? (
                <div className="w-full h-56 sm:h-64">
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
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
              ) : <p className="text-xs text-center text-[var(--text-secondary)] h-56 sm:h-64 flex items-center justify-center">Hitter/Pitcher strength data not available.</p>}
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
      
      {/* Contextual Factors Card */}
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
            {/* TODO: Lineup position could be dynamic if AI provides it */}
            <ContextualFactorItem icon={<FiUsers size={18}/>} label="Lineup Position (Est.)" value="Top 3 (Projected)" details="Maximizes plate appearances."/>
            {synthesis.BvPHistory && 
                 <ContextualFactorItem icon={<FiInfo size={18}/>} label="Batter vs Pitcher" value={synthesis.BvPHistory} />
            }
          </div>
        </div>
    </div>
  );
};
