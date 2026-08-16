// Customer/internal AI-visibility boundary (see docs/ui-structural-foundation.md,
// "Customer vs internal AI visibility rules"). ai_artifacts.type mirrors the
// AI Engine's own internal workflow stage names (research_report,
// qa_report, deployment_record, ...) — safe for the admin AI Operations
// view, but never customer-facing. Every customer-facing deliverable list
// (student and company service-request detail pages) must render through
// this map instead of the raw type or the AI-Engine-authored artifact
// title, which can itself contain stage-shaped text (e.g. "QA report:
// passed").
const CUSTOMER_DELIVERABLE_LABELS: Record<string, string> = {
  research_report: "Research & discovery",
  website_source: "Website files",
  qa_report: "Quality check",
  content_draft: "Content",
  deployment_record: "Deployment",
};

export function customerDeliverableLabel(type: string): string {
  return CUSTOMER_DELIVERABLE_LABELS[type] ?? "Deliverable";
}
