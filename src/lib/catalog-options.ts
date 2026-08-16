// Static option lists for the admin program/course forms — each mirrors a
// CHECK constraint in the migration exactly (programs.category,
// programs.difficulty / courses.level, programs.status / courses.status),
// so a form can never submit a value the database would reject anyway.

export const PROGRAM_CATEGORIES = [
  { value: "ai_ml", label: "AI & Machine Learning" },
  { value: "data_analytics", label: "Data Analytics" },
  { value: "software_development", label: "Software Development" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "cloud_devops", label: "Cloud & DevOps" },
  { value: "design", label: "Design" },
  { value: "emerging_tech", label: "Emerging Technologies" },
] as const;

// Shared by programs.difficulty and courses.level — both use the exact
// same three-value CHECK constraint in the migration.
export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;

// Shared by programs.status and courses.status — both use the exact same
// draft/published/archived CHECK constraint.
export const CATALOG_STATUSES = ["draft", "published", "archived"] as const;
