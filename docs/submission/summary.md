# Project summary: The Spengler Cup

**Team:** Eduardo Paz, Fabio García, Lucia Lavaselli.

## The problem
HC Davos reports 1.3 million unique visits in the five days of the Spengler Cup, and results and statistics are the most visited pages. Visitors read a number and leave within seconds: a table does not say why a performance mattered, and nothing gives them a reason to return tomorrow.

## What we built
The Spengler Cup app is a mobile web app (an installable PWA) that turns the tournament's data into a daily habit: collect cards, play quizzes, make predictions and learn hockey. Each morning at 08:00 a gift deck is waiting: you tear it open, reveal three image cards one by one and see yesterday's scores. Then the Today screen offers a games carousel and:

1. **Daily Challenges.** Five questions, one per category: Hockey 101, Hidden Hero (rank three players shown only by box score), Higher or Lower, Guess the Player (clues appear one at a time, fewer clues score more) and Tournament History. Every answer ends in a short "why it mattered" reveal.
2. **Predictions.** Players stake Pucks, a play currency with no cash value, on game winners, the best player and the best power play. The next morning's real result settles the bet.
3. **Cards.** Image cards (tap to flip) for players, goalies, teams, moments, rules and a Game of the Day card (available the morning after the game, so it can show the result). Cards upgrade through four tiers, each unlocking a deeper explanation; Diamond needs the card's own quiz. Completing sets pays a bonus.

## How it addresses the theme
The data is the hero. Questions, cards, markets and reveals are generated from the organizers' event data (event data with coordinates and expected-goal values for the 2025 Final), the box score and the 2025 results, plus winners back to 1923. Win-probability timelines, expected goals and goalie lines explain a game instead of listing it. The app works for someone who has seen 1,000 games or none: Hockey 101 and the rule cards teach the basics, and Hidden Hero and the Gold card backs reward the expert.

## Objectives
- Give visitors a reason to stay (a loop that takes five minutes) and a reason to come back (tomorrow's deck, an open prediction, a streak).
- Teach why performances mattered, not only what happened.
- Be launchable: static site, precomputed data, no accounts, no real money.

## Potential impact
A daily loop turns a spike of five days into repeat visits, and gives HC Davos a first-party relationship with fans: reminders, streaks and collections are all return reasons. Cards and sets are a natural base for sponsor-backed rewards and, in version 2, for social trading between fans.

## Innovation
Most tournament sites show data; most hockey games gamify it with fantasy money. We combine a come-back-tomorrow loop (a morning gift deck, streak, set bonuses) with explanation-first game mechanics, where every wrong or right answer ends in "why it mattered", and use real event data (win-probability swings, shot maps, goalie lines) as the reveal.

## What the prototype shows and does not show
The 2026 tournament has not happened, so the prototype replays the 2025 edition day by day, with a button to advance the day. Only the 2025 Final has event data; the other ten games have results, so the other days' player questions are labelled "classic final spotlight". Social features, push notifications and a backend are version 2.
