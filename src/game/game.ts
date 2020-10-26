import {
  MapTile,
  Tiles,
  Direction,
} from '../types/types'
import { loadLevel } from './level-loader'
import { Timer } from './timer'
import { Vec2 } from './vec2'
import { PlayerTank } from './entities/player-tank'
import { Bullet } from './entities/bullet'
import { circleRectIntersect, rectIntersect } from './collision-detector'

export interface GameStateEventDetails {
  isGameRunning: boolean,
}

interface DrawPointsOptions {
  points: Vec2[],
  lineWidth: number,
  fillColor: string,
  strokeColor: string,
  shadowColor: string,
}

const checkIfBulletHitSomething = (bullet: Bullet | null, pos: Vec2) => (
  bullet && circleRectIntersect({
    circle: {
      radius: bullet.radius,
      pos: bullet.position,
    },
    rect: {
      pos,
      size: new Vec2(1, 1),
    },
  })
)

const CURRENT_LEVEL = 1

export class Game extends EventTarget {
  private players: PlayerTank[] = []

  private tiles: MapTile[] = []

  protected isGameRunning = false

  private timer: Timer

  private width = 500

  private height = 500

  private tileSize = 0

  getPlayersHealth(): number[] {
    return this.players.map((pl) => pl.health)
  }

  constructor(width: number, height: number, public ctx: CanvasRenderingContext2D) {
    super()

    this.timer = new Timer(this.update.bind(this))

    loadLevel(CURRENT_LEVEL).then((levelData) => {
      this.tiles = levelData.map
      // this.enemies = levelData.tanks
      const maxY = this.tiles.reduce((acc, prev) => Math.max(prev.position.y, acc), 0)
      this.tileSize = 500 / (maxY + 1)

      this.players = levelData.players.map((pl) => (
        new PlayerTank(pl.spawn, pl.controls)
      ))

      this.draw()
    }).catch(() => '')

    const events = ['keydown', 'keyup']
    events.forEach((eventName) => {
      window.addEventListener(eventName, (e: Event) => {
        const isKeyDown = e.type === 'keydown'
        const { code } = e as KeyboardEvent

        this.players.forEach((pl) => pl.keyboardAction(code, isKeyDown))
      })
    })
  }

  private dispatchGameStateEvent() {
    this.dispatchEvent(new CustomEvent<GameStateEventDetails>('game-state', {
      detail: { isGameRunning: this.isGameRunning },
    }))
  }

  startGame(): void {
    this.isGameRunning = true

    this.dispatchGameStateEvent()
    this.timer.start()
  }

  private update(secondsPassed: number): void {
    this.players.forEach((pl) => {
      pl.update(secondsPassed)
      pl.bullet?.update(secondsPassed)
    })

    this.players.forEach((pl1) => {
      this.players.forEach((pl2) => {
        if (pl1 === pl2) {
          return
        }

        if (checkIfBulletHitSomething(pl1.bullet, pl2.position)) {
          pl1.destroyBullet()
          pl2.gotHit()
          this.dispatchGameStateEvent()
        }
      })
    })

    for (const tile of this.tiles) {
      const isRegularWall = tile.type === Tiles.REGULAR_WALL
      const isArmoredWall = tile.type === Tiles.ARMORED_WALL
      const isAWall = isRegularWall || isArmoredWall

      if (isAWall) {
        this.players.forEach((pl) => {
          if (checkIfBulletHitSomething(pl.bullet, tile.position)) {
            if (isRegularWall) {
              tile.type = Tiles.EMPTY
            }
            pl.destroyBullet()
          }

          const sizee = new Vec2(1, 1)
          if (pl.moveDirection !== Direction.STILL) {
            if (rectIntersect(pl.position, sizee, tile.position, sizee)) {
              // console.log('Is inters')
              // console.log(pl.position, tile.position)
              // console.log(pl.velocity)

              const WALL_TILE_SIZE = 1
              const { position, velocity } = pl
              const { position: tilePosition } = tile

              if (velocity.x < 0) {
                position.x = tilePosition.x + WALL_TILE_SIZE
              }

              if (velocity.x > 0) {
                position.x = tilePosition.x - WALL_TILE_SIZE
              }

              if (velocity.y < 0) {
                position.y = tilePosition.y + WALL_TILE_SIZE
              }

              if (velocity.y > 0) {
                position.y = tilePosition.y - WALL_TILE_SIZE
              }
            }
          }
        })
      }
    }
    this.draw()
  }

  private draw() {
    const { ctx, tileSize } = this

    ctx.clearRect(0, 0, this.width, this.height)

    ctx.lineWidth = 1
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowColor = 'transparent'

    this.tiles.forEach((tile) => {
      const { type, position: { x, y } } = tile

      const isArmoredWall = type === Tiles.ARMORED_WALL
      const isRegularWall = type === Tiles.REGULAR_WALL

      if (isArmoredWall) {
        ctx.fillStyle = '#fffce5'
        ctx.strokeStyle = 'transparent'
      }

      if (isRegularWall) {
        ctx.fillStyle = '#40390d'
        ctx.strokeStyle = '#fffce5'
      }

      if (isArmoredWall || isRegularWall) {
        ctx.beginPath()
        ctx.rect(x * tileSize, y * tileSize, tileSize, tileSize)
        ctx.closePath()

        ctx.fill()
        ctx.stroke()
      }
    })

    this.players.forEach((pl) => {
      this.drawPoints({
        points: pl.points,
        shadowColor: '#009ccc',
        strokeColor: '#009ccc',
        fillColor: '#e5faff',
        lineWidth: 2,
      })
      this.drawBullet(pl.bullet)
    })
  }

  private drawPoints(options: DrawPointsOptions): void {
    this.ctx.lineWidth = options.lineWidth
    this.ctx.strokeStyle = options.strokeColor
    this.ctx.fillStyle = options.fillColor

    this.ctx.shadowColor = options.shadowColor
    this.ctx.shadowBlur = 8
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 1

    const { points } = options
    const { x, y } = points[0]

    this.ctx.moveTo(x * this.tileSize, y * this.tileSize)

    this.ctx.beginPath()
    points.forEach((point, i) => {
      if (i !== 0) {
        this.ctx.lineTo(point.x * this.tileSize, point.y * this.tileSize)
      }
    })
    this.ctx.lineTo(x * this.tileSize, y * this.tileSize)
    this.ctx.closePath()

    this.ctx.stroke()
    this.ctx.fill()
  }

  drawBullet(bullet: Bullet | null): void {
    if (!bullet) {
      return
    }
    const { ctx, tileSize } = this

    const { radius, position: pos } = bullet

    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowColor = 'transparent'

    ctx.beginPath()
    ctx.arc(
      pos.x * tileSize,
      pos.y * tileSize,
      radius * tileSize,
      0,
      2 * Math.PI,
      false,
    )
    ctx.fillStyle = 'red'
    ctx.fill()
    ctx.lineWidth = 0
    ctx.strokeStyle = 'transparent'
    ctx.stroke()
  }
}
