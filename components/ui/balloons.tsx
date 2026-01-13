import * as React from "react"
import { cn } from "@/lib/utils"
import { balloons, textBalloons } from "balloons-js"

export interface BalloonsProps {
  type?: "default" | "text"
  text?: string
  fontSize?: number
  color?: string
  count?: number // Number of balloon waves
  className?: string
  onLaunch?: () => void
}

const Balloons = React.forwardRef<HTMLDivElement, BalloonsProps>(
  ({ type = "default", text, fontSize = 120, color = "#000000", count = 1, className, onLaunch }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    
    const launchAnimation = React.useCallback(() => {
      if (type === "default") {
        // Trigger multiple waves based on count
        for (let i = 0; i < count; i++) {
          // Add small random delay between waves to look more natural
          setTimeout(() => {
            balloons()
          }, i * 300)
        }
      } else if (type === "text" && text) {
        textBalloons([
          {
            text,
            fontSize,
            color,
          },
        ])
      }
      
      if (onLaunch) {
        onLaunch()
      }
    }, [type, text, fontSize, color, count, onLaunch])

    // Экспортируем метод запуска анимации
    React.useImperativeHandle(ref, () => ({
      launchAnimation,
      ...(containerRef.current || {})
    }), [launchAnimation])

    return <div ref={containerRef} className={cn("balloons-container", className)} />
  }
)
Balloons.displayName = "Balloons"

export { Balloons }