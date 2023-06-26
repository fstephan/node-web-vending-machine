const vendingMachineNameEl = document.getElementById("vending-machine-name");
const vendingMachineSlotsEl = document.getElementById("vending-machine-slots");
const vendingMachineSaveButton = document.getElementById("vending-machine-save");
const pathname = window.location.pathname;
let vendingMachineId = window.location.pathname.split('/')[2]

vendingMachineSaveButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = e.target.form.name.value;
    const numSlots = e.target.form.numSlots.value;
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('numSlots', numSlots);
    if (vendingMachineId!=='admin') {
        const response = await fetch(`/machines/${vendingMachineId}/`, {
            method: 'PATCH', body: params,
        });
    }
    else {
        const response = await fetch(`/machines/`, {
            method: 'POST', body: params,
        });
        const data = await response.json();
        vendingMachineId=data.id;
    }
    window.location.pathname = `machines/${vendingMachineId}/admin`;
});

const slotSaveEl = document.querySelectorAll("button[name='slot-save']");
for (let index = 0; index < slotSaveEl.length; index++) {
    slotSaveEl[index].addEventListener("click", async (e) => {
        e.preventDefault();
        const slotNo = index + 1;
        const name = e.target.form.slotName[index].value;
        const price = e.target.form.slotPrice[index].value;
        const params = new URLSearchParams();
        params.append('slotNo', slotNo);
        params.append('name', name);
        params.append('price', price);
        const response = await fetch(`/machines/${vendingMachineId}/slots`, {
            method: 'PATCH', body: params,
        });
    });
}

const stockEl = document.querySelectorAll("button[name='stock']");
for (let index = 0; index < stockEl.length; index++) {
    stockEl[index].addEventListener("click", async (e) => {
        e.preventDefault();
        const slotNo = index + 1;
        const name = e.target.form.slotName[index].value;
        const quantity = 10;
        const params = new URLSearchParams();
        params.append('slotNo', slotNo);
        params.append('name', name);
        params.append('quantity', quantity);
        const response = await fetch(`/machines/${vendingMachineId}/products`, {
            method: 'PATCH', body: params,
        });
    });
}

document.getElementById("cashout").addEventListener("click", async (e) => {
    e.preventDefault();
    const response = await fetch(`/machines/${vendingMachineId}/cash`, {
        method: 'PATCH'
    });
    const data = await response.json();
    const cash = `${data.cash.fives}Five Dollars, ${data.cash.ones}Dollars, ${data.cash.quarters}Q, ${data.cash.dimes}D, ${data.cash.nickels}N`;
    document.getElementById("cash-amount").innerHTML = cash;
    document.getElementById("quarters").value = 0;
    document.getElementById("dimes").value = 0;
    document.getElementById("nickels").value = 0;
});

document.getElementById("change-save").addEventListener("click", async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('quarters', e.target.form.quarters.value);
    params.append('dimes', e.target.form.dimes.value);
    params.append('nickels', e.target.form.nickels.value);
    const response = await fetch(`/machines/${vendingMachineId}/coins`, {
        method: 'PATCH', body: params,
    });
});

document.getElementById("retire").addEventListener("click", async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const response = await fetch(`/machines/${vendingMachineId}/`, {
        method: 'DELETE', body: params,
    });
    window.location.pathname = '/';
});
