export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

// Standard page-level heading used across every student/admin/public
// structural page — keeps title/description markup out of ~30 near-identical
// page files.
export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && (
        <span className="text-caption font-medium uppercase tracking-[0.15em] text-primary">{eyebrow}</span>
      )}
      <h1 className="text-h2 text-text">{title}</h1>
      {description && <p className="max-w-2xl text-body text-text-muted">{description}</p>}
    </div>
  );
}
