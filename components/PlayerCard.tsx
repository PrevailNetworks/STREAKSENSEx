
import React from 'react';
import type { PlayerData, StatcastMetric, RecentPerformance, ChartDataPoint } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';

interface PlayerCardProps {
  player: PlayerData;
  cardIndex: number; // For unique chart IDs if needed, though Recharts often handles this well
}

const StatDisplay: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
  <div className={`text-center ${className}`}>
    <span className="block text-xl sm:text-2xl font-bold font-['Orbitron'] text-[var(--text-primary)]">{value}</span>
    <span className="block text-xs text-[var(--text-secondary)] uppercase">{label}</span>
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-lg font-['Orbitron'] text-[var(--primary-glow)] border-b border-[var(--border-color)] pb-2 mb-4 mt-2">
    {title}
  </h3>
);

const renderSparkline = (data: number[], color: string, idSuffix: string) => {
  if (!data || data.length === 0) return <div className="text-xs text-[var(--text-secondary)]">No data</div>;
  const chartData: ChartDataPoint[] = data.map((val, index) => ({ name: `P${index}`, value: val }));
  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};


export const PlayerCard: React.FC<PlayerCardProps> = ({ player, cardIndex }) => {
  const { corePerformance, statcastValidation, matchup, synthesis, finalVerdict } = player;

  const probabilityGaugeData = [{ name: 'Probability', value: finalVerdict.compositeHitProbability }];

  return (
    <article className="bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)] overflow-hidden backdrop-blur-sm flex flex-col">
      <header className="p-4 sm:p-6 bg-[rgba(0,191,255,0.05)] flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Orbitron'] text-[var(--text-primary)]">{player.player}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{player.team} - {player.position}</p>
        </div>
        <div className="w-24 h-24 sm:w-28 sm:h-28">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={12}
              data={probabilityGaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                angleAxisId={0}
                fill="var(--primary-glow)"
                cornerRadius={6}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--text-primary)] text-xl sm:text-2xl font-bold font-['Orbitron']"
              >
                {finalVerdict.compositeHitProbability}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-6 flex-grow">
        {/* Core Performance */}
        <section>
          <SectionTitle title="Core Performance" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <StatDisplay label="2025 BA/OBP/SLG" value={corePerformance.slashLine2025} />
            <StatDisplay label="2025 OPS" value={corePerformance.OPS2025} />
            <StatDisplay label="Active Hit Streak" value={`${corePerformance.activeHittingStreak.games} G`} />
          </div>
          {corePerformance.activeHittingStreak.details && <p className="text-xs text-[var(--text-secondary)] italic mb-4">{corePerformance.activeHittingStreak.details}</p>}
          
          <h4 className="text-md font-semibold text-[var(--text-primary)] mb-2 mt-6">Momentum (Batting Average)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              {renderSparkline(corePerformance.recentPerformance.last7GamesAvg, "var(--accent-positive)", `l7-${cardIndex}`)}
              <span className="text-xs text-[var(--text-secondary)]">Last 7 Games</span>
            </div>
            <div>
              {renderSparkline(corePerformance.recentPerformance.last15GamesAvg, "var(--primary-glow)", `l15-${cardIndex}`)}
              <span className="text-xs text-[var(--text-secondary)]">Last 15 Games</span>
            </div>
            <div>
              {renderSparkline(corePerformance.recentPerformance.last30GamesAvg, "var(--text-secondary)", `l30-${cardIndex}`)}
              <span className="text-xs text-[var(--text-secondary)]">Last 30 Games</span>
            </div>
          </div>
        </section>

        {/* Statcast Validation */}
        <section>
          <SectionTitle title="Statcast™ Validation" />
          <div className="space-y-3">
            {statcastValidation.map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-[var(--text-primary)]">{metric.label}: {metric.value}</span>
                  <span className="text-[var(--text-secondary)]">{metric.percentile}th Pctl</span>
                </div>
                <div className="w-full bg-[rgba(0,191,255,0.1)] rounded h-2.5">
                  <div
                    className="bg-[var(--accent-positive)] h-2.5 rounded"
                    style={{ width: `${metric.percentile}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Matchup & Synthesis */}
        <section>
          <SectionTitle title="Matchup & Synthesis" />
          <div className="text-sm space-y-3 text-[var(--text-secondary)]">
            <p><strong>vs. {matchup.pitcher} ({matchup.team})</strong>: {matchup.ERA} ERA, {matchup.WHIP} WHIP, BAA: {matchup.battingAverageAgainst}</p>
            {synthesis.BvPHistory && <p><strong>BvP History:</strong> {synthesis.BvPHistory}</p>}
            {synthesis.parkFactors && <p><strong>Venue:</strong> {synthesis.parkFactors.venue} ({synthesis.parkFactors.historicalTendency})</p>}
            {synthesis.weatherConditions && <p><strong>Weather:</strong> {synthesis.weatherConditions.forecast}</p>}
            <div>
              <h5 className="font-semibold text-[var(--text-primary)] mt-3 mb-1">Predictive Models:</h5>
              <ul className="list-disc list-inside pl-2">
                {synthesis.predictiveModels.map(model => (
                  <li key={model.modelName}>{model.modelName}: {model.probability}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};
