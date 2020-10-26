import { Vec2 } from './vec2'

export const createVec2List = (count: number): Vec2[] => (
  Array.from({ length: count }, () => new Vec2(0, 0))
)
