## 🗄️ Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE notion_cms;
```

2. Run the schema:
```bash
psql -U postgres -d notion_cms -f schema.sql
```

3. Configure your `.env` in the `server/` folder:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/notion_cms
JWT_SECRET=your_jwt_secret_key
```

## 🚀 Running the App

**Backend:**
```bash
cd server
npm install
node index.js
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```
