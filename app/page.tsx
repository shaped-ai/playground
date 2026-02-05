import { QueryPageClient } from "./query-page-client"

export default async function QueryPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const params = await searchParams
  const themeParam = params?.theme
  const themeOverride =
    themeParam === "light" || themeParam === "dark" ? themeParam : undefined

  return <QueryPageClient themeOverride={themeOverride} />
}
