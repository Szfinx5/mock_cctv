"use client";
import { useEffect, useState } from "react";
import "../styles/multiple-cameras.css";

function CameraStream({ id }: { id: string }) {
  const [online, setOnline] = useState(false);
  const [imgKey, setImgKey] = useState(0);

  // Poll for camera online status
  useEffect(() => {
    const poll = setInterval(() => {
      fetch(`https://mock-cctv.onrender.com/cameras`)
        .then((res) => res.json())
        .then((ids) => {
          setOnline(ids.includes(id));
        })
        .catch(() => setOnline(false));
    }, 2000);
    return () => clearInterval(poll);
  }, [id]);

  // Retry stream if it goes offline and comes back
  useEffect(() => {
    if (online) setImgKey((k) => k + 1);
  }, [online]);

  return (
    <div className="camera-stream">
      <div className="camera-header">
        <div
          className={`camera-status ${online ? "online" : "offline"}`}
          title={online ? "Camera online" : "Camera offline"}
        />
        <b>{id}</b>
      </div>
      <img
        key={imgKey}
        src={`https://mock-cctv.onrender.com/mjpeg/${encodeURIComponent(id)}?${imgKey}`}
        alt={id}
        className="camera-img"
      />
    </div>
  );
}

export default function MultipleCameras() {
  const [cameras, setCameras] = useState<string[]>([]);
  const [input, setInput] = useState("");

  return (
    <main className="multiple-main">
      <h1 className="multiple-title">Multiple Camera Streams</h1>
      <form
        className="multiple-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (input && !cameras.includes(input))
            setCameras([...cameras, input]);
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter camera name"
          className="multiple-input"
        />
        <button type="submit" className="multiple-add-btn">
          Add Camera
        </button>
      </form>
      <div className="multiple-cameras">
        {cameras.map((id) => (
          <CameraStream key={id} id={id} />
        ))}
      </div>
    </main>
  );
}
