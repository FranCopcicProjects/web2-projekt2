require("dotenv").config();

const express = require("express");
const path = require("path");
const { pool, sqlPool } = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/sql-injection", async (req, res) => {
    const { username, vulnerable } = req.body;

    if (typeof username !== "string") {
        return res.status(400).json({
            error: "Korisničko ime mora biti string."
        });
    }

    const isVulnerable = vulnerable === true;

    try {
        let query;
        let result;

        if (isVulnerable) {
            query = `SELECT * FROM notes WHERE username = '${username}'`;
            result = await sqlPool.query(query);;
        } else {
            query = "SELECT * FROM notes WHERE username = $1";
            result = await sqlPool.query(query, [username]);
        }

        res.json({
            vulnerable: isVulnerable,
            query,
            rows: result.rows,
            count: result.rowCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Greška prilikom izvršavanja SQL upita."
        });
    }
});



app.post("/auth/login", async (req, res) => {
    const { username, pin, vulnerable } = req.body;
    const isVulnerable = vulnerable === true;

    if (
        typeof username !== "string" ||
        typeof pin !== "string" ||
        username.length > 50 ||
        !/^\d{4}$/.test(pin)
    ) {
        return res.status(400).json({
            error: "Neispravni podaci za prijavu."
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT pin, failed_attempts, locked_until
             FROM users
             WHERE username = $1
             FOR UPDATE`,
            [username]
        );

        if (result.rows.length === 0) {
            await client.query("COMMIT");

            return res.json({
                success: false,
                blocked: false,
                message: isVulnerable
                    ? "Korisničko ime ne postoji."
                    : "Pogrešno korisničko ime ili PIN."
            });
        }

        const user = result.rows[0];

        if (isVulnerable) {
            const success = pin === user.pin;

            await client.query("COMMIT");

            return res.json({
                success,
                blocked: false,
                message: success
                    ? "Prijava uspješna!"
                    : "Pogrešan PIN."
            });
        }

        if (
            user.locked_until &&
            new Date(user.locked_until) > new Date()
        ) {
            await client.query("COMMIT");

            return res.json({
                success: false,
                blocked: true,
                message: "Račun je privremeno zaključan."
            });
        }

        let failedAttempts = user.failed_attempts;

        if (user.locked_until) {
            failedAttempts = 0;
        }

        if (pin === user.pin) {
            await client.query(
                `UPDATE users
                 SET failed_attempts = 0,
                     locked_until = NULL
                 WHERE username = $1`,
                [username]
            );

            await client.query("COMMIT");

            return res.json({
                success: true,
                blocked: false,
                message: "Prijava uspješna!"
            });
        }

        failedAttempts++;

        const blocked = failedAttempts >= 5;

        await client.query(
            `UPDATE users
             SET failed_attempts = $1,
                 locked_until = CASE
                     WHEN $2 THEN NOW() + INTERVAL '2 minutes'
                     ELSE NULL
                 END
             WHERE username = $3`,
            [failedAttempts, blocked, username]
        );

        await client.query("COMMIT");

        res.json({
            success: false,
            blocked,
            failedAttempts,
            message: blocked
                ? "Račun je zaključan na 2 minute."
                : "Pogrešno korisničko ime ili PIN."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        res.status(500).json({
            error: "Greška prilikom autentifikacije."
        });

    } finally {
        client.release();
    }
});



app.post("/auth/reset", async (req, res) => {
    const { username } = req.body;

    if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({
            error: "Neispravno korisničko ime."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE users
             SET failed_attempts = 0,
                 locked_until = NULL
             WHERE username = $1
             RETURNING username`,
            [username]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Korisnik ne postoji."
            });
        }

        res.json({
            message: `Demonstracija resetirana za korisnika ${result.rows[0].username}.`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Greška prilikom resetiranja."
        });
    }
});




app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
