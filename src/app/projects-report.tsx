import { Redirect } from "expo-router";

export default function ProjectsReportRedirect() {
  return (
    <Redirect
      href={{
        pathname: "/report-viewer",
        params: {
          type: "projects",
        },
      }}
    />
  );
}
