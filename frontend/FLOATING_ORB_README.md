# 🌟 FloatingGradientOrb Component

A beautiful, performant React component that creates floating gradient orbs with smooth parallax cursor tracking.

![Floating Gradient Orb Demo](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Floating+Gradient+Orb+Demo)

## ✨ Features

- 🎨 **Customizable Gradients** - Support for multiple color stops
- 🖱️ **Smooth Parallax Effect** - Subtle cursor tracking with smooth interpolation
- ⚡ **Performance Optimized** - Uses RAF (RequestAnimationFrame) for 60fps
- 🎭 **Animated Gradients** - Built-in rotation and scale animations
- 📱 **Responsive** - Works on all screen sizes
- 🎛️ **Fully Customizable** - Control size, blur, opacity, speed, and more
- 🪶 **Lightweight** - Zero dependencies (besides React)

---

## 🚀 Quick Start

### Installation

The component is already included in your project at:
```
frontend/src/components/FloatingGradientOrb.jsx
```

### Basic Usage

```jsx
import FloatingGradientOrb from './components/FloatingGradientOrb'

function MyComponent() {
    return (
        <div className="relative h-screen">
            {/* Floating gradient orb in background */}
            <FloatingGradientOrb />

            {/* Your content goes here */}
            <div className="relative z-10">
                <h1>Hello World</h1>
            </div>
        </div>
    )
}
```

---

## 📖 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `600` | Size of the orb in pixels |
| `parallaxStrength` | `number` | `0.05` | How much the orb follows cursor (0-1) |
| `animationDuration` | `number` | `8` | Duration of gradient animation in seconds |
| `blur` | `number` | `120` | Blur amount in pixels |
| `opacity` | `number` | `0.4` | Orb opacity (0-1) |
| `colors` | `string[]` | `['#3b82f6', '#8b5cf6', '#ec4899']` | Array of hex color codes |
| `className` | `string` | `''` | Additional Tailwind CSS classes |

---

## 🎨 Usage Examples

### Example 1: Hero Section with Multiple Orbs

```jsx
<section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
    {/* Large primary orb */}
    <FloatingGradientOrb
        size={700}
        parallaxStrength={0.1}
        blur={150}
        opacity={0.4}
        colors={['#3b82f6', '#8b5cf6', '#ec4899']}
        className="top-10 left-10 -z-10"
    />

    {/* Medium secondary orb */}
    <FloatingGradientOrb
        size={500}
        parallaxStrength={0.07}
        blur={120}
        opacity={0.35}
        colors={['#ec4899', '#f59e0b', '#ef4444']}
        className="top-20 right-10 -z-10"
    />

    {/* Small accent orb */}
    <FloatingGradientOrb
        size={350}
        parallaxStrength={0.05}
        blur={100}
        opacity={0.3}
        colors={['#10b981', '#3b82f6', '#6366f1']}
        className="bottom-20 left-1/2 -translate-x-1/2 -z-10"
    />

    {/* Content */}
    <div className="relative z-10 flex items-center justify-center min-h-screen">
        <h1 className="text-6xl font-bold">Your Content Here</h1>
    </div>
</section>
```

### Example 2: Dark Mode / Neon Theme

```jsx
<div className="relative h-screen bg-black">
    <FloatingGradientOrb
        size={600}
        parallaxStrength={0.15}
        blur={120}
        opacity={0.6}
        colors={['#06b6d4', '#0ea5e9', '#3b82f6']}
        className="top-20 left-20 -z-10"
    />

    <FloatingGradientOrb
        size={500}
        parallaxStrength={0.12}
        blur={110}
        opacity={0.55}
        colors={['#ec4899', '#a855f7', '#8b5cf6']}
        className="bottom-20 right-20 -z-10"
    />

    <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">Neon Dreams</h1>
    </div>
</div>
```

### Example 3: Minimal Single Orb

```jsx
<div className="relative h-screen bg-white">
    <FloatingGradientOrb
        size={800}
        parallaxStrength={0.12}
        animationDuration={14}
        blur={180}
        opacity={0.25}
        colors={['#8b5cf6', '#a78bfa']}
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
    />

    <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold">Minimalist</h1>
    </div>
</div>
```

---

## 🎯 Best Practices

### 1. Positioning

Always use **absolute positioning** with a **negative z-index** to keep orbs in the background:

```jsx
<FloatingGradientOrb
    className="top-20 left-20 -z-10"  // ✅ Good
/>

<FloatingGradientOrb
    className="top-20 left-20"  // ❌ Bad - will overlap content
/>
```

### 2. Multiple Orbs

For depth and visual interest, use **different sizes and parallax strengths**:

```jsx
{/* Large background orb - subtle movement */}
<FloatingGradientOrb size={700} parallaxStrength={0.05} />

{/* Medium midground orb - moderate movement */}
<FloatingGradientOrb size={500} parallaxStrength={0.08} />

{/* Small foreground orb - pronounced movement */}
<FloatingGradientOrb size={350} parallaxStrength={0.12} />
```

### 3. Performance

- **Limit to 3-5 orbs** per section for optimal performance
- Use **higher blur values** (120-200px) for better GPU performance
- Component automatically uses RAF for smooth 60fps animation

