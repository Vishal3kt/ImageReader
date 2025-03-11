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

  useEffect(() => {
    cv["onRuntimeInitialized"] = () => {
      console.log("OpenCV loaded");
    };
  }, []);

  const preprocessImage = (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        let src = cv.imread(img);
        let dst = new cv.Mat();
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.threshold(dst, dst, 128, 255, cv.THRESH_BINARY);
        cv.GaussianBlur(dst, dst, new cv.Size(3, 3), 0);
        cv.imshow("processedCanvas", dst);
        const processedImage = document.getElementById("processedCanvas").toDataURL();
        src.delete();
        dst.delete();
        resolve(processedImage);
      };
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setText("");
    }
  };

  const cleanText = (text) => {
    return text
      .replace(/[^\w\s\n]/g, "")
      .replace(/[ ]+/g, " ")
      .trim();
  };

  const extractText = async () => {
    if (!image) return;

    setIsLoading(true);
    setProgress(0);

    try {
      const processedImage = await preprocessImage(image);

      const { data: { text } } = await Tesseract.recognize(processedImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
        tessedit_pageseg_mode: "6",
      });

      const cleanedText = cleanText(text);
      setText(cleanedText);
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
          <pre style={{ textWrap: "auto" }}>{text}</pre>
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

      <canvas id="processedCanvas" style={{ display: "none" }}></canvas>
    </div>
  );
}

export default App;