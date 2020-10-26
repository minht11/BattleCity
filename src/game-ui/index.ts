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

  const [isPlaying, setIsPlaying] = useState(false)
  const [canvasSize, setCanvasSize] = useState({
    width: 0,
    height: 0,
  })

  useLayoutEffect(() => {
    const canvasEl = host.shadowRoot?.querySelector('canvas')
    const ctx = canvasEl?.getContext('2d')
    if (!ctx) {
      return
    }

    gameRef.current = new Game(500, 500, ctx)

    gameRef.current.addEventListener('game-state', (e: Event) => {
      const { detail } = e as CustomEvent<GameStateEventDetails>
      setIsPlaying(detail.isGameRunning)
    })

    const ro = new ResizeObserver(([{ contentRect }]) => {
      setCanvasSize({
        width: contentRect.width,
        height: contentRect.height,
      })
    })

    ro.observe(document.documentElement)
  }, [])

  useLayoutEffect(() => {
    // gameRef.current?.resize(canvasSize.width, canvasSize.height)
  }, [canvasSize])

  const onGameStartClickHandle = () => {
    gameRef.current?.startGame()
  }

  return html`
    <div>Health</div>
    <div>
      ${gameRef.current?.getPlayersHealth().map((health, index) => html`
        <div>Player ${index + 1}: ${health}</div>
      `)}
    </div>
    <canvas width=${500} height=${500}></canvas>
    <div id='controls-overlay'>
      <button
          id='game-start-btn'
          ?hidden=${isPlaying}
          @click=${onGameStartClickHandle}
      >
        Start game
      </button>
    </div>
  `
}

defineElement('game-shell', GameShell)
