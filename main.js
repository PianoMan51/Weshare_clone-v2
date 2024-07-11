let addPlayerButton = document.getElementById("add_playerButton");
let addPlayersInput = document.getElementById("add_players");
let expenseAmount = document.getElementById("inputAmount");
let inputSelect = document.getElementById("input_select");
let addExpenseButton = document.getElementById("addExpense");

addPlayerButton.addEventListener("click", function () {
  addPlayer(addPlayersInput.value);
});

addExpenseButton.onclick = () => addExpense();

function addPlayer(name) {
  if (name) {
    const playerName = { name: name };
    fetch("/addPlayer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playerName),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Player added successfully");
          addPlayersInput.value = "";
          updateList();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    alert("Empty");
  }
}

function addExpense() {
  if (expenseAmount.value !== "") {
    let payer = inputSelect.value;
    let amount = parseFloat(expenseAmount.value);
    let expense = {
      payer: payer,
      amount: amount,
      others: {},
    };

    let splitAmount = amount / 4;

    // Get all player names from the inputSelect options except the payer
    for (let i = 0; i < inputSelect.options.length; i++) {
      let option = inputSelect.options[i];
      if (option.value !== payer) {
        expense.others[option.value] = splitAmount;
      }
    }

    fetch("/addExpense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Expense posted successfully");
          updateList();
          expenseAmount.value = "";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    alert("Empty");
  }
}

function updateList() {
  let expensesList = document.getElementById("expensesList");
  let playerList = document.getElementById("playerList");
  let totalExpenseSum = 0;
  let expenseCounter = 0;
  expensesList.innerHTML = "";
  playerList.innerHTML = "";
  inputSelect.innerHTML = "";
  fetch("/expenses")
    .then((response) => response.json())
    .then((data) => {
      let playerTotal = 0;
      data.forEach((data_expense) => {
        let expense = document.createElement("li");
        expense.innerHTML = `${data_expense.payer}, ${data_expense.amount}`;
        expensesList.append(expense);
        totalExpenseSum += data_expense.amount;
        expenseCounter++;
      });
      document.getElementById("totalExpense").innerHTML ="$ " + totalExpenseSum;
      document.getElementById("expenseCounter").innerHTML = `Amount of expenses: ${expenseCounter}`;
    });

    
  fetch("/players")
    .then((response) => response.json())
    .then((data) => {
      let playerNames = [];
      data.forEach((data_player) => {
        let player = document.createElement("li");
        let player_option = document.createElement("option");

        player.innerHTML = data_player.name;
        player_option.innerHTML = data_player.name;

        playerNames.push(data_player.name);

        playerList.append(player);
        inputSelect.append(player_option);
      });
      playerTotals.data.labels = playerNames;
      updateBarChart();
    });
}

let playerTotals = new Chart("playerTotals", {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: "#3498db",
        borderRadius: 10,
      },
    ],
  },
});

function updateBarChart(data) {
  playerTotals.data.datasets[0].data = data;
  playerTotals.update();
}

playerTotals.update();
updateList();
