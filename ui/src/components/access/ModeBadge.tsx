import { boardT as zh } from "@/i18n";
import type { DeploymentExposure, DeploymentMode } from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";

export function ModeBadge({
  deploymentMode,
  deploymentExposure,
}: {
  deploymentMode?: DeploymentMode;
  deploymentExposure?: DeploymentExposure;
}) {
  if (!deploymentMode) return null;

  const label =
    deploymentMode === "local_trusted"
      ? zh("Local trusted")
      : zh("Authenticated {{exposure}}", { exposure: zh(deploymentExposure ?? "private") });

  return <Badge variant="outline">{label}</Badge>;
}
