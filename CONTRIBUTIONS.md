# Place Your Bet — Contributions & Credits

> This document records the contributions of each collaborator on the **Place Your Bet** project, a custom roulette strategy simulator built as a web application. It serves as a transparent record of who contributed what, preserving intellectual credit for both the product design vision and the technical implementation.

---

## Project Overview

**Place Your Bet** is an interactive roulette strategy testing tool that lets users load real strategies sourced from YouTube, place bets on a realistic American or European roulette table, and watch those strategies play out — either manually or through an automated Watch Mode. The application features a skeuomorphic casino aesthetic, animated wheel, sound effects, session management, and a curated library of rated strategies.

---

## User — Product Designer & Creative Director

The user served as the product designer and creative director throughout the project, providing the core concepts, UX decisions, and design direction that shaped the application. The following contributions originated from the user:

| # | Contribution | Impact |
|---|---|---|
| 1 | **Number pad / tap-to-enter keypad concept** | The foundational UX pattern for bet placement. This idea made the entire bet entry system intuitive and touch-friendly, and significantly simplified the build process. This was the original concept that set the direction for the app's interaction model. |
| 2 | **Animated roulette wheel** | Insisted on a visual spinning wheel with ball animation rather than simply displaying a result number. This decision elevated the app from a data tool to a visual experience. |
| 3 | **Watch Mode concept** | Conceived the idea of an auto-play mode where users can load a strategy and watch it execute hands-free, observing results in real time. |
| 4 | **Watch Mode exit conditions** | Defined the six exit conditions: manual stop, spin count, time limit, win goal, loss limit, and go bust — giving users full control over how long a strategy runs. |
| 5 | **Watch Mode transport controls** | Designed the pause/resume/stop/restart control scheme — inspired by the real-world scenario of needing to pause mid-run (the "wife with the groceries" use case). |
| 6 | **Watch Mode speed control with animated wheel** | Specified that the wheel should animate at every speed level, not just show results, and that speed should be user-configurable with realistic casino timing as the default (20 seconds). |
| 7 | **"Change Strategy" button naming** | Named the post-run action button "Change Strategy" instead of the initially proposed "Try Another Strategy" — cleaner, more direct language. |
| 8 | **Casino Mode with dealer voice** | Conceived the timed spin mode with a male dealer voice announcing "No more bets," adding authentic casino atmosphere. |
| 9 | **Sound toggle for discrete use** | Requested a mute button so the app can be used at a desk or in public without drawing attention. |
| 10 | **Strategy rating system (1–100 scale)** | Designed the rating framework: a 1–100 composite score based on five categories (board coverage, risk/reward balance, bankroll efficiency, recovery logic, session discipline) with plain-English descriptions. |
| 11 | **American + European table options** | Required support for both American (0 and 00) and European (single 0) roulette layouts. |
| 12 | **Visual casino chips with proper color coding** | Specified that chips should look like real casino chips with authentic denomination colors. |
| 13 | **Chip placement sound effect** | Requested the satisfying "click" sound when placing a chip on the board. |
| 14 | **Two spin modes: Relaxed and Casino** | Defined the two play styles — Relaxed (no time pressure, spin when ready) and Casino (timed countdown with dealer voice). |
| 15 | **Double confirmations on important actions** | Required confirmation dialogs before destructive actions like clearing all bets or resetting sessions. |
| 16 | **Realistic roulette ball sounds** | Rejected synthesized audio in favor of authentic-sounding ball spin, bounce, and settle sounds. |
| 17 | **Undo last bet functionality** | Requested the ability to undo the most recent bet placement. |
| 18 | **Strategy Library with YouTube timestamp links** | Required each strategy to link back to its source YouTube video at the relevant timestamp, giving proper attribution. |
| 19 | **iPad Air as primary testing device** | Established the iPad Air as the primary target device, ensuring the design prioritized that form factor. |

---

## Developer (Manus AI) — Technical Implementation & Architecture

Manus AI served as the developer, responsible for all code architecture, visual design execution, and technical implementation. The following contributions were made by the developer:

| # | Contribution | Details |
|---|---|---|
| 1 | **Full React/TypeScript application architecture** | Component structure, routing, state management patterns, and project scaffolding. |
| 2 | **Web Audio API sound engine** | Custom audio system generating ball spin physics sounds, bounce sequences, settle effects, win/loss chimes, and chip placement clicks — all synthesized in the browser. |
| 3 | **SVG roulette wheel with Framer Motion animation** | Hand-built SVG wheel with accurate number placement, color coding, and smooth CSS/Framer Motion spin animations with configurable duration. |
| 4 | **CSS Grid roulette board layout** | Pixel-accurate 3x12 grid matching real casino table layouts, with proper number ordering and color coding for both American and European variants. |
| 5 | **GameContext state management** | Centralized React Context managing bankroll, active bets, spin history, session state, loaded strategies, and Watch Mode state. |
| 6 | **Casino chip visual design** | SVG chips with radial gradients, conic stripe patterns, and denomination-accurate color schemes (white $1, red $5, green $25, black $100, purple $500). |
| 7 | **Strategy data modeling** | Structured data format for 10 curated strategies including bet definitions, progression rules, bankroll requirements, and composite ratings across five categories. |
| 8 | **Session management system** | Timer, pause/resume, exit condition checking, and session statistics tracking. |
| 9 | **Payout calculation engine** | Accurate payout logic for all bet types: straight up (35:1), split, street, corner, line, dozen, column, and even-money bets. |
| 10 | **Responsive design for iPad and desktop** | Fluid layouts optimized for iPad Air with graceful scaling to desktop viewports. |
| 11 | **Skeuomorphic "The Felt" visual design** | Complete visual identity: mahogany rail textures, green felt background, brass/gold accents, cream text, and the full casino atmosphere aesthetic. |
| 12 | **Strategy analysis and curation** | Watched and analyzed 18 YouTube roulette strategy videos, selected the top 10, and rated each across five performance categories. |
| 13 | **Dealer voice audio generation** | Generated the "No more bets" and "Place your bets" dealer voice clips for Casino Mode. |
| 14 | **Traffic light countdown timer** | Color-coded countdown timer (green → yellow → red) for Casino Mode's timed betting phase. |
| 15 | **BetKeypad component** | Technical implementation of the user's number pad concept as a reusable React component with preset amounts and custom input. |
| 16 | **Watch Mode auto-play engine** | Strategy execution engine that automatically places bets, spins, evaluates results, applies progression rules, and tracks statistics. |
| 17 | **Watch Mode bankroll chart** | Real-time SVG line chart tracking bankroll over time during Watch Mode runs. |
| 18 | **Watch Mode results screen** | Post-run summary with performance statistics, bankroll chart, and action buttons (Run Again, Change Strategy, Back to Table). |

---

## Acknowledgment

This project was a true collaboration. The user provided the product vision, UX concepts, and creative direction that defined what the application should be and how it should feel. Manus AI provided the technical execution, turning those ideas into working code. The number pad concept in particular — contributed by the user — was the breakthrough idea that made the bet placement system intuitive and set the tone for the entire application's interaction design.

---

*Document created: April 5, 2026*
*Project: Place Your Bet — Custom Roulette Strategy Simulator*
