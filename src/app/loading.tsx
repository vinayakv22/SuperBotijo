import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 
          className="w-8 h-8 animate-spin" 
          style={{ color: "var(--accent)" }}
        />
        <p 
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Cargando...
        </p>
      </div>
    </div>
  );
}
