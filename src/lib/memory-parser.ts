import fs from "fs";
import path from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/home/daniel/.openclaw";
const WORKSPACE = path.join(OPENCLAW_DIR, "workspace");

// ============================================
// TIPOS AUTOMÁTICOS - Inferidos del contenido
// ============================================

export type InferredType =
  | "person"       // Nombres propios (Capitalized)
  | "tool"         // Comandos, herramientas
  | "project"      // Nombres de proyectos
  | "resource"     // URLs, archivos, links
  | "date"         // Fechas
  | "concept"      // Keywords recurring
  | "action"       // Verbos/actions
  | "location";    // Lugares

export interface ExtractedEntity {
  id: string;
  name: string;
  type: InferredType;
  mentions: number;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  contexts: string[];      // Frases donde aparece
  metadata: Record<string, string>;
}

export interface ExtractedRelation {
  id: string;
  source: string;
  target: string;
  type: "appears_with" | "mentions" | "related_to" | "uses" | "created";
  weight: number;
  context: string;
}

export interface KnowledgeGraph {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  stats: {
    totalTokens: number;
    totalEntities: number;
    totalRelations: number;
    typesDistribution: Record<InferredType, number>;
  };
}

// ============================================
// ANALIZADORES AUTOMÁTICOS - Sin hardcodeo
// ============================================

// Stop words mínimos - solo los más comunes en español/inglés
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "shall",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not",
  "only", "own", "same", "so", "than", "too", "very", "just",
  "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o",
  "es", "son", "fue", "fueron", "ser", "estar", "hay", "han",
  "que", "cual", "quien", "donde", "cuando", "como", "por", "para",
  "con", "sin", "sobre", "entre", "este", "esta", "estos", "estas",
  "ese", "esa", "esos", "esas", "aquel", "aquella", "mucho", "poco",
  "todo", "nada", "otro", "mi", "tu", "su", "nos", "se", "lo", "al",
  "del", "si", "no", "también", "pero", "porque", "ya", "más", "menos",
]);

// Tokenizador
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

// Detectar tipo por contexto y formato
function inferType(
  term: string,
  contexts: string[],
  sources: string[]
): InferredType {
  const termLower = term.toLowerCase();
  
  // URLs y recursos
  if (/^https?:\/\//.test(term) || /^\[.+\]\(/.test(term)) {
    return "resource";
  }
  
  // Fechas
  if (/^\d{4}-\d{2}-\d{2}$/.test(term) || /^\d{2}\/\d{2}\/\d{4}$/.test(term)) {
    return "date";
  }
  
  // GitHub/repos
  if (/\/(main|master|develop|feature|bugfix)\//.test(term) || 
      /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(term)) {
    return "project";
  }
  
  // Rutas de archivos
  if (/^[\.\/]?[\w-]+\/[\w\.\/-]+$/.test(term) || /\.(md|js|ts|py|json|yml|yaml|toml)$/.test(term)) {
    return "resource";
  }
  
  // Comandos/herramientas (empiezan con $, -, o son verbos conocidos)
  if (term.startsWith("$") || term.startsWith("-") || term.startsWith("--") ||
      ["npm", "yarn", "pnpm", "git", "docker", "npx", "curl", "wget", "make"].includes(termLower)) {
    return "tool";
  }
  
  // Nombres propios (capitalized, no al inicio de oración)
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(term) && term.length > 3) {
    // Si aparece con @ es persona
    if (contexts.some(c => c.includes(`@${term}`) || c.includes(`@${termLower}`))) {
      return "person";
    }
    // Si aparece en archivos de proyectos
    if (sources.some(s => s.includes("agents/") || s.includes("skills/"))) {
      return "project";
    }
    return "person";
  }
  
  // Verbos/actions (si termina en -ar, -er, -ir y aparece en contexto de acción)
  if (/(ar|er|ir)$/.test(termLower) && term.length > 4) {
    return "action";
  }
  
  // Por defecto es concepto
  return "concept";
}

