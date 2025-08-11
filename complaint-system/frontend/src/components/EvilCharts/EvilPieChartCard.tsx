import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

type PieDatum = { label: string; value: number };

export default function EvilPieChartCard({ title, data }: { title: string; data: PieDatum[] }) {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div data-testid="evil-pie-chart" aria-label="pie-chart">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <defs>
              {/* optional gradients could be added here */}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              isAnimationActive
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


