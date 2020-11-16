import { Bounds } from '@mathigon/euclid'
import { loadLevel } from './level-loader'
import { Timer } from './timer'
import { PlayerTank } from './entities/tanks/player-tank'
import { Bullet } from './entities/bullet'
import { Entity } from './entities/entity'
import { BaseTank } from './entities/tanks/base-tank'
import { BasicWall } from './entities/walls/basic-wall'

export interface GameStateEventDetails {
  isRunning: boolean,
  playersHealth: number[],
}

const CURRENT_LEVEL = 1

export class Game extends EventTarget {
  private entities: Entity[] = []

  private isGameRunning = false

  private timer: Timer

  private tileSize = 50

  private bounds = new Bounds(0, 0, 0, 0)

  private prevGameState: GameStateEventDetails = {
    isRunning: false,
    playersHealth: [],
  }

  private getPlayers(): PlayerTank[] {
    return this.entities.filter((entity) => entity instanceof PlayerTank) as PlayerTank[]
  }

  private getPlayersHealth(): number[] {
    return this.getPlayers().map((pl) => pl.getHealth())
  }

  resize(w = this.width, h = this.height): void {
    this.width = Math.min(w, h)
    this.height = this.width
    this.tileSize = Math.min(
      this.width / this.bounds.xMax,
      this.height / this.bounds.yMax,
    )
  }

  constructor(public ctx: CanvasRenderingContext2D, public width = 500, public height = 500) {
    super()

    this.timer = new Timer(this.update.bind(this))

    const events = ['keydown', 'keyup']
    events.forEach((eventName) => {
      window.addEventListener(eventName, (e: Event) => {
        if (!this.isGameRunning) {
          return
        }
        const isKeyDown = e.type === 'keydown'
        const { code } = e as KeyboardEvent

        this.getPlayers().forEach((pl) => pl.keyboardAction(code, isKeyDown))
      })
    })
  }

  private dispatchEventIfStateChanged() {
    const newState: GameStateEventDetails = {
      isRunning: this.isGameRunning,
      playersHealth: this.getPlayersHealth(),
    }

    type T = keyof GameStateEventDetails
    const didStateChange = Object.entries(newState).some(([key, value]) => (
      this.prevGameState[key as T] !== value
    ))

    if (didStateChange) {
      this.prevGameState = newState

      this.dispatchEvent(new CustomEvent<GameStateEventDetails>('game-state', {
        detail: newState,
      }))
    }
  }

  startGame(): void {
    loadLevel(CURRENT_LEVEL).then((levelData) => {
      const { entities, mapSize } = levelData

      this.entities = entities
      this.bounds = new Bounds(0, mapSize.x, 0, mapSize.y)

      this.resize()
      this.draw()

      this.isGameRunning = true

      this.dispatchEventIfStateChanged()
      this.timer.start()
    }).catch(() => '')
  }

  stopGame(): void {
    this.isGameRunning = false
    this.clearDrawScreen()
  }

  private update(secondsPassed: number): void {
    this.entities.forEach((entity) => {
      entity.update?.(secondsPassed)
      entity.collideMapBounds?.(this.bounds)
    })

    this.entities.forEach((e1) => {
      this.entities.forEach((e2) => {
        const bothEntitiesAreWall = e1 instanceof BasicWall && e2 instanceof BasicWall
        if (!bothEntitiesAreWall && e1 !== e2) {
          e1.collide?.(e2)
        }
      })
    })

    this.entities = this.entities.filter((entity) => (
      !(entity instanceof BasicWall) || !entity.isDestroyed
    ))

    this.entities.forEach((entity) => {
      if (
        entity instanceof BaseTank
        && entity.getHealth() < 1
      ) {
        this.stopGame()
      }
    })

    this.draw()
    this.dispatchEventIfStateChanged()
  }

  private clearDrawScreen() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  private setDrawEntityStyles(lineWidth: number, { colors }: Entity) {
    const { ctx } = this

    ctx.lineWidth = lineWidth

    ctx.strokeStyle = colors.border
    ctx.fillStyle = colors.fill

    ctx.shadowColor = colors.shadow
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1
  }

  private draw() {
    this.clearDrawScreen()

    this.entities.forEach((entity) => {
      if (entity instanceof BasicWall) {
        this.drawWall(entity)
      } else if (entity instanceof BaseTank) {
        this.drawTank(entity)
        this.drawBullet(entity.bullet)
      }
    })
  }

  private drawWall<T extends BasicWall>(wall: T) {
    const { ctx, tileSize } = this
    const { p, w, h } = wall.body

    this.setDrawEntityStyles(1, wall)

    ctx.beginPath()
    ctx.rect(p.x * tileSize, p.y * tileSize, w * tileSize, h * tileSize)
    ctx.closePath()

    ctx.fill()
    ctx.stroke()
  }

  private drawTank(tank: BaseTank) {
    const { ctx, tileSize } = this

    const { points } = tank.body
    const { x, y } = points[0]

    this.setDrawEntityStyles(2, tank)

    ctx.moveTo(x * tileSize, y * tileSize)

    ctx.beginPath()
    points.forEach((point, i) => {
      if (i !== 0) {
        ctx.lineTo(point.x * tileSize, point.y * tileSize)
      }
    })
    ctx.lineTo(x * tileSize, y * tileSize)
    ctx.closePath()

    ctx.stroke()
    ctx.fill()
  }

  drawBullet(bullet: Bullet | null): void {
    if (!bullet) {
      return
    }
    const { ctx, tileSize } = this

    const { body } = bullet

    this.setDrawEntityStyles(2, bullet)

    ctx.beginPath()
    ctx.arc(
      body.c.x * tileSize,
      body.c.y * tileSize,
      body.r * tileSize,
      0,
      2 * Math.PI,
      false,
    )
    ctx.fill()
    ctx.stroke()
  }
}
