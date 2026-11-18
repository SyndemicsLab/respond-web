import type { Inputs } from "~/features/simulation/model";
import type {
    SimulationRunRequest,
    SimulationRunResponse,
} from "@components/simulation/types";

export function mapRunRequest(inputs: Inputs): SimulationRunRequest {
    return JSON.parse(JSON.stringify(inputs)) as SimulationRunRequest;
}

export function mapRunResponse(
    response: Response,
    result: string,
): SimulationRunResponse {
    if (!response.ok) {
        return {
            ok: false,
            status: response.status,
            error:
                result ||
                `Simulation run failed with status ${response.status}.`,
        };
    }

    return {
        ok: true,
        status: response.status,
        result,
    };
}

export function invalidRunRequest(error: string): SimulationRunResponse {
    return {
        ok: false,
        status: 400,
        error,
    };
}

export async function readResponseBody(response: Response): Promise<string> {
    if (response.body === null) {
        return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
    }

    return result + decoder.decode();
}
