let addPlayerButton = document.getElementById("add_playerButton");
let addPlayersInput = document.getElementById("add_players");
let expenseAmount = document.getElementById("inputAmount");
let inputSelect = document.getElementById("input_select");
let addExpenseButton = document.getElementById("addExpense");
let splitPlayers = document.getElementById("splitPlayers");
let splitContainer = document.getElementById("splitContainer");
let percentageRadio = document.getElementById("percentage");
let rawRadio = document.getElementById("raw");
let expenseCategory = document.getElementById("category_select");
let expenseComment = document.getElementById("expense_comments")

let userColors = [
  "rgb(46, 204, 113)", // Green
  "rgb(52, 152, 219)", // Blue
  "rgb(230, 126, 34)", // Orange
  "rgb(231, 76, 60)", // Red
  "rgb(155, 89, 182)", // Purple
  "rgb(241, 196, 15)", // Yellow
  "rgb(52, 73, 94)", // Black
];

addPlayerButton.addEventListener("click", function () {
  addPlayer(addPlayersInput.value);
});

percentageRadio.addEventListener("change", updateSplits);
rawRadio.addEventListener("change", updateSplits);

addExpenseButton.onclick = () => addExpense();

function addPlayer(name) {
  if (name) {
    let playerName = { name: name };
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
  let sum = 0;
  let inputs = document.querySelectorAll("#splitPlayers .splitInput");
  inputs.forEach((input) => {
    sum += +input.value;
  });

  let payer = inputSelect.value;
  let amount = parseFloat(expenseAmount.value);
  let date = new Date();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let formattedDate = months[date.getMonth()] + " " + date.getDate();
  let formattedTime =
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0");

  let expense = {
    payer: payer,
    amount: amount,
    player_amounts: {},
    date: formattedDate + ", " + formattedTime,
    category: expenseCategory.value,
    comment: expenseComment.value,
  };

  if (
    (percentageRadio.checked && sum < 100.01 && sum > 99.99) ||
    (!percentageRadio.checked && sum == expenseAmount.value)
  ) {
    inputs.forEach((input, index) => {
      let option = inputSelect.options[index];
      expense.player_amounts[option.value] = percentageRadio.checked
        ? (input.value * expenseAmount.value) / 100
        : input.value;
    });

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
          expenseComment.value = "";

        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    splitContainer.style.display = "none";
  } else {
    alert(
      percentageRadio.checked
        ? "Doesn't add to 100%"
        : `Doesn't add to $${expenseAmount.value}`
    );
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
  splitPlayers.innerHTML = "";

  fetch("/expenses")
    .then((response) => response.json())
    .then((data) => {
      fetch("/players")
        .then((response) => response.json())
        .then((players) => {
          let playerNames = [];
          let playerTotals = [];
          if (data.length > 0) {
            data.forEach((data_expense, index) => {
              let expense = document.createElement("div");
              expense.setAttribute("class", "expense");
              expense.setAttribute("data-index", index);
              let expenseInnerHTML = `
            <div class="expense-inner">
              <div class="expense-front">
                <span class="expense_payer">${data_expense.payer}</span>
                <span class="expense_amount">$${data_expense.amount}</span>
              </div>
              <div class="expense-back">
                <button class="remove_expense"><i class="fa-solid fa-xmark fa-lg"></i></button>
              </div>
            </div>
            `;

              expense.innerHTML = expenseInnerHTML;

              expensesList.append(expense);

              totalExpenseSum += data_expense.amount;

              expenseCounter++;
            });
          }
          
          document.getElementById("totalExpense").innerHTML =
            "$ " + totalExpenseSum;
          document.getElementById(
            "expenseCounter"
          ).innerHTML = `Amount of expenses: ${expenseCounter}`;

          players.forEach((data_player, index) => {
            let player = document.createElement("li");
            let player_option = document.createElement("option");

            player.innerHTML = data_player.name;
            if (userColors[index]) {
              player.style.backgroundColor = userColors[index];
            } else {
              player.style.backgroundColor = "black";
            }

            player_option.innerHTML = data_player.name;

            playerNames.push(data_player.name);

            playerList.append(player);
            inputSelect.append(player_option);

            addPlayersInput.value = "";

            let playerTotal = 0;
            data.forEach((expense) => {
                if (data_player.name == expense.payer) {
                  playerTotal += expense.amount;
                }
            });
            playerTotals.push(playerTotal);
          });

          updateCharts(playerTotals, playerNames);

          // Attach event listeners for the delete buttons
          let removeButtons = document.querySelectorAll(".remove_expense");
          removeButtons.forEach((remove) => {
            remove.addEventListener("click", function () {
              let expenseElement = remove.closest(".expense");
              let expenseIndex = expenseElement.getAttribute("data-index");

              fetch(`/delete_expense/${expenseIndex}`, {
                method: "DELETE",
              }).then((response) => {
                if (response.ok) {
                  updateList();
                }
              });
            });
          });
        });
    });
}

document.getElementById("continue").onclick = () => {
  if (expenseAmount.value !== "" && expenseAmount.value > 0) {
    splitContainer.style.display = "block";
    fetch("/players")
      .then((response) => response.json())
      .then((players) => {
        splitPlayers.innerHTML = ""; // Clear previous entries
        players.forEach((player) => {
          let splitDiv = document.createElement("div");
          let initialPreview = percentageRadio.checked
            ? `$ ${(expenseAmount.value * 100) / players.length / 100}`
            : ""; // Initial preview based on radio checked state
          let innerHTML = `<span>${player.name}</span>
                <input class="splitInput" value="${100 / players.length}">
                <span class="splitLabel">${
                  percentageRadio.checked ? "%" : "$"
                }</span>
                <span class="percentagePreview">${initialPreview}</span>`;

          splitDiv.innerHTML = innerHTML;
          splitPlayers.appendChild(splitDiv);
        });

        updateSplits();
      });
  } else {
    alert("Empty or false input");
    expenseAmount.value = "";
  }
};

function updateSplits() {
  let labels = document.querySelectorAll("#splitPlayers .splitLabel");
  let percentagePreviews = document.querySelectorAll(".percentagePreview");
  let inputs = document.querySelectorAll("#splitPlayers .splitInput");
  let splitSumSpan = document.getElementById("splitSum");
  let splitSum = 0;

  labels.forEach((label) => {
    label.textContent = percentageRadio.checked ? "%" : "$";
  });

  inputs.forEach((input, index) => {
    input.value = percentageRadio.checked
      ? (100 / splitPlayers.children.length).toFixed(2)
      : (expenseAmount.value / splitPlayers.children.length).toFixed(2);

    splitSum += +input.value;

    // Update percentage preview immediately based on initial values
    if (percentageRadio.checked) {
      percentagePreviews[index].innerHTML = `$ ${
        ((input.value * expenseAmount.value) / 100).toFixed(2)
      }`;
    } else {
      percentagePreviews[index].innerHTML = ""; // Clear if input or totalExpense is not a number
    }

    // Add event listener to update percentage preview and splitSum on input change
    input.addEventListener("input", function () {
      // Update splitSum with the changed input value
      splitSum = 0;
      inputs.forEach((input, index) => {
        splitSum += +input.value;
        if (percentageRadio.checked) {
          percentagePreviews[index].innerHTML = `$ ${
            ((input.value * expenseAmount.value) / 100).toFixed(2)
          }`;
        } else {
          percentagePreviews[index].innerHTML = ""; // Clear if input or totalExpense is not a number
        }
      });
      // Update splitSum display
      splitSumSpan.innerHTML = percentageRadio.checked
        ? splitSum.toFixed(1) + "%"
        : "$" + (expenseAmount.value - splitSum).toFixed(2) * -1;
    });
  });

  // Initial display of splitSum
  splitSumSpan.innerHTML = percentageRadio.checked
    ? splitSum.toFixed(1) + "%"
    : "$" + (expenseAmount.value - splitSum).toFixed(2);
}

let playerTotalsBarChart = new Chart("playerTotals", {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: userColors,
        borderRadius: 10,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        display: true,
        grid: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return value + " $";
          },
        },
      },
    },
  },
});

let playerTotalsDoughnutChart = new Chart("playerDoughnuts", {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: userColors,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    borderWidth: 4,
    borderRadius: 15,
    onHover: { mode: null },
    cutout: 90,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$ " + value;
          },
        },
        labels: {
          display: false,
        },
      },
      legend: {
        display: false,
      },
    },
  },

});

let categoriesDoughnutChart = new Chart("categoriesDoughnuts", {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: userColors,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    borderWidth: 4,
    borderRadius: 15,
    onHover: { mode: null },
    cutout: 90,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$ " + value;
          },
        },
        labels: {
          display: false,
        },
      },
      legend: {
        display: false,
      },
    },
  },

});

function updateCharts(totals, names) {
  playerTotalsBarChart.data.datasets[0].data = totals;
  playerTotalsBarChart.data.labels = names;

  playerTotalsDoughnutChart.data.datasets[0].data = totals;
  playerTotalsDoughnutChart.data.labels = names;

  playerTotalsDoughnutChart.update();
  playerTotalsBarChart.update();
}

playerTotalsBarChart.update();
updateList();
updateSplits();
