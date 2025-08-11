import { ResponsiveContainer, BarChart, XAxis, Tooltip, Bar } from 'recharts';
import { useState } from 'react';

type WeeklyRow = {
  week: string;
  wrong_quantity: number;
  wrong_part: number;
  damaged: number;
  other: number;
};

type Key = keyof Omit<WeeklyRow, 'week'> | 'all';

export default function EvilStackedGlowingBarCard({
  title,
  data,
  labels,
}: {
  title: string;
  data: WeeklyRow[];
  labels: { wrong_quantity: string; wrong_part: string; damaged: string; other: string };
}) {
  const [active, setActive] = useState<Key>('all');
  const colors: Record<Exclude<Key, 'all'>, string> = {
    wrong_quantity: '#3b82f6',
    wrong_part: '#8b5cf6',
    damaged: '#10b981',
    other: '#f59e0b',
  };

  const GlowRect = (props: any) => {
    const { fill, x, y, width, height, dataKey, radius } = props;
    const isActive = active === 'all' ? true : active === dataKey;
    return (
      <>
        <rect
          x={x}
          y={y}
          rx={radius}
          width={width}
          height={height}
          stroke="none"
          fill={fill}
          opacity={isActive ? 1 : 0.15}
          filter={isActive && active !== 'all' ? `url(#glow-${dataKey})` : undefined}
        />
        <defs>
          <filter id={`glow-${dataKey}`} x="-200%" y="-200%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          {(['all', 'wrong_quantity', 'wrong_part', 'damaged', 'other'] as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`text-xs px-2 py-1 rounded border ${
                active === k ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {k === 'all'
                ? 'All'
                : k === 'wrong_quantity'
                ? labels.wrong_quantity
                : k === 'wrong_part'
                ? labels.wrong_part
                : k === 'damaged'
                ? labels.damaged
                : labels.other}
            </button>
          ))}
        </div>
      </div>

      <div data-testid="evil-stacked-bar">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
            <Tooltip cursor={false} />
            <Bar stackId="a" dataKey="wrong_quantity" fill={colors.wrong_quantity} barSize={10} radius={4} shape={<GlowRect dataKey="wrong_quantity" />} />
            <Bar stackId="a" dataKey="wrong_part" fill={colors.wrong_part} barSize={10} radius={4} shape={<GlowRect dataKey="wrong_part" />} />
            <Bar stackId="a" dataKey="damaged" fill={colors.damaged} barSize={10} radius={4} shape={<GlowRect dataKey="damaged" />} />
            <Bar stackId="a" dataKey="other" fill={colors.other} barSize={10} radius={4} shape={<GlowRect dataKey="other" />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


