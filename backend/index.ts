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
    "Connection": "close",
    "Pragma": "no-cache",
  });

  // Start ffmpeg for each connection
  const ffmpeg = spawn(ffmpegPath as string, [
    "-f", "v4l2",
    "-framerate", "15",
    "-video_size", "640x480",
    "-i", "/dev/video0",
    "-f", "mjpeg",
    "-q:v", "5",
    "pipe:1"
  ]);

  ffmpeg.stdout.on("data", (chunk) => {
    res.write(`--ffserver\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
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


app.get("/healthz", (_req, res) => {
  res.send("ok");
});

app.listen(PORT, () => {
  console.log(`Mock CCTV backend running on http://localhost:${PORT}`);
  console.log(`MJPEG stream at http://localhost:${PORT}/mjpeg`);
});
