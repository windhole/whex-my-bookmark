export type AppVersionInfo = {
  version: string;
  gitSha: string;
  versionName: string;
};

export function buildVersionInfo(
  version: string,
  gitSha: string,
): AppVersionInfo {
  return {
    version,
    gitSha,
    versionName: `${version} (${gitSha})`,
  };
}
