"use client";

import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);

  async function uploadFile() {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    // Send the file to the server
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log(data);
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
        }}
      />

      <button onClick={uploadFile}>Upload</button>
    </div>
  );
}
