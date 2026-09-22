import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { BloomAnalyticsItem, BloomLevel } from '../../types';
import { BrainCircuit } from 'lucide-react';

interface BloomRadarChartProps {
  bloomAnalytics: Record<BloomLevel, BloomAnalyticsItem>;
}

export const BloomRadarChart: React.FC<BloomRadarChartProps> = ({ bloomAnalytics }) => {
  const chartData = [
    {
      subject: 'Nhận biết',
      level: 'REMEMBER',
      percentage: bloomAnalytics.REMEMBER?.percentage || 0,
      fullMark: 100,
    },
    {
      subject: 'Thông hiểu',
      level: 'UNDERSTAND',
      percentage: bloomAnalytics.UNDERSTAND?.percentage || 0,
      fullMark: 100,
    },
    {
      subject: 'Vận dụng',
      level: 'APPLY',
      percentage: bloomAnalytics.APPLY?.percentage || 0,
      fullMark: 100,
    },
    {
      subject: 'Phân tích',
      level: 'ANALYZE',
      percentage: bloomAnalytics.ANALYZE?.percentage || 0,
      fullMark: 100,
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <BrainCircuit className="w-5 h-5 text-orange-600" />
        <h3 className="font-bold text-base text-slate-800">
          Biểu Đồ Radar Năng Lực (Bloom Taxonomy)
        </h3>
      </div>

      <div className="flex-1 w-full min-h-[280px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              stroke="#cbd5e1"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xl text-xs">
                      <p className="font-bold text-slate-900 mb-1">{data.subject}</p>
                      <p className="text-emerald-700 font-semibold">
                        Mức độ đạt: {data.percentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name="Năng lực"
              dataKey="percentage"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Percentage Indicators */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
        {chartData.map((item) => (
          <div key={item.level} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-600">{item.subject}:</span>
            <span className="font-bold text-orange-700">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
