"use client";
import { useEffect, useState } from "react";

function CameraStream({ id }: { id: string }) {
  const [online, setOnline] = useState(false);
  const [imgKey, setImgKey] = useState(0);

  // Poll for camera online status
  useEffect(() => {
    const poll = setInterval(() => {
      fetch(`http://localhost:4000/cameras`)
        .then((res) => res.json())
        .then((ids) => {
          console.log("CameraStream", { id, ids });
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
    <div
      style={{
        margin: 16,
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 12,
        width: 340,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: online ? "limegreen" : "red",
            border: "2px solid #222",
            marginRight: 8,
            transition: "background 0.3s",
          }}
          title={online ? "Camera online" : "Camera offline"}
        />
        <b>{id}</b>
      </div>
      <img
        key={imgKey}
        src={`http://localhost:4000/mjpeg/${encodeURIComponent(id)}?${imgKey}`}
        alt={id}
        style={{
          width: 320,
          height: 240,
          borderRadius: 6,
          border: "1px solid #333",
          background: "#222",
        }}
      />
    </div>
  );
}

export default function MultipleCameras() {
  const [cameras, setCameras] = useState<string[]>([]);
  const [input, setInput] = useState("");

  return (
    <main style={{ padding: 32 }}>
      <h1>Multiple Camera Streams</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input && !cameras.includes(input))
            setCameras([...cameras, input]);
          setInput("");
        }}
        style={{ marginBottom: 24 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter camera name"
          style={{
            padding: 8,
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #888",
            marginRight: 8,
          }}
        />
        <button
          type="submit"
          style={{ padding: "8px 16px", fontSize: 16, borderRadius: 4 }}
        >
          Add Camera
        </button>
      </form>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {cameras.map((id) => (
          <CameraStream key={id} id={id} />
        ))}
      </div>
    </main>
  );
}
