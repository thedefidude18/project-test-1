# BetChat - Social Betting Platform

## Overview

BetChat is a comprehensive real-time social betting and challenge platform that combines event prediction, peer-to-peer challenges, live chat, and gamification features. The application is built as a full-stack web application with a React frontend and Express.js backend, targeting the Nigerian market with integrated payment solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (January 2025)

✓ **Notification System Enhancement** - Added comprehensive notification preferences with toggles for email, push, challenge, event, and friend notifications in Settings page
✓ **Currency Formatting** - Updated all currency displays to use formatBalance utility (₦300k format instead of ₦300000.00)
✓ **Chat Reactions** - Enhanced message reaction badges with compact design, smooth animations, and improved hover effects
✓ **Level System** - Verified and maintained user level progression with XP tracking and visual badges
✓ **Referral System** - Confirmed functional referral code generation and tracking system
✓ **Admin Payout System** - Implemented comprehensive admin panel for managing event and challenge payouts with:
  - Event payout processing with automatic winner calculations and creator fees
  - Challenge payout system supporting challenger/challenged/draw results
  - AdminLayout component with responsive navigation sidebar
  - Three dedicated admin pages: Dashboard Overview, Event Payouts, Challenge Payouts
  - Real-time statistics and pending actions monitoring
  - Automated notification system for payout completion
✓ **ProfileCard and Notification Fixes (January 2025)** - Fixed critical display issues:
  - Fixed apiRequest function to properly parse JSON responses instead of returning Response objects
  - Updated notification messages to show actual usernames with @ symbols ("You tipped @sheri ₦678!" instead of generic text)
  - Fixed ProfileCard username display by resolving API response parsing issue
  - Updated all users with null usernames in database to use firstName or email prefix
  - Added proper error handling for notifications array filtering
  - Verified real-time notifications working correctly via Pusher for logged-in users
✓ **Challenge Form UX Improvements (January 2025)** - Enhanced challenge creation experience:
  - Simplified challenge form by removing username selection field when user is pre-selected from Users tab
  - Added dynamic dialog title showing selected user name ("Challenge @username" vs "Create New Challenge")
  - Added user profile preview card in challenge form when pre-selected
  - Implemented proper state management for pre-selected users with form reset on dialog close
  - ProfileCard challenge modal already optimized for single-user challenges
✓ **Typing Indicators & Animated Loading States (January 2025)** - Enhanced real-time user experience:
  - Added typing indicators to both event chat and challenge chat systems with WebSocket support
  - Implemented animated loading states with playful character illustrations throughout the app
  - Added AnimatedButton component for enhanced user interaction feedback
  - Updated Events and Wallet pages with PlayfulLoading components for better UX
  - Fixed date formatting issues in ChallengeChat component with proper null checks
✓ **Event Matching System Implementation (January 2025)** - Fixed FCFS matching logic:
  - Implemented proper FCFS (First Come, First Served) matching between YES and NO participants
  - YES participants are now matched with NO participants in chronological order
  - Added matchedWith field tracking to identify paired opponents
  - Updated participant status to "matched" when paired with opponent
  - Fixed missing matching logic in joinEvent function
✓ **Mobile UI Redesign & Compact Settings (January 2025)** - Enhanced mobile experience:
  - Redesigned Settings page with compact mobile layout using smaller text, reduced padding, and condensed cards
  - Added dicebear avatar integration to mobile navigation Profile menu icon with ring highlight when active
  - Implemented clean mobile design aesthetic with color-coded section icons and improved visual hierarchy
  - Hidden description text on mobile to maximize space efficiency while preserving desktop functionality
  - Added mobile-specific CSS classes for consistent compact styling across the application
  - Applied modern card design with subtle shadows and proper spacing for both mobile and desktop views
✓ **SF Pro Font Implementation (January 2025)** - Complete font system overhaul:
  - Replaced all Poppins font references with SF Pro Display/Text font family
  - Updated Tailwind CSS configuration to use Apple's SF Pro as primary font with system font fallbacks
  - Removed Google Fonts imports and implemented native system font loading for better performance
  - Applied font smoothing and kerning settings for optimal text rendering across all devices
  - Achieved consistent typography following Apple's design language for clean, modern aesthetics
✓ **Mobile Navigation & UI Improvements (January 2025)** - Enhanced mobile experience:
  - Removed mobile navigation from EventCreate page for cleaner interface
  - Removed page title from EventCreate page on mobile view
  - Hidden leaderboard page title on mobile for better space utilization
  - Removed unnecessary mobile splash screen from app initialization
  - Coin Shop redesign with cleaner, more professional appearance
  - Verified leaderboard uses real database data (users table with points, XP, level)
  - Replaced loading spinners with skeleton loading states throughout the application
