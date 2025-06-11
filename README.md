# RoomMate Pro

A comprehensive React Native application built with Expo for managing roommate agreements, chores, expenses, guest requests, and document signing workflows.

[![Expo](https://img.shields.io/badge/Expo-Managed-blue)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com)

## Prerequisites

- **Node.js** ≥ 18.x (or Bun ≥ 1.x as package manager)
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase CLI**: for database migrations
- **Environment Variables**: See setup instructions below

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/RoomMate-Pro.git
   cd RoomMate-Pro
   ```

2. **Install dependencies:**
   ```bash
   # With npm
   npm install
   
   # Or with Bun
   bun install
   ```

3. **Environment Configuration:**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup:**
   ```bash
   # Apply Supabase migrations
   supabase db push
   
   # Or run the provided SQL scripts manually
   ```

5. **Start Development Server:**
   ```bash
   # For mobile development
   expo start
   
   # For web development
   npm run start-web
   ```

For detailed Supabase setup and advanced configuration, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
For comprehensive environment configuration, see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md).

## Key Features

### Authentication & Authorization
- Email/password registration with confirmation email
- Persistent sessions with automatic token refresh
- Role-based access control (apartment owner vs. member)
- Secure logout and session management

### Apartment Management
- Create apartments with unique room codes (ABC-DEF format)
- Join existing apartments using room codes
- Multi-apartment support for users
- Member management with owner/member roles
- Leave apartment functionality

### Document Management & Digital Signing
- PDF document upload to Supabase Storage
- Cross-platform PDF viewing (WebView with Google Docs viewer for mobile)
- DocuSign-like digital signature workflow
- Document status tracking (pending/signed)
- Signature capture with react-native-signature-canvas simulation
- Send documents for signature via email notifications
- Modification request system with approval workflow

### Task & Chore Management
- Create and assign tasks to apartment members
- Due date tracking with visual indicators
- Recurring task support (daily, weekly, monthly)
- Task completion workflow
- Progress tracking and notifications

### Expense Tracking & Bill Splitting
- Add and categorize shared expenses
- Automatic bill splitting algorithms
- Payment tracking and settlement status
- Expense reports and analytics
- Category-based organization

### Guest Request System
- Submit overnight guest requests
- Approval/rejection workflow for apartment owners
- Calendar integration for guest stays
- Audit trail for all guest requests
- Notification system for requests

### Real-time Notifications
- In-app notification system
- Email notifications for important events
- Unread count badges
- Mark as read functionality
- Notification types (info, warning, success, error)

## Technical Architecture

### Database Schema (Supabase)
```sql
-- Core Tables
apartments (id, room_code, user_id, name, created_at)
apartment_members (id, apartment_id, user_id, role, joined_at)
documents (id, name, url, signed, apartment_id, uploader_id, created_at)
chores (id, title, description, assigned_to, due_date, completed, apartment_id)
expenses (id, title, amount, paid_by, date, category, settled, apartment_id)
guests (id, name, requested_by, arrival_date, departure_date, status, apartment_id)
notifications (id, title, message, type, read, user_id, created_at)
modification_requests (id, document_id, requested_by, reason, status, apartment_id)
```

### State Management
- **React Query**: Server state management for Supabase data
- **React Context**: Authentication and apartment state
- **AsyncStorage**: Persistent storage for auth tokens and settings

### Cross-Platform Compatibility
- **Mobile**: Native iOS and Android support via Expo
- **Web**: React Native Web with platform-specific adaptations
- **PDF Handling**: WebView with Google Docs viewer for mobile, iframe for web
- **File Operations**: Expo FileSystem for mobile, browser APIs for web

## Project Structure

```
app/
├── (auth)/              # Authentication screens
├── (tabs)/              # Main app tabs with bottom navigation
├── apartment-config/    # Apartment setup and configuration
├── notifications/       # Notifications screen
└── _layout.tsx         # Root layout with navigation

components/             # Reusable UI components
├── Button.tsx         # Custom button component
├── Card.tsx           # Card container component
├── Input.tsx          # Form input component
├── SignatureCapture.tsx # Digital signature capture
└── ...

hooks/                  # Custom React hooks
├── useAuthStore.ts    # Authentication state management
├── useSupabaseData.ts # Supabase data fetching hooks
├── usePDFSigning.ts   # PDF signing functionality
└── ...

lib/                   # External library configurations
├── supabase.ts        # Supabase client configuration
└── ...

types/                 # TypeScript type definitions
├── supabase.ts        # Database schema types
└── index.ts           # General app types

constants/             # App constants
├── colors.ts          # Color palette
└── ...
```

## Design System

### Color Palette
- **Primary**: #5D5FEF (Soft Purple)
- **Secondary**: #FFB17A (Soft Orange)
- **Background**: #FFFFFF (White)
- **Card**: #F9F9FB (Light Gray)
- **Text**: #1A1A2E (Dark Blue)
- **Text Secondary**: #666687 (Medium Gray)

### Typography
- **Headers**: 18-28px, Weight 600-700
- **Body**: 14-16px, Weight 400-500
- **Captions**: 12px, Weight 400

### Components
- **Cards**: Rounded corners (12px), subtle shadows
- **Buttons**: Multiple variants (primary, outline, ghost)
- **Icons**: Lucide React Native, 20-56px sizes
- **Inputs**: Bordered, rounded, with validation states

## Development Status

### Completed Features
- ✅ Authentication system with Supabase
- ✅ Apartment management and member system
- ✅ Document upload and PDF viewing
- ✅ Digital signature workflow (simulated)
- ✅ Notification system
- ✅ Cross-platform compatibility
- ✅ Modern UI/UX design
- ✅ TypeScript implementation
- ✅ Expense tracking system

### In Development
- 🚧 Task management implementation
- 🚧 Guest request system
- 🚧 Push notifications
- 🚧 Real PDF signing with pdf-lib
- 🚧 Advanced expense analytics

## Deployment

### Mobile Apps
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

### Web Deployment
```bash
# Build for web
expo build:web

# Deploy to Vercel/Netlify
npm run build
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Environment Variables

Required environment variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Migrations

Run the following SQL scripts in order:
1. `COMPREHENSIVE_SCHEMA_FIX.sql` - Complete database schema
2. `FINAL_SUPABASE_FIX.sql` - RLS policies and functions
3. `SUPABASE_RPC_FIX.sql` - Custom RPC functions

## Known Issues

1. **PDF Signing**: Currently simulated, requires pdf-lib integration for production
2. **Push Notifications**: Not yet implemented, requires Expo push notification setup
3. **Real-time Updates**: Basic polling implemented, consider Supabase realtime subscriptions

## Performance Optimizations

- Efficient data fetching with React Query
- Proper loading states and error handling
- Optimized re-renders with proper dependencies
- Image optimization with Expo Image
- Platform-specific code splitting

## Security Features

- Row Level Security (RLS) policies on all tables
- Secure file uploads to Supabase Storage
- Proper authentication token handling
- Input validation and sanitization
- HTTPS enforcement

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact

**Maintained by J.A.B.V Labs**
- Email: contact@jabvlabs.com
- Website: https://jabvlabs.com

## Changelog

### [1.0.0] – 2025-06-10
- Initial stable release
- Complete authentication and apartment management
- Document upload and signature workflow
- Cross-platform PDF viewing
- Expense tracking system
- Modern UI/UX implementation
- TypeScript throughout
- Comprehensive error handling