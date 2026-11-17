import type { Inputs } from "~/features/simulation/model";
import type {
    SimulationDefaultsCache,
    SimulationLoaderData,
    SimulationSessionMeta,
    SimulationStorage,
} from "@components/simulation/types";
import {
    cloneInputs,
    cloneIntervention,
    isInputsLike,
    isSimulationLoaderDataLike,
    parseJson,
} from "~/features/simulation/validation";

export const DEFAULT_INPUTS_KEY = "default-inputs";
export const DEFAULTS_CACHE_VERSION = 1;
export const SESSION_INPUTS_KEY = "simulation-session-inputs";
export const SESSION_META_KEY = "simulation-session-meta";
export const SESSION_SCHEMA_VERSION = 1;

export function safeGetItem(
    storage: SimulationStorage,
    key: string,
): string | null {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(
    storage: SimulationStorage,
    key: string,
    value: string,
): void {
    try {
        storage.setItem(key, value);
    } catch {
        // Storage is optional; the in-memory simulation state remains usable.
    }
}

export function safeRemoveItem(storage: SimulationStorage, key: string): void {
    try {
        storage.removeItem(key);
    } catch {
        // Storage is optional; stale data cannot prevent the route from loading.
    }
}

function parseSessionMeta(raw: string | null): SimulationSessionMeta | null {
    if (raw === null) {
        return null;
    }

    const parsed = parseJson(raw);
    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }

    const candidate = parsed as {
        schemaVersion?: unknown;
        lastUpdated?: unknown;
    };

    if (
        typeof candidate.schemaVersion !== "number" ||
        typeof candidate.lastUpdated !== "number"
    ) {
        return null;
    }

    return {
        schemaVersion: candidate.schemaVersion,
        lastUpdated: candidate.lastUpdated,
    };
}

export function parseCachedDefaults(
    raw: string | null,
): SimulationLoaderData | null {
    if (raw === null) {
        return null;
    }

    const parsed = parseJson(raw);
    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }

    const candidate = parsed as Partial<SimulationDefaultsCache>;
    if (candidate.cacheVersion !== DEFAULTS_CACHE_VERSION) {
        return null;
    }

    return normalizeLoaderData(candidate.data);
}

export function makeCachedDefaults(
    data: SimulationLoaderData,
): SimulationDefaultsCache {
    return {
        cacheVersion: DEFAULTS_CACHE_VERSION,
        data,
    };
}

export function normalizeLoaderData(
    data: unknown,
): SimulationLoaderData | null {
    if (isSimulationLoaderDataLike(data)) {
        return {
            initialInputs: cloneInputs(data.initialInputs),
            presets: data.presets.map(cloneIntervention),
        };
    }

    if (isInputsLike(data)) {
        return makeLoaderData(data);
    }

    return null;
}

export function readSessionInputsFromStorage(
    storage: SimulationStorage = sessionStorage,
): Inputs | null {
    const rawMeta = safeGetItem(storage, SESSION_META_KEY);
    const meta = parseSessionMeta(rawMeta);

    if (
        rawMeta !== null &&
        (meta === null || meta.schemaVersion !== SESSION_SCHEMA_VERSION)
    ) {
        safeRemoveItem(storage, SESSION_INPUTS_KEY);
        safeRemoveItem(storage, SESSION_META_KEY);
        return null;
    }

    const rawInputs = safeGetItem(storage, SESSION_INPUTS_KEY);
    if (rawInputs === null) {
        return null;
    }

    const parsed = parseJson(rawInputs);
    if (!isInputsLike(parsed)) {
        safeRemoveItem(storage, SESSION_INPUTS_KEY);
        safeRemoveItem(storage, SESSION_META_KEY);
        return null;
    }

    return cloneInputs(parsed);
}

export function persistSessionInputsToStorage(
    inputs: Inputs,
    storage: SimulationStorage = sessionStorage,
    now: number = Date.now(),
): void {
    safeSetItem(storage, SESSION_INPUTS_KEY, JSON.stringify(inputs));
    safeSetItem(
        storage,
        SESSION_META_KEY,
        JSON.stringify({
            schemaVersion: SESSION_SCHEMA_VERSION,
            lastUpdated: now,
        }),
    );
}

export function clearSessionInputsFromStorage(
    storage: SimulationStorage = sessionStorage,
): void {
    safeRemoveItem(storage, SESSION_INPUTS_KEY);
    safeRemoveItem(storage, SESSION_META_KEY);
}

export function applySessionInputsToLoaderData(
    baseLoaderData: SimulationLoaderData,
    sessionInputs: Inputs | null,
): SimulationLoaderData {
    if (sessionInputs === null) {
        return baseLoaderData;
    }

    return {
        ...baseLoaderData,
        initialInputs: cloneInputs(sessionInputs),
    };
}

export function makeLoaderData(inputs: Inputs): SimulationLoaderData {
    return {
        initialInputs: {
            ...inputs,
            interventions: inputs.interventions.map(cloneIntervention),
        },
        presets: inputs.interventions.map(cloneIntervention),
    };
}
