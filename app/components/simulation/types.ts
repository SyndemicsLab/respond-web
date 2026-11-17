import type { Inputs, Intervention } from "~/features/simulation/model";

export interface SimulationLoaderData {
    initialInputs: Inputs;
    presets: Intervention[];
}

export interface SimulationDefaultsCache {
    cacheVersion: number;
    data: SimulationLoaderData;
}

export type SimulationJsonValue =
    | string
    | number
    | boolean
    | null
    | SimulationJsonValue[]
    | { [key: string]: SimulationJsonValue };

export type SimulationRunRequest = {
    [key: string]: SimulationJsonValue;
};

export interface SimulationRunResponse {
    ok: boolean;
    status: number;
    result?: string;
    error?: string;
}

export interface SimulationModelOutcome {
    background_death: number[][];
    total_overdose: number[][];
    fatal_overdose: number[][];
    state: number[][];
    intervention_admission: number[][];
    undiscounted_total_cost?: number;
    discounted_total_cost?: number;
}

function isHistoryList(value: unknown): value is number[][] {
    return (
        Array.isArray(value) &&
        value.every(
            (timestep) =>
                Array.isArray(timestep) &&
                timestep.every(
                    (value) =>
                        typeof value === "number" && Number.isFinite(value),
                ),
        )
    );
}

export function parseSimulationModelOutcome(
    raw: string,
): SimulationModelOutcome | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }

    const candidate = parsed as {
        background_death?: unknown;
        total_overdose?: unknown;
        fatal_overdose?: unknown;
        state?: unknown;
        intervention_admission?: unknown;
        undiscounted_total_cost?: unknown;
        discounted_total_cost?: unknown;
    };

    if (
        !isHistoryList(candidate.background_death) ||
        !isHistoryList(candidate.total_overdose) ||
        !isHistoryList(candidate.fatal_overdose) ||
        !isHistoryList(candidate.state) ||
        !isHistoryList(candidate.intervention_admission)
    ) {
        return null;
    }

    if (
        (candidate.undiscounted_total_cost !== undefined &&
            (typeof candidate.undiscounted_total_cost !== "number" ||
                !Number.isFinite(candidate.undiscounted_total_cost))) ||
        (candidate.discounted_total_cost !== undefined &&
            (typeof candidate.discounted_total_cost !== "number" ||
                !Number.isFinite(candidate.discounted_total_cost)))
    ) {
        return null;
    }

    return {
        background_death: candidate.background_death,
        total_overdose: candidate.total_overdose,
        fatal_overdose: candidate.fatal_overdose,
        state: candidate.state,
        intervention_admission: candidate.intervention_admission,
        ...(candidate.undiscounted_total_cost !== undefined && {
            undiscounted_total_cost: candidate.undiscounted_total_cost,
        }),
        ...(candidate.discounted_total_cost !== undefined && {
            discounted_total_cost: candidate.discounted_total_cost,
        }),
    };
}

export interface SimulationSessionMeta {
    schemaVersion: number;
    lastUpdated: number;
}

export type SimulationStorage = Pick<
    Storage,
    "getItem" | "setItem" | "removeItem"
>;
