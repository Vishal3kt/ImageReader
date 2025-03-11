import React, { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import cv from "@techstark/opencv-js";
import { motion } from "framer-motion";
import logo from "../public/logo.webp";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => setInstallPrompt(null));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", () => setInstallPrompt(null));
    };
  }, []);

  const preprocessImage = (imageSrc) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      let src = cv.imread(img);
      let dst = new cv.Mat();
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
      cv.imshow("processedCanvas", dst);
      src.delete();
      dst.delete();
    };
  };

  useEffect(() => {
    cv["onRuntimeInitialized"] = () => {
      console.log("OpenCV loaded");
    };
  }, []);

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setText("");
    }
  };

  const extractText = async () => {
    if (!image) return;

    setIsLoading(true);
    setProgress(0);

    try {
      const { data: { text } } = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setText(text.trim());
    } catch (error) {
      console.error("Error extracting text:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="App">
      <img src={logo} alt="App Logo" className="app-logo" />

      {installPrompt && (
        <button onClick={() => installPrompt.prompt()} className="install-button">
          Download APP
        </button>
      )}

      <motion.h1 className="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        Image to Text Extractor
      </motion.h1>
      <div className="upload-container">
        <label htmlFor="file-upload" className="upload-label">
          {image ? "Change Image" : "Upload Image"}
        </label>
        <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
        {image && (
          <motion.div className="image-preview" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <img src={image} alt="Uploaded" />
          </motion.div>
        )}
        {image && (
          <>
            <button className="extract-button" onClick={extractText} disabled={isLoading}>
              {isLoading ? `Extracting... ${progress}%` : "Extract Text"}
            </button>
            {isLoading && <div className="progress-bar" style={{ width: `${progress}%` }}></div>}
          </>
        )}
      </div>

      {text && (
        <motion.div className="text-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Extracted Text:</h2>
          <pre>{text}</pre>
          <div className="button-group">
            <button className="copy-button" onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
            <button className="clear-button" onClick={() => setText("")}>Clear</button>
            <button className="share-button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")}>
              Share to WhatsApp
            </button>
          </div>
        </motion.div>
      )}
      {showToast && <div className="toast">Copied to clipboard!</div>}
      <footer className="footer">Developed & Designed by Vishal Mokashi | Frontend Developer</footer>
    </div>
  );
}

export default App;
