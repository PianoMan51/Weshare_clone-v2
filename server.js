let express = require("express");
let fs = require("fs");
let path = require("path");

let app = express();
let port = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "10mb" }));

app.use(express.json());

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

app.get("/bills", (req, res) => {
  const data = "bills.json";

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

app.post("/addBill", (req, res) => {
  const bill = req.body;

  fs.readFile("bills.json", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    let bills = [];
    if (data.length > 0) {
      bills = JSON.parse(data);
    }

    bills.push(bill);

    fs.writeFile("bills.json", JSON.stringify(players), (err) => {
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

  // Read the current contents of expenses.json
  fs.readFile(filename, "utf8", (err, data) => {
    try {
      // Parse the JSON data
      let expenses = JSON.parse(data);
      
      // Remove the expense from the array
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
