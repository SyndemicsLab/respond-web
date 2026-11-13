import React from "react";
import type { Route } from "./+types/root";
import {
    isRouteErrorResponse,
    Links,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "react-router";

import { sitemap } from "~/sitemap";
import Navbar from "@components/ui/navbar";
import Footer from "@components/ui/footer";
import Maintenance from "@components/ui/maintenance";
import appStylesHref from "~/globals.scss?url";
import tailwindStyle from "~/styles/tailwind.css?url";
import syndemicslogo from "~/images/logo.png?no-inline";

export async function loader() {
    return {
        maintenance: Boolean(Number(process.env.MAINTENANCE)),
    };
}

export default function App() {
    const env = useLoaderData<typeof loader>();

    if (env.maintenance) {
        return <Maintenance />;
    }

    return (
        <>
            <Navbar paths={sitemap} />
            <Outlet />
            <Footer />
        </>
    );
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>RESPOND — Syndemics Lab</title>
                <meta
                    name="author"
                    content="The Syndemics Lab at Boston Medical Center"
                />
                <meta name="icon" content="/favicon.ico" />
                <meta title="RESPOND Simulation — Syndemics Lab" />
                <meta
                    name="description"
                    content="The Syndemics Lab at Boston Medical Center's RESPOND simulation as a web application."
                />
                <meta
                    property="og:title"
                    content="RESPOND Simulation — Syndemics Lab"
                />
                <meta
                    property="og:description"
                    content="The Syndemics Lab at Boston Medical Center's RESPOND simulation as a web application."
                />
                <meta property="og:image:type" content="image/png" />
                <meta property="og:image:width" content="500" />
                <meta property="og:image:height" content="500" />
                <meta property="og:image:height" content="500" />
                <meta property="og:image" content={syndemicslogo} />
                <link rel="stylesheet" href={tailwindStyle} />
                <link rel="stylesheet" href={appStylesHref} />
                <link rel="icon" sizes="32x32" href="/favicon.ico" />
                <Links />
            </head>
            <body>
                <div id="content">{children}</div>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: { error: Route.ErrorBoundaryProps }) {
    let message = "Uh-oh, something went wrong!";
    let details =
        "An unknown error occurred. The page you are attempting to see is currently unavailable.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    }

    return (
        <main id="error-page">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre>
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}

export function HydrateFallback() {
    return (
        <div id="loading-splash">
            <div id="loading-splash-spinner" />
            <p>Loading, please wait...</p>
        </div>
    );
}
