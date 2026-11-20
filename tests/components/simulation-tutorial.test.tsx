import { fireEvent, render, screen } from "@testing-library/react";
import SimulationTutorial from "@components/simulation/tutorial";

describe("SimulationTutorial", () => {
    it("opens on page one and navigates through the tutorial", () => {
        render(<SimulationTutorial />);

        fireEvent.click(screen.getByRole("button", { name: "Tutorial" }));

        expect(screen.getByText("Page 1 of 12")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Previous tutorial page" }),
        ).toHaveProperty("disabled", true);

        fireEvent.click(
            screen.getByRole("button", { name: "Next tutorial page" }),
        );

        expect(screen.getByText("Page 2 of 12")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Previous tutorial page" }),
        ).toHaveProperty("disabled", false);
    });

    it("resets to page one after closing and reopening", () => {
        render(<SimulationTutorial />);

        fireEvent.click(screen.getByRole("button", { name: "Tutorial" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Next tutorial page" }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(screen.queryByText("Page 2 of 12")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Tutorial" }));

        expect(screen.getByText("Page 1 of 12")).toBeTruthy();
    });
});
