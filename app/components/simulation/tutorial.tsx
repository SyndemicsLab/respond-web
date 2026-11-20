import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import page1 from "~/images/tutorial/1.jpg";
import page2 from "~/images/tutorial/2.jpg";
import page3 from "~/images/tutorial/3.jpg";
import page4 from "~/images/tutorial/4.jpg";
import page5 from "~/images/tutorial/5.jpg";
import page6 from "~/images/tutorial/6.jpg";
import page7 from "~/images/tutorial/7.jpg";
import page8 from "~/images/tutorial/8.jpg";
import page9 from "~/images/tutorial/9.jpg";
import page10 from "~/images/tutorial/10.jpg";
import page11 from "~/images/tutorial/11.jpg";
import page12 from "~/images/tutorial/12.jpg";

const tutorialPages = [
    page1,
    page2,
    page3,
    page4,
    page5,
    page6,
    page7,
    page8,
    page9,
    page10,
    page11,
    page12,
] as const;

export default function SimulationTutorial() {
    const [open, setOpen] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const lastPageIndex = tutorialPages.length - 1;

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            setPageIndex(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="tutorial-button" type="button">
                    Tutorial
                </button>
            </DialogTrigger>
            <DialogContent className="tutorial-dialog">
                <DialogHeader>
                    <DialogTitle>How to use the simulation</DialogTitle>
                    <DialogDescription>
                        Follow the tutorial pages to learn how the RESPOND model
                        works.
                    </DialogDescription>
                </DialogHeader>
                <div className="tutorial-carousel" aria-live="polite">
                    <img
                        className="tutorial-page"
                        src={tutorialPages[pageIndex]}
                        alt={`Simulation tutorial page ${pageIndex + 1} of ${tutorialPages.length}`}
                    />
                    <div className="tutorial-controls">
                        <button
                            className="tutorial-navigation"
                            type="button"
                            onClick={() =>
                                setPageIndex((current) => current - 1)
                            }
                            disabled={pageIndex === 0}
                            aria-label="Previous tutorial page"
                        >
                            <ChevronLeft aria-hidden="true" />
                            Previous
                        </button>
                        <span className="tutorial-page-count">
                            Page {pageIndex + 1} of {tutorialPages.length}
                        </span>
                        <button
                            className="tutorial-navigation"
                            type="button"
                            onClick={() =>
                                setPageIndex((current) => current + 1)
                            }
                            disabled={pageIndex === lastPageIndex}
                            aria-label="Next tutorial page"
                        >
                            Next
                            <ChevronRight aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
