# Quiz HTML & CSS — Score & Leaderboard

## Overview
A simple single-page web quiz game built with **HTML, CSS, and vanilla JavaScript**.

Features:
- Progressive quiz flow: **Intro → Quiz → Result → Leaderboard**
- **Score** with time bonus (faster correct answers = higher points)
- **Leaderboard** using `localStorage` (best 10 results shown)
- Robust rendering to avoid broken UI (handles questions with missing/empty options)

---

## Project Structure
- `index.html`  
  The UI + embedded quiz question data (`window.QUIZ_DATA`)
- `styles.css`  
  Visual styling for the quiz, buttons, choices, and leaderboard
- `app.js`  
  Game logic: timer, answer selection, scoring, and leaderboard persistence

---

## How to Run
### Option A: Directly in the browser
1. Open `html-quiz-game/index.html` in your browser.

### Option B: Using a local server (recommended)
If you have any local static server available:
- Serve the `html-quiz-game/` folder and open `index.html`.

---

## Game Rules (Scoring)
- Correct answer:
  - Base points: **10**
  - Bonus points based on remaining time:
    - `bonus = round((timeLeft / timePerQuestionSec) * 5)`
- Wrong answer:
  - No score added

Time per question is controlled in `app.js`:
- `timePerQuestionSec` (default: **20 seconds**)

---

## Leaderboard
- Stored in `localStorage` under:
  - `htmlQuizLeaderboard_v1`
- On save:
  - If the player name already exists:
    - The entry is updated only if the new score is higher
  - Otherwise:
    - A new row is added
- The leaderboard shows the top **10** results sorted by:
  1. Highest score
  2. Most recent time (as a tie-breaker)

---

## Customizing Questions
Edit the `window.QUIZ_DATA` array in `index.html`.

Each item format:
```js
{
  q: "Question text",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answerIndex: 0, // index inside options
  type: "html" // or "css" (optional for UI)
}
```

Notes:
- If `options` is empty or missing, the app will skip that question to prevent an empty UI.

---

## Compatibility
- Uses modern JS features (`replaceAll`, optional chaining).
- RTL layout is enabled via:
  - `<html lang="ar" dir="rtl">`

If you need broader compatibility, update the escaping and optional chaining accordingly.

---

## Troubleshooting
### “No choices appear”
This is typically caused by a quiz item with missing/empty `options`.
- Ensure every question object contains a non-empty `options` array.

### Leaderboard not updating
- Confirm that the browser allows `localStorage`.
- Check the stored key: `htmlQuizLeaderboard_v1`.

---

## License
Free to use / modify.