// Extraer n-grams significativos
function extractNgrams(tokens: string[], minFreq: number = 2): Map<string, number> {
  const unigrams = new Map<string, number>();
  const bigrams = new Map<string, number>();
  const trigrams = new Map<string, number>();
  
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!STOP_WORDS.has(t) && t.length > 3) {
      unigrams.set(t, (unigrams.get(t) || 0) + 1);
    }
    
    if (i < tokens.length - 1) {
      const bigram = `${tokens[i]}_${tokens[i + 1]}`;
      if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1])) {
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
      }
    }
    
    if (i < tokens.length - 2) {
      const trigram = `${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`;
      if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1]) && !STOP_WORDS.has(tokens[i + 2])) {
        trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1);
      }
    }
  }
  
  // Unir todo y filtrar por frecuencia
  const allNgrams = new Map<string, number>();
  
  for (const [n, f] of unigrams) {
    if (f >= minFreq) allNgrams.set(n, f);
  }
  for (const [n, f] of bigrams) {
    if (f >= minFreq / 2) allNgrams.set(n, f);
  }
  for (const [n, f] of trigrams) {
    if (f >= minFreq / 3) allNgrams.set(n, f);
  }
  
  return allNgrams;
}

// Extraer entidades de un texto
function extractEntitiesFromContent(
  content: string,
  source: string,
  date: string
): {
  entities: Map<string, { term: string; type: InferredType; contexts: string[] }>;
  coOccurrences: Map<string, Set<string>>;
  tokenCount: number;
} {
  const entities = new Map<string, { term: string; type: InferredType; contexts: string[] }>();
  const coOccurrences = new Map<string, Set<string>>();
  
  // Tokenizar
  const tokens = tokenize(content);
  const tokenCount = tokens.length;
  
  // Extraer n-grams
  const ngrams = extractNgrams(tokens);
  
  // Extraer contextos (ventana de 5 palabras)
  const sentences = content.split(/[.!?\n]/);
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w\sáéíóúñü-]/g, "");
      if (word.length > 3 && !STOP_WORDS.has(word.toLowerCase())) {
        // Crear contexto (palabras alrededor)
        const start = Math.max(0, i - 2);
        const end = Math.min(words.length, i + 3);
        const context = words.slice(start, end).join(" ");
        
        // Agregar co-occurrences
        for (let j = start; j < end; j++) {
          if (j !== i) {
            const other = words[j].replace(/[^\w\sáéíóúñü-]/g, "").toLowerCase();
            if (other.length > 3 && !STOP_WORDS.has(other)) {
              if (!coOccurrences.has(word.toLowerCase())) {
                coOccurrences.set(word.toLowerCase(), new Set());
              }
              coOccurrences.get(word.toLowerCase())!.add(other);
            }
          }
        }
        
        // Agregar entidad
        const key = word.toLowerCase();
        if (!entities.has(key)) {
          entities.set(key, {
            term: word,
            type: "concept", // Se inferirá después
            contexts: [],
          });
        }
        entities.get(key)!.contexts.push(context.slice(0, 100));
      }
    }
  }
  
  // Inferir tipos basándose en el contexto
  for (const [, entity] of entities) {
    const allContext = entity.contexts.join(" ");
    entity.type = inferType(entity.term, entity.contexts, [source]);
    
    // Sobrescribir si hay evidencia clara en el contexto
    if (allContext.includes("http")) {
      entity.type = "resource";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(entity.term)) {
      entity.type = "date";
    }
  }
  
  return { entities, coOccurrences, tokenCount };
}

