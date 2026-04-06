import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "./lib/sentry-utils";

Sentry.init({
  // Override this with your real DSN in production (.env), e.g.,
  // NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  beforeSend: sentryBeforeSend,
});
