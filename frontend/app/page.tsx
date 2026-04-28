"use client";
export default function Home() {
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
      <img
        src="http://localhost:4000/mjpeg"
        alt="MJPEG Stream"
        style={{ maxWidth: "100%", border: "2px solid #333", borderRadius: 8 }}
      />
      <p style={{ marginTop: 16 }}>
        If you see this image, the backend MJPEG stream is working.
        <br />
        If you see a broken image, check the backend and webcam.
      </p>
    </main>
  );
}
