/**
 * FloatingGradientOrb - Usage Examples
 * ====================================
 *
 * This file demonstrates different ways to use the FloatingGradientOrb component
 * for various visual effects and styles.
 */

import FloatingGradientOrb from './FloatingGradientOrb'

// ============================================
// Example 1: Default Usage (Minimal)
// ============================================
export function Example1_Default() {
    return (
        <div className="relative h-screen">
            <FloatingGradientOrb />
            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-4xl font-bold">Default Floating Orb</h1>
            </div>
        </div>
    )
}

// ============================================
// Example 2: Hero Section with Multiple Orbs
// ============================================
export function Example2_HeroSection() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            {/* Large primary orb - top left */}
            <FloatingGradientOrb
                size={700}
                parallaxStrength={0.1}
                animationDuration={10}
                blur={150}
                opacity={0.4}
                colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                className="top-10 left-10 -z-10"
            />

            {/* Medium secondary orb - top right */}
            <FloatingGradientOrb
                size={500}
                parallaxStrength={0.07}
                animationDuration={12}
                blur={120}
                opacity={0.35}
                colors={['#ec4899', '#f59e0b', '#ef4444']}
                className="top-20 right-10 -z-10"
            />

            {/* Small accent orb - bottom center */}
            <FloatingGradientOrb
                size={350}
                parallaxStrength={0.05}
                animationDuration={15}
                blur={100}
                opacity={0.3}
                colors={['#10b981', '#3b82f6', '#6366f1']}
                className="bottom-20 left-1/2 -translate-x-1/2 -z-10"
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                <h1 className="text-6xl font-bold text-center mb-6">
                    Beautiful Gradient Orbs
                </h1>
                <p className="text-xl text-gray-600 text-center max-w-2xl">
                    Subtle parallax effect that follows your cursor
                </p>
            </div>
        </section>
    )
}

// ============================================
// Example 3: Monochrome Blue Theme
// ============================================
export function Example3_MonochromeBlue() {
    return (
        <div className="relative h-screen bg-slate-900">
            <FloatingGradientOrb
                size={600}
                parallaxStrength={0.08}
                blur={140}
                opacity={0.5}
                colors={['#0ea5e9', '#3b82f6', '#6366f1']} // cyan to blue to indigo
                className="top-1/4 left-1/4 -z-10"
            />

            <FloatingGradientOrb
                size={500}
                parallaxStrength={0.06}
                blur={130}
                opacity={0.4}
                colors={['#3b82f6', '#6366f1', '#8b5cf6']} // blue to indigo to violet
                className="bottom-1/4 right-1/4 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-5xl font-bold text-white">Blue Monochrome</h1>
            </div>
        </div>
    )
}

// ============================================
// Example 4: Warm Sunset Theme
// ============================================
export function Example4_SunsetTheme() {
    return (
        <div className="relative h-screen bg-gradient-to-br from-orange-50 to-pink-50">
            <FloatingGradientOrb
                size={650}
                parallaxStrength={0.1}
                animationDuration={8}
                blur={160}
                opacity={0.45}
                colors={['#f97316', '#f59e0b', '#fbbf24']} // orange to amber to yellow
                className="top-1/3 left-1/4 -z-10"
            />

            <FloatingGradientOrb
                size={550}
                parallaxStrength={0.08}
                animationDuration={11}
                blur={140}
                opacity={0.4}
                colors={['#ec4899', '#f43f5e', '#f97316']} // pink to rose to orange
                className="bottom-1/3 right-1/4 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    Sunset Vibes
                </h1>
            </div>
        </div>
    )
}

