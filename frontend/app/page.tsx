"use client";
import { useRef, useState, useEffect } from "react";

export default function Home() {
  const [online, setOnline] = useState(false);
  const [health, setHealth] = useState(false); // true if /healthz is OK
  const [imgKey, setImgKey] = useState(0); // Used to force reload
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);

  // When the image loads, set online to true and start a timer to detect offline
  const handleLoad = () => {
    setOnline(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (retryRef.current) clearTimeout(retryRef.current);
    // If no load event for 3s, set offline
    timerRef.current = setTimeout(() => setOnline(false), 3000);
  };
  const handleError = () => {
    setOnline(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Poll /healthz for true camera status
  useEffect(() => {
    let lastHealth = health;
    const poll = setInterval(() => {
      fetch("http://localhost:4000/healthz")
        .then((res) => {
          const ok = res.ok;
          setHealth((old) => {
            // Only retry if health transitions from false to true AND stream is not online
            if (!lastHealth && ok && !online) {
              setImgKey((k) => k + 1);
            }
            lastHealth = ok;
            return ok;
          });
        })
        .catch(() => setHealth(false));
    }, 2000);
    return () => clearInterval(poll);
  }, [online, health]);

  // No polling or auto-reload logic
  // Only manual reload via button

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <h1>Mock CCTV Live Stream (MJPEG)</h1>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: health ? "limegreen" : "red",
          marginBottom: 12,
          border: "2px solid #222",
          transition: "background 0.3s",
        }}
        title={health ? "Camera online" : "Camera offline"}
      />
      <img
        key={imgKey}
        ref={imgRef}
        src={`http://localhost:4000/mjpeg?${imgKey}`}
        alt="MJPEG Stream"
        style={{ maxWidth: "100%", border: "2px solid #333", borderRadius: 8 }}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!online && (
        <button
          style={{
            margin: "12px 0",
            padding: "6px 16px",
            borderRadius: 6,
            border: "1px solid #888",
            background: "#eee",
            cursor: "pointer",
          }}
          onClick={() => setImgKey((k) => k + 1)}
        >
          Retry Stream
        </button>
      )}
      <p style={{ marginTop: 16 }}>
        If you see this image, the backend MJPEG stream is working.
        <br />
        If you see a broken image, check the backend and webcam.
      </p>
    </main>
  );
}
