import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import inputs from "@tests/data/inputs";
import {
    applySessionInputsToLoaderData,
    clientLoader,
    makeCachedDefaults,
    makeLoaderData,
    mapRunRequest,
    mapRunResponse,
    normalizeLoaderData,
    parseCachedDefaults,
    Simulation,
} from "~/routes/simulation";
import { ErrorBoundary as SimulationErrorBoundary } from "~/routes/simulation";
import { HydrateFallback } from "~/root";
import {
    parseSimulationModelOutcome,
    type SimulationModelOutcome,
} from "@components/simulation/types";
import { RunStatus } from "@simulation/inputs";

describe("Simulation route contract", () => {
    it("maps loader defaults into explicit initialInputs and presets", () => {
        const mapped = makeLoaderData(inputs);

        expect(mapped.initialInputs).toBeDefined();
        expect(mapped.presets).toBeDefined();
        expect(mapped.initialInputs.interventions.length).toBe(
            mapped.presets.length,
        );

        // Ensure presets and editable initial state are separate object graphs.
        expect(mapped.initialInputs).not.toBe(mapped.presets as unknown);
        expect(mapped.initialInputs.interventions).not.toBe(mapped.presets);
        expect(mapped.initialInputs.interventions[0]).not.toBe(
            mapped.presets[0],
        );
    });

    it("parses cached defaults stored as SimulationLoaderData", () => {
        const loaderData = makeLoaderData(inputs);

        const parsed = parseCachedDefaults(
            JSON.stringify(makeCachedDefaults(loaderData)),
        );

        expect(parsed).toBeDefined();
        expect(parsed?.initialInputs.duration).toBe(inputs.duration);
        expect(parsed?.presets.length).toBe(inputs.interventions.length);
    });

    it("rejects unversioned cached defaults", () => {
        const parsed = parseCachedDefaults(JSON.stringify(inputs));

        expect(parsed).toBeNull();
    });

    it("rejects cached defaults with an incompatible version", () => {
        const loaderData = makeLoaderData(inputs);

        const parsed = parseCachedDefaults(
            JSON.stringify({ cacheVersion: 999, data: loaderData }),
        );

        expect(parsed).toBeNull();
    });

    it("returns null for invalid cached defaults", () => {
        const parsed = parseCachedDefaults("{invalid-json");

        expect(parsed).toBeNull();
    });

    it("normalizes SimulationLoaderData payloads", () => {
        const loaderData = makeLoaderData(inputs);

        const normalized = normalizeLoaderData(loaderData);

        expect(normalized).toBeDefined();
        expect(normalized?.initialInputs.duration).toBe(inputs.duration);
        expect(normalized?.presets[0].id).toBe(inputs.interventions[0].id);
    });

    it("normalizes legacy Inputs payloads", () => {
        const normalized = normalizeLoaderData(inputs);

        expect(normalized).toBeDefined();
        expect(normalized?.initialInputs.total_population).toBe(
            inputs.total_population,
        );
    });

    it("returns null when normalizing invalid payloads", () => {
        const normalized = normalizeLoaderData({ initialInputs: null });

        expect(normalized).toBeNull();
    });

    it("invalidates stale cached defaults before loading fresh data", async () => {
        sessionStorage.clear();
        sessionStorage.setItem(
            "default-inputs",
            JSON.stringify({ cacheVersion: 999, data: makeLoaderData(inputs) }),
        );

        const freshData = makeLoaderData({
            ...inputs,
            duration: inputs.duration + 1,
        });
        const loaded = await clientLoader({
            serverLoader: async () => freshData,
        } as never);

        expect(loaded.initialInputs.duration).toBe(inputs.duration + 1);
        expect(
            JSON.parse(sessionStorage.getItem("default-inputs") ?? "null"),
        ).toEqual(makeCachedDefaults(freshData));
    });

    it("applies session inputs over loader defaults", () => {
        const defaults = makeLoaderData(inputs);
        const sessionInputs = {
            ...inputs,
            duration: inputs.duration + 10,
        };

        const hydrated = applySessionInputsToLoaderData(
            defaults,
            sessionInputs,
        );

        expect(hydrated.initialInputs.duration).toBe(inputs.duration + 10);
        expect(hydrated.presets[0].id).toBe(defaults.presets[0].id);
    });

    it("maps run request into a plain JSON payload", () => {
        const payload = mapRunRequest(inputs) as {
            interventions: Array<{ name: string }>;
        };

        expect(payload).toBeDefined();
        expect(payload.interventions[0].name).toBe(
            inputs.interventions[0].name,
        );
        expect(payload).not.toBe(inputs as unknown);
    });

    it("maps successful run response", () => {
        const response = new Response("ok", { status: 200 });

        const mapped = mapRunResponse(response, "done");

        expect(mapped.ok).toBe(true);
        expect(mapped.status).toBe(200);
        expect(mapped.result).toBe("done");
        expect(mapped.error).toBeUndefined();
    });

    it("maps failed run response", () => {
        const response = new Response("failed", { status: 500 });

        const mapped = mapRunResponse(response, "backend error");

        expect(mapped.ok).toBe(false);
        expect(mapped.status).toBe(500);
        expect(mapped.error).toBe("backend error");
    });

    it("returns a structured error for invalid run requests", async () => {
        const response = await (
            await import("~/routes/simulation")
        ).action({
            request: new Request("http://localhost/simulation", {
                method: "POST",
                body: JSON.stringify({ invalid: true }),
                headers: { "content-type": "application/json" },
            }),
            context: undefined,
            params: {},
        } as never);

        expect(response).toEqual({
            ok: false,
            status: 400,
            error: "Invalid simulation request payload.",
        });
    });

    it("parses required histories and optional costs", () => {
        const outcome: SimulationModelOutcome = {
            background_death: [[0]],
            total_overdose: [[1]],
            fatal_overdose: [[2]],
            state: [[3]],
            intervention_admission: [[4]],
            undiscounted_total_cost: 10.5,
            discounted_total_cost: 8.25,
        };

        expect(parseSimulationModelOutcome(JSON.stringify(outcome))).toEqual(
            outcome,
        );
    });

    it("rejects outcomes missing required histories", () => {
        expect(
            parseSimulationModelOutcome(
                JSON.stringify({
                    background_death: [[0]],
                    total_overdose: [[1]],
                    fatal_overdose: [[2]],
                    state: [[3]],
                }),
            ),
        ).toBeNull();
    });

    it("rejects invalid optional costs", () => {
        expect(
            parseSimulationModelOutcome(
                JSON.stringify({
                    background_death: [[0]],
                    total_overdose: [[1]],
                    fatal_overdose: [[2]],
                    state: [[3]],
                    intervention_admission: [[4]],
                    discounted_total_cost: "8.25",
                }),
            ),
        ).toBeNull();
    });

    it("renders empty run body", () => {
        render(<RunStatus result={{ ok: true, status: 200 }} />);

        expect(
            screen.getByText(
                "There was an issue with the simulation outcomes.",
            ),
        ).toBeTruthy();
    });

    it("renders successful run results", () => {
        render(
            <RunStatus
                result={{
                    ok: true,
                    status: 200,
                    result: JSON.stringify({
                        background_death: [[0], [0], [0]],
                        total_overdose: [[0], [0], [0]],
                        fatal_overdose: [[0], [0], [0]],
                        state: [[0], [0], [0]],
                        intervention_admission: [[0], [0], [0]],
                    }),
                }}
            />,
        );

        expect(screen.getAllByText("Population Count Over Time")).toBeTruthy();
    });

    it("renders an error for malformed run results", () => {
        render(
            <RunStatus
                result={{ ok: true, status: 200, result: "{invalid-json" }}
            />,
        );

        expect(
            screen.getByText(
                "There was an issue with the simulation outcomes.",
            ),
        ).toBeTruthy();
    });

    it("offers retry when simulation defaults fail to load", async () => {
        let attempts = 0;
        const router = createMemoryRouter(
            [
                {
                    path: "/simulation",
                    loader: () => {
                        attempts += 1;
                        throw new Error("Defaults unavailable");
                    },
                    ErrorBoundary: () => (
                        <SimulationErrorBoundary error={undefined as never} />
                    ),
                },
            ],
            { initialEntries: ["/simulation"] },
        const router = createMemoryRouter(
            [
                {
                    path: "/simulation",
                    Component: <Simulation />,
                    HydrateFallback: HydrateFallback,
                    loader: () => {
                        attempts += 1;
                        throw new Error("Defaults unavailable");
                    },
                    ErrorBoundary: () => (
                        <SimulationErrorBoundary error={undefined as never} />
                    ),
                },
            ],
            { initialEntries: ["/simulation"] },
        );

        render(<RouterProvider router={router} />);

        expect(
            await screen.findByRole("heading", {
                name: "Simulation unavailable",
            }),
        ).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        await waitFor(() => expect(attempts).toBe(2));
    });

    it("renders error run status", () => {
        render(
            <RunStatus result={{ ok: false, status: 500, error: "Failed" }} />,
        );

        expect(
            screen.getByText(
                "An error happened while attempting to run the simulation. Please try again.",
            ),
        ).toBeTruthy();
    });
});
