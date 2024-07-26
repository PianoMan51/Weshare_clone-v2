const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 8080;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json());

/////////////////////  PUBLIC /////////////////////

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

app.get("/main.js", (req, res) => {
  res.sendFile(path.join(__dirname, "main.js"), {
    headers: {
      "Content-Type": "text/javascript",
    },
  });
});

app.get("/main.css", (req, res) => {
  res.sendFile(path.join(__dirname, "main.css"), {
    headers: {
      "Content-Type": "text/css",
    },
  });
});

/////////////////////  GET DATA /////////////////////

app.get("/expenses", (req, res) => {
  const data = "expenses.json";

  fs.readFile(data, "utf8", (err, fileContent) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading JSON file.");
      return;
    }
    try {
      const jsonData = JSON.parse(fileContent);
      res.json(jsonData);
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      res.status(500).send("Error parsing JSON file.");
    }
  });
});

app.get("/players", (req, res) => {
  const data = "players.json";

  fs.readFile(data, "utf8", (err, fileContent) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading JSON file.");
      return;
    }
    try {
      const jsonData = JSON.parse(fileContent);
      res.json(jsonData);
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      res.status(500).send("Error parsing JSON file.");
    }
  });
});

app.get("/tabs", (req, res) => {
  const data = "tabs.json";

  fs.readFile(data, "utf8", (err, fileContent) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading JSON file.");
      return;
    }
    try {
      const jsonData = JSON.parse(fileContent);
      res.json(jsonData);
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      res.status(500).send("Error parsing JSON file.");
    }
  });
});

/////////////////////  POST DATA /////////////////////

app.post("/addExpense", (req, res) => {
  const expense = req.body;

  fs.readFile("expenses.json", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    let allExpenses = [];
    if (data.length > 0) {
      allExpenses = JSON.parse(data);
    }

    allExpenses.push(expense);

    fs.writeFile("expenses.json", JSON.stringify(allExpenses), (err) => {
      if (err) {
        console.error("Error writing file:", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.status(200).send("Expense added successfully");
    });
  });
});

app.post("/addPlayer", (req, res) => {
  const player = req.body;

  fs.readFile("players.json", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    let players = [];
    if (data.length > 0) {
      players = JSON.parse(data);
    }

    players.push(player);

    fs.writeFile("players.json", JSON.stringify(players), (err) => {
      if (err) {
        console.error("Error writing file:", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.status(200).send("Player added successfully");
    });
  });
});

app.post("/addTab", (req, res) => {
  const tab = req.body;
  fs.readFile("tabs.json", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    let tabs = [];
    if (data.length > 0) {
      tabs = JSON.parse(data);
    }

    tabs.push(tab);

    fs.writeFile("tabs.json", JSON.stringify(tabs), (err) => {
      if (err) {
        console.error("Error writing file:", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.status(200).send("Player added successfully");
    });
  });
});

/////////////////////  DELETE DATA /////////////////////
app.delete("/delete_expense/:id", (req, res) => {
  const expenseId = req.params.id;
  const filename = "expenses.json";

  fs.readFile(filename, "utf8", (err, data) => {
    try {
      let expenses = JSON.parse(data);

      expenses.splice(expenseId, 1);

      // Save the updated JSON back to the file
      fs.writeFile(
        filename,
        JSON.stringify(expenses, null, 2),
        "utf8",
        (err) => {
          if (err) {
            console.error(`Error writing file ${filename}:`, err);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          // Respond with success message
          res.json({ message: "Expense deleted successfully" });
        }
      );
    } catch (error) {
      console.error("Error parsing JSON:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

app.delete("/delete_tab/:id", (req, res) => {
  let tabId = req.params.id;
  let filename = "tabs.json";

  fs.readFile(filename, "utf8", (err, data) => {
    let tabs = JSON.parse(data);
    tabs.splice(tabId, 1);
    // Save the updated JSON back to the file
    fs.writeFile(
      filename,
      JSON.stringify(tabs, null, 2),

      "utf8",
      (err) => {
        if (err) {
          console.error(`Error writing file ${filename}:`, err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        res.json({ message: "Tab deleted successfully" });
      }
    );
  });
});

/////////////////////  PUT DATA /////////////////////

app.put("/data/:index", (req, res) => {
  const index = req.query.index;

  let { payer, others } = req.body;

  fs.readFile("tabs.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading JSON file.");
      return;
    }

    let jsonData = JSON.parse(data);

    jsonData[index] = {
      payer,
      others,
    };

    fs.writeFile(
      "tabs.json",
      JSON.stringify(jsonData),

      "utf8",
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error writing to JSON file.");
          return;
        }
        res.json({ message: "Tab updated successfully." });
      }
    );
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  exec(`start http://localhost:${port}`);

});
