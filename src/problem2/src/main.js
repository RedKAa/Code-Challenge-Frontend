var prices = {};
var tokens = [];
var wallet = {
  eth: 10
};

const svgIcons = import.meta.glob('./assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
});

const iconMap = {};
for (const path in svgIcons) {
  const fileName = path.split('/').pop().replace('.svg', '').toLowerCase();
  const raw = svgIcons[path];
  iconMap[fileName] = normalizeSVG(raw);
}

function normalizeSVG(svgRaw, className = 'icon', width = 20, height = 20) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgRaw, 'image/svg+xml');
  const svg = svgDoc.querySelector('svg');

  if (!svg) return svgRaw; // fallback

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('class', className);

  if (!svg.hasAttribute('viewBox')) {
    const w = svg.getAttribute('width') || width;
    const h = svg.getAttribute('height') || height;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  return svg.outerHTML;
}

async function fetchPrices() {
  const res = await fetch('/prices.json');
  const data = await res.json();

  const seen = new Set();
  for (const p of data) {
    const token = p.currency.toLowerCase();
    if (!seen.has(token)) {
      seen.add(token);
      prices[token] = p.price;
    }
  }

  tokens =  Object.keys(prices).filter(token => iconMap[token]);
}

function setupTokenSelect(inputId, dropdownId, hiddenInputId, tokens, iconMap, onTokenSelected) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const iconEl = document.getElementById(`${hiddenInputId}Icon`);

  input.addEventListener('focus', () => {
    renderDropdown(tokens);
    dropdown.classList.add('show');
  });

  input.addEventListener('input', () => {
    const keyword = input.value.trim().toLowerCase();
    const filtered = tokens.filter(token => token.toLowerCase().includes(keyword));
    renderDropdown(filtered);
  });

  document.addEventListener('click', (e) => {
    if (!input.closest('.token-select').contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  function renderDropdown(filteredTokens) {
    dropdown.innerHTML = '';
    filteredTokens.forEach(token => {
      const tokenLower = token.toLowerCase();
      const iconSvg = iconMap[tokenLower] || '';
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.innerHTML = `
        <span class="icon">${iconSvg}</span>
        <span>${token}</span>
      `;
      item.addEventListener('click', () => {
        input.value = token;
        hiddenInput.value = token;
        dropdown.classList.remove('show');
        iconEl.innerHTML = iconSvg;
        onTokenSelected(token);
      });
      dropdown.appendChild(item);
    });
  }
}

function updateAmountPlaceholder() {
  const from = document.getElementById('fromToken').value.toLowerCase();
  const to = document.getElementById('toToken').value.toLowerCase();
  const input = document.getElementById('fromAmount');

  if (from && to && prices[from] && prices[to]) {
    const priceFrom = prices[from];
    const priceTo = prices[to];

    const min = (1 * priceTo) / priceFrom;
    const max = wallet[from] || 1000;

    input.placeholder = `Min: ${min.toFixed(6)}, Max: ${max.toFixed(6)}`;
    input.min = min;
    input.max = max;
  } else {
    input.placeholder = 'Enter amount';
    input.removeAttribute('min');
    input.removeAttribute('max');
  }
}


function calculate() {
  const from = document.getElementById('fromToken').value;
  const to = document.getElementById('toToken').value;
  const amount = parseFloat(document.getElementById('fromAmount').value || 0);
  const output = document.getElementById('toAmount');

  if (from && to && amount && prices[from] && prices[to]) {
    const result = (amount * prices[from]) / prices[to];
    output.value = result.toFixed(6);
  } else {
    output.value = '';
  }
}

function updateRate() {
  const from = document.getElementById('fromToken').value;
  const to = document.getElementById('toToken').value;
  const rateText = document.getElementById('rateText');
  const rateContainer = document.getElementById('rateContainer');
  const spinner = document.getElementById('spinner');
  spinner.classList.add('show');

  setTimeout(() => {
    spinner.classList.remove('show');
  }, 1000)

  if (from && to && prices[from] && prices[to]) {
    const rate = prices[from] / prices[to];
    rateText.textContent = `1 ${from.toUpperCase()} ≈ ${rate.toFixed(6)} ${to.toUpperCase()}`;
    rateContainer.classList.add('show');
  } else {
    rateContainer.classList.remove('show');
    rateText.textContent = '';
  }
}

setInterval(() => {
  updateRate();
}, 3000);

let rateInterval = null;

function handlePreviewClick() {
  const from = document.getElementById('fromToken').value;
  const to = document.getElementById('toToken').value;
  const amount = parseFloat(document.getElementById('fromAmount').value);
  const output = parseFloat(document.getElementById('toAmount').value);

  const popup = document.getElementById('previewPopup');
  const popupInfo = document.getElementById('popupInfo');
  const countdown = document.getElementById('popupCountdown');
  const confirmBtn = document.getElementById('confirmBtn');
  const closeBtn = document.getElementById('closePopupBtn');

  if (!from || !to || isNaN(amount) || amount <= 0 || !output) {
    alert('Please enter valid amount to swap.');
    return;
  }

  const min = 1 / prices[from] * prices[to];
  const max = (wallet[from] || 0);

  if (max == 0) {
    alert(`No balance for this token, please try ETH for testing.`);
    return;
  }

  if (amount > max) {
    alert(`Insufficient balance. Max available: ${max.toFixed(6)} ${from.toUpperCase()}`);
    return;
  }

  if (amount < min) {
    alert(`Minimum amount to swap from ${from.toUpperCase()} to ${to.toUpperCase()} is ${min.toFixed(6)}`);
    return;
  }

  popup.classList.remove('hidden');
  popupInfo.innerHTML = `
    Swap <strong>${amount}</strong> ${from.toUpperCase()} → <strong>${output}</strong> ${to.toUpperCase()}<br/><br/>
    <small>Rate: 1 ${from.toUpperCase()} = ${(prices[from] / prices[to]).toFixed(6)} ${to.toUpperCase()}</small><br/>
  `;
  let timeLeft = 5;
  countdown.textContent = `Rate auto update in ${timeLeft}s...`;

  if (rateInterval) clearInterval(rateInterval);

  rateInterval = setInterval(() => {
    if (timeLeft > 0) {
      countdown.textContent = `Rate auto update in ${timeLeft}s...`;
      timeLeft--;
    } else {
      timeLeft = 5;
      calculate();
      const newOutput = parseFloat(document.getElementById('toAmount').value);
      popupInfo.innerHTML = `
        Swap <strong>${amount}</strong> ${from.toUpperCase()} → <strong>${newOutput}</strong> ${to.toUpperCase()}<br/><br/>
        <small>Rate: 1 ${from.toUpperCase()} = ${(prices[from] / prices[to]).toFixed(6)} ${to.toUpperCase()}</small><br/>
      `;
    }
  }, 1000);

  confirmBtn.onclick = () => {
    clearInterval(rateInterval);
    popup.classList.add('hidden');
    alert('Transaction successful!');
  }

  closeBtn.onclick = () => {
    clearInterval(rateInterval);
    popup.classList.add('hidden');
  }
}

function handleMaxBalanceClick() {
  const fromToken = document.getElementById('fromToken').value.toLowerCase();
  if (wallet[fromToken] !== undefined) {
    document.getElementById('fromAmount').value = wallet[fromToken];
    calculate();
  } else {
    alert('No balance for this token, please try ETH for testing.');
  }
}

function handleSwapBtnClick() {
  const fromToken = document.getElementById('fromToken').value;
  const toToken = document.getElementById('toToken').value;
  if (fromToken && toToken) {
    document.getElementById('fromToken').value = toToken;
    document.getElementById('toToken').value = fromToken;
    document.getElementById('fromTokenInput').value = toToken;
    document.getElementById('toTokenInput').value = fromToken;
    document.getElementById('fromTokenIcon').innerHTML = iconMap[toToken] || '';
    document.getElementById('toTokenIcon').innerHTML = iconMap[fromToken] || '';
    document.getElementById('fromAmount').value = '';
    updateRate();
    calculate();
  }
}

async function init() {
  await fetchPrices();
  const validTokens = tokens.filter(t => iconMap[t.toLowerCase()]);
  setupTokenSelect('fromTokenInput', 'fromTokenDropdown', 'fromToken', validTokens, iconMap, () => {
    document.getElementById('fromAmount').value = '';
    updateAmountPlaceholder();
    updateRate();
    calculate();
  });
  setupTokenSelect('toTokenInput', 'toTokenDropdown', 'toToken', validTokens, iconMap, () => {
    updateRate();
    updateAmountPlaceholder();
    calculate();
  });

  document.getElementById('fromAmount').addEventListener('input', () => calculate());
  document.getElementById('previewBtn').addEventListener('click', handlePreviewClick);
  document.getElementById('maxBtn').addEventListener('click', handleMaxBalanceClick);
  document.getElementById('swapBtn').addEventListener('click', handleSwapBtnClick);
}

init();

