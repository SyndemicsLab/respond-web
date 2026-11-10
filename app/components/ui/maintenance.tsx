import logo from "~/images/menu-icon.svg";

export default function Maintenance() {
    return (
        <main id="maintenance">
            <div className="maint-heading">
                <img src={logo} />
                <h1>Down for Maintenance</h1>
            </div>
            <p>
                The RESPOND web tool is currently down for scheduled
                maintenance.
            </p>
        </main>
    );
}
