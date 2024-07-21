let addPlayerButton = document.getElementById("add_playerButton");
let addPlayersInput = document.getElementById("add_players");
let expenseAmount = document.getElementById("inputAmount");
let addExpenseButton = document.getElementById("addExpense");
let splitPlayers = document.getElementById("splitPlayers");
let splitContainer = document.getElementById("splitContainer");
let percentageRadio = document.getElementById("percentage");
let rawRadio = document.getElementById("raw");
let expenseCategory = document.getElementById("category_select");
let categories = document.querySelectorAll(".category");

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

document.getElementById("continue").onclick = () => continueExpense();

expenseAmount.addEventListener("keypress", function (event) {
  if (event.key == "Enter") {
    continueExpense();
  }
});

document.querySelectorAll(".nav").forEach((button) => {
  let content = button.getAttribute("name");
  button.addEventListener("click", function () {
    document.querySelectorAll(".page_content").forEach((page) => {
      page.style.display = "none";
    });
    document.querySelector(".page_content." + content).style.display = "flex";
  });
});

categories.forEach((cat) => {
  cat.addEventListener("click", function () {
    categories.forEach((item) => {
      item.classList.remove("active");
    });

    cat.classList.add("active");
  });
});

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

  let payer = document.querySelector(".player.active").innerHTML;
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
    category: document.querySelector(".category.active").value,
  };

  if (
    (percentageRadio.checked && sum < 100.01 && sum > 99.99) ||
    (!percentageRadio.checked && sum == expenseAmount.value)
  ) {
    inputs.forEach((input, index) => {
      let payer = document.querySelector(".player.active").innerHTML;
      let other =
        document.getElementById("playerList").children[index].innerHTML;
      if (other !== payer) {
        expense.player_amounts[other] = percentageRadio.checked
          ? (input.value * expenseAmount.value) / 100
          : input.value;
      }
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
          updateList();
          createTab(payer, expense.player_amounts);
          expenseAmount.value = "";
          categories.forEach((item) => {
            item.classList.remove("active");
          });
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
  splitPlayers.innerHTML = "";

  fetch("/expenses")
    .then((response) => response.json())
    .then((data) => {
      fetch("/players")
        .then((response) => response.json())
        .then((players) => {
          let playerNames = [];
          let playerTotals = [];
          let categoryTotals = {};
          let categories = new Set();

          players.forEach((data_player, index) => {
            let player = document.createElement("div");
            player.setAttribute("class", "player");

            player.innerHTML = data_player.name;
            if (userColors[index]) {
              player.style.backgroundColor = userColors[index];
            } else {
              player.style.backgroundColor = "black";
            }

            playerNames.push(data_player.name);

            playerList.append(player);

            addPlayersInput.value = "";

            let playerTotal = 0;
            data.forEach((expense) => {
              if (data_player.name == expense.payer) {
                playerTotal += expense.amount;
              }
            });
            playerTotals.push(playerTotal);
          });

          if (data.length > 0) {
            let color = "";
            data.forEach((data_expense, index) => {
              playerNames.forEach((player, color_index) => {
                if (data_expense.payer == player) {
                  color = userColors[color_index];
                }
              });

              let expense = document.createElement("div");
              expense.setAttribute("class", "expense");
              expense.setAttribute("data-index", index);
              let expenseInnerHTML = `
            <div class="expense-inner">
              <div class="expense-front" style="background-color: ${color}">${data_expense.payer}
                <span class="expense_payer" </span>
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

              if (!categoryTotals[data_expense.category]) {
                categoryTotals[data_expense.category] = 0;
              }
              categoryTotals[data_expense.category] += data_expense.amount;
              categories.add(data_expense.category);
            });
          }

          // Attach event listeners for the delete buttons
          let removeButtons = document.querySelectorAll(".remove_expense");
          removeButtons.forEach((remove) => {
            remove.addEventListener("click", function () {
              let expenseElement = remove.closest(".expense");
              let expenseIndex = expenseElement.getAttribute("data-index");

              removeExpense(expenseIndex);
            });
          });

          document.getElementById("totalExpense").innerHTML =
            "$" + totalExpenseSum;
          document.getElementById(
            "expenseCounter"
          ).innerHTML = `Amount of expenses: ${expenseCounter}`;

          let playerElements = document.querySelectorAll(".player");
          playerElements.forEach((player) => {
            player.addEventListener("click", function () {
              playerElements.forEach((item) => {
                item.classList.remove("active");
              });

              player.classList.add("active");
            });
          });

          updateCharts(playerTotals, playerNames);
          updateCategories(
            Object.values(categoryTotals),
            Array.from(categories)
          );
        });
    });
}

function continueExpense() {
  if (expenseAmount.value > 0) {
    if (document.querySelector(".category.active")) {
      splitContainer.style.display = "block";
      fetch("/players")
        .then((response) => response.json())
        .then((players) => {
          splitPlayers.innerHTML = ""; // Clear previous entries
          players.forEach((player) => {
            let splitDiv = document.createElement("div");
            let initialPreview = percentageRadio.checked
              ? `$ ${(expenseAmount.value * 100) / players.length / 100}`
              : "";
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
      alert("Choose category");
    }
  } else {
    alert("Insert amount");
    expenseAmount.value = "";
  }
}

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
      percentagePreviews[index].innerHTML = `$ ${(
        (input.value * expenseAmount.value) /
        100
      ).toFixed(2)}`;
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
          percentagePreviews[index].innerHTML = `$ ${(
            (input.value * expenseAmount.value) /
            100
          ).toFixed(2)}`;
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
        borderSkipped: false,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      y: {
        display: false,
      },
      x: {
        border: {
          display: false,
        },
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
            return "$" + value;
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
    borderRadius: 10,
    onHover: { mode: null },
    cutout: 70,
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$" + value;
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
    borderRadius: 10,
    onHover: { mode: null },
    cutout: 70,
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

function updateCharts(data, labels) {
  playerTotalsBarChart.data.datasets[0].data = data;
  playerTotalsBarChart.data.labels = labels;

  playerTotalsDoughnutChart.data.datasets[0].data = data;
  playerTotalsDoughnutChart.data.labels = labels;

  playerTotalsDoughnutChart.update();
  playerTotalsBarChart.update();
}

function updateCategories(data, labels) {
  categoriesDoughnutChart.data.datasets[0].data = data;
  categoriesDoughnutChart.data.labels = labels;

  categoriesDoughnutChart.update();
}

function createTab(payer, player_amounts) {
  let tab = {
    payer: payer,
    others: player_amounts,
  };

  fetch("/tabs")
    .then((response) => response.json())
    .then((data) => {
      let existingTabIndex = data.findIndex(
        (expense) => expense.payer === payer
      );

      if (existingTabIndex === -1) {
        fetch("/addTab", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tab),
        }).then((response) => {
          if (response.ok) {
            console.log("Tab posted successfully");
            updateTabChart();
          } else {
            console.error("Failed to post tab");
          }
        });
      } else {
        let updatedAmounts = { ...data[existingTabIndex].others };

        for (const key of Object.keys(player_amounts)) {
          if (updatedAmounts[key]) {
            updatedAmounts[key] += player_amounts[key];
          } else {
            updatedAmounts[key] = player_amounts[key];
          }
        }

        let updatedTab = {
          payer: payer,
          others: updatedAmounts,
        };

        fetch(`/data/:?index=${existingTabIndex}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTab),
        }).then((response) => {
          if (response.ok) {
            updateTabChart();
          }
        });
      }
    });
}

function updateTabChart() {
  document.getElementById("tabs_container").innerHTML = "";

  fetch("/tabs")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((tab) => {
        let tabSegment = document.createElement("div");
        tabSegment.setAttribute("class", "tab_segment");
        tabSegment.style.width = 100 / data.length + "%";

        let canvasId = `tab_${tab.payer}`;

        let tab_colors = [];

        // Fetch players and populate tab_colors before creating the chart
        fetch("/players")
          .then((response) => response.json())
          .then((players) => {
            Object.keys(tab.others).forEach((other) => {
              players.forEach((player, index) => {
                if (other == player.name) {
                  tab_colors.push(userColors[index]);
                }
              });
            });

            let tabInnerHTML = `
              <div class="tab_bar">
                <canvas id="${canvasId}" style="width: 100%; flex: 1"></canvas>
              </div>
              <span class="tab_payer">${tab.payer}</span>
              `;
            tabSegment.innerHTML = tabInnerHTML;
            document.getElementById("tabs_container").appendChild(tabSegment);

            new Chart(document.getElementById(canvasId), {
              type: "bar",
              data: {
                labels: Object.keys(tab.others),
                datasets: [
                  {
                    data: Object.values(tab.others),
                    borderSkipped: false,
                    borderRadius: 10,
                    backgroundColor: tab_colors,
                  },
                ],
              },
              options: {
                indexAxis: "y",
                scales: {
                  y: {
                    display: false,
                  },
                  x: {
                    display: false,
                    border: {
                      display: false,
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              },
            });
          });
      });
    });
}

function removeExpense(index) {
  fetch("/tabs")
    .then((response) => response.json())
    .then((tabs) => {
      fetch("/expenses")
        .then((response) => response.json())
        .then((expenses) => {
          tabs.forEach((tab, tab_index) => {
            if (tab.payer == expenses[index].payer) {
              let updatedAmounts = tabs[tab_index].others;

              for (const key of Object.keys(tabs[tab_index].others)) {
                updatedAmounts[key] =
                  updatedAmounts[key] - expenses[index].player_amounts[key];
              }

              let updatedTab = {
                payer: tab.payer,
                others: updatedAmounts,
              };

              fetch(`/data/:?index=${tab_index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTab),
              });
            }
          });
        });
      fetch(`/delete_expense/${index}`, {
        method: "DELETE",
      }).then((response) => {
        if (response.ok) {
          updateList();
          updateTabChart();
        }
      });
    });
}

playerTotalsBarChart.update();
updateList();
updateSplits();
updateTabChart();
