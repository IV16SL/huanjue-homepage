import { forwardRef } from 'react'

// naive-icons 里没有警告三角，按其描边风格（48x48 画布、圆角线帽、
// size/color/strokeWidth props）手画一个，用法与库内图标一致
const AlertTriangleIcon = forwardRef(function AlertTriangleIcon(props, ref) {
  const {
    size = 24,
    color = '#2A2A2A',
    strokeWidth = 3.5,
    fill = 'none',
    title,
    ...rest
  } = props
  const labelled = Boolean(title || props['aria-label'] || props.role)
  return (
    <svg
      ref={ref}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M24 9 L40 38 Q41 40 39 40 L9 40 Q7 40 8 38 Z"
        fill="#F7CD67"
      />
      <path d="M24 19 L24 27" />
      <path d="M24 32.5 L24 32.6" />
    </svg>
  )
})

AlertTriangleIcon.displayName = 'AlertTriangleIcon'

export default AlertTriangleIcon
