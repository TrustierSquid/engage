import { ChangeEvent, useState, useEffect } from "react";
import axios from "axios";
import "dotenv";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

let uploadServer = "http://localhost:3001";
if (import.meta.env.VITE_UPLOAD_SERVER !== undefined) {
  uploadServer = import.meta.env.VITE_UPLOAD_SERVER;
}

interface FormValues {
  title: string;
  desc: string;
  fileName: string;
}

type UploadStatus = "idle" | "uploading" | "transcoding" | "success" | "error";

const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [values, setValues] = useState<FormValues>({
    title: "",
    desc: "",
    fileName: "",
  });
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcodingProgress, setTranscodingProgress] = useState(0);
  const [sessionId] = useState<string>(uuidv4()); // Generate unique session ID
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to socket.io server
  useEffect(() => {
    const newSocket = io(uploadServer);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("transcode-progress", (data) => {
      if (data.sessionId === sessionId || data.sessionId === "unknown") {
        console.log(`Transcoding progress: ${data.progress}%`);
        setTranscodingProgress(data.progress);

        if (data.complete) {
          setStatus("success");
        } else if (status !== "transcoding" && data.progress > 0) {
          setStatus("transcoding");
        }
      }
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setValues({ ...values, title: e.target.value });
  }

  function handleDescChange(e: ChangeEvent<HTMLInputElement>) {
    setDesc(e.target.value);
    setValues({ ...values, desc: e.target.value });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setValues({ ...values, fileName: e.target.files[0].name });
    }
  }

  function isMP4(file: File) {
    const fileName: string = file.name;
    const fileExtension = fileName?.split(".").pop()?.toLowerCase();
    return fileExtension === "mp4";
  }

  async function handleFileUpload() {
    if (!file) return;
    console.log("File size: " + file.size);
    console.log("Max file size: " + MAX_FILE_SIZE);
    if (!isMP4(file)) {
      alert("File is not an mp4.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("File is too big. Max file size is 80MB");
      return;
    }

    setStatus("uploading");
    setUploadProgress(0);
    setTranscodingProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("sessionId", sessionId);

    const token = localStorage.getItem("authToken"); // Retrieve JWT token
    try {
      await axios.post(`${uploadServer}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? token : "", // Send token in header
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      // After successful upload, the server will start transcoding
      // We'll now show transcoding progress through socket.io
      setStatus("transcoding");
      setStatus("success");
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
    }
  }

  // Get the overall progress based on current status
  const getOverallProgress = () => {
    if (status === "uploading") {
      return uploadProgress;
    } else if (status === "transcoding") {
      return transcodingProgress;
    } else if (status === "success") {
      return 100;
    }
    return 0;
  };

  // Get the progress message based on status
  const getProgressMessage = () => {
    if (status === "uploading") {
      return `Uploading: ${uploadProgress}%`;
    } else if (status === "transcoding") {
      return `Transcoding: ${transcodingProgress}%`;
    } else if (status === "success") {
      return "Success! Video uploaded and processed.";
    } else if (status === "error") {
      return "Upload error, please try again. (Title is required)";
    }
    return "";
  };

  return (
    <div className="upload-container">
      <div className="form-group">
        <label htmlFor="title">Title: </label>
        <input name="title" value={title} onChange={handleTitleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="desc">Description: </label>
        <input name="desc" value={desc} onChange={handleDescChange} />
      </div>

      <div className="form-group">
        <input type="file" accept="video/mp4" onChange={handleFileChange} />
        {file && status === "idle" && (
          <button onClick={handleFileUpload}>Upload</button>
        )}
      </div>

      {status !== "idle" && (
        <div className="progress-container">
          <p className="progress-message">{getProgressMessage()}</p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>

          {status === "transcoding" && (
            <p className="info-text">
              Transcoding may take a while depending on video size...
            </p>
          )}
        </div>
      )}

      <style>{`
        .upload-container {
          padding: 20px;
          max-width: 600px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: inline-block;
          width: 100px;
        }
        .progress-container {
          margin-top: 20px;
        }
        .progress-bar-container {
          width: 100%;
          height: 20px;
          background-color: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .progress-bar {
          height: 100%;
          background-color: #4caf50;
          transition: width 0.3s ease;
        }
        .progress-message {
          margin-bottom: 5px;
          font-weight: bold;
        }
        .info-text {
          font-size: 0.8rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}
