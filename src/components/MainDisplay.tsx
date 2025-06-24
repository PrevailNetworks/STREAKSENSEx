import React, { useState } from 'react';
import type { PlayerData, StatcastMetric } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, RadarChart, PolarGrid, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FiInfo, FiMapPin, FiSun, FiWind, FiUsers } from 'react-icons/fi';

interface MainDisplayProps {
  player: PlayerData;
  reportDate: string; // To show in one of the cards or headers if needed
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


// Mock data for radar chart and pitcher arsenal until Gemini prompt is updated
const mockRadarData = [
  { subject: 'Contact/Skill', A: 85, B: 70, fullMark: 100 },
  { subject: 'Power/Hard Hit', A: 75, B: 80, fullMark: 100 },
  { subject: 'Pitch Command/Avoid K', A: 60, B: 75, fullMark: 100 },
  { subject: 'vs. LHP/RHP Split', A: 90, B: 65, fullMark: 100 },
  { subject: 'Plate Discipline', A: 70, B: 85, fullMark: 100 },
];

const mockPitcherArsenalData = [
  { name: 'vs Fastball', vulnerability: 0.15, color: '#a3e635' }, // Brighter Lime
  { name: 'vs Curveball', vulnerability: 0.22, color: '#84cc16' }, // Primary Glow
  { name: 'vs Slider', vulnerability: 0.10, color: '#6ca112' },   // Darker Lime
];


export const MainDisplay: React.FC<MainDisplayProps> = ({ player, reportDate }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("verdict");
  const { corePerformance, statcastValidation, matchup, synthesis, finalVerdict } = player;

  const probabilityGaugeData = [{ name: 'Probability', value: finalVerdict.compositeHitProbability }];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "verdict":
        return <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{synthesis.BvPHistory || "Detailed player verdict and situational analysis will appear here. This player has shown consistent performance against similar pitcher archetypes."}</p>;
      case "fullAnalysis":
        return <p className="text-sm text-[var(--text-secondary)]">Full analysis content will go here.</p>;
      case "statcastDeepDive":
        return <p className="text-sm text-[var(--text-secondary)]">Statcast deep dive content will go here.</p>;
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
        <div className="mt-3 sm:mt-0">
          <span className="bg-[var(--accent-positive)] text-xs text-green-900 font-semibold px-3 py-1.5 rounded-full">
            Generational Contact vs. Young LHP
          </span>
        </div>
      </header>

      <div className="border-b border-[var(--border-color)]">
        <nav className="flex space-x-4 -mb-px" aria-label="Tabs">
          {(["verdict", "fullAnalysis", "statcastDeepDive"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab 
                  ? 'border-[var(--tab-active-border)] text-[var(--primary-glow)]' 
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'}`}
            >
              {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
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
              <div className="w-full h-56 sm:h-64">
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockRadarData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}/>
                    <Radar name={player.player} dataKey="A" stroke="var(--primary-glow)" fill="var(--primary-glow)" fillOpacity={0.5} />
                    <Radar name={matchup.pitcher} dataKey="B" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.4} />
                    <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Pitcher Arsenal Vulnerability</h4>
               <div className="w-full h-56 sm:h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockPitcherArsenalData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 0.3]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)"/>
                        <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)"/>
                        <RechartsTooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px'}}
                            itemStyle={{color: 'var(--text-primary)'}}
                         />
                        <Bar dataKey="vulnerability" barSize={15} radius={[0, 5, 5, 0]}>
                            {mockPitcherArsenalData.map((entry, index) => (
                                <rect key={`bar-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
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
                    <span className="block text-[var(--text-secondary)]">xERA (Est.)</span>
                    <span className="block text-[var(--text-primary)] font-semibold text-sm">{(parseFloat(matchup.ERA) * 0.95).toFixed(2)}</span> {/* Mock xERA */}
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
                <ContextualFactorItem icon={<FiSun size={18}/>} label="Weather" value={synthesis.weatherConditions.forecast.split(',')[0]} details={synthesis.weatherConditions.forecast.substring(synthesis.weatherConditions.forecast.indexOf(',') + 1).trim()}/>
            }
            {/* Lineup position - not directly in data, mock or adapt if possible */}
            <ContextualFactorItem icon={<FiUsers size={18}/>} label="Lineup Position" value="Leadoff (Est.)" details="Maximizes plate appearances."/>
            {/* You might add BvP History here as well if it fits thematically */}
            {synthesis.BvPHistory && 
                 <ContextualFactorItem icon={<FiInfo size={18}/>} label="Batter vs Pitcher" value={synthesis.BvPHistory} />
            }
          </div>
        </div>
    </div>
  );
};
