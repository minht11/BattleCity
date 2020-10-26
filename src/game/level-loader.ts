import {
  Direction,
  GameLevel,
  PlayerData,
  Tanks,
  Tiles,
} from '../types/types'
import { Vec2 } from './vec2'

interface RawPlayerJson {
  type: 'string',
  spawn: { x: number, y: number },
  controls: {
    up: string,
    down: string,
    left: string,
    right: string,
    shoot: string,
  },
}

interface RawLevelJson {
  players: RawPlayerJson[],
  map: string[],
}

const matchTankToType = (tank: string) => {
  switch (tank) {
  case 'regular': return Tanks.REGULAR_TANK
  case 'armored': return Tanks.ARMORED_TANK
  default: throw new Error('No tanks exist with that name')
  }
}

const parsePlayers = (jsonPlayers: RawLevelJson['players']): PlayerData[] => {
  const parsedPlayers = jsonPlayers.map((player) => ({
    type: matchTankToType(player.type),
    spawn: new Vec2(player.spawn.x, player.spawn.y),
    controls: {
      [player.controls.up]: Direction.UP,
      [player.controls.down]: Direction.DOWN,
      [player.controls.left]: Direction.LEFT,
      [player.controls.right]: Direction.RIGHT,
      [player.controls.shoot]: 'shoot' as const,
    },
  }))

  return parsedPlayers
}

const matchTileToType = (tileCode: string) => {
  switch (tileCode) {
    case '.': return Tiles.EMPTY
    case '#': return Tiles.REGULAR_WALL
    case '@': return Tiles.ARMORED_WALL
    case '!': return Tiles.FLAG
    default: throw new Error('No tile exist with that code.')
  }
}

const parseMap = (jsonMap: RawLevelJson['map']) => {
  const parsedMapInRows = jsonMap.map((row, y) => {
    const parsedRow = [...row].map((tileCode, x) => ({
      type: matchTileToType(tileCode),
      position: new Vec2(x, y),
    }))
    return parsedRow
  })
  return parsedMapInRows.flat()
}

export const loadLevel = async (levelNumber: number): Promise<GameLevel> => {
  const response = await fetch(`/levels/${levelNumber}.json`)
  const result = await response.json() as RawLevelJson

  return {
    levelNumber,
    players: parsePlayers(result.players),
    map: parseMap(result.map),
  }
}
