import type { Inputs, Intervention } from "~/features/simulation/model";
import type { SimulationLoaderData } from "@components/simulation/types";

export function isTransitionLike(value: unknown): boolean {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as {
        id?: unknown;
        name?: unknown;
        probability?: unknown;
    };
    return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        typeof candidate.probability === "number"
    );
}

export function isOverdoseLike(value: unknown): boolean {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as { probability?: unknown; injection?: unknown };
    return (
        typeof candidate.probability === "number" &&
        typeof candidate.injection === "boolean"
    );
}

export function isInterventionLike(value: unknown): boolean {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as {
        id?: unknown;
        name?: unknown;
        active?: unknown;
        population?: unknown;
        transitions?: unknown;
        overdose?: unknown;
    };

    if (
        typeof candidate.id !== "number" ||
        typeof candidate.name !== "string" ||
        typeof candidate.active !== "boolean" ||
        typeof candidate.population !== "number"
    ) {
        return false;
    }

    if (
        !Array.isArray(candidate.transitions) ||
        !Array.isArray(candidate.overdose)
    ) {
        return false;
    }

    return (
        candidate.transitions.every(isTransitionLike) &&
        candidate.overdose.every(isOverdoseLike)
    );
}

export function isInputsLike(value: unknown): value is Inputs {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as {
        duration?: unknown;
        total_population?: unknown;
        changing_population?: unknown;
        fatal_overdoses?: unknown;
        interventions?: unknown;
    };

    if (
        typeof candidate.duration !== "number" ||
        typeof candidate.total_population !== "number" ||
        typeof candidate.changing_population !== "number" ||
        typeof candidate.fatal_overdoses !== "number" ||
        !Array.isArray(candidate.interventions)
    ) {
        return false;
    }

    return candidate.interventions.every(isInterventionLike);
}

export function isSimulationLoaderDataLike(
    value: unknown,
): value is SimulationLoaderData {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as {
        initialInputs?: unknown;
        presets?: unknown;
    };

    if (
        !isInputsLike(candidate.initialInputs) ||
        !Array.isArray(candidate.presets)
    ) {
        return false;
    }

    return candidate.presets.every(isInterventionLike);
}

export function parseJson(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function cloneIntervention(intervention: Intervention): Intervention {
    return {
        ...intervention,
        transitions: intervention.transitions.map((transition) => ({
            ...transition,
        })),
        overdose: intervention.overdose.map((overdose) => ({ ...overdose })),
    };
}

export function cloneInputs(inputs: Inputs): Inputs {
    return {
        ...inputs,
        interventions: inputs.interventions.map(cloneIntervention),
    };
}
