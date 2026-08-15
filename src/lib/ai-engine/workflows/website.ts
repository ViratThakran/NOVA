// The Website Creation workflow — the one complete, typed, auto-advancing
// workflow proven end-to-end. Research -> Development -> QA -> (approval
// gate) -> Deployment, with QA failure declaratively routed back to
// Development for revision.

import type { WorkflowDefinition } from "./types";

export const WEBSITE_CREATION_WORKFLOW: WorkflowDefinition = {
  slug: "website-creation",
  serviceSlugs: ["ai-website-creation"],
  tasks: [
    {
      key: "research",
      title: "Research the business, audience, and market context",
      agentSlug: "research-agent",
      capabilitySlugs: ["research", "read_public_web"],
      dependsOnKey: null,
    },
    {
      key: "development",
      title: "Build the website",
      agentSlug: "developer-agent",
      capabilitySlugs: ["generate_code", "create_artifact"],
      dependsOnKey: "research",
    },
    {
      key: "qa",
      title: "Test and validate the generated website",
      agentSlug: "qa-agent",
      capabilitySlugs: ["run_tests", "create_artifact"],
      dependsOnKey: "development",
      onFailureReturnToKey: "development",
    },
    {
      key: "deployment",
      title: "Deploy the website to production",
      agentSlug: "developer-agent",
      capabilitySlugs: ["deploy", "create_artifact"],
      dependsOnKey: "qa",
    },
  ],
};
