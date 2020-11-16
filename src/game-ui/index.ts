import {
  html,
  useLayoutEffect,
  useRef,
  useState,
} from 'haunted'
import { defineElement } from './define'
import { useStyles } from './use-styles'
import { Game, GameStateEventDetails } from '../game/game'

import styles from './game-shell.css'

const GameShell = (host: HTMLElement) => {
  useStyles(() => [styles])

  const gameRef = useRef<Game | null>(null)

  const [gameState, setGameState] = useState<GameStateEventDetails>({
    isRunning: false,
    playersHealth: [],
  })
  const [canvasSize, setCanvasSize] = useState(0)

  useLayoutEffect(() => {
    const canvasEl = host.shadowRoot?.querySelector('canvas')
    const ctx = canvasEl?.getContext('2d')
    if (!ctx) {
      return
    }

    gameRef.current = new Game(ctx)

    gameRef.current.addEventListener('game-state', (e: Event) => {
      const { detail } = e as CustomEvent<GameStateEventDetails>
      setGameState(detail)
    })

    const ro = new ResizeObserver(([{ contentRect }]) => {
      const size = Math.min(
        Math.min(contentRect.width, contentRect.height),
      )
      setCanvasSize(size)
    })

    ro.observe(document.documentElement)
  }, [])

  useLayoutEffect(() => {
    gameRef.current?.resize(canvasSize, canvasSize)
  }, [canvasSize])

  const onGameStartClickHandle = () => {
    gameRef.current?.startGame()
  }

  return html`
    <div id='game-state' style=${`opacity: ${gameState.isRunning ? '1' : '0'}`}>
      <h1>Health</h1>
      <div>
        ${gameState.playersHealth.map((health, index) => html`
          <div>Player ${index + 1}: ${health}</div>
        `)}
      </div>
    </div>
    <canvas width=${canvasSize} height=${canvasSize}></canvas>
    <div id='controls-overlay' ?hidden=${gameState.isRunning}>
      <button
          id='game-start-btn'
          @click=${onGameStartClickHandle}
      >
        Start game
      </button>
    </div>
  `
}

defineElement('game-shell', GameShell)