// Generar ID único
function generateId(term: string, type: InferredType): string {
  return `${type}-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

// ============================================
// PARSER PRINCIPAL
// ============================================

export function parseMemoryFiles(): KnowledgeGraph {
  const allEntities = new Map<string, ExtractedEntity>();
  const allCoOccurrences = new Map<string, Set<string>>();
  let totalTokens = 0;
  
  // Archivos a procesar
  const filesToProcess: Array<{ path: string; name: string; date: string }> = [];
  
  // MEMORY.md principal
  const memoryPath = path.join(WORKSPACE, "MEMORY.md");
  if (fs.existsSync(memoryPath)) {
    filesToProcess.push({ path: memoryPath, name: "MEMORY.md", date: "recent" });
  }
  
  // SOUL.md
  const soulPath = path.join(WORKSPACE, "SOUL.md");
  if (fs.existsSync(soulPath)) {
    filesToProcess.push({ path: soulPath, name: "SOUL.md", date: "recent" });
  }
  
  // IDENTITY.md
  const identityPath = path.join(WORKSPACE, "IDENTITY.md");
  if (fs.existsSync(identityPath)) {
    filesToProcess.push({ path: identityPath, name: "IDENTITY.md", date: "recent" });
  }
  
  // TOOLS.md
  const toolsPath = path.join(WORKSPACE, "TOOLS.md");
  if (fs.existsSync(toolsPath)) {
    filesToProcess.push({ path: toolsPath, name: "TOOLS.md", date: "recent" });
  }
  
  // USER.md
  const userPath = path.join(WORKSPACE, "USER.md");
  if (fs.existsSync(userPath)) {
    filesToProcess.push({ path: userPath, name: "USER.md", date: "recent" });
  }
  
  //记忆 files en memory/
  const memoryDir = path.join(WORKSPACE, "memory");
  if (fs.existsSync(memoryDir)) {
    const memoryFiles = fs.readdirSync(memoryDir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, 50); // Últimos 50
      
    for (const file of memoryFiles) {
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : "unknown";
      filesToProcess.push({
        path: path.join(memoryDir, file),
        name: `memory/${file}`,
        date,
      });
    }
  }
  
  // Procesar cada archivo
  for (const file of filesToProcess) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      const { entities: fileEntities, coOccurrences, tokenCount } = extractEntitiesFromContent(
        content,
        file.name,
        file.date
      );
      
      totalTokens += tokenCount;
      
      // Merge co-occurrences
      for (const [term, others] of coOccurrences) {
        if (!allCoOccurrences.has(term)) {
          allCoOccurrences.set(term, new Set());
        }
        for (const other of others) {
          allCoOccurrences.get(term)!.add(other);
        }
      }
      
      // Merge entidades
      for (const [key, data] of fileEntities) {
        const id = generateId(data.term, data.type);
        
        if (allEntities.has(id)) {
          const existing = allEntities.get(id)!;
          existing.mentions += 1;
          existing.lastSeen = file.date !== "recent" ? file.date : existing.lastSeen;
          if (!existing.sources.includes(file.name)) {
            existing.sources.push(file.name);
          }
          // Agregar contextos únicos
          for (const ctx of data.contexts) {
            if (!existing.contexts.includes(ctx)) {
              existing.contexts.push(ctx);
            }
          }
        } else {
          allEntities.set(id, {
            id,
            name: data.term,
            type: data.type,
            mentions: 1,
            firstSeen: file.date !== "recent" ? file.date : "unknown",
            lastSeen: file.date !== "recent" ? file.date : "unknown",
            sources: [file.name],
            contexts: data.contexts.slice(0, 10),
            metadata: {},
          });
        }
      }
    } catch (error) {
      console.error(`[memory-parser] Error reading ${file.path}:`, error);
    }
  }
  
  // Generar relaciones por co-occurrence
  const relations: ExtractedRelation[] = [];
  const relationSet = new Set<string>();
  
  for (const [term, others] of allCoOccurrences) {
    const termId = generateId(term, "concept");
    if (!allEntities.has(termId)) continue;
    
    for (const other of others) {
      const otherId = generateId(other, "concept");
      if (!allEntities.has(otherId)) continue;
      if (termId === otherId) continue;
      
      // Evitar duplicados (ordenado)
      const [a, b] = [termId, otherId].sort();
      const relId = `${a}--${b}`;
      
      if (!relationSet.has(relId)) {
        relationSet.add(relId);
        
        const sourceEntity = allEntities.get(termId)!;
        
        relations.push({
          id: relId,
          source: termId,
          target: otherId,
          type: "appears_with",
          weight: 1,
          context: sourceEntity.contexts[0] || "",
        });
      }
    }
  }
  
  // Calcular distribución de tipos
  const typesDistribution: Record<InferredType, number> = {
    person: 0,
    tool: 0,
    project: 0,
    resource: 0,
    date: 0,
    concept: 0,
    action: 0,
    location: 0,
  };
  
  for (const entity of allEntities.values()) {
    typesDistribution[entity.type]++;
  }
  
  // Ordenar entidades por menciones
  const sortedEntities = Array.from(allEntities.values())
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 150); // Top 150
  
  // Ordenar relaciones por weight
  const sortedRelations = relations
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 300); // Top 300
  
  return {
    entities: sortedEntities,
    relations: sortedRelations,
    stats: {
      totalTokens,
      totalEntities: sortedEntities.length,
      totalRelations: sortedRelations.length,
      typesDistribution,
    },
  };
}
