# Doctor Dashboard

A web-based dashboard for doctors to manage patient medications and knowledge levels. This application is part of the KnowWell system, allowing doctors to monitor and update patient medication details.

## Screenshots

### Login
![Dashboard Overview](public/1.png)
*A secure authentication gateway for doctors to access the KnowWell dashboard with their credentials.*

### Dashboard Overview
![Patient Details](public/2.png)
*A comprehensive view displaying all patients' list with their basic information and action buttons for quick access to patient management.*

### Pending Request Page
![Add Patient](public/3.png)
*A centralized hub showing medication knowledge level upgrade requests from patients awaiting doctor approval or denial.*

### Add New Patient  
![Add Medications](public/4.png)
*A streamlined form interface for registering new patients with their personal information and initial medication prescriptions.*

### Edit Patient Details
![Edit Patient](public/5.png)
*A detailed editing interface allowing doctors to modify patient information, medication dosages, and knowledge levels.*

### Add New Medicines To Already Implemented Users
![Knowledge Level](public/6.png)
*A modal interface for prescribing additional medications to existing patients with customizable dosage, timing, and knowledge level settings.*

## Features

- **Patient Management**
  - View all patients
  - Add new patients
  - Update patient details
  - Delete patients

- **Medication Management**
  - Add medications to existing patients
  - Set medication dosage and timing
  - Update medication details
  - Manage knowledge levels (Basic, Intermediate, Expert)
  - Monitor pending knowledge level requests

## Tech Stack

- React + Vite
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- Shadcn UI Components

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Firebase account and project

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd doctor-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm run dev
```



## Database Structure

### Users Collection
```javascript
users/{userId}
{
  fiscalCode: string,
  secretCode: string,
  createdAt: timestamp
}
```

### Patient Medications Collection
```javascript
{patientId}/{medicationId}
{
  DrugTitle: string,
  DetailsRecap: {
    Dosage: string,
    Modality: string
  },
  DrugReference: reference,
  KnowledgeLevel: string,
  PendingRequest: {
    KnowledgeLevel: string,
    Status: string,
    Message: string
  },
  doseTime: array
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to your hosting platform of choice.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [contact information].

## Acknowledgments

- KnowWell Team
- Shadcn UI for the component library
- Firebase for the backend services
