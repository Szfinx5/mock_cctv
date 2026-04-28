import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";

const app = express();
app.use(cors());
const PORT = 4000;
let ffmpeg: ReturnType<typeof spawn> | null = null;

// MJPEG streaming endpoint
app.get("/mjpeg", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffserver",
    "Cache-Control": "no-cache",
    Connection: "close",
    Pragma: "no-cache",
  });

  // Start ffmpeg for each connection
  const ffmpeg = spawn(ffmpegPath as string, [
    "-f",
    "v4l2",
    "-framerate",
    "15",
    "-video_size",
    "640x480",
    "-i",
    "/dev/video0",
    "-f",
    "mjpeg",
    "-q:v",
    "5",
    "pipe:1",
  ]);

  ffmpeg.stdout.on("data", (chunk) => {
    res.write(
      `--ffserver\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`,
    );
    res.write(chunk);
  });
  ffmpeg.stderr.on("data", (data) => {
    // Optionally log ffmpeg errors
    // console.error(`[ffmpeg] ${data}`);
  });
  ffmpeg.on("close", () => {
    res.end();
  });
  req.on("close", () => {
    ffmpeg.kill("SIGTERM");
  });
});

import fs from "fs";
app.get("/healthz", (_req, res) => {
  // Check if /dev/video0 exists and is readable
  fs.access("/dev/video0", fs.constants.R_OK, (err) => {
    if (err) {
      res.status(503).send("camera unavailable");
    } else {
      res.send("ok");
    }
  });
});

// --- Multi-camera MJPEG via WebSocket ---
import { WebSocketServer } from "ws";
const cameraFrames: Record<string, Buffer> = {};
const cameraLastSeen: Record<string, number> = {};

// WebSocket server for camera uploads
const wss = new WebSocketServer({ port: 4050 });
wss.on("connection", (ws, req) => {
  // Use remote address and a random id for uniqueness if not provided
  const url = req.url || "";
  let id = "";
  if (url.startsWith("/upload/")) {
    id =
      url.split("/upload/")[1] ||
      req.socket.remoteAddress + ":" + Math.random().toString(36).slice(2, 8);
  } else {
    id =
      req.socket.remoteAddress + ":" + Math.random().toString(36).slice(2, 8);
  }
  ws.on("message", (data) => {
    if (Buffer.isBuffer(data)) {
      cameraFrames[id] = data;
      cameraLastSeen[id] = Date.now();
    }
  });
  ws.on("close", () => {
    delete cameraFrames[id];
    delete cameraLastSeen[id];
  });
});

// MJPEG endpoint for each camera
app.get("/mjpeg/:id", (req, res) => {
  const { id } = req.params;
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffserver",
    "Cache-Control": "no-cache",
    Connection: "close",
    Pragma: "no-cache",
  });
  let lastSent = 0;
  const interval = setInterval(() => {
    const frame = cameraFrames[id];
    if (frame && cameraLastSeen[id] > lastSent) {
      lastSent = cameraLastSeen[id];
      res.write(
        `--ffserver\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`,
      );
      res.write(frame);
    }
  }, 200);
  req.on("close", () => clearInterval(interval));
});

// List available cameras
app.get("/cameras", (_req, res) => {
  const now = Date.now();
  // Only show cameras seen in last 10s
  const ids = Object.keys(cameraFrames).filter(
    (id) => now - (cameraLastSeen[id] || 0) < 10000,
  );
  res.json(ids);
});

app.listen(PORT, () => {
  console.log(`Mock CCTV backend running on http://localhost:${PORT}`);
  console.log(
    `WebSocket camera upload at ws://localhost:4050/upload/CAMERA_ID`,
  );
  console.log(`MJPEG streams at http://localhost:${PORT}/mjpeg/CAMERA_ID`);
  console.log(`Camera list at http://localhost:${PORT}/cameras`);
});
