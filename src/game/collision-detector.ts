import { Vec2 } from './vec2'

export const rectIntersect = (fPos: Vec2, fSize: Vec2, sPos: Vec2, sSize: Vec2): boolean => {
  const { x: x1, y: y1 } = fPos
  const { x: x2, y: y2 } = sPos

  const { x: w1, y: h1 } = fSize
  const { x: w2, y: h2 } = sSize

  // Check x and y for overlap
  if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2) {
    return false
  }
  return true
}

interface CircleRectIntersectOpts {
  circle: {
    pos: Vec2,
    radius: number,
  },
  rect: {
    pos: Vec2,
    size: Vec2,
  },
}

export const circleRectIntersect = (opts: CircleRectIntersectOpts): boolean => {
  const { circle, rect } = opts
  const { radius, pos: cPos } = circle
  // Find the nearest point on the
  // rectangle to the center of
  // the circle
  const Xn = Math.max(rect.pos.x, Math.min(cPos.x, rect.pos.x + rect.size.x))
  const Yn = Math.max(rect.pos.y, Math.min(cPos.y, rect.pos.y + rect.size.y))

  // Find the distance between the
  // nearest point and the center
  // of the circle
  // Distance between 2 points,
  // (x1, y1) & (x2, y2) in
  // 2D Euclidean space is
  // ((x1-x2)**2 + (y1-y2)**2)**0.5
  const Dx = Xn - cPos.x
  const Dy = Yn - cPos.y
  return (Dx * Dx + Dy * Dy) <= (radius ** 2)
}
