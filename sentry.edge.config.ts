import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/sentry-shared";

Sentry.init(sharedSentryOptions);
