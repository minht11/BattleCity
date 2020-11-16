import { Point } from '@mathigon/euclid'
import { Direction, GameLevel } from '../types/types'
import { Entity } from './entities/entity'
import { PlayerTank } from './entities/tanks/player-tank'
import { ArmoredWall } from './entities/walls/armored-wall'
import { BasicWall } from './entities/walls/basic-wall'

interface RawPlayerJson {
  colors: {
    fill: string,
    glow: string,
  },
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
  map: {
    size: {
      x: number,
      y: number,
    },
    tiles: string[],
  },
}

const parsePlayers = (jsonPlayers: RawLevelJson['players']) => {
  const parsedPlayers = jsonPlayers.map((player) => ({
    colors: player.colors,
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

const createEntityFromType = (tileCode: string, pos: Point): Entity | null => {
  switch (tileCode) {
    case '#': return new BasicWall(pos)
    case '@': return new ArmoredWall(pos)
    case '0': return new PlayerTank(pos)
    case '1': return new PlayerTank(pos)
    default: return null
  }
}

const parseMap = (jsonMap: RawLevelJson['map']) => {
  const { size, tiles } = jsonMap
  const parsedMapInRows = tiles.map((row, y) => {
    const parsedRow = [...row].map((tileCode, x) => (
      createEntityFromType(tileCode, new Point(x, y))
    ))
    return parsedRow.filter((e) => e !== null) as Entity[]
  })
  return {
    entities: parsedMapInRows.flat(),
    mapSize: new Point(size.x, size.y),
  }
}

export const loadLevel = async (levelNumber: number): Promise<GameLevel> => {
  const response = await fetch(`/levels/${levelNumber}.json`)
  const result = await response.json() as RawLevelJson

  const playersData = parsePlayers(result.players)
  const map = parseMap(result.map)

  let playerIndex = 0
  map.entities.forEach((entity) => {
    if (entity instanceof PlayerTank) {
      const data = playersData[playerIndex]
      entity.setControls(data.controls)
      entity.setColors(data.colors)
      playerIndex += 1
    }
  })

  return {
    levelNumber,
    ...map,
  }
}
