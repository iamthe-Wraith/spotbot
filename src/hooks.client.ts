import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, PUBLIC_SENTRY_TRACES_SAMPLE_RATE } from '$env/static/public';
import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,

	tracesSampleRate: parseFloat(PUBLIC_SENTRY_TRACES_SAMPLE_RATE) ?? 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: parseFloat(PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE) ?? 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: parseFloat(PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE) ?? 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [replayIntegration()]
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
