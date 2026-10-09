import React from 'react'

const DEFAULT_TOPICS = [
  'AI Agents',
  'Compute & Chips',
  'Model Funding',
  'Open Source',
  'Enterprise AI',
  'Robotics',
  'AI Safety',
  'Inference Costs',
]

export default function TickerTape({ topics }) {
  const items = topics && topics.length ? topics : DEFAULT_TOPICS
  const doubled = [...items, ...items]
  return (
    <div className="tape" aria-hidden="true">
      <div className="tape-track">
        {doubled.map((t, i) => (
          <span className="tape-item" key={i}>
            <span className="tape-dot" />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
