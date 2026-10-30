import { defineSnippets } from '../types'

export const javascriptSnippets = defineSnippets('javascript', [
  {
    title: 'Debounce helper',
    code: `
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
  },
  {
    title: 'Fetch with error handling',
    code: `
async function getUser(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) {
    throw new Error(\`Request failed: \${response.status}\`);
  }
  return response.json();
}`,
  },
  {
    title: 'Array pipeline',
    code: `
const total = cart
  .filter((item) => item.inStock)
  .map((item) => item.price * item.quantity)
  .reduce((sum, value) => sum + value, 0);`,
  },
  {
    title: 'Class with private field',
    code: `
class Counter {
  #count = 0;

  increment(step = 1) {
    this.#count += step;
    return this;
  }

  get value() {
    return this.#count;
  }
}`,
  },
  {
    title: 'Group by key',
    code: `
function groupBy(list, key) {
  return list.reduce((groups, item) => {
    const name = item[key];
    (groups[name] ||= []).push(item);
    return groups;
  }, {});
}`,
  },
  {
    title: 'Event listener',
    code: `
const button = document.querySelector("#save");
button.addEventListener("click", (event) => {
  event.preventDefault();
  button.disabled = true;
  saveDraft().finally(() => (button.disabled = false));
});`,
  },
  {
    title: 'Destructuring',
    code: `
const { name, age = 18, ...rest } = profile;
const [first, , third] = scores;
console.log(\`\${name} is \${age} years old\`);`,
  },
  {
    title: 'Memoized Fibonacci',
    code: `
const memo = new Map();

function fib(n) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fib(n - 1) + fib(n - 2);
  memo.set(n, result);
  return result;
}`,
  },
  {
    title: 'Promise with timeout',
    code: `
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );

const results = await Promise.race([
  Promise.all(urls.map((url) => fetch(url))),
  timeout(5000),
]);`,
  },
  {
    title: 'Storage wrapper',
    code: `
export const storage = {
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};`,
  },
])
