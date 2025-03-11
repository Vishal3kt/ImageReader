import React, { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
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


  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("PWA Installed");
        } else {
          console.log("PWA Installation dismissed");
        }
        setInstallPrompt(null);
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setText("");
    }
  };

  const extractText = () => {
    if (!image) return;

    setIsLoading(true);
    setProgress(0);

    Tesseract.recognize(image, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          setProgress(Math.round(info.progress * 100));
        }
      },
    })
      .then(({ data: { text } }) => {
        setText(text);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error extracting text:", error);
        setIsLoading(false);
      });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const clearText = () => {
    setText("");
  };

  return (
    <div className="App">
      <img src={logo} alt="App Logo" className="app-logo" />

      {installPrompt && (
        <button onClick={handleInstallClick} className="install-button">
          Download PWA
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
      </div>
      {image && (
        <>
          <button className="extract-button" onClick={extractText} disabled={isLoading}>
            {isLoading ? `Extracting... ${progress}%` : "Extract Text"}
          </button>
          {isLoading && <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>}
        </>
      )}
      {text && (
        <motion.div className="text-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Extracted Text:</h2>
          <pre style={{ textWrap: "auto" }}>{text}</pre>
          <div className="button-group">
            <button className="copy-button" onClick={copyToClipboard}>Copy</button>
            <button className="clear-button" onClick={clearText}>Clear</button>
          </div>
        </motion.div>
      )}
      {showToast && <div className="toast">Copied to clipboard!</div>}
      <footer className="footer">Developed & Designed with ❤️ by Vishal Mokashi</footer>
    </div>
  );
}

export default App;
