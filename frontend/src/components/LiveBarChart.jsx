import { useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

const COLORS = ['#f95b0a','#fb7a33','#fdaa6e','#f97316','#ea580c','#c2410c','#9a3412','#7c2d12','#fb923c','#fed7aa']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, votes, pct } = payload[0].payload
  return (
    <div className="card px-3 py-2.5 text-sm pointer-events-none min-w-[140px]">
      <p className="font-semibold text-ink-900 dark:text-ink-100 truncate max-w-[180px] mb-0.5">{name}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-brand-500 font-bold text-base">{votes}</span>
        <span className="text-ink-400 text-xs">{votes === 1 ? 'vote' : 'votes'}</span>
        <span className="ml-auto text-ink-500 font-mono text-xs">{pct}%</span>
      </div>
    </div>
  )
}

export default function LiveBarChart({ poll, animKey }) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0)
  const data = poll.options.map((opt, i) => ({
    name: opt.text,
    votes: opt.votes,
    pct: total > 0 ? Math.round((opt.votes / total) * 100) : 0,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div key={animKey} className="w-full animate-fade-in">
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 56)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barSize={28}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#908d88' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category" dataKey="name" width={120}
            tick={{ fontSize: 12, fill: '#706d69', fontWeight: 500 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,91,10,0.06)' }} />
          <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            <LabelList
              dataKey="pct"
              position="right"
              formatter={v => `${v}%`}
              style={{ fill: '#908d88', fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
