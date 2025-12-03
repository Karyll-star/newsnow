import { createFileRoute } from "@tanstack/react-router"
import { SourceDashboard } from "~/components/source-dashboard"

export const Route = createFileRoute("/")({
  component: SourceDashboard,
})
