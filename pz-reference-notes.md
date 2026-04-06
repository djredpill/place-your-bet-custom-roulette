# Project Zero Number Display Reference

## Two displays:
1. **Main "Last 36" grid** (`.lastnums`) — flex-wrap grid of colored number pills, max 36 numbers, in the main content area
2. **Sticky header strip** (`.sticky-last36`) — horizontal scrolling strip in the sticky header, same numbers but smaller

## Main Grid (`.lastnums`):
- `display:flex; flex-wrap:wrap; gap:4px; padding:8px`
- `background:rgba(0,0,0,0.04); border-radius:8px`
- `min-height:36px; max-height:108px; overflow:hidden`
- Each `.num`: `width:30px; height:30px; border-radius:6px; font-weight:700; font-size:12px; color:#fff`

## Sticky Strip (`.sticky-last36`):
- `display:flex; gap:3px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none`
- Each `.snum`: `min-width:22px; height:22px; border-radius:4px; font-weight:700; font-size:10px; color:#fff`

## Colors:
- Green (0, 00): `background:#16a34a`
- Red: `background:#b91c1c`
- Black: `background:#1e293b`

## Data flow:
- `state.last36` array — newest first (unshift), max 36 items
- On each spin: `state.last36.unshift(val); if(state.last36.length>36) state.last36.pop();`
- Render: iterate `state.last36`, create div with color class, append to container
