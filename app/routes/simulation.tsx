// Package types
import type { Route } from "./+types/simulation";
import type {
    SimulationLoaderData,
    SimulationRunResponse,
} from "@components/simulation/types";

// Node, React, and React Router imports
import {
    Await,
    useLoaderData,
    useRevalidator,
    isRouteErrorResponse,
} from "react-router";
import { Suspense } from "react";

// Component imports
import { InputProvider } from "@components/input-contexts";
import SimulationContent from "@components/simulation/simulation-content";

// Asset imports
import {
    invalidRunRequest,
    mapRunRequest,
    mapRunResponse,
    readResponseBody,
} from "~/features/simulation/api";
import { isInputsLike } from "~/features/simulation/validation";
import {
    DEFAULT_INPUTS_KEY,
    applySessionInputsToLoaderData,
    clearSessionInputsFromStorage,
    makeCachedDefaults,
    makeLoaderData,
    normalizeLoaderData,
    parseCachedDefaults,
    persistSessionInputsToStorage,
    readSessionInputsFromStorage,
    safeGetItem,
    safeRemoveItem,
    safeSetItem,
} from "~/features/simulation/storage";
import "~/styles/simulation.scss";

export {
    applySessionInputsToLoaderData,
    clearSessionInputsFromStorage,
    makeCachedDefaults,
    makeLoaderData,
    normalizeLoaderData,
    parseCachedDefaults,
    persistSessionInputsToStorage,
    readSessionInputsFromStorage,
};

export { mapRunRequest, mapRunResponse };

// Action and Loader Hooks
export async function loader() {
    const response = await fetch(`${process.env.API_URL}/defaults`, {
        method: "GET",
        headers: {
            "x-api-key": `${process.env.API_KEY}`,
            operation: "get_default_inputs",
        },
    });

    if (!response.ok) {
        throw new Response("Failed to fetch simulation defaults.", {
            status: response.status,
            statusText: response.statusText,
        });
    }

    const rawData = (await response.json()) as unknown;
    const normalizedData = normalizeLoaderData(rawData);

    if (normalizedData === null) {
        throw new Response("Invalid simulation defaults payload.", {
            status: 500,
        });
    }

    return normalizedData;
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
    const sessionInputs = readSessionInputsFromStorage();

    // Return cached API defaults when available, then apply current session state.
    const cachedDefaults = parseCachedDefaults(
        safeGetItem(sessionStorage, DEFAULT_INPUTS_KEY),
    );
    if (cachedDefaults !== null) {
        return applySessionInputsToLoaderData(cachedDefaults, sessionInputs);
    }

    if (safeGetItem(sessionStorage, DEFAULT_INPUTS_KEY) !== null) {
        safeRemoveItem(sessionStorage, DEFAULT_INPUTS_KEY);
    }

    const serverData = (await serverLoader()) as unknown;
    const loaderData = normalizeLoaderData(serverData);

    if (loaderData === null) {
        throw new Error("Invalid simulation loader data.");
    }

    safeSetItem(
        sessionStorage,
        DEFAULT_INPUTS_KEY,
        JSON.stringify(makeCachedDefaults(loaderData)),
    );

    return applySessionInputsToLoaderData(loaderData, sessionInputs);
}
clientLoader.hydrate = true;

export async function action({ request }: Route.ActionArgs) {
    let data: unknown;
    try {
        data = await request.json();
    } catch {
        return invalidRunRequest("Invalid simulation request payload.");
    }

    if (!isInputsLike(data)) {
        return invalidRunRequest("Invalid simulation request payload.");
    }

    try {
        // use the fetch api to send the json to the backend
        const response = await fetch(`${process.env.API_URL}/run`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "x-api-key": `${process.env.API_KEY}`,
                "content-type": "application/json",
                operation: "run_model",
            },
        });

        const result = await readResponseBody(response);
        if (!response.ok) {
            console.error(result);
        }
        return mapRunResponse(response, result);
    } catch (error) {
        return {
            ok: false,
            status: 500,
            error: error instanceof Error ? error.message : "Unexpected error.",
        } as SimulationRunResponse;
    }
}

export default function Simulation() {
    const loaderData = useLoaderData<typeof clientLoader>();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Await resolve={loaderData}>
                {(resolvedLoaderData: SimulationLoaderData) => (
                    <InputProvider
                        initialState={resolvedLoaderData.initialInputs}
                    >
                        <SimulationContent
                            presets={resolvedLoaderData.presets}
                        />
                    </InputProvider>
                )}
            </Await>
        </Suspense>
    );
}

export function ErrorBoundary({ error }: { error: unknown }) {
    const revalidator = useRevalidator();
    const isRetrying = revalidator.state === "loading";

    return (
        <main id="simulation-error" role="alert">
            <h1>Simulation unavailable</h1>
            <p>
                The simulation defaults could not be loaded. Please try again.
            </p>
            {isRouteErrorResponse(error) && error.statusText ? (
                <p>{error.statusText}</p>
            ) : null}
            <button
                type="button"
                onClick={() => revalidator.revalidate()}
                disabled={isRetrying}
            >
                {isRetrying ? "Retrying..." : "Retry"}
            </button>
        </main>
    );
}
