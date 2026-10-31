/**
 * Sentry Telemetry for Supabase Edge Functions (Deno Runtime)
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
}

function parseDsn(dsn: string): { host: string; projectId: string; publicKey: string } | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const projectId = pathParts[0];
    if (!publicKey || !projectId) return null;
    return { host, projectId, publicKey };
  } catch {
    return null;
  }
}

export async function captureEdgeException(
  error: unknown,
  functionName: string,
  req?: Request,
  additionalContext?: Record<string, any>
): Promise<void> {
  const dsn = Deno.env.get('SENTRY_DSN') || '';
  const environment = Deno.env.get('ENVIRONMENT') || 'production';
  const release = 'iedc-bmce@2.0.0';

  const errObj = error instanceof Error ? error : new Error(String(error));

  console.error(`[Sentry Edge:${functionName}] Captured Exception:`, errObj.message, errObj.stack);

  if (!dsn) {
    return;
  }

  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`;
  const sentryAuth = `Sentry sentry_version=7, sentry_client=deno-edge/2.0.0, sentry_key=${parsed.publicKey}`;

  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString().replace('Z', ''),
    platform: 'javascript',
    level: 'error',
    logger: `edge-function.${functionName}`,
    release,
    environment,
    tags: {
      function: functionName,
      runtime: 'deno'
    },
    exception: {
      values: [
        {
          type: errObj.name || 'Error',
          value: errObj.message || 'Unknown edge error',
          stacktrace: errObj.stack
            ? {
                frames: errObj.stack.split('\n').slice(1).map(line => ({
                  filename: line.trim()
                }))
              }
            : undefined
        }
      ]
    },
    request: req
      ? {
          url: req.url,
          method: req.method,
          headers: {
            'user-agent': req.headers.get('user-agent') || 'unknown'
          }
        }
      : undefined,
    extra: additionalContext || {}
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': sentryAuth
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn(`[Sentry Edge] Delivery returned HTTP ${res.status}`);
    }
  } catch (deliveryErr) {
    console.warn('[Sentry Edge] Failed to send telemetry event:', deliveryErr);
  }
}
