import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import type { Intervention } from "~/features/simulation/model";
import type { SimulationRunResponse } from "@components/simulation/types";
import ScrollIndicator, {
    ScrollDirection,
} from "@components/ui/scroll-indicator";
import { useInputs } from "@components/input-contexts";
import {
    validateInterventionNames,
    getInterventionNameErrors,
} from "@simulation/interventions";
import Input from "@simulation/inputs";
import { getSliderConstraintError } from "~/features/simulation/reducer";
import {
    clearSessionInputsFromStorage,
    persistSessionInputsToStorage,
} from "~/features/simulation/storage";
import { mapRunRequest } from "~/features/simulation/api";
import respond from "~/images/diagram/system.svg";
import "~/styles/simulation.scss";

const SESSION_WRITE_DEBOUNCE_MS = 200;

export default function SimulationContent({
    presets,
}: {
    presets: Intervention[];
}) {
    const inputs = useInputs();
    const fetcher = useFetcher<SimulationRunResponse>();
    const nameValidationError = validateInterventionNames(inputs.interventions);
    const interventionNameErrors = getInterventionNameErrors(
        inputs.interventions,
    );
    const populationConstraintError = getSliderConstraintError(
        inputs,
        "total_population",
    );

    const handleSubmit = (): boolean => {
        if (
            nameValidationError !== null ||
            populationConstraintError.hasViolation
        ) {
            return false;
        }

        const submission = mapRunRequest(inputs);
        fetcher.submit(submission, {
            method: "POST",
            encType: "application/json",
        });
        return true;
    };

    const handleReset = () => {
        if (window.confirm("Confirm request to reset data.")) {
            clearSessionInputsFromStorage();
            window.location.reload();
        }
    };

    const pending = fetcher.state !== "idle";
    const inputRef = useRef<HTMLDivElement | null>(null);
    const [inputsVisible, updateInputsVisible] = useState(false);
    const [direction, updateDirection] = useState(ScrollDirection.Down);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.boundingClientRect.top < 0) {
                    updateDirection(ScrollDirection.Up);
                } else {
                    updateDirection(ScrollDirection.Down);
                }
                updateInputsVisible(entry.isIntersecting);
            },
            { threshold: [0.05] },
        );
        if (inputRef.current !== null) {
            observer.observe(inputRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            persistSessionInputsToStorage(inputs);
        }, SESSION_WRITE_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [inputs]);

    return (
        <main id="simulation">
            <img
                src={respond}
                alt="RESPOND model structure diagram"
                className="system-image"
            />
            <div id="inputs" ref={inputRef}>
                <div className="input-button-wrapper">
                    <Link className="glossary-button" to="/glossary">
                        Glossary
                    </Link>
                    <button className="reset-data-button" onClick={handleReset}>
                        Reset Data
                    </button>
                </div>
                <ScrollIndicator
                    destination="/simulation#inputs"
                    options={{
                        visible: !inputsVisible,
                        direction,
                    }}
                />
                <Input
                    handleSubmit={handleSubmit}
                    nameValidationError={nameValidationError}
                    interventionNameErrors={interventionNameErrors}
                    populationConstraintError={
                        populationConstraintError.hasViolation
                            ? populationConstraintError.message
                            : null
                    }
                    pending={pending}
                    presets={presets}
                    runResult={fetcher.data}
                />
            </div>
        </main>
    );
}
