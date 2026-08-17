import { VISION_MODES, toFeColorMatrix } from '../lib/blocks'

/**
 * Document-level SVG definitions, mounted once at the app root.
 *
 * The colour-vision filters use the same matrices the game applies, and are
 * left in the default `linearRGB` interpolation space because that is the space
 * those matrices are defined in — converting to sRGB here would make the site's
 * simulation disagree with the app's.
 */
export function SvgDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={0}
      height={0}
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Keeps diagonal and checkerboard pattern ink inside the block's
            rounded corners. Resolved in the referencing tile's 0–100 viewBox. */}
        <clipPath id="block-tile-clip" clipPathUnits="userSpaceOnUse">
          <rect x={0} y={0} width={100} height={100} rx={14} />
        </clipPath>

        {VISION_MODES.map((mode) =>
          mode.matrix ? (
            <filter
              key={mode.id}
              id={`cvd-${mode.id}`}
              colorInterpolationFilters="linearRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feColorMatrix type="matrix" values={toFeColorMatrix(mode.matrix)} />
            </filter>
          ) : null,
        )}
      </defs>
    </svg>
  )
}
