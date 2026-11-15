require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db/database");

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
            result = await pool.query(query);
        } else {
            query = "SELECT * FROM notes WHERE username = $1";
            result = await pool.query(query, [username]);
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


app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
