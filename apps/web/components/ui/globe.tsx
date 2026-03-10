"use client"

import createGlobe, { COBEOptions } from "cobe"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 3,
  mapSamples: 40000,
  mapBrightness: 1.8,
  baseColor: [0.92, 0.92, 0.92],
  markerColor: [0.6, 0.6, 0.6],
  glowColor: [1, 1, 1],
  markers: [
    { location: [40.7128, -74.006], size: 0.06 },
    { location: [51.5074, -0.1278], size: 0.06 },
    { location: [35.6762, 139.6503], size: 0.05 },
    { location: [-33.8688, 151.2093], size: 0.04 },
    { location: [1.3521, 103.8198], size: 0.05 },
    { location: [37.7749, -122.4194], size: 0.06 },
    { location: [48.8566, 2.3522], size: 0.05 },
    { location: [55.7558, 37.6173], size: 0.04 },
    { location: [-23.5505, -46.6333], size: 0.05 },
    { location: [19.4326, -99.1332], size: 0.04 },
    { location: [28.6139, 77.209], size: 0.05 },
    { location: [39.9042, 116.4074], size: 0.06 },
    { location: [25.2048, 55.2708], size: 0.04 },
    { location: [-34.6037, -58.3816], size: 0.03 },
    { location: [41.0082, 28.9784], size: 0.04 },
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string
  config?: COBEOptions
}) {
  let phi = 0
  let width = 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  const [r, setR] = useState(0)

  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      setR(delta / 200)
    }
  }

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.005
      state.phi = phi + r
      state.width = width * 2
      state.height = width * 2
    },
    [r],
  )

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth
    }
  }

  useEffect(() => {
    window.addEventListener("resize", onResize)
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    })

    setTimeout(() => (canvasRef.current!.style.opacity = "1"))
    return () => globe.destroy()
  }, [])

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}
