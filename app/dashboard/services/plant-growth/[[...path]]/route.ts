import { prisma } from "@/lib/db";
import { getSession } from "@/lib/permissions";

// Reverse-proxies to the standalone Plant_Growth Flask app, gating every
// request behind AMIS Lab's own session + per-member service access — the
// upstream URL and shared secret are never exposed to the browser, only this
// mount path (see app/dashboard/services/page.tsx for the entry point).
const MOUNT_PATH = "/dashboard/services/plant-growth";

function forbiddenPage(message: string, status: number) {
  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;text-align:center;color:#16235C">
      <h1 style="font-size:1.25rem">${message}</h1>
      <p><a href="/dashboard/services" style="color:#128C7E">Back to My Services</a></p>
    </body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

async function handle(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const session = await getSession();
  if (!session?.user) {
    return forbiddenPage("You must be signed in to use this service.", 401);
  }

  const service = await prisma.service.findFirst({
    where: { ctaUrl: { startsWith: MOUNT_PATH } },
    select: { id: true, allowedMembers: { where: { id: session.user.id }, select: { id: true } } },
  });

  const granted =
    session.user.role === "ADMIN" ||
    session.user.role === "TEAM" ||
    (service?.allowedMembers.length ?? 0) > 0;
  if (!service || !granted) {
    return forbiddenPage(
      "Access not granted. Ask the lab admin to grant you access to Plant-Growth in My Services.",
      403
    );
  }

  const upstreamBase = process.env.PLANT_GROWTH_SERVICE_URL;
  if (!upstreamBase) {
    return forbiddenPage("Plant-Growth isn't configured yet. Ask the lab admin.", 503);
  }

  const { path } = await params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL((path ?? []).join("/"), upstreamBase.endsWith("/") ? upstreamBase : `${upstreamBase}/`);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  headers.set("x-forwarded-prefix", MOUNT_PATH);
  if (process.env.PLANT_GROWTH_PROXY_SECRET) {
    headers.set("x-internal-proxy-secret", process.env.PLANT_GROWTH_PROXY_SECRET);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    // @ts-expect-error -- required by undici when streaming a request body
    duplex: request.method === "GET" || request.method === "HEAD" ? undefined : "half",
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstreamResponse.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
  const contentDisposition = upstreamResponse.headers.get("content-disposition");
  if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export { handle as GET, handle as POST };
