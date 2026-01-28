import { useEffect, useRef } from "react";

interface MatrixBackgroundProps {
  opacity?: number;
}

export const MatrixBackground = ({ opacity = 0.08 }: MatrixBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // Added more spaces to make it "sparser" and more premium
    const chars =
      "ZCASHZYPHERSCANPRIVACYZKSNARKSHIELDEDORCHARDSAPLING010101                   " +
      "                                                                            ";

    const draw = () => {
      if (!ctx || !canvas) return;

      // More aggressive trail fading for a "ghostly" look
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));

        // Skip drawing if it's a space to reduce density
        if (text.trim() !== "") {
          if (Math.random() > 0.99) {
            ctx.fillStyle = "#ffffff"; // Rare bright flashes
          } else {
            ctx.fillStyle = "#16a34a"; // Slightly darker green (Emerald 600)
          }
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    // Slowed down to 45ms for a smoother, less frantic feel
    const interval = setInterval(draw, 45);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity }}
    />
  );
};
