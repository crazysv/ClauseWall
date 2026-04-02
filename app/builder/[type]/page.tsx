import { redirect } from "next/navigation";
import BuilderClient from "./builder-client";
import { getTemplateConfig } from "@/lib/builder/template-fields";
import { ContractTemplateType } from "@/types";

export default function BuilderPage({ params }: { params: { type: string } }) {
  const type = params.type as ContractTemplateType;
  const config = getTemplateConfig(type);

  if (!config || config.fields.length === 0) {
    redirect("/builder");
  }

  return <BuilderClient templateConfig={config} templateType={type} />;
}