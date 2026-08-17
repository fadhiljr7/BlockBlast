import BlockTile from './BlockTile'
import type { Shape } from '../lib/game'

type PieceViewProps = {
  shape: Shape
  hex: string
  pattern: string
  /** Cell edge in pixels. */
  cell?: number
  gap?: number
  className?: string
}

/** A tray piece: the silhouette laid out on its own little grid. */
export default function PieceView({
  shape,
  hex,
  pattern,
  cell = 22,
  gap = 3,
  className = '',
}: PieceViewProps) {
  const filled = new Set(shape.cells.map(({ row, col }) => `${row}:${col}`))

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${shape.width}, ${cell}px)`,
        gridAutoRows: `${cell}px`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: shape.height * shape.width }, (_, index) => {
        const row = Math.floor(index / shape.width)
        const col = index % shape.width
        return filled.has(`${row}:${col}`) ? (
          <BlockTile key={index} hex={hex} pattern={pattern} scale={Math.round(cell * 0.55)} />
        ) : (
          <span key={index} />
        )
      })}
    </div>
  )
}
