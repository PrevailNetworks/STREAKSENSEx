
import React, { useState, useMemo } from 'react';
import type { KeyTableSynopsis, KeyTableSynopsisData } from '../types';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface SynopsisTableProps {
  synopsis: KeyTableSynopsis;
}

type SortKey = keyof KeyTableSynopsisData | null;
type SortOrder = 'asc' | 'desc';

export const SynopsisTable: React.FC<SynopsisTableProps> = ({ synopsis }) => {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedData = useMemo(() => {
    let dataToSort = [...synopsis.data];
    if (sortKey) {
      dataToSort.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        // Handle numeric strings like "85.5%" or numbers for streak
        const numA = parseFloat(String(valA).replace('%',''));
        const numB = parseFloat(String(valB).replace('%',''));

        let comparison = 0;
        if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA > numB ? 1 : (numA < numB ? -1 : 0);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA > valB ? 1 : (valA < valB ? -1 : 0);
        }
        
        return sortOrder === 'asc' ? comparison : comparison * -1;
      });
    }
    return dataToSort;
  }, [synopsis.data, sortKey, sortOrder]);

  const requestSort = (key: keyof KeyTableSynopsisData) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: keyof KeyTableSynopsisData) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />;
  };
  
  // Map headers to KeyTableSynopsisData keys. This assumes headers are somewhat predictable.
  // A more robust solution might involve a mapping object if headers can vary wildly.
  const headerToKeyMap: Record<string, keyof KeyTableSynopsisData> = {
    "Player": "player",
    "Team": "team",
    "Pos": "pos",
    "Composite Prob.": "compositeProb",
    "Neural Net Prob.": "modelXProb", // Example, adjust if header changes
    "Streak (Games)": "streak"
  };


  return (
    <section className="bg-[var(--bg-card)] p-6 rounded-lg shadow-xl border border-[var(--border-color)] backdrop-blur-sm">
      <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-4">Top Recommendations Synopsis</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm text-left text-[var(--text-secondary)]">
          <thead className="text-xs text-[var(--text-primary)] uppercase bg-[rgba(132,204,22,0.05)]"> {/* Updated background color */}
            <tr>
              {synopsis.headers.map((header, index) => {
                const keyForSort = headerToKeyMap[header];
                return (
                  <th key={index} scope="col" className="px-6 py-3 cursor-pointer select-none" onClick={() => keyForSort && requestSort(keyForSort)}>
                    {header} {keyForSort && getSortIcon(keyForSort)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--border-color)] hover:bg-[rgba(132,204,22,0.03)]"> {/* Updated hover background for consistency */}
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 text-[var(--text-primary)]">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {synopsis.notes && synopsis.notes.length > 0 && (
        <div className="mt-4 text-xs text-[var(--text-secondary)]">
          {synopsis.notes.map((note, index) => (
            <p key={index}>* {note}</p>
          ))}
        </div>
      )}
    </section>
  );
};