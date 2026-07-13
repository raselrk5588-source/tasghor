# ২৯ কার্ড গেম — Premium UI/UX Design System

## 🎨 Design Overview

A luxurious, premium mobile card game interface designed specifically for Bangladeshi audiences.
Inspired by top-quality games like Ludo King, Call Break, and MPL — with an original design language.

---

## 🎨 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#060e06` | Main background |
| `--bg-secondary` | `#0a1a0d` | Card backgrounds |
| `--bg-tertiary` | `#0f2613` | Elevated surfaces |
| `--gold-primary` | `#d4a843` | Primary accent |
| `--gold-light` | `#f0d078` | Highlights & text |
| `--gold-dark` | `#a07830` | Shadows & depth |
| `--green-primary` | `#1a5c2a` | Table felt & success |
| `--green-light` | `#2a8c3e` | Online indicators |
| `--red-accent` | `#e74c3c` | Opponent colors, losses |
| `--text-primary` | `#f0ead6` | Primary text (warm white) |

### Gold Gradient
```css
background: linear-gradient(135deg, #f0d078 0%, #d4a843 30%, #a07830 70%, #d4a843 100%);
```

---

## 📐 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Bengali Text | Noto Sans Bengali | 400-900 | 11-48px |
| English Text | Outfit / Inter | 400-800 | 11-24px |
| Numbers/Scores | Outfit | 700-900 | 14-28px |
| Card Ranks | System | 900 | 12px |

---

## 📱 Screen Inventory (15 Screens)

### Core Flow
1. **স্প্ল্যাশ স্ক্রিন** — Animated golden logo, card fan, loading bar
2. **হোম স্ক্রিন** — Main menu with 4 game modes, top bar, bottom nav
3. **অনলাইন ম্যাচ** — Quick/Ranked/Classic/Tournament with matchmaking
4. **রুম তৈরি** — Private/Public room creation with game settings
5. **রুম জয়েন** — Room code input, recent rooms, friends' rooms
6. **বন্ধু আমন্ত্রণ** — Share via WhatsApp/Messenger, online friends list
7. **বট মোড** — AI difficulty: সহজ/মাঝারি/কঠিন/এক্সপার্ট
8. **লোকাল মাল্টিপ্লেয়ার** — Pass & Play, 2v2, Single Device

### Gameplay
9. **গেমপ্লে স্ক্রিন** — Full table view, 4 players, cards, bid, trump, scores

### Post-Game
10. **ম্যাচ রেজাল্ট** — Victory/defeat, rewards, rank change

### Profile & Social
11. **প্রোফাইল** — Stats, achievements, match history
12. **লিডারবোর্ড** — Global/Bangladesh/Friends/Weekly tabs

### Commerce & Settings
13. **দোকান** — Coins, Premium Pass, Avatars, Card Skins, Tables
14. **সেটিংস** — Language, Audio, Graphics, Privacy, Logout
15. **কিভাবে খেলবেন** — Illustrated tutorial in Bengali

---

## 🧩 Component Library

### Buttons
- **btn-gold** — Primary CTA with gold gradient, shimmer effect
- **btn-glass** — Glassmorphism menu buttons with icon + text + arrow
- **btn-outline** — Secondary actions with gold border
- **btn-danger** — Destructive actions (logout)

### Cards
- **glass-gold** — Primary container with gold border, blur backdrop
- **match-card** — Game mode selector with icon + info + online count
- **stat-card** — Profile stat display
- **store-item** — Shop item with icon + price

### Navigation
- **top-bar** — Avatar, name, level, coins, settings
- **bottom-nav** — 5-tab bar (Home, Leaderboard, Store, Profile, More)
- **screen-header** — Back button + title

### Form Elements
- **form-input** — Dark glass input field
- **pill-selector** — Toggle pill buttons (Best of 3/5, Points)
- **toggle** — iOS-style toggle switch
- **code-digit** — Single character input for room codes

### Game Elements
- **table-felt** — Oval green felt with wood border
- **player-seat** — Avatar with timer ring + name
- **hand-card** — Playing card with hover lift effect
- **trick-card** — Cards played in center

---

## 🗂 Generated Assets

### Screen Mockup Images
| # | Screen | File |
|---|--------|------|
| 1 | Splash Screen | `screens/01_splash.png` |
| 2 | Home Screen | `screens/02_home.png` |
| 3 | Gameplay | `screens/03_gameplay.png` |
| 4 | Online Match | `screens/04_online_match.png` |
| 5 | Profile | `screens/05_profile.png` |
| 6 | Store | `screens/06_store.png` |
| 7 | Create Room | `screens/07_create_room.png` |
| 8 | Leaderboard | `screens/08_leaderboard.png` |
| 9 | Match Result | `screens/09_result.png` |
| 10 | Settings | `screens/10_settings.png` |

### Interactive Prototype
- **[UIUX.html](file:///E:/Project24/29Card/UIUX.html)** — Full clickable prototype with all 15 screens

---

## 📏 Design Specifications

- **Grid System**: 8px base grid
- **Border Radius**: 8px (sm), 12px (md), 16px (lg), 20px (xl), 24px (2xl)
- **Shadows**: Multi-layer with gold accent glow
- **Glassmorphism**: `backdrop-filter: blur(20px)` with 0.45 opacity
- **Animations**: Smooth 300ms transitions, card fan, loading, float, spin
- **Phone Frame**: 393×852px (iPhone 14 Pro equivalent)
- **Target Resolution**: 1080×2400 (Full HD+)
