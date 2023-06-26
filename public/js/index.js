
const messageEl = document.querySelector("#message");
const changeAmountEl = document.querySelector("#change-amount");
const productEl = document.querySelector("#product");
const selectionEl = document.querySelector("#selection");
const billEl = document.querySelector("#bill");
const coinEl = document.querySelector("#coin");
const creditCardEl = document.querySelector("#credit-card");
const purchaseButton = document.querySelector("#purchase");
const insertCoinButton = document.querySelector("#insert-coin");
const insertBillButton = document.querySelector("#insert-bill");
const swipeButton = document.querySelector("#swipe");
const releaseChange = document.querySelector("#release-change");

/*
const todoEl = document.createElement('label');
    const containerEl = document.createElement('div');
    const checkboxEl = document.createElement('input');
    const textEl = document.createElement('a');
    const deleteEl = document.createElement('button');

    textEl.setAttribute('href', `/edit.html#${todo.id}`);
    textEl.setAttribute('class', `list-item__title`);
    checkboxEl.setAttribute('type', 'checkbox');
    checkboxEl.setAttribute('class', 'checkbox');
    todoEl.setAttribute('class', 'list-item');   
    containerEl.classList.add('list-item__container'); 
    deleteEl.classList.add('button', 'button--text'); 
    checkboxEl.checked = todo.completed;         
    textEl.textContent = todo.action;
    deleteEl.textContent = 'remove';
    */

const processResponse = (data) => {
    if (data.error) {
        messageEl.textContent = data.error;
    }
    else {
        changeAmountEl.textContent = `${data.change.quarters}Q, 
            ${data.change.dimes}D, ${data.change.nickels}N`;
        productEl.textContent = data.product;
        messageEl.textContent = data.message;
    }
}

purchaseButton.addEventListener('click', async (e) => {
    const selection = selectionEl.value - 0;
    const params = new URLSearchParams();
    params.append('selection', selection);
    const response = await fetch('/purchase?selection=' + selection, { method: 'POST', body: params });
    const data = await response.json();
    if (data.product) {
        billEl.value = '';
        coinEl.value = '';
        selectionEl.value = '';
        creditCardEl.value = '';
    }
    processResponse(data);
})

insertCoinButton.addEventListener('click', async (e) => {
    const coin = coinEl.value - 0;
    const params = new URLSearchParams();
    params.append('coin', coin);
    const response = await fetch('/payment/coin?coin=' + coin, { method: 'POST', body: params });
    const data = await response.json();
    processResponse(data);
})

insertBillButton.addEventListener('click', async (e) => {
    const bill = billEl.value - 0;
    const params = new URLSearchParams();
    params.append('bill', bill);
    const response = await fetch('/payment/bill?bill=' + bill, { method: 'POST', body: params });
    const data = await response.json();
    processResponse(data);
})

swipeButton.addEventListener('click', async (e) => {
    const creditCardNo = creditCardEl.value - 0;
    const params = new URLSearchParams();
    params.append('creditCardNo', creditCardNo);
    const response = await fetch('/payment/credit?creditCardNo=' + creditCardNo, { method: 'POST', body: params });
    const data = await response.json();
    processResponse(data);
})

releaseChange.addEventListener('click', async (e) => {
    const response = await fetch('/change', { method: 'POST' });
    const data = await response.json();
    billEl.value = '';
    coinEl.value = '';
    selectionEl.value = '';
    creditCardEl.value = '';
    processResponse(data);
})



