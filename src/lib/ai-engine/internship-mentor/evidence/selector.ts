import type { InternshipTask, RepositoryEvidence } from "../../schemas";

export interface SelectedEvidenceOptions {
  maxSourceFiles?: number;
  maxTestFiles?: number;
  maxFileLines?: number;
  maxContentCharsPerFile?: number;
}

export interface CriterionEvidenceMatch {
  criterion: string;
  candidateFiles: string[];
  snippetPreview?: string;
}

export interface SelectedEvidenceResult {
  prioritizedSourceFiles: Array<{ path: string; content: string; language?: string }>;
  prioritizedTestFiles: Array<{ path: string; content: string; framework?: string }>;
  configSummary: Array<{ path: string; snippet: string }>;
  readmeSummary: string | null;
  criteriaMapping: CriterionEvidenceMatch[];
  totalCollectedFilesCount: number;
  selectedFilesCount: number;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\-./]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreFileRelevance(filePath: string, fileContent: string, taskKeywords: Set<string>): number {
  let score = 0;
  const pathLower = filePath.toLowerCase();

  // Match file path segments
  for (const kw of taskKeywords) {
    if (pathLower.includes(kw)) {
      score += 10;
    }
  }

  // Look for keyword mentions in content
  const contentLower = fileContent.toLowerCase().slice(0, 5000);
  for (const kw of taskKeywords) {
    if (contentLower.includes(kw)) {
      score += 2;
    }
  }

  return score;
}

function truncateFileContent(content: string, maxLines = 150, maxChars = 4000): string {
  const lines = content.split("\n");
  if (lines.length <= maxLines && content.length <= maxChars) {
    return content;
  }

  const truncatedLines = lines.slice(0, maxLines).join("\n");
  if (truncatedLines.length > maxChars) {
    return `${truncatedLines.slice(0, maxChars)}\n\n// ... [Content truncated for review efficiency] ...`;
  }

  return `${truncatedLines}\n\n// ... [${lines.length - maxLines} more lines truncated] ...`;
}

/**
 * Selects and bounds repository evidence to provide targeted context for the AI Reviewer.
 * Guarantees that evidence stays bounded within LLM token constraints while prioritizing
 * the specific files tested by the task's acceptance criteria and deliverables.
 */
export function selectRelevantEvidence(
  task: InternshipTask,
  evidence: RepositoryEvidence,
  options: SelectedEvidenceOptions = {}
): SelectedEvidenceResult {
  const maxSourceFiles = options.maxSourceFiles ?? 6;
  const maxTestFiles = options.maxTestFiles ?? 4;
  const maxFileLines = options.maxFileLines ?? 150;
  const maxContentChars = options.maxContentCharsPerFile ?? 4000;

  // Build task keyword set from objective, instructions, criteria, and deliverables
  const taskKeywords = new Set<string>();
  const allTaskText = [
    task.title,
    task.objective,
    ...task.instructions,
    ...task.deliverables,
    ...task.acceptance_criteria,
  ].join(" ");

  for (const kw of extractKeywords(allTaskText)) {
    taskKeywords.add(kw);
  }

  // 1. Score and rank source files
  const rankedSources = (evidence.source_files || [])
    .map((file) => ({
      file,
      score: scoreFileRelevance(file.path, file.content, taskKeywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSourceFiles)
    .map((item) => ({
      path: item.file.path,
      content: truncateFileContent(item.file.content, maxFileLines, maxContentChars),
      language: item.file.language,
    }));

  // 2. Score and rank test files
  const rankedTests = (evidence.test_files || [])
    .map((file) => ({
      file,
      score: scoreFileRelevance(file.path, file.content, taskKeywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTestFiles)
    .map((item) => ({
      path: item.file.path,
      content: truncateFileContent(item.file.content, maxFileLines, maxContentChars),
      framework: item.file.framework,
    }));

  // 3. Summarize configs
  const configSummary = (evidence.config_files || []).slice(0, 5).map((cfg) => ({
    path: cfg.path,
    snippet: truncateFileContent(cfg.content, 40, 1000),
  }));

  // 4. Map Acceptance Criteria to Candidate Files
  const allCollectedFiles = [
    ...(evidence.source_files || []),
    ...(evidence.test_files || []),
    ...(evidence.config_files || []),
  ];

  const criteriaMapping: CriterionEvidenceMatch[] = task.acceptance_criteria.map((criterion) => {
    const critKeywords = extractKeywords(criterion);
    const matchingFiles = allCollectedFiles
      .map((f) => {
        let matchScore = 0;
        const pLower = f.path.toLowerCase();
        for (const kw of critKeywords) {
          if (pLower.includes(kw)) matchScore += 5;
          if (f.content.toLowerCase().includes(kw)) matchScore += 1;
        }
        return { path: f.path, matchScore };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((m) => m.path)
      .slice(0, 3);

    return {
      criterion,
      candidateFiles: matchingFiles,
    };
  });

  const readmeSummary = evidence.readme
    ? truncateFileContent(evidence.readme, 60, 2000)
    : null;

  return {
    prioritizedSourceFiles: rankedSources,
    prioritizedTestFiles: rankedTests,
    configSummary,
    readmeSummary,
    criteriaMapping,
    totalCollectedFilesCount: (evidence.file_tree || []).length,
    selectedFilesCount: rankedSources.length + rankedTests.length + configSummary.length,
  };
}
