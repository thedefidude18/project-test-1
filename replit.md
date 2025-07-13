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