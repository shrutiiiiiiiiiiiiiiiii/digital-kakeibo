"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Point = { x: number; y: number };
type Tool = "pencil" | "eraser";

const COLORS = ["#1a1a1a", "#7f1d1d", "#1d4ed8", "#166534"] as const;
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const PENCIL_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg transform='rotate(-35 14 14)'%3E%3Crect x='11' y='3' width='6' height='16' rx='2' fill='%23222222'/%3E%3Cpolygon points='11,3 17,3 14,0' fill='%23f4c27a'/%3E%3Crect x='11' y='19' width='6' height='5' rx='1.5' fill='%23e07a7a'/%3E%3C/g%3E%3C/svg%3E") 14 2, crosshair`;
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg transform='rotate(-25 14 14)'%3E%3Crect x='6' y='9' width='16' height='10' rx='2' fill='%23f7a8b8'/%3E%3Crect x='14' y='9' width='8' height='10' rx='2' fill='%23ffd7df'/%3E%3C/g%3E%3C/svg%3E") 14 14, cell`;

export function HandwritingPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef(false);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const currentImageRef = useRef(value || "");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState<(typeof COLORS)[number]>("#1a1a1a");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [currentImage, setCurrentImage] = useState(() => value || "");
  const [history, setHistory] = useState<string[]>(() => (value ? [value] : []));
  const [historyIndex, setHistoryIndex] = useState(() => (value ? 0 : -1));

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;
  const toolLabel = useMemo(() => (tool === "pencil" ? "Pencil" : "Eraser"), [tool]);

  useEffect(() => {
    currentImageRef.current = currentImage;
  }, [currentImage]);

  function fillWhite(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const drawImageOnCanvas = useCallback((imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fillWhite(canvas, ctx);
    if (!imageData) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
  }, []);

  useEffect(() => {
    if (!isEditorOpen) return;
    drawImageOnCanvas(currentImage);
  }, [currentImage, isEditorOpen, drawImageOnCanvas]);

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
      y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
    };
  }

  function commitSnapshot(snapshot: string) {
    setCurrentImage(snapshot);
    setHistory((prev) => {
      const base = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : [];
      return [...base, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPointRef.current) return;
    const next = getPoint(event);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastPointRef.current = next;
  }

  function end() {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const snapshot = canvas.toDataURL("image/png");
      commitSnapshot(snapshot);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    fillWhite(canvas, ctx);
    setCurrentImage("");
    setHistory([]);
    setHistoryIndex(-1);
  }

  function undo() {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    const snapshot = history[nextIndex] ?? "";
    setCurrentImage(snapshot);
    drawImageOnCanvas(snapshot);
  }

  function redo() {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    const snapshot = history[nextIndex] ?? "";
    setCurrentImage(snapshot);
    drawImageOnCanvas(snapshot);
  }

  function saveAndClose() {
    onChange(currentImage);
    setIsEditorOpen(false);
  }

  function cancelAndClose() {
    const previous = value || "";
    setCurrentImage(previous);
    setHistory(previous ? [previous] : []);
    setHistoryIndex(previous ? 0 : -1);
    drawImageOnCanvas(previous);
    setIsEditorOpen(false);
  }

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    setIsEditorOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      // Preserve latest handwriting when the component unmounts
      // (e.g. switching between "Type note" and "Handwrite note").
      onChange(currentImageRef.current);
    };
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-black/15 bg-white p-2 dark:border-white/10 dark:bg-white/5">
        {currentImage ? (
          <img src={currentImage} alt="Handwriting preview" className="w-full rounded-xl border border-black/10 dark:border-white/10" />
        ) : (
          <p className="px-3 py-5 text-sm text-muted-foreground">No handwriting yet.</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/15"
        >
          Open whiteboard
        </button>
        <button
          type="button"
          onClick={() => {
            clearCanvas();
            onChange("");
          }}
          className="rounded-full border border-black/15 px-4 py-2 text-sm text-muted-foreground dark:border-white/15"
        >
          Clear handwriting
        </button>
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/15 bg-white/70 p-3 dark:border-white/15 dark:bg-sumi/50">
              <button
                type="button"
                onClick={() => setTool("pencil")}
                className={`rounded-full px-3 py-1 text-sm ${tool === "pencil" ? "bg-sumi text-white dark:bg-white dark:text-sumi" : "border border-black/15 dark:border-white/15"}`}
              >
                Pencil
              </button>
              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={`rounded-full px-3 py-1 text-sm ${tool === "eraser" ? "bg-sumi text-white dark:bg-white dark:text-sumi" : "border border-black/15 dark:border-white/15"}`}
              >
                Eraser
              </button>

              <div className="mx-1 h-6 w-px bg-black/15 dark:bg-white/20" />

              {COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Color ${swatch}`}
                  onClick={() => {
                    setTool("pencil");
                    setColor(swatch);
                  }}
                  className={`h-7 w-7 rounded-full border ${color === swatch && tool === "pencil" ? "ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-sumi" : "border-black/15 dark:border-white/15"}`}
                  style={{ backgroundColor: swatch }}
                />
              ))}

              <div className="mx-1 h-6 w-px bg-black/15 dark:bg-white/20" />

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Size
                <input
                  type="range"
                  min={2}
                  max={24}
                  step={1}
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                />
              </label>
              <span className="text-xs text-muted-foreground">{toolLabel} {strokeWidth}px</span>

              <div className="mx-1 h-6 w-px bg-black/15 dark:bg-white/20" />

              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="rounded-full border border-black/15 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="rounded-full border border-black/15 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
              >
                Redo
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="rounded-full border border-black/15 px-3 py-1 text-sm dark:border-white/15"
              >
                Clear
              </button>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={cancelAndClose}
                  className="rounded-full border border-black/15 px-4 py-1.5 text-sm dark:border-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAndClose}
                  className="rounded-full bg-sumi px-4 py-1.5 text-sm text-white dark:bg-white dark:text-sumi"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 rounded-2xl border border-black/15 bg-white p-2 dark:border-white/15">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="h-full w-full touch-none rounded-xl border border-black/10 bg-white dark:border-white/10"
                style={{ cursor: tool === "eraser" ? ERASER_CURSOR : PENCIL_CURSOR }}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