// ============================================
// Example 5: Minimal Single Orb
// ============================================
export function Example5_MinimalSingle() {
    return (
        <div className="relative h-screen bg-white">
            <FloatingGradientOrb
                size={800}
                parallaxStrength={0.12}
                animationDuration={14}
                blur={180}
                opacity={0.25}
                colors={['#8b5cf6', '#a78bfa']} // purple gradient
                className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">
                        Minimalist
                    </h1>
                    <p className="text-xl text-gray-600">
                        One large centered orb
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Example 6: Neon / Cyberpunk Theme
// ============================================
export function Example6_NeonCyberpunk() {
    return (
        <div className="relative h-screen bg-black">
            <FloatingGradientOrb
                size={600}
                parallaxStrength={0.15}
                animationDuration={6}
                blur={120}
                opacity={0.6}
                colors={['#06b6d4', '#0ea5e9', '#3b82f6']} // cyan to blue
                className="top-20 left-20 -z-10"
            />

            <FloatingGradientOrb
                size={500}
                parallaxStrength={0.12}
                animationDuration={7}
                blur={110}
                opacity={0.55}
                colors={['#ec4899', '#a855f7', '#8b5cf6']} // pink to purple
                className="bottom-20 right-20 -z-10"
            />

            <FloatingGradientOrb
                size={400}
                parallaxStrength={0.09}
                animationDuration={9}
                blur={100}
                opacity={0.5}
                colors={['#10b981', '#06b6d4', '#3b82f6']} // green to cyan to blue
                className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Neon Dreams
                </h1>
            </div>
        </div>
    )
}

// ============================================
// Example 7: Pastel / Soft Theme
// ============================================
export function Example7_PastelSoft() {
    return (
        <div className="relative h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            <FloatingGradientOrb
                size={700}
                parallaxStrength={0.04}
                animationDuration={18}
                blur={200}
                opacity={0.3}
                colors={['#c084fc', '#f0abfc', '#fbcfe8']} // soft purple to pink
                className="top-10 left-10 -z-10"
            />

            <FloatingGradientOrb
                size={600}
                parallaxStrength={0.05}
                animationDuration={20}
                blur={180}
                opacity={0.28}
                colors={['#93c5fd', '#a5b4fc', '#c4b5fd']} // soft blue to lavender
                className="bottom-10 right-10 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-5xl font-bold text-purple-900">
                    Soft & Dreamy
                </h1>
            </div>
        </div>
    )
}

// ============================================
// Example 8: High Contrast / Bold
// ============================================
export function Example8_HighContrast() {
    return (
        <div className="relative h-screen bg-gray-950">
            <FloatingGradientOrb
                size={650}
                parallaxStrength={0.2}
                animationDuration={5}
                blur={100}
                opacity={0.7}
                colors={['#ef4444', '#dc2626', '#b91c1c']} // bold red
                className="top-1/4 left-1/3 -z-10"
            />

            <FloatingGradientOrb
                size={550}
                parallaxStrength={0.18}
                animationDuration={6}
                blur={90}
                opacity={0.65}
                colors={['#3b82f6', '#2563eb', '#1d4ed8']} // bold blue
                className="bottom-1/4 right-1/3 -z-10"
            />

            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-6xl font-bold text-white">
                    High Energy
                </h1>
            </div>
        </div>
    )
}

// ============================================
// Customization Guide
// ============================================
/*

PROP REFERENCE:
===============

size: number (default: 600)
- Size of the orb in pixels
- Larger = more coverage
- Recommended: 400-800px

parallaxStrength: number (default: 0.05)
- How much orb follows cursor (0-1)
- Lower = subtle, Higher = dramatic
- Recommended: 0.03-0.15

animationDuration: number (default: 8)
- Seconds for one full animation cycle
- Lower = faster, Higher = slower
- Recommended: 6-20 seconds

blur: number (default: 120)
- Blur amount in pixels
- Lower = sharper, Higher = softer
- Recommended: 80-200px

opacity: number (default: 0.4)
- Orb opacity (0-1)
- Lower = subtle, Higher = bold
- Recommended: 0.2-0.6

colors: string[] (default: ['#3b82f6', '#8b5cf6', '#ec4899'])
- Array of hex color codes
- Supports 2+ colors
- Creates radial gradient

className: string (default: '')
- Additional Tailwind classes
- Use for positioning (top, left, etc.)


TIPS:
=====

1. Multiple Orbs:
   - Use different sizes for depth
   - Vary parallaxStrength for layering effect
   - Different animationDuration for organic feel

2. Performance:
   - Limit to 3-5 orbs per section
   - Use higher blur for better performance
   - Component is optimized with RAF

3. Color Combinations:
   - Analogous: #3b82f6, #8b5cf6, #a855f7 (blue to purple)
   - Complementary: #3b82f6, #f97316 (blue and orange)
   - Monochrome: #1e40af, #3b82f6, #60a5fa (dark to light blue)

4. Positioning:
   - Use absolute positioning with Tailwind
   - Always include -z-10 or lower for background
   - Use translate utilities for centering

*/
