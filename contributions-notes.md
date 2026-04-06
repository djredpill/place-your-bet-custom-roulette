# Contributions Tracking Notes
## (Raw notes — will be formatted into final document)

### User Contributions (Product Design & Creative Direction)
1. Number pad / tap-to-enter keypad concept — the foundational UX pattern that made the entire bet placement system easier to build
2. Animated roulette wheel — insisted on a visual spinning wheel, not just displaying a number
3. Watch Mode concept — auto-play strategies to test them hands-free
4. Watch Mode exit conditions — run by time, spin count, go bust, win goal, loss limit, or manual stop
5. Watch Mode transport controls — pause/resume/stop/restart ("wife with the groceries" scenario)
6. "Change Strategy" button naming — on the results screen instead of "Try Another Strategy"
7. Casino Mode with dealer voice — countdown timer with "No more bets" male dealer voice
8. Sound toggle for discrete use — mute button so you can use the app at work/desk
9. Strategy rating system — 1-100 scale based on 5 categories with plain-English descriptions
10. American + European table options
11. Visual casino chips with proper color coding
12. Chip placement sound effect
13. Two spin modes: Relaxed (no pressure) and Casino (timed countdown)
14. Double confirmations on important actions
15. Realistic roulette ball sounds (rejected synthesized version, wants authentic sounds)
16. Undo last bet functionality
17. Watch Mode speed control with animated wheel at each speed level
18. Strategy Library with YouTube timestamp links back to source videos
19. iPad Air as primary testing device
20. Number strip / casino marquee scrolling display (modeled after Project Zero's sticky-last36)
21. Entrance spin animation with sound when hitting Start Playing
22. Specified single horizontal row, no wrapping, padded from edges, overflow hidden
23. Strip placement above the betting table
24. Contributions doc should only be finalized once at the very end

### Developer Contributions (Technical Implementation & Architecture)
1. Full React/TypeScript application architecture
2. Web Audio API sound engine (ball spin physics, bounce, settle, win/loss chimes, chip place)
3. SVG roulette wheel with framer-motion animation
4. CSS Grid roulette board layout (3x12 grid matching real casino tables)
5. GameContext state management (bankroll, bets, history, sessions, strategies)
6. Casino chip visual design with radial gradients and conic stripe patterns
7. Strategy data modeling (10 strategies with ratings, bets, progression rules)
8. Session management system (timer, pause/resume, exit conditions)
9. Payout calculation engine
10. Responsive design for iPad and desktop
11. Skeuomorphic "The Felt" visual design (mahogany rail, green felt, brass accents)
12. Strategy analysis and rating of 18 YouTube strategies, selecting top 10
13. "No more bets" dealer voice audio generation
14. Traffic light countdown timer colors
15. BetKeypad reusable component (implementing user's number pad concept)
25. Streak monitor concept — adapted pattern alerts from Project Zero for side bet opportunities
26. Adjustable streak threshold (default 7, range 5-10) — user wanted flexibility
27. Noted that side bets don't conflict with strategy here (no protocol to protect like in Project Zero)
28. Haptic feedback on spin results — vibration for mobile/tablet use

### Developer Contributions (continued)
16. Streak detection engine (color, parity, dozen, column, high/low patterns)
17. StreakMonitor UI component with dismissable alerts, settings panel, gold accent design
18. triggerHaptic function with different vibration patterns for win/loss/spin/streak
