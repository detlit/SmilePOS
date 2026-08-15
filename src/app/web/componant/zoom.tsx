"use client";
import { useState, useEffect } from "react";

const ZOOM_STORAGE_KEY = "page_zoom_level";

export default function PageZoom() {
  const [zoom, setZoom] = useState(1);

  // Load and apply zoom from localStorage on mount
  useEffect(() => {
    const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (savedZoom) {
      const parsedZoom = parseFloat(savedZoom);
      if (!isNaN(parsedZoom)) {
        setZoom(parsedZoom);
        document.body.style.zoom = String(parsedZoom);
      }
    }
  }, []);

  const zoomIn = () => {
    const newZoom = zoom + 0.01;
    setZoom(newZoom);
    document.body.style.zoom = String(newZoom);
    localStorage.setItem(ZOOM_STORAGE_KEY, String(newZoom));
  };

  const zoomOut = () => {
    const newZoom = zoom - 0.01;
    setZoom(newZoom);
    document.body.style.zoom = String(newZoom);
    localStorage.setItem(ZOOM_STORAGE_KEY, String(newZoom));
  };

  const resetZoom = () => {
    setZoom(1);
    document.body.style.zoom = "1";
    localStorage.setItem(ZOOM_STORAGE_KEY, "1");
  };



  const Zin = () => {

    return (
      <button onClick={zoomIn}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-zoom-in" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" />
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
          <path fillRule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5" />
        </svg>
      </button>

    )
  }

  const ZOut = () => {

    return (
      <button onClick={zoomOut}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-zoom-out" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" />
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
          <path fillRule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5" />
        </svg>
      </button>

    )
  }

  const ZReset = () => {

    return (
      <button onClick={resetZoom}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
        </svg>
      </button>

    )
  }
  return (
    <div className='mt-1 row '>
      <div className='d-flex mr-3'>
        <div><Zin /></div>
        <div style={{ marginLeft: 10 }}><ZOut /></div>
        <div style={{ marginLeft: 10 }}><ZReset /></div>
      </div>

    </div>
  );
}
