import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "./lib/sentry-utils";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 1,
  debug: false,
  beforeSend: sentryBeforeSend,
});
