import clientConfig from "@/config/clientConfig";

interface GetSuiExplorerLinkProps {
  type: "module" | "object" | "address";
  objectId: string;
  moduleName?: string;
}

export const getSuiExplorerLink = ({
  type,
  objectId,
  moduleName,
}: GetSuiExplorerLinkProps) => {
  const URLParams = `${
    type === "module" ? `module=${moduleName}&` : ""
  }network=${clientConfig.SUI_NETWORK_NAME}`;
  const URLType = type === "module" ? "object" : type;
  const href = `https://suiexplorer.com/${URLType}/${objectId}?${URLParams}`;
  return href;
};
