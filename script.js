const { jsPDF } = window.jspdf; // Import jsPDF

let expenses = {};

// Helper function to format names
function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Add or update expenses
document.getElementById('addExpenseBtn').addEventListener('click', function() {
    let name = document.getElementById('name').value.trim().toLowerCase();
    let expense = parseFloat(document.getElementById('expense').value);

    if (name && !isNaN(expense)) {
        expenses[name] = (expenses[name] || 0) + expense;
        displayExpenses();

        document.getElementById('name').value = '';
        document.getElementById('expense').value = '';

        toggleVisibility('expenseSection', true);
        toggleVisibility('calculateBtn', true);
    } else {
        alert('Please enter valid details!');
    }
});

// Display the expenses with Edit and Delete buttons
function displayExpenses() {
    let expenseList = document.getElementById('expenses');
    expenseList.innerHTML = '';

    Object.keys(expenses).forEach(name => {
        let li = document.createElement('li');
        li.innerHTML = `
            ${formatName(name)}: ₹${expenses[name].toFixed(2)}
            <button class="editBtn" data-name="${name}">Edit</button>
            <button class="deleteBtn" data-name="${name}">Delete</button>
        `;
        expenseList.appendChild(li);
    });

    addEditAndDeleteHandlers();
}

// Function to handle Edit and Delete operations
function addEditAndDeleteHandlers() {
    document.querySelectorAll('.editBtn').forEach(button => {
        button.addEventListener('click', function() {
            let personName = this.getAttribute('data-name');
            let newExpense = prompt(`Enter new expense for ${formatName(personName)}`, expenses[personName]);

            if (newExpense && !isNaN(newExpense)) {
                expenses[personName] = parseFloat(newExpense);
                displayExpenses();
            }
        });
    });

    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function() {
            let personName = this.getAttribute('data-name');
            delete expenses[personName];
            displayExpenses();

            if (Object.keys(expenses).length === 0) {
                toggleVisibility('expenseSection', false);
                toggleVisibility('calculateBtn', false);
                toggleVisibility('perPersonSection', false);
                toggleVisibility('settlementSection', false);
                toggleVisibility('totalReceivedSection', false);
            }
        });
    });
}

// Calculate and display settlements
document.getElementById('calculateBtn').addEventListener('click', function() {
    let expenseEntries = Object.entries(expenses);

    if (expenseEntries.length === 0) {
        alert('No expenses added yet!');
        return;
    }

    let total = expenseEntries.reduce((sum, entry) => sum + entry[1], 0);
    let perPerson = total / expenseEntries.length;

    document.getElementById('perPersonAmount').textContent = `₹${perPerson.toFixed(2)}`;
    toggleVisibility('perPersonSection', true);

    let balances = expenseEntries.map(([name, expense]) => ({
        name,
        balance: expense - perPerson
    }));

    displaySettlements(balances);
    toggleVisibility('settlementSection', true);
    toggleVisibility('totalReceivedSection', true);
});

// Display settlements and total received
function displaySettlements(balances) {
    let settlementList = document.getElementById('settlements');
    let totalReceivedList = document.getElementById('totalReceived');
    settlementList.innerHTML = '';
    totalReceivedList.innerHTML = '';

    let creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    let debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

    let totalReceived = {};

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
        let creditor = creditors[i];
        let debtor = debtors[j];
        let amount = Math.min(creditor.balance, Math.abs(debtor.balance));

        if (amount > 0) {
            let li = document.createElement('li');
            li.textContent = `${formatName(debtor.name)} should pay ₹${amount.toFixed(2)} to ${formatName(creditor.name)}`;
            settlementList.appendChild(li);

            totalReceived[creditor.name] = (totalReceived[creditor.name] || 0) + amount;

            creditors[i].balance -= amount;
            debtors[j].balance += amount;
        }

        if (creditors[i].balance <= 0) i++;
        if (debtors[j].balance >= 0) j++;
    }

    for (let name in totalReceived) {
        let li = document.createElement('li');
        li.textContent = `${formatName(name)} will receive a total of ₹${totalReceived[name].toFixed(2)}`;
        totalReceivedList.appendChild(li);
    }
}

// Print PDF
document.getElementById('printPDFBtn').addEventListener('click', function() {
    const doc = new jsPDF({
        unit: 'mm',
        format: [288, 432] // width 72mm, height 135mm
    });

    const margin = 20; // 1 inch margin in mm
    const lineSpacing = 5; // Line spacing in mm
    const fontSize = 12; // Font size in pt
    const titleFontSize = 14; // Font size for titles
    const textColor = [0, 0, 0]; // Black text color
    const backgroundColor = [255, 255, 255]; // White background color

    // Set page background color
    doc.setFillColor(...backgroundColor);
    doc.rect(0, 0, 72, 135, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(titleFontSize);
    doc.setFont('Times New Roman', 'bold');

    // Title
    doc.text('Expense Manager Report', margin, margin + titleFontSize);
    let yOffset = margin + titleFontSize + lineSpacing;

    // Section 1: Expenses
    doc.setFontSize(titleFontSize);
    doc.text('Expenses:', margin, yOffset);
    yOffset += lineSpacing;

    doc.setFontSize(fontSize);
    let expenseListItems = document.querySelectorAll('#expenses li');
    expenseListItems.forEach((item) => {
        const text = item.textContent.replace(/Edit|Delete/g, '').trim();
        doc.text(text, margin, yOffset);
        yOffset += lineSpacing;
    });

    // Section 2: Per Person Amount
    doc.setFontSize(titleFontSize);
    doc.text('Per Person Amount:', margin, yOffset);
    yOffset += lineSpacing;

    doc.setFontSize(fontSize);
    let perPersonAmount = document.getElementById('perPersonAmount').textContent.trim();
    doc.text(perPersonAmount, margin, yOffset);
    yOffset += lineSpacing;

    // Section 3: Settlements
    doc.setFontSize(titleFontSize);
    doc.text('Settlements:', margin, yOffset);
    yOffset += lineSpacing;

    doc.setFontSize(fontSize);
    let settlementItems = document.querySelectorAll('#settlements li');
    settlementItems.forEach((item) => {
        doc.text(item.textContent.trim(), margin, yOffset);
        yOffset += lineSpacing;
    });

    // Section 4: Total Received
    doc.setFontSize(titleFontSize);
    doc.text('Total Received:', margin, yOffset);
    yOffset += lineSpacing;

    doc.setFontSize(fontSize);
    let totalReceivedItems = document.querySelectorAll('#totalReceived li');
    totalReceivedItems.forEach((item) => {
        doc.text(item.textContent.trim(), margin, yOffset);
        yOffset += lineSpacing;
    });

    // Save the PDF
    doc.save('expense-report.pdf');
});

// Clear all data
document.getElementById('clearDataBtn').addEventListener('click', function() {
    expenses = {}; // Clear the expenses data
    displayExpenses(); // Update the display to show no expenses
    displaySettlements([]); // Clear settlements display

    // Clear the input fields and hide sections
    document.getElementById('name').value = '';
    document.getElementById('expense').value = '';
    toggleVisibility('expenseSection', false);
    toggleVisibility('settlementSection', false);
    toggleVisibility('totalReceivedSection', false);
    toggleVisibility('perPersonSection', false);
});

// Utility function to toggle element visibility
function toggleVisibility(id, show) {
    document.getElementById(id).style.display = show ? 'block' : 'none';
}
