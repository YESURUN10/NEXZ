import React, { useEffect, useRef } from 'react';

/**
 * KnowledgeNetwork: Interactive 3D intelligence network canvas.
 * Visualizes the core ethos: "Knowledge is connected through the world."
 * Features:
 * - Dark violet matrix depth
 * - Dynamic nodes pulsing with live intelligence signals
 * - Interconnected data arcs and travelling energy quanta
 * - Electric lightning discharge arcs between high-potential clusters
 * - Interactive mouse gravitation, repulsion, and click lightning burst
 */
export default function KnowledgeNetwork({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse state
    const mouse = { x: -1000, y: -1000, radius: 160, isDown: false };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isDown = false;
    };

    const handleMouseDown = () => {
      mouse.isDown = true;
      triggerLightningBurst(mouse.x, mouse.y);
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          width = canvas.width = entry.contentRect.width;
          height = canvas.height = entry.contentRect.height;
          initNodes();
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const TOPICS = [
      'QUANTUM', 'MARKETS', 'GEOPOLITICS', 'NEURAL_WIRE', 
      'ENERGY_GRID', 'DEFENSE', 'CLIMATE', 'CYBER'
    ];

    let nodes = [];
    const MAX_NODES = Math.min(42, Math.floor((width * height) / 20000) + 14);

    function initNodes() {
      nodes = [];
      for (let i = 0; i < MAX_NODES; i++) {
        const zDepth = Math.random() * 0.8 + 0.2; // 3D depth perception
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: zDepth,
          vx: (Math.random() - 0.5) * 0.4 * zDepth,
          vy: (Math.random() - 0.5) * 0.4 * zDepth,
          radius: (Math.random() * 2 + 1.6) * zDepth,
          baseRadius: (Math.random() * 2 + 1.6) * zDepth,
          label: i < TOPICS.length ? TOPICS[i] : null,
          charge: Math.random(),
        });
      }
    }

    initNodes();

    // Signal quanta & lightning arcs
    const pulses = [];
    const lightningBolts = [];
    let lastPulseTime = 0;
    let lastLightningTime = 0;

    function createLightningBolt(x1, y1, x2, y2, color = '#38BDF8') {
      const segments = [];
      const steps = 6;
      let currX = x1;
      let currY = y1;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const targetX = x1 + (x2 - x1) * t;
        const targetY = y1 + (y2 - y1) * t;
        const offset = (Math.random() - 0.5) * (i < steps ? 24 : 0);
        const normalX = -(y2 - y1);
        const normalY = x2 - x1;
        const len = Math.hypot(normalX, normalY) || 1;
        const nextX = targetX + (normalX / len) * offset;
        const nextY = targetY + (normalY / len) * offset;
        segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
        currX = nextX;
        currY = nextY;
      }
      lightningBolts.push({
        segments,
        opacity: 1.0,
        color,
        decay: 0.08,
      });
    }

    function triggerLightningBurst(originX, originY) {
      if (nodes.length < 3) return;
      const sorted = [...nodes].sort((a, b) => 
        Math.hypot(a.x - originX, a.y - originY) - Math.hypot(b.x - originX, b.y - originY)
      );
      const targets = sorted.slice(0, 3);
      targets.forEach(t => {
        createLightningBolt(originX, originY, t.x, t.y, '#C084FC');
      });
    }

    function render(currentTime) {
      ctx.clearRect(0, 0, width, height);

      // Deep space violet ambient gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 80,
        width * 0.5, height * 0.45, width * 0.75
      );
      bgGrad.addColorStop(0, 'rgba(26, 12, 46, 0.45)');
      bgGrad.addColorStop(0.5, 'rgba(14, 7, 26, 0.75)');
      bgGrad.addColorStop(1, 'rgba(5, 3, 10, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Periodic electric discharge between high-charge nodes
      if (!prefersReducedMotion && currentTime - lastLightningTime > 2400 && nodes.length > 5) {
        lastLightningTime = currentTime;
        const n1 = nodes[Math.floor(Math.random() * nodes.length)];
        const close = nodes.filter(n => n !== n1 && Math.hypot(n.x - n1.x, n.y - n1.y) < 180);
        if (close.length > 0) {
          const n2 = close[Math.floor(Math.random() * close.length)];
          createLightningBolt(n1.x, n1.y, n2.x, n2.y, Math.random() > 0.4 ? '#38BDF8' : '#C084FC');
        }
      }

      // Spawn subtle signal pulses along edges
      if (!prefersReducedMotion && currentTime - lastPulseTime > 320 && nodes.length > 3) {
        lastPulseTime = currentTime;
        const fromNode = nodes[Math.floor(Math.random() * nodes.length)];
        let target = null;
        let minDist = 180;
        for (let j = 0; j < nodes.length; j++) {
          const toNode = nodes[j];
          if (fromNode === toNode) continue;
          const d = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y);
          if (d < minDist) {
            target = toNode;
            minDist = d;
          }
        }
        if (target) {
          pulses.push({
            fromX: fromNode.x,
            fromY: fromNode.y,
            toX: target.x,
            toY: target.y,
            progress: 0,
            speed: 0.018 + Math.random() * 0.02,
            color: Math.random() > 0.4 ? '#C084FC' : '#38BDF8',
          });
        }
      }

      // Draw and update lightning bolts
      for (let i = lightningBolts.length - 1; i >= 0; i--) {
        const bolt = lightningBolts[i];
        ctx.save();
        ctx.strokeStyle = bolt.color;
        ctx.globalAlpha = bolt.opacity;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 12;
        ctx.shadowColor = bolt.color;
        ctx.beginPath();
        bolt.segments.forEach(seg => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();
        ctx.restore();

        bolt.opacity -= bolt.decay;
        if (bolt.opacity <= 0) {
          lightningBolts.splice(i, 1);
        }
      }

      // Update nodes and draw network links
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        if (!prefersReducedMotion) {
          a.x += a.vx;
          a.y += a.vy;

          if (a.x < 15 || a.x > width - 15) a.vx *= -1;
          if (a.y < 15 || a.y > height - 15) a.vy *= -1;

          // Mouse reactivity: pull gently or push away
          const dx = mouse.x - a.x;
          const dy = mouse.y - a.y;
          const mouseDist = Math.hypot(dx, dy);
          if (mouseDist < mouse.radius && mouseDist > 0) {
            const factor = (mouse.radius - mouseDist) / mouse.radius;
            a.x -= (dx / mouseDist) * factor * 1.8;
            a.y -= (dy / mouseDist) * factor * 1.8;
          }
        }

        // Draw links to neighbors
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const maxDist = 165;

          if (dist < maxDist) {
            const baseAlpha = (1 - dist / maxDist) * 0.22 * ((a.z + b.z) / 2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5;
            const distToMouse = Math.hypot(mouse.x - midX, mouse.y - midY);

            if (distToMouse < mouse.radius) {
              ctx.strokeStyle = `rgba(168, 85, 247, ${baseAlpha * 2.8})`;
              ctx.lineWidth = 1.2;
            } else {
              ctx.strokeStyle = `rgba(139, 92, 246, ${baseAlpha})`;
              ctx.lineWidth = 0.7;
            }
            ctx.stroke();
          }
        }
      }

      // Draw travelling signal pulses
      if (!prefersReducedMotion) {
        for (let p = pulses.length - 1; p >= 0; p--) {
          const pulse = pulses[p];
          pulse.progress += pulse.speed;

          if (pulse.progress >= 1) {
            pulses.splice(p, 1);
            continue;
          }

          const curX = pulse.fromX + (pulse.toX - pulse.fromX) * pulse.progress;
          const curY = pulse.fromY + (pulse.toY - pulse.fromY) * pulse.progress;

          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = pulse.color;
          ctx.fillStyle = pulse.color;
          ctx.beginPath();
          ctx.arc(curX, curY, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Render Nodes with luminescence
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const distToMouse = Math.hypot(mouse.x - node.x, mouse.y - node.y);
        const isHovered = distToMouse < 65;

        ctx.save();

        if (isHovered) {
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#38BDF8';
          ctx.fillStyle = '#38BDF8';
        } else if (node.label) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#C084FC';
          ctx.fillStyle = '#C084FC';
        } else {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
          ctx.fillStyle = 'rgba(168, 85, 247, 0.75)';
        }

        ctx.beginPath();
        const r = isHovered ? node.baseRadius * 1.8 : node.baseRadius;
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // High-tech ring for labeled / hovered nodes
        if (node.label || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? 'rgba(56, 189, 248, 0.5)' : 'rgba(192, 132, 252, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Topic moniker
        if (node.label) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = isHovered ? '#38BDF8' : 'rgba(196, 181, 253, 0.85)';
          ctx.fillText(node.label, node.x + 8, node.y + 3);
        }

        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`absolute inset-0 z-0 pointer-events-auto overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{ opacity: 0.9 }}
        aria-hidden="true"
      />
      {/* Edge lightning vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(5,3,10,0.85)_80%)]" />
    </div>
  );
}
