import React from 'react';
import QRCode from 'react-qr-code';

export default function QRCodeDisplay({ url }) {
  const downloadQR = () => {
    const svg = document.getElementById("poll-qr-code");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "poll-qr-code.png";
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800">
      <div className="bg-white p-2 rounded-lg">
        <QRCode
          id="poll-qr-code"
          value={url}
          size={150}
          level={"H"}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
        />
      </div>
      <button 
        onClick={downloadQR}
        className="mt-3 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
      >
        Download QR Code
      </button>
    </div>
  );
}
