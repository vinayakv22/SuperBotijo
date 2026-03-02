import { LockKeyhole, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div 
        className="max-w-md w-full text-center p-8 rounded-2xl"
        style={{ 
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)"
        }}
      >
        <div 
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--warning-soft)" }}
        >
          <LockKeyhole 
            className="w-8 h-8" 
            style={{ color: "var(--warning)" }}
          />
        </div>

        <h1 
          className="text-2xl font-bold mb-2"
          style={{ 
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)"
          }}
        >
          Acceso no autorizado
        </h1>

        <p 
          className="mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Necesitas iniciar sesión para acceder a esta página.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors"
            style={{ 
              backgroundColor: "var(--accent)",
              color: "white"
            }}
          >
            <LockKeyhole className="w-4 h-4" />
            Iniciar sesión
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)"
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