✓ **Telegram Webhook & Chrome Extension (January 2025)** - Complete bidirectional integration:
  - Implemented Telegram webhook endpoint for receiving messages from Telegram groups
  - Added automatic Telegram user creation with dedicated fields (telegram_id, telegram_username, is_telegram_user)
  - Created hashtag-based message targeting system (#event123 format) for event-specific chat sync
  - Built comprehensive Chrome extension with popup interface, content scripts, and background service worker
✓ **Landing Page Complete Redesign (January 2025)** - Modern, professional landing page overhaul:
  - Complete visual redesign matching Aboard.com aesthetic with clean, professional layout
  - Added animated mascot characters (pink and orange) with smooth floating animations and decorative elements
  - Implemented modern navigation bar with Resources dropdown, pricing, sign-in, and demo booking buttons
  - Created hero section with large typography "Bring joy to your workplace" and professional product messaging
  - Built realistic laptop mockup showcasing BetChat platform interface with browser window simulation
  - Maintained full dark/light mode support with SF Pro font integration throughout
  - Added floating decorative elements (stars, sparkles) with CSS animations for visual engagement
  - Optimized responsive design for mobile and desktop with proper spacing and typography scaling
  - Extension features: balance display, notifications, event creation from web pages, Telegram sharing
  - Added support for 10+ popular websites (news, social, crypto, sports) with floating action buttons
  - Real-time message broadcasting via Pusher for seamless Telegram → BetChat synchronization
  - Comprehensive testing suite for webhook functionality with multiple scenarios
  - Complete database schema updates with new Telegram user fields
✓ **Header Duplication Fix (January 2025)** - Eliminated duplicate header issue across all pages:
  - Removed all MobileHeader component imports and usages from 10+ pages (Events, Challenges, Shop, Settings, Profile, etc.)
  - Standardized all authenticated pages to use only the main Navigation component
  - Updated landing page sign-in buttons to trigger AuthModal instead of redirect for smoother UX
  - Maintained consistent header design across the entire application

## System Architecture

### Frontend Architecture
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19 for fast development and optimized builds
- **Routing**: Wouter 3.3.5 for lightweight client-side routing
- **UI Library**: Tailwind CSS 3.4.17 with shadcn/ui component library (71+ components)
- **State Management**: TanStack Query 5.60.5 for server state management
- **Forms**: React Hook Form 7.55.0 with Zod validation
- **Real-time Communication**: WebSocket integration with Pusher-js 8.4.0
- **Animations**: Framer Motion 11.13.1
- **Icons**: Lucide React and React Icons
- **Theme**: Dark/light mode support with CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express 4.21.2
- **Database**: PostgreSQL with Drizzle ORM 0.39.1
- **Database Connection**: Neon Database serverless with connection pooling
- **Authentication**: Replit Auth with Passport.js using OpenID Connect
- **Session Management**: Express-session with PostgreSQL storage
- **Real-time**: Native WebSocket + Pusher 5.2.0 for live features
- **API**: RESTful architecture with comprehensive route definitions

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-based session management
- **User Management**: Automatic user creation and profile management
- **Security**: HTTP-only cookies with secure configuration

### Database Schema (19 Tables)
- **Core Tables**: users, sessions, events, challenges
- **Social Features**: friends, notifications, achievements
- **Financial System**: transactions, escrow, referrals
- **Real-time Features**: event_messages, challenge_messages, event_typing
- **Gamification**: user_achievements, daily_logins, leaderboards

### Real-time Features
- **Live Chat**: Event-based messaging with typing indicators
- **WebSocket Connection**: Bidirectional communication for instant updates
- **Notifications**: Real-time push notifications for user interactions
- **Activity Tracking**: Live user presence and activity monitoring

### Payment Integration
- **Provider**: Paystack for Nigerian market
- **Features**: Deposits, withdrawals, escrow system
- **Currency**: Nigerian Naira (NGN) support
- **Security**: Secure transaction handling with audit trails

## Data Flow

### Event Prediction Flow
1. Users browse available prediction events
2. Users place bets with entry fees (yes/no predictions)
3. Bets are pooled and tracked in real-time
4. Events resolve and winnings are distributed
5. Transaction history is maintained

### Challenge System Flow
1. Users create peer-to-peer challenges
2. Stake amounts are held in escrow
3. Challenge acceptance triggers active status
4. Real-time chat enables communication
5. Resolution distributes escrowed funds

### Social Features Flow
1. Friend system with requests and connections
2. Achievement system with XP and level progression
3. Leaderboards based on various metrics
4. Referral system with reward tracking
5. Notification system for all interactions

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: WebSocket constructor configuration for serverless environment
- **ORM**: Drizzle with schema-first approach

### Real-time Services
- **Pusher**: WebSocket service for real-time features
- **Configuration**: Bidirectional communication setup

### Payment Services
- **Paystack**: Nigerian payment processor
- **Integration**: Deposit/withdrawal functionality

### UI Components
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native development platform support
- **Hot Reload**: Vite development server with HMR
- **Environment Variables**: Database URL and session secrets

### Build Process
- **Frontend**: Vite build with TypeScript compilation
- **Backend**: esbuild bundling for Node.js deployment
- **Assets**: Static file serving with proper routing

### Production Considerations
- **Session Security**: Secure cookie configuration
- **Database**: Connection pooling for performance
- **WebSocket**: Proper connection handling and reconnection logic
- **Error Handling**: Comprehensive error boundaries and logging

### File Structure
- **client/**: React frontend application
- **server/**: Express.js backend with routes and database
- **shared/**: Common schema and type definitions
- **migrations/**: Database migration files
- **Configuration**: TypeScript, Tailwind, and build configurations