### 4. Color Selection

**Analogous Colors** (smooth, harmonious):
```jsx
colors={['#3b82f6', '#8b5cf6', '#a855f7']}  // Blue → Purple
```

**Complementary Colors** (bold, energetic):
```jsx
colors={['#3b82f6', '#f97316']}  // Blue + Orange
```

**Monochrome** (elegant, cohesive):
```jsx
colors={['#1e40af', '#3b82f6', '#60a5fa']}  // Dark → Light Blue
```

---

## 🔧 Customization Guide

### parallaxStrength Values

| Value | Effect | Use Case |
|-------|--------|----------|
| `0.02-0.04` | Very subtle | Background elements, large orbs |
| `0.05-0.08` | Moderate | Hero sections, balanced depth |
| `0.09-0.15` | Pronounced | Interactive sections, foreground orbs |
| `0.16+` | Dramatic | High-energy designs, attention-grabbing |

### Blur Values

| Value | Effect | Use Case |
|-------|--------|----------|
| `60-80px` | Sharp edges | Modern, crisp designs |
| `100-140px` | Soft (default) | Most use cases |
| `160-200px` | Very dreamy | Backgrounds, subtle accents |

### Animation Duration

| Value | Effect | Use Case |
|-------|--------|----------|
| `4-6s` | Fast | High energy, dynamic pages |
| `8-12s` | Moderate | Standard hero sections |
| `14-20s` | Slow | Calm, professional designs |

---

## 🎨 Color Palette Presets

### 🌊 Ocean Breeze
```jsx
colors={['#06b6d4', '#0ea5e9', '#3b82f6']}
```

### 🌅 Sunset
```jsx
colors={['#f97316', '#f59e0b', '#fbbf24']}
```

### 🌸 Cherry Blossom
```jsx
colors={['#ec4899', '#f43f5e', '#fda4af']}
```

### 🌿 Forest
```jsx
colors={['#10b981', '#059669', '#047857']}
```

### 🌌 Galaxy
```jsx
colors={['#3b82f6', '#8b5cf6', '#ec4899']}
```

### 🔥 Fire
```jsx
colors={['#ef4444', '#f97316', '#fbbf24']}
```

---

## ⚡ Performance Tips

1. **Use CSS `will-change`** (already included in component)
   - Optimizes for transform animations
   - Enables GPU acceleration

2. **Limit Orb Count**
   - 3-5 orbs per viewport recommended
   - More orbs = more blur calculations

3. **Higher Blur = Better Performance**
   - Blur is GPU-accelerated
   - 120-200px is optimal

4. **Use `pointer-events: none`** (already included)
   - Prevents orbs from blocking interactions
   - Improves click responsiveness

---

## 🐛 Troubleshooting

### Orb Not Moving with Cursor

**Problem**: Orb appears static, doesn't follow cursor

**Solutions**:
- Ensure `parallaxStrength` is not 0
- Check that parent has correct positioning
- Verify component is rendered (check z-index)

### Orb Overlapping Content

**Problem**: Orb appears on top of text/buttons

**Solutions**:
```jsx
<FloatingGradientOrb className="-z-10" />  {/* Add negative z-index */}
<div className="relative z-10">Content</div>  {/* Add positive z-index to content */}
```

### Performance Issues

**Problem**: Page feels slow or laggy

**Solutions**:
- Reduce number of orbs (max 3-5)
- Increase blur value (140-200px)
- Lower opacity (0.2-0.3)
- Increase `animationDuration` (12-20s)

---

## 📦 Technical Details

### How It Works

1. **Mouse Tracking**: Listens to `mousemove` events (passive listener)
2. **Position Interpolation**: Uses linear interpolation (lerp) for smooth movement
3. **Animation Loop**: RequestAnimationFrame for 60fps updates
4. **GPU Acceleration**: CSS `transform` and `will-change` for hardware acceleration
5. **Cleanup**: Properly removes event listeners on unmount

### Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Dependencies

- React 16.8+ (requires Hooks)
- No external libraries needed

---

## 🤝 Contributing

Want to improve the component? Here are some ideas:

- [ ] Add touch/mobile parallax support
- [ ] Add mouse leave animation
- [ ] Support for custom blend modes
- [ ] Preset configurations (e.g., "sunset", "ocean", "neon")
- [ ] TypeScript types

---

## 📄 License

Part of the Quanty.studio project.

---

## 🎓 Learn More

### Related Concepts

- **Parallax Scrolling**: Movement based on scroll position
- **Linear Interpolation (lerp)**: Smooth transitions between values
- **RequestAnimationFrame**: Browser API for smooth animations
- **CSS Filters**: `blur()`, `opacity()` for visual effects

### Inspiration

This component is inspired by:
- Modern SaaS landing pages (Stripe, Linear, Vercel)
- Apple's product pages
- WebGL particle systems

---

## 📞 Support

Need help? Check out:
- Example file: `FloatingGradientOrb.example.jsx`
- Live demo: See it in action on the landing page
- Questions: Open an issue on GitHub

---

**Made with ❤️ for Quanty.studio**

*Last updated: 2025-12-26*
