import { Point } from '@mathigon/euclid'
import { Direction } from '../types/types'
import { Entity, EntityColors } from './entities/entity'
import { PlayerControls, PlayerTank } from './entities/tanks/player-tank'
import { ArmoredWall } from './entities/walls/armored-wall'
import { BasicWall } from './entities/walls/basic-wall'

interface RawPlayerJson {
  spawn: string,
  colors: {
    fill: string,
    glow: string,
  },
  controls: {
    up: string,
    down: string,
    left: string,
    right: string,
    fire: string,
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

interface ParsedPlayer {
  colors: EntityColors,
  controls: PlayerControls,
}

const parsePlayers = (jsonPlayers: RawLevelJson['players']) => {
  const playersData = new Map<string, ParsedPlayer>()

  jsonPlayers.forEach((player) => {
    const { colors, controls } = player
    const value = {
      colors: {
        fill: colors.fill,
        border: colors.glow,
        shadow: colors.glow,
      },
      controls: {
        [controls.up]: Direction.UP,
        [controls.down]: Direction.DOWN,
        [controls.left]: Direction.LEFT,
        [controls.right]: Direction.RIGHT,
        [controls.fire]: 'fire' as const,
      },
    }
    playersData.set(player.spawn, value)
  })

  return playersData
}

type ParsedPlayers = ReturnType<typeof parsePlayers>

const mapTileCodeToEntity = (tileCode: string) => {
  switch (tileCode) {
    case '#': return BasicWall
    case '@': return ArmoredWall
    case '0': return PlayerTank
    case '1': return PlayerTank
    default: return null
  }
}

const createEntity = (tileCode: string, p: Point, playersData: ParsedPlayers) => {
  const EntityClass = mapTileCodeToEntity(tileCode)

  if (EntityClass === BasicWall || EntityClass === ArmoredWall) {
    return new EntityClass(p)
  }
  const playerData = playersData.get(tileCode)
  if (EntityClass === PlayerTank && playerData) {
    return new EntityClass(playerData.controls, p, playerData.colors)
  }
  return null
}

export interface GameLevel {
  levelNumber: number,
  entities: Entity[],
  mapSize: Point,
}

const parseLevel = (levelJSON: RawLevelJson) => {
  const playersData = parsePlayers(levelJSON.players)

  const { map } = levelJSON

  const parsedMapInRows = map.tiles.map((row, y) => {
    const parsedRow = [...row].map((tileCode, x) => (
      createEntity(tileCode, new Point(x, y), playersData)
    ))
    return parsedRow.filter((e) => e !== null) as Entity[]
  })

  return {
    entities: parsedMapInRows.flat(),
    mapSize: new Point(map.size.x, map.size.y),
  }
}

export const loadLevel = async (levelNumber: number): Promise<GameLevel> => {
  const response = await fetch(`/levels/${levelNumber}.json`)
  const result = await response.json() as RawLevelJson

  return {
    levelNumber,
    ...parseLevel(result),
  }
}
