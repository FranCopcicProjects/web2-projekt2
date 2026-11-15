
const sqlButton = document.getElementById("sqlButton");

sqlButton.addEventListener("click", async () => {
    const username = document.getElementById("sqlUsername").value;
    const vulnerable = document.getElementById("sqlVulnerable").checked;

    const queryOutput = document.getElementById("sqlQuery");
    const resultsOutput = document.getElementById("sqlResults");

    queryOutput.textContent = "";
    resultsOutput.textContent = "Učitavanje...";

    try {
        const response = await fetch("/sql-injection", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                vulnerable
            })
        });

        const data = await response.json();

        if (!response.ok) {
            resultsOutput.textContent = data.error;
            return;
        }

        queryOutput.textContent = data.query;

        resultsOutput.replaceChildren();

        const count = document.createElement("p");
        count.textContent = `Pronađeno bilješki: ${data.count}`;
        resultsOutput.appendChild(count);

        for (const row of data.rows) {
            const item = document.createElement("p");
            item.textContent =
                `ID: ${row.id} | Korisnik: ${row.username} | Bilješka: ${row.content}`;

            resultsOutput.appendChild(item);
        }

    } catch (error) {
        console.error(error);
        resultsOutput.textContent = "Greška pri slanju zahtjeva.";
    }
});


const authLoginButton = document.getElementById("authLoginButton");
const authAttackButton = document.getElementById("authAttackButton");
const authResetButton = document.getElementById("authResetButton");

const authUsername = document.getElementById("authUsername");
const authPin = document.getElementById("authPin");
const authVulnerable = document.getElementById("authVulnerable");
const authStatus = document.getElementById("authStatus");
const authResults = document.getElementById("authResults");

let authRunning = false;

async function loginAttempt(username, pin) {
    const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            pin,
            vulnerable: authVulnerable.checked
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Greška pri prijavi.");
    }

    return data;
}

function displayAttempt(number, pin, data) {
    const item = document.createElement("p");

    item.textContent =
        `Pokušaj ${number}: PIN ${pin} - ${data.message}`;

    authResults.appendChild(item);
}

authLoginButton.addEventListener("click", async () => {
    if (authRunning) return;

    authRunning = true;
    authResults.replaceChildren();

    try {
        const username = authUsername.value.trim();
        const pin = authPin.value;

        const data = await loginAttempt(username, pin);

        authStatus.textContent = data.message;
        displayAttempt(1, pin, data);

    } catch (error) {
        console.error(error);
        authStatus.textContent = error.message;

    } finally {
        authRunning = false;
    }
});

authAttackButton.addEventListener("click", async () => {
    if (authRunning) return;

    const username = authUsername.value.trim();

    if (!username) {
        authStatus.textContent = "Unesi korisničko ime.";
        return;
    }

    authRunning = true;

    authLoginButton.disabled = true;
    authAttackButton.disabled = true;
    authResetButton.disabled = true;
    authUsername.disabled = true;
    authVulnerable.disabled = true;

    authResults.replaceChildren();
    authStatus.textContent = "Napad u tijeku...";

    try {
        for (let i = 0; i < 9999; i++) {
            const pin = String(i).padStart(4, "0");

            const data = await loginAttempt(username, pin);

            displayAttempt(i + 1, pin, data);

            if (data.success) {
                authStatus.textContent =
                    `Napad uspješan nakon ${i + 1} pokušaja!`;
                break;
            }

            if (data.blocked) {
                authStatus.textContent =
                    `Napad zaustavljen nakon ${i + 1} pokušaja.`;
                break;
            }

            if (data.message === "Korisničko ime ne postoji.") {
                authStatus.textContent = data.message;
                break;
            }

            if (i === 49) {
                authStatus.textContent =
                    "PIN nije pronađen u testnom rasponu.";
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (error) {
        console.error(error);
        authStatus.textContent = error.message;

    } finally {
        authRunning = false;

        authLoginButton.disabled = false;
        authAttackButton.disabled = false;
        authResetButton.disabled = false;
        authUsername.disabled = false;
        authVulnerable.disabled = false;
    }
});

authResetButton.addEventListener("click", async () => {
    if (authRunning) return;

    authRunning = true;

    try {
        const username = authUsername.value.trim();

        const response = await fetch("/auth/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Greška pri resetiranju.");
        }

        authStatus.textContent = data.message;
        authResults.replaceChildren();
        authPin.value = "";

    } catch (error) {
        console.error(error);
        authStatus.textContent = error.message;

    } finally {
        authRunning = false;
    }
});
