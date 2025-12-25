import { useEffect, useRef, useState } from 'react'

/**
 * FloatingGradientOrb - A beautiful gradient orb that subtly follows the cursor
 * with a smooth parallax effect.
 *
 * Features:
 * - Smooth cursor tracking with parallax effect
 * - Animated gradient colors
 * - Blur and opacity effects for dreamy appearance
 * - Performance optimized with RAF
 * - Responsive sizing
 */
export default function FloatingGradientOrb({
    // Customization props
    size = 600,                    // Size of the orb in pixels
    parallaxStrength = 0.05,       // How much the orb follows cursor (0-1)
    animationDuration = 8,         // Duration of gradient animation in seconds
    blur = 120,                    // Blur amount in pixels
    opacity = 0.4,                 // Orb opacity (0-1)
    colors = [                     // Gradient colors (supports multiple)
        '#3b82f6',  // blue-500
        '#8b5cf6',  // purple-500
        '#ec4899'   // pink-500
    ],
    className = ''
}) {
    const orbRef = useRef(null)
    const mousePositionRef = useRef({ x: 0, y: 0 })
    const currentPositionRef = useRef({ x: 0, y: 0 })
    const rafRef = useRef(null)

    // Smooth lerp function for smooth movement
    const lerp = (start, end, factor) => {
        return start + (end - start) * factor
    }

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = (e.clientY / window.innerHeight) * 2 - 1

            mousePositionRef.current = { x, y }
        }

        // Animation loop for smooth parallax
        const animate = () => {
            if (orbRef.current) {
                // Smooth interpolation for parallax effect
                currentPositionRef.current.x = lerp(
                    currentPositionRef.current.x,
                    mousePositionRef.current.x * parallaxStrength * 100,
                    0.05 // Smoothing factor
                )
                currentPositionRef.current.y = lerp(
                    currentPositionRef.current.y,
                    mousePositionRef.current.y * parallaxStrength * 100,
                    0.05
                )

                // Apply transform
                orbRef.current.style.transform = `translate(
                    ${currentPositionRef.current.x}px,
                    ${currentPositionRef.current.y}px
                )`
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        // Start listening and animating
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        rafRef.current = requestAnimationFrame(animate)

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [parallaxStrength])

    // Generate gradient stops
    const gradientStops = colors.map((color, index) => {
        const percentage = (index / (colors.length - 1)) * 100
        return `${color} ${percentage}%`
    }).join(', ')

    return (
        <div
            ref={orbRef}
            className={`pointer-events-none absolute ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle, ${gradientStops})`,
                borderRadius: '50%',
                filter: `blur(${blur}px)`,
                opacity: opacity,
                willChange: 'transform',
                transition: 'opacity 0.3s ease',
                animation: `float ${animationDuration}s ease-in-out infinite`
            }}
        >
            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: scale(1) rotate(0deg);
                    }
                    33% {
                        transform: scale(1.1) rotate(120deg);
                    }
                    66% {
                        transform: scale(0.9) rotate(240deg);
                    }
                }
            `}</style>
        </div>
    )
}
