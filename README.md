# 🏛️ UCA Perfume — Dynamic Luxury Fragrance Encyclopedia & Olfactory Consultant

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> 🔗 **Live Interactive Demo:** https://ucaperfume.vercel.app

UCA Perfume is an end-to-end, full-stack luxury perfume encyclopedia, personal collection manager, and algorithmic scent consultant built for fragrance connoisseurs. It features a custom-built, autonomous relational database mapping multi-layered fragrance pyramids, dual-language capabilities (EN/TR), dynamic user wardrobe management, and an intelligent recommendation engine.

---

# 🖼️ Application Overview & Screenshots

## 1. Hero & Discovery Engine (Main View)

![Main View Showcase](./public/screenshots/hero-main.png)

### Features

- **Fluid Dark Theme Interface**
  - Designed with a luxury-inspired dark aesthetic featuring glassmorphic UI components.

- **Instant Scent Search & Filtering**
  - Real-time filtering by:
    - Brand
    - Concentration (EDP, EDT, Extrait)
    - Gender
    - Fragrance Family

---

## 2. Algorithmic Scent Consultant

### Questionnaire

![Scent Consultant Questionnaire](./public/screenshots/consultant-form.png)

### Recommendation Result

![Scent Consultant Prescription Result](./public/screenshots/consultant-result.png)

### Features

- **Diagnostic Matching Algorithm**

Users complete a guided questionnaire including:

- Season / Occasion
- Gender
- Concentration
- Desired Projection & Longevity
- Outfit / Style Preference

- **Recommendation Engine**

Generates:

- Primary Match Percentage
- Alternative Recommendations
- Localized (EN/TR) fragrance descriptions
- Complete Top / Heart / Base note pyramid

---

## 3. Perfume Details & Olfactory Pyramid

![Perfume Details](./public/screenshots/perfume-details.png)

### Features

#### Evaporation Timeline

Displays fragrance evolution:

- 🍋 Top Notes
- 🌸 Heart Notes
- 🌲 Base Notes

#### Mobile Optimization

On mobile devices the application navigates directly to the detail page instead of opening nested modals.

---

## 4. Personal Wardrobe & Collection Management

![Wardrobe](./public/screenshots/profile-wardrobe.png)

### Features

- One-click wardrobe management
- Favorites system
- Custom perfume lists
- Public / Private collections
- Real-time profile statistics

---

## 5. Responsive Mobile Experience

![Responsive Layout](./public/screenshots/mobile-responsive.png)

### Features

- Mobile-first responsive layout
- Horizontal overflow prevention
- Drawer navigation
- Touch-optimized interactions

---

# 🗄️ Database Architecture

## Entity Relationship Diagram (ERD)

![Database Schema](./public/screenshots/database-schema.png)

### Architecture Highlights

- Relational schema for perfumes, wardrobes, favorites, and collections
- Separate NOTE_SET entities for fragrance pyramids
- Dual-language support without duplicated catalog entries
- Optimized relational queries

### Database Features

- Dual-language fields (EN/TR)
- Foreign key constraints
- Cascading deletes
- Prisma relational modeling
- Seeded fragrance pyramid structure

---

# 🛠️ Feature Matrix

| Category | Feature | Description |
|----------|----------|-------------|
| Catalog | Dynamic Search | Search by perfume name, brand, and notes |
| Catalog | Advanced Filters | Gender and concentration filters |
| Consultant | Match Algorithm | Personalized scoring engine |
| Consultant | Alternative Suggestions | Multiple recommendation cards |
| User | Wardrobe | Add/remove perfumes instantly |
| User | Favorites | Favorite management |
| User | Custom Lists | Public & private collections |
| Localization | EN / TR | Dynamic language switching |
| UI | Responsive Layout | Mobile-first design |
| UI | Drawer Navigation | Optimized mobile navigation |

---

# 💻 Tech Stack

## Frontend

- Next.js (App Router)
- React 18
- TypeScript

## Styling

- Tailwind CSS
- Framer Motion
- Lucide Icons

## Backend

- Prisma ORM
- MySQL

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Database | Railway |

---

# 🚀 Local Development

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/uca-perfume.git
cd uca-perfume
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file in the project root.

```env
DATABASE_URL="mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/uca_perfume_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4. Synchronize the database

```bash
npx prisma db push
```

(Optional)

```bash
npx prisma generate
```

---

## 5. Start the development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 👨‍💻 Author

**Designed, engineered, and deployed by**

**Umut Can Aşcı**

**Project:** UCA Perfume
