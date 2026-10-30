import { defineSnippets } from '../types'

export const pythonSnippets = defineSnippets('python', [
  {
    title: 'FizzBuzz',
    code: `
def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)`,
  },
  {
    title: 'Comprehensions',
    code: `
squares = [x * x for x in range(10) if x % 2 == 0]
lookup = {name: len(name) for name in ["ada", "alan"]}`,
  },
  {
    title: 'Dataclass',
    code: `
from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    items: list[str] = field(default_factory=list)

    def add(self, item: str) -> None:
        self.items.append(item)`,
  },
  {
    title: 'Reading a file',
    code: `
with open("notes.txt", encoding="utf-8") as file:
    for number, line in enumerate(file, start=1):
        if line.strip():
            print(f"{number:>3}: {line.rstrip()}")`,
  },
  {
    title: 'Word counter',
    code: `
from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
counts = Counter(text.split())
for word, count in counts.most_common(3):
    print(word, count)`,
  },
  {
    title: 'Exception handling',
    code: `
def parse_age(value):
    try:
        age = int(value)
    except ValueError:
        return None
    if not 0 <= age <= 130:
        raise ValueError(f"Unrealistic age: {age}")
    return age`,
  },
  {
    title: 'Binary search',
    code: `
def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
  },
  {
    title: 'Timing decorator',
    code: `
import time

def timed(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper`,
  },
  {
    title: 'Generator',
    code: `
def chunks(items, size):
    for start in range(0, len(items), size):
        yield items[start:start + size]

for batch in chunks(list(range(10)), 3):
    print(batch)`,
  },
  {
    title: 'Sorting records',
    code: `
students = [
    {"name": "Mia", "score": 91},
    {"name": "Leo", "score": 84},
    {"name": "Ava", "score": 97},
]
ranked = sorted(
    students, key=lambda s: s["score"], reverse=True
)
print(ranked[0]["name"])`,
  },
])
