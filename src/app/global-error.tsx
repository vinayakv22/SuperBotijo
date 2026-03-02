"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: "#0C0C0C",
        color: "#FFFFFF",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div 
          style={{ 
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
        >
          <div 
            style={{
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              padding: "32px",
              borderRadius: "16px",
              backgroundColor: "#1A1A1A",
              border: "1px solid #2A2A2A"
            }}
          >
            <div 
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 24px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 69, 58, 0.125)"
              }}
            >
              <AlertTriangle 
                style={{ 
                  width: "32px", 
                  height: "32px",
                  color: "#FF453A"
                }}
              />
            </div>

            <h1 
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
                letterSpacing: "-0.02em"
              }}
            >
              Error crítico
            </h1>

            <p 
              style={{
                color: "#8A8A8A",
                marginBottom: "24px",
                fontSize: "14px"
              }}
            >
              Algo salió mal en la aplicación. Por favor, recarga la página.
            </p>

            {error.digest && (
              <p 
                style={{
                  fontSize: "12px",
                  color: "#525252",
                  marginBottom: "16px",
                  fontFamily: "monospace"
                }}
              >
                Error ID: {error.digest}
              </p>
            )}

            <button
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                backgroundColor: "#FF3B30",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px" }} />
              Recargar aplicación
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
