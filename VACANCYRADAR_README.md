# VacancyRadar - Landlord Web Dashboard

A comprehensive property management dashboard for landlords to manage properties, units, applications, leases, and tenants.

## Features Implemented

###  Authentication & Account Management
- Login page with email/password
- Registration page
- Password reset functionality
- Protected routes
- User profile management in settings

###  Dashboard Home / Overview
- Summary cards showing:
  - Total properties
  - Total units
  - Current vacancies
  - Pending applications
  - Monthly revenue estimate
- Recent activity feed
- Vacant units list
- Pending applications preview

###  Property Management
- **Property List View**: Grid of all properties with photos, search, and filters
- **Add/Edit Property**: Complete form with address, amenities, contact info
- **Property Detail View**: Full property overview with units list and statistics

###  Unit Management
- **Unit List View**: All units with filtering by status (vacant/occupied/vacating)
- **Add/Edit Unit**: Form for unit details, bedrooms, bathrooms, rent, etc.
- **Unit Detail View**: Complete unit information with QR code and property details

###  QR Code Management
- QR code display for each unit
- QR code download functionality
- Scan history with timestamps and user information

###  Application Management
- **Applications List**: All rental applications with search and status filters
- **Application Detail**: Complete applicant information including:
  - Personal details
  - Employment information
  - Rental history
  - Submitted documents
  - Cover letter
  - Internal notes
- Approve/Reject actions

###  Lease Management
- All leases (active, pending, expired, terminated)
- Lease details with tenant and unit information
- Signature status tracking

### Tenant Management
- Current and past tenants list
- Tenant details with lease and contact information
- Move-in/move-out date tracking

###  Analytics Dashboard
- Key metrics cards
- Occupancy trend chart
- Monthly revenue chart
- Unit status distribution pie chart
- Application volume chart
- Property performance table

###  Notifications Center
- In-app notifications for:
  - New applications
  - QR code scans
  - Lease signatures
  - Move-outs
- Mark as read functionality
- Badge count on sidebar

###  Settings
- Profile information management
- Notification preferences

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components built with Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **Notifications**: Sonner

## Getting Started

1. Login with any email/password (mock authentication)
2. Explore the dashboard features
3. Mock data is pre-populated for demonstration

## Mock Login Credentials

Since this is a frontend demo with mock authentication, you can use any email and password to login.

## Features Ready for Backend Integration

The application is structured to easily connect with your PostgreSQL backend:

- Context API for state management (ready to replace with API calls)
- All CRUD operations abstracted in context
- TypeScript interfaces defined for all data models
- Form submissions ready for API integration

## Data Models

All TypeScript interfaces are defined in `/src/types/index.ts`:
- Property
- Unit
- Application
- Lease
- Tenant
- QRScan
- Notification
- User

## Navigation

- **Dashboard**: Overview and statistics
- **Properties**: Manage all properties
- **Units**: Manage all units across properties
- **QR Codes**: View QR codes and scan history
- **Applications**: Review rental applications
- **Leases**: Manage rental agreements
- **Tenants**: View current and past tenants
- **Analytics**: Performance metrics and charts
- **Notifications**: Activity center
- **Settings**: Account preferences

## Notes

