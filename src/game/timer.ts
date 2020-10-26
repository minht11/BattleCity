export class Timer {
  private prevTime = 0

  private isRunning = false

  constructor(private tickFn: (now: number) => void) {
    this.tick = this.tick.bind(this)
  }

  private tick(now: number): void {
    if (!this.isRunning) {
      return
    }

    if (this.prevTime === -1) {
      this.prevTime = now
    }

    const secondsPassed = (now - this.prevTime) / 1000
    this.prevTime = now

    this.tickFn(secondsPassed)
    window.requestAnimationFrame(this.tick)
  }

  start(): void {
    this.prevTime = -1
    this.isRunning = true
    window.requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.isRunning = false
  }
}
