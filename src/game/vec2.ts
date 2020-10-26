export class Vec2 {
  constructor(public x: number, public y: number) {}

  set(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  add(x: number, y: number): void {
    this.x += x
    this.y += y
  }

  equals(value: Vec2): boolean {
    return this.x === value.x && this.y === value.y
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }
}
