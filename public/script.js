
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
