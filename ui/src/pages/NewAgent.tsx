import { boardT as zh } from "@/i18n";
import { useEffect } from "react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";

export function NewAgent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: zh("Agents"), href: "/agents" },
      { label: zh("New agent") },
    ]);
  }, [setBreadcrumbs]);
  return <NewAgentSetup />;
}